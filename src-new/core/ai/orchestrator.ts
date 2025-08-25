/**
 * 智能AI编排器
 * 负责多模型选择、负载均衡、故障转移等AI编排功能
 */

import { ConfigManager } from '../../infrastructure/config/manager';
import { CacheManager } from '../../infrastructure/storage/cache';
import { ModelFactory, ModelFactoryConfig } from './model-factory';
import { BaseModelAdapter, ModelRequest, ModelResponse } from './base-adapter';

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  endpoint: string;
  apiKey: string;
  maxTokens: number;
  costPerToken: number;
  isAvailable: boolean;
  lastResponseTime: number;
  errorRate: number;
}

export interface ModelCriteria {
  taskType: TaskType;
  complexity: ComplexityLevel;
  latencyRequirement: LatencyLevel;
  costSensitivity: CostLevel;
  quality: QualityLevel;
}

export interface AIResponse {
  content: string;
  model: string;
  tokens: number;
  confidence: number;
  cost: number;
  responseTime: number;
  metadata: Record<string, any>;
}

export enum TaskType {
  PARSING = 'parsing',
  PLANNING = 'planning',
  ANALYSIS = 'analysis',
  GENERATION = 'generation',
  REVIEW = 'review'
}

export enum ComplexityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  EXPERT = 'expert'
}

export enum LatencyLevel {
  REAL_TIME = 'real_time',    // < 1s
  FAST = 'fast',              // < 5s
  NORMAL = 'normal',          // < 30s
  BATCH = 'batch'             // > 30s
}

export enum CostLevel {
  MINIMAL = 'minimal',
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high'
}

export enum QualityLevel {
  BASIC = 'basic',
  GOOD = 'good',
  HIGH = 'high',
  PREMIUM = 'premium'
}

/**
 * 智能AI编排器
 * 实现多模型智能选择、负载均衡和故障转移
 */
export class AIOrchestrator {
  private modelFactory: ModelFactory;
  private loadBalancer: LoadBalancer;
  private healthMonitor: HealthMonitor;
  private costOptimizer: CostOptimizer;
  private configManager: ConfigManager;
  private cacheManager: CacheManager;
  private initialized = false;

  constructor(configManager: ConfigManager, cacheManager: CacheManager) {
    this.configManager = configManager;
    this.cacheManager = cacheManager;
    
    // 初始化模型工厂
    const factoryConfig: ModelFactoryConfig = {
      providers: configManager.get('models.providers', {}),
      defaultProvider: configManager.get('models.default', 'deepseek'),
      fallbackProviders: configManager.get('models.fallback', ['deepseek', 'zhipu']),
    };
    
    this.modelFactory = new ModelFactory(factoryConfig);
    this.loadBalancer = new LoadBalancer();
    this.healthMonitor = new HealthMonitor();
    this.costOptimizer = new CostOptimizer();
  }

  /**
   * 初始化AI编排器
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 初始化模型工厂
      await this.modelFactory.initialize();

      // 启动健康监控
      await this.healthMonitor.start(this.modelFactory);

      // 初始化负载均衡器
      await this.loadBalancer.initialize(this.modelFactory);

      // 初始化成本优化器
      await this.costOptimizer.initialize();

      this.initialized = true;
      console.log('✅ AI编排器初始化成功');

    } catch (error) {
      console.error('❌ AI编排器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 智能模型选择
   * @param criteria 选择标准
   */
  selectModel(criteria: ModelCriteria): BaseModelAdapter {
    this.ensureInitialized();

    // 使用负载均衡器选择最佳适配器
    const selectedAdapter = this.loadBalancer.selectOptimalAdapter({
      taskType: criteria.taskType,
      prioritizeCost: criteria.costSensitivity === CostLevel.MINIMAL,
      prioritizeSpeed: criteria.latencyRequirement === LatencyLevel.REAL_TIME,
      prioritizeQuality: criteria.quality === QualityLevel.PREMIUM,
    });

    const modelInfo = selectedAdapter.getModelInfo();
    console.log(`🎯 为任务类型 ${criteria.taskType} 选择模型: ${modelInfo.name} (${modelInfo.provider})`);
    return selectedAdapter;
  }

  /**
   * 执行AI提示处理
   * @param prompt 提示词
   * @param options 选项
   */
  async process(prompt: string, options?: AIOptions): Promise<AIResponse> {
    this.ensureInitialized();

    const startTime = Date.now();

    try {
      // 1. 分析任务复杂度
      const criteria = await this.analyzeTaskCriteria(prompt, options);

      // 2. 选择最优模型适配器
      const selectedAdapter = this.selectModel(criteria);
      const modelInfo = selectedAdapter.getModelInfo();

      // 3. 检查缓存
      const cacheKey = this.generateCacheKey(prompt, modelInfo.id);
      const cachedResponse = await this.cacheManager.get(cacheKey);
      
      if (cachedResponse && !options?.skipCache) {
        console.log('⚡ 使用缓存响应');
        return this.convertToAIResponse(cachedResponse as ModelResponse);
      }

      // 4. 执行AI调用
      const response = await this.executeModelCall(selectedAdapter, prompt, options);

      // 5. 缓存响应
      await this.cacheManager.set(cacheKey, response, 1800); // 30分钟缓存

      // 6. 转换响应格式
      const aiResponse = this.convertToAIResponse(response);

      return aiResponse;

    } catch (error) {
      console.error('❌ AI处理失败:', error);
      
      // 故障转移
      const fallbackResponse = await this.handleFailover(prompt, options, error as Error);
      return this.convertToAIResponse(fallbackResponse);
    }
  }

  /**
   * 提取需求信息
   * @param content 文档内容
   */
  async extractRequirements(content: ParsedContent): Promise<Requirement[]> {
    const prompt = this.buildRequirementExtractionPrompt(content);
    
    const criteria: ModelCriteria = {
      taskType: TaskType.PARSING,
      complexity: ComplexityLevel.MEDIUM,
      latencyRequirement: LatencyLevel.NORMAL,
      costSensitivity: CostLevel.NORMAL,
      quality: QualityLevel.HIGH,
    };
    
    const adapter = this.selectModel(criteria);
    const request: ModelRequest = {
      messages: [
        { role: 'system', content: '你是一个专业的需求分析师，擅长从PRD文档中提取结构化的需求信息。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      maxTokens: 2000,
    };
    
    const response = await adapter.chat(request);
    return this.parseRequirementsFromResponse(response.content);
  }

  /**
   * 生成任务建议
   * @param requirements 需求列表
   */
  async generateTaskSuggestions(requirements: Requirement[]): Promise<TaskSuggestion[]> {
    const prompt = this.buildTaskGenerationPrompt(requirements);
    
    const criteria: ModelCriteria = {
      taskType: TaskType.PLANNING,
      complexity: ComplexityLevel.HIGH,
      latencyRequirement: LatencyLevel.NORMAL,
      costSensitivity: CostLevel.NORMAL,
      quality: QualityLevel.HIGH,
    };
    
    const adapter = this.selectModel(criteria);
    const request: ModelRequest = {
      messages: [
        { role: 'system', content: '你是一个专业的项目管理师，擅长将需求分解为具体的开发任务。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      maxTokens: 3000,
    };
    
    const response = await adapter.chat(request);
    return this.parseTasksFromResponse(response.content);
  }

  /**
   * 获取编排器状态
   */
  getStatus(): OrchestratorStatus {
    const factoryStats = this.modelFactory.getFactoryStats();
    return {
      initialized: this.initialized,
      availableModels: factoryStats.activeAdapters,
      totalModels: factoryStats.totalAdapters,
      loadBalancer: this.loadBalancer.getStatus(),
      healthMonitor: this.healthMonitor.getStatus(),
      costOptimizer: this.costOptimizer.getStatus(),
      totalRequests: factoryStats.totalRequests,
      totalCost: factoryStats.totalCost,
      averageResponseTime: factoryStats.averageResponseTime,
    };
  }

  /**
   * 关闭编排器
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      await this.healthMonitor.stop();
      await this.loadBalancer.shutdown();
      await this.modelFactory.shutdown();
      
      this.initialized = false;
      console.log('✅ AI编排器已关闭');

    } catch (error) {
      console.error('❌ AI编排器关闭失败:', error);
      throw error;
    }
  }

  // 私有方法













  private async analyzeTaskCriteria(prompt: string, options?: AIOptions): Promise<ModelCriteria> {
    // 基于提示词分析任务特征
    const complexity = this.analyzeComplexity(prompt);
    const taskType = this.analyzeTaskType(prompt);
    
    return {
      taskType,
      complexity,
      latencyRequirement: options?.realTime ? LatencyLevel.REAL_TIME : LatencyLevel.NORMAL,
      costSensitivity: CostLevel.NORMAL,
      quality: QualityLevel.HIGH
    };
  }

  private analyzeComplexity(prompt: string): ComplexityLevel {
    const complexityIndicators = {
      [ComplexityLevel.EXPERT]: ['架构设计', '系统设计', '复杂算法', '深度分析'],
      [ComplexityLevel.HIGH]: ['详细分析', '多步骤', '综合评估'],
      [ComplexityLevel.MEDIUM]: ['分析', '规划', '总结'],
      [ComplexityLevel.LOW]: ['简单', '基础', '列表']
    };

    for (const [level, indicators] of Object.entries(complexityIndicators)) {
      if (indicators.some(indicator => prompt.includes(indicator))) {
        return level as ComplexityLevel;
      }
    }

    return ComplexityLevel.MEDIUM;
  }

  private analyzeTaskType(prompt: string): TaskType {
    const taskTypeKeywords = {
      [TaskType.PARSING]: ['解析', '提取', '识别', 'parse', 'extract'],
      [TaskType.PLANNING]: ['规划', '计划', '任务', 'plan', 'schedule'],
      [TaskType.ANALYSIS]: ['分析', '评估', 'analyze', 'evaluate'],
      [TaskType.GENERATION]: ['生成', '创建', 'generate', 'create'],
      [TaskType.REVIEW]: ['审查', '检查', 'review', 'check']
    };

    for (const [type, keywords] of Object.entries(taskTypeKeywords)) {
      if (keywords.some(keyword => prompt.toLowerCase().includes(keyword))) {
        return type as TaskType;
      }
    }

    return TaskType.ANALYSIS;
  }

  private async executeModelCall(adapter: BaseModelAdapter, prompt: string, options?: AIOptions): Promise<ModelResponse> {
    const request: ModelRequest = {
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
      stream: options?.stream,
    };

    return await adapter.chat(request);
  }

  private async getCost(response: ModelResponse): Promise<number> {
    return response.cost || 0;
  }

  private convertToAIResponse(modelResponse: ModelResponse): AIResponse {
    return {
      content: modelResponse.content,
      model: modelResponse.metadata?.provider || 'unknown',
      tokens: modelResponse.usage.totalTokens,
      confidence: 0.85, // 默认置信度
      responseTime: modelResponse.responseTime,
      metadata: modelResponse.metadata || {},
    };
  }

  private async handleFailover(prompt: string, options?: AIOptions, error?: Error): Promise<ModelResponse> {
    console.log('🔄 启动故障转移机制');

    try {
      // 使用默认适配器进行重试
      const fallbackAdapter = this.modelFactory.getDefaultAdapter();
      const modelInfo = fallbackAdapter.getModelInfo();
      
      console.log(`🆘 使用备用模型: ${modelInfo.name} (${modelInfo.provider})`);
      
      const request: ModelRequest = {
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: options?.temperature || 0.7,
        maxTokens: options?.maxTokens || 1000,
      };
      
      return await fallbackAdapter.chat(request);
    } catch (fallbackError) {
      console.error('🆘 备用模型也失败:', fallbackError);
      throw new Error(`所有模型都不可用: ${error?.message}`);
    }
  }

  private generateCacheKey(prompt: string, modelId: string): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(prompt + modelId).digest('hex');
    return `ai_response:${hash}`;
  }



  private buildRequirementExtractionPrompt(content: ParsedContent): string {
    return `请分析以下PRD文档内容，提取出具体的功能需求：

${content.text}

请按以下格式输出：
1. 需求标题
2. 需求描述
3. 验收标准
4. 优先级
`;
  }

  private buildTaskGenerationPrompt(requirements: Requirement[]): string {
    const reqText = requirements.map(r => `- ${r.title}: ${r.description}`).join('\n');
    
    return `基于以下需求，生成详细的开发任务：

${reqText}

请为每个需求生成具体的开发任务，包括：
1. 任务标题
2. 任务描述
3. 预估工时
4. 依赖关系
5. 技能要求
`;
  }

  private parseRequirementsFromResponse(content: string): Requirement[] {
    // 解析AI响应中的需求信息
    // 这里需要实现具体的解析逻辑
    return [];
  }

  private parseTasksFromResponse(content: string): TaskSuggestion[] {
    // 解析AI响应中的任务信息
    // 这里需要实现具体的解析逻辑
    return [];
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('AI编排器尚未初始化');
    }
  }
}

// 辅助类

class LoadBalancer {
  private roundRobinIndex = 0;
  private modelFactory!: ModelFactory;
  private strategy: 'round_robin' | 'weighted' | 'least_connections' = 'round_robin';
  private connectionCounts = new Map<string, number>();

  async initialize(modelFactory: ModelFactory): Promise<void> {
    this.modelFactory = modelFactory;
    console.log('🔄 负载均衡器初始化完成');
  }

  selectOptimalAdapter(criteria: {
    taskType: TaskType;
    prioritizeCost?: boolean;
    prioritizeSpeed?: boolean;
    prioritizeQuality?: boolean;
  }): BaseModelAdapter {
    const adapters = this.modelFactory.getAvailableAdapters();
    
    if (adapters.length === 0) {
      throw new Error('没有可用的模型适配器');
    }

    // 评分机制选择最佳适配器
    const scoredAdapters = adapters.map(adapter => {
      const info = adapter.getModelInfo();
      let score = 0;

      // 基础可用性评分
      if (adapter.isHealthy()) score += 50;
      
      // 响应时间评分（越快越好）
      const avgResponseTime = info.metadata?.averageResponseTime || 1000;
      score += Math.max(0, 50 - avgResponseTime / 50);
      
      // 成本评分（如果需要优化成本）
      if (criteria.prioritizeCost) {
        const cost = info.costPerToken || 0.001;
        score += Math.max(0, 30 - cost * 10000);
      }
      
      // 质量评分（根据模型能力）
      if (criteria.prioritizeQuality) {
        const capabilities = info.capabilities;
        if (capabilities.reasoning) score += 20;
        if (capabilities.codeGeneration && criteria.taskType === TaskType.GENERATION) score += 15;
        if (capabilities.multimodal) score += 10;
      }
      
      // 速度优先
      if (criteria.prioritizeSpeed) {
        score += Math.max(0, 40 - avgResponseTime / 25);
      }

      return { adapter, score };
    });

    // 按评分排序
    scoredAdapters.sort((a, b) => b.score - a.score);

    // 根据策略选择
    switch (this.strategy) {
      case 'round_robin':
        const topAdapters = scoredAdapters.slice(0, Math.min(3, scoredAdapters.length));
        const selected = topAdapters[this.roundRobinIndex % topAdapters.length];
        this.roundRobinIndex++;
        return selected.adapter;
        
      case 'least_connections':
        const leastConnected = scoredAdapters.reduce((min, current) => {
          const currentId = current.adapter.getModelInfo().id;
          const minId = min.adapter.getModelInfo().id;
          const currentConnections = this.connectionCounts.get(currentId) || 0;
          const minConnections = this.connectionCounts.get(minId) || 0;
          return currentConnections < minConnections ? current : min;
        });
        this.incrementConnections(leastConnected.adapter.getModelInfo().id);
        return leastConnected.adapter;
        
      default:
        return scoredAdapters[0].adapter;
    }
  }

  private incrementConnections(modelId: string): void {
    const current = this.connectionCounts.get(modelId) || 0;
    this.connectionCounts.set(modelId, current + 1);
  }

  decrementConnections(modelId: string): void {
    const current = this.connectionCounts.get(modelId) || 0;
    this.connectionCounts.set(modelId, Math.max(0, current - 1));
  }

  setStrategy(strategy: 'round_robin' | 'weighted' | 'least_connections'): void {
    this.strategy = strategy;
    console.log(`🔄 负载均衡策略已切换为: ${strategy}`);
  }

  getStatus(): any {
    return {
      type: this.strategy,
      roundRobinIndex: this.roundRobinIndex,
      connectionCounts: Object.fromEntries(this.connectionCounts),
      availableAdapters: this.modelFactory?.getAvailableAdapters().length || 0,
    };
  }

  async shutdown(): Promise<void> {
    this.connectionCounts.clear();
    console.log('🔄 负载均衡器已关闭');
  }
}

class HealthMonitor {
  private checkInterval?: NodeJS.Timeout;
  private modelFactory!: ModelFactory;
  private healthHistory = new Map<string, HealthRecord[]>();
  private readonly maxHistorySize = 100;

  async start(modelFactory: ModelFactory): Promise<void> {
    this.modelFactory = modelFactory;
    
    // 立即进行一次健康检查
    await this.performHealthCheck();
    
    // 启动定期检查
    this.checkInterval = setInterval(() => {
      this.performHealthCheck().catch(error => 
        console.error('健康检查失败:', error)
      );
    }, 30000); // 每30秒检查一次

    console.log('💓 健康监控器启动');
  }

  async stop(): Promise<void> {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    console.log('💓 健康监控器停止');
  }

  private async performHealthCheck(): Promise<void> {
    const adapters = this.modelFactory.getAvailableAdapters();
    const checkPromises = adapters.map(adapter => this.checkAdapterHealth(adapter));
    
    await Promise.allSettled(checkPromises);
  }

  private async checkAdapterHealth(adapter: BaseModelAdapter): Promise<void> {
    const modelInfo = adapter.getModelInfo();
    const startTime = Date.now();
    
    try {
      // 执行简单的健康检查请求
      const testRequest: ModelRequest = {
        messages: [{ role: 'user', content: 'ping' }],
        maxTokens: 5,
        temperature: 0,
      };
      
      const response = await adapter.chat(testRequest);
      const responseTime = Date.now() - startTime;
      
      const healthRecord: HealthRecord = {
        timestamp: new Date(),
        isHealthy: true,
        responseTime,
        error: null,
        tokensUsed: response.usage.totalTokens,
      };
      
      this.recordHealth(modelInfo.id, healthRecord);
      
    } catch (error) {
      const healthRecord: HealthRecord = {
        timestamp: new Date(),
        isHealthy: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        tokensUsed: 0,
      };
      
      this.recordHealth(modelInfo.id, healthRecord);
      console.warn(`⚠️ 模型 ${modelInfo.name} 健康检查失败:`, error);
    }
  }

  private recordHealth(modelId: string, record: HealthRecord): void {
    if (!this.healthHistory.has(modelId)) {
      this.healthHistory.set(modelId, []);
    }
    
    const history = this.healthHistory.get(modelId)!;
    history.push(record);
    
    // 保持历史记录大小
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
  }

  getModelHealth(modelId: string): ModelHealthStatus {
    const history = this.healthHistory.get(modelId) || [];
    
    if (history.length === 0) {
      return {
        isHealthy: false,
        healthScore: 0,
        averageResponseTime: 0,
        errorRate: 1,
        lastCheck: null,
        uptime: 0,
      };
    }
    
    const recent = history.slice(-10); // 最近10次检查
    const healthyCount = recent.filter(r => r.isHealthy).length;
    const healthScore = healthyCount / recent.length;
    
    const avgResponseTime = recent
      .filter(r => r.isHealthy)
      .reduce((sum, r) => sum + r.responseTime, 0) / Math.max(1, healthyCount);
    
    const errorRate = (recent.length - healthyCount) / recent.length;
    const lastCheck = history[history.length - 1];
    
    // 计算可用时间百分比
    const totalChecks = history.length;
    const totalHealthy = history.filter(r => r.isHealthy).length;
    const uptime = totalHealthy / totalChecks;
    
    return {
      isHealthy: lastCheck.isHealthy && healthScore > 0.7,
      healthScore,
      averageResponseTime: avgResponseTime,
      errorRate,
      lastCheck: lastCheck.timestamp,
      uptime,
    };
  }

  getAllHealthStatus(): Map<string, ModelHealthStatus> {
    const status = new Map<string, ModelHealthStatus>();
    
    for (const modelId of this.healthHistory.keys()) {
      status.set(modelId, this.getModelHealth(modelId));
    }
    
    return status;
  }

  getStatus(): any {
    const allStatus = this.getAllHealthStatus();
    const healthyCount = Array.from(allStatus.values()).filter(s => s.isHealthy).length;
    
    return {
      active: !!this.checkInterval,
      monitoredModels: allStatus.size,
      healthyModels: healthyCount,
      overallHealth: allStatus.size > 0 ? healthyCount / allStatus.size : 0,
      lastCheckTime: new Date(),
    };
  }
}

class CostOptimizer {
  private costHistory = new Map<string, CostRecord[]>();
  private dailyBudget = 100; // 默认每日预算（美元）
  private monthlyBudget = 2000; // 默认每月预算
  private costThresholds = {
    warning: 0.8, // 80%时警告
    critical: 0.95, // 95%时严重告警
  };

  async initialize(): Promise<void> {
    // 加载成本配置
    console.log('💰 成本优化器初始化完成');
  }

  recordCost(modelId: string, cost: number, tokens: number, taskType: TaskType): void {
    const record: CostRecord = {
      timestamp: new Date(),
      modelId,
      cost,
      tokens,
      taskType,
      costPerToken: cost / tokens,
    };
    
    if (!this.costHistory.has(modelId)) {
      this.costHistory.set(modelId, []);
    }
    
    this.costHistory.get(modelId)!.push(record);
    
    // 检查预算警告
    this.checkBudgetAlerts();
  }

  private checkBudgetAlerts(): void {
    const todayCost = this.getTodayCost();
    const monthCost = this.getMonthCost();
    
    // 每日预算检查
    const dailyUsage = todayCost / this.dailyBudget;
    if (dailyUsage >= this.costThresholds.critical) {
      console.error(`🚨 每日预算即将超限: ${(dailyUsage * 100).toFixed(1)}%`);
    } else if (dailyUsage >= this.costThresholds.warning) {
      console.warn(`⚠️ 每日预算警告: ${(dailyUsage * 100).toFixed(1)}%`);
    }
    
    // 每月预算检查
    const monthlyUsage = monthCost / this.monthlyBudget;
    if (monthlyUsage >= this.costThresholds.critical) {
      console.error(`🚨 每月预算即将超限: ${(monthlyUsage * 100).toFixed(1)}%`);
    } else if (monthlyUsage >= this.costThresholds.warning) {
      console.warn(`⚠️ 每月预算警告: ${(monthlyUsage * 100).toFixed(1)}%`);
    }
  }

  getTodayCost(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let total = 0;
    for (const records of this.costHistory.values()) {
      total += records
        .filter(r => r.timestamp >= today)
        .reduce((sum, r) => sum + r.cost, 0);
    }
    
    return total;
  }

  getMonthCost(): number {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    let total = 0;
    for (const records of this.costHistory.values()) {
      total += records
        .filter(r => r.timestamp >= monthStart)
        .reduce((sum, r) => sum + r.cost, 0);
    }
    
    return total;
  }

  getMostEfficientModel(taskType: TaskType): string | null {
    const modelEfficiency = new Map<string, number>();
    
    for (const [modelId, records] of this.costHistory) {
      const taskRecords = records.filter(r => r.taskType === taskType);
      if (taskRecords.length === 0) continue;
      
      const avgCostPerToken = taskRecords.reduce((sum, r) => sum + r.costPerToken, 0) / taskRecords.length;
      modelEfficiency.set(modelId, avgCostPerToken);
    }
    
    if (modelEfficiency.size === 0) return null;
    
    // 返回成本最低的模型
    let bestModel = '';
    let lowestCost = Infinity;
    
    for (const [modelId, cost] of modelEfficiency) {
      if (cost < lowestCost) {
        lowestCost = cost;
        bestModel = modelId;
      }
    }
    
    return bestModel;
  }

  getCostAnalysis(): CostAnalysis {
    const totalCost = this.getMonthCost();
    const todayCost = this.getTodayCost();
    
    // 按模型分组成本
    const costByModel = new Map<string, number>();
    for (const [modelId, records] of this.costHistory) {
      const modelCost = records.reduce((sum, r) => sum + r.cost, 0);
      costByModel.set(modelId, modelCost);
    }
    
    // 按任务类型分组成本
    const costByTaskType = new Map<TaskType, number>();
    for (const records of this.costHistory.values()) {
      for (const record of records) {
        const current = costByTaskType.get(record.taskType) || 0;
        costByTaskType.set(record.taskType, current + record.cost);
      }
    }
    
    return {
      totalCost,
      todayCost,
      monthlyBudget: this.monthlyBudget,
      dailyBudget: this.dailyBudget,
      budgetUsage: {
        daily: todayCost / this.dailyBudget,
        monthly: totalCost / this.monthlyBudget,
      },
      costByModel: Object.fromEntries(costByModel),
      costByTaskType: Object.fromEntries(costByTaskType),
      recommendations: this.generateRecommendations(),
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // 分析高成本模型
    const analysis = this.getCostAnalysis();
    const sortedModelCosts = Object.entries(analysis.costByModel)
      .sort(([,a], [,b]) => b - a);
    
    if (sortedModelCosts.length > 1) {
      const [highestModel, highestCost] = sortedModelCosts[0];
      const [secondModel, secondCost] = sortedModelCosts[1];
      
      if (highestCost > secondCost * 2) {
        recommendations.push(`考虑减少对模型 ${highestModel} 的使用，成本较高`);
      }
    }
    
    // 预算使用建议
    if (analysis.budgetUsage.monthly > 0.8) {
      recommendations.push('本月预算使用较高，建议优化模型选择策略');
    }
    
    if (analysis.budgetUsage.daily > 0.9) {
      recommendations.push('今日预算接近上限，建议暂缓非紧急任务');
    }
    
    return recommendations;
  }

  setBudget(daily: number, monthly: number): void {
    this.dailyBudget = daily;
    this.monthlyBudget = monthly;
    console.log(`💰 预算已更新: 每日 $${daily}, 每月 $${monthly}`);
  }

  getStatus(): any {
    const analysis = this.getCostAnalysis();
    return {
      enabled: true,
      totalCost: analysis.totalCost,
      budgetUsage: analysis.budgetUsage,
      recommendations: analysis.recommendations,
      trackedModels: this.costHistory.size,
    };
  }
}

// 类型定义
export interface ParsedContent {
  text: string;
  metadata: Record<string, any>;
}

export interface Requirement {
  id: string;
  title: string;
  description: string;
  priority: string;
  acceptance: string[];
}

export interface TaskSuggestion {
  title: string;
  description: string;
  estimatedHours: number;
  dependencies: string[];
  skills: string[];
}

export interface AIOptions {
  taskType?: TaskType;
  temperature?: number;
  maxTokens?: number;
  skipCache?: boolean;
  realTime?: boolean;
}

export interface OrchestratorStatus {
  initialized: boolean;
  availableModels: number;
  totalModels: number;
  loadBalancer: any;
  healthMonitor: any;
  costOptimizer: any;
  totalRequests: number;
  totalCost: number;
  averageResponseTime: number;
}

export interface HealthRecord {
  timestamp: Date;
  isHealthy: boolean;
  responseTime: number;
  error: string | null;
  tokensUsed: number;
}

export interface ModelHealthStatus {
  isHealthy: boolean;
  healthScore: number;
  averageResponseTime: number;
  errorRate: number;
  lastCheck: Date | null;
  uptime: number;
}

export interface CostRecord {
  timestamp: Date;
  modelId: string;
  cost: number;
  tokens: number;
  taskType: TaskType;
  costPerToken: number;
}

export interface CostAnalysis {
  totalCost: number;
  todayCost: number;
  monthlyBudget: number;
  dailyBudget: number;
  budgetUsage: {
    daily: number;
    monthly: number;
  };
  costByModel: Record<string, number>;
  costByTaskType: Record<string, number>;
  recommendations: string[];
}