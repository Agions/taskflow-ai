import { ModelAdapter } from './adapter/base';
import { ModelType, MultiModelConfig } from '../../types/config';
import { 
  ChatMessage, 
  ModelCallOptions, 
  ModelRequestParams, 
  ModelResponse 
} from '../../types/model';

/**
 * 任务复杂度评估结果
 */
interface TaskComplexity {
  level: 'simple' | 'medium' | 'complex';
  score: number;
  factors: string[];
}

/**
 * 模型性能指标
 */
interface ModelMetrics {
  responseTime: number;
  successRate: number;
  costPerToken: number;
  lastUsed: Date;
  errorCount: number;
}

/**
 * 多模型协作编排器
 * 实现智能模型选择、负载均衡和故障转移
 */
export class MultiModelOrchestrator {
  private adapters: Map<ModelType, ModelAdapter>;
  private config: MultiModelConfig;
  private metrics: Map<ModelType, ModelMetrics>;
  private loadBalanceIndex: number = 0;

  constructor(config: MultiModelConfig) {
    this.adapters = new Map();
    this.config = config;
    this.metrics = new Map();
  }

  /**
   * 注册模型适配器
   */
  public registerAdapter(modelType: ModelType, adapter: ModelAdapter): void {
    this.adapters.set(modelType, adapter);
    this.initializeMetrics(modelType);
  }

  /**
   * 智能模型选择
   */
  public async chat(params: ModelRequestParams, options?: ModelCallOptions): Promise<ModelResponse> {
    if (!this.config.enabled) {
      // 如果未启用多模型，使用主模型
      const primaryAdapter = this.adapters.get(this.config.primary);
      if (!primaryAdapter) {
        throw new Error(`Primary model ${this.config.primary} not available`);
      }
      return this.executeWithMetrics(this.config.primary, primaryAdapter, params, options);
    }

    // 评估任务复杂度
    const complexity = this.assessTaskComplexity(params);
    
    // 选择最适合的模型
    const selectedModel = this.selectOptimalModel(complexity, params);
    
    // 执行请求，如果失败则尝试备用模型
    return this.executeWithFallback(selectedModel, params, options);
  }

  /**
   * 流式聊天请求
   */
  public async chatStream(
    params: ModelRequestParams,
    onData: (content: string, done: boolean) => void,
    options?: ModelCallOptions
  ): Promise<void> {
    const complexity = this.assessTaskComplexity(params);
    const selectedModel = this.selectOptimalModel(complexity, params);
    
    const adapter = this.adapters.get(selectedModel);
    if (!adapter) {
      throw new Error(`Model ${selectedModel} not available`);
    }

    try {
      await adapter.chatStream(params, onData, options);
      this.updateMetrics(selectedModel, true, Date.now());
    } catch (error) {
      this.updateMetrics(selectedModel, false, Date.now());
      
      // 尝试备用模型
      if (this.config.fallback.length > 0) {
        const fallbackModel = this.config.fallback[0];
        const fallbackAdapter = this.adapters.get(fallbackModel);
        if (fallbackAdapter) {
          await fallbackAdapter.chatStream(params, onData, options);
          return;
        }
      }
      
      throw error;
    }
  }

  /**
   * 评估任务复杂度
   */
  private assessTaskComplexity(params: ModelRequestParams): TaskComplexity {
    let score = 0;
    const factors: string[] = [];

    // 消息长度评估
    const totalLength = params.messages.reduce((sum, msg) => sum + msg.content.length, 0);
    if (totalLength > 5000) {
      score += 3;
      factors.push('long_context');
    } else if (totalLength > 1000) {
      score += 1;
      factors.push('medium_context');
    }

    // 消息数量评估
    if (params.messages.length > 10) {
      score += 2;
      factors.push('multi_turn');
    }

    // 内容类型评估
    const content = params.messages.map(m => m.content).join(' ');
    if (content.includes('代码') || content.includes('编程') || content.includes('算法')) {
      score += 2;
      factors.push('code_related');
    }
    
    if (content.includes('分析') || content.includes('推理') || content.includes('逻辑')) {
      score += 2;
      factors.push('analytical');
    }

    // 输出长度要求
    if (params.maxTokens && params.maxTokens > 2000) {
      score += 1;
      factors.push('long_output');
    }

    // 确定复杂度等级
    let level: 'simple' | 'medium' | 'complex';
    if (score >= 5) {
      level = 'complex';
    } else if (score >= 2) {
      level = 'medium';
    } else {
      level = 'simple';
    }

    return { level, score, factors };
  }

  /**
   * 选择最优模型
   */
  private selectOptimalModel(complexity: TaskComplexity, params: ModelRequestParams): ModelType {
    const availableModels = Array.from(this.adapters.keys());
    
    if (this.config.loadBalancing && complexity.level === 'simple') {
      // 简单任务使用负载均衡
      return this.getLoadBalancedModel(availableModels);
    }

    if (this.config.costOptimization) {
      // 成本优化模式
      return this.getCostOptimalModel(complexity, availableModels);
    }

    // 性能优先模式
    return this.getPerformanceOptimalModel(complexity, availableModels);
  }

  /**
   * 负载均衡模型选择
   */
  private getLoadBalancedModel(availableModels: ModelType[]): ModelType {
    const model = availableModels[this.loadBalanceIndex % availableModels.length];
    this.loadBalanceIndex++;
    return model;
  }

  /**
   * 成本优化模型选择
   */
  private getCostOptimalModel(complexity: TaskComplexity, availableModels: ModelType[]): ModelType {
    // 根据复杂度和成本选择模型
    const modelCosts = {
      [ModelType.DEEPSEEK]: 0.001,
      [ModelType.QWEN]: 0.002,
      [ModelType.SPARK]: 0.003,
      [ModelType.ZHIPU]: 0.004,
      [ModelType.BAIDU]: 0.005,
      [ModelType.MOONSHOT]: 0.012,
      [ModelType.XUNFEI]: 0.003
    };

    if (complexity.level === 'simple') {
      // 简单任务选择最便宜的模型
      return availableModels.reduce((cheapest, current) => 
        modelCosts[current] < modelCosts[cheapest] ? current : cheapest
      );
    }

    // 复杂任务在性能和成本间平衡
    return this.config.primary;
  }

  /**
   * 性能优化模型选择
   */
  private getPerformanceOptimalModel(complexity: TaskComplexity, availableModels: ModelType[]): ModelType {
    // 根据历史性能指标选择
    let bestModel = this.config.primary;
    let bestScore = 0;

    for (const model of availableModels) {
      const metrics = this.metrics.get(model);
      if (metrics) {
        // 综合评分：成功率 * 响应速度权重
        const score = metrics.successRate * (1000 / (metrics.responseTime + 1));
        if (score > bestScore) {
          bestScore = score;
          bestModel = model;
        }
      }
    }

    return bestModel;
  }

  /**
   * 执行请求并处理故障转移
   */
  private async executeWithFallback(
    primaryModel: ModelType,
    params: ModelRequestParams,
    options?: ModelCallOptions
  ): Promise<ModelResponse> {
    const primaryAdapter = this.adapters.get(primaryModel);
    if (!primaryAdapter) {
      throw new Error(`Model ${primaryModel} not available`);
    }

    try {
      return await this.executeWithMetrics(primaryModel, primaryAdapter, params, options);
    } catch (error) {
      console.warn(`Primary model ${primaryModel} failed, trying fallback models`);
      
      // 尝试备用模型
      for (const fallbackModel of this.config.fallback) {
        const fallbackAdapter = this.adapters.get(fallbackModel);
        if (fallbackAdapter) {
          try {
            return await this.executeWithMetrics(fallbackModel, fallbackAdapter, params, options);
          } catch (fallbackError) {
            console.warn(`Fallback model ${fallbackModel} also failed`);
            continue;
          }
        }
      }

      // 所有模型都失败
      throw new Error(`All models failed. Last error: ${error.message}`);
    }
  }

  /**
   * 执行请求并记录指标
   */
  private async executeWithMetrics(
    modelType: ModelType,
    adapter: ModelAdapter,
    params: ModelRequestParams,
    options?: ModelCallOptions
  ): Promise<ModelResponse> {
    const startTime = Date.now();
    
    try {
      const response = await adapter.chat(params, options);
      const responseTime = Date.now() - startTime;
      this.updateMetrics(modelType, true, responseTime);
      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(modelType, false, responseTime);
      throw error;
    }
  }

  /**
   * 初始化模型指标
   */
  private initializeMetrics(modelType: ModelType): void {
    this.metrics.set(modelType, {
      responseTime: 1000,
      successRate: 1.0,
      costPerToken: 0.001,
      lastUsed: new Date(),
      errorCount: 0
    });
  }

  /**
   * 更新模型指标
   */
  private updateMetrics(modelType: ModelType, success: boolean, responseTime: number): void {
    const metrics = this.metrics.get(modelType);
    if (!metrics) return;

    // 更新响应时间（移动平均）
    metrics.responseTime = (metrics.responseTime * 0.8) + (responseTime * 0.2);
    
    // 更新成功率
    if (success) {
      metrics.successRate = Math.min(1.0, metrics.successRate + 0.01);
    } else {
      metrics.successRate = Math.max(0.0, metrics.successRate - 0.05);
      metrics.errorCount++;
    }
    
    metrics.lastUsed = new Date();
  }

  /**
   * 获取模型性能报告
   */
  public getPerformanceReport(): Record<string, ModelMetrics> {
    const report: Record<string, ModelMetrics> = {};
    for (const [modelType, metrics] of this.metrics.entries()) {
      report[modelType] = { ...metrics };
    }
    return report;
  }

  /**
   * 重置模型指标
   */
  public resetMetrics(): void {
    for (const modelType of this.adapters.keys()) {
      this.initializeMetrics(modelType);
    }
  }
}
