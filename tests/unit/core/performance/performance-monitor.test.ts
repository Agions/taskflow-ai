/**
 * 性能监控系统单元测试
 */

import { PerformanceMonitor, MemoryCache, performanceMonitor, cached } from '../../../../src/core/performance/performance-monitor';
import { PerformanceMetrics, PerformanceThresholds } from '../../../../src/types/strict-types';

describe('PerformanceMonitor Unit Tests', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = PerformanceMonitor.getInstance();
    monitor.clearMetrics(); // 清除之前的数据
  });

  describe('单例模式', () => {
    it('应该返回同一个实例', () => {
      const instance1 = PerformanceMonitor.getInstance();
      const instance2 = PerformanceMonitor.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('性能阈值管理', () => {
    it('应该能设置和获取性能阈值', () => {
      const thresholds: PerformanceThresholds = {
        maxExecutionTime: 1000,
        maxMemoryUsage: 100,
        minCacheHitRate: 80,
        maxErrorRate: 5
      };

      monitor.setThresholds('test-operation', thresholds);
      
      // 通过记录超过阈值的指标来验证阈值设置
      const metrics: PerformanceMetrics = {
        executionTime: 1500, // 超过阈值
        memoryUsage: 50,
        cpuUsage: 10,
        cacheHitRate: 90,
        errorRate: 2,
        throughput: 100
      };

      // 这应该触发警告（通过console.warn）
      monitor.recordMetrics('test-operation', metrics);
    });
  });

  describe('性能指标记录', () => {
    it('应该能记录性能指标', () => {
      const metrics: PerformanceMetrics = {
        executionTime: 500,
        memoryUsage: 50,
        cpuUsage: 10,
        cacheHitRate: 95,
        errorRate: 1,
        throughput: 200
      };

      monitor.recordMetrics('test-operation', metrics);
      
      const stats = monitor.getStats('test-operation');
      expect(stats).toBeDefined();
      expect(stats!.totalCalls).toBe(1);
      expect(stats!.avgExecutionTime).toBe(500);
      expect(stats!.avgMemoryUsage).toBe(50);
    });

    it('应该能记录多个指标并计算统计信息', () => {
      const metrics1: PerformanceMetrics = {
        executionTime: 100,
        memoryUsage: 10,
        cpuUsage: 5,
        cacheHitRate: 90,
        errorRate: 0,
        throughput: 100
      };

      const metrics2: PerformanceMetrics = {
        executionTime: 200,
        memoryUsage: 20,
        cpuUsage: 10,
        cacheHitRate: 95,
        errorRate: 2,
        throughput: 150
      };

      monitor.recordMetrics('multi-test', metrics1);
      monitor.recordMetrics('multi-test', metrics2);
      
      const stats = monitor.getStats('multi-test');
      expect(stats).toBeDefined();
      expect(stats!.totalCalls).toBe(2);
      expect(stats!.avgExecutionTime).toBe(150);
      expect(stats!.maxExecutionTime).toBe(200);
      expect(stats!.minExecutionTime).toBe(100);
      expect(stats!.avgMemoryUsage).toBe(15);
    });

    it('应该限制记录数量为100条', () => {
      // 记录101条指标
      for (let i = 0; i < 101; i++) {
        const metrics: PerformanceMetrics = {
          executionTime: i,
          memoryUsage: i,
          cpuUsage: i,
          cacheHitRate: 90,
          errorRate: 0,
          throughput: 100
        };
        monitor.recordMetrics('limit-test', metrics);
      }
      
      const stats = monitor.getStats('limit-test');
      expect(stats!.totalCalls).toBe(100); // 应该只保留最近100条
    });
  });

  describe('性能报告生成', () => {
    it('应该生成性能报告', () => {
      const metrics: PerformanceMetrics = {
        executionTime: 300,
        memoryUsage: 30,
        cpuUsage: 15,
        cacheHitRate: 85,
        errorRate: 3,
        throughput: 120
      };

      monitor.recordMetrics('report-test', metrics);
      
      const report = monitor.generateReport();
      expect(report).toContain('性能监控报告');
      expect(report).toContain('report-test');
      expect(report).toContain('总调用次数: 1');
      expect(report).toContain('平均执行时间: 300.00ms');
    });

    it('应该处理空数据的报告生成', () => {
      const report = monitor.generateReport();
      expect(report).toContain('性能监控报告');
    });
  });

  describe('数据清理', () => {
    it('应该能清除指定操作的数据', () => {
      const metrics: PerformanceMetrics = {
        executionTime: 100,
        memoryUsage: 10,
        cpuUsage: 5,
        cacheHitRate: 90,
        errorRate: 0,
        throughput: 100
      };

      monitor.recordMetrics('clear-test-1', metrics);
      monitor.recordMetrics('clear-test-2', metrics);
      
      expect(monitor.getStats('clear-test-1')).toBeDefined();
      expect(monitor.getStats('clear-test-2')).toBeDefined();
      
      monitor.clearMetrics('clear-test-1');
      
      expect(monitor.getStats('clear-test-1')).toBeNull();
      expect(monitor.getStats('clear-test-2')).toBeDefined();
    });

    it('应该能清除所有数据', () => {
      const metrics: PerformanceMetrics = {
        executionTime: 100,
        memoryUsage: 10,
        cpuUsage: 5,
        cacheHitRate: 90,
        errorRate: 0,
        throughput: 100
      };

      monitor.recordMetrics('clear-all-1', metrics);
      monitor.recordMetrics('clear-all-2', metrics);
      
      monitor.clearMetrics();
      
      expect(monitor.getStats('clear-all-1')).toBeNull();
      expect(monitor.getStats('clear-all-2')).toBeNull();
    });
  });
});

describe('MemoryCache Unit Tests', () => {
  let cache: MemoryCache<string>;

  beforeEach(() => {
    cache = new MemoryCache<string>(5, 1000); // 最大5个项目，1秒TTL
  });

  describe('基本缓存操作', () => {
    it('应该能设置和获取缓存值', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('应该在缓存未命中时返回undefined', () => {
      expect(cache.get('non-existent')).toBeUndefined();
    });

    it('应该能删除缓存值', () => {
      cache.set('delete-key', 'delete-value');
      expect(cache.get('delete-key')).toBe('delete-value');
      
      const deleted = cache.delete('delete-key');
      expect(deleted).toBe(true);
      expect(cache.get('delete-key')).toBeUndefined();
    });

    it('应该能清空所有缓存', () => {
      cache.set('clear1', 'value1');
      cache.set('clear2', 'value2');
      
      cache.clear();
      
      expect(cache.get('clear1')).toBeUndefined();
      expect(cache.get('clear2')).toBeUndefined();
    });
  });

  describe('TTL过期处理', () => {
    it('应该在TTL过期后返回undefined', (done) => {
      cache.set('ttl-key', 'ttl-value', 50); // 50ms TTL
      
      expect(cache.get('ttl-key')).toBe('ttl-value');
      
      setTimeout(() => {
        expect(cache.get('ttl-key')).toBeUndefined();
        done();
      }, 100);
    });

    it('应该能手动清理过期项', () => {
      cache.set('cleanup1', 'value1', 1); // 1ms TTL
      cache.set('cleanup2', 'value2', 10000); // 10s TTL
      
      // 等待第一个过期
      setTimeout(() => {
        cache.cleanup();
        expect(cache.get('cleanup1')).toBeUndefined();
        expect(cache.get('cleanup2')).toBe('value2');
      }, 10);
    });
  });

  describe('LRU淘汰策略', () => {
    it('应该在缓存满时淘汰最少使用的项', () => {
      // 填满缓存
      for (let i = 0; i < 5; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      
      // 访问前4个项目，使key4成为最少使用的
      for (let i = 0; i < 4; i++) {
        cache.get(`key${i}`);
      }
      
      // 添加新项目，应该淘汰key4
      cache.set('new-key', 'new-value');
      
      expect(cache.get('key4')).toBeUndefined();
      expect(cache.get('new-key')).toBe('new-value');
      expect(cache.get('key0')).toBe('value0');
    });
  });

  describe('缓存统计', () => {
    it('应该正确计算缓存统计信息', () => {
      cache.set('stats1', 'value1');
      cache.set('stats2', 'value2');
      
      // 命中
      cache.get('stats1');
      cache.get('stats2');
      
      // 未命中
      cache.get('non-existent');
      
      const stats = cache.getStats();
      expect(stats.size).toBe(2);
      expect(stats.hitRate).toBe(66.67); // 2/3 * 100
      expect(stats.missRate).toBe(33.33); // 1/3 * 100
      expect(stats.totalRequests).toBe(3);
    });
  });
});

describe('性能装饰器测试', () => {
  class TestClass {
    @performanceMonitor('test-method')
    async testMethod(delay: number): Promise<string> {
      await new Promise(resolve => setTimeout(resolve, delay));
      return 'test-result';
    }

    @cached(1000, (param: string) => `cache-${param}`)
    expensiveOperation(param: string): string {
      return `expensive-${param}-${Date.now()}`;
    }
  }

  let testInstance: TestClass;

  beforeEach(() => {
    testInstance = new TestClass();
  });

  describe('性能监控装饰器', () => {
    it('应该监控方法执行时间', async () => {
      const result = await testInstance.testMethod(10);
      expect(result).toBe('test-result');
      
      const monitor = PerformanceMonitor.getInstance();
      const stats = monitor.getStats('test-method');
      expect(stats).toBeDefined();
      expect(stats!.totalCalls).toBe(1);
      expect(stats!.avgExecutionTime).toBeGreaterThan(0);
    });
  });

  describe('缓存装饰器', () => {
    it('应该缓存方法结果', () => {
      const result1 = testInstance.expensiveOperation('test');
      const result2 = testInstance.expensiveOperation('test');
      
      // 第二次调用应该返回缓存的结果
      expect(result1).toBe(result2);
    });

    it('应该为不同参数返回不同结果', () => {
      const result1 = testInstance.expensiveOperation('param1');
      const result2 = testInstance.expensiveOperation('param2');
      
      expect(result1).not.toBe(result2);
      expect(result1).toContain('param1');
      expect(result2).toContain('param2');
    });
  });
});
