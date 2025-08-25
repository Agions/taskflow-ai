/**
 * AI模型工厂
 * 统一管理和创建不同的AI模型适配器
 */

import { BaseModelAdapter, ModelConfig } from './base-adapter';
import { DeepSeekAdapter, DeepSeekConfig } from './providers/deepseek-adapter';
import { ZhipuAdapter, ZhipuConfig } from './providers/zhipu-adapter';

export type SupportedProvider = 'deepseek' | 'zhipu' | 'qwen' | 'moonshot' | 'baidu' | 'spark';

export interface ModelFactoryConfig {
  providers: Record<string, ModelConfig>;
  defaultProvider: string;
  fallbackProviders: string[];
}

export interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  supportedModels: string[];
  capabilities: string[];
  pricing: {
    inputCostPer1kTokens: number;
    outputCostPer1kTokens: number;
  };
  limits: {
    maxTokensPerRequest: number;
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  status: 'available' | 'unavailable' | 'deprecated';
}

/**
 * AI模型工厂类
 * 负责创建、管理和协调不同的AI模型适配器
 */
export class ModelFactory {
  private adapters = new Map<string, BaseModelAdapter>();
  private config: ModelFactoryConfig;
  private initialized = false;

  constructor(config: ModelFactoryConfig) {
    this.config = config;
  }

  /**
   * 初始化模型工厂
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.log('🏭 初始化AI模型工厂...');

      // 初始化所有配置的适配器
      for (const [providerId, providerConfig] of Object.entries(this.config.providers)) {
        try {
          const adapter = await this.createAdapter(providerId, providerConfig);
          await adapter.initialize();
          this.adapters.set(providerId, adapter);
          
          console.log(`✅ ${providerId} 适配器初始化成功`);
        } catch (error) {
          console.error(`❌ ${providerId} 适配器初始化失败:`, error);
          // 继续初始化其他适配器
        }
      }

      if (this.adapters.size === 0) {
        throw new Error('没有可用的AI模型适配器');
      }

      this.initialized = true;
      console.log(`✅ 模型工厂初始化完成，可用适配器: ${this.adapters.size}个`);

    } catch (error) {
      console.error('❌ 模型工厂初始化失败:', error);
      throw error;
    }
  }

  /**
   * 创建模型适配器
   */
  private async createAdapter(providerId: string, config: ModelConfig): Promise<BaseModelAdapter> {
    switch (config.provider as SupportedProvider) {
      case 'deepseek':
        return new DeepSeekAdapter(config as DeepSeekConfig);
      
      case 'zhipu':
        return new ZhipuAdapter(config as ZhipuConfig);
      
      case 'qwen':
        // TODO: 实现通义千问适配器
        throw new Error('通义千问适配器尚未实现');
      
      case 'moonshot':
        // TODO: 实现月之暗面适配器
        throw new Error('月之暗面适配器尚未实现');
      
      case 'baidu':
        // TODO: 实现百度文心适配器
        throw new Error('百度文心适配器尚未实现');
      
      case 'spark':
        // TODO: 实现讯飞星火适配器
        throw new Error('讯飞星火适配器尚未实现');
      
      default:
        throw new Error(`不支持的AI提供商: ${config.provider}`);
    }
  }

  /**
   * 获取模型适配器
   */
  getAdapter(providerId: string): BaseModelAdapter | null {
    this.ensureInitialized();
    return this.adapters.get(providerId) || null;
  }

  /**
   * 获取默认适配器
   */
  getDefaultAdapter(): BaseModelAdapter {
    this.ensureInitialized();
    
    const defaultAdapter = this.adapters.get(this.config.defaultProvider);
    if (defaultAdapter) {
      return defaultAdapter;
    }

    // 尝试回退适配器
    for (const fallbackId of this.config.fallbackProviders) {
      const fallbackAdapter = this.adapters.get(fallbackId);
      if (fallbackAdapter) {
        console.warn(`使用回退适配器: ${fallbackId}`);
        return fallbackAdapter;
      }
    }

    // 返回第一个可用的适配器
    const firstAdapter = Array.from(this.adapters.values())[0];
    if (firstAdapter) {
      console.warn(`使用第一个可用适配器: ${Array.from(this.adapters.keys())[0]}`);
      return firstAdapter;
    }

    throw new Error('没有可用的AI模型适配器');
  }

  /**
   * 获取最佳适配器（基于性能指标）
   */
  getBestAdapter(criteria?: {
    taskType?: string;
    prioritizeCost?: boolean;
    prioritizeSpeed?: boolean;
    prioritizeQuality?: boolean;
  }): BaseModelAdapter {
    this.ensureInitialized();

    const availableAdapters = Array.from(this.adapters.values());
    
    if (availableAdapters.length === 0) {
      throw new Error('没有可用的AI模型适配器');
    }

    if (availableAdapters.length === 1) {
      return availableAdapters[0];
    }

    // 简单的评分算法
    let bestAdapter = availableAdapters[0];
    let bestScore = -1;

    for (const adapter of availableAdapters) {
      const metrics = adapter.getMetrics();
      const config = adapter.getModelInfo();
      
      let score = 0;

      // 错误率权重 (40%)
      score += (1 - metrics.errorRate) * 40;

      // 响应时间权重 (30%)
      const normalizedResponseTime = Math.min(metrics.averageResponseTime / 5000, 1);
      score += (1 - normalizedResponseTime) * 30;

      // 成本权重 (20%)
      if (criteria?.prioritizeCost) {
        const normalizedCost = Math.min(config.costPerToken / 0.01, 1);
        score += (1 - normalizedCost) * 20;
      } else {
        score += 20; // 默认满分
      }

      // 可用性权重 (10%)
      if (metrics.totalRequests > 0) {
        score += 10;
      }

      if (score > bestScore) {
        bestScore = score;
        bestAdapter = adapter;
      }
    }

    return bestAdapter;
  }

  /**
   * 获取所有可用适配器
   */
  getAllAdapters(): BaseModelAdapter[] {
    this.ensureInitialized();
    return Array.from(this.adapters.values());
  }

  /**
   * 获取适配器列表信息
   */
  getAdaptersList(): Array<{ id: string; name: string; status: string; metrics: any }> {
    this.ensureInitialized();

    return Array.from(this.adapters.entries()).map(([id, adapter]) => ({
      id,
      name: adapter.getModelInfo().name,
      status: 'active',
      metrics: adapter.getMetrics(),
    }));
  }

  /**
   * 健康检查所有适配器
   */
  async healthCheckAll(): Promise<Map<string, boolean>> {
    this.ensureInitialized();

    const results = new Map<string, boolean>();
    
    const checkPromises = Array.from(this.adapters.entries()).map(async ([id, adapter]) => {
      try {
        const isHealthy = await adapter.healthCheck();
        results.set(id, isHealthy);
        return { id, isHealthy };
      } catch (error) {
        console.error(`适配器 ${id} 健康检查失败:`, error);
        results.set(id, false);
        return { id, isHealthy: false };
      }
    });

    await Promise.all(checkPromises);
    
    const healthyCount = Array.from(results.values()).filter(Boolean).length;
    console.log(`🏥 健康检查完成: ${healthyCount}/${results.size} 个适配器健康`);

    return results;
  }

  /**
   * 获取提供商信息
   */
  getProviderInfo(): ProviderInfo[] {
    return [
      {
        id: 'deepseek',
        name: 'DeepSeek',
        description: '深度求索AI，专注于代码生成和推理',
        supportedModels: ['deepseek-chat', 'deepseek-coder'],
        capabilities: ['文本生成', '代码生成', '逻辑推理', '函数调用'],
        pricing: {
          inputCostPer1kTokens: 0.14,
          outputCostPer1kTokens: 0.28,
        },
        limits: {
          maxTokensPerRequest: 4000,
          requestsPerMinute: 60,
          tokensPerMinute: 200000,
        },
        status: 'available',
      },
      {
        id: 'zhipu',
        name: '智谱AI',
        description: '智谱AI GLM系列模型，支持多模态和长文本',
        supportedModels: ['glm-4', 'glm-4-plus', 'glm-4-air', 'glm-4-long', 'glm-4v'],
        capabilities: ['文本生成', '图像理解', '长文本处理', '工具调用'],
        pricing: {
          inputCostPer1kTokens: 0.1,
          outputCostPer1kTokens: 0.1,
        },
        limits: {
          maxTokensPerRequest: 8000,
          requestsPerMinute: 100,
          tokensPerMinute: 300000,
        },
        status: 'available',
      },
      {
        id: 'qwen',
        name: '通义千问',
        description: '阿里云通义千问大模型',
        supportedModels: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
        capabilities: ['文本生成', '代码生成', '多语言支持'],
        pricing: {
          inputCostPer1kTokens: 0.12,
          outputCostPer1kTokens: 0.12,
        },
        limits: {
          maxTokensPerRequest: 6000,
          requestsPerMinute: 80,
          tokensPerMinute: 250000,
        },
        status: 'unavailable', // 尚未实现
      },
      {
        id: 'moonshot',
        name: '月之暗面',
        description: 'Moonshot AI Kimi模型，支持超长上下文',
        supportedModels: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
        capabilities: ['文本生成', '长文本处理', '文档分析'],
        pricing: {
          inputCostPer1kTokens: 0.12,
          outputCostPer1kTokens: 0.12,
        },
        limits: {
          maxTokensPerRequest: 4000,
          requestsPerMinute: 50,
          tokensPerMinute: 200000,
        },
        status: 'unavailable', // 尚未实现
      },
    ];
  }

  /**
   * 添加新的适配器
   */
  async addAdapter(providerId: string, config: ModelConfig): Promise<void> {
    this.ensureInitialized();

    if (this.adapters.has(providerId)) {
      throw new Error(`适配器 ${providerId} 已存在`);
    }

    try {
      const adapter = await this.createAdapter(providerId, config);
      await adapter.initialize();
      
      this.adapters.set(providerId, adapter);
      this.config.providers[providerId] = config;

      console.log(`✅ 成功添加适配器: ${providerId}`);
    } catch (error) {
      console.error(`❌ 添加适配器 ${providerId} 失败:`, error);
      throw error;
    }
  }

  /**
   * 移除适配器
   */
  async removeAdapter(providerId: string): Promise<void> {
    this.ensureInitialized();

    const adapter = this.adapters.get(providerId);
    if (!adapter) {
      throw new Error(`适配器 ${providerId} 不存在`);
    }

    try {
      await adapter.shutdown();
      this.adapters.delete(providerId);
      delete this.config.providers[providerId];

      console.log(`✅ 成功移除适配器: ${providerId}`);
    } catch (error) {
      console.error(`❌ 移除适配器 ${providerId} 失败:`, error);
      throw error;
    }
  }

  /**
   * 重新加载适配器
   */
  async reloadAdapter(providerId: string): Promise<void> {
    this.ensureInitialized();

    const config = this.config.providers[providerId];
    if (!config) {
      throw new Error(`适配器配置 ${providerId} 不存在`);
    }

    await this.removeAdapter(providerId);
    await this.addAdapter(providerId, config);
  }

  /**
   * 获取工厂统计信息
   */
  getFactoryStats(): {
    totalAdapters: number;
    activeAdapters: number;
    totalRequests: number;
    totalCost: number;
    averageResponseTime: number;
  } {
    this.ensureInitialized();

    const adapters = Array.from(this.adapters.values());
    
    const stats = adapters.reduce(
      (acc, adapter) => {
        const metrics = adapter.getMetrics();
        acc.totalRequests += metrics.totalRequests;
        acc.totalCost += metrics.totalCost;
        acc.totalResponseTime += metrics.averageResponseTime * metrics.successfulRequests;
        acc.totalSuccessfulRequests += metrics.successfulRequests;
        return acc;
      },
      {
        totalRequests: 0,
        totalCost: 0,
        totalResponseTime: 0,
        totalSuccessfulRequests: 0,
      }
    );

    return {
      totalAdapters: adapters.length,
      activeAdapters: adapters.filter(a => a.getMetrics().totalRequests > 0).length,
      totalRequests: stats.totalRequests,
      totalCost: stats.totalCost,
      averageResponseTime: stats.totalSuccessfulRequests > 0 
        ? stats.totalResponseTime / stats.totalSuccessfulRequests 
        : 0,
    };
  }

  /**
   * 关闭所有适配器
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      console.log('🏭 关闭AI模型工厂...');

      const shutdownPromises = Array.from(this.adapters.values()).map(adapter =>
        adapter.shutdown().catch(error =>
          console.error('适配器关闭失败:', error)
        )
      );

      await Promise.all(shutdownPromises);

      this.adapters.clear();
      this.initialized = false;

      console.log('✅ AI模型工厂已关闭');
    } catch (error) {
      console.error('❌ AI模型工厂关闭失败:', error);
      throw error;
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('模型工厂尚未初始化');
    }
  }
}