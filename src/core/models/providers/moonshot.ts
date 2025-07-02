/**
 * 月之暗面模型提供商
 * 支持Moonshot AI系列模型的API调用
 */

import axios, { AxiosInstance } from 'axios';
import {
  ChineseLLMProvider,
  ChineseLLMType,
  ModelConfig,
  ChatRequest,
  ChatResponse,
  StreamResponse,
  ChatMessage
} from '../chinese-llm-provider';
import { Logger } from '../../../infra/logger';

/**
 * 月之暗面模型列表
 */
export enum MoonshotModel {
  MOONSHOT_V1_8K = 'moonshot-v1-8k',
  MOONSHOT_V1_32K = 'moonshot-v1-32k',
  MOONSHOT_V1_128K = 'moonshot-v1-128k'
}

/**
 * 月之暗面API配置
 */
export interface MoonshotConfig extends ModelConfig {
  endpoint?: string;
  modelVersion?: MoonshotModel;
}

/**
 * 月之暗面提供商
 */
export class MoonshotProvider extends ChineseLLMProvider {
  private client: AxiosInstance;
  private moonshotConfig: MoonshotConfig;
  private endpoint: string;
  private modelVersion: string;

  constructor(config: MoonshotConfig, logger: Logger) {
    super(ChineseLLMType.MOONSHOT, config, logger);
    this.moonshotConfig = config;
    this.endpoint = config.endpoint || 'https://api.moonshot.cn/v1';
    this.modelVersion = config.modelVersion || MoonshotModel.MOONSHOT_V1_8K;

    this.client = axios.create({
      baseURL: this.endpoint,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  /**
   * 执行聊天请求
   */
  public async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const requestData = this.buildRequestData(request);

      const response = await this.client.post('/chat/completions', requestData);

      if (response.data.choices && response.data.choices.length > 0) {
        const choice = response.data.choices[0];
        return {
          id: `moonshot-${Date.now()}`,
          content: choice.message.content,
          role: 'assistant',
          usage: {
            promptTokens: response.data.usage?.prompt_tokens || 0,
            completionTokens: response.data.usage?.completion_tokens || 0,
            totalTokens: response.data.usage?.total_tokens || 0
          },
          model: response.data.model || this.modelVersion,
          finishReason: choice.finish_reason || 'stop',
          timestamp: new Date()
        };
      } else {
        throw new Error('Invalid response format from Moonshot API');
      }
    } catch (error) {
      this.logger.error('Moonshot API调用失败', error);
      throw error;
    }
  }

  /**
   * 流式聊天请求
   */
  public async chatStream(
    request: ChatRequest,
    onData: (response: StreamResponse) => void
  ): Promise<void> {
    try {
      const requestData = {
        ...this.buildRequestData(request),
        stream: true
      };

      const response = await this.client.post('/chat/completions', requestData, {
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
              onData({
                id: `moonshot-${Date.now()}`,
                content: '',
                role: 'assistant',
                done: true,
                timestamp: new Date()
              });
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0]?.delta?.content) {
                onData({
                  id: `moonshot-${Date.now()}`,
                  content: parsed.choices[0].delta.content,
                  role: 'assistant',
                  done: false,
                  timestamp: new Date()
                });
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      });

      response.data.on('end', () => {
        onData({
          id: `moonshot-${Date.now()}`,
          content: '',
          role: 'assistant',
          done: true,
          timestamp: new Date()
        });
      });

    } catch (error) {
      this.logger.error('Moonshot流式API调用失败', error);
      throw error;
    }
  }

  /**
   * 验证配置
   */
  public async validateConfig(): Promise<boolean> {
    try {
      const testRequest: ChatRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
        maxTokens: 10
      };

      await this.chat(testRequest);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 构建请求数据
   */
  private buildRequestData(request: ChatRequest) {
    const messages = request.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    return {
      model: this.modelVersion,
      messages: messages,
      max_tokens: request.maxTokens || 2000,
      temperature: request.temperature || 0.7,
      top_p: request.topP || 0.9,
      frequency_penalty: 0,
      presence_penalty: 0,
      stream: false
    };
  }
}
