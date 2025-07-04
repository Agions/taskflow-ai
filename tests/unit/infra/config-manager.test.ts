/**
 * 配置管理器单元测试
 * 测试配置管理的核心功能
 */

import { ConfigManager, ConfigEnvironment, ConfigSource } from '../../../src/infra/config/config-manager';
import { Logger } from '../../../src/infra/logger';
import * as fs from 'fs';

// Mock dependencies
jest.mock('fs');
jest.mock('../../../src/infra/logger');

const mockFs = fs as jest.Mocked<typeof fs>;
const MockLogger = Logger as jest.MockedClass<typeof Logger>;

describe('ConfigManager Unit Tests', () => {
  let configManager: ConfigManager;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockLogger = new MockLogger({
      level: 'info',
      output: 'console'
    }) as jest.Mocked<Logger>;

    configManager = new ConfigManager({
      environment: ConfigEnvironment.TESTING,
      enableCache: true,
      cacheTimeout: 5000,
      enableFileWatch: false,
      enableValidation: true
    }, mockLogger);

    // Mock file system operations
    mockFs.existsSync.mockReturnValue(false);
    mockFs.readFileSync.mockReturnValue('{}');
    mockFs.writeFileSync.mockImplementation(() => {});
  });

  describe('基本配置操作', () => {
    it('应该能够设置和获取配置值', () => {
      configManager.set('test.key', 'test-value');
      const value = configManager.get('test.key');
      
      expect(value).toBe('test-value');
    });

    it('应该支持不同类型的配置值', () => {
      configManager.set('string.key', 'string-value');
      configManager.set('number.key', 42);
      configManager.set('boolean.key', true);
      configManager.set('object.key', { nested: 'value' });
      configManager.set('array.key', [1, 2, 3]);

      expect(configManager.get('string.key')).toBe('string-value');
      expect(configManager.get('number.key')).toBe(42);
      expect(configManager.get('boolean.key')).toBe(true);
      expect(configManager.get('object.key')).toEqual({ nested: 'value' });
      expect(configManager.get('array.key')).toEqual([1, 2, 3]);
    });

    it('应该返回默认值当配置不存在时', () => {
      const defaultValue = 'default-value';
      const value = configManager.get('non.existent.key', defaultValue);
      
      expect(value).toBe(defaultValue);
    });

    it('应该支持泛型类型', () => {
      interface TestConfig {
        name: string;
        count: number;
      }

      const testConfig: TestConfig = { name: 'test', count: 5 };
      configManager.set('typed.config', testConfig);
      
      const retrieved = configManager.get<TestConfig>('typed.config');
      expect(retrieved).toEqual(testConfig);
    });
  });

  describe('批量配置操作', () => {
    it('应该支持批量设置配置', () => {
      const configs = {
        'batch.key1': 'value1',
        'batch.key2': 'value2',
        'batch.key3': 'value3'
      };

      configManager.setMany(configs);

      expect(configManager.get('batch.key1')).toBe('value1');
      expect(configManager.get('batch.key2')).toBe('value2');
      expect(configManager.get('batch.key3')).toBe('value3');
    });

    it('应该能够获取所有配置', () => {
      configManager.set('all.key1', 'value1');
      configManager.set('all.key2', 'value2');

      const allConfigs = configManager.getAll();

      expect(allConfigs).toHaveProperty('all.key1', 'value1');
      expect(allConfigs).toHaveProperty('all.key2', 'value2');
    });
  });

  describe('配置删除', () => {
    it('应该能够删除单个配置', () => {
      configManager.set('delete.key', 'value');
      expect(configManager.get('delete.key')).toBe('value');

      configManager.delete('delete.key');
      expect(configManager.get('delete.key')).toBeUndefined();
    });

    it('应该能够清空所有配置', () => {
      configManager.set('clear.key1', 'value1');
      configManager.set('clear.key2', 'value2');

      configManager.clear();

      expect(configManager.get('clear.key1')).toBeUndefined();
      expect(configManager.get('clear.key2')).toBeUndefined();
    });
  });

  describe('配置验证', () => {
    beforeEach(() => {
      configManager.addValidation('validated.string', {
        type: 'string',
        required: true,
        min: 3,
        max: 10
      });

      configManager.addValidation('validated.number', {
        type: 'number',
        required: true,
        min: 0,
        max: 100
      });

      configManager.addValidation('validated.enum', {
        type: 'string',
        enum: ['option1', 'option2', 'option3']
      });
    });

    it('应该验证字符串类型和长度', () => {
      expect(() => configManager.set('validated.string', 'ab')).toThrow(); // 太短
      expect(() => configManager.set('validated.string', 'abcdefghijk')).toThrow(); // 太长
      expect(() => configManager.set('validated.string', 'valid')).not.toThrow(); // 有效
    });

    it('应该验证数字类型和范围', () => {
      expect(() => configManager.set('validated.number', -1)).toThrow(); // 太小
      expect(() => configManager.set('validated.number', 101)).toThrow(); // 太大
      expect(() => configManager.set('validated.number', 50)).not.toThrow(); // 有效
    });

    it('应该验证枚举值', () => {
      expect(() => configManager.set('validated.enum', 'invalid')).toThrow(); // 无效选项
      expect(() => configManager.set('validated.enum', 'option1')).not.toThrow(); // 有效选项
    });

    it('应该验证必填字段', () => {
      expect(() => configManager.set('validated.string', null)).toThrow();
      expect(() => configManager.set('validated.string', undefined)).toThrow();
    });
  });

  describe('环境变量支持', () => {
    beforeEach(() => {
      // Mock environment variables
      process.env.TASKFLOW_TEST_STRING = 'env-value';
      process.env.TASKFLOW_TEST_NUMBER = '42';
      process.env.TASKFLOW_TEST_BOOLEAN = 'true';
      process.env.TASKFLOW_TEST_JSON = '{"key":"value"}';
    });

    afterEach(() => {
      delete process.env.TASKFLOW_TEST_STRING;
      delete process.env.TASKFLOW_TEST_NUMBER;
      delete process.env.TASKFLOW_TEST_BOOLEAN;
      delete process.env.TASKFLOW_TEST_JSON;
    });

    it('应该从环境变量读取字符串值', () => {
      const value = configManager.get('test.string');
      expect(value).toBe('env-value');
    });

    it('应该解析环境变量中的数字', () => {
      const value = configManager.get('test.number');
      expect(value).toBe(42);
    });

    it('应该解析环境变量中的布尔值', () => {
      const value = configManager.get('test.boolean');
      expect(value).toBe(true);
    });

    it('应该解析环境变量中的JSON', () => {
      const value = configManager.get('test.json');
      expect(value).toEqual({ key: 'value' });
    });
  });

  describe('文件配置', () => {
    it('应该从文件加载配置', () => {
      const fileContent = JSON.stringify({
        'file.key1': 'file-value1',
        'file.key2': 'file-value2'
      });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(fileContent);

      configManager.loadFromFile('/test/config.json');

      expect(configManager.get('file.key1')).toBe('file-value1');
      expect(configManager.get('file.key2')).toBe('file-value2');
    });

    it('应该保存配置到文件', () => {
      configManager.set('save.key1', 'save-value1');
      configManager.set('save.key2', 'save-value2');

      configManager.saveToFile('/test/save-config.json');

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        '/test/save-config.json',
        expect.stringContaining('save-value1'),
        'utf8'
      );
    });

    it('应该处理文件不存在的情况', () => {
      mockFs.existsSync.mockReturnValue(false);

      expect(() => configManager.loadFromFile('/non/existent/file.json')).not.toThrow();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('配置文件不存在')
      );
    });

    it('应该处理无效的JSON文件', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid json');

      expect(() => configManager.loadFromFile('/test/invalid.json')).toThrow();
    });
  });

  describe('缓存功能', () => {
    it('应该缓存配置值', () => {
      configManager.set('cache.key', 'cache-value');
      
      // 第一次获取
      const value1 = configManager.get('cache.key');
      // 第二次获取应该从缓存
      const value2 = configManager.get('cache.key');

      expect(value1).toBe('cache-value');
      expect(value2).toBe('cache-value');
    });

    it('应该在缓存过期后重新获取', (done) => {
      const shortCacheManager = new ConfigManager({
        environment: ConfigEnvironment.TESTING,
        enableCache: true,
        cacheTimeout: 10, // 10ms
        enableFileWatch: false
      }, mockLogger);

      shortCacheManager.set('expire.key', 'expire-value');
      
      setTimeout(() => {
        const value = shortCacheManager.get('expire.key');
        expect(value).toBe('expire-value');
        done();
      }, 20);
    });
  });

  describe('配置变更监听', () => {
    it('应该触发配置变更事件', () => {
      const changeHandler = jest.fn();
      configManager.onChange(changeHandler);

      configManager.set('change.key', 'new-value');

      expect(changeHandler).toHaveBeenCalledWith({
        key: 'change.key',
        oldValue: undefined,
        newValue: 'new-value',
        source: ConfigSource.MEMORY,
        timestamp: expect.any(Date),
        environment: ConfigEnvironment.TESTING
      });
    });

    it('应该支持多个变更监听器', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      configManager.onChange(handler1);
      configManager.onChange(handler2);

      configManager.set('multi.key', 'multi-value');

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('应该能够移除变更监听器', () => {
      const handler = jest.fn();
      const unsubscribe = configManager.onChange(handler);

      configManager.set('remove.key', 'remove-value');
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();
      configManager.set('remove.key', 'new-remove-value');
      expect(handler).toHaveBeenCalledTimes(1); // 不应该再次调用
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的配置键', () => {
      expect(() => configManager.get('')).toThrow();
      expect(() => configManager.set('', 'value')).toThrow();
    });

    it('应该处理文件读取错误', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('文件读取失败');
      });

      expect(() => configManager.loadFromFile('/test/error.json')).toThrow('文件读取失败');
    });

    it('应该处理文件写入错误', () => {
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('文件写入失败');
      });

      expect(() => configManager.saveToFile('/test/error.json')).toThrow('文件写入失败');
    });
  });

  describe('高级功能测试', () => {
    it('应该支持嵌套配置路径', () => {
      configManager.set('app.database.host', 'localhost');
      configManager.set('app.database.port', 5432);

      expect(configManager.get('app.database.host')).toBe('localhost');
      expect(configManager.get('app.database.port')).toBe(5432);
    });

    it('应该支持配置重载', () => {
      configManager.set('reload.test', 'original');
      expect(configManager.get('reload.test')).toBe('original');

      configManager.set('reload.test', 'updated');
      expect(configManager.get('reload.test')).toBe('updated');
    });

    it('应该支持配置导出和导入', () => {
      configManager.set('export.key1', 'value1');
      configManager.set('export.key2', 'value2');

      const exported = configManager.getAll();
      configManager.clear();

      expect(configManager.get('export.key1')).toBeUndefined();

      configManager.setMany(exported);
      expect(configManager.get('export.key1')).toBe('value1');
      expect(configManager.get('export.key2')).toBe('value2');
    });

    it('应该支持配置模式匹配', () => {
      configManager.set('pattern.test.one', 'value1');
      configManager.set('pattern.test.two', 'value2');
      configManager.set('pattern.other.one', 'value3');

      const allConfigs = configManager.getAll();
      const testConfigs = Object.keys(allConfigs)
        .filter(key => key.startsWith('pattern.test.'))
        .reduce((obj, key) => {
          obj[key] = allConfigs[key];
          return obj;
        }, {} as Record<string, any>);

      expect(Object.keys(testConfigs)).toHaveLength(2);
      expect(testConfigs['pattern.test.one']).toBe('value1');
      expect(testConfigs['pattern.test.two']).toBe('value2');
    });
  });

  describe('性能测试', () => {
    it('应该能处理大量配置项', () => {
      const startTime = Date.now();

      // 设置1000个配置项
      for (let i = 0; i < 1000; i++) {
        configManager.set(`perf.test.${i}`, `value${i}`);
      }

      // 读取所有配置项
      for (let i = 0; i < 1000; i++) {
        expect(configManager.get(`perf.test.${i}`)).toBe(`value${i}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 性能要求：1000个操作应该在100ms内完成
      expect(duration).toBeLessThan(100);
    });

    it('应该支持并发访问', async () => {
      const promises = [];

      // 并发设置配置
      for (let i = 0; i < 100; i++) {
        promises.push(
          Promise.resolve().then(() => {
            configManager.set(`concurrent.${i}`, `value${i}`);
            return configManager.get(`concurrent.${i}`);
          })
        );
      }

      const results = await Promise.all(promises);

      // 验证所有结果
      results.forEach((result, index) => {
        expect(result).toBe(`value${index}`);
      });
    });
  });
});
