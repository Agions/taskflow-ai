/**
 * Cache Types
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
