/**
 * Cache Module - 多级缓存系统
 * L1: 内存缓存 (LRU/LFU)
 * L2: 本地文件缓存 (持久化)
 */

export { MemoryCache } from './memory-cache';
export type { MemoryCacheOptions } from './memory-cache';

export { LocalCache } from './local-cache';
export type { LocalCacheOptions } from './local-cache';

// Re-export CacheManager and types from cache-manager
import { CacheManager, CacheKeys } from './cache-manager';
import type { CacheOptions, CacheStats } from './cache-manager';

export { CacheManager, CacheKeys };
export type { CacheOptions, CacheStats };
