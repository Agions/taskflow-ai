/**
 * 性能监控系统
 * 提供方法执行时间监控、内存使用监控和性能报告
 */

import { PerformanceMetrics, PerformanceThresholds } from '../../types/strict-types';
import { Logger } from '../../infra/logger';
// PerformanceError 未使用，已移除

/**
 * 性能监控管理器
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetrics[]> = new Map();
  private thresholds: Map<string, PerformanceThresholds> = new Map();
  private logger: Logger;

  private constructor() {
    // 简化Logger初始化，避免构造函数问题
    this.logger = ({
      info: (message: string, meta?: Record<string, unknown>) => console.log(`[INFO] ${message}`, meta),
      warn: (message: string, meta?: Record<string, unknown>) => console.warn(`[WARN] ${message}`, meta),
      error: (message: string, meta?: Record<string, unknown>) => console.error(`[ERROR] ${message}`, meta),
      debug: (message: string, meta?: Record<string, unknown>) => console.debug(`[DEBUG] ${message}`, meta),
      log: (level: string, message: string, meta?: Record<string, unknown>) => console.log(`[${level.toUpperCase()}] ${message}`, meta),
      updateConfig: () => { /* no-op */ }
    } as unknown) as Logger;
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 设置性能阈值
   */
  public setThresholds(operation: string, thresholds: PerformanceThresholds): void {
    this.thresholds.set(operation, thresholds);
  }

  /**
   * 记录性能指标
   */
  public recordMetrics(operation: string, metrics: PerformanceMetrics): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const operationMetrics = this.metrics.get(operation)!;
    operationMetrics.push({
      ...metrics,
      timestamp: Date.now()
    } as PerformanceMetrics & { timestamp: number });

    // 保持最近100条记录
    if (operationMetrics.length > 100) {
      operationMetrics.shift();
    }

    // 检查是否超过阈值
    this.checkThresholds(operation, metrics);
  }

  /**
   * 检查性能阈值
   */
  private checkThresholds(operation: string, metrics: PerformanceMetrics): void {
    const thresholds = this.thresholds.get(operation);
    if (!thresholds) return;

    const warnings: string[] = [];

    if (metrics.executionTime > thresholds.maxExecutionTime) {
      warnings.push(`执行时间超过阈值: ${metrics.executionTime}ms > ${thresholds.maxExecutionTime}ms`);
    }

    if (metrics.memoryUsage > thresholds.maxMemoryUsage) {
      warnings.push(`内存使用超过阈值: ${metrics.memoryUsage}MB > ${thresholds.maxMemoryUsage}MB`);
    }

    if (metrics.cacheHitRate < thresholds.minCacheHitRate) {
      warnings.push(`缓存命中率低于阈值: ${metrics.cacheHitRate}% < ${thresholds.minCacheHitRate}%`);
    }

    if (metrics.errorRate > thresholds.maxErrorRate) {
      warnings.push(`错误率超过阈值: ${metrics.errorRate}% > ${thresholds.maxErrorRate}%`);
    }

    if (warnings.length > 0) {
      this.logger.warn(`性能警告 [${operation}]:`, { warnings, metrics });
    }
  }

  /**
   * 获取操作的性能统计
   */
  public getStats(operation: string): {
    avgExecutionTime: number;
    maxExecutionTime: number;
    minExecutionTime: number;
    avgMemoryUsage: number;
    avgCacheHitRate: number;
    avgErrorRate: number;
    totalCalls: number;
  } | null {
    const metrics = this.metrics.get(operation);
    if (!metrics || metrics.length === 0) return null;

    const executionTimes = metrics.map(m => m.executionTime);
    const memoryUsages = metrics.map(m => m.memoryUsage);
    const cacheHitRates = metrics.map(m => m.cacheHitRate);
    const errorRates = metrics.map(m => m.errorRate);

    return {
      avgExecutionTime: executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length,
      maxExecutionTime: Math.max(...executionTimes),
      minExecutionTime: Math.min(...executionTimes),
      avgMemoryUsage: memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length,
      avgCacheHitRate: cacheHitRates.reduce((a, b) => a + b, 0) / cacheHitRates.length,
      avgErrorRate: errorRates.reduce((a, b) => a + b, 0) / errorRates.length,
      totalCalls: metrics.length
    };
  }

  /**
   * 生成性能报告
   */
  public generateReport(): string {
    const report: string[] = ['=== 性能监控报告 ===\n'];

    for (const [operation] of this.metrics.entries()) {
      const stats = this.getStats(operation);
      if (!stats) continue;

      report.push(`操作: ${operation}`);
      report.push(`  总调用次数: ${stats.totalCalls}`);
      report.push(`  平均执行时间: ${stats.avgExecutionTime.toFixed(2)}ms`);
      report.push(`  最大执行时间: ${stats.maxExecutionTime.toFixed(2)}ms`);
      report.push(`  最小执行时间: ${stats.minExecutionTime.toFixed(2)}ms`);
      report.push(`  平均内存使用: ${stats.avgMemoryUsage.toFixed(2)}MB`);
      report.push(`  平均缓存命中率: ${stats.avgCacheHitRate.toFixed(2)}%`);
      report.push(`  平均错误率: ${stats.avgErrorRate.toFixed(2)}%`);
      report.push('');
    }

    return report.join('\n');
  }

  /**
   * 清除指定操作的性能数据
   */
  public clearMetrics(operation?: string): void {
    if (operation) {
      this.metrics.delete(operation);
    } else {
      this.metrics.clear();
    }
  }
}

/**
 * 性能监控装饰器
 */
export function performanceMonitor(operationName?: string) {
  return function(target: Record<string, unknown>, propertyKey: string, descriptor?: PropertyDescriptor) {
    if (!descriptor) {
      descriptor = Object.getOwnPropertyDescriptor(target, propertyKey) || {
        value: target[propertyKey],
        writable: true,
        enumerable: true,
        configurable: true
      };
    }
    const originalMethod = descriptor.value;
    const operation = operationName || `${target.constructor.name}.${propertyKey}`;
    const monitor = PerformanceMonitor.getInstance();

    descriptor.value = async function(...args: unknown[]) {
      const startTime = performance.now();
      const startMemory = process.memoryUsage().heapUsed / 1024 / 1024; // MB

      let success = true;
      let result: unknown;

      try {
        result = await originalMethod.apply(this, args);
        return result;
      } catch (error) {
        success = false;
        throw error;
      } finally {
        const endTime = performance.now();
        const endMemory = process.memoryUsage().heapUsed / 1024 / 1024; // MB
        
        const metrics: PerformanceMetrics = {
          executionTime: endTime - startTime,
          memoryUsage: endMemory - startMemory,
          cpuUsage: 0, // 简化实现，实际项目中可以使用更精确的CPU监控
          cacheHitRate: 0, // 需要在具体实现中计算
          errorRate: success ? 0 : 100,
          throughput: 1000 / (endTime - startTime) // 每秒操作数
        };

        monitor.recordMetrics(operation, metrics);

        // 如果执行时间过长，记录警告而不是抛出异常
        const thresholds = monitor['thresholds'].get(operation);
        if (thresholds && metrics.executionTime > thresholds.maxExecutionTime) {
          console.warn(
            `操作 ${operation} 执行时间过长: ${metrics.executionTime}ms > ${thresholds.maxExecutionTime}ms`
          );
        }
      }
    };

    return descriptor;
  };
}

/**
 * 简单的内存缓存实现
 */
export class MemoryCache<T> {
  private cache: Map<string, { value: T; expiry: number; accessCount: number }> = new Map();
  private maxSize: number;
  private defaultTTL: number;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0
  };

  constructor(maxSize = 1000, defaultTTL = 300000) { // 5分钟默认TTL
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  /**
   * 设置缓存值
   */
  public set(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    
    // 如果缓存已满，删除最少使用的项
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLeastUsed();
    }

    this.cache.set(key, { value, expiry, accessCount: 0 });
  }

  /**
   * 获取缓存值
   */
  public get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.stats.misses++;
      return undefined;
    }

    entry.accessCount++;
    this.stats.hits++;
    return entry.value;
  }

  /**
   * 删除缓存值
   */
  public delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  public clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }

  /**
   * 获取缓存统计
   */
  public getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      size: this.cache.size,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
      missRate: total > 0 ? (this.stats.misses / total) * 100 : 0,
      evictionCount: this.stats.evictions,
      totalRequests: total
    };
  }

  /**
   * 删除最少使用的项
   */
  private evictLeastUsed(): void {
    let leastUsedKey: string | null = null;
    let leastAccessCount = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < leastAccessCount) {
        leastAccessCount = entry.accessCount;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
      this.stats.evictions++;
    }
  }

  /**
   * 清理过期项
   */
  public cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * 缓存装饰器
 */
export function cached(ttl?: number, keyGenerator?: (...args: unknown[]) => string) {
  const cache = new MemoryCache<unknown>();

  return function(target: Record<string, unknown>, propertyKey: string, descriptor?: PropertyDescriptor) {
    if (!descriptor) {
      descriptor = Object.getOwnPropertyDescriptor(target, propertyKey) || {
        value: target[propertyKey],
        writable: true,
        enumerable: true,
        configurable: true
      };
    }
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: unknown[]) {
      const cacheKey = keyGenerator ? 
        keyGenerator(...args) : 
        `${target.constructor.name}.${propertyKey}:${JSON.stringify(args)}`;

      // 尝试从缓存获取
      const cachedResult = cache.get(cacheKey);
      if (cachedResult !== undefined) {
        return cachedResult;
      }

      // 执行原方法
      const result = await originalMethod.apply(this, args);
      
      // 缓存结果
      cache.set(cacheKey, result, ttl);
      
      return result;
    };

    // 添加缓存管理方法
    const methodWithCache = descriptor.value as ((...args: unknown[]) => unknown) & { clearCache?: () => void; getCacheStats?: () => unknown };
    methodWithCache.clearCache = () => cache.clear();
    methodWithCache.getCacheStats = () => cache.getStats();

    return descriptor;
  };
}
