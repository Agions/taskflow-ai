/**
 * AI模型适配器基类
 * 为不同AI提供商提供统一的接口抽象
 */

import { EventEmitter } from 'events';

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  endpoint: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
  costPerToken: number;
  rateLimit: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  capabilities: ModelCapabilities;
}

export interface ModelCapabilities {
  textGeneration: boolean;
  codeGeneration: boolean;
  reasoning: boolean;
  multimodal: boolean;
  functionCalling: boolean;
  streaming: boolean;
  contextLength: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
}

export interface ModelRequest {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  functions?: ModelFunction[];
  metadata?: Record<string, any>;
}

export interface ModelResponse {
  id: string;
  content: string;
  finishReason: 'stop' | 'length' | 'function_call' | 'error';
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
  responseTime: number;
  functionCall?: {
    name: string;
    arguments: Record<string, any>;
  };
  metadata?: Record<string, any>;
}

export interface ModelFunction {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ModelMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  totalCost: number;
  lastRequestAt?: Date;
  errorRate: number;
}

/**
 * AI模型适配器基类
 * 所有AI提供商适配器都应继承此类
 */
export abstract class BaseModelAdapter extends EventEmitter {
  protected config: ModelConfig;
  protected metrics: ModelMetrics;
  protected isInitialized = false;
  protected rateLimiter: RateLimiter;

  constructor(config: ModelConfig) {
    super();
    this.config = config;
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      totalCost: 0,
      errorRate: 0,
    };
    this.rateLimiter = new RateLimiter(config.rateLimit);
  }

  /**
   * 初始化适配器
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.validateConfig();
      await this.testConnection();
      this.isInitialized = true;
      
      console.log(`✅ ${this.config.provider} 模型适配器初始化成功`);
    } catch (error) {
      console.error(`❌ ${this.config.provider} 模型适配器初始化失败:`, error);
      throw error;
    }
  }

  /**
   * 发送聊天请求
   */
  async chat(request: ModelRequest): Promise<ModelResponse> {
    this.ensureInitialized();
    
    // 速率限制检查
    await this.rateLimiter.waitForSlot();

    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      // 验证请求
      this.validateRequest(request);

      // 发送请求到具体提供商
      const response = await this.sendRequest(request);

      // 更新指标
      const responseTime = Date.now() - startTime;
      this.updateSuccessMetrics(response, responseTime);

      // 触发事件
      this.emit('requestSuccess', {
        provider: this.config.provider,
        request,
        response,
        responseTime,
      });

      return response;

    } catch (error) {
      // 更新失败指标
      this.updateFailureMetrics(error);

      // 触发事件
      this.emit('requestFailure', {
        provider: this.config.provider,
        request,
        error,
        responseTime: Date.now() - startTime,
      });

      throw error;
    }
  }

  /**
   * 流式聊天请求
   */
  async *chatStream(request: ModelRequest): AsyncIterator<Partial<ModelResponse>> {
    this.ensureInitialized();
    
    if (!this.config.capabilities.streaming) {
      throw new Error(`${this.config.provider} 不支持流式响应`);
    }

    await this.rateLimiter.waitForSlot();
    
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      this.validateRequest(request);

      // 调用具体实现的流式方法
      const stream = this.sendStreamRequest(request);
      
      for await (const chunk of stream) {
        yield chunk;
      }

      const responseTime = Date.now() - startTime;
      this.metrics.successfulRequests++;
      this.updateAverageResponseTime(responseTime);

    } catch (error) {
      this.updateFailureMetrics(error);
      throw error;
    }
  }

  /**
   * 获取模型信息
   */
  getModelInfo(): ModelConfig {
    return { ...this.config };
  }

  /**
   * 获取模型指标
   */
  getMetrics(): ModelMetrics {
    return { ...this.metrics };
  }

  /**
   * 检查模型健康状态
   */
  async healthCheck(): Promise<boolean> {
    try {
      const testRequest: ModelRequest = {
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        maxTokens: 10,
        temperature: 0,
      };

      await this.chat(testRequest);
      return true;
    } catch (error) {
      console.warn(`⚠️ ${this.config.provider} 健康检查失败:`, error);
      return false;
    }
  }

  /**
   * 估算请求成本
   */
  estimateCost(request: ModelRequest): number {
    const inputTokens = this.estimateTokens(
      request.messages.map(m => m.content).join(' ')
    );
    const outputTokens = request.maxTokens || this.config.maxTokens;
    
    return (inputTokens + outputTokens) * this.config.costPerToken;
  }

  /**
   * 关闭适配器
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      await this.cleanup();
      this.isInitialized = false;
      console.log(`✅ ${this.config.provider} 模型适配器已关闭`);
    } catch (error) {
      console.error(`❌ ${this.config.provider} 模型适配器关闭失败:`, error);
      throw error;
    }
  }

  // 抽象方法，子类必须实现

  /**
   * 发送请求到具体的AI提供商
   */
  protected abstract sendRequest(request: ModelRequest): Promise<ModelResponse>;

  /**
   * 发送流式请求
   */
  protected abstract sendStreamRequest(request: ModelRequest): AsyncIterator<Partial<ModelResponse>>;

  /**
   * 验证配置
   */
  protected abstract validateConfig(): Promise<void>;

  /**
   * 测试连接
   */
  protected abstract testConnection(): Promise<void>;

  /**
   * 清理资源
   */
  protected abstract cleanup(): Promise<void>;

  // 受保护的辅助方法

  protected ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error(`${this.config.provider} 模型适配器尚未初始化`);
    }
  }

  protected validateRequest(request: ModelRequest): void {
    if (!request.messages || request.messages.length === 0) {
      throw new Error('请求消息不能为空');
    }

    if (request.maxTokens && request.maxTokens > this.config.maxTokens) {
      throw new Error(`请求的最大token数超过模型限制: ${this.config.maxTokens}`);
    }

    if (request.temperature && (request.temperature < 0 || request.temperature > 2)) {
      throw new Error('temperature 必须在 0-2 之间');
    }
  }

  protected updateSuccessMetrics(response: ModelResponse, responseTime: number): void {
    this.metrics.successfulRequests++;
    this.metrics.totalCost += response.cost;
    this.metrics.lastRequestAt = new Date();
    this.updateAverageResponseTime(responseTime);
    this.updateErrorRate();
  }

  protected updateFailureMetrics(error: any): void {
    this.metrics.failedRequests++;
    this.updateErrorRate();
  }

  private updateAverageResponseTime(responseTime: number): void {
    const totalSuccessful = this.metrics.successfulRequests;
    const currentAverage = this.metrics.averageResponseTime;
    
    this.metrics.averageResponseTime = 
      ((currentAverage * (totalSuccessful - 1)) + responseTime) / totalSuccessful;
  }

  private updateErrorRate(): void {
    this.metrics.errorRate = this.metrics.failedRequests / this.metrics.totalRequests;
  }

  protected estimateTokens(text: string): number {
    // 简单的token估算，实际应用中可以使用更精确的方法
    return Math.ceil(text.length / 4);
  }

  protected formatError(error: any): Error {
    if (error instanceof Error) {
      return error;
    }
    
    return new Error(typeof error === 'string' ? error : JSON.stringify(error));
  }
}

/**
 * 速率限制器
 */
class RateLimiter {
  private requestQueue: number[] = [];
  private tokenQueue: number[] = [];
  private config: { requestsPerMinute: number; tokensPerMinute: number };

  constructor(config: { requestsPerMinute: number; tokensPerMinute: number }) {
    this.config = config;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // 清理过期的请求记录
    this.requestQueue = this.requestQueue.filter(time => time > oneMinuteAgo);

    // 检查是否超过请求限制
    if (this.requestQueue.length >= this.config.requestsPerMinute) {
      const oldestRequest = this.requestQueue[0];
      const waitTime = oldestRequest + 60000 - now;
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // 记录当前请求
    this.requestQueue.push(now);
  }

  recordTokenUsage(tokens: number): void {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // 清理过期的token记录
    this.tokenQueue = this.tokenQueue.filter(time => time > oneMinuteAgo);

    // 记录token使用
    for (let i = 0; i < tokens; i++) {
      this.tokenQueue.push(now);
    }
  }

  getUsage(): { requests: number; tokens: number } {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    const recentRequests = this.requestQueue.filter(time => time > oneMinuteAgo);
    const recentTokens = this.tokenQueue.filter(time => time > oneMinuteAgo);

    return {
      requests: recentRequests.length,
      tokens: recentTokens.length,
    };
  }
}