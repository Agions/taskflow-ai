/**
 * 阿里通义千问模型提供商
 * 支持Qwen系列模型的API调用
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
 * 阿里通义千问模型列表
 */
export enum AlibabaQwenModel {
  QWEN_TURBO = 'qwen-turbo',                 // 通义千问-Turbo
  QWEN_PLUS = 'qwen-plus',                   // 通义千问-Plus
  QWEN_MAX = 'qwen-max',                     // 通义千问-Max
  QWEN_MAX_1201 = 'qwen-max-1201',          // 通义千问-Max-1201
  QWEN_MAX_LONGCONTEXT = 'qwen-max-longcontext', // 通义千问-Max长文本
  QWEN_7B_CHAT = 'qwen-7b-chat',            // Qwen-7B-Chat
  QWEN_14B_CHAT = 'qwen-14b-chat',          // Qwen-14B-Chat
  QWEN_72B_CHAT = 'qwen-72b-chat',          // Qwen-72B-Chat
  QWEN_1_8B_LONGCONTEXT_CHAT = 'qwen-1.8b-longcontext-chat', // Qwen-1.8B长文本
  QWEN_1_8B_CHAT = 'qwen-1.8b-chat',       // Qwen-1.8B-Chat
  QWEN_VL_PLUS = 'qwen-vl-plus',            // 通义千问-VL-Plus
  QWEN_VL_MAX = 'qwen-vl-max',              // 通义千问-VL-Max
  QWEN_AUDIO_TURBO = 'qwen-audio-turbo',    // 通义千问-Audio-Turbo
  QWEN_AUDIO_CHAT = 'qwen-audio-chat'       // 通义千问-Audio-Chat
}

/**
 * 阿里通义千问API响应接口
 */
interface AlibabaQwenResponse {
  output: {
    text: string;
    finish_reason: string;
  };
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  request_id: string;
}

/**
 * 阿里通义千问流式响应接口
 */
interface AlibabaQwenStreamResponse {
  output: {
    text: string;
    finish_reason?: string;
  };
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  request_id: string;
}

/**
 * 阿里通义千问提供商实现
 */
export class AlibabaQwenProvider extends ChineseLLMProvider {
  private httpClient: AxiosInstance;
  private readonly baseUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

  constructor(config: ModelConfig, logger: Logger) {
    super(ChineseLLMType.ALIBABA_QWEN, config, logger);
    
    this.httpClient = axios.create({
      baseURL: config.baseUrl || this.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'X-DashScope-SSE': 'disable'
      }
    });

    // 设置响应拦截器
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        this.logger.error(`阿里通义千问API请求失败: ${this.handleApiError(error)}`);
        return Promise.reject(error);
      }
    );
  }

  /**
   * 聊天补全
   */
  public async chat(request: ChatRequest): Promise<ChatResponse> {
    return await this.withRetry(async () => {
      const model = request.model || this.config.model || AlibabaQwenModel.QWEN_TURBO;
      
      const requestBody = {
        model,
        input: {
          messages: this.formatMessagesForQwen(request.messages)
        },
        parameters: {
          temperature: request.temperature ?? this.config.temperature ?? 0.7,
          top_p: request.topP ?? this.config.topP ?? 0.9,
          max_tokens: request.maxTokens ?? this.config.maxTokens ?? 2048,
          stream: false,
          incremental_output: false
        }
      };

      this.logger.info(`发送阿里通义千问请求: ${model}`);
      
      const response = await this.httpClient.post<AlibabaQwenResponse>('', requestBody);
      const data = response.data;

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
      const model = request.model || this.config.model || AlibabaQwenModel.QWEN_TURBO;
      
      const requestBody = {
        model,
        input: {
          messages: this.formatMessagesForQwen(request.messages)
        },
        parameters: {
          temperature: request.temperature ?? this.config.temperature ?? 0.7,
          top_p: request.topP ?? this.config.topP ?? 0.9,
          max_tokens: request.maxTokens ?? this.config.maxTokens ?? 2048,
          stream: true,
          incremental_output: true
        }
      };

      this.logger.info(`发送阿里通义千问流式请求: ${model}`);

      const response = await this.httpClient.post('', requestBody, {
        headers: {
          'X-DashScope-SSE': 'enable',
          'Accept': 'text/event-stream'
        },
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
              if (line.startsWith('data:')) {
                const jsonStr = line.slice(5).trim();
                if (jsonStr === '[DONE]') {
                  resolve();
                  return;
                }
                
                const data: AlibabaQwenStreamResponse = JSON.parse(jsonStr);
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
      const testRequest: ChatRequest = {
        messages: [{ role: 'user', content: '你好' }]
      };
      
      await this.chat(testRequest);
      return true;
    } catch (error) {
      this.logger.error(`阿里通义千问API密钥验证失败: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * 获取模型信息
   */
  public async getModelInfo(): Promise<{
    provider: string;
    description: string;
    models: string[];
    capabilities: string[];
    pricing: Record<string, unknown>;
  }> {
    return {
      provider: '阿里通义千问',
      description: '阿里云自研的大语言模型，具备多模态能力和长文本处理能力',
      features: ['多模态', '长文本', '代码生成', '数学推理', '多语言'],
      pricing: {
        'qwen-turbo': { input: 0.008, output: 0.008 },
        'qwen-plus': { input: 0.020, output: 0.020 },
        'qwen-max': { input: 0.120, output: 0.120 }
      },
      limits: {
        maxTokens: 32768,
        maxRequestsPerMinute: 600,
        maxRequestsPerDay: 100000
      }
    };
  }

  /**
   * 获取支持的模型列表
   */
  public getSupportedModels(): string[] {
    return Object.values(AlibabaQwenModel);
  }

  /**
   * 格式化消息为通义千问格式
   */
  private formatMessagesForQwen(messages: ChatMessage[]): Array<{
    role: string;
    content: string;
  }> {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * 格式化响应
   */
  private formatResponse(data: AlibabaQwenResponse, model: string): ChatResponse {
    return {
      id: data.request_id,
      object: 'chat.completion',
      created: this.getCurrentTimestamp(),
      model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: data.output.text
        },
        finishReason: this.mapFinishReason(data.output.finish_reason)
      }],
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.total_tokens
      }
    };
  }

  /**
   * 格式化流式响应
   */
  private formatStreamResponse(data: AlibabaQwenStreamResponse, model: string): StreamResponse {
    return {
      id: data.request_id,
      object: 'chat.completion.chunk',
      created: this.getCurrentTimestamp(),
      model,
      choices: [{
        index: 0,
        delta: {
          content: data.output.text
        },
        finishReason: data.output.finish_reason ? this.mapFinishReason(data.output.finish_reason) : undefined
      }]
    };
  }

  /**
   * 映射结束原因
   */
  private mapFinishReason(reason: string): string {
    const reasonMap: Record<string, string> = {
      'stop': 'stop',
      'length': 'length',
      'null': 'stop'
    };
    
    return reasonMap[reason] || 'stop';
  }

  /**
   * 多模态聊天（支持图片）
   */
  public async chatWithImage(
    messages: ChatMessage[],
    imageUrls: string[],
    options?: Partial<ChatRequest>
  ): Promise<ChatResponse> {
    const model = options?.model || AlibabaQwenModel.QWEN_VL_PLUS;
    
    // 构建多模态消息
    const multimodalMessages = messages.map(msg => {
      if (msg.role === 'user' && imageUrls.length > 0) {
        const content = [
          { type: 'text', text: msg.content },
          ...imageUrls.map(url => ({ type: 'image_url', image_url: { url } }))
        ];
        return { role: msg.role, content };
      }
      return { role: msg.role, content: msg.content };
    });

    const requestBody = {
      model,
      input: {
        messages: multimodalMessages
      },
      parameters: {
        temperature: options?.temperature ?? 0.7,
        top_p: options?.topP ?? 0.9,
        max_tokens: options?.maxTokens ?? 2048
      }
    };

    this.logger.info(`发送阿里通义千问多模态请求: ${model}`);
    
    const response = await this.httpClient.post<AlibabaQwenResponse>('', requestBody);
    return this.formatResponse(response.data, model);
  }

  /**
   * 长文本处理
   */
  public async processLongText(
    text: string,
    instruction: string,
    options?: Partial<ChatRequest>
  ): Promise<ChatResponse> {
    const model = options?.model || AlibabaQwenModel.QWEN_MAX_LONGCONTEXT;
    
    const messages: ChatMessage[] = [
      { role: 'system', content: instruction },
      { role: 'user', content: text }
    ];

    return await this.chat({
      messages,
      model,
      maxTokens: options?.maxTokens ?? 8192,
      temperature: options?.temperature ?? 0.3,
      ...options
    });
  }

  /**
   * 代码生成
   */
  public async generateCode(
    requirement: string,
    language: string = 'typescript',
    options?: Partial<ChatRequest>
  ): Promise<ChatResponse> {
    const systemPrompt = `你是一个专业的${language}开发工程师。请根据需求生成高质量的代码，包含必要的注释和错误处理。`;
    
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `请用${language}实现以下需求：\n${requirement}` }
    ];

    return await this.chat({
      messages,
      model: options?.model || AlibabaQwenModel.QWEN_PLUS,
      temperature: options?.temperature ?? 0.2,
      maxTokens: options?.maxTokens ?? 4096,
      ...options
    });
  }

  /**
   * 文档总结
   */
  public async summarizeDocument(
    document: string,
    summaryType: 'brief' | 'detailed' | 'key_points' = 'brief',
    options?: Partial<ChatRequest>
  ): Promise<ChatResponse> {
    const prompts = {
      brief: '请简要总结以下文档的主要内容：',
      detailed: '请详细总结以下文档，包括主要观点、关键信息和结论：',
      key_points: '请提取以下文档的关键要点，以条目形式列出：'
    };

    const messages: ChatMessage[] = [
      { role: 'user', content: `${prompts[summaryType]}\n\n${document}` }
    ];

    return await this.chat({
      messages,
      model: options?.model || AlibabaQwenModel.QWEN_MAX_LONGCONTEXT,
      temperature: options?.temperature ?? 0.3,
      maxTokens: options?.maxTokens ?? 2048,
      ...options
    });
  }
}
