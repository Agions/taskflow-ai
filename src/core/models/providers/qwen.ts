/**
 * 阿里通义千问模型提供商
 * 支持通义千问系列模型的API调用
 */

import axios, { AxiosInstance } from 'axios';
import { ConfigManager } from '../../../infra/config';
import { ModelType, QwenModelConfig } from '../../../types/config';
import {
  MessageRole,
  ModelCallOptions,
  ModelRequestParams,
  ModelResponse
} from '../../../types/model';
import { BaseModelAdapter } from '../adapter/base';

/**
 * 阿里通义千问模型适配器
 * 支持通义千问系列模型的API调用
 */
export class QwenModelAdapter extends BaseModelAdapter {
  private client: AxiosInstance;
  private apiKey: string;
  private endpoint: string;
  private modelVersion: string;

  constructor(configManager: ConfigManager) {
    super(ModelType.QWEN);

    const config = configManager.get<QwenModelConfig>(`models.${ModelType.QWEN}`);
    if (!config) {
      throw new Error('Qwen模型配置未找到');
    }

    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
    this.modelVersion = config.modelVersion || 'qwen-turbo';

    this.client = axios.create({
      baseURL: this.endpoint,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-SSE': 'disable'
      },
      timeout: 30000
    });
  }

  /**
   * 执行聊天请求
   */
  public async chat(params: ModelRequestParams, _options?: ModelCallOptions): Promise<ModelResponse> {
    try {
      const requestData = this.buildRequestData(params);

      const response = await this.client.post('', requestData);

      if (response.data.output && response.data.output.text) {
        return {
          content: response.data.output.text,
          usage: {
            promptTokens: response.data.usage?.input_tokens || 0,
            completionTokens: response.data.usage?.output_tokens || 0,
            totalTokens: response.data.usage?.total_tokens || 0
          },
          finishReason: response.data.output.finish_reason || 'stop'
        };
      } else {
        throw new Error('Invalid response format from Qwen API');
      }
    } catch (error) {
      this.handleRequestError(error);
    }
  }

  /**
   * 流式聊天请求
   */
  public async chatStream(
    params: ModelRequestParams,
    onData: (content: string, done: boolean) => void,
    _options?: ModelCallOptions
  ): Promise<void> {
    try {
      const requestData = {
        ...this.buildRequestData(params),
        parameters: {
          ...this.buildRequestData(params).parameters,
          incremental_output: true
        }
      };

      // 启用SSE
      const response = await this.client.post('', requestData, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-DashScope-SSE': 'enable',
          'Accept': 'text/event-stream'
        },
        responseType: 'stream'
      });

      let buffer = '';

      response.data.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onData('', true);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.output && parsed.output.text) {
                onData(parsed.output.text, false);
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      });

      response.data.on('end', () => {
        onData('', true);
      });

    } catch (error) {
      this.handleRequestError(error);
    }
  }

  /**
   * 验证API密钥
   */
  public async validateApiKey(): Promise<boolean> {
    try {
      const testParams: ModelRequestParams = {
        messages: [{ role: MessageRole.USER, content: 'Hello' }],
        maxTokens: 10
      };

      await this.chat(testParams);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 构建请求数据
   */
  private buildRequestData(params: ModelRequestParams) {
    const messages = params.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    return {
      model: this.modelVersion,
      input: {
        messages: messages
      },
      parameters: {
        max_tokens: params.maxTokens || 2000,
        temperature: params.temperature || 0.7,
        top_p: params.topP || 0.9,
        repetition_penalty: 1.1,
        result_format: 'text'
      }
    };
  }
}

/**
 * 创建通义千问模型适配器实例
 */
export function createQwenAdapter(
  configManager: ConfigManager
): QwenModelAdapter {
  return new QwenModelAdapter(configManager);
}

/**
 * 通义千问模型信息
 */
export const QWEN_MODELS = {
  'qwen-turbo': {
    name: '通义千问-Turbo',
    description: '快速响应，适合日常对话',
    maxTokens: 6000,
    costPer1kTokens: 0.002
  },
  'qwen-plus': {
    name: '通义千问-Plus',
    description: '平衡性能与成本',
    maxTokens: 30000,
    costPer1kTokens: 0.004
  },
  'qwen-max': {
    name: '通义千问-Max',
    description: '最强性能，适合复杂任务',
    maxTokens: 30000,
    costPer1kTokens: 0.02
  },
  'qwen-max-longcontext': {
    name: '通义千问-Max长文本',
    description: '支持长文本处理',
    maxTokens: 28000,
    costPer1kTokens: 0.02
  }
} as const;

export type QwenModelName = keyof typeof QWEN_MODELS;
