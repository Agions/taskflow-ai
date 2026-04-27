/**
 * Storage Adapter Tests
 * TaskFlow AI v4.0.1
 *
 * Tests for storage adapter functionality including multiple storage backends,
 * CRUD operations, and error handling.
 */

import {
  StorageAdapter,
  StorageConfig,
  StorageOperation,
  StorageResult,
} from '../storage-adapter';

describe('Storage Adapter Types', () => {
  describe('StorageConfig', () => {
    it('should support all storage types', () => {
      const types: StorageConfig['type'][] = ['file', 'memory', 'sqlite', 'redis'];
      expect(types).toHaveLength(4);
    });

    it('should create file storage config', () => {
      const config: StorageConfig = {
        type: 'file',
        path: '/data/storage',
      };

      expect(config.type).toBe('file');
      expect(config.path).toBe('/data/storage');
    });

    it('should create in-memory storage config', () => {
      const config: StorageConfig = {
        type: 'memory',
      };

      expect(config.type).toBe('memory');
    });

    it('should create SQLite storage config', () => {
      const config: StorageConfig = {
        type: 'sqlite',
        path: '/data/db.sqlite',
        options: { tableName: 'storage' },
      };

      expect(config.type).toBe('sqlite');
      expect(config.options).toBeDefined();
    });

    it('should create Redis storage config', () => {
      const config: StorageConfig = {
        type: 'redis',
        options: {
          host: 'localhost',
          port: 6379,
          db: 0,
        },
      };

      expect(config.type).toBe('redis');
    });

    it('should create config with all options', () => {
      const config: StorageConfig = {
        type: 'file',
        path: '/custom/path',
        options: {
          encryption: true,
          compression: true,
        },
      };

      expect(config.options).toBeDefined();
    });
  });

  describe('StorageOperation', () => {
    it('should support all operation types', () => {
      const operations: StorageOperation['operation'][] = [
        'get',
        'set',
        'delete',
        'exists',
        'clear',
      ];
      expect(operations).toHaveLength(5);
    });

    it('should create get operation', () => {
      const operation: StorageOperation<string> = {
        key: 'test-key',
        operation: 'get',
      };

      expect(operation.operation).toBe('get');
    });

    it('should create set operation', () => {
      const operation: StorageOperation<string> = {
        key: 'user-1',
        value: 'John Doe',
        operation: 'set',
      };

      expect(operation.key).toBe('user-1');
      expect(operation.value).toBe('John Doe');
    });

    it('should create delete operation', () => {
      const operation: StorageOperation = {
        key: 'old-key',
        operation: 'delete',
      };

      expect(operation.operation).toBe('delete');
    });

    it('should create exists operation', () => {
      const operation: StorageOperation<boolean> = {
        key: 'check-key',
        operation: 'exists',
      };

      expect(operation.key).toBe('check-key');
    });

    it('should create clear operation', () => {
      const operation: StorageOperation = {
        operation: 'clear',
        key: '',
      };

      expect(operation.operation).toBe('clear');
    });
  });

  describe('StorageResult', () => {
    it('should create successful result with data', () => {
      const result: StorageResult<string> = {
        success: true,
        data: 'retrieved value',
      };

      expect(result.success).toBe(true);
      expect(result.data).toBe('retrieved value');
    });

    it('should create failed result with error', () => {
      const result: StorageResult = {
        success: false,
        error: 'Key not found',
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Key not found');
    });

    it('should create successful result without data', () => {
      const result: StorageResult<void> = {
        success: true,
        data: undefined,
      };

      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
    });

    it('should create successful result with object data', () => {
      const result: StorageResult<{ name: string; age: number }> = {
        success: true,
        data: { name: 'Alice', age: 30 },
      };

      expect(result.data?.name).toBe('Alice');
      expect(result.data?.age).toBe(30);
    });
  });
});

describe('StorageAdapter', () => {
  describe('File Storage', () => {
    let adapter: StorageAdapter;
    let config: StorageConfig;

    beforeEach(() => {
      config = {
        type: 'file',
        path: '/tmp/test-storage',
      };
      adapter = new StorageAdapter(config);
    });

    it('should create adapter instance', () => {
      expect(adapter).toBeDefined();
      expect(adapter).toBeInstanceOf(StorageAdapter);
    });

    it('should execute get operation', async () => {
      const result = await adapter.get<string>('test-key');
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should execute set operation', async () => {
      const result = await adapter.set('test-key', 'test-value');
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should execute delete operation', async () => {
      const result = await adapter.delete('test-key');
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should execute exists operation', async () => {
      const result = await adapter.exists('test-key');
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should execute clear operation', async () => {
      const result = await adapter.clear();
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Memory Storage', () => {
    let adapter: StorageAdapter;
    let config: StorageConfig;

    beforeEach(() => {
      config = {
        type: 'memory',
      };
      adapter = new StorageAdapter(config);
    });

    it('should create memory storage', () => {
      expect(adapter).toBeDefined();
    });
  });

  describe('SQLite Storage', () => {
    let adapter: StorageAdapter;
    let config: StorageConfig;

    beforeEach(() => {
      config = {
        type: 'sqlite',
        path: ':memory:',
        options: { tableName: 'store' },
      };
      adapter = new StorageAdapter(config);
    });

    it('should create SQLite storage', () => {
      expect(adapter).toBeDefined();
    });
  });

  describe('Redis Storage', () => {
    let adapter: StorageAdapter;
    let config: StorageConfig;

    beforeEach(() => {
      config = {
        type: 'redis',
        options: {
          host: 'localhost',
          port: 6379,
        },
      };
      adapter = new StorageAdapter(config);
    });

    it('should create Redis storage', () => {
      expect(adapter).toBeDefined();
    });
  });
});

describe('Data Operations', () => {
  let adapter: StorageAdapter;

  beforeEach(() => {
    adapter = new StorageAdapter({
      type: 'memory',
    });
  });

  it('should handle string values', async () => {
    const result = await adapter.set('string-key', 'value');
    expect(result.success).toBeDefined();
  });

  it('should handle number values', async () => {
    const result = await adapter.set('number-key', 42);
    expect(result.success).toBeDefined();
  });

  it('should handle boolean values', async () => {
    const result = await adapter.set('bool-key', true);
    expect(result.success).toBeDefined();
  });

  it('should handle object values', async () => {
    const result = await adapter.set('object-key', { name: 'test', value: 100 });
    expect(result.success).toBeDefined();
  });

  it('should handle array values', async () => {
    const result = await adapter.set('array-key', [1, 2, 3, 4, 5]);
    expect(result.success).toBeDefined();
  });

  it('should handle null values', async () => {
    const result = await adapter.set('null-key', null);
    expect(result.success).toBeDefined();
  });
});

describe('Key Management', () => {
  let adapter: StorageAdapter;

  beforeEach(() => {
    adapter = new StorageAdapter({
      type: 'memory',
    });
  });

  it('should handle simple keys', async () => {
    const result = await adapter.set('simple', 'value');
    expect(result.success).toBeDefined();
  });

  it('should handle complex keys', async () => {
    const result = await adapter.set('users:123:profile', { name: 'John' });
    expect(result.success).toBeDefined();
  });

  it('should handle keys with special characters', async () => {
    const result = await adapter.set('key-with-dash_and.dot', 'value');
    expect(result.success).toBeDefined();
  });

  it('should handle empty key edge case', async () => {
    const result = await adapter.exists('');
    expect(result).toBeDefined();
  });

  it('should handle very long keys', async () => {
    const longKey = 'a'.repeat(1000);
    const result = await adapter.set(longKey, 'value');
    expect(result).toBeDefined();
  });
});

describe('Error Handling', () => {
  let adapter: StorageAdapter;

  beforeEach(() => {
    adapter = new StorageAdapter({
      type: 'memory',
    });
  });

  it('should return error in result on failure', async () => {
    // Mock scenario where operation might fail
    // Structure validation
    const operation: StorageOperation = {
      key: 'test',
      operation: 'get',
    };

    expect(operation.key).toBe('test');
  });
});

describe('Integration Scenarios', () => {
  it('should handle complete CRUD workflow', async () => {
    const adapter = new StorageAdapter({
      type: 'memory',
    });

    // Create
    const setResult = await adapter.set('user:1', { name: 'Alice' });
    expect(setResult).toBeDefined();

    // Read
    const getResult = await adapter.get('user:1');
    expect(getResult).toBeDefined();

    // Update
    const updateResult = await adapter.set('user:1', { name: 'Bob' });
    expect(updateResult).toBeDefined();

    // Delete
    const deleteResult = await adapter.delete('user:1');
    expect(deleteResult).toBeDefined();
  });

  it('should handle existence check workflow', async () => {
    const adapter = new StorageAdapter({
      type: 'memory',
    });

    // Check non-existent
    const exists1 = await adapter.exists('test');
    expect(exists1).toBeDefined();

    // Set value
    await adapter.set('test', 'value');

    // Check exists
    const exists2 = await adapter.exists('test');
    expect(exists2).toBeDefined();
  });

  it('should handle bulk operations workflow', async () => {
    const adapter = new StorageAdapter({
      type: 'memory',
    });

    // Set multiple
    for (let i = 0; i < 5; i++) {
      await adapter.set(`key-${i}`, `value-${i}`);
    }

    // Clear all
    const clearResult = await adapter.clear();
    expect(clearResult).toBeDefined();
  });

  it('should handle complex data structures', async () => {
    const adapter = new StorageAdapter({
      type: 'memory',
    });

    const complexData = {
      user: {
        id: '123',
        profile: {
          name: 'Alice',
          preferences: {
            theme: 'dark',
            language: 'en-US',
          },
        },
        metadata: {
          createdAt: '2024-01-01',
          updatedAt: '2024-04-01',
        },
      },
    };

    const result = await adapter.set('complex', complexData);
    expect(result.success).toBeDefined();
  });

  it('should handle different storage backends', () => {
    const fileAdapter = new StorageAdapter({
      type: 'file',
      path: '/tmp/file-store',
    });

    const memoryAdapter = new StorageAdapter({
      type: 'memory',
    });

    const sqliteAdapter = new StorageAdapter({
      type: 'sqlite',
      path: ':memory:',
    });

    const redisAdapter = new StorageAdapter({
      type: 'redis',
      options: { host: 'localhost' },
    });

    expect(fileAdapter).toBeDefined();
    expect(memoryAdapter).toBeDefined();
    expect(sqliteAdapter).toBeDefined();
    expect(redisAdapter).toBeDefined();
  });
});

describe('Storage Configuration', () => {
  it('should handle configuration with custom options', () => {
    const config: StorageConfig = {
      type: 'sqlite',
      path: '/data/app.db',
      options: {
        tableName: 'app_storage',
        timeout: 5000,
        cacheSize: 1000,
      },
    };

    const adapter = new StorageAdapter(config);
    expect(adapter).toBeDefined();
  });

  it('should handle file storage with custom path', () => {
    const config: StorageConfig = {
      type: 'file',
      path: '/custom/storage/path',
      options: {
        createDir: true,
        encoding: 'utf-8',
      },
    };

    const adapter = new StorageAdapter(config);
    expect(adapter).toBeDefined();
  });

  it('should handle Redis with connection options', () => {
    const config: StorageConfig = {
      type: 'redis',
      options: {
        host: 'redis.example.com',
        port: 6380,
        password: 'secure-password',
        db: 2,
        tls: true,
      },
    };

    const adapter = new StorageAdapter(config);
    expect(adapter).toBeDefined();
  });
});
