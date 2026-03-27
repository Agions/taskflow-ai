/**
 * 速率限制器
 */

import { RateLimitData, SecuritySettings } from './types';

/**
 * 速率限制器
 */
export class RateLimiter {
  private store: Map<string, RateLimitData> = new Map();

  constructor(private settings: SecuritySettings['rateLimit']) {}

  /**
   * 检查速率限制
   */
  checkLimit(clientIP: string): boolean {
    if (!this.settings.enabled) {
      return true;
    }

    const now = Date.now();
    const windowMs = this.settings.windowMs;
    const maxRequests = this.settings.maxRequests;

    let clientData = this.store.get(clientIP);

    if (!clientData || now > clientData.resetTime) {
      clientData = { count: 1, resetTime: now + windowMs };
      this.store.set(clientIP, clientData);
      return true;
    }

    if (clientData.count >= maxRequests) {
      return false;
    }

    clientData.count++;
    return true;
  }

  /**
   * 获取存储条目数
   */
  getEntryCount(): number {
    return this.store.size;
  }

  /**
   * 清理过期条目
   */
  cleanup(): void {
    const now = Date.now();
    for (const [ip, data] of this.store.entries()) {
      if (now > data.resetTime) {
        this.store.delete(ip);
      }
    }
  }

  /**
   * 清空所有条目
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * 启动自动清理
   */
  startAutoCleanup(intervalMs: number = 60000): NodeJS.Timeout {
    return setInterval(() => this.cleanup(), intervalMs);
  }
}
