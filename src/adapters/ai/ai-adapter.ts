/**
 * AI Adapter - AI 模型适配器
 * TaskFlow AI v4.0
 */

import { ModelProvider } from '../types/config';

export interface AIModelConfig {
  id: string;
  provider: ModelProvider;
  model: string;
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIRequest {
  modelId: string;
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stream?: boolean;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason?: string;
}

export interface AIAdapterError extends Error {
  code: string;
  provider: string;
}

export class AIAdapter {
  private models: Map<string, AIModelConfig> = new Map();
  private defaultTimeout = 30000;
  private defaultMaxRetries = 3;

  /**
   * 注册模型配置
   */
  registerModel(config: AIModelConfig): void {
    this.models.set(config.id, {
      timeout: this.defaultTimeout,
      maxRetries: this.defaultMaxRetries,
      ...config
    });
  }

  /**
   * 获取模型配置
   */
  getModel(modelId: string): AIModelConfig | undefined {
    return this.models.get(modelId);
  }

  /**
   * 检查模型是否存在
   */
  hasModel(modelId: string): boolean {
    return this.models.has(modelId);
  }

  /**
   * 获取所有模型
   */
  getAllModels(): AIModelConfig[] {
    return Array.from(this.models.values());
  }

  /**
   * 删除模型
   */
  unregisterModel(modelId: string): boolean {
    return this.models.delete(modelId);
  }

  /**
   * 发送请求到 AI 提供商
   */
  async sendRequest(request: AIRequest): Promise<AIResponse> {
    const model = this.models.get(request.modelId);
    if (!model) {
      throw new Error(`Model not found: ${request.modelId}`);
    }

    return this.executeWithRetry(model, request);
  }

  /**
   * 带重试的执行
   */
  private async executeWithRetry(
    model: AIModelConfig,
    request: AIRequest,
    attempt: number = 1
  ): Promise<AIResponse> {
    try {
      return await this.executeRequest(model, request);
    } catch (error) {
      const maxRetries = model.maxRetries || this.defaultMaxRetries;

      if (attempt < maxRetries && this.isRetriable(error)) {
        const delay = this.calculateBackoff(attempt);
        await this.sleep(delay);
        return this.executeWithRetry(model, request, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * 执行请求
   */
  private async executeRequest(
    model: AIModelConfig,
    request: AIRequest
  ): Promise<AIResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      model.timeout || this.defaultTimeout
    );

    try {
      const response = await fetch(
        this.getEndpointURL(model),
        {
          method: 'POST',
          headers: this.getHeaders(model),
          body: JSON.stringify(this.buildRequestBody(model, request)),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw await this.createError(response, model);
      }

      const data = await response.json();
      return this.parseResponse(model, data);
    } catch (error) {
      clearTimeout(timeoutId);
      throw this.normalizeError(error, model);
    }
  }

  /**
   * 获取端点 URL
   */
  private getEndpointURL(model: AIModelConfig): string {
    if (model.baseURL) {
      return `${model.baseURL}/chat/completions`;
    }

    switch (model.provider.toLowerCase()) {
      case 'openai':
        return 'https://api.openai.com/v1/chat/completions';
      case 'anthropic':
        return 'https://api.anthropic.com/v1/messages';
      case 'deepseek':
        return 'https://api.deepseek.com/chat/completions';
      case 'zhipu':
        return 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
      default:
        throw new Error(`Unsupported provider: ${model.provider}`);
    }
  }

  /**
   * 获取请求头
   */
  private getHeaders(model: AIModelConfig): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    switch (model.provider.toLowerCase()) {
      case 'openai':
      case 'deepseek':
        headers['Authorization'] = `Bearer ${model.apiKey}`;
        break;
      case 'anthropic':
        headers['x-api-key'] = model.apiKey;
        headers['anthropic-version'] = '2023-06-01';
        break;
      case 'zhipu':
        headers['Authorization'] = `Bearer ${model.apiKey}`;
        break;
    }

    return headers;
  }

  /**
   * 构建请求体
   */
  private buildRequestBody(model: AIModelConfig, request: AIRequest): unknown {
    const body: unknown = {
      model: model.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      stream: request.stream ?? false
    };

    if (request.maxTokens) {
      (body as Record<string, unknown>).max_tokens = request.maxTokens;
    }

    if (request.topP !== undefined) {
      (body as Record<string, unknown>).top_p = request.topP;
    }

    return body;
  }

  /**
   * 解析响应
   */
  private parseResponse(model: AIModelConfig, data: unknown): AIResponse {
    // Simplified parsing - needs provider-specific handling
    const response = data as Record<string, unknown>;

    return {
      content: response.choices?.[0]?.message?.content as string || '',
      usage: response.usage as {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
      },
      model: model.model,
      finishReason: response.choices?.[0]?.finish_reason as string
    };
  }

  /**
   * 创建错误
   */
  private async createError(
    response: Response,
    model: AIModelConfig
  ): Promise<AIAdapterError> {
    const text = await response.text();
    const error: AIAdapterError = new Error(
      `AI request failed: ${response.status} ${response.statusText} - ${text}`
    ) as AIAdapterError;
    error.code = response.status.toString();
    error.provider = model.provider;
    return error;
  }

  /**
   * 规范化错误
   */
  private normalizeError(error: unknown, model: AIModelConfig): AIAdapterError {
    if (error instanceof Error) {
      return error as AIAdapterError;
    }

    const normalized = new Error(String(error)) as AIAdapterError;
    normalized.code = 'UNKNOWN';
    normalized.provider = model.provider;
    return normalized;
  }

  /**
   * 判断是否可重试
   */
  private isRetriable(error: unknown): boolean {
    if (error instanceof Error) {
      const adapterError = error as AIAdapterError;
      if (adapterError.code) {
        const code = parseInt(adapterError.code, 10);
        // 429 (rate limit), 500-599 (server errors)
        return code === 429 || (code >= 500 && code < 600);
      }
    }
    return false;
  }

  /**
   * 计算退避时间
   */
  private calculateBackoff(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s...
    return Math.min(Math.pow(2, attempt) * 1000, 10000);
  }

  /**
   * 睡眠工具函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
