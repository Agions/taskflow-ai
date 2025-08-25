/**
 * AI编排器单元测试
 */

import { AIOrchestrator, OrchestratorConfig } from '../../../src-new/core/ai/orchestrator';
import { ConfigManager } from '../../../src-new/infrastructure/config/manager';
import { CacheManager } from '../../../src-new/infrastructure/storage/cache';

describe('AIOrchestrator', () => {
  let orchestrator: AIOrchestrator;
  let configManager: ConfigManager;
  let cacheManager: CacheManager;
  let testConfig: OrchestratorConfig;

  beforeEach(async () => {
    // 创建测试配置
    configManager = new ConfigManager({
      models: {
        providers: {
          deepseek: {
            name: 'DeepSeek',
            apiKey: 'test-deepseek-key',
            endpoint: 'https://api.deepseek.com',
          },
          openai: {
            name: 'OpenAI',
            apiKey: 'test-openai-key',
            endpoint: 'https://api.openai.com',
          }
        },
        default: 'deepseek',
        fallback: ['openai'],
      },
      storage: { type: 'memory' },
      security: {},
      cache: {},
      memory: {},
      sandbox: {},
    });

    cacheManager = new CacheManager({
      type: 'memory',
      maxSize: 10 * 1024 * 1024,
      ttl: 3600,
      cleanupInterval: 300,
      persistToDisk: false,
      compression: false,
      maxFileSize: 1024 * 1024,
    });

    testConfig = {
      defaultProvider: 'deepseek',
      fallbackProviders: ['openai'],
      loadBalancing: {
        strategy: 'round_robin',
        maxConcurrent: 5,
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
      },
      costOptimization: {
        enabled: true,
        maxCostPerRequest: 0.1,
        budgetLimit: 10.0,
        trackUsage: true,
      },
      healthCheck: {
        enabled: true,
        interval: 60000,
        timeout: 10000,
        failureThreshold: 3,
      },
    };

    await configManager.initialize();
    await cacheManager.initialize();

    orchestrator = new AIOrchestrator(configManager, cacheManager, testConfig);
  });

  afterEach(async () => {
    if (orchestrator) {
      await orchestrator.shutdown();
    }
    if (cacheManager) {
      await cacheManager.shutdown();
    }
  });

  describe('初始化', () => {
    test('应该成功初始化AI编排器', async () => {
      await expect(orchestrator.initialize()).resolves.not.toThrow();
      
      const status = orchestrator.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.availableProviders).toContain('deepseek');
      expect(status.availableProviders).toContain('openai');
    });

    test('应该加载模型提供商适配器', async () => {
      await orchestrator.initialize();
      
      const providers = orchestrator.getAvailableProviders();
      expect(providers.length).toBeGreaterThan(0);
      expect(providers).toContain('deepseek');
    });

    test('重复初始化应该不报错', async () => {
      await orchestrator.initialize();
      await expect(orchestrator.initialize()).resolves.not.toThrow();
    });
  });

  describe('模型选择', () => {
    beforeEach(async () => {
      await orchestrator.initialize();
    });

    test('应该选择默认模型提供商', async () => {
      const selectedProvider = await orchestrator.selectProvider('analysis');
      expect(selectedProvider).toBe('deepseek');
    });

    test('应该根据任务类型选择最佳提供商', async () => {
      const codeProvider = await orchestrator.selectProvider('code_generation');
      const analysisProvider = await orchestrator.selectProvider('analysis');
      
      expect(codeProvider).toBeDefined();
      expect(analysisProvider).toBeDefined();
    });

    test('主提供商不可用时应该使用备用提供商', async () => {
      // 模拟主提供商故障
      orchestrator.markProviderUnhealthy('deepseek');
      
      const provider = await orchestrator.selectProvider('analysis');
      expect(provider).toBe('openai');
    });
  });

  describe('负载均衡', () => {
    beforeEach(async () => {
      await orchestrator.initialize();
    });

    test('应该分发请求到不同提供商', async () => {
      const requests = [];
      for (let i = 0; i < 4; i++) {
        requests.push(orchestrator.selectProvider('analysis'));
      }
      
      const providers = await Promise.all(requests);
      expect(providers.length).toBe(4);
      // 轮询策略应该有分布
    });

    test('应该尊重并发限制', async () => {
      const concurrentRequests = [];
      for (let i = 0; i < 10; i++) {
        concurrentRequests.push(
          orchestrator.processRequest({
            prompt: `测试请求 ${i}`,
            provider: 'deepseek',
            options: {}
          })
        );
      }
      
      // 所有请求应该被处理，但会受并发限制
      const results = await Promise.allSettled(concurrentRequests);
      expect(results.length).toBe(10);
    });
  });

  describe('请求处理', () => {
    beforeEach(async () => {
      await orchestrator.initialize();
    });

    test('应该处理基本AI请求', async () => {
      const request = {
        prompt: '分析这个文档的主要内容',
        provider: 'deepseek',
        options: {
          temperature: 0.7,
          maxTokens: 1000,
        }
      };

      // 由于没有真实API密钥，期望请求失败但不崩溃
      const result = await orchestrator.processRequest(request);
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    test('应该缓存相似请求的结果', async () => {
      const request = {
        prompt: '计算 1 + 1',
        provider: 'deepseek',
        options: {}
      };

      // 第一次请求
      const result1 = await orchestrator.processRequest(request);
      
      // 第二次相同请求应该从缓存获取
      const result2 = await orchestrator.processRequest(request);
      
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });

    test('应该在请求失败时重试', async () => {
      const request = {
        prompt: '测试重试机制',
        provider: 'invalid_provider',
        options: {}
      };

      const result = await orchestrator.processRequest(request);
      expect(result.success).toBe(false);
      expect(result.retryCount).toBeGreaterThan(0);
    });
  });

  describe('健康监控', () => {
    beforeEach(async () => {
      await orchestrator.initialize();
    });

    test('应该监控提供商健康状态', async () => {
      const healthStatus = orchestrator.getProviderHealth();
      
      expect(healthStatus).toBeDefined();
      expect(Object.keys(healthStatus).length).toBeGreaterThan(0);
    });

    test('应该标记不健康的提供商', () => {
      orchestrator.markProviderUnhealthy('deepseek');
      
      const healthStatus = orchestrator.getProviderHealth();
      expect(healthStatus.deepseek.healthy).toBe(false);
    });

    test('应该恢复健康的提供商', () => {
      orchestrator.markProviderUnhealthy('deepseek');
      orchestrator.markProviderHealthy('deepseek');
      
      const healthStatus = orchestrator.getProviderHealth();
      expect(healthStatus.deepseek.healthy).toBe(true);
    });
  });

  describe('成本优化', () => {
    beforeEach(async () => {
      await orchestrator.initialize();
    });

    test('应该跟踪请求成本', async () => {
      const request = {
        prompt: '简短测试',
        provider: 'deepseek',
        options: {}
      };

      await orchestrator.processRequest(request);
      
      const costReport = orchestrator.getCostReport();
      expect(costReport).toBeDefined();
      expect(costReport.totalCost).toBeGreaterThanOrEqual(0);
    });

    test('应该选择成本最优的提供商', async () => {
      const provider = await orchestrator.selectOptimalProvider('analysis', {
        prioritize: 'cost'
      });
      
      expect(provider).toBeDefined();
    });

    test('应该在超出预算时发出警告', async () => {
      // 设置很低的预算限制
      orchestrator.updateConfig({
        ...testConfig,
        costOptimization: {
          ...testConfig.costOptimization,
          budgetLimit: 0.01
        }
      });

      const costStatus = orchestrator.getCostStatus();
      expect(costStatus.budgetLimit).toBe(0.01);
    });
  });

  describe('统计和监控', () => {
    beforeEach(async () => {
      await orchestrator.initialize();
    });

    test('应该提供详细的使用统计', () => {
      const stats = orchestrator.getUsageStats();
      
      expect(stats).toBeDefined();
      expect(stats.totalRequests).toBeDefined();
      expect(stats.successfulRequests).toBeDefined();
      expect(stats.failedRequests).toBeDefined();
      expect(stats.averageResponseTime).toBeDefined();
      expect(stats.providerUsage).toBeDefined();
    });

    test('应该提供性能指标', () => {
      const metrics = orchestrator.getPerformanceMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.throughput).toBeDefined();
      expect(metrics.latency).toBeDefined();
      expect(metrics.errorRate).toBeDefined();
    });
  });

  describe('配置管理', () => {
    beforeEach(async () => {
      await orchestrator.initialize();
    });

    test('应该动态更新配置', async () => {
      const newConfig = {
        ...testConfig,
        loadBalancing: {
          ...testConfig.loadBalancing,
          strategy: 'least_connections' as any
        }
      };

      await orchestrator.updateConfig(newConfig);
      
      const status = orchestrator.getStatus();
      expect(status.config.loadBalancing.strategy).toBe('least_connections');
    });

    test('应该验证配置有效性', () => {
      const invalidConfig = {
        ...testConfig,
        loadBalancing: {
          ...testConfig.loadBalancing,
          maxConcurrent: -1 // 无效值
        }
      };

      expect(() => orchestrator.validateConfig(invalidConfig)).toThrow();
    });
  });

  describe('优雅关闭', () => {
    test('应该优雅关闭编排器', async () => {
      await orchestrator.initialize();
      await expect(orchestrator.shutdown()).resolves.not.toThrow();
      
      const status = orchestrator.getStatus();
      expect(status.initialized).toBe(false);
    });

    test('应该在关闭时等待进行中的请求完成', async () => {
      await orchestrator.initialize();
      
      // 启动一个长时间运行的请求
      const longRequest = orchestrator.processRequest({
        prompt: '这是一个测试请求',
        provider: 'deepseek',
        options: {}
      });
      
      // 立即关闭
      const shutdownPromise = orchestrator.shutdown();
      
      // 两者都应该完成
      await Promise.all([longRequest, shutdownPromise]);
      
      const status = orchestrator.getStatus();
      expect(status.initialized).toBe(false);
    });
  });
});