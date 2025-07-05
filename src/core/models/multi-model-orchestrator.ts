import { ModelType, MultiModelConfig } from '../../types/config';
import {
  ModelCallOptions,
  ModelRequestParams,
  ModelResponse
} from '../../types/model';
import { ModelAdapter } from './adapter/base';

/**
 * 任务复杂度评估结果
 */
interface TaskComplexity {
  level: 'simple' | 'medium' | 'complex';
  score: number;
  factors: string[];
}

/**
 * 复杂任务定义
 */
interface ComplexTask {
  description: string;
  type: 'code_generation' | 'documentation' | 'testing' | 'analysis' | 'planning' | 'review';
  context: {
    projectType?: string;
    technologies?: string[];
    constraints?: string[];
    deadline?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
  };
  options: {
    useMultipleModels?: boolean;
    qualityCheck?: boolean;
    fallbackEnabled?: boolean;
    parallelProcessing?: boolean;
  };
}

/**
 * 任务分解结果
 */
interface TaskBreakdownResult {
  subtasks: SubTask[];
  dependencies: TaskDependency[];
  estimatedTime: number;
  recommendedModels: ModelType[];
  executionPlan: ExecutionStep[];
}

/**
 * 子任务定义
 */
interface SubTask {
  id: string;
  title: string;
  description: string;
  type: string;
  estimatedHours: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiredSkills: string[];
  recommendedModel: ModelType;
  dependencies: string[];
}

/**
 * 任务依赖关系
 */
interface TaskDependency {
  from: string;
  to: string;
  type: 'blocking' | 'soft' | 'parallel';
}

/**
 * 执行步骤
 */
interface ExecutionStep {
  step: number;
  tasks: string[];
  parallelExecution: boolean;
  estimatedDuration: number;
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
  private selectOptimalModel(complexity: TaskComplexity, _params: ModelRequestParams): ModelType {
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
          } catch {
            console.warn(`Fallback model ${fallbackModel} also failed`);
            continue;
          }
        }
      }

      // 所有模型都失败
      throw new Error(`All models failed. Last error: ${error instanceof Error ? error.message : String(error)}`);
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

  /**
   * 处理复杂任务 - 类似AugmentCode的任务分解功能
   */
  public async processComplexTask(task: ComplexTask): Promise<TaskBreakdownResult> {
    // 1. 分析任务复杂度和类型
    const complexity = this.analyzeTaskComplexity(task);

    // 2. 智能任务分解
    const subtasks = await this.decomposeTask(task, complexity);

    // 3. 生成依赖关系
    const dependencies = this.generateDependencies(subtasks);

    // 4. 估算时间和推荐模型
    const estimatedTime = this.estimateExecutionTime(subtasks);
    const recommendedModels = this.recommendModelsForTask(task, subtasks);

    // 5. 生成执行计划
    const executionPlan = this.generateExecutionPlan(subtasks, dependencies);

    return {
      subtasks,
      dependencies,
      estimatedTime,
      recommendedModels,
      executionPlan
    };
  }

  /**
   * 分析任务复杂度
   */
  private analyzeTaskComplexity(task: ComplexTask): TaskComplexity {
    let score = 0;
    const factors: string[] = [];

    // 基于任务类型评分
    switch (task.type) {
      case 'code_generation':
        score += 3;
        factors.push('code_complexity');
        break;
      case 'analysis':
        score += 2;
        factors.push('analytical_thinking');
        break;
      case 'planning':
        score += 2;
        factors.push('strategic_planning');
        break;
      case 'documentation':
        score += 1;
        factors.push('documentation');
        break;
      case 'testing':
        score += 2;
        factors.push('testing_complexity');
        break;
      case 'review':
        score += 1;
        factors.push('review_process');
        break;
    }

    // 基于技术栈复杂度
    if (task.context.technologies) {
      if (task.context.technologies.length > 3) {
        score += 2;
        factors.push('multi_technology');
      }

      // 检查复杂技术栈
      const complexTech = ['kubernetes', 'microservices', 'blockchain', 'ai', 'ml'];
      if (task.context.technologies.some(tech => complexTech.includes(tech.toLowerCase()))) {
        score += 2;
        factors.push('complex_technology');
      }
    }

    // 基于约束条件
    if (task.context.constraints && task.context.constraints.length > 0) {
      score += 1;
      factors.push('constraints');
    }

    // 基于优先级
    if (task.context.priority === 'critical') {
      score += 1;
      factors.push('high_priority');
    }

    // 基于描述长度和复杂度
    if (task.description.length > 500) {
      score += 1;
      factors.push('detailed_requirements');
    }

    // 确定复杂度等级
    let level: 'simple' | 'medium' | 'complex';
    if (score <= 3) {
      level = 'simple';
    } else if (score <= 6) {
      level = 'medium';
    } else {
      level = 'complex';
    }

    return { level, score, factors };
  }

  /**
   * 智能任务分解
   */
  private async decomposeTask(task: ComplexTask, complexity: TaskComplexity): Promise<SubTask[]> {
    const subtasks: SubTask[] = [];

    // 基于任务类型进行分解
    switch (task.type) {
      case 'code_generation':
        subtasks.push(...this.decomposeCodeGenerationTask(task, complexity));
        break;
      case 'analysis':
        subtasks.push(...this.decomposeAnalysisTask(task, complexity));
        break;
      case 'planning':
        subtasks.push(...this.decomposePlanningTask(task, complexity));
        break;
      case 'documentation':
        subtasks.push(...this.decomposeDocumentationTask(task, complexity));
        break;
      case 'testing':
        subtasks.push(...this.decomposeTestingTask(task, complexity));
        break;
      case 'review':
        subtasks.push(...this.decomposeReviewTask(task, complexity));
        break;
    }

    return subtasks;
  }

  /**
   * 分解代码生成任务
   */
  private decomposeCodeGenerationTask(task: ComplexTask, complexity: TaskComplexity): SubTask[] {
    const baseId = `code_${Date.now()}`;
    const subtasks: SubTask[] = [];

    // 需求分析
    subtasks.push({
      id: `${baseId}_analysis`,
      title: '需求分析',
      description: '分析代码生成需求，确定技术方案和架构设计',
      type: 'analysis',
      estimatedHours: complexity.level === 'complex' ? 4 : complexity.level === 'medium' ? 2 : 1,
      priority: 'high',
      requiredSkills: ['系统分析', '架构设计'],
      recommendedModel: ModelType.QWEN,
      dependencies: []
    });

    // 核心代码实现
    subtasks.push({
      id: `${baseId}_core`,
      title: '核心代码实现',
      description: '实现核心业务逻辑和主要功能模块',
      type: 'implementation',
      estimatedHours: complexity.level === 'complex' ? 12 : complexity.level === 'medium' ? 8 : 4,
      priority: 'high',
      requiredSkills: ['编程', '算法设计'],
      recommendedModel: ModelType.DEEPSEEK,
      dependencies: [`${baseId}_analysis`]
    });

    // 测试代码
    subtasks.push({
      id: `${baseId}_tests`,
      title: '测试代码编写',
      description: '编写单元测试和集成测试',
      type: 'testing',
      estimatedHours: complexity.level === 'complex' ? 6 : complexity.level === 'medium' ? 4 : 2,
      priority: 'medium',
      requiredSkills: ['测试设计', '质量保证'],
      recommendedModel: ModelType.ZHIPU,
      dependencies: [`${baseId}_core`]
    });

    // 文档编写
    subtasks.push({
      id: `${baseId}_docs`,
      title: '技术文档',
      description: '编写API文档、使用说明和技术规范',
      type: 'documentation',
      estimatedHours: complexity.level === 'complex' ? 4 : complexity.level === 'medium' ? 2 : 1,
      priority: 'low',
      requiredSkills: ['技术写作', '文档设计'],
      recommendedModel: ModelType.MOONSHOT,
      dependencies: [`${baseId}_core`]
    });

    return subtasks;
  }

  /**
   * 分解分析任务
   */
  private decomposeAnalysisTask(task: ComplexTask, complexity: TaskComplexity): SubTask[] {
    const baseId = `analysis_${Date.now()}`;
    const subtasks: SubTask[] = [];

    subtasks.push({
      id: `${baseId}_data_collection`,
      title: '数据收集',
      description: '收集和整理分析所需的数据和信息',
      type: 'data_collection',
      estimatedHours: complexity.level === 'complex' ? 3 : 2,
      priority: 'high',
      requiredSkills: ['数据收集', '信息整理'],
      recommendedModel: ModelType.QWEN,
      dependencies: []
    });

    subtasks.push({
      id: `${baseId}_analysis`,
      title: '深度分析',
      description: '对收集的数据进行深度分析和洞察挖掘',
      type: 'analysis',
      estimatedHours: complexity.level === 'complex' ? 8 : complexity.level === 'medium' ? 5 : 3,
      priority: 'high',
      requiredSkills: ['数据分析', '逻辑推理'],
      recommendedModel: ModelType.DEEPSEEK,
      dependencies: [`${baseId}_data_collection`]
    });

    subtasks.push({
      id: `${baseId}_report`,
      title: '分析报告',
      description: '生成分析报告和建议方案',
      type: 'documentation',
      estimatedHours: complexity.level === 'complex' ? 4 : 2,
      priority: 'medium',
      requiredSkills: ['报告写作', '数据可视化'],
      recommendedModel: ModelType.MOONSHOT,
      dependencies: [`${baseId}_analysis`]
    });

    return subtasks;
  }

  /**
   * 分解规划任务
   */
  private decomposePlanningTask(task: ComplexTask, complexity: TaskComplexity): SubTask[] {
    const baseId = `planning_${Date.now()}`;
    const subtasks: SubTask[] = [];

    subtasks.push({
      id: `${baseId}_scope`,
      title: '范围定义',
      description: '明确项目范围、目标和约束条件',
      type: 'scope_definition',
      estimatedHours: complexity.level === 'complex' ? 4 : 2,
      priority: 'critical',
      requiredSkills: ['项目管理', '需求分析'],
      recommendedModel: ModelType.QWEN,
      dependencies: []
    });

    subtasks.push({
      id: `${baseId}_breakdown`,
      title: '任务分解',
      description: '将项目分解为可执行的具体任务',
      type: 'task_breakdown',
      estimatedHours: complexity.level === 'complex' ? 6 : complexity.level === 'medium' ? 4 : 2,
      priority: 'high',
      requiredSkills: ['任务分解', '工作估算'],
      recommendedModel: ModelType.DEEPSEEK,
      dependencies: [`${baseId}_scope`]
    });

    subtasks.push({
      id: `${baseId}_timeline`,
      title: '时间规划',
      description: '制定项目时间表和里程碑计划',
      type: 'timeline_planning',
      estimatedHours: complexity.level === 'complex' ? 3 : 2,
      priority: 'high',
      requiredSkills: ['时间管理', '资源规划'],
      recommendedModel: ModelType.ZHIPU,
      dependencies: [`${baseId}_breakdown`]
    });

    return subtasks;
  }

  /**
   * 分解文档任务
   */
  private decomposeDocumentationTask(task: ComplexTask, complexity: TaskComplexity): SubTask[] {
    const baseId = `docs_${Date.now()}`;
    const subtasks: SubTask[] = [];

    subtasks.push({
      id: `${baseId}_outline`,
      title: '文档大纲',
      description: '设计文档结构和内容大纲',
      type: 'outline',
      estimatedHours: 1,
      priority: 'high',
      requiredSkills: ['文档设计', '信息架构'],
      recommendedModel: ModelType.QWEN,
      dependencies: []
    });

    subtasks.push({
      id: `${baseId}_content`,
      title: '内容编写',
      description: '编写详细的文档内容',
      type: 'content_writing',
      estimatedHours: complexity.level === 'complex' ? 8 : complexity.level === 'medium' ? 5 : 3,
      priority: 'medium',
      requiredSkills: ['技术写作', '内容创作'],
      recommendedModel: ModelType.MOONSHOT,
      dependencies: [`${baseId}_outline`]
    });

    subtasks.push({
      id: `${baseId}_review`,
      title: '文档审核',
      description: '审核文档质量和准确性',
      type: 'review',
      estimatedHours: 2,
      priority: 'medium',
      requiredSkills: ['质量审核', '编辑校对'],
      recommendedModel: ModelType.ZHIPU,
      dependencies: [`${baseId}_content`]
    });

    return subtasks;
  }

  /**
   * 分解测试任务
   */
  private decomposeTestingTask(task: ComplexTask, complexity: TaskComplexity): SubTask[] {
    const baseId = `test_${Date.now()}`;
    const subtasks: SubTask[] = [];

    subtasks.push({
      id: `${baseId}_plan`,
      title: '测试计划',
      description: '制定测试策略和测试计划',
      type: 'test_planning',
      estimatedHours: complexity.level === 'complex' ? 3 : 2,
      priority: 'high',
      requiredSkills: ['测试设计', '质量规划'],
      recommendedModel: ModelType.QWEN,
      dependencies: []
    });

    subtasks.push({
      id: `${baseId}_cases`,
      title: '测试用例',
      description: '设计和编写测试用例',
      type: 'test_cases',
      estimatedHours: complexity.level === 'complex' ? 6 : complexity.level === 'medium' ? 4 : 2,
      priority: 'high',
      requiredSkills: ['测试用例设计', '边界测试'],
      recommendedModel: ModelType.ZHIPU,
      dependencies: [`${baseId}_plan`]
    });

    subtasks.push({
      id: `${baseId}_execution`,
      title: '测试执行',
      description: '执行测试并记录结果',
      type: 'test_execution',
      estimatedHours: complexity.level === 'complex' ? 4 : 3,
      priority: 'medium',
      requiredSkills: ['测试执行', '缺陷跟踪'],
      recommendedModel: ModelType.DEEPSEEK,
      dependencies: [`${baseId}_cases`]
    });

    return subtasks;
  }

  /**
   * 分解审核任务
   */
  private decomposeReviewTask(task: ComplexTask, complexity: TaskComplexity): SubTask[] {
    const baseId = `review_${Date.now()}`;
    const subtasks: SubTask[] = [];

    subtasks.push({
      id: `${baseId}_criteria`,
      title: '审核标准',
      description: '制定审核标准和检查清单',
      type: 'criteria_definition',
      estimatedHours: 1,
      priority: 'high',
      requiredSkills: ['质量标准', '审核流程'],
      recommendedModel: ModelType.QWEN,
      dependencies: []
    });

    subtasks.push({
      id: `${baseId}_review`,
      title: '详细审核',
      description: '按照标准进行详细审核',
      type: 'detailed_review',
      estimatedHours: complexity.level === 'complex' ? 6 : complexity.level === 'medium' ? 4 : 2,
      priority: 'high',
      requiredSkills: ['代码审核', '质量评估'],
      recommendedModel: ModelType.DEEPSEEK,
      dependencies: [`${baseId}_criteria`]
    });

    subtasks.push({
      id: `${baseId}_feedback`,
      title: '反馈报告',
      description: '生成审核反馈和改进建议',
      type: 'feedback',
      estimatedHours: 2,
      priority: 'medium',
      requiredSkills: ['反馈写作', '改进建议'],
      recommendedModel: ModelType.MOONSHOT,
      dependencies: [`${baseId}_review`]
    });

    return subtasks;
  }

  /**
   * 生成任务依赖关系
   */
  private generateDependencies(subtasks: SubTask[]): TaskDependency[] {
    const dependencies: TaskDependency[] = [];

    for (const task of subtasks) {
      for (const depId of task.dependencies) {
        dependencies.push({
          from: depId,
          to: task.id,
          type: 'blocking'
        });
      }
    }

    return dependencies;
  }

  /**
   * 估算执行时间
   */
  private estimateExecutionTime(subtasks: SubTask[]): number {
    return subtasks.reduce((total, task) => total + task.estimatedHours, 0);
  }

  /**
   * 为任务推荐模型
   */
  private recommendModelsForTask(task: ComplexTask, subtasks: SubTask[]): ModelType[] {
    const modelSet = new Set<ModelType>();

    // 添加子任务推荐的模型
    for (const subtask of subtasks) {
      modelSet.add(subtask.recommendedModel);
    }

    // 基于任务类型添加额外推荐
    switch (task.type) {
      case 'code_generation':
        modelSet.add(ModelType.DEEPSEEK);
        modelSet.add(ModelType.ZHIPU);
        break;
      case 'analysis':
        modelSet.add(ModelType.QWEN);
        modelSet.add(ModelType.DEEPSEEK);
        break;
      case 'documentation':
        modelSet.add(ModelType.MOONSHOT);
        modelSet.add(ModelType.QWEN);
        break;
    }

    return Array.from(modelSet);
  }

  /**
   * 生成执行计划
   */
  private generateExecutionPlan(subtasks: SubTask[], dependencies: TaskDependency[]): ExecutionStep[] {
    const steps: ExecutionStep[] = [];
    const completed = new Set<string>();
    const dependencyMap = new Map<string, string[]>();

    // 构建依赖映射
    for (const dep of dependencies) {
      if (!dependencyMap.has(dep.to)) {
        dependencyMap.set(dep.to, []);
      }
      dependencyMap.get(dep.to)!.push(dep.from);
    }

    let stepNumber = 1;

    while (completed.size < subtasks.length) {
      const readyTasks: string[] = [];

      // 找到可以执行的任务（所有依赖都已完成）
      for (const task of subtasks) {
        if (completed.has(task.id)) continue;

        const deps = dependencyMap.get(task.id) || [];
        const canExecute = deps.every(depId => completed.has(depId));

        if (canExecute) {
          readyTasks.push(task.id);
        }
      }

      if (readyTasks.length === 0) break; // 避免无限循环

      // 计算这一步的估计时间
      const stepTasks = subtasks.filter(t => readyTasks.includes(t.id));
      const estimatedDuration = Math.max(...stepTasks.map(t => t.estimatedHours));

      steps.push({
        step: stepNumber++,
        tasks: readyTasks,
        parallelExecution: readyTasks.length > 1,
        estimatedDuration
      });

      // 标记任务为已完成
      for (const taskId of readyTasks) {
        completed.add(taskId);
      }
    }

    return steps;
  }
}
