/**
 * Rate Limiter - 基于滑动窗口的限流器
 * 支持多 provider 独立限流
 */

import { getLogger } from '../../utils/logger';

const logger = getLogger('core/network/rate-limiter');

export interface RateLimitConfig {
  /** 每分钟请求数 */
  rpm: number;
  /** 每秒请求数 */
  rps: number;
}

export interface RateLimitOptions {
  /** 限流配置 */
  limits?: Record<string, RateLimitConfig>;
  /** 默认 RPM */
  defaultRpm?: number;
  /** 默认 RPS */
  defaultRps?: number;
  /** 是否启用排队等待 */
  enableQueue?: boolean;
  /** 最大排队数，0 = 无限制 */
  maxQueueSize?: number;
  /** 排队超时 (ms) */
  queueTimeout?: number;
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
  refillRate: number;  // 每秒补充的 token 数
}

interface RequestRecord {
  timestamp: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitConfig> = new Map();
  private tokenBuckets: Map<string, TokenBucket> = new Map();
  private minuteWindows: Map<string, RequestRecord[]> = new Map();
  private secondWindows: Map<string, RequestRecord[]> = new Map();
  
  private defaultRpm: number;
  private defaultRps: number;
  private enableQueue: boolean;
  private maxQueueSize: number;
  private queueTimeout: number;
  
  private requestQueue: Array<{
    provider: string;
    resolve: () => void;
    reject: (error: Error) => void;
    enqueuedAt: number;
  }> = [];
  
  private processing = false;
  
  constructor(options: RateLimitOptions = {}) {
    this.defaultRpm = options.defaultRpm ?? 60;
    this.defaultRps = options.defaultRps ?? 10;
    this.enableQueue = options.enableQueue ?? true;
    this.maxQueueSize = options.maxQueueSize ?? 0;
    this.queueTimeout = options.queueTimeout ?? 30000;
    
    // 初始化配置
    if (options.limits) {
      for (const [provider, config] of Object.entries(options.limits)) {
        this.setLimit(provider, config);
      }
    }
    
    logger.info(`RateLimiter 初始化: defaultRpm=${this.defaultRpm}, defaultRps=${this.defaultRps}`);
  }
  
  /**
   * 设置单个 provider 的限流配置
   */
  setLimit(provider: string, config: RateLimitConfig): void {
    this.limits.set(provider, config);
    
    // 初始化 token bucket
    this.tokenBuckets.set(provider, {
      tokens: config.rps,
      lastRefill: Date.now(),
      refillRate: config.rps,
    });
    
    // 初始化滑动窗口
    if (!this.minuteWindows.has(provider)) {
      this.minuteWindows.set(provider, []);
    }
    if (!this.secondWindows.has(provider)) {
      this.secondWindows.set(provider, []);
    }
    
    logger.debug(`设置限流: provider=${provider}, rpm=${config.rpm}, rps=${config.rps}`);
  }
  
  /**
   * 获取限流配置
   */
  getLimit(provider: string): RateLimitConfig {
    return this.limits.get(provider) ?? {
      rpm: this.defaultRpm,
      rps: this.defaultRps,
    };
  }
  
  /**
   * 尝试获取限流令牌 (非阻塞)
   * @returns true 表示可以发送请求，false 表示被限流
   */
  tryAcquire(provider: string): boolean {
    const config = this.getLimit(provider);
    const now = Date.now();
    
    // 检查 RPM (滑动窗口)
    if (!this.checkMinuteWindow(provider, config.rpm, now)) {
      return false;
    }
    
    // 检查 RPS (Token Bucket)
    if (!this.consumeToken(provider)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 获取限流令牌 (阻塞等待)
   * @throws 超时时抛出错误
   */
  async acquire(provider: string): Promise<void> {
    const config = this.getLimit(provider);
    const now = Date.now();
    
    // 如果当前可以发送，直接返回
    if (this.tryAcquire(provider)) {
      return;
    }
    
    // 不能发送，进入队列等待
    if (this.enableQueue) {
      return this.waitInQueue(provider, config);
    }
    
    // 不允许等待，抛出错误
    throw new Error(`Rate limit exceeded for ${provider}. Try again later.`);
  }
  
  /**
   * 异步等待直到可以发送请求
   */
  private async waitInQueue(provider: string, config: RateLimitConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      // 检查队列长度
      if (this.maxQueueSize > 0 && this.requestQueue.length >= this.maxQueueSize) {
        reject(new Error(`Queue full for ${provider}`));
        return;
      }
      
      const entry = {
        provider,
        resolve,
        reject,
        enqueuedAt: Date.now(),
      };
      
      this.requestQueue.push(entry);
      this.processQueue();
    });
  }
  
  /**
   * 处理队列
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.requestQueue.length === 0) {
      return;
    }
    
    this.processing = true;
    
    while (this.requestQueue.length > 0) {
      const entry = this.requestQueue[0];
      const config = this.getLimit(entry.provider);
      
      // 检查超时
      if (Date.now() - entry.enqueuedAt > this.queueTimeout) {
        this.requestQueue.shift();
        entry.reject(new Error(`Timeout waiting for rate limit for ${entry.provider}`));
        continue;
      }
      
      // 尝试获取令牌
      if (this.tryAcquire(entry.provider)) {
        this.requestQueue.shift();
        entry.resolve();
      } else {
        // 等待一段时间后重试
        await this.sleep(50);
      }
    }
    
    this.processing = false;
  }
  
  /**
   * 检查分钟级滑动窗口
   */
  private checkMinuteWindow(provider: string, rpm: number, now: number): boolean {
    let window = this.minuteWindows.get(provider);
    if (!window) {
      window = [];
      this.minuteWindows.set(provider, window);
    }
    
    // 清理超过 1 分钟的记录
    const cutoff = now - 60000;
    while (window.length > 0 && window[0].timestamp < cutoff) {
      window.shift();
    }
    
    // 检查是否超过限制
    if (window.length >= rpm) {
      return false;
    }
    
    // 记录本次请求
    window.push({ timestamp: now });
    return true;
  }
  
  /**
   * 消费 Token (Token Bucket 算法)
   */
  private consumeToken(provider: string): boolean {
    let bucket = this.tokenBuckets.get(provider);
    if (!bucket) {
      const config = this.getLimit(provider);
      bucket = {
        tokens: config.rps,
        lastRefill: Date.now(),
        refillRate: config.rps,
      };
      this.tokenBuckets.set(provider, bucket);
    }
    
    const now = Date.now();
    const elapsed = (now - bucket.lastRefill) / 1000;
    
    // 补充 tokens
    bucket.tokens = Math.min(
      bucket.refillRate,
      bucket.tokens + elapsed * bucket.refillRate
    );
    bucket.lastRefill = now;
    
    // 消费一个 token
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }
    
    return false;
  }
  
  /**
   * 获取当前 provider 的等待时间 (ms)
   */
  getWaitTime(provider: string): number {
    const bucket = this.tokenBuckets.get(provider);
    if (!bucket) return 0;
    
    if (bucket.tokens >= 1) return 0;
    
    return Math.ceil((1 - bucket.tokens) / bucket.refillRate * 1000);
  }
  
  /**
   * 获取统计信息
   */
  getStats(): {
    providers: string[];
    queueSize: number;
    limits: Record<string, RateLimitConfig>;
  } {
    return {
      providers: Array.from(this.limits.keys()),
      queueSize: this.requestQueue.length,
      limits: Object.fromEntries(this.limits),
    };
  }
  
  /**
   * 重置限流器
   */
  reset(): void {
    this.tokenBuckets.clear();
    this.minuteWindows.clear();
    this.secondWindows.clear();
    this.requestQueue = [];
    logger.debug('RateLimiter 已重置');
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 默认限流配置
export const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  deepseek: { rpm: 60, rps: 10 },
  openai: { rpm: 500, rps: 100 },
  anthropic: { rpm: 100, rps: 20 },
  zhipu: { rpm: 60, rps: 10 },
  qwen: { rpm: 60, rps: 10 },
  baidu: { rpm: 60, rps: 10 },
};
