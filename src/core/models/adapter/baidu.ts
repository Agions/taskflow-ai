import axios from 'axios';
import { 
  ModelCallOptions, 
  ModelRequestParams, 
  ModelResponse,
  BaiduRequestBody,
  BaiduResponseBody,
  MessageRole
} from '../../../types/model';
import { ModelType, BaiduModelConfig } from '../../../types/config';
import { BaseModelAdapter } from './base';
import { ConfigManager } from '../../../infra/config';

/**
 * 百度文心大模型适配器
 */
export class BaiduModelAdapter extends BaseModelAdapter {
  private apiKey: string;
  private secretKey: string;
  private endpoint: string;
  private accessToken: string | null = null;
  private tokenExpireTime: number = 0;
  private modelVersion: string;

  /**
   * 创建百度文心大模型适配器实例
   * @param configManager 配置管理器实例
   */
  constructor(configManager: ConfigManager) {
    super(ModelType.BAIDU);

    const config = configManager.get<BaiduModelConfig>(`models.${ModelType.BAIDU}`, {
      apiKey: '',
      secretKey: '',
      endpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/',
      modelVersion: 'ernie-bot-4',
    });

    this.apiKey = config.apiKey;
    this.secretKey = config.secretKey;
    this.endpoint = config.endpoint || 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/';
    this.modelVersion = config.modelVersion || 'ernie-bot-4';

    if (!this.apiKey || !this.secretKey) {
      throw new Error('百度文心API密钥未配置，请使用 mcp config 命令设置 model.baidu.apiKey 和 model.baidu.secretKey');
    }
  }

  /**
   * 执行聊天请求
   * @param params 请求参数
   * @param options 调用选项
   */
  public async chat(params: ModelRequestParams, options?: ModelCallOptions): Promise<ModelResponse> {
    try {
      await this.ensureAccessToken();
      
      const requestBody = this.buildRequestBody(params, options);
      const url = `${this.endpoint}${this.modelVersion}?access_token=${this.accessToken}`;
      
      const response = await axios.post<BaiduResponseBody>(url, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: options?.timeout || 30000,
      });
      
      return this.processResponse(response.data);
    } catch (error) {
      return this.handleRequestError(error);
    }
  }

  /**
   * 流式聊天请求
   * @param params 请求参数 
   * @param onData 数据回调函数
   * @param options 调用选项
   */
  public async chatStream(
    params: ModelRequestParams,
    onData: (content: string, done: boolean) => void,
    options?: ModelCallOptions
  ): Promise<void> {
    try {
      await this.ensureAccessToken();
      
      const requestBody = this.buildRequestBody(params, { ...options, stream: true });
      const url = `${this.endpoint}${this.modelVersion}?access_token=${this.accessToken}`;
      
      const response = await axios.post(url, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
        timeout: options?.timeout || 60000,
      });

      const stream = response.data;
      
      return new Promise((resolve, reject) => {
        let buffer = '';
        
        stream.on('data', (chunk: Buffer) => {
          const chunkString = chunk.toString();
          buffer += chunkString;
          
          // 处理SSE格式的响应
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.substring(6);
              try {
                const parsedData = JSON.parse(data) as BaiduResponseBody;
                onData(parsedData.result, parsedData.is_end || false);
              } catch (e) {
                // 忽略非JSON数据
              }
            }
          }
        });
        
        stream.on('end', () => {
          onData('', true);
          resolve();
        });
        
        stream.on('error', (err: Error) => {
          reject(err);
        });
      });
    } catch (error) {
      return this.handleRequestError(error);
    }
  }

  /**
   * 验证API密钥
   */
  public async validateApiKey(): Promise<boolean> {
    try {
      await this.ensureAccessToken();
      return !!this.accessToken;
    } catch (error) {
      return false;
    }
  }

  /**
   * 构建请求体
   * @param params 请求参数
   * @param options 调用选项
   */
  private buildRequestBody(params: ModelRequestParams, options?: ModelCallOptions): BaiduRequestBody {
    const messages = params.messages.map(msg => ({
      role: this.mapRole(msg.role),
      content: msg.content,
    }));

    return {
      messages,
      temperature: options?.temperature ?? params.temperature ?? 0.7,
      top_p: params.topP ?? 0.8,
      stream: options?.stream ?? false,
      user_id: 'mcp-user',
    };
  }

  /**
   * 处理响应数据
   * @param response 响应数据
   */
  private processResponse(response: BaiduResponseBody): ModelResponse {
    return {
      content: response.result,
      finishReason: response.is_end ? 'stop' : undefined,
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      } : undefined,
    };
  }

  /**
   * 映射消息角色
   * @param role 角色
   */
  private mapRole(role: MessageRole): string {
    switch (role) {
      case MessageRole.USER:
        return 'user';
      case MessageRole.ASSISTANT:
        return 'assistant';
      case MessageRole.SYSTEM:
        return 'system';
      default:
        return 'user';
    }
  }

  /**
   * 确保有效的访问令牌
   */
  private async ensureAccessToken(): Promise<void> {
    const currentTime = Date.now();
    
    // 如果令牌有效，直接返回
    if (this.accessToken && currentTime < this.tokenExpireTime) {
      return;
    }
    
    try {
      const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${this.apiKey}&client_secret=${this.secretKey}`;
      
      const response = await axios.post(tokenUrl);
      
      if (response.data && response.data.access_token) {
        this.accessToken = response.data.access_token;
        // 令牌有效期通常是30天，这里设为29天，提前刷新
        this.tokenExpireTime = currentTime + (response.data.expires_in || 2592000) * 1000 - 86400000;
      } else {
        throw new Error('获取访问令牌失败：响应中没有access_token字段');
      }
    } catch (error) {
      this.accessToken = null;
      this.tokenExpireTime = 0;
      throw new Error(`获取百度文心访问令牌失败：${(error as Error).message}`);
    }
  }
} 