/**
 * L1 Memory Cache - 基于 LRU 的内存缓存
 * 高性能，进程级，容量有限
 */

import { getLogger } from '../../utils/logger';

const logger = getLogger('core/cache/memory');

export interface MemoryCacheOptions {
  /** 最大条目数 */
  maxSize?: number;
  /** 最大内存占用 (MB) */
  maxMemory?: number;
  /** 默认 TTL (秒)，0 = 不过期 */
  ttl?: number;
  /** 淘汰策略 */
  evictionPolicy?: 'LRU' | 'LFU';
}

interface CacheEntry<V> {
  key: string;
  value: V;
  expiresAt: number | null;
  accessCount: number;
  lastAccessed: number;
  size: number; // 估算大小 (bytes)
}

export class MemoryCache<K extends string, V> {
  private cache: Map<K, CacheEntry<V>> = new Map();
  private accessOrder: K[] = []; // LRU 追踪
  private accessCountMap: Map<K, number> = new Map(); // LFU 计数

  private maxSize: number;
  private maxMemory: number;
  private defaultTtl: number;
  private evictionPolicy: 'LRU' | 'LFU';

  private currentMemory = 0;
  private hits = 0;
  private misses = 0;

  constructor(options: MemoryCacheOptions = {}) {
    this.maxSize = options.maxSize ?? 1000;
    this.maxMemory = (options.maxMemory ?? 50) * 1024 * 1024; // MB to bytes
    this.defaultTtl = options.ttl ?? 3600;
    this.evictionPolicy = options.evictionPolicy ?? 'LRU';

    logger.info(
      `MemoryCache 初始化: maxSize=${this.maxSize}, maxMemory=${this.maxMemory} bytes, ttl=${this.defaultTtl}s`
    );
  }

  /**
   * 获取缓存值
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return undefined;
    }

    // 检查过期
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.delete(key);
      this.misses++;
      return undefined;
    }

    // 更新访问信息
    this.hits++;
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    // 更新 LRU 顺序
    this.updateAccessOrder(key);

    return entry.value;
  }

  /**
   * 设置缓存值
   */
  set(key: K, value: V, ttl?: number): void {
    const size = this.estimateSize(value);

    // 如果已存在，先删除
    if (this.cache.has(key)) {
      this.delete(key);
    }

    // 检查内存限制
    while (this.currentMemory + size > this.maxMemory && this.cache.size > 0) {
      this.evictOne();
    }

    // 检查条目数限制
    while (this.cache.size >= this.maxSize && this.cache.size > 0) {
      this.evictOne();
    }

    const entry: CacheEntry<V> = {
      key,
      value,
      expiresAt: ttl
        ? Date.now() + ttl * 1000
        : this.defaultTtl
          ? Date.now() + this.defaultTtl * 1000
          : null,
      accessCount: 1,
      lastAccessed: Date.now(),
      size,
    };

    this.cache.set(key, entry);
    this.accessOrder.push(key);
    this.accessCountMap.set(key, 1);
    this.currentMemory += size;
  }

  /**
   * 检查键是否存在
   */
  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 删除单个键
   */
  delete(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.currentMemory -= entry.size;
    this.cache.delete(key);
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessCountMap.delete(key);

    return true;
  }

  /**
   * 使缓存失效 (支持模式匹配)
   */
  invalidate(pattern: string | RegExp): number {
    const regex = typeof pattern === 'string' ? new RegExp(pattern.replace(/\*/g, '.*')) : pattern;

    let count = 0;
    const keysToDelete: K[] = [];
    for (const key of Array.from(this.cache.keys())) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.delete(key);
      count++;
    }

    logger.debug(`缓存失效: pattern=${pattern}, count=${count}`);
    return count;
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.accessOrder = [];
    this.accessCountMap.clear();
    this.currentMemory = 0;

    logger.debug(`缓存已清空: ${size} 条目`);
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    size: number;
    memory: number;
    hits: number;
    misses: number;
    hitRate: number;
  } {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      memory: this.currentMemory,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   * 获取所有键
   */
  keys(): K[] {
    return Array.from(this.cache.keys());
  }

  /**
   * 获取条目数
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * 估算值的大小 (bytes)
   */
  private estimateSize(value: V): number {
    try {
      return JSON.stringify(value).length * 2; // UTF-16 编码
    } catch {
      return 1024; // 默认 1KB
    }
  }

  /**
   * 更新 LRU 访问顺序
   */
  private updateAccessOrder(key: K): void {
    if (this.evictionPolicy === 'LRU') {
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      this.accessOrder.push(key);
    }
  }

  /**
   * 淘汰一个条目
   */
  private evictOne(): void {
    if (this.cache.size === 0) return;

    let keyToEvict: K | undefined;

    if (this.evictionPolicy === 'LRU') {
      // 淘汰最久未访问的
      keyToEvict = this.accessOrder.shift();
    } else {
      // LFU: 淘汰访问次数最少的
      let minCount = Infinity;
      for (const [key, count] of Array.from(this.accessCountMap.entries())) {
        if (count < minCount) {
          minCount = count;
          keyToEvict = key;
        }
      }
    }

    if (keyToEvict) {
      this.delete(keyToEvict);
      logger.debug(`缓存淘汰: key=${keyToEvict}, policy=${this.evictionPolicy}`);
    }
  }
}
