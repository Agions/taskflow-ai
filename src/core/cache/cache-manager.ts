/**
 * Cache Manager - 缓存管理器
 * TaskFlow AI v4.0
 */

export interface CacheConfig {
  enabled: boolean;
  l1: {
    enabled: boolean;
    maxSize: number;
    ttl: number; // seconds
  };
  l2: {
    enabled: boolean;
    ttl: number; // seconds
  };
}

export interface CacheEntry<T = unknown> {
  value: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

/**
 * L1 Cache - 内存缓存
 */
class L1Cache {
  private cache: Map<string, CacheEntry>;
  private maxSize: number;
  private defaultTtl: number;

  constructor(maxSize: number, defaultTtl: number) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTtl = defaultTtl;
  }

  set<T = unknown>(key: string, value: T, ttl?: number): void {
    this.evictIfNeeded();

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl,
      hits: 0
    });
  }

  get<T = unknown>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return undefined;
    }

    entry.hits++;
    return entry.value as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    this.cleanupExpired();
    return this.cache.size;
  }

  private isExpired(entry: CacheEntry): boolean {
    const age = Date.now() - entry.timestamp;
    return age > entry.ttl * 1000;
  }

  private cleanupExpired(): void {
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
      }
    }
  }

  private evictIfNeeded(): void {
    this.cleanupExpired();

    if (this.cache.size >= this.maxSize) {
      // LRU eviction
      const sorted = Array.from(this.cache.entries())
        .sort((a, b) => a[1].hits - b[1].hits);

      const evictCount = Math.floor(this.maxSize * 0.2);
      for (let i = 0; i < evictCount && i < sorted.length; i++) {
        this.cache.delete(sorted[i][0]);
      }
    }
  }
}

/**
 * Cache Manager
 */
export class CacheManager {
  private config: CacheConfig;
  private l1Cache?: L1Cache;
  // L2 cache can be Redis, etc.

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      l1: {
        enabled: config.l1?.enabled ?? true,
        maxSize: config.l1?.maxSize ?? 100,
        ttl: config.l1?.ttl ?? 600
      },
      l2: {
        enabled: config.l2?.enabled ?? false,
        ttl: config.l2?.ttl ?? 3600
      }
    };

    if (this.config.enabled && this.config.l1.enabled) {
      this.l1Cache = new L1Cache(
        this.config.l1.maxSize,
        this.config.l1.ttl
      );
    }
  }

  set<T = unknown>(key: string, value: T, ttl?: number): void {
    if (!this.config.enabled) return;

    this.l1Cache?.set(key, value, ttl);
    // L2 cache would go here
  }

  get<T = unknown>(key: string): T | undefined {
    if (!this.config.enabled) return undefined;

    return this.l1Cache?.get<T>(key);
  }

  delete(key: string): void {
    this.l1Cache?.delete(key);
    // L2 cache would go here
  }

  has(key: string): boolean {
    if (!this.config.enabled) return false;

    return this.l1Cache?.has(key) ?? false;
  }

  clear(): void {
    this.l1Cache?.clear();
    // L2 cache would go here
  }

  increment(key: string, amount: number = 1): number {
    const current = this.get<number>(key) || 0;
    const newValue = current + amount;
    this.set(key, newValue);
    return newValue;
  }

  size(): number {
    return this.l1Cache?.size() || 0;
  }

  getStats(): { size: number; hits: number; misses: number } {
    return {
      size: this.size(),
      hits: 0,
      misses: 0
    };
  }
}

/**
 * Cache Keys - 统一的缓存键生成器
 */
export class CacheKeys {
  static agent(agentId: string): string {
    return `agent:${agentId}`;
  }

  static workflow(workflowId: string): string {
    return `workflow:${workflowId}`;
  }

  static task(taskId: string): string {
    return `task:${taskId}`;
  }

  static tool(toolId: string): string {
    return `tool:${toolId}`;
  }

  static plugin(pluginId: string): string {
    return `plugin:${pluginId}`;
  }

  static aiRequest(provider: string, model: string): string {
    return `ai:${provider}:${model}`;
  }

  static aiResponse(provider: string, model: string): string {
    return `ai:response:${provider}:${model}`;
  }

  static custom(prefix: string, suffix: string): string {
    return `${prefix}:${suffix}`;
  }
}
