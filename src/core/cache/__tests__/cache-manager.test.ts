import { CacheManager, CacheKeys } from '../cache-manager';
import { CacheConfig } from '../../../types/cache';

describe('CacheManager', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    const config: CacheConfig = {
      enabled: true,
      l1: { enabled: true, maxSize: 10, ttl: 60 },
      l2: { enabled: false, ttl: 3600 }
    };
    cacheManager = new CacheManager(config);
  });

  it('should set and get value', () => {
    cacheManager.set('test-key', 'test-value');
    const value = cacheManager.get('test-key');

    expect(value).toBe('test-value');
  });

  it('should return undefined for non-existent key', () => {
    const value = cacheManager.get('non-existent');
    expect(value).toBeUndefined();
  });

  it('should delete value', () => {
    cacheManager.set('test-key', 'test-value');
    cacheManager.delete('test-key');

    const value = cacheManager.get('test-key');
    expect(value).toBeUndefined();
  });

  it('should clear all cache', () => {
    cacheManager.set('key1', 'value1');
    cacheManager.set('key2', 'value2');

    cacheManager.clear();

    expect(cacheManager.get('key1')).toBeUndefined();
    expect(cacheManager.get('key2')).toBeUndefined();
  });

  it('should check if key exists', () => {
    cacheManager.set('test-key', 'test-value');

    expect(cacheManager.has('test-key')).toBe(true);
    expect(cacheManager.has('non-existent')).toBe(false);
  });

  it('should increment counter', () => {
    cacheManager.set('counter', 0);
    cacheManager.increment('counter', 5);

    expect(cacheManager.get('counter')).toBe(5);
  });
});
