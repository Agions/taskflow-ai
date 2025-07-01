import axios from 'axios';
import { 
  ModelCallOptions, 
  ModelRequestParams, 
  ModelResponse,
  DeepseekRequestBody,
  DeepseekResponseBody,
  MessageRole
} from '../../../types/model';
import { ModelType, DeepseekModelConfig } from '../../../types/config';
import { BaseModelAdapter } from './base';
import { ConfigManager } from '../../../infra/config';

/**
 * DeepSeek大模型适配器
 */
export class DeepseekModelAdapter extends BaseModelAdapter {
  private apiKey: string;
  private endpoint: string;
  private modelVersion: string;

  /**
   * 创建DeepSeek大模型适配器实例
   * @param configManager 配置管理器实例
   */
  constructor(configManager: ConfigManager) {
    super(ModelType.DEEPSEEK);

    const config = configManager.get<DeepseekModelConfig>(`models.${ModelType.DEEPSEEK}`, {
      apiKey: '',
      endpoint: 'https://api.deepseek.com/v1/chat/completions',
      modelVersion: 'deepseek-chat',
    });

    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint || 'https://api.deepseek.com/v1/chat/completions';
    this.modelVersion = config.modelVersion || 'deepseek-chat';

    if (!this.apiKey) {
      throw new Error('DeepSeek API密钥未配置，请使用 mcp config 命令设置 model.deepseek.apiKey');
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
      
      const response = await axios.post<DeepseekResponseBody>(this.endpoint, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
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
      
      const response = await axios.post(this.endpoint, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
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
                const parsedData = JSON.parse(data) as DeepseekResponseBody;
                if (parsedData.choices && parsedData.choices.length > 0) {
                  const content = parsedData.choices[0].message?.content || '';
                  const done = parsedData.choices[0].finish_reason === 'stop';
                  onData(content, done);
                }
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
      // 使用一个简单的请求验证API密钥
      await this.chat({
        messages: [{ role: MessageRole.USER, content: 'Hello' }],
        maxTokens: 5
      }, { temperature: 0.1 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 构建请求体
   * @param params 请求参数
   * @param options 调用选项
   */
  private buildRequestBody(params: ModelRequestParams, options?: ModelCallOptions): DeepseekRequestBody {
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
  private processResponse(response: DeepseekResponseBody): ModelResponse {
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
} 