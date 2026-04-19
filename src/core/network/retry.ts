/**
 * Retry Handler - 带重试机制的请求封装
 * 支持指数退避、抖动、熔断器
 */

import { getLogger } from '../../utils/logger';

const logger = getLogger('core/network/retry');

export interface RetryOptions {
  /** 最大重试次数 */
  maxRetries?: number;
  /** 初始退避时间 (ms) */
  initialDelay?: number;
  /** 最大退避时间 (ms) */
  maxDelay?: number;
  /** 退避策略 */
  backoff?: 'fixed' | 'linear' | 'exponential';
  /** 是否添加随机抖动 */
  jitter?: boolean;
  /** 抖动比例 (0-1) */
  jitterFactor?: number;
  /** 重试条件判断 */
  retryCondition?: (error: any, attempt: number) => boolean;
  /** 熔断器：连续失败多少次后熔断 */
  circuitBreakerThreshold?: number;
  /** 熔断器：熔断后多久尝试恢复 (ms) */
  circuitBreakerTimeout?: number;
}

interface CircuitState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

export class RetryHandler {
  private maxRetries: number;
  private initialDelay: number;
  private maxDelay: number;
  private backoff: 'fixed' | 'linear' | 'exponential';
  private jitter: boolean;
  private jitterFactor: number;
  private retryCondition: (error: any, attempt: number) => boolean;
  private circuitBreakerThreshold: number;
  private circuitBreakerTimeout: number;

  private circuitStates: Map<string, CircuitState> = new Map();

  // 默认重试条件：网络错误、5xx、429
  private defaultRetryCondition = (error: any, attempt: number): boolean => {
    // 网络错误
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      return true;
    }

    // HTTP 5xx 错误
    if (error.status >= 500 && error.status < 600) {
      return true;
    }

    // HTTP 429 Too Many Requests
    if (error.status === 429) {
      return true;
    }

    return false;
  };

  constructor(options: RetryOptions = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.initialDelay = options.initialDelay ?? 1000;
    this.maxDelay = options.maxDelay ?? 30000;
    this.backoff = options.backoff ?? 'exponential';
    this.jitter = options.jitter ?? true;
    this.jitterFactor = options.jitterFactor ?? 0.2;
    this.retryCondition = options.retryCondition ?? this.defaultRetryCondition;
    this.circuitBreakerThreshold = options.circuitBreakerThreshold ?? 5;
    this.circuitBreakerTimeout = options.circuitBreakerTimeout ?? 60000;

    logger.debug(`RetryHandler 初始化: maxRetries=${this.maxRetries}, backoff=${this.backoff}`);
  }

  /**
   * 执行带重试的请求
   */
  async execute<T>(fn: () => Promise<T>, context?: string): Promise<T> {
    const contextStr = context ?? 'request';
    let lastError: any;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      // 检查熔断器
      if (contextStr && this.isCircuitOpen(contextStr)) {
        throw new Error(`Circuit breaker is open for ${contextStr}`);
      }

      try {
        const result = await fn();

        // 成功，重置熔断器
        if (contextStr) {
          this.recordSuccess(contextStr);
        }

        return result;
      } catch (error) {
        lastError = error;

        // 检查是否应该重试
        if (attempt < this.maxRetries && this.retryCondition(error, attempt + 1)) {
          // 计算延迟
          const delay = this.calculateDelay(attempt);

          const err = error as { message?: string; code?: string; status?: number };
          logger.warn(
            `重试 ${contextStr}: attempt=${attempt + 1}/${this.maxRetries}, ` +
              `delay=${delay}ms, error=${err.message ?? err.code ?? err.status}`
          );

          // 检查是否是熔断相关错误
          if (err.status === 429 || err.status === 503) {
            // 增加延迟
            await this.sleep(delay * 2);
          } else {
            await this.sleep(delay);
          }

          // 记录失败
          if (contextStr) {
            this.recordFailure(contextStr);
          }
        } else {
          // 不重试，直接抛出
          break;
        }
      }
    }

    throw lastError;
  }

  /**
   * 执行带重试的流式请求
   */
  async *executeStream<T>(generator: () => AsyncGenerator<T>, context?: string): AsyncGenerator<T> {
    const contextStr = context ?? 'stream';
    let lastError: any;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (contextStr && this.isCircuitOpen(contextStr)) {
        throw new Error(`Circuit breaker is open for ${contextStr}`);
      }

      try {
        const gen = generator();

        for await (const chunk of gen) {
          yield chunk;
        }

        if (contextStr) {
          this.recordSuccess(contextStr);
        }

        return;
      } catch (error) {
        lastError = error;

        if (attempt < this.maxRetries && this.retryCondition(error, attempt + 1)) {
          const delay = this.calculateDelay(attempt);

          logger.warn(
            `流式重试 ${contextStr}: attempt=${attempt + 1}/${this.maxRetries}, ` +
              `delay=${delay}ms`
          );

          await this.sleep(delay);

          if (contextStr) {
            this.recordFailure(contextStr);
          }
        } else {
          break;
        }
      }
    }

    throw lastError;
  }

  /**
   * 计算退避延迟
   */
  private calculateDelay(attempt: number): number {
    let delay: number;

    switch (this.backoff) {
      case 'fixed':
        delay = this.initialDelay;
        break;
      case 'linear':
        delay = this.initialDelay * (attempt + 1);
        break;
      case 'exponential':
      default:
        delay = this.initialDelay * Math.pow(2, attempt);
        break;
    }

    // 添加抖动
    if (this.jitter) {
      const jitterAmount = delay * this.jitterFactor;
      delay += Math.random() * jitterAmount * 2 - jitterAmount;
    }

    // 限制最大延迟
    return Math.min(delay, this.maxDelay);
  }

  /**
   * 熔断器：检查状态
   */
  private isCircuitOpen(context: string): boolean {
    const state = this.circuitStates.get(context);
    if (!state) return false;

    if (state.state === 'closed') return false;

    if (state.state === 'open') {
      // 检查是否超时可以尝试恢复
      if (Date.now() - state.lastFailure > this.circuitBreakerTimeout) {
        state.state = 'half-open';
        logger.info(`Circuit breaker 进入 half-open 状态: ${context}`);
        return false;
      }
      return true;
    }

    // half-open 状态，允许一个请求尝试
    return false;
  }

  /**
   * 熔断器：记录成功
   */
  private recordSuccess(context: string): void {
    const state = this.circuitStates.get(context);
    if (!state) return;

    if (state.state === 'half-open') {
      // 恢复成功，关闭熔断器
      state.state = 'closed';
      state.failures = 0;
      logger.info(`Circuit breaker 已恢复: ${context}`);
    }
  }

  /**
   * 熔断器：记录失败
   */
  private recordFailure(context: string): void {
    let state = this.circuitStates.get(context);
    if (!state) {
      state = { failures: 0, lastFailure: 0, state: 'closed' };
      this.circuitStates.set(context, state);
    }

    state.failures++;
    state.lastFailure = Date.now();

    if (state.failures >= this.circuitBreakerThreshold) {
      state.state = 'open';
      logger.warn(`Circuit breaker 已打开: ${context}, failures=${state.failures}`);
    }
  }

  /**
   * 重置熔断器
   */
  resetCircuit(context?: string): void {
    if (context) {
      this.circuitStates.delete(context);
    } else {
      this.circuitStates.clear();
    }
  }

  /**
   * 获取熔断器状态
   */
  getCircuitState(context: string): { state: string; failures: number } | null {
    const state = this.circuitStates.get(context);
    if (!state) return null;

    return {
      state: state.state,
      failures: state.failures,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
