/**
 * 百度文心一言模型提供商
 * 支持ERNIE系列模型的API调用
 */

import axios, { AxiosInstance } from 'axios';
import {
  ChineseLLMProvider,
  ChineseLLMType,
  ModelConfig,
  ChatRequest,
  ChatResponse,
  StreamResponse,
  ModelInfo
} from '../chinese-llm-provider';
import { Logger } from '../../../infra/logger';

/**
 * 百度文心模型列表
 */
export enum BaiduWenxinModel {
  ERNIE_BOT = 'ernie-bot',                    // ERNIE-Bot
  ERNIE_BOT_TURBO = 'ernie-bot-turbo',       // ERNIE-Bot-turbo
  ERNIE_BOT_4 = 'ernie-bot-4',               // ERNIE-Bot 4.0
  ERNIE_SPEED = 'ernie-speed',               // ERNIE-Speed
  ERNIE_LITE = 'ernie-lite',                 // ERNIE-Lite
  ERNIE_TINY = 'ernie-tiny',                 // ERNIE-Tiny
  BLOOMZ_7B = 'bloomz-7b',                   // BLOOMZ-7B
  LLAMA2_7B = 'llama2-7b-chat',             // Llama-2-7b-chat
  LLAMA2_13B = 'llama2-13b-chat',           // Llama-2-13b-chat
  LLAMA2_70B = 'llama2-70b-chat',           // Llama-2-70b-chat
  QIANFAN_BLOOMZ_7B = 'qianfan-bloomz-7b-compressed', // 千帆BLOOMZ-7B
  QIANFAN_CHINESE_LLAMA2_7B = 'qianfan-chinese-llama2-7b', // 千帆中文Llama2-7B
  CHATGLM2_6B_32K = 'chatglm2-6b-32k',     // ChatGLM2-6B-32K
  AQUILACHAT_7B = 'aquilachat-7b'           // AquilaChat-7B
}

/**
 * 百度文心API响应接口
 */
interface BaiduWenxinResponse {
  id: string;
  object: string;
  created: number;
  sentence_id?: number;
  is_end: boolean;
  is_truncated: boolean;
  result: string;
  need_clear_history: boolean;
  ban_round?: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error_code?: number;
  error_msg?: string;
}

/**
 * 百度文心流式响应接口
 */
interface BaiduWenxinStreamResponse {
  id: string;
  object: string;
  created: number;
  sentence_id: number;
  is_end: boolean;
  is_truncated: boolean;
  result: string;
  need_clear_history: boolean;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * 百度文心一言提供商实现
 */
export class BaiduWenxinProvider extends ChineseLLMProvider {
  private httpClient: AxiosInstance;
  private accessToken?: string;
  private tokenExpireTime?: number;
  private readonly baseUrl = 'https://aip.baidubce.com';

  constructor(config: ModelConfig, logger: Logger) {
    super(ChineseLLMType.BAIDU_WENXIN, config, logger);
    
    this.httpClient = axios.create({
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // 设置请求拦截器
    this.httpClient.interceptors.request.use(
      async (config) => {
        await this.ensureAccessToken();
        config.params = {
          ...config.params,
          access_token: this.accessToken
        };
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 设置响应拦截器
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        this.logger.error(`百度文心API请求失败: ${this.handleApiError(error)}`);
        return Promise.reject(error);
      }
    );
  }

  /**
   * 聊天补全
   */
  public async chat(request: ChatRequest): Promise<ChatResponse> {
    return await this.withRetry(async () => {
      const model = request.model || this.config.model || BaiduWenxinModel.ERNIE_BOT_TURBO;
      const endpoint = this.getModelEndpoint(model);
      
      const requestBody = {
        messages: this.formatMessagesForBaidu(request.messages),
        temperature: request.temperature ?? this.config.temperature ?? 0.7,
        top_p: request.topP ?? this.config.topP ?? 0.9,
        max_output_tokens: request.maxTokens ?? this.config.maxTokens ?? 2048,
        stream: false,
        user_id: request.userId
      };

      this.logger.info(`发送百度文心请求: ${model}`);
      
      const response = await this.httpClient.post<BaiduWenxinResponse>(endpoint, requestBody);
      const data = response.data;

      if (data.error_code) {
        throw new Error(`百度文心API错误 ${data.error_code}: ${data.error_msg}`);
      }

      return this.formatResponse(data, model);
    }, this.config.retryCount);
  }

  /**
   * 流式聊天补全
   */
  public async chatStream(
    request: ChatRequest, 
    onChunk: (chunk: StreamResponse) => void
  ): Promise<void> {
    return await this.withRetry(async () => {
      const model = request.model || this.config.model || BaiduWenxinModel.ERNIE_BOT_TURBO;
      const endpoint = this.getModelEndpoint(model);
      
      const requestBody = {
        messages: this.formatMessagesForBaidu(request.messages),
        temperature: request.temperature ?? this.config.temperature ?? 0.7,
        top_p: request.topP ?? this.config.topP ?? 0.9,
        max_output_tokens: request.maxTokens ?? this.config.maxTokens ?? 2048,
        stream: true,
        user_id: request.userId
      };

      this.logger.info(`发送百度文心流式请求: ${model}`);

      const response = await this.httpClient.post(endpoint, requestBody, {
        responseType: 'stream'
      });

      return new Promise((resolve, reject) => {
        let buffer = '';
        
        response.data.on('data', (chunk: Buffer) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '') continue;
            
            try {
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6);
                if (jsonStr === '[DONE]') {
                  resolve();
                  return;
                }
                
                const data: BaiduWenxinStreamResponse = JSON.parse(jsonStr);
                const streamChunk = this.formatStreamResponse(data, model);
                onChunk(streamChunk);
              }
            } catch (error) {
              this.logger.warn(`解析流式响应失败: ${error}`);
            }
          }
        });

        response.data.on('end', () => {
          resolve();
        });

        response.data.on('error', (error: Error) => {
          reject(error);
        });
      });
    }, this.config.retryCount);
  }

  /**
   * 验证API密钥
   */
  public async validateApiKey(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch (error) {
      this.logger.error(`百度文心API密钥验证失败: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * 获取模型信息
   */
  public async getModelInfo(): Promise<ModelInfo> {
    return {
      name: '百度文心一言',
      version: 'ERNIE-Bot-4.0',
      maxTokens: 8192,
      supportedFeatures: ['中文优化', '函数调用', '插件系统', '知识增强'],
      pricing: {
        inputTokens: 0.012,
        outputTokens: 0.012
      }
    };
  }

  /**
   * 获取支持的模型列表
   */
  public getSupportedModels(): string[] {
    return Object.values(BaiduWenxinModel);
  }

  /**
   * 确保访问令牌有效
   */
  private async ensureAccessToken(): Promise<void> {
    if (!this.accessToken || this.isTokenExpired()) {
      await this.getAccessToken();
    }
  }

  /**
   * 获取访问令牌
   */
  private async getAccessToken(): Promise<void> {
    if (!this.config.apiKey || !this.config.secretKey) {
      throw new Error('百度文心需要API Key和Secret Key');
    }

    const tokenUrl = `${this.baseUrl}/oauth/2.0/token`;
    const params = {
      grant_type: 'client_credentials',
      client_id: this.config.apiKey,
      client_secret: this.config.secretKey
    };

    try {
      const response = await axios.post(tokenUrl, null, { params });
      const data = response.data;

      if (data.error) {
        throw new Error(`获取访问令牌失败: ${data.error_description}`);
      }

      this.accessToken = data.access_token;
      this.tokenExpireTime = Date.now() + (data.expires_in - 300) * 1000; // 提前5分钟刷新
      
      this.logger.info('百度文心访问令牌获取成功');
    } catch (error) {
      this.logger.error(`获取百度文心访问令牌失败: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * 检查令牌是否过期
   */
  private isTokenExpired(): boolean {
    return !this.tokenExpireTime || Date.now() >= this.tokenExpireTime;
  }

  /**
   * 获取模型端点
   */
  private getModelEndpoint(model: string): string {
    const endpoints: Record<string, string> = {
      [BaiduWenxinModel.ERNIE_BOT]: '/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
      [BaiduWenxinModel.ERNIE_BOT_TURBO]: '/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/eb-instant',
      [BaiduWenxinModel.ERNIE_BOT_4]: '/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro',
      [BaiduWenxinModel.ERNIE_SPEED]: '/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie_speed',
      [BaiduWenxinModel.ERNIE_LITE]: '/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie-lite-8k',
      [BaiduWenxinModel.ERNIE_TINY]: '/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie-tiny-8k',
      [BaiduWenxinModel.BLOOMZ_7B]: '/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/bloomz_7b1',
      [BaiduWenxinModel.LLAMA2_7B]: '/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/llama_2_7b',
      [BaiduWenxinModel.LLAMA2_13B]: '/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/llama_2_13b',
      [BaiduWenxinModel.LLAMA2_70B]: '/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/llama_2_70b',
      [BaiduWenxinModel.QIANFAN_BLOOMZ_7B]: '/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/qianfan_bloomz_7b_compressed',
      [BaiduWenxinModel.QIANFAN_CHINESE_LLAMA2_7B]: '/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/qianfan_chinese_llama2_7b',
      [BaiduWenxinModel.CHATGLM2_6B_32K]: '/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/chatglm2_6b_32k',
      [BaiduWenxinModel.AQUILACHAT_7B]: '/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/aquilachat_7b'
    };

    return endpoints[model] || endpoints[BaiduWenxinModel.ERNIE_BOT_TURBO];
  }

  /**
   * 格式化消息为百度文心格式
   */
  private formatMessagesForBaidu(messages: { role: string; content: string }[]): unknown[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * 格式化响应
   */
  private formatResponse(data: BaiduWenxinResponse, model: string): ChatResponse {
    return {
      id: data.id,
      object: 'chat.completion',
      created: data.created,
      model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: data.result
        },
        finishReason: data.is_end ? 'stop' : 'length'
      }],
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      }
    };
  }

  /**
   * 格式化流式响应
   */
  private formatStreamResponse(data: BaiduWenxinStreamResponse, model: string): StreamResponse {
    return {
      id: data.id,
      object: 'chat.completion.chunk',
      created: data.created,
      model,
      choices: [{
        index: 0,
        delta: {
          content: data.result
        },
        finishReason: data.is_end ? 'stop' : undefined
      }]
    };
  }
}
