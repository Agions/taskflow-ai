/**
 * DeepSeek模型提供商
 * 支持DeepSeek系列模型的API调用
 */

import axios, { AxiosInstance } from 'axios';
import {
  ChineseLLMProvider,
  ChineseLLMType,
  ModelConfig,
  ChatRequest,
  ChatResponse,
  StreamResponse
} from '../chinese-llm-provider';
import { Logger } from '../../../infra/logger';

/**
 * DeepSeek模型列表
 */
export enum DeepSeekModel {
  DEEPSEEK_CHAT = 'deepseek-chat',           // DeepSeek Chat
  DEEPSEEK_CODER = 'deepseek-coder',         // DeepSeek Coder
  DEEPSEEK_V2 = 'deepseek-v2',               // DeepSeek V2
  DEEPSEEK_V2_CHAT = 'deepseek-v2-chat',     // DeepSeek V2 Chat
  DEEPSEEK_V2_CODER = 'deepseek-v2-coder',   // DeepSeek V2 Coder
}

/**
 * DeepSeek API配置
 */
export interface DeepSeekConfig extends ModelConfig {
  endpoint?: string;                          // API端点
  modelVersion?: DeepSeekModel;              // 模型版本
}

/**
 * DeepSeek API请求体
 */
interface DeepSeekRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
}

/**
 * DeepSeek API响应体
 */
interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * DeepSeek模型提供商实现
 */
export class DeepSeekProvider extends ChineseLLMProvider {
  public readonly type = ChineseLLMType.DEEPSEEK;
  public readonly name = 'DeepSeek';
  public readonly description = 'DeepSeek大模型API服务';

  private client: AxiosInstance;
  protected config: DeepSeekConfig;

  constructor(config: DeepSeekConfig, logger: Logger) {
    super(ChineseLLMType.DEEPSEEK, config, logger);

    this.config = {
      endpoint: 'https://api.deepseek.com/v1/chat/completions',
      modelVersion: DeepSeekModel.DEEPSEEK_CHAT,
      ...config
    };

    if (!this.config.apiKey) {
      throw new Error('DeepSeek API密钥未配置');
    }

    this.client = axios.create({
      baseURL: this.config.endpoint,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: this.config.timeout || 30000
    });

    this.logger.info(`DeepSeek提供商初始化完成，模型: ${this.config.modelVersion}`);
  }

  /**
   * 聊天对话
   */
  public async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const deepseekRequest: DeepSeekRequest = {
        model: this.config.modelVersion || DeepSeekModel.DEEPSEEK_CHAT,
        messages: request.messages.map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content
        })),
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 2048,
        top_p: request.topP || 0.9,
        stream: false
      };

      this.logger.debug('发送DeepSeek聊天请求', { model: deepseekRequest.model });

      const response = await this.client.post<DeepSeekResponse>('', deepseekRequest);

      if (!response.data.choices || response.data.choices.length === 0) {
        throw new Error('DeepSeek API返回空响应');
      }

      const choice = response.data.choices[0];

      return {
        id: response.data.id,
        object: response.data.object,
        created: response.data.created,
        model: response.data.model,
        choices: [{
          index: choice.index,
          message: {
            role: choice.message.role as 'assistant',
            content: choice.message.content
          },
          finishReason: choice.finish_reason
        }],
        usage: {
          promptTokens: response.data.usage.prompt_tokens,
          completionTokens: response.data.usage.completion_tokens,
          totalTokens: response.data.usage.total_tokens
        }
      };
    } catch (error) {
      this.logger.error('DeepSeek聊天请求失败', error);
      throw new Error(`DeepSeek API调用失败: ${(error as Error).message}`);
    }
  }

  /**
   * 流式聊天对话
   */
  public async chatStream(request: ChatRequest, onChunk: (chunk: StreamResponse) => void): Promise<void> {
    const deepseekRequest: DeepSeekRequest = {
      model: this.config.modelVersion || DeepSeekModel.DEEPSEEK_CHAT,
      messages: request.messages.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content
      })),
      temperature: request.temperature || 0.7,
      max_tokens: request.maxTokens || 2048,
      top_p: request.topP || 0.9,
      stream: true
    };

    this.logger.debug('发送DeepSeek流式聊天请求', { model: deepseekRequest.model });

    const response = await this.client.post('', deepseekRequest, {
      responseType: 'stream'
    });

    for await (const chunk of this.parseStreamResponse(response.data)) {
      onChunk(chunk);
    }
  }

  /**
   * 流式聊天对话（返回迭代器）
   */
  public async streamChat(request: ChatRequest): Promise<AsyncIterable<StreamResponse>> {
    const deepseekRequest: DeepSeekRequest = {
      model: this.config.modelVersion || DeepSeekModel.DEEPSEEK_CHAT,
      messages: request.messages.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content
      })),
      temperature: request.temperature || 0.7,
      max_tokens: request.maxTokens || 2048,
      top_p: request.topP || 0.9,
      stream: true
    };

    this.logger.debug('发送DeepSeek流式聊天请求', { model: deepseekRequest.model });

    const response = await this.client.post('', deepseekRequest, {
      responseType: 'stream'
    });

    return this.parseStreamResponse(response.data);
  }

  /**
   * 解析流式响应
   */
  private async *parseStreamResponse(stream: any): AsyncIterable<StreamResponse> {
    let buffer = '';

    for await (const chunk of stream) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
              const delta = parsed.choices[0].delta;
              if (delta.content) {
                yield {
                  id: parsed.id,
                  object: parsed.object,
                  created: parsed.created,
                  model: parsed.model,
                  choices: [{
                    index: parsed.choices[0].index,
                    delta: {
                      role: delta.role,
                      content: delta.content
                    },
                    finishReason: parsed.choices[0].finish_reason
                  }]
                };
              }
            }
          } catch (error) {
            this.logger.warn('解析DeepSeek流式响应失败', { line, error });
          }
        }
      }
    }
  }

  /**
   * 验证API密钥
   */
  public async validateApiKey(): Promise<boolean> {
    try {
      const testRequest: DeepSeekRequest = {
        model: this.config.modelVersion || DeepSeekModel.DEEPSEEK_CHAT,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 1
      };

      await this.client.post('', testRequest);
      return true;
    } catch (error) {
      this.logger.error('DeepSeek API密钥验证失败', error);
      return false;
    }
  }

  /**
   * 获取支持的模型列表
   */
  public getSupportedModels(): string[] {
    return Object.values(DeepSeekModel);
  }

  /**
   * 获取模型信息
   */
  public async getModelInfo(): Promise<any> {
    return {
      provider: 'DeepSeek',
      description: 'DeepSeek大模型API服务，专注于代码生成和数学推理',
      features: ['代码生成', '数学推理', '开源友好', '高性价比'],
      models: this.getSupportedModels(),
      pricing: {
        'deepseek-chat': { input: 0.001, output: 0.002 },
        'deepseek-coder': { input: 0.001, output: 0.002 }
      },
      limits: {
        maxTokens: 32768,
        maxRequestsPerMinute: 300,
        maxRequestsPerDay: 50000
      }
    };
  }

  /**
   * 获取特定模型信息
   */
  public getSpecificModelInfo(model: string) {
    const modelInfo: Record<string, any> = {
      [DeepSeekModel.DEEPSEEK_CHAT]: {
        name: 'DeepSeek Chat',
        description: 'DeepSeek通用对话模型',
        maxTokens: 32768,
        supportsFunctions: true
      },
      [DeepSeekModel.DEEPSEEK_CODER]: {
        name: 'DeepSeek Coder',
        description: 'DeepSeek代码生成模型',
        maxTokens: 32768,
        supportsFunctions: true
      },
      [DeepSeekModel.DEEPSEEK_V2]: {
        name: 'DeepSeek V2',
        description: 'DeepSeek V2通用模型',
        maxTokens: 32768,
        supportsFunctions: true
      }
    };

    return modelInfo[model] || {
      name: model,
      description: 'DeepSeek模型',
      maxTokens: 32768,
      supportsFunctions: false
    };
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<DeepSeekConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.apiKey) {
      this.client.defaults.headers['Authorization'] = `Bearer ${newConfig.apiKey}`;
    }

    if (newConfig.endpoint) {
      this.client.defaults.baseURL = newConfig.endpoint;
    }

    this.logger.info('DeepSeek配置已更新');
  }
}
