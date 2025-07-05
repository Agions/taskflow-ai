import axios from 'axios';
import * as crypto from 'crypto';
import { 
  ModelCallOptions, 
  ModelRequestParams, 
  ModelResponse,
  MessageRole
} from '../../../types/model';
import { ModelType, ZhipuModelConfig } from '../../../types/config';
import { BaseModelAdapter } from './base';
import { ConfigManager } from '../../../infra/config';

/**
 * 智谱AI大模型适配器
 */
export class ZhipuModelAdapter extends BaseModelAdapter {
  private apiKey: string;
  private endpoint: string;
  private modelVersion: string;

  /**
   * 创建智谱AI大模型适配器实例
   * @param configManager 配置管理器实例
   */
  constructor(configManager: ConfigManager) {
    super(ModelType.ZHIPU);

    const config = configManager.get<ZhipuModelConfig>(`models.${ModelType.ZHIPU}`, {
      apiKey: '',
      endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      modelVersion: 'glm-4',
    });

    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint || 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
    this.modelVersion = config.modelVersion || 'glm-4';

    if (!this.apiKey) {
      throw new Error('智谱AI API密钥未配置，请使用 yasi config 命令设置 model.zhipu.apiKey');
    }
  }

  /**
   * 执行聊天请求
   * @param params 请求参数
   * @param options 调用选项
   */
  public async chat(params: ModelRequestParams, options?: ModelCallOptions): Promise<ModelResponse> {
    try {
      const requestBody = this.buildRequestBody(params, options);
      const headers = this.generateAuthHeaders();
      
      const response = await axios.post(this.endpoint, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': headers.Authorization,
          'Date': headers.Date,
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
      const requestBody = this.buildRequestBody(params, { ...options, stream: true });
      const headers = this.generateAuthHeaders();
      
      const response = await axios.post(this.endpoint, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': headers.Authorization,
          'Date': headers.Date,
          'Accept': 'text/event-stream',
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
              
              // 检查是否是流结束标记
              if (data === '[DONE]') {
                onData('', true);
                continue;
              }
              
              try {
                const parsedData = JSON.parse(data);
                if (parsedData.choices && parsedData.choices.length > 0) {
                  const delta = parsedData.choices[0].delta?.content || '';
                  const done = parsedData.choices[0].finish_reason === 'stop';
                  onData(delta, done);
                }
              } catch {
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
      // 使用一个简单的请求验证API密钥
      await this.chat({
        messages: [{ role: MessageRole.USER, content: 'Hello' }],
        maxTokens: 5
      }, { temperature: 0.1 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 构建请求体
   * @param params 请求参数
   * @param options 调用选项
   */
  private buildRequestBody(params: ModelRequestParams, options?: ModelCallOptions): {
    model: string;
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    stream?: boolean;
  } {
    const messages = params.messages.map(msg => ({
      role: this.mapRole(msg.role),
      content: msg.content,
    }));

    return {
      model: this.modelVersion,
      messages,
      temperature: options?.temperature ?? params.temperature ?? 0.7,
      top_p: params.topP ?? 0.8,
      max_tokens: options?.maxTokens ?? params.maxTokens ?? 1024,
      stream: options?.stream ?? false,
    };
  }

  /**
   * 处理响应数据
   * @param response 响应数据
   */
  private processResponse(response: {
    choices: Array<{
      message: { content: string };
      finish_reason?: string;
    }>;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  }): ModelResponse {
    if (!response.choices || response.choices.length === 0) {
      throw new Error('无效的响应格式：没有返回choices字段');
    }
    
    const choice = response.choices[0];
    
    return {
      content: choice.message?.content || '',
      finishReason: choice.finish_reason,
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
   * 生成智谱API认证头信息
   */
  private generateAuthHeaders(): { Authorization: string, Date: string } {
    // apiKey格式：zhipuai-api-key
    // 验证apiKey格式是否正确
    if (!this.apiKey.startsWith('zhipu-')) {
      throw new Error('智谱AI API密钥格式不正确，应以"zhipu-"开头');
    }

    // 从apiKey中提取id和secret
    const [id, secret] = this.apiKey.substring(6).split('.');
    
    if (!id || !secret) {
      throw new Error('智谱AI API密钥格式不正确，无法提取id和secret');
    }

    // 当前GMT时间，形如：Mon, 01 Jul 2023 12:00:00 GMT
    const date = new Date().toUTCString();
    
    // 计算HMAC-SHA256签名
    const signString = `date: ${date}\nPOST /api/paas/v4/chat/completions HTTP/1.1`;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(signString)
      .digest('base64');
    
    // 生成Authorization头
    const authHeader = `hmac username="${id}", algorithm="hmac-sha256", headers="date request-line", signature="${signature}"`;
    
    return {
      Authorization: authHeader,
      Date: date
    };
  }
} 