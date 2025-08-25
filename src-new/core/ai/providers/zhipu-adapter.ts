/**
 * 智谱AI (ZhipuAI) 模型适配器
 * 实现智谱AI GLM API的具体调用逻辑
 */

import axios, { AxiosInstance } from 'axios';
import { BaseModelAdapter, ModelConfig, ModelRequest, ModelResponse } from './base-adapter';

export interface ZhipuConfig extends Omit<ModelConfig, 'provider'> {
  provider: 'zhipu';
  model: 'glm-4' | 'glm-4-plus' | 'glm-4-air' | 'glm-4-airx' | 'glm-4-long' | 'glm-4v';
}

export class ZhipuAdapter extends BaseModelAdapter {
  private httpClient: AxiosInstance;

  constructor(config: ZhipuConfig) {
    const enhancedConfig: ModelConfig = {
      ...config,
      provider: 'zhipu',
      capabilities: {
        textGeneration: true,
        codeGeneration: true,
        reasoning: true,
        multimodal: config.model === 'glm-4v',
        functionCalling: true,
        streaming: true,
        contextLength: config.model === 'glm-4-long' ? 1000000 : 128000,
      },
      rateLimit: {
        requestsPerMinute: 100,
        tokensPerMinute: 300000,
      },
    };

    super(enhancedConfig);

    this.httpClient = axios.create({
      baseURL: config.endpoint || 'https://open.bigmodel.cn/api/paas/v4',
      timeout: config.timeout,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  protected async validateConfig(): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('智谱AI API密钥未配置');
    }

    if (!this.config.model) {
      throw new Error('智谱AI 模型未指定');
    }

    const validModels = [
      'glm-4', 'glm-4-plus', 'glm-4-air', 'glm-4-airx', 'glm-4-long', 'glm-4v'
    ];
    if (!validModels.includes(this.config.model)) {
      throw new Error(`不支持的智谱AI模型: ${this.config.model}`);
    }
  }

  protected async testConnection(): Promise<void> {
    try {
      const response = await this.httpClient.post('/chat/completions', {
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
        throw new Error(`智谱AI API连接失败: ${message}`);
      }
      throw error;
    }
  }

  protected async sendRequest(request: ModelRequest): Promise<ModelResponse> {
    const startTime = Date.now();

    try {
      const zhipuRequest = this.formatRequest(request);
      const response = await this.httpClient.post('/chat/completions', zhipuRequest);

      return this.formatResponse(response.data, startTime, request);

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        const message = errorData?.error?.message || error.message;
        const code = errorData?.error?.code || errorData?.error?.type || 'unknown';
        
        throw new Error(`智谱AI API错误 [${code}]: ${message}`);
      }
      
      throw this.formatError(error);
    }
  }

  protected async *sendStreamRequest(request: ModelRequest): AsyncIterator<Partial<ModelResponse>> {
    const zhipuRequest = {
      ...this.formatRequest(request),
      stream: true,
    };

    try {
      const response = await this.httpClient.post('/chat/completions', zhipuRequest, {
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
        throw new Error(`智谱AI 流式请求失败: ${message}`);
      }
      throw error;
    }
  }

  protected async cleanup(): Promise<void> {
    // 智谱AI 适配器暂无需要清理的资源
  }

  private formatRequest(request: ModelRequest): any {
    const zhipuMessages = request.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    const zhipuRequest: any = {
      model: this.config.model,
      messages: zhipuMessages,
      max_tokens: request.maxTokens || this.config.maxTokens,
      temperature: request.temperature ?? this.config.temperature,
      top_p: 0.7,
      do_sample: true,
    };

    // 智谱AI的工具调用格式
    if (request.functions && request.functions.length > 0) {
      zhipuRequest.tools = request.functions.map(func => ({
        type: 'function',
        function: {
          name: func.name,
          description: func.description,
          parameters: func.parameters,
        },
      }));
      zhipuRequest.tool_choice = 'auto';
    }

    return zhipuRequest;
  }

  private formatResponse(data: any, startTime: number, originalRequest: ModelRequest): ModelResponse {
    const choice = data.choices?.[0];
    if (!choice) {
      throw new Error('智谱AI API响应格式错误：缺少choices');
    }

    const responseTime = Date.now() - startTime;
    const usage = this.formatUsage(data.usage);
    const cost = this.calculateCost(usage);

    const response: ModelResponse = {
      id: data.id || `zhipu-${Date.now()}`,
      content: choice.message?.content || '',
      finishReason: this.mapFinishReason(choice.finish_reason),
      usage,
      cost,
      responseTime,
      metadata: {
        model: data.model,
        created: data.created,
        provider: 'zhipu',
      },
    };

    // 处理工具调用
    if (choice.message?.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      if (toolCall.type === 'function') {
        response.functionCall = {
          name: toolCall.function.name,
          arguments: JSON.parse(toolCall.function.arguments || '{}'),
        };
      }
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
    // 智谱AI的计费规则可能不同，这里使用统一的计算方式
    return usage.totalTokens * this.config.costPerToken;
  }

  private mapFinishReason(reason: string): ModelResponse['finishReason'] {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'tool_calls':
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
      const response = await this.httpClient.get('/models');
      return response.data.data.map((model: any) => model.id);
    } catch (error) {
      console.warn('获取智谱AI可用模型失败:', error);
      return ['glm-4', 'glm-4-plus', 'glm-4-air', 'glm-4-airx', 'glm-4-long', 'glm-4v'];
    }
  }

  /**
   * 智谱AI特有的异步任务查询
   */
  async queryAsyncTask(taskId: string): Promise<any> {
    try {
      const response = await this.httpClient.get(`/async/query/${taskId}`);
      return response.data;
    } catch (error) {
      console.warn(`查询智谱AI异步任务 ${taskId} 失败:`, error);
      return null;
    }
  }

  /**
   * 智谱AI的文本嵌入功能
   */
  async createEmbedding(text: string, model = 'embedding-2'): Promise<number[]> {
    try {
      const response = await this.httpClient.post('/embeddings', {
        model,
        input: text,
      });

      return response.data.data[0].embedding;
    } catch (error) {
      console.error('创建智谱AI文本嵌入失败:', error);
      throw error;
    }
  }

  /**
   * 智谱AI的图像理解功能 (仅GLM-4V)
   */
  async analyzeImage(imageUrl: string, prompt: string): Promise<ModelResponse> {
    if (this.config.model !== 'glm-4v') {
      throw new Error('图像理解功能仅GLM-4V模型支持');
    }

    const request: ModelRequest = {
      messages: [
        {
          role: 'user',
          content: JSON.stringify([
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ]),
        },
      ],
    };

    return await this.chat(request);
  }

  /**
   * 智谱AI的代码解释功能
   */
  async explainCode(code: string, language: string): Promise<ModelResponse> {
    const prompt = `请解释以下${language}代码的功能和逻辑：\n\n\`\`\`${language}\n${code}\n\`\`\``;
    
    const request: ModelRequest = {
      messages: [
        {
          role: 'system',
          content: '你是一个专业的代码分析师，擅长解释各种编程语言的代码逻辑和功能。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
    };

    return await this.chat(request);
  }

  /**
   * 智谱AI的文档总结功能
   */
  async summarizeDocument(content: string, maxLength = 200): Promise<ModelResponse> {
    const prompt = `请对以下文档内容进行总结，总结长度不超过${maxLength}字：\n\n${content}`;
    
    const request: ModelRequest = {
      messages: [
        {
          role: 'system',
          content: '你是一个专业的文档分析师，擅长提取关键信息并进行简洁准确的总结。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      maxTokens: Math.ceil(maxLength * 1.5), // 考虑到token和字符的转换比例
    };

    return await this.chat(request);
  }

  /**
   * 智谱AI的知识问答功能
   */
  async askQuestion(question: string, context?: string): Promise<ModelResponse> {
    const messages: any[] = [
      {
        role: 'system',
        content: '你是一个知识渊博的AI助手，能够基于提供的上下文准确回答问题。如果上下文中没有相关信息，请诚实地说明。',
      },
    ];

    if (context) {
      messages.push({
        role: 'user',
        content: `上下文信息：\n${context}\n\n问题：${question}`,
      });
    } else {
      messages.push({
        role: 'user',
        content: question,
      });
    }

    const request: ModelRequest = {
      messages,
      temperature: 0.1,
    };

    return await this.chat(request);
  }
}