/**
 * Cache Manager - 多级缓存管理器
 * 统一管理 L1 (内存) 和 L2 (本地文件) 缓存
 */

import { getLogger } from '../../utils/logger';
import { MemoryCache } from './memory-cache';
import { LocalCache } from './local-cache';

const logger = getLogger('core/cache/manager');

export interface CacheOptions {
  /** 是否启用 L1 缓存 (内存) */
  enableL1?: boolean;
  /** 是否启用 L2 缓存 (本地文件) */
  enableL2?: boolean;
  /** L1 最大条目数 */
  l1MaxSize?: number;
  /** L1 最大内存 (MB) */
  l1MaxMemory?: number;
  /** L1 TTL (秒) */
  l1Ttl?: number;
  /** L2 TTL (秒) */
  l2Ttl?: number;
  /** 缓存目录 */
  cacheDir?: string;
}

export interface CacheStats {
  l1: {
    size: number;
    memory: number;
    hits: number;
    misses: number;
    hitRate: number;
  };
  l2: {
    size: number;
    memory: number;
  };
  totalHits: number;
  totalMisses: number;
  hitRate: number;
}

/**
 * 缓存键名空间
 */
export const CacheKeys = {
  // PRD 缓存
  prd: (id: string) => `prd:${id}`,
  prdResult: (id: string) => `prd:${id}:result`,
  
  // AI 响应缓存
  aiResponse: (key: string) => `ai:response:${key}`,
  aiEmbedding: (text: string) => `ai:embedding:${text.slice(0, 100)}`,
  
  // 工作流缓存
  workflow: (id: string) => `workflow:${id}`,
  workflowState: (id: string) => `workflow:${id}:state`,
  
  // 用户配置缓存
  userConfig: (userId: string) => `user:config:${userId}`,
  userSession: (sessionId: string) => `user:session:${sessionId}`,
} as const;

export class CacheManager {
  private l1: MemoryCache<string, unknown> | null = null;
  private l2: LocalCache | null = null;
  private enableL1: boolean;
  private enableL2: boolean;
  
  constructor(options: CacheOptions = {}) {
    this.enableL1 = options.enableL1 ?? true;
    this.enableL2 = options.enableL2 ?? true;
    
    if (this.enableL1) {
      this.l1 = new MemoryCache<string, unknown>({
        maxSize: options.l1MaxSize ?? 500,
        maxMemory: options.l1MaxMemory ?? 30,  // 30MB
        ttl: options.l1Ttl ?? 300,  // 5 分钟
        evictionPolicy: 'LRU',
      });
    }
    
    if (this.enableL2) {
      this.l2 = new LocalCache({
        ttl: options.l2Ttl ?? 86400,  // 24 小时
        cacheDir: options.cacheDir,
      });
    }
    
    logger.info(`CacheManager 初始化: L1=${this.enableL1}, L2=${this.enableL2}`);
  }
  
  /**
   * 获取缓存值
   */
  get<T>(key: string): T | null {
    // L1 优先
    if (this.l1) {
      const value = this.l1.get(key);
      if (value !== undefined) {
        return value as T;
      }
    }
    
    // L2 次之
    if (this.l2) {
      const value = this.l2.get<T>(key);
      if (value !== null) {
        // 回填 L1
        if (this.l1) {
          this.l1.set(key, value);
        }
        return value;
      }
    }
    
    return null;
  }
  
  /**
   * 设置缓存值
   */
  set<T>(key: string, value: T, ttl?: number): void {
    // L1
    if (this.l1) {
      this.l1.set(key, value, ttl);
    }
    
    // L2
    if (this.l2) {
      this.l2.set(key, value, ttl);
    }
  }
  
  /**
   * 检查键是否存在
   */
  has(key: string): boolean {
    if (this.l1?.has(key)) return true;
    if (this.l2?.has(key)) return true;
    return false;
  }
  
  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    let deleted = false;
    if (this.l1?.delete(key)) deleted = true;
    if (this.l2?.delete(key)) deleted = true;
    return deleted;
  }
  
  /**
   * 使缓存失效 (支持模式匹配)
   */
  invalidate(pattern: string | RegExp): number {
    let count = 0;
    if (this.l1) count += this.l1.invalidate(pattern);
    if (this.l2) count += this.l2.invalidate(pattern);
    return count;
  }
  
  /**
   * 清空所有缓存
   */
  clear(): void {
    this.l1?.clear();
    this.l2?.clear();
    logger.info('缓存已清空');
  }
  
  /**
   * 获取统计信息
   */
  getStats(): CacheStats {
    const l1Stats = this.l1?.getStats() ?? { size: 0, memory: 0, hits: 0, misses: 0, hitRate: 0 };
    const l2Stats = this.l2?.getStats() ?? { size: 0, memory: 0 };
    
    const totalHits = l1Stats.hits;
    const totalMisses = l1Stats.misses;
    const total = totalHits + totalMisses;
    
    return {
      l1: l1Stats as any,
      l2: l2Stats as any,
      totalHits,
      totalMisses,
      hitRate: total > 0 ? totalHits / total : 0,
    };
  }
  
  /**
   * 关闭缓存
   */
  close(): void {
    this.l1?.clear();
    this.l2?.close();
  }
}

// 全局缓存管理器实例
let globalCacheManager: CacheManager | null = null;

/**
 * 获取全局缓存管理器
 */
export function getCacheManager(options?: CacheOptions): CacheManager {
  if (!globalCacheManager) {
    globalCacheManager = new CacheManager(options);
  }
  return globalCacheManager;
}
