/**
 * 智谱AI模型提供商
 * 支持GLM系列模型的API调用
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
 * 智谱AI模型列表
 */
export enum ZhipuModel {
  GLM_4 = 'glm-4',                           // GLM-4
  GLM_4V = 'glm-4v',                         // GLM-4V (多模态)
  GLM_3_TURBO = 'glm-3-turbo',               // GLM-3-Turbo
  CHATGLM_6B = 'chatglm_6b',                 // ChatGLM-6B
  CHATGLM_STD = 'chatglm_std',               // ChatGLM标准版
  CHATGLM_LITE = 'chatglm_lite',             // ChatGLM轻量版
  CHATGLM_PRO = 'chatglm_pro',               // ChatGLM专业版
}

/**
 * 智谱AI API配置
 */
export interface ZhipuConfig extends ModelConfig {
  endpoint?: string;                          // API端点
  modelVersion?: ZhipuModel;                 // 模型版本
}

/**
 * 智谱AI API请求体
 */
interface ZhipuRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
  do_sample?: boolean;
}

/**
 * 智谱AI API响应体
 */
interface ZhipuResponse {
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
 * 智谱AI模型提供商实现
 */
export class ZhipuProvider extends ChineseLLMProvider {
  public readonly type = ChineseLLMType.ZHIPU_GLM;
  public readonly name = 'Zhipu AI';
  public readonly description = '智谱AI GLM系列模型API服务';

  private client: AxiosInstance;
  protected config: ZhipuConfig;

  constructor(config: ZhipuConfig, logger: Logger) {
    super(ChineseLLMType.ZHIPU_GLM, config, logger);

    this.config = {
      endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      modelVersion: ZhipuModel.GLM_4,
      ...config
    };

    if (!this.config.apiKey) {
      throw new Error('智谱AI API密钥未配置');
    }

    this.client = axios.create({
      baseURL: this.config.endpoint,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: this.config.timeout || 30000
    });

    this.logger.info(`智谱AI提供商初始化完成，模型: ${this.config.modelVersion}`);
  }

  /**
   * 聊天对话
   */
  public async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const zhipuRequest: ZhipuRequest = {
        model: this.config.modelVersion || ZhipuModel.GLM_4,
        messages: request.messages.map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content
        })),
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 2048,
        top_p: request.topP || 0.9,
        do_sample: true,
        stream: false
      };

      this.logger.debug('发送智谱AI聊天请求', { model: zhipuRequest.model });

      const response = await this.client.post<ZhipuResponse>('', zhipuRequest);

      if (!response.data.choices || response.data.choices.length === 0) {
        throw new Error('智谱AI API返回空响应');
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
      this.logger.error('智谱AI聊天请求失败', error);
      throw new Error(`智谱AI API调用失败: ${(error as Error).message}`);
    }
  }

  /**
   * 流式聊天对话
   */
  public async chatStream(request: ChatRequest, onChunk: (chunk: StreamResponse) => void): Promise<void> {
    const zhipuRequest: ZhipuRequest = {
      model: this.config.modelVersion || ZhipuModel.GLM_4,
      messages: request.messages.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content
      })),
      temperature: request.temperature || 0.7,
      max_tokens: request.maxTokens || 2048,
      top_p: request.topP || 0.9,
      do_sample: true,
      stream: true
    };

    this.logger.debug('发送智谱AI流式聊天请求', { model: zhipuRequest.model });

    const response = await this.client.post('', zhipuRequest, {
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
    const zhipuRequest: ZhipuRequest = {
      model: this.config.modelVersion || ZhipuModel.GLM_4,
      messages: request.messages.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content
      })),
      temperature: request.temperature || 0.7,
      max_tokens: request.maxTokens || 2048,
      top_p: request.topP || 0.9,
      do_sample: true,
      stream: true
    };

    this.logger.debug('发送智谱AI流式聊天请求', { model: zhipuRequest.model });

    const response = await this.client.post('', zhipuRequest, {
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
            this.logger.warn('解析智谱AI流式响应失败', { line, error });
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
      const testRequest: ZhipuRequest = {
        model: this.config.modelVersion || ZhipuModel.GLM_4,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 1
      };

      await this.client.post('', testRequest);
      return true;
    } catch (error) {
      this.logger.error('智谱AI API密钥验证失败', error);
      return false;
    }
  }

  /**
   * 获取支持的模型列表
   */
  public getSupportedModels(): string[] {
    return Object.values(ZhipuModel);
  }

  /**
   * 获取模型信息
   */
  public async getModelInfo(): Promise<any> {
    return {
      provider: '智谱AI',
      description: '智谱AI GLM系列模型，专注于代码理解、数学推理和多语言处理',
      features: ['代码理解', '数学推理', '多语言', '函数调用'],
      models: this.getSupportedModels(),
      pricing: {
        'glm-4': { input: 0.1, output: 0.1 },
        'glm-3-turbo': { input: 0.005, output: 0.005 }
      },
      limits: {
        maxTokens: 128000,
        maxRequestsPerMinute: 200,
        maxRequestsPerDay: 30000
      }
    };
  }

  /**
   * 获取特定模型信息
   */
  public getSpecificModelInfo(model: string) {
    const modelInfo: Record<string, any> = {
      [ZhipuModel.GLM_4]: {
        name: 'GLM-4',
        description: '智谱AI最新一代大模型',
        maxTokens: 128000,
        supportsFunctions: true
      },
      [ZhipuModel.GLM_4V]: {
        name: 'GLM-4V',
        description: '智谱AI多模态大模型',
        maxTokens: 128000,
        supportsFunctions: true,
        supportsVision: true
      },
      [ZhipuModel.GLM_3_TURBO]: {
        name: 'GLM-3-Turbo',
        description: '智谱AI高效对话模型',
        maxTokens: 32768,
        supportsFunctions: true
      },
      [ZhipuModel.CHATGLM_PRO]: {
        name: 'ChatGLM Pro',
        description: 'ChatGLM专业版',
        maxTokens: 32768,
        supportsFunctions: false
      }
    };

    return modelInfo[model] || {
      name: model,
      description: '智谱AI模型',
      maxTokens: 32768,
      supportsFunctions: false
    };
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<ZhipuConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.apiKey) {
      this.client.defaults.headers['Authorization'] = `Bearer ${newConfig.apiKey}`;
    }

    if (newConfig.endpoint) {
      this.client.defaults.baseURL = newConfig.endpoint;
    }

    this.logger.info('智谱AI配置已更新');
  }
}
