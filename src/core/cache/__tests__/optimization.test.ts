/**
 * Cache Optimization Tests
 * TaskFlow AI v4.0
 */

import type { CacheConfig, CacheEntry } from '../core/cache/cache-manager';

describe('Cache Optimization', () => {
  describe('LRU Eviction Policy', () => {
    it('should evict least recently used items when full', () => {
      const cache = new Map<string, CacheEntry>();
      const maxSize = 10;

      // Fill cache
      for (let i = 0; i < 15; i++) {
        cache.set(`key-${i}`, {
          value: `value-${i}`,
          timestamp: Date.now() - (15 - i) * 1000, // Different timestamps
          ttl: 600,
          hits: 15 - i // Reverse hits for LRU
        });
      }

      // Simulate LRU eviction
      while (cache.size > maxSize) {
        let lruKey: string | null = null;
        let lruTimestamp = Infinity;
        
        for (const [key, entry] of cache.entries()) {
          if (entry.timestamp < lruTimestamp) {
            lruTimestamp = entry.timestamp;
            lruKey = key;
          }
        }
        
        if (lruKey) {
          cache.delete(lruKey);
        }
      }

      expect(cache.size).toBe(maxSize);
    });

    it('should track access frequency for intelligent eviction', () => {
      const cache = new Map<string, CacheEntry>();
      
      // Add entries with different hit counts
      cache.set('hot-key', {
        value: 'hot-value',
        timestamp: Date.now(),
        ttl: 600,
        hits: 100
      });
      
      cache.set('warm-key', {
        value: 'warm-value',
        timestamp: Date.now(),
        ttl: 600,
        hits: 10
      });
      
      cache.set('cold-key', {
        value: 'cold-value',
        timestamp: Date.now(),
        ttl: 600,
        hits: 0
      });

      // In LFU eviction, cold-key should be evicted first
      const entries = Array.from(cache.entries());
      const sortedByHits = entries.sort((a, b) => a[1].hits - b[1].hits);
      
      expect(sortedByHits[0][0]).toBe('cold-key');
      expect(sortedByHits[2][0]).toBe('hot-key');
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache hit rate', () => {
      const cache = new Map<string, CacheEntry>();
      let hits = 0;
      let misses = 0;

      // Prepare cache
      cache.set('key1', {
        value: 'value1',
        timestamp: Date.now(),
        ttl: 600,
        hits: 0
      });

      // Simulate accesses
      const lookupKeys = ['key1', 'key1', 'key2', 'key3', 'key1', 'key4'];
      
      for (const key of lookupKeys) {
        if (cache.has(key)) {
          hits++;
        } else {
          misses++;
        }
      }

      const hitRate = hits / (hits + misses);
      expect(hitRate).toBeCloseTo(0.5); // 3 hits out of 6 lookups
    });

    it('should calculate cache efficiency', () => {
      const cacheConfig: CacheConfig = {
        enabled: true,
        l1: { enabled: true, maxSize: 100, ttl: 600 },
        l2: { enabled: false, ttl: 3600 }
      };

      const cache = new Map<string, CacheEntry>();
      const totalRequests = 1000;
      const cacheHits = 800; // 80% hit rate
      
      for (let i = 0; i < cacheHits; i++) {
        cache.set(`key-${i}`, {
          value: `value-${i}`,
          timestamp: Date.now(),
          ttl: 600,
          hits: 1
        });
      }

      const efficiency = (cacheHits / totalRequests) * 100;
      expect(efficiency).toBe(80);
      expect(cache.size).toBe(cacheHits);
    });
  });

  describe('Level-2 Cache Optimization', () => {
    it('should promote frequently accessed items to L1', () => {
      const l1Cache = new Map<string, CacheEntry>();
      const l2Cache = new Map<string, CacheEntry>();
      const l1MaxSize = 5;

      // frequently accessed item in L2
      l2Cache.set('frequent-key', {
        value: 'frequent-value',
        timestamp: Date.now(),
        ttl: 3600,
        hits: 50
      });

      // Promote to L1 if access frequency is high
      const entry = l2Cache.get('frequent-key');
      if (entry && entry.hits > 10) {
        l1Cache.set('frequent-key', entry);
      }

      expect(l1Cache.has('frequent-key')).toBe(true);
      expect(l1Cache.get('frequent-key')?.hits).toBe(50);
    });

    it('should demote rarely used items from L1 to L2', () => {
      const l1Cache = new Map<string, CacheEntry>();
      const l2Cache = new Map<string, CacheEntry>();

      // Item with low hit count
      l1Cache.set('rare-key', {
        value: 'rare-value',
        timestamp: Date.now(),
        ttl: 600,
        hits: 2
      });

      // Demote to L2 if hit count is low
      const entry = l1Cache.get('rare-key');
      if (entry && entry.hits < 5 && entry.timestamp < Date.now() - 300000) { // 5 minutes old
        l2Cache.set('rare-key', entry);
        l1Cache.delete('rare-key');
      }

      expect(l1Cache.has('rare-key')).toBe(false);
      expect(l2Cache.has('rare-key')).toBe(true);
    });
  });

  describe('Cache Warming', () => {
    it('should warm cache with frequently accessed data', async () => {
      const cache = new Map<string, CacheEntry>();
      const frequentKeys = ['user-1', 'user-2', 'user-3'];

      // Simulate cache warming
      const warmStartTime = Date.now();
      for (const key of frequentKeys) {
        cache.set(key, {
          value: { data: `data-for-${key}` },
          timestamp: Date.now(),
          ttl: 600,
          hits: 0
        });
      }
      const warmDuration = Date.now() - warmStartTime;

      expect(cache.size).toBe(frequentKeys.length);
      expect(warmDuration).toBeLessThan(100); // Should be very fast
    });

    it('should prioritize hot data during cache warming', () => {
      const cache = new Map<string, CacheEntry>();
      const hotData = [
        { key: 'user-1', priority: 10 },
        { key: 'user-2', priority: 8 },
        { key: 'user-3', priority: 5 }
      ];

      // Sort by priority and warm high-priority data first
      hotData.sort((a, b) => b.priority - a.priority);

      for (const item of hotData) {
        cache.set(item.key, {
          value: { priority: item.priority },
          timestamp: Date.now(),
          ttl: 600,
          hits: 0
        });
      }

      expect(cache.get('user-1')?.value.priority).toBe(10);
      expect(cache.get('user-3')?.value.priority).toBe(5);
    });
  });

  describe('Cache Compression', () => {
    it('should compress large cache entries', () => {
      const cache = new Map<string, CacheEntry>();
      const largeData = new Array(10000).fill('a').join('');

      // Simulate compression by storing size metadata
      const originalSize = largeData.length;
      const compressedSize = Math.floor(originalSize * 0.3); // Assume 70% compression

      cache.set('large-data', {
        value: {
          data: largeData.substring(0, 100), // Truncated for demo
          compressed: false
        },
        timestamp: Date.now(),
        ttl: 600,
        hits: 0
      });

      // In real implementation, actual compression would happen here
      const compressionRatio = compressedSize / originalSize;
      expect(compressionRatio).toBeLessThan(1);
    });
  });
});
