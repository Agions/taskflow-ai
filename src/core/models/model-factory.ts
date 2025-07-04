/**
 * 模型工厂 - 统一创建和管理各种国产大模型提供商
 * 支持配置驱动的模型初始化和智能选择
 */

import { Logger } from '../../infra/logger';
import { ConfigManager } from '../../infra/config';
import {
  ChineseLLMManager,
  ChineseLLMProvider,
  ChineseLLMType,
  ModelConfig
} from './chinese-llm-provider';
import { BaiduWenxinProvider } from './providers/baidu-wenxin';
import { AlibabaQwenProvider } from './providers/alibaba-qwen';
import { DeepSeekProvider } from './providers/deepseek';
import { ZhipuProvider } from './providers/zhipu';
import { SparkProvider, SparkConfig } from './providers/spark';
import { MoonshotProvider, MoonshotConfig } from './providers/moonshot';

/**
 * 模型提供商配置接口
 */
export interface ProviderConfig {
  enabled: boolean;
  config: ModelConfig;
  priority?: number;                    // 优先级，数字越大优先级越高
  capabilities?: string[];              // 能力标签
  costPerToken?: number;               // 每token成本
  maxConcurrency?: number;             // 最大并发数
}

/**
 * 模型工厂配置接口
 */
export interface ModelFactoryConfig {
  providers: Record<ChineseLLMType, ProviderConfig>;
  defaultProvider?: ChineseLLMType;
  fallbackProviders?: ChineseLLMType[];  // 备用提供商列表
  loadBalancing?: {
    enabled: boolean;
    strategy: 'round_robin' | 'least_cost' | 'least_latency' | 'random';
    healthCheck: boolean;
  };
  monitoring?: {
    enabled: boolean;
    metricsInterval: number;             // 指标收集间隔(ms)
    alertThresholds: {
      errorRate: number;                 // 错误率阈值
      latency: number;                   // 延迟阈值(ms)
      tokenUsage: number;                // token使用量阈值
    };
  };
}

/**
 * 提供商健康状态
 */
export interface ProviderHealth {
  isHealthy: boolean;
  lastCheck: Date;
  errorRate: number;
  averageLatency: number;
  totalRequests: number;
  failedRequests: number;
  lastError?: string;
}

/**
 * 模型使用统计
 */
export interface ModelUsageStats {
  provider: ChineseLLMType;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  totalCost: number;
  averageLatency: number;
  lastUsed: Date;
}

/**
 * 模型工厂类
 */
export class ModelFactory {
  private logger: Logger;
  private configManager: ConfigManager;
  private llmManager: ChineseLLMManager;
  private config: ModelFactoryConfig;
  private providerHealth: Map<ChineseLLMType, ProviderHealth> = new Map();
  private usageStats: Map<ChineseLLMType, ModelUsageStats> = new Map();
  private roundRobinIndex = 0;
  private monitoringInterval?: NodeJS.Timeout;

  constructor(logger: Logger, configManager: ConfigManager) {
    this.logger = logger;
    this.configManager = configManager;
    this.llmManager = new ChineseLLMManager(logger, configManager);
    this.config = this.loadConfig();
  }

  /**
   * 初始化模型工厂
   */
  public async initialize(): Promise<void> {
    this.logger.info('初始化模型工厂');

    // 创建并注册所有启用的提供商
    await this.createProviders();

    // 设置默认提供商
    if (this.config.defaultProvider) {
      this.llmManager.setDefaultProvider(this.config.defaultProvider);
    }

    // 启动健康检查
    if (this.config.loadBalancing?.healthCheck) {
      await this.startHealthCheck();
    }

    // 启动监控
    if (this.config.monitoring?.enabled) {
      this.startMonitoring();
    }

    this.logger.info(`模型工厂初始化完成，已注册 ${this.llmManager.getRegisteredProviders().length} 个提供商`);
  }

  /**
   * 获取LLM管理器
   */
  public getLLMManager(): ChineseLLMManager {
    return this.llmManager;
  }

  /**
   * 智能选择最佳提供商
   * @param task 任务描述
   * @param requirements 特殊需求
   */
  public selectBestProvider(task: string, requirements?: {
    maxLatency?: number;
    maxCost?: number;
    requiredCapabilities?: string[];
    excludeProviders?: ChineseLLMType[];
  }): ChineseLLMType {
    const availableProviders = this.getAvailableProviders(requirements?.excludeProviders);

    if (availableProviders.length === 0) {
      throw new Error('没有可用的模型提供商');
    }

    // 基于负载均衡策略选择
    if (this.config.loadBalancing?.enabled) {
      return this.selectByLoadBalancing(availableProviders, requirements);
    }

    // 基于任务类型的智能选择
    return this.llmManager.selectBestProvider(task, JSON.stringify(requirements));
  }

  /**
   * 获取提供商健康状态
   * @param providerType 提供商类型
   */
  public getProviderHealth(providerType: ChineseLLMType): ProviderHealth | undefined {
    return this.providerHealth.get(providerType);
  }

  /**
   * 获取所有提供商健康状态
   */
  public getAllProviderHealth(): Map<ChineseLLMType, ProviderHealth> {
    return new Map(this.providerHealth);
  }

  /**
   * 获取使用统计
   * @param providerType 提供商类型
   */
  public getUsageStats(providerType?: ChineseLLMType): ModelUsageStats | Map<ChineseLLMType, ModelUsageStats> {
    if (providerType) {
      const stats = this.usageStats.get(providerType);
      if (!stats) {
        return {
          provider: providerType,
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          totalTokens: 0,
          totalCost: 0,
          averageLatency: 0,
          lastUsed: new Date()
        };
      }
      return stats;
    }
    return new Map(this.usageStats);
  }

  /**
   * 重新加载配置
   */
  public async reloadConfig(): Promise<void> {
    this.logger.info('重新加载模型工厂配置');

    const newConfig = this.loadConfig();
    // 这些变量在实际实现中会用于比较配置变化
    // const oldProviders = new Set(Object.keys(this.config.providers));
    // const newProviders = new Set(Object.keys(newConfig.providers));

    // 停止监控
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // 更新配置
    this.config = newConfig;

    // 重新创建提供商
    await this.createProviders();

    // 重新启动监控
    if (this.config.monitoring?.enabled) {
      this.startMonitoring();
    }

    this.logger.info('模型工厂配置重新加载完成');
  }

  /**
   * 记录请求统计
   * @param providerType 提供商类型
   * @param success 是否成功
   * @param latency 延迟时间
   * @param tokens 使用的token数
   * @param cost 成本
   */
  public recordUsage(
    providerType: ChineseLLMType,
    success: boolean,
    latency: number,
    tokens: number = 0,
    cost: number = 0
  ): void {
    let stats = this.usageStats.get(providerType);

    if (!stats) {
      stats = {
        provider: providerType,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        averageLatency: 0,
        lastUsed: new Date()
      };
      this.usageStats.set(providerType, stats);
    }

    stats.totalRequests++;
    if (success) {
      stats.successfulRequests++;
    } else {
      stats.failedRequests++;
    }

    stats.totalTokens += tokens;
    stats.totalCost += cost;
    stats.averageLatency = (stats.averageLatency * (stats.totalRequests - 1) + latency) / stats.totalRequests;
    stats.lastUsed = new Date();

    // 更新健康状态
    this.updateProviderHealth(providerType, success, latency);
  }

  /**
   * 销毁模型工厂
   */
  public destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.logger.info('模型工厂已销毁');
  }

  /**
   * 加载配置
   */
  private loadConfig(): ModelFactoryConfig {
    const defaultConfig: ModelFactoryConfig = {
      providers: {
        [ChineseLLMType.BAIDU_WENXIN]: {
          enabled: false,
          config: { apiKey: '', secretKey: '', model: 'ernie-bot-turbo' }
        },
        [ChineseLLMType.ALIBABA_QWEN]: {
          enabled: false,
          config: { apiKey: '', model: 'qwen-turbo' }
        },
        [ChineseLLMType.TENCENT_HUNYUAN]: {
          enabled: false,
          config: { apiKey: '', model: 'hunyuan-lite' }
        },
        [ChineseLLMType.ZHIPU_GLM]: {
          enabled: false,
          config: { apiKey: '', model: 'glm-4' }
        },
        [ChineseLLMType.XUNFEI_SPARK]: {
          enabled: false,
          config: { apiKey: '', model: 'spark-lite' }
        },
        [ChineseLLMType.DEEPSEEK]: {
          enabled: false,
          config: { apiKey: '', model: 'deepseek-chat' }
        },
        [ChineseLLMType.MOONSHOT]: {
          enabled: false,
          config: { apiKey: '', model: 'moonshot-v1-8k' }
        },
        [ChineseLLMType.MINIMAX]: {
          enabled: false,
          config: { apiKey: '', model: 'abab6.5-chat' }
        },
        [ChineseLLMType.SENSETIME_NOVA]: {
          enabled: false,
          config: { apiKey: '', model: 'nova-ptc-xl-v1' }
        },
        [ChineseLLMType.BAICHUAN]: {
          enabled: false,
          config: { apiKey: '', model: 'baichuan2-turbo' }
        }
      },
      defaultProvider: ChineseLLMType.ALIBABA_QWEN,
      fallbackProviders: [ChineseLLMType.BAIDU_WENXIN, ChineseLLMType.ZHIPU_GLM],
      loadBalancing: {
        enabled: false,
        strategy: 'round_robin',
        healthCheck: true
      },
      monitoring: {
        enabled: true,
        metricsInterval: 60000,
        alertThresholds: {
          errorRate: 0.1,
          latency: 5000,
          tokenUsage: 100000
        }
      }
    };

    const userConfig = this.configManager.get('modelFactory', {});
    return { ...defaultConfig, ...userConfig };
  }

  /**
   * 创建提供商
   */
  private async createProviders(): Promise<void> {
    for (const [providerType, providerConfig] of Object.entries(this.config.providers)) {
      if (!providerConfig.enabled) {
        continue;
      }

      try {
        const provider = this.createProvider(providerType as ChineseLLMType, providerConfig.config);
        this.llmManager.registerProvider(providerType as ChineseLLMType, provider);

        // 初始化统计信息
        this.initializeProviderStats(providerType as ChineseLLMType);

        this.logger.info(`创建提供商成功: ${providerType}`);
      } catch (error) {
        this.logger.error(`创建提供商失败 ${providerType}: ${(error as Error).message}`);
      }
    }
  }

  /**
   * 创建单个提供商
   */
  private createProvider(type: ChineseLLMType, config: ModelConfig): ChineseLLMProvider {
    switch (type) {
      case ChineseLLMType.BAIDU_WENXIN:
        return new BaiduWenxinProvider(config, this.logger);

      case ChineseLLMType.ALIBABA_QWEN:
        return new AlibabaQwenProvider(config, this.logger);

      case ChineseLLMType.DEEPSEEK:
        return new DeepSeekProvider(config, this.logger);

      case ChineseLLMType.ZHIPU_GLM:
        return new ZhipuProvider(config, this.logger);

      case ChineseLLMType.XUNFEI_SPARK:
        return new SparkProvider(config as SparkConfig, this.logger);

      case ChineseLLMType.MOONSHOT:
        return new MoonshotProvider(config as MoonshotConfig, this.logger);

      // case ChineseLLMType.TENCENT_HUNYUAN:
      //   return new TencentHunyuanProvider(config, this.logger);

      default:
        throw new Error(`不支持的提供商类型: ${type}`);
    }
  }

  /**
   * 初始化提供商统计信息
   */
  private initializeProviderStats(providerType: ChineseLLMType): void {
    this.usageStats.set(providerType, {
      provider: providerType,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      averageLatency: 0,
      lastUsed: new Date()
    });

    this.providerHealth.set(providerType, {
      isHealthy: true,
      lastCheck: new Date(),
      errorRate: 0,
      averageLatency: 0,
      totalRequests: 0,
      failedRequests: 0
    });
  }

  /**
   * 获取可用提供商
   */
  private getAvailableProviders(excludeProviders?: ChineseLLMType[]): ChineseLLMType[] {
    const allProviders = this.llmManager.getRegisteredProviders();
    const excludeSet = new Set(excludeProviders || []);

    return allProviders.filter(provider => {
      if (excludeSet.has(provider)) return false;

      const health = this.providerHealth.get(provider);
      return health?.isHealthy !== false;
    });
  }

  /**
   * 基于负载均衡策略选择提供商
   */
  private selectByLoadBalancing(
    availableProviders: ChineseLLMType[],
    _requirements?: Record<string, unknown>
  ): ChineseLLMType {
    const strategy = this.config.loadBalancing?.strategy || 'round_robin';

    switch (strategy) {
      case 'round_robin':
        return this.selectRoundRobin(availableProviders);

      case 'least_cost':
        return this.selectLeastCost(availableProviders);

      case 'least_latency':
        return this.selectLeastLatency(availableProviders);

      case 'random':
        return availableProviders[Math.floor(Math.random() * availableProviders.length)];

      default:
        return availableProviders[0];
    }
  }

  /**
   * 轮询选择
   */
  private selectRoundRobin(providers: ChineseLLMType[]): ChineseLLMType {
    const provider = providers[this.roundRobinIndex % providers.length];
    this.roundRobinIndex++;
    return provider;
  }

  /**
   * 选择成本最低的提供商
   */
  private selectLeastCost(providers: ChineseLLMType[]): ChineseLLMType {
    let minCost = Infinity;
    let selectedProvider = providers[0];

    for (const provider of providers) {
      const providerConfig = this.config.providers[provider];
      const cost = providerConfig?.costPerToken || 0;

      if (cost < minCost) {
        minCost = cost;
        selectedProvider = provider;
      }
    }

    return selectedProvider;
  }

  /**
   * 选择延迟最低的提供商
   */
  private selectLeastLatency(providers: ChineseLLMType[]): ChineseLLMType {
    let minLatency = Infinity;
    let selectedProvider = providers[0];

    for (const provider of providers) {
      const health = this.providerHealth.get(provider);
      const latency = health?.averageLatency || 0;

      if (latency < minLatency) {
        minLatency = latency;
        selectedProvider = provider;
      }
    }

    return selectedProvider;
  }

  /**
   * 启动健康检查
   */
  private async startHealthCheck(): Promise<void> {
    // 每5分钟检查一次健康状态
    setInterval(async () => {
      const providers = this.llmManager.getRegisteredProviders();

      for (const provider of providers) {
        try {
          const llmProvider = this.llmManager.getProvider(provider);
          const isHealthy = await llmProvider.validateApiKey();

          const health = this.providerHealth.get(provider);
          if (health) {
            health.isHealthy = isHealthy;
            health.lastCheck = new Date();
          }

          this.logger.debug(`健康检查 ${provider}: ${isHealthy ? '正常' : '异常'}`);
        } catch (error) {
          this.logger.warn(`健康检查失败 ${provider}: ${(error as Error).message}`);

          const health = this.providerHealth.get(provider);
          if (health) {
            health.isHealthy = false;
            health.lastCheck = new Date();
            health.lastError = (error as Error).message;
          }
        }
      }
    }, 5 * 60 * 1000);
  }

  /**
   * 启动监控
   */
  private startMonitoring(): void {
    const interval = this.config.monitoring?.metricsInterval || 60000;

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkAlerts();
    }, interval);
  }

  /**
   * 收集指标
   */
  private collectMetrics(): void {
    const metrics = {
      timestamp: new Date(),
      providers: {} as Record<string, {
        totalCalls: number;
        successfulCalls: number;
        failedCalls: number;
        averageResponseTime: number;
        health: number;
      }>
    };

    for (const [provider, stats] of this.usageStats) {
      const health = this.providerHealth.get(provider);

      metrics.providers[provider] = {
        totalCalls: stats.totalRequests,
        successfulCalls: stats.successfulRequests,
        failedCalls: stats.failedRequests,
        averageResponseTime: stats.averageLatency,
        health: health?.isHealthy ? 1 : 0
      };
    }

    this.logger.debug('收集模型使用指标', metrics);
  }

  /**
   * 检查告警
   */
  private checkAlerts(): void {
    const thresholds = this.config.monitoring?.alertThresholds;
    if (!thresholds) return;

    for (const [provider, stats] of this.usageStats) {
      const errorRate = stats.totalRequests > 0 ? stats.failedRequests / stats.totalRequests : 0;

      if (errorRate > thresholds.errorRate) {
        this.logger.warn(`提供商 ${provider} 错误率过高: ${(errorRate * 100).toFixed(2)}%`);
      }

      if (stats.averageLatency > thresholds.latency) {
        this.logger.warn(`提供商 ${provider} 延迟过高: ${stats.averageLatency}ms`);
      }

      if (stats.totalTokens > thresholds.tokenUsage) {
        this.logger.warn(`提供商 ${provider} token使用量过高: ${stats.totalTokens}`);
      }
    }
  }

  /**
   * 更新提供商健康状态
   */
  private updateProviderHealth(
    providerType: ChineseLLMType,
    success: boolean,
    latency: number
  ): void {
    let health = this.providerHealth.get(providerType);

    if (!health) {
      health = {
        isHealthy: true,
        lastCheck: new Date(),
        errorRate: 0,
        averageLatency: 0,
        totalRequests: 0,
        failedRequests: 0
      };
      this.providerHealth.set(providerType, health);
    }

    health.totalRequests++;
    if (!success) {
      health.failedRequests++;
    }

    health.errorRate = health.failedRequests / health.totalRequests;
    health.averageLatency = (health.averageLatency * (health.totalRequests - 1) + latency) / health.totalRequests;
    health.lastCheck = new Date();

    // 根据错误率判断健康状态
    health.isHealthy = health.errorRate < 0.5; // 错误率超过50%认为不健康
  }
}
