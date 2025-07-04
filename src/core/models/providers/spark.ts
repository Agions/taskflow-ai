/**
 * 讯飞星火模型提供商
 * 支持讯飞星火认知大模型的API调用
 */

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { Logger } from '../../../infra/logger';
import {
  ChatRequest,
  ChatResponse,
  ChineseLLMProvider,
  ChineseLLMType,
  ModelConfig,
  StreamResponse,
  ModelInfo
} from '../chinese-llm-provider';

/**
 * 讯飞星火模型列表
 */
export enum SparkModel {
  SPARK_V3_5 = 'generalv3.5',
  SPARK_V3 = 'generalv3',
  SPARK_V2 = 'generalv2',
  SPARK_V1_5 = 'general'
}

/**
 * 讯飞星火API配置
 */
export interface SparkConfig extends ModelConfig {
  appId: string;
  apiSecret: string;
  endpoint?: string;
  domain?: string;
}

/**
 * 讯飞星火提供商
 */
export class SparkProvider extends ChineseLLMProvider {
  private client: AxiosInstance;
  private sparkConfig: SparkConfig;
  private endpoint: string;
  private domain: string;

  constructor(config: SparkConfig, logger: Logger) {
    super(ChineseLLMType.XUNFEI_SPARK, config, logger);
    this.sparkConfig = config;
    this.endpoint = config.endpoint || 'https://spark-api.xf-yun.com/v3.5/chat';
    this.domain = config.domain || 'generalv3.5';

    this.client = axios.create({
      timeout: 30000
    });
  }

  /**
   * 执行聊天请求
   */
  public async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const requestData = this.buildRequestData(request);
      const headers = await this.generateAuthHeaders();

      const response = await this.client.post(this.endpoint, requestData, {
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.payload && response.data.payload.choices) {
        const choice = response.data.payload.choices.text[0];
        return {
          id: `spark-${Date.now()}`,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: this.domain,
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: choice.content
            },
            finishReason: choice.finish_reason || 'stop'
          }],
          usage: {
            promptTokens: response.data.payload.usage?.text?.prompt_tokens || 0,
            completionTokens: response.data.payload.usage?.text?.completion_tokens || 0,
            totalTokens: response.data.payload.usage?.text?.total_tokens || 0
          }
        };
      } else {
        throw new Error('Invalid response format from Spark API');
      }
    } catch (error) {
      this.logger.error('Spark API调用失败', error);
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
      // 讯飞星火使用WebSocket进行流式传输
      // 这里实现HTTP轮询的简化版本
      const response = await this.chat(request);

      // 模拟流式输出
      const content = response.choices[0].message.content;
      const chunks = content.split('');

      for (let i = 0; i < chunks.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 50));
        onData({
          id: response.id,
          object: 'chat.completion.chunk',
          created: response.created,
          model: response.model,
          choices: [{
            index: 0,
            delta: {
              content: chunks[i]
            }
          }]
        });
      }

      onData({
        id: response.id,
        object: 'chat.completion.chunk',
        created: response.created,
        model: response.model,
        choices: [{
          index: 0,
          delta: {},
          finishReason: 'stop'
        }]
      });
    } catch (error) {
      this.logger.error('Spark流式API调用失败', error);
      throw error;
    }
  }

  /**
   * 验证API密钥
   */
  public async validateApiKey(): Promise<boolean> {
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
   * 获取模型信息
   */
  public async getModelInfo(): Promise<ModelInfo> {
    return {
      name: 'Spark',
      version: 'v3.5',
      maxTokens: 8000,
      supportedFeatures: ['语音交互', '实时对话', '教育场景'],
      pricing: {
        inputTokens: 0.018,
        outputTokens: 0.018
      }
    };
  }

  /**
   * 获取支持的模型列表
   */
  public getSupportedModels(): string[] {
    return [
      'generalv3.5',
      'generalv3',
      'generalv2'
    ];
  }

  /**
   * 生成认证头
   */
  private async generateAuthHeaders(): Promise<Record<string, string>> {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomBytes(16).toString('hex');

    // 构建签名字符串
    const signString = `${this.sparkConfig.apiKey}${timestamp}${nonce}`;
    const signature = crypto
      .createHmac('sha256', this.sparkConfig.apiSecret)
      .update(signString)
      .digest('base64');

    return {
      'Authorization': `Bearer ${this.sparkConfig.apiKey}`,
      'X-Spark-Timestamp': timestamp.toString(),
      'X-Spark-Nonce': nonce,
      'X-Spark-Signature': signature,
      'X-Spark-AppId': this.sparkConfig.appId
    };
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
      header: {
        app_id: this.sparkConfig.appId,
        uid: 'user_' + Date.now()
      },
      parameter: {
        chat: {
          domain: this.domain,
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens || 2000,
          top_k: 4,
          chat_id: 'chat_' + Date.now()
        }
      },
      payload: {
        message: {
          text: messages
        }
      }
    };
  }
}
