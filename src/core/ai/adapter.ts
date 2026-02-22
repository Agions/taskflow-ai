/**
 * LLM 适配器基类
 * 所有模型提供商适配器都继承此类
 */

import { ModelConfig, ProviderType } from './types';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
}

export interface ChatCompletionOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  tools?: ToolDefinition[];
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
  stream?: boolean;
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  created: number;
}

export interface StreamChunk {
  id: string;
  choices: {
    index: number;
    delta: Partial<ChatMessage>;
    finish_reason?: string;
  }[];
}

export abstract class BaseAdapter {
  protected config: ModelConfig;
  protected baseUrl: string;

  constructor(config: ModelConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || this.getDefaultEndpoint();
  }

  /** 获取默认 API 端点 */
  protected abstract getDefaultEndpoint(): string;

  /** 发送聊天请求 */
  abstract complete(options: Omit<ChatCompletionOptions, 'model'>): Promise<ChatCompletionResponse>;

  /** 流式聊天请求 */
  async *stream(options: Omit<ChatCompletionOptions, 'model'> & { stream: true }): AsyncGenerator<StreamChunk> {
    const response = await this.complete({ ...options, stream: true } as ChatCompletionOptions);
    
    // 模拟流式响应 (实际实现需要根据提供商调整)
    for (const choice of response.choices) {
      yield {
        id: response.id,
        choices: [{
          index: choice.index,
          delta: choice.message,
          finish_reason: choice.finish_reason,
        }],
      };
    }
  }

  /** 测试连接 */
  async test(): Promise<{ success: boolean; latency: number; error?: string }> {
    const start = Date.now();
    try {
      await this.complete({
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10,
      });
      return { success: true, latency: Date.now() - start };
    } catch (error) {
      return { 
        success: false, 
        latency: Date.now() - start, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /** 获取模型信息 */
  getModelInfo() {
    return {
      id: this.config.id,
      provider: this.config.provider,
      modelName: this.config.modelName,
      enabled: this.config.enabled,
      capabilities: this.config.capabilities,
    };
  }

  /** 估算成本 */
  estimateCost(inputTokens: number, outputTokens: number): number {
    const inputCost = this.config.costPer1MInput 
      ? (inputTokens / 1_000_000) * this.config.costPer1MInput 
      : 0;
    const outputCost = this.config.costPer1MOutput 
      ? (outputTokens / 1_000_000) * this.config.costPer1MOutput 
      : 0;
    return inputCost + outputCost;
  }

  /** 构建请求头 */
  protected buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    switch (this.config.provider) {
      case 'openai':
      case 'anthropic':
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        if (this.config.provider === 'anthropic') {
          headers['anthropic-version'] = '2023-06-01';
        }
        break;
      case 'deepseek':
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        break;
      case 'zhipu':
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        break;
      case 'qwen':
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        break;
    }

    return headers;
  }

  /** 发送请求 */
  protected async request<T>(endpoint: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error (${response.status}): ${error}`);
    }

    return response.json() as Promise<T>;
  }
}
