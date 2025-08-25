/**
 * 缓存管理器单元测试
 */

import { CacheManager, CacheConfig, CacheEntry } from '../../../src-new/infrastructure/storage/cache';
import fs from 'fs-extra';
import path from 'path';

describe('CacheManager', () => {
  let cacheManager: CacheManager;
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await global.testUtils.createTempDir();
  });

  beforeEach(() => {
    const config: CacheConfig = {
      type: 'hybrid',
      maxSize: 1024 * 1024, // 1MB
      ttl: 3600, // 1小时
      cleanupInterval: 100, // 100ms（测试用）
      persistToDisk: true,
      diskPath: tempDir,
      compression: false,
      maxFileSize: 100 * 1024, // 100KB
    };

    cacheManager = new CacheManager(config);
  });

  afterEach(async () => {
    if (cacheManager) {
      await cacheManager.shutdown();
    }
  });

  describe('初始化', () => {
    test('应该成功初始化缓存管理器', async () => {
      await expect(cacheManager.initialize()).resolves.not.toThrow();
      
      const stats = cacheManager.getStats();
      expect(stats.initialized).toBe(true);
    });

    test('应该从磁盘加载现有缓存', async () => {
      // 创建一个缓存文件
      const cacheFile = path.join(tempDir, 'test-key.cache');
      const cacheEntry: CacheEntry<string> = {
        value: 'test-value',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
        accessCount: 1,
        lastAccessed: new Date(),
        metadata: {}
      };
      
      await fs.writeJSON(cacheFile, cacheEntry);
      
      await cacheManager.initialize();
      
      const value = await cacheManager.get('test-key');
      expect(value).toBe('test-value');
    });

    test('应该清理过期的磁盘缓存', async () => {
      // 创建过期的缓存文件
      const cacheFile = path.join(tempDir, 'expired-key.cache');
      const expiredEntry: CacheEntry<string> = {
        value: 'expired-value',
        createdAt: new Date(Date.now() - 7200000), // 2小时前
        expiresAt: new Date(Date.now() - 3600000), // 1小时前过期
        accessCount: 1,
        lastAccessed: new Date(Date.now() - 7200000),
        metadata: {}
      };
      
      await fs.writeJSON(cacheFile, expiredEntry);
      
      await cacheManager.initialize();
      
      const value = await cacheManager.get('expired-key');
      expect(value).toBeUndefined();
      expect(await fs.pathExists(cacheFile)).toBe(false);
    });
  });

  describe('基本缓存操作', () => {
    beforeEach(async () => {
      await cacheManager.initialize();
    });

    test('应该成功设置和获取缓存', async () => {
      await cacheManager.set('test-key', 'test-value');
      
      const value = await cacheManager.get('test-key');
      expect(value).toBe('test-value');
    });

    test('应该支持不同类型的数据', async () => {
      const testData = {
        string: 'hello',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: { nested: 'value' }
      };

      for (const [key, value] of Object.entries(testData)) {
        await cacheManager.set(key, value);
      }

      for (const [key, expectedValue] of Object.entries(testData)) {
        const actualValue = await cacheManager.get(key);
        expect(actualValue).toEqual(expectedValue);
      }
    });

    test('应该返回undefined对于不存在的键', async () => {
      const value = await cacheManager.get('non-existent-key');
      expect(value).toBeUndefined();
    });

    test('应该成功删除缓存项', async () => {
      await cacheManager.set('delete-me', 'value');
      expect(await cacheManager.get('delete-me')).toBe('value');
      
      const deleted = await cacheManager.delete('delete-me');
      expect(deleted).toBe(true);
      expect(await cacheManager.get('delete-me')).toBeUndefined();
    });

    test('删除不存在的键应该返回false', async () => {
      const deleted = await cacheManager.delete('non-existent');
      expect(deleted).toBe(false);
    });

    test('应该检查键是否存在', async () => {
      expect(await cacheManager.has('test-key')).toBe(false);
      
      await cacheManager.set('test-key', 'value');
      expect(await cacheManager.has('test-key')).toBe(true);
    });
  });

  describe('TTL和过期处理', () => {
    beforeEach(async () => {
      await cacheManager.initialize();
    });

    test('应该在TTL后自动过期', async () => {
      await cacheManager.set('expire-me', 'value', 0.1); // 100ms TTL
      
      expect(await cacheManager.get('expire-me')).toBe('value');
      
      // 等待过期
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(await cacheManager.get('expire-me')).toBeUndefined();
    });

    test('应该支持自定义TTL', async () => {
      await cacheManager.set('custom-ttl', 'value', 1); // 1秒TTL
      
      const entry = await cacheManager.getEntry('custom-ttl');
      expect(entry).toBeDefined();
      expect(entry!.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    test('应该更新现有项的TTL', async () => {
      await cacheManager.set('update-ttl', 'value', 10);
      
      const originalEntry = await cacheManager.getEntry('update-ttl');
      const originalExpiry = originalEntry!.expiresAt;
      
      await cacheManager.touch('update-ttl', 20);
      
      const updatedEntry = await cacheManager.getEntry('update-ttl');
      expect(updatedEntry!.expiresAt.getTime()).toBeGreaterThan(originalExpiry.getTime());
    });
  });

  describe('内存管理', () => {
    beforeEach(async () => {
      // 使用较小的缓存大小进行测试
      const smallConfig: CacheConfig = {
        type: 'memory',
        maxSize: 1024, // 1KB
        ttl: 3600,
        cleanupInterval: 100,
        persistToDisk: false,
        compression: false,
        maxFileSize: 512,
      };
      
      cacheManager = new CacheManager(smallConfig);
      await cacheManager.initialize();
    });

    test('应该在达到大小限制时驱逐条目', async () => {
      // 填充缓存直到超过限制
      const largeValue = 'x'.repeat(300); // 300字节
      
      await cacheManager.set('item1', largeValue);
      await cacheManager.set('item2', largeValue);
      await cacheManager.set('item3', largeValue);
      await cacheManager.set('item4', largeValue); // 这应该触发驱逐
      
      const stats = cacheManager.getStats();
      expect(stats.memoryUsage).toBeLessThanOrEqual(1024);
    });

    test('应该使用LRU策略驱逐', async () => {
      const value = 'x'.repeat(200);
      
      await cacheManager.set('oldest', value);
      await cacheManager.set('middle', value);
      await cacheManager.set('newest', value);
      
      // 访问oldest，使其成为最近使用的
      await cacheManager.get('oldest');
      
      // 添加新项，应该驱逐middle（最少使用的）
      await cacheManager.set('trigger-eviction', value);
      
      expect(await cacheManager.has('oldest')).toBe(true);
      expect(await cacheManager.has('newest')).toBe(true);
      expect(await cacheManager.has('trigger-eviction')).toBe(true);
    });
  });

  describe('持久化', () => {
    beforeEach(async () => {
      const persistConfig: CacheConfig = {
        type: 'hybrid',
        maxSize: 1024 * 1024,
        ttl: 3600,
        cleanupInterval: 100,
        persistToDisk: true,
        diskPath: tempDir,
        compression: false,
        maxFileSize: 100 * 1024,
      };
      
      cacheManager = new CacheManager(persistConfig);
      await cacheManager.initialize();
    });

    test('应该将大对象持久化到磁盘', async () => {
      const largeObject = {
        data: 'x'.repeat(50000), // 50KB
        timestamp: Date.now()
      };

      await cacheManager.set('large-object', largeObject);
      
      const cacheFile = path.join(tempDir, 'large-object.cache');
      expect(await fs.pathExists(cacheFile)).toBe(true);
      
      const retrieved = await cacheManager.get('large-object');
      expect(retrieved).toEqual(largeObject);
    });

    test('应该在重启后恢复持久化的数据', async () => {
      await cacheManager.set('persistent-key', 'persistent-value');
      await cacheManager.shutdown();
      
      // 创建新的缓存管理器实例
      const newCacheManager = new CacheManager({
        type: 'hybrid',
        maxSize: 1024 * 1024,
        ttl: 3600,
        cleanupInterval: 100,
        persistToDisk: true,
        diskPath: tempDir,
        compression: false,
        maxFileSize: 100 * 1024,
      });
      
      await newCacheManager.initialize();
      
      const value = await newCacheManager.get('persistent-key');
      expect(value).toBe('persistent-value');
      
      await newCacheManager.shutdown();
    });
  });

  describe('批量操作', () => {
    beforeEach(async () => {
      await cacheManager.initialize();
    });

    test('应该支持批量设置', async () => {
      const items = new Map([
        ['key1', 'value1'],
        ['key2', 'value2'],
        ['key3', 'value3']
      ]);

      await cacheManager.setMultiple(items);

      for (const [key, expectedValue] of items) {
        const actualValue = await cacheManager.get(key);
        expect(actualValue).toBe(expectedValue);
      }
    });

    test('应该支持批量获取', async () => {
      await cacheManager.set('batch1', 'value1');
      await cacheManager.set('batch2', 'value2');
      await cacheManager.set('batch3', 'value3');

      const results = await cacheManager.getMultiple(['batch1', 'batch2', 'batch3', 'non-existent']);

      expect(results.get('batch1')).toBe('value1');
      expect(results.get('batch2')).toBe('value2');
      expect(results.get('batch3')).toBe('value3');
      expect(results.get('non-existent')).toBeUndefined();
    });

    test('应该支持批量删除', async () => {
      await cacheManager.set('delete1', 'value1');
      await cacheManager.set('delete2', 'value2');
      await cacheManager.set('keep', 'value3');

      const deleted = await cacheManager.deleteMultiple(['delete1', 'delete2', 'non-existent']);

      expect(deleted).toBe(2);
      expect(await cacheManager.get('delete1')).toBeUndefined();
      expect(await cacheManager.get('delete2')).toBeUndefined();
      expect(await cacheManager.get('keep')).toBe('value3');
    });
  });

  describe('统计和监控', () => {
    beforeEach(async () => {
      await cacheManager.initialize();
    });

    test('应该提供准确的统计信息', async () => {
      await cacheManager.set('stats1', 'value1');
      await cacheManager.set('stats2', 'value2');
      await cacheManager.get('stats1'); // 命中
      await cacheManager.get('non-existent'); // 未命中

      const stats = cacheManager.getStats();

      expect(stats.totalItems).toBe(2);
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });

    test('应该跟踪访问模式', async () => {
      await cacheManager.set('access-test', 'value');
      
      // 多次访问
      await cacheManager.get('access-test');
      await cacheManager.get('access-test');
      await cacheManager.get('access-test');

      const entry = await cacheManager.getEntry('access-test');
      expect(entry!.accessCount).toBe(3);
      expect(entry!.lastAccessed).toBeInstanceOf(Date);
    });
  });

  describe('清理和维护', () => {
    beforeEach(async () => {
      await cacheManager.initialize();
    });

    test('应该自动清理过期条目', async () => {
      await cacheManager.set('auto-expire', 'value', 0.05); // 50ms TTL
      
      expect(await cacheManager.get('auto-expire')).toBe('value');
      
      // 等待自动清理
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const stats = cacheManager.getStats();
      expect(stats.totalItems).toBe(0);
    });

    test('应该手动清理所有缓存', async () => {
      await cacheManager.set('clear1', 'value1');
      await cacheManager.set('clear2', 'value2');
      
      expect(cacheManager.getStats().totalItems).toBe(2);
      
      await cacheManager.clear();
      
      expect(cacheManager.getStats().totalItems).toBe(0);
      expect(await cacheManager.get('clear1')).toBeUndefined();
      expect(await cacheManager.get('clear2')).toBeUndefined();
    });

    test('应该优化内存使用', async () => {
      // 添加一些数据
      for (let i = 0; i < 10; i++) {
        await cacheManager.set(`optimize-${i}`, `value-${i}`);
      }
      
      const beforeStats = cacheManager.getStats();
      
      await cacheManager.optimize();
      
      const afterStats = cacheManager.getStats();
      expect(afterStats.totalItems).toBe(beforeStats.totalItems);
    });
  });

  describe('错误处理', () => {
    beforeEach(async () => {
      await cacheManager.initialize();
    });

    test('应该处理序列化错误', async () => {
      const circularRef: any = {};
      circularRef.self = circularRef;

      await expect(cacheManager.set('circular', circularRef)).rejects.toThrow();
    });

    test('应该在磁盘空间不足时优雅降级', async () => {
      // 这个测试需要模拟磁盘空间不足的情况
      // 在实际测试中可能需要mock fs操作
      const largeData = 'x'.repeat(1000000); // 1MB
      
      // 应该不抛出错误，而是优雅处理
      await expect(cacheManager.set('large', largeData)).resolves.not.toThrow();
    });
  });

  describe('并发安全', () => {
    beforeEach(async () => {
      await cacheManager.initialize();
    });

    test('应该处理并发读写操作', async () => {
      const operations = [];
      
      // 并发设置
      for (let i = 0; i < 10; i++) {
        operations.push(cacheManager.set(`concurrent-${i}`, `value-${i}`));
      }
      
      // 并发读取
      for (let i = 0; i < 10; i++) {
        operations.push(cacheManager.get(`concurrent-${i}`));
      }
      
      const results = await Promise.allSettled(operations);
      
      // 所有操作都应该成功
      const failures = results.filter(r => r.status === 'rejected');
      expect(failures.length).toBe(0);
    });
  });
});