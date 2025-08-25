/**
 * DeepSeek AI 模型适配器
 * 实现DeepSeek API的具体调用逻辑
 */

import axios, { AxiosInstance } from 'axios';
import { BaseModelAdapter, ModelConfig, ModelRequest, ModelResponse, ChatMessage } from './base-adapter';

export interface DeepSeekConfig extends Omit<ModelConfig, 'provider'> {
  provider: 'deepseek';
  model: 'deepseek-chat' | 'deepseek-coder';
}

export class DeepSeekAdapter extends BaseModelAdapter {
  private httpClient: AxiosInstance;

  constructor(config: DeepSeekConfig) {
    const enhancedConfig: ModelConfig = {
      ...config,
      provider: 'deepseek',
      capabilities: {
        textGeneration: true,
        codeGeneration: true,
        reasoning: true,
        multimodal: false,
        functionCalling: true,
        streaming: true,
        contextLength: config.model === 'deepseek-chat' ? 32768 : 16384,
      },
      rateLimit: {
        requestsPerMinute: 60,
        tokensPerMinute: 200000,
      },
    };

    super(enhancedConfig);

    this.httpClient = axios.create({
      baseURL: config.endpoint || 'https://api.deepseek.com',
      timeout: config.timeout,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  protected async validateConfig(): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('DeepSeek API密钥未配置');
    }

    if (!this.config.model) {
      throw new Error('DeepSeek 模型未指定');
    }

    const validModels = ['deepseek-chat', 'deepseek-coder'];
    if (!validModels.includes(this.config.model)) {
      throw new Error(`不支持的DeepSeek模型: ${this.config.model}`);
    }
  }

  protected async testConnection(): Promise<void> {
    try {
      const response = await this.httpClient.post('/v1/chat/completions', {
        model: this.config.model,
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        max_tokens: 5,
        temperature: 0,
      });

      if (response.status !== 200) {
        throw new Error(`连接测试失败: HTTP ${response.status}`);
      }

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(`DeepSeek API连接失败: ${message}`);
      }
      throw error;
    }
  }

  protected async sendRequest(request: ModelRequest): Promise<ModelResponse> {
    const startTime = Date.now();

    try {
      const deepseekRequest = this.formatRequest(request);
      const response = await this.httpClient.post('/v1/chat/completions', deepseekRequest);

      return this.formatResponse(response.data, startTime, request);

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        const message = errorData?.error?.message || error.message;
        const code = errorData?.error?.code || 'unknown';
        
        throw new Error(`DeepSeek API错误 [${code}]: ${message}`);
      }
      
      throw this.formatError(error);
    }
  }

  protected async *sendStreamRequest(request: ModelRequest): AsyncIterator<Partial<ModelResponse>> {
    const deepseekRequest = {
      ...this.formatRequest(request),
      stream: true,
    };

    try {
      const response = await this.httpClient.post('/v1/chat/completions', deepseekRequest, {
        responseType: 'stream',
      });

      let buffer = '';
      const startTime = Date.now();

      for await (const chunk of response.data) {
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
              const delta = parsed.choices?.[0]?.delta;
              
              if (delta?.content) {
                yield {
                  content: delta.content,
                  responseTime: Date.now() - startTime,
                };
              }

              if (parsed.choices?.[0]?.finish_reason) {
                yield {
                  finishReason: this.mapFinishReason(parsed.choices[0].finish_reason),
                  usage: parsed.usage ? this.formatUsage(parsed.usage) : undefined,
                };
              }

            } catch (parseError) {
              console.warn('解析流式响应失败:', parseError);
            }
          }
        }
      }

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(`DeepSeek 流式请求失败: ${message}`);
      }
      throw error;
    }
  }

  protected async cleanup(): Promise<void> {
    // DeepSeek 适配器暂无需要清理的资源
  }

  private formatRequest(request: ModelRequest): any {
    const deepseekMessages = request.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    const deepseekRequest: any = {
      model: this.config.model,
      messages: deepseekMessages,
      max_tokens: request.maxTokens || this.config.maxTokens,
      temperature: request.temperature ?? this.config.temperature,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    };

    // 添加函数调用支持
    if (request.functions && request.functions.length > 0) {
      deepseekRequest.functions = request.functions.map(func => ({
        name: func.name,
        description: func.description,
        parameters: func.parameters,
      }));
      deepseekRequest.function_call = 'auto';
    }

    return deepseekRequest;
  }

  private formatResponse(data: any, startTime: number, originalRequest: ModelRequest): ModelResponse {
    const choice = data.choices?.[0];
    if (!choice) {
      throw new Error('DeepSeek API响应格式错误：缺少choices');
    }

    const responseTime = Date.now() - startTime;
    const usage = this.formatUsage(data.usage);
    const cost = this.calculateCost(usage);

    const response: ModelResponse = {
      id: data.id || `deepseek-${Date.now()}`,
      content: choice.message?.content || '',
      finishReason: this.mapFinishReason(choice.finish_reason),
      usage,
      cost,
      responseTime,
      metadata: {
        model: data.model,
        created: data.created,
        provider: 'deepseek',
      },
    };

    // 处理函数调用
    if (choice.message?.function_call) {
      response.functionCall = {
        name: choice.message.function_call.name,
        arguments: JSON.parse(choice.message.function_call.arguments || '{}'),
      };
    }

    return response;
  }

  private formatUsage(usage: any): ModelResponse['usage'] {
    return {
      promptTokens: usage?.prompt_tokens || 0,
      completionTokens: usage?.completion_tokens || 0,
      totalTokens: usage?.total_tokens || 0,
    };
  }

  private calculateCost(usage: ModelResponse['usage']): number {
    return usage.totalTokens * this.config.costPerToken;
  }

  private mapFinishReason(reason: string): ModelResponse['finishReason'] {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'function_call':
        return 'function_call';
      default:
        return 'error';
    }
  }

  /**
   * 获取可用模型列表
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await this.httpClient.get('/v1/models');
      return response.data.data.map((model: any) => model.id);
    } catch (error) {
      console.warn('获取DeepSeek可用模型失败:', error);
      return ['deepseek-chat', 'deepseek-coder'];
    }
  }

  /**
   * 获取模型详细信息
   */
  async getModelDetails(modelId: string): Promise<any> {
    try {
      const response = await this.httpClient.get(`/v1/models/${modelId}`);
      return response.data;
    } catch (error) {
      console.warn(`获取DeepSeek模型 ${modelId} 详情失败:`, error);
      return null;
    }
  }

  /**
   * 验证API密钥
   */
  async validateAPIKey(): Promise<boolean> {
    try {
      await this.testConnection();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取账户信息
   */
  async getAccountInfo(): Promise<any> {
    try {
      const response = await this.httpClient.get('/v1/account');
      return response.data;
    } catch (error) {
      console.warn('获取DeepSeek账户信息失败:', error);
      return null;
    }
  }

  /**
   * 获取使用统计
   */
  async getUsageStats(startDate?: Date, endDate?: Date): Promise<any> {
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate.toISOString().split('T')[0];
      if (endDate) params.end_date = endDate.toISOString().split('T')[0];

      const response = await this.httpClient.get('/v1/usage', { params });
      return response.data;
    } catch (error) {
      console.warn('获取DeepSeek使用统计失败:', error);
      return null;
    }
  }

  /**
   * 设置自定义系统提示
   */
  setSystemPrompt(prompt: string): void {
    // 可以在这里存储自定义系统提示，在请求时自动添加
    this.config.metadata = {
      ...this.config.metadata,
      systemPrompt: prompt,
    };
  }

  /**
   * 批量处理请求
   */
  async batchProcess(requests: ModelRequest[]): Promise<ModelResponse[]> {
    const results: ModelResponse[] = [];
    
    // DeepSeek不支持真正的批量API，所以我们并发处理
    const batchSize = 5; // 控制并发数
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchPromises = batch.map(request => this.chat(request));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        console.error(`批处理第 ${Math.floor(i / batchSize) + 1} 批失败:`, error);
        throw error;
      }
    }

    return results;
  }
}