/**
 * 智能编排器 - TaskFlow AI的核心AI编排模块
 * 实现任务优先级排序、依赖分析、开发路径优化和智能决策
 */

import { Logger } from '../../infra/logger';
import { ModelCoordinator } from '../models/coordinator';
import { Task, TaskPlan, TaskPriority, TaskType } from '../../types/task';
import { Requirement } from '../parser/requirement-extractor';

/**
 * 资源需求接口
 */
interface ResourceNeeds {
  personHours: number;
  skillLevel: 'junior' | 'mid' | 'senior' | 'expert';
  teamSize: number;
  technologies: string[];
  complexity: number;
}

/**
 * 时间估算接口
 */
interface TimeEstimate {
  baseHours: number;
  adjustedHours: number;
  confidence: number;
  factors: string[];
}

/**
 * 编排策略枚举
 */
export enum OrchestrationStrategy {
  TIME_OPTIMIZED = 'time_optimized',           // 时间优化
  RESOURCE_OPTIMIZED = 'resource_optimized',   // 资源优化
  RISK_MINIMIZED = 'risk_minimized',           // 风险最小化
  VALUE_MAXIMIZED = 'value_maximized',         // 价值最大化
  BALANCED = 'balanced'                        // 平衡策略
}

/**
 * 编排选项接口
 */
export interface OrchestrationOptions {
  strategy: OrchestrationStrategy;
  teamSize: number;
  timeConstraint?: number;                     // 时间约束（天）
  resourceConstraint?: number;                 // 资源约束（人天）
  riskTolerance: 'low' | 'medium' | 'high';   // 风险容忍度
  prioritizeUserValue: boolean;                // 是否优先考虑用户价值
  allowParallelExecution: boolean;             // 是否允许并行执行
  maxParallelTasks: number;                    // 最大并行任务数
  considerSkillsets: boolean;                  // 是否考虑技能匹配
  enableAutoAdjustment: boolean;               // 是否启用自动调整
}

/**
 * 编排结果接口
 */
export interface OrchestrationResult {
  optimizedPlan: TaskPlan;
  executionPath: ExecutionPath;
  recommendations: Recommendation[];
  metrics: OrchestrationMetrics;
  alternatives: AlternativePlan[];
  warnings: string[];
}

/**
 * 执行路径接口
 */
export interface ExecutionPath {
  phases: ExecutionPhase[];
  criticalPath: string[];
  parallelGroups: ParallelGroup[];
  milestones: Milestone[];
  estimatedDuration: number;                   // 预计总时长（天）
  resourceUtilization: ResourceUtilization;
}

/**
 * 执行阶段接口
 */
export interface ExecutionPhase {
  id: string;
  name: string;
  description: string;
  tasks: string[];                             // 任务ID列表
  dependencies: string[];                      // 依赖的阶段ID
  estimatedDuration: number;                   // 预计时长（天）
  requiredSkills: string[];                    // 所需技能
  riskLevel: 'low' | 'medium' | 'high';       // 风险等级
  priority: number;                            // 优先级（1-10）
}

/**
 * 并行组接口
 */
export interface ParallelGroup {
  id: string;
  name: string;
  tasks: string[];                             // 可并行执行的任务ID
  estimatedDuration: number;                   // 预计时长
  requiredResources: number;                   // 所需资源数
  conflictRisk: number;                        // 冲突风险评分（0-1）
}

/**
 * 里程碑接口
 */
export interface Milestone {
  id: string;
  name: string;
  description: string;
  targetDate: Date;
  criteria: string[];                          // 达成标准
  dependentTasks: string[];                    // 依赖的任务
  importance: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * 资源利用率接口
 */
export interface ResourceUtilization {
  totalPersonDays: number;                     // 总人天
  peakConcurrency: number;                     // 峰值并发数
  averageUtilization: number;                  // 平均利用率（0-1）
  bottlenecks: string[];                       // 瓶颈任务ID
  idlePeriods: IdlePeriod[];                   // 空闲期间
}

/**
 * 空闲期间接口
 */
export interface IdlePeriod {
  start: Date;
  end: Date;
  availableResources: number;
  suggestions: string[];                       // 建议的活动
}

/**
 * 编排指标接口
 */
export interface OrchestrationMetrics {
  efficiency: number;                          // 效率评分（0-1）
  riskScore: number;                          // 风险评分（0-1）
  valueScore: number;                         // 价值评分（0-1）
  feasibility: number;                        // 可行性评分（0-1）
  complexity: number;                         // 复杂度评分（0-1）
  adaptability: number;                       // 适应性评分（0-1）
  overallScore: number;                       // 综合评分（0-1）
}

/**
 * 推荐建议接口
 */
export interface Recommendation {
  id: string;
  type: 'optimization' | 'risk_mitigation' | 'resource_allocation' | 'timeline_adjustment';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;                              // 预期影响
  effort: string;                              // 实施难度
  targetTasks: string[];                       // 目标任务ID
  actionItems: string[];                       // 行动项
}

/**
 * 备选方案接口
 */
export interface AlternativePlan {
  id: string;
  name: string;
  description: string;
  strategy: OrchestrationStrategy;
  metrics: OrchestrationMetrics;
  tradeoffs: string[];                         // 权衡点
  suitableFor: string[];                       // 适用场景
}

/**
 * 任务分析结果接口
 */
interface TaskAnalysis {
  taskComplexity: Map<string, number>;
  dependencyGraph: Map<string, string[]>;
  skillRequirements: Map<string, string[]>;
  riskFactors: Map<string, {
    technical: number;
    schedule: number;
    resource: number;
    dependency: number;
    overall: number;
  }>;
  valueMapping: Map<string, number>;
  resourceNeeds: Map<string, ResourceNeeds>;
  timeEstimates: Map<string, TimeEstimate>;
  criticalityScores: Map<string, number>;
}

/**
 * 智能编排器类
 */
export class IntelligentOrchestrator {
  private logger: Logger;
  private _modelCoordinator: ModelCoordinator;
  private knowledgeBase: Map<string, unknown> = new Map();
  private learningHistory: OrchestrationResult[] = [];

  constructor(logger: Logger, modelCoordinator: ModelCoordinator) {
    this.logger = logger;
    this._modelCoordinator = modelCoordinator;
    this.initializeKnowledgeBase();
  }

  /**
   * 智能编排任务计划
   * @param taskPlan 原始任务计划
   * @param requirements 需求列表
   * @param options 编排选项
   */
  public async orchestrate(
    taskPlan: TaskPlan,
    requirements: Requirement[],
    options: OrchestrationOptions
  ): Promise<OrchestrationResult> {
    try {
      this.logger.info(`开始智能编排: ${taskPlan.name}`);

      // 1. 分析任务和需求
      const analysis = await this.analyzeTasksAndRequirements(taskPlan, requirements);

      // 2. 生成执行路径
      const executionPath = await this.generateExecutionPath(taskPlan, analysis, options);

      // 3. 优化任务顺序
      const optimizedPlan = await this.optimizeTaskOrder(taskPlan, executionPath, options);

      // 4. 生成推荐建议
      const recommendations = await this.generateRecommendations(optimizedPlan, analysis, options);

      // 5. 计算编排指标
      const metrics = this.calculateMetrics(optimizedPlan, executionPath, options);

      // 6. 生成备选方案
      const alternatives = await this.generateAlternatives(taskPlan, analysis, options);

      // 7. 验证结果
      const warnings = this.validateResult(optimizedPlan, executionPath, options);

      const result: OrchestrationResult = {
        optimizedPlan,
        executionPath,
        recommendations,
        metrics,
        alternatives,
        warnings
      };

      // 8. 学习和改进
      this.learnFromResult(result, options);

      this.logger.info(`智能编排完成: 效率评分 ${metrics.efficiency.toFixed(2)}`);
      return result;

    } catch (error) {
      this.logger.error(`智能编排失败: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * 分析任务和需求
   * @param taskPlan 任务计划
   * @param requirements 需求列表
   */
  private async analyzeTasksAndRequirements(
    taskPlan: TaskPlan,
    requirements: Requirement[]
  ): Promise<TaskAnalysis> {
    this.logger.info('分析任务和需求关系');

    const analysis = {
      taskComplexity: this.analyzeTaskComplexity(taskPlan.tasks),
      dependencyGraph: this.buildDependencyGraph(taskPlan.tasks),
      skillRequirements: this.analyzeSkillRequirements(taskPlan.tasks),
      riskFactors: this.identifyRiskFactors(taskPlan.tasks, requirements),
      valueMapping: this.mapBusinessValue(taskPlan.tasks, requirements),
      resourceNeeds: this.estimateResourceNeeds(taskPlan.tasks),
      timeEstimates: this.refineTimeEstimates(taskPlan.tasks),
      criticalityScores: this.calculateCriticalityScores(taskPlan.tasks)
    };

    return analysis;
  }

  /**
   * 分析任务复杂度
   * @param tasks 任务列表
   */
  private analyzeTaskComplexity(tasks: Task[]): Map<string, number> {
    const complexity = new Map<string, number>();

    tasks.forEach(task => {
      let score = 0.5; // 基础复杂度

      // 基于估算时间
      if (task.estimatedHours) {
        if (task.estimatedHours > 40) score += 0.3;
        else if (task.estimatedHours > 16) score += 0.2;
        else if (task.estimatedHours > 8) score += 0.1;
      }

      // 基于依赖数量
      score += Math.min(task.dependencies.length * 0.1, 0.3);

      // 基于任务类型
      switch (task.type) {
        case TaskType.RESEARCH:
        case TaskType.DESIGN:
          score += 0.2;
          break;
        case TaskType.REFACTOR:
          score += 0.15;
          break;
        case TaskType.TEST:
          score += 0.1;
          break;
      }

      // 基于描述复杂度
      if (task.description.length > 500) score += 0.1;
      if (task.description.includes('集成') || task.description.includes('算法')) score += 0.15;

      complexity.set(task.id, Math.min(1.0, score));
    });

    return complexity;
  }

  /**
   * 构建依赖图
   * @param tasks 任务列表
   */
  private buildDependencyGraph(tasks: Task[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    tasks.forEach(task => {
      graph.set(task.id, task.dependencies);
    });

    return graph;
  }

  /**
   * 分析技能需求
   * @param tasks 任务列表
   */
  private analyzeSkillRequirements(tasks: Task[]): Map<string, string[]> {
    const skillMap = new Map<string, string[]>();

    tasks.forEach(task => {
      const skills: string[] = [];

      // 基于任务类型推断技能
      switch (task.type) {
        case TaskType.FEATURE:
          skills.push('前端开发', '后端开发');
          break;
        case TaskType.DESIGN:
          skills.push('UI设计', 'UX设计');
          break;
        case TaskType.TEST:
          skills.push('测试', '质量保证');
          break;
        case TaskType.DEPLOYMENT:
          skills.push('DevOps', '运维');
          break;
        case TaskType.DOCUMENT:
          skills.push('技术写作', '文档编写');
          break;
      }

      // 基于标签推断技能
      task.tags.forEach(tag => {
        const tagLower = tag.toLowerCase();
        if (tagLower.includes('react')) skills.push('React');
        if (tagLower.includes('node')) skills.push('Node.js');
        if (tagLower.includes('database')) skills.push('数据库');
        if (tagLower.includes('api')) skills.push('API开发');
      });

      skillMap.set(task.id, [...new Set(skills)]);
    });

    return skillMap;
  }

  /**
   * 识别风险因素
   * @param tasks 任务列表
   * @param requirements 需求列表
   */
  private identifyRiskFactors(tasks: Task[], _requirements: Requirement[]): Map<string, {
    technical: number;
    schedule: number;
    resource: number;
    dependency: number;
    overall: number;
  }> {
    const riskFactors = new Map<string, {
      technical: number;
      schedule: number;
      resource: number;
      dependency: number;
      overall: number;
    }>();

    tasks.forEach(task => {
      const risks = {
        technical: 0,
        schedule: 0,
        resource: 0,
        dependency: 0,
        overall: 0
      };

      // 技术风险
      if (task.tags.includes('新技术') || task.description.includes('新技术')) {
        risks.technical += 0.3;
      }
      if (task.type === TaskType.RESEARCH) {
        risks.technical += 0.2;
      }

      // 进度风险
      if (task.estimatedHours && task.estimatedHours > 40) {
        risks.schedule += 0.2;
      }
      if (task.dependencies.length > 3) {
        risks.schedule += 0.15;
      }

      // 资源风险
      const requiredSkills = this.analyzeSkillRequirements([task]).get(task.id) || [];
      if (requiredSkills.length > 3) {
        risks.resource += 0.2;
      }

      // 依赖风险
      risks.dependency = Math.min(task.dependencies.length * 0.1, 0.4);

      // 综合风险
      risks.overall = (risks.technical + risks.schedule + risks.resource + risks.dependency) / 4;

      riskFactors.set(task.id, risks);
    });

    return riskFactors;
  }

  /**
   * 映射业务价值
   * @param tasks 任务列表
   * @param requirements 需求列表
   */
  private mapBusinessValue(tasks: Task[], requirements: Requirement[]): Map<string, number> {
    const valueMap = new Map<string, number>();

    // 创建需求到任务的映射
    const reqToTaskMap = new Map<string, string[]>();
    requirements.forEach(req => {
      const relatedTasks = tasks.filter(task =>
        task.title.includes(req.title) ||
        task.description.includes(req.description) ||
        task.tags.some(tag => req.tags.includes(tag))
      );
      reqToTaskMap.set(req.id, relatedTasks.map(t => t.id));
    });

    tasks.forEach(task => {
      let value = 0.5; // 基础价值

      // 基于优先级
      switch (task.priority) {
        case TaskPriority.CRITICAL:
          value += 0.4;
          break;
        case TaskPriority.HIGH:
          value += 0.3;
          break;
        case TaskPriority.MEDIUM:
          value += 0.1;
          break;
      }

      // 基于关联需求的业务价值
      const relatedReqs = requirements.filter(req =>
        reqToTaskMap.get(req.id)?.includes(task.id)
      );

      if (relatedReqs.length > 0) {
        const avgBusinessValue = relatedReqs.reduce((sum, req) =>
          sum + req.businessValue, 0) / relatedReqs.length;
        value += (avgBusinessValue / 10) * 0.3; // 标准化到0.3的权重
      }

      // 基于任务类型
      if (task.type === TaskType.FEATURE) {
        value += 0.2;
      } else if (task.type === TaskType.BUG_FIX) {
        value += 0.15;
      }

      valueMap.set(task.id, Math.min(1.0, value));
    });

    return valueMap;
  }

  /**
   * 估算资源需求
   * @param tasks 任务列表
   */
  private estimateResourceNeeds(tasks: Task[]): Map<string, ResourceNeeds> {
    const resourceMap = new Map<string, ResourceNeeds>();

    tasks.forEach(task => {
      const needs: ResourceNeeds = {
        personHours: task.estimatedHours || 8,
        skillLevel: this.estimateRequiredSkillLevel(task),
        teamSize: this.estimateOptimalTeamSize(task),
        technologies: this.identifySpecialization(task),
        complexity: this.calculateTaskComplexity(task)
      };

      resourceMap.set(task.id, needs);
    });

    return resourceMap;
  }

  /**
   * 识别专业化需求
   * @param task 任务
   */
  private identifySpecialization(task: Task): string[] {
    const technologies: string[] = [];

    // 基于任务类型
    if (task.type === TaskType.FEATURE) {
      technologies.push('编程', '软件开发');
    }
    if (task.type === TaskType.TEST) {
      technologies.push('测试', '质量保证');
    }
    if (task.type === TaskType.DESIGN) {
      technologies.push('设计', 'UI/UX');
    }
    if (task.type === TaskType.RESEARCH) {
      technologies.push('研究', '分析');
    }

    // 基于任务描述中的关键词
    const description = task.description.toLowerCase();
    if (description.includes('前端')) technologies.push('前端开发');
    if (description.includes('后端')) technologies.push('后端开发');
    if (description.includes('数据库')) technologies.push('数据库');
    if (description.includes('api')) technologies.push('API开发');

    return technologies;
  }

  /**
   * 估算所需技能水平
   * @param task 任务
   */
  private estimateRequiredSkillLevel(task: Task): 'junior' | 'mid' | 'senior' | 'expert' {
    let score = 0;

    // 基于复杂度
    if (task.estimatedHours && task.estimatedHours > 40) score += 2;
    else if (task.estimatedHours && task.estimatedHours > 16) score += 1;

    // 基于任务类型
    switch (task.type) {
      case TaskType.RESEARCH:
      case TaskType.DESIGN:
        score += 2;
        break;
      case TaskType.REFACTOR:
        score += 1;
        break;
    }

    // 基于依赖复杂度
    if (task.dependencies.length > 3) score += 1;

    // 基于描述关键词
    const description = task.description.toLowerCase();
    if (description.includes('架构') || description.includes('算法')) score += 2;
    if (description.includes('优化') || description.includes('集成')) score += 1;

    if (score >= 4) return 'expert';
    if (score >= 3) return 'senior';
    if (score >= 1) return 'mid';
    return 'junior';
  }

  /**
   * 估算最优团队规模
   * @param task 任务
   */
  private estimateOptimalTeamSize(task: Task): number {
    const hours = task.estimatedHours || 8;

    if (hours <= 8) return 1;
    if (hours <= 24) return 2;
    if (hours <= 80) return 3;
    return Math.min(5, Math.ceil(hours / 40));
  }



  /**
   * 精化时间估算
   * @param tasks 任务列表
   */
  private refineTimeEstimates(tasks: Task[]): Map<string, TimeEstimate> {
    const estimates = new Map<string, TimeEstimate>();

    tasks.forEach(task => {
      const baseHours = task.estimatedHours || 8;

      // 基于复杂度调整
      const complexity = this.analyzeTaskComplexity([task]).get(task.id) || 0.5;
      const complexityMultiplier = 0.5 + complexity;

      // 基于依赖数量调整
      const dependencyMultiplier = 1 + (task.dependencies.length * 0.1);

      // 基于不确定性调整
      const uncertaintyMultiplier = this.calculateUncertaintyMultiplier(task);

      const adjustedHours = baseHours * complexityMultiplier * dependencyMultiplier * uncertaintyMultiplier;

      estimates.set(task.id, {
        baseHours: baseHours,
        adjustedHours: Math.round(adjustedHours),
        confidence: this.calculateEstimateConfidence(task),
        factors: [
          `复杂度: ${complexityMultiplier.toFixed(2)}x`,
          `依赖: ${dependencyMultiplier.toFixed(2)}x`,
          `不确定性: ${uncertaintyMultiplier.toFixed(2)}x`
        ]
      });
    });

    return estimates;
  }

  /**
   * 获取任务的估算小时数（类型安全）
   * @param taskId 任务ID
   * @param timeEstimates 时间估算映射
   * @returns 估算小时数
   */
  private getEstimatedHours(taskId: string, timeEstimates: Map<string, TimeEstimate>): number {
    const estimate = timeEstimates.get(taskId);
    return estimate ? estimate.adjustedHours : 8;
  }

  /**
   * 计算任务复杂度
   * @param task 任务
   */
  private calculateTaskComplexity(task: Task): number {
    let complexity = 1;

    // 基于任务类型
    if (task.type === TaskType.FEATURE) complexity += 2;
    if (task.type === TaskType.TEST) complexity += 1;
    if (task.type === TaskType.RESEARCH) complexity += 3;

    // 基于依赖数量
    complexity += (task.dependencies?.length || 0) * 0.5;

    // 基于描述长度（复杂度指标）
    complexity += Math.min(task.description.length / 100, 2);

    return Math.max(1, Math.min(complexity, 10));
  }

  /**
   * 计算不确定性乘数
   * @param task 任务
   */
  private calculateUncertaintyMultiplier(task: Task): number {
    let uncertainty = 1.0;

    // 基于任务类型
    switch (task.type) {
      case TaskType.RESEARCH:
        uncertainty += 0.5;
        break;
      case TaskType.DESIGN:
        uncertainty += 0.3;
        break;
      case TaskType.REFACTOR:
        uncertainty += 0.2;
        break;
    }

    // 基于描述模糊度
    if (task.description.length < 50) uncertainty += 0.2;
    if (task.description.includes('可能') || task.description.includes('大概')) uncertainty += 0.1;

    return Math.min(2.0, uncertainty);
  }

  /**
   * 计算估算置信度
   * @param task 任务
   */
  private calculateEstimateConfidence(task: Task): number {
    let confidence = 0.7; // 基础置信度

    // 基于描述详细程度
    if (task.description.length > 200) confidence += 0.1;
    if (task.description.length > 500) confidence += 0.1;

    // 基于验收标准
    if (task.acceptance && task.acceptance.length > 0) confidence += 0.1;

    // 基于历史数据（简化）
    if (task.type === TaskType.FEATURE) confidence += 0.05;

    return Math.min(1.0, confidence);
  }

  /**
   * 计算关键性评分
   * @param tasks 任务列表
   */
  private calculateCriticalityScores(tasks: Task[]): Map<string, number> {
    const scores = new Map<string, number>();

    // 构建依赖图
    const dependents = new Map<string, string[]>();
    tasks.forEach(task => {
      task.dependencies.forEach(depId => {
        if (!dependents.has(depId)) {
          dependents.set(depId, []);
        }
        dependents.get(depId)!.push(task.id);
      });
    });

    tasks.forEach(task => {
      let score = 0.5; // 基础分数

      // 基于被依赖数量
      const dependentCount = dependents.get(task.id)?.length || 0;
      score += Math.min(dependentCount * 0.1, 0.3);

      // 基于优先级
      switch (task.priority) {
        case TaskPriority.CRITICAL:
          score += 0.3;
          break;
        case TaskPriority.HIGH:
          score += 0.2;
          break;
        case TaskPriority.MEDIUM:
          score += 0.1;
          break;
      }

      // 基于任务类型
      if (task.type === TaskType.FEATURE) score += 0.1;

      scores.set(task.id, Math.min(1.0, score));
    });

    return scores;
  }

  /**
   * 初始化知识库
   */
  private initializeKnowledgeBase(): void {
    // 加载最佳实践和经验数据
    this.knowledgeBase.set('best_practices', {
      maxParallelTasks: 5,
      optimalTeamSize: 3,
      riskThresholds: {
        low: 0.3,
        medium: 0.6,
        high: 0.8
      },
      complexityFactors: {
        research: 1.5,
        integration: 1.3,
        newTechnology: 1.4
      }
    });

    this.knowledgeBase.set('patterns', {
      commonDependencies: [
        ['设计', '开发'],
        ['开发', '测试'],
        ['测试', '部署']
      ],
      riskPatterns: [
        { pattern: '新技术', riskIncrease: 0.3 },
        { pattern: '集成', riskIncrease: 0.2 },
        { pattern: '第三方依赖', riskIncrease: 0.15 }
      ]
    });
  }

  /**
   * 从结果中学习
   * @param result 编排结果
   * @param options 编排选项
   */
  private learnFromResult(result: OrchestrationResult, _options: OrchestrationOptions): void {
    // 保存学习历史
    this.learningHistory.push(result);

    // 限制历史记录大小
    if (this.learningHistory.length > 100) {
      this.learningHistory = this.learningHistory.slice(-50);
    }

    // 更新知识库（简化实现）
    const avgEfficiency = this.learningHistory.reduce((sum, r) => sum + r.metrics.efficiency, 0) / this.learningHistory.length;
    this.knowledgeBase.set('performance_baseline', avgEfficiency);

    this.logger.info(`学习更新完成，当前平均效率: ${avgEfficiency.toFixed(3)}`);
  }

  /**
   * 生成执行路径
   * @param taskPlan 任务计划
   * @param analysis 分析结果
   * @param options 编排选项
   */
  private async generateExecutionPath(
    taskPlan: TaskPlan,
    analysis: TaskAnalysis,
    options: OrchestrationOptions
  ): Promise<ExecutionPath> {
    this.logger.info('生成执行路径');

    // 1. 识别关键路径
    const criticalPath = this.findCriticalPath(taskPlan.tasks, analysis);

    // 2. 创建执行阶段
    const phases = this.createExecutionPhases(taskPlan.tasks, analysis, options);

    // 3. 识别并行组
    const parallelGroups = this.identifyParallelGroups(taskPlan.tasks, analysis, options);

    // 4. 设置里程碑
    const milestones = this.createMilestones(taskPlan.tasks, phases);

    // 5. 计算资源利用率
    const resourceUtilization = this.calculateResourceUtilization(taskPlan.tasks, phases, options);

    // 6. 估算总时长
    const estimatedDuration = this.calculateTotalDuration(phases, parallelGroups);

    return {
      phases,
      criticalPath,
      parallelGroups,
      milestones,
      estimatedDuration,
      resourceUtilization
    };
  }

  /**
   * 寻找关键路径
   * @param tasks 任务列表
   * @param analysis 分析结果
   */
  private findCriticalPath(tasks: Task[], analysis: TaskAnalysis): string[] {
    // 使用关键路径方法(CPM)算法
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const timeEstimates = analysis.timeEstimates;

    // 计算最早开始时间
    const earliestStart = new Map<string, number>();
    const earliestFinish = new Map<string, number>();

    const calculateEarliest = (taskId: string, visited = new Set<string>()): number => {
      if (visited.has(taskId)) return 0;
      if (earliestFinish.has(taskId)) return earliestFinish.get(taskId)!;

      visited.add(taskId);
      const task = taskMap.get(taskId);
      if (!task) return 0;

      let maxPredecessorFinish = 0;
      task.dependencies.forEach(depId => {
        maxPredecessorFinish = Math.max(maxPredecessorFinish, calculateEarliest(depId, new Set(visited)));
      });

      const estimate = timeEstimates.get(taskId);
      const duration = estimate ? estimate.adjustedHours : 8;
      earliestStart.set(taskId, maxPredecessorFinish);
      earliestFinish.set(taskId, maxPredecessorFinish + duration);

      visited.delete(taskId);
      return earliestFinish.get(taskId)!;
    };

    // 计算所有任务的最早完成时间
    tasks.forEach(task => calculateEarliest(task.id));

    // 找到项目完成时间
    const projectFinish = Math.max(...Array.from(earliestFinish.values()));

    // 计算最晚开始时间（反向计算）
    const latestStart = new Map<string, number>();
    const latestFinish = new Map<string, number>();

    // 找到没有后继任务的任务
    const hasSuccessors = new Set<string>();
    tasks.forEach(task => {
      task.dependencies.forEach(depId => hasSuccessors.add(depId));
    });

    const endTasks = tasks.filter(task => !hasSuccessors.has(task.id));
    endTasks.forEach(task => {
      latestFinish.set(task.id, projectFinish);
      const estimate = timeEstimates.get(task.id);
      const duration = estimate ? estimate.adjustedHours : 8;
      latestStart.set(task.id, projectFinish - duration);
    });

    // 反向计算其他任务的最晚时间
    const calculateLatest = (taskId: string, visited = new Set<string>()): number => {
      if (visited.has(taskId)) return projectFinish;
      if (latestStart.has(taskId)) return latestStart.get(taskId)!;

      visited.add(taskId);
      const task = taskMap.get(taskId);
      if (!task) return projectFinish;

      // 找到所有依赖此任务的后继任务
      const successors = tasks.filter(t => t.dependencies.includes(taskId));

      let minSuccessorStart = projectFinish;
      successors.forEach(successor => {
        minSuccessorStart = Math.min(minSuccessorStart, calculateLatest(successor.id, new Set(visited)));
      });

      const estimate = timeEstimates.get(taskId);
      const duration = estimate ? estimate.adjustedHours : 8;
      latestFinish.set(taskId, minSuccessorStart);
      latestStart.set(taskId, minSuccessorStart - duration);

      visited.delete(taskId);
      return latestStart.get(taskId)!;
    };

    tasks.forEach(task => calculateLatest(task.id));

    // 找到关键路径（浮动时间为0的任务）
    const criticalTasks = tasks.filter(task => {
      const es = earliestStart.get(task.id) || 0;
      const ls = latestStart.get(task.id) || 0;
      return Math.abs(es - ls) < 0.1; // 考虑浮点数精度
    });

    return criticalTasks.map(task => task.id);
  }

  /**
   * 创建执行阶段
   * @param tasks 任务列表
   * @param analysis 分析结果
   * @param options 编排选项
   */
  private createExecutionPhases(tasks: Task[], analysis: TaskAnalysis, options: OrchestrationOptions): ExecutionPhase[] {
    const phases: ExecutionPhase[] = [];

    // 按任务类型和依赖关系分组
    const phaseGroups = this.groupTasksIntoPhases(tasks, analysis);

    phaseGroups.forEach((taskIds, index) => {
      const phaseTasks = tasks.filter(t => taskIds.includes(t.id));
      const totalDuration = phaseTasks.reduce((sum, task) => {
        const estimate = analysis.timeEstimates.get(task.id);
        const duration = estimate ? estimate.adjustedHours : 8;
        return sum + duration;
      }, 0);

      // 收集所需技能
      const requiredSkills = new Set<string>();
      phaseTasks.forEach(task => {
        const skills = analysis.skillRequirements.get(task.id) || [];
        skills.forEach(skill => requiredSkills.add(skill));
      });

      // 计算风险等级
      const avgRisk = phaseTasks.reduce((sum, task) => {
        const risk = analysis.riskFactors.get(task.id);
        return sum + (risk?.overall || 0);
      }, 0) / phaseTasks.length;

      const riskLevel = avgRisk > 0.7 ? 'high' : avgRisk > 0.4 ? 'medium' : 'low';

      // 计算优先级
      const avgPriority = phaseTasks.reduce((sum, task) => {
        const criticality = analysis.criticalityScores.get(task.id) || 0.5;
        return sum + criticality;
      }, 0) / phaseTasks.length;

      phases.push({
        id: `phase-${index + 1}`,
        name: this.generatePhaseName(phaseTasks),
        description: this.generatePhaseDescription(phaseTasks),
        tasks: taskIds,
        dependencies: this.calculatePhaseDependencies(taskIds, tasks),
        estimatedDuration: Math.ceil(totalDuration / options.teamSize),
        requiredSkills: Array.from(requiredSkills),
        riskLevel,
        priority: Math.round(avgPriority * 10)
      });
    });

    return phases.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 将任务分组到阶段
   * @param tasks 任务列表
   * @param analysis 分析结果
   */
  private groupTasksIntoPhases(tasks: Task[], _analysis: TaskAnalysis): string[][] {
    const groups: string[][] = [];
    const processed = new Set<string>();

    // 按依赖层级分组
    const levels = this.calculateDependencyLevels(tasks);
    const maxLevel = Math.max(...Array.from(levels.values()));

    for (let level = 0; level <= maxLevel; level++) {
      const levelTasks = tasks.filter(task =>
        levels.get(task.id) === level && !processed.has(task.id)
      );

      if (levelTasks.length > 0) {
        // 进一步按类型细分
        const typeGroups = new Map<TaskType, Task[]>();
        levelTasks.forEach(task => {
          if (!typeGroups.has(task.type)) {
            typeGroups.set(task.type, []);
          }
          typeGroups.get(task.type)!.push(task);
        });

        typeGroups.forEach(typeTasks => {
          if (typeTasks.length > 0) {
            groups.push(typeTasks.map(t => t.id));
            typeTasks.forEach(task => processed.add(task.id));
          }
        });
      }
    }

    return groups;
  }

  /**
   * 计算依赖层级
   * @param tasks 任务列表
   */
  private calculateDependencyLevels(tasks: Task[]): Map<string, number> {
    const levels = new Map<string, number>();
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    const calculateLevel = (taskId: string, visited = new Set<string>()): number => {
      if (visited.has(taskId)) return 0;
      if (levels.has(taskId)) return levels.get(taskId)!;

      visited.add(taskId);
      const task = taskMap.get(taskId);

      if (!task || task.dependencies.length === 0) {
        levels.set(taskId, 0);
      } else {
        const maxDepLevel = Math.max(
          ...task.dependencies.map(depId => calculateLevel(depId, new Set(visited)))
        );
        levels.set(taskId, maxDepLevel + 1);
      }

      visited.delete(taskId);
      return levels.get(taskId)!;
    };

    tasks.forEach(task => calculateLevel(task.id));
    return levels;
  }

  /**
   * 生成阶段名称
   * @param tasks 阶段任务
   */
  private generatePhaseName(tasks: Task[]): string {
    const types = [...new Set(tasks.map(t => t.type))];

    if (types.length === 1) {
      switch (types[0]) {
        case TaskType.DESIGN:
          return '设计阶段';
        case TaskType.FEATURE:
          return '开发阶段';
        case TaskType.TEST:
          return '测试阶段';
        case TaskType.DEPLOYMENT:
          return '部署阶段';
        default:
          return `${types[0]}阶段`;
      }
    }

    return `混合阶段 (${types.join(', ')})`;
  }

  /**
   * 生成阶段描述
   * @param tasks 阶段任务
   */
  private generatePhaseDescription(tasks: Task[]): string {
    const taskCount = tasks.length;
    const types = [...new Set(tasks.map(t => t.type))];

    return `包含 ${taskCount} 个任务，主要涉及 ${types.join('、')} 等工作`;
  }

  /**
   * 计算阶段依赖
   * @param phaseTaskIds 阶段任务ID
   * @param allTasks 所有任务
   */
  private calculatePhaseDependencies(phaseTaskIds: string[], allTasks: Task[]): string[] {
    const dependencies = new Set<string>();

    phaseTaskIds.forEach(taskId => {
      const task = allTasks.find(t => t.id === taskId);
      if (task) {
        task.dependencies.forEach(depId => {
          // 如果依赖的任务不在当前阶段，则需要依赖其所在阶段
          if (!phaseTaskIds.includes(depId)) {
            // 这里简化处理，实际应该找到依赖任务所在的阶段
            dependencies.add(depId);
          }
        });
      }
    });

    return Array.from(dependencies);
  }

  /**
   * 识别并行组
   * @param tasks 任务列表
   * @param analysis 分析结果
   * @param options 编排选项
   */
  private identifyParallelGroups(tasks: Task[], analysis: TaskAnalysis, options: OrchestrationOptions): ParallelGroup[] {
    if (!options.allowParallelExecution) {
      return [];
    }

    const groups: ParallelGroup[] = [];
    const processed = new Set<string>();

    // 找到可以并行执行的任务
    tasks.forEach(task => {
      if (processed.has(task.id)) return;

      const parallelTasks = this.findParallelTasks(task, tasks, analysis, processed);

      if (parallelTasks.length > 1 && parallelTasks.length <= options.maxParallelTasks) {
        const totalDuration = Math.max(...parallelTasks.map(t =>
          this.getEstimatedHours(t.id, analysis.timeEstimates)
        ));

        const requiredResources = parallelTasks.length;
        const conflictRisk = this.calculateConflictRisk(parallelTasks, analysis);

        groups.push({
          id: `parallel-${groups.length + 1}`,
          name: `并行组 ${groups.length + 1}`,
          tasks: parallelTasks.map(t => t.id),
          estimatedDuration: totalDuration,
          requiredResources,
          conflictRisk
        });

        parallelTasks.forEach(t => processed.add(t.id));
      }
    });

    return groups;
  }

  /**
   * 查找可并行执行的任务
   * @param baseTask 基准任务
   * @param allTasks 所有任务
   * @param analysis 分析结果
   * @param processed 已处理的任务
   */
  private findParallelTasks(baseTask: Task, allTasks: Task[], analysis: TaskAnalysis, processed: Set<string>): Task[] {
    const parallelTasks = [baseTask];

    allTasks.forEach(task => {
      if (task.id === baseTask.id || processed.has(task.id)) return;

      if (this.canRunInParallel(baseTask, task, allTasks, analysis)) {
        parallelTasks.push(task);
      }
    });

    return parallelTasks;
  }

  /**
   * 检查两个任务是否可以并行执行
   * @param task1 任务1
   * @param task2 任务2
   * @param allTasks 所有任务
   * @param analysis 分析结果
   */
  private canRunInParallel(task1: Task, task2: Task, allTasks: Task[], analysis: TaskAnalysis): boolean {
    // 检查直接依赖
    if (task1.dependencies.includes(task2.id) || task2.dependencies.includes(task1.id)) {
      return false;
    }

    // 检查间接依赖
    if (this.hasIndirectDependency(task1.id, task2.id, allTasks) ||
      this.hasIndirectDependency(task2.id, task1.id, allTasks)) {
      return false;
    }

    // 检查资源冲突
    const skills1 = analysis.skillRequirements.get(task1.id) || [];
    const skills2 = analysis.skillRequirements.get(task2.id) || [];
    const sharedSkills = skills1.filter(skill => skills2.includes(skill));

    if (sharedSkills.length > 0 && (task1.type === task2.type)) {
      return false; // 需要相同技能的相同类型任务可能冲突
    }

    return true;
  }

  /**
   * 检查间接依赖
   * @param fromId 起始任务ID
   * @param toId 目标任务ID
   * @param allTasks 所有任务
   */
  private hasIndirectDependency(fromId: string, toId: string, allTasks: Task[]): boolean {
    const taskMap = new Map(allTasks.map(t => [t.id, t]));
    const visited = new Set<string>();

    const dfs = (currentId: string): boolean => {
      if (visited.has(currentId)) return false;
      if (currentId === toId) return true;

      visited.add(currentId);
      const task = taskMap.get(currentId);

      if (task) {
        for (const depId of task.dependencies) {
          if (dfs(depId)) return true;
        }
      }

      return false;
    };

    return dfs(fromId);
  }

  /**
   * 计算冲突风险
   * @param tasks 任务列表
   * @param analysis 分析结果
   */
  private calculateConflictRisk(tasks: Task[], analysis: TaskAnalysis): number {
    let risk = 0;

    // 技能重叠风险
    const allSkills = new Set<string>();
    const skillCounts = new Map<string, number>();

    tasks.forEach(task => {
      const skills = analysis.skillRequirements.get(task.id) || [];
      skills.forEach(skill => {
        allSkills.add(skill);
        skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
      });
    });

    // 计算技能冲突风险
    Array.from(skillCounts.values()).forEach(count => {
      if (count > 1) {
        risk += 0.1 * (count - 1);
      }
    });

    // 类型相似性风险
    const types = new Set(tasks.map(t => t.type));
    if (types.size < tasks.length) {
      risk += 0.2;
    }

    return Math.min(1.0, risk);
  }

  /**
   * 创建里程碑
   * @param tasks 任务列表
   * @param phases 执行阶段
   */
  private createMilestones(tasks: Task[], phases: ExecutionPhase[]): Milestone[] {
    const milestones: Milestone[] = [];

    // 为每个阶段创建里程碑
    phases.forEach((phase, index) => {
      const phaseEndDate = new Date();
      phaseEndDate.setDate(phaseEndDate.getDate() + phase.estimatedDuration);

      milestones.push({
        id: `milestone-${index + 1}`,
        name: `${phase.name}完成`,
        description: `完成${phase.name}的所有任务`,
        targetDate: phaseEndDate,
        criteria: [`所有${phase.tasks.length}个任务已完成`, '质量检查通过', '交付物已确认'],
        dependentTasks: phase.tasks,
        importance: phase.riskLevel === 'high' ? 'critical' :
          phase.riskLevel === 'medium' ? 'high' : 'medium'
      });
    });

    // 添加项目总体里程碑
    const projectEndDate = new Date();
    const totalDuration = phases.reduce((sum, phase) => sum + phase.estimatedDuration, 0);
    projectEndDate.setDate(projectEndDate.getDate() + totalDuration);

    milestones.push({
      id: 'milestone-final',
      name: '项目完成',
      description: '所有任务完成，项目交付',
      targetDate: projectEndDate,
      criteria: ['所有任务已完成', '最终测试通过', '用户验收完成', '项目文档齐全'],
      dependentTasks: tasks.map(t => t.id),
      importance: 'critical'
    });

    return milestones;
  }

  /**
   * 计算资源利用率
   * @param tasks 任务列表
   * @param phases 执行阶段
   * @param options 编排选项
   */
  private calculateResourceUtilization(tasks: Task[], phases: ExecutionPhase[], options: OrchestrationOptions): ResourceUtilization {
    const totalPersonDays = tasks.reduce((sum, task) => {
      return sum + ((task.estimatedHours || 8) / 8);
    }, 0);

    const peakConcurrency = Math.max(...phases.map(phase =>
      Math.min(phase.tasks.length, options.teamSize)
    ));

    const totalDuration = phases.reduce((sum, phase) => sum + phase.estimatedDuration, 0);
    const averageUtilization = totalPersonDays / (totalDuration * options.teamSize);

    // 识别瓶颈任务
    const bottlenecks = tasks
      .filter(task => {
        const dependents = tasks.filter(t => t.dependencies.includes(task.id));
        return dependents.length >= 2;
      })
      .map(task => task.id);

    // 简化的空闲期间计算
    const idlePeriods: IdlePeriod[] = [];
    if (averageUtilization < 0.8) {
      const idleStart = new Date();
      const idleEnd = new Date();
      idleEnd.setDate(idleEnd.getDate() + 1);

      idlePeriods.push({
        start: idleStart,
        end: idleEnd,
        availableResources: Math.floor((1 - averageUtilization) * options.teamSize),
        suggestions: ['代码重构', '文档完善', '技术调研', '团队培训']
      });
    }

    return {
      totalPersonDays,
      peakConcurrency,
      averageUtilization,
      bottlenecks,
      idlePeriods
    };
  }

  /**
   * 计算总时长
   * @param phases 执行阶段
   * @param parallelGroups 并行组
   */
  private calculateTotalDuration(phases: ExecutionPhase[], parallelGroups: ParallelGroup[]): number {
    // 简化计算：假设阶段是顺序执行的
    let totalDuration = phases.reduce((sum, phase) => sum + phase.estimatedDuration, 0);

    // 考虑并行执行的时间节省
    parallelGroups.forEach(group => {
      const groupTasks = group.tasks;
      const affectedPhases = phases.filter(phase =>
        phase.tasks.some(taskId => groupTasks.includes(taskId))
      );

      if (affectedPhases.length > 0) {
        // 简化：假设并行执行可以节省一些时间
        const timeSaved = group.estimatedDuration * 0.2; // 20%的时间节省
        totalDuration -= timeSaved;
      }
    });

    return Math.max(1, Math.round(totalDuration));
  }

  /**
   * 优化任务顺序
   * @param taskPlan 任务计划
   * @param executionPath 执行路径
   * @param options 编排选项
   */
  private async optimizeTaskOrder(
    taskPlan: TaskPlan,
    executionPath: ExecutionPath,
    options: OrchestrationOptions
  ): Promise<TaskPlan> {
    this.logger.info('优化任务顺序');

    const optimizedPlan = { ...taskPlan };
    const tasks = [...taskPlan.tasks];

    // 根据策略进行不同的优化
    switch (options.strategy) {
      case OrchestrationStrategy.TIME_OPTIMIZED:
        this.optimizeForTime(tasks, executionPath);
        break;
      case OrchestrationStrategy.RESOURCE_OPTIMIZED:
        this.optimizeForResources(tasks, executionPath, options);
        break;
      case OrchestrationStrategy.RISK_MINIMIZED:
        this.optimizeForRisk(tasks, executionPath);
        break;
      case OrchestrationStrategy.VALUE_MAXIMIZED:
        this.optimizeForValue(tasks, executionPath);
        break;
      case OrchestrationStrategy.BALANCED:
        this.optimizeBalanced(tasks, executionPath, options);
        break;
    }

    optimizedPlan.tasks = tasks;
    optimizedPlan.updatedAt = new Date();

    return optimizedPlan;
  }

  /**
   * 时间优化
   * @param tasks 任务列表
   * @param executionPath 执行路径
   */
  private optimizeForTime(tasks: Task[], executionPath: ExecutionPath): void {
    // 按关键路径和依赖关系排序
    const criticalTasks = new Set(executionPath.criticalPath);

    tasks.sort((a, b) => {
      // 关键路径任务优先
      if (criticalTasks.has(a.id) && !criticalTasks.has(b.id)) return -1;
      if (!criticalTasks.has(a.id) && criticalTasks.has(b.id)) return 1;

      // 依赖数量少的优先
      if (a.dependencies.length !== b.dependencies.length) {
        return a.dependencies.length - b.dependencies.length;
      }

      // 估算时间短的优先
      return (a.estimatedHours || 8) - (b.estimatedHours || 8);
    });
  }

  /**
   * 资源优化
   * @param tasks 任务列表
   * @param executionPath 执行路径
   * @param options 编排选项
   */
  private optimizeForResources(tasks: Task[], _executionPath: ExecutionPath, _options: OrchestrationOptions): void {
    // 按资源需求和可用性排序
    tasks.sort((a, b) => {
      // 优先级高的优先
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 0;
      const bPriority = priorityOrder[b.priority] || 0;

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      // 资源需求少的优先
      const aHours = a.estimatedHours || 8;
      const bHours = b.estimatedHours || 8;
      return aHours - bHours;
    });
  }

  /**
   * 风险优化
   * @param tasks 任务列表
   * @param executionPath 执行路径
   */
  private optimizeForRisk(tasks: Task[], _executionPath: ExecutionPath): void {
    // 高风险任务提前执行
    tasks.sort((a, b) => {
      // 简化的风险评估
      const aRisk = this.calculateTaskRisk(a);
      const bRisk = this.calculateTaskRisk(b);

      if (aRisk !== bRisk) {
        return bRisk - aRisk; // 高风险优先
      }

      return a.dependencies.length - b.dependencies.length;
    });
  }

  /**
   * 价值优化
   * @param tasks 任务列表
   * @param executionPath 执行路径
   */
  private optimizeForValue(tasks: Task[], _executionPath: ExecutionPath): void {
    // 高价值任务优先
    tasks.sort((a, b) => {
      const aValue = this.calculateTaskValue(a);
      const bValue = this.calculateTaskValue(b);

      if (aValue !== bValue) {
        return bValue - aValue; // 高价值优先
      }

      return a.dependencies.length - b.dependencies.length;
    });
  }

  /**
   * 平衡优化
   * @param tasks 任务列表
   * @param executionPath 执行路径
   * @param options 编排选项
   */
  private optimizeBalanced(tasks: Task[], executionPath: ExecutionPath, _options: OrchestrationOptions): void {
    // 综合考虑多个因素
    tasks.sort((a, b) => {
      const aScore = this.calculateBalancedScore(a, executionPath);
      const bScore = this.calculateBalancedScore(b, executionPath);

      return bScore - aScore; // 高分优先
    });
  }

  /**
   * 计算任务风险
   * @param task 任务
   */
  private calculateTaskRisk(task: Task): number {
    let risk = 0;

    // 基于任务类型
    if (task.type === TaskType.RESEARCH) risk += 0.3;
    if (task.type === TaskType.DESIGN) risk += 0.2;

    // 基于估算时间
    if (task.estimatedHours && task.estimatedHours > 40) risk += 0.2;

    // 基于依赖数量
    risk += Math.min(task.dependencies.length * 0.1, 0.3);

    return Math.min(1.0, risk);
  }

  /**
   * 计算任务价值
   * @param task 任务
   */
  private calculateTaskValue(task: Task): number {
    let value = 0.5;

    // 基于优先级
    const priorityValues = { critical: 1.0, high: 0.8, medium: 0.5, low: 0.2 };
    value = priorityValues[task.priority] || 0.5;

    // 基于任务类型
    if (task.type === TaskType.FEATURE) value += 0.2;
    if (task.type === TaskType.BUG_FIX) value += 0.1;

    return Math.min(1.0, value);
  }

  /**
   * 计算平衡评分
   * @param task 任务
   * @param executionPath 执行路径
   */
  private calculateBalancedScore(task: Task, executionPath: ExecutionPath): number {
    const value = this.calculateTaskValue(task);
    const risk = this.calculateTaskRisk(task);
    const isCritical = executionPath.criticalPath.includes(task.id) ? 1 : 0;

    // 平衡公式：价值 + 关键性 - 风险
    return value + (isCritical * 0.3) - (risk * 0.2);
  }

  /**
   * 生成推荐建议
   * @param optimizedPlan 优化后的计划
   * @param analysis 分析结果
   * @param options 编排选项
   */
  private async generateRecommendations(
    optimizedPlan: TaskPlan,
    analysis: TaskAnalysis,
    options: OrchestrationOptions
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // 1. 资源分配建议
    recommendations.push(...this.generateResourceRecommendations(optimizedPlan, analysis, options));

    // 2. 风险缓解建议
    recommendations.push(...this.generateRiskRecommendations(optimizedPlan, analysis));

    // 3. 时间线调整建议
    recommendations.push(...this.generateTimelineRecommendations(optimizedPlan, analysis, options));

    // 4. 优化建议
    recommendations.push(...this.generateOptimizationRecommendations(optimizedPlan, analysis, options));

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    });
  }

  /**
   * 生成资源分配建议
   */
  private generateResourceRecommendations(optimizedPlan: TaskPlan, analysis: TaskAnalysis, options: OrchestrationOptions): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // 检查资源瓶颈
    const skillDemand = new Map<string, number>();
    optimizedPlan.tasks.forEach(task => {
      const skills = analysis.skillRequirements.get(task.id) || [];
      skills.forEach(skill => {
        skillDemand.set(skill, (skillDemand.get(skill) || 0) + 1);
      });
    });

    // 识别高需求技能
    Array.from(skillDemand.entries()).forEach(([skill, demand]) => {
      if (demand > options.teamSize) {
        recommendations.push({
          id: `resource-${skill}`,
          type: 'resource_allocation',
          priority: 'high',
          title: `${skill}技能资源不足`,
          description: `项目需要${demand}个${skill}技能，但团队规模只有${options.teamSize}人`,
          impact: '可能导致项目延期或质量问题',
          effort: '中等 - 需要招聘或培训',
          targetTasks: optimizedPlan.tasks
            .filter(task => (analysis.skillRequirements.get(task.id) || []).includes(skill))
            .map(task => task.id),
          actionItems: [
            `考虑招聘${skill}专家`,
            `安排团队成员${skill}技能培训`,
            `考虑外包部分${skill}相关任务`,
            `调整任务优先级以平衡资源需求`
          ]
        });
      }
    });

    return recommendations;
  }

  /**
   * 生成风险缓解建议
   */
  private generateRiskRecommendations(optimizedPlan: TaskPlan, analysis: TaskAnalysis): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // 识别高风险任务
    optimizedPlan.tasks.forEach(task => {
      const riskFactors = analysis.riskFactors.get(task.id);
      if (riskFactors && riskFactors.overall > 0.7) {
        recommendations.push({
          id: `risk-${task.id}`,
          type: 'risk_mitigation',
          priority: 'high',
          title: `高风险任务: ${task.title}`,
          description: `任务"${task.title}"存在较高风险，需要特别关注`,
          impact: '可能影响项目进度和质量',
          effort: '中等 - 需要额外的规划和监控',
          targetTasks: [task.id],
          actionItems: [
            '制定详细的风险应对计划',
            '增加任务检查点和里程碑',
            '分配经验丰富的团队成员',
            '准备备选方案',
            '增加缓冲时间'
          ]
        });
      }
    });

    return recommendations;
  }

  /**
   * 生成时间线调整建议
   */
  private generateTimelineRecommendations(optimizedPlan: TaskPlan, analysis: TaskAnalysis, options: OrchestrationOptions): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // 检查时间约束
    if (options.timeConstraint) {
      const totalDuration = optimizedPlan.tasks.reduce((sum, task) => {
        return sum + this.getEstimatedHours(task.id, analysis.timeEstimates);
      }, 0) / 8; // 转换为天数

      if (totalDuration > options.timeConstraint) {
        recommendations.push({
          id: 'timeline-constraint',
          type: 'timeline_adjustment',
          priority: 'critical',
          title: '项目时间超出约束',
          description: `预计项目需要${Math.ceil(totalDuration)}天，超出约束${options.timeConstraint}天`,
          impact: '无法在预期时间内完成项目',
          effort: '高 - 需要重大调整',
          targetTasks: optimizedPlan.tasks.map(task => task.id),
          actionItems: [
            '重新评估任务优先级',
            '考虑并行执行更多任务',
            '简化或推迟低优先级功能',
            '增加团队规模',
            '优化开发流程'
          ]
        });
      }
    }

    return recommendations;
  }

  /**
   * 生成优化建议
   */
  private generateOptimizationRecommendations(optimizedPlan: TaskPlan, analysis: TaskAnalysis, _options: OrchestrationOptions): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // 检查并行化机会
    const sequentialTasks = optimizedPlan.tasks.filter(task => {
      const dependents = optimizedPlan.tasks.filter(t => t.dependencies.includes(task.id));
      return dependents.length === 1; // 只有一个依赖者的任务可能可以并行化
    });

    if (sequentialTasks.length > 2) {
      recommendations.push({
        id: 'parallelization-opportunity',
        type: 'optimization',
        priority: 'medium',
        title: '并行化优化机会',
        description: `发现${sequentialTasks.length}个可能并行执行的任务`,
        impact: '可以显著缩短项目时间',
        effort: '低 - 调整任务安排',
        targetTasks: sequentialTasks.map(task => task.id),
        actionItems: [
          '重新评估任务依赖关系',
          '识别可以并行的任务组合',
          '调整资源分配以支持并行执行',
          '更新项目时间线'
        ]
      });
    }

    // 检查技能分布
    const skillDistribution = new Map<string, number>();
    optimizedPlan.tasks.forEach(task => {
      const skills = analysis.skillRequirements.get(task.id) || [];
      skills.forEach(skill => {
        skillDistribution.set(skill, (skillDistribution.get(skill) || 0) + 1);
      });
    });

    const unevenSkills = Array.from(skillDistribution.entries())
      .filter(([_, count]) => count > optimizedPlan.tasks.length * 0.6);

    if (unevenSkills.length > 0) {
      recommendations.push({
        id: 'skill-balance',
        type: 'optimization',
        priority: 'medium',
        title: '技能分布不均',
        description: `某些技能需求过于集中，可能造成资源瓶颈`,
        impact: '可能导致部分团队成员过载',
        effort: '中等 - 需要重新分配任务',
        targetTasks: [],
        actionItems: [
          '重新分配任务以平衡技能需求',
          '考虑跨技能培训',
          '调整任务执行顺序',
          '引入技能互补的团队成员'
        ]
      });
    }

    return recommendations;
  }

  /**
   * 计算编排指标
   * @param optimizedPlan 优化后的计划
   * @param executionPath 执行路径
   * @param options 编排选项
   */
  private calculateMetrics(optimizedPlan: TaskPlan, executionPath: ExecutionPath, options: OrchestrationOptions): OrchestrationMetrics {
    // 效率评分
    const efficiency = this.calculateEfficiency(optimizedPlan, executionPath, options);

    // 风险评分
    const riskScore = this.calculateRiskScore(optimizedPlan);

    // 价值评分
    const valueScore = this.calculateValueScore(optimizedPlan);

    // 可行性评分
    const feasibility = this.calculateFeasibility(optimizedPlan, options);

    // 复杂度评分
    const complexity = this.calculateComplexity(optimizedPlan);

    // 适应性评分
    const adaptability = this.calculateAdaptability(optimizedPlan, executionPath);

    // 综合评分
    const overallScore = (efficiency + (1 - riskScore) + valueScore + feasibility + (1 - complexity) + adaptability) / 6;

    return {
      efficiency,
      riskScore,
      valueScore,
      feasibility,
      complexity,
      adaptability,
      overallScore
    };
  }

  /**
   * 计算效率评分
   */
  private calculateEfficiency(optimizedPlan: TaskPlan, executionPath: ExecutionPath, options: OrchestrationOptions): number {
    const totalHours = optimizedPlan.tasks.reduce((sum, task) => sum + (task.estimatedHours || 8), 0);
    const idealDuration = totalHours / (8 * options.teamSize);
    const actualDuration = executionPath.estimatedDuration;

    return Math.max(0, Math.min(1, idealDuration / actualDuration));
  }

  /**
   * 计算风险评分
   */
  private calculateRiskScore(optimizedPlan: TaskPlan): number {
    const avgRisk = optimizedPlan.tasks.reduce((sum, task) => {
      return sum + this.calculateTaskRisk(task);
    }, 0) / optimizedPlan.tasks.length;

    return avgRisk;
  }

  /**
   * 计算价值评分
   */
  private calculateValueScore(optimizedPlan: TaskPlan): number {
    const avgValue = optimizedPlan.tasks.reduce((sum, task) => {
      return sum + this.calculateTaskValue(task);
    }, 0) / optimizedPlan.tasks.length;

    return avgValue;
  }

  /**
   * 计算可行性评分
   */
  private calculateFeasibility(optimizedPlan: TaskPlan, options: OrchestrationOptions): number {
    let feasibility = 1.0;

    // 检查资源约束
    const maxConcurrentTasks = Math.max(...optimizedPlan.tasks.map(task =>
      optimizedPlan.tasks.filter(t => !this.hasIndirectDependency(task.id, t.id, optimizedPlan.tasks)).length
    ));

    if (maxConcurrentTasks > options.teamSize) {
      feasibility -= 0.2;
    }

    // 检查时间约束
    if (options.timeConstraint) {
      const totalDuration = optimizedPlan.tasks.reduce((sum, task) => sum + (task.estimatedHours || 8), 0) / 8;
      if (totalDuration > options.timeConstraint) {
        feasibility -= 0.3;
      }
    }

    return Math.max(0, feasibility);
  }

  /**
   * 计算复杂度评分
   */
  private calculateComplexity(optimizedPlan: TaskPlan): number {
    const avgDependencies = optimizedPlan.tasks.reduce((sum, task) => sum + task.dependencies.length, 0) / optimizedPlan.tasks.length;
    const typeVariety = new Set(optimizedPlan.tasks.map(t => t.type)).size;

    const dependencyComplexity = Math.min(1, avgDependencies / 3);
    const varietyComplexity = Math.min(1, typeVariety / 5);

    return (dependencyComplexity + varietyComplexity) / 2;
  }

  /**
   * 计算适应性评分
   */
  private calculateAdaptability(optimizedPlan: TaskPlan, executionPath: ExecutionPath): number {
    // 基于并行组数量和关键路径长度
    const parallelGroups = executionPath.parallelGroups.length;
    const criticalPathLength = executionPath.criticalPath.length;
    const totalTasks = optimizedPlan.tasks.length;

    const parallelizability = parallelGroups / Math.max(1, totalTasks / 3);
    const criticalPathRatio = criticalPathLength / totalTasks;

    return Math.max(0, Math.min(1, parallelizability - criticalPathRatio + 0.5));
  }

  /**
   * 生成备选方案
   * @param taskPlan 原始任务计划
   * @param analysis 分析结果
   * @param options 编排选项
   */
  private async generateAlternatives(taskPlan: TaskPlan, analysis: TaskAnalysis, options: OrchestrationOptions): Promise<AlternativePlan[]> {
    const alternatives: AlternativePlan[] = [];

    // 为每种策略生成备选方案
    const strategies = [
      OrchestrationStrategy.TIME_OPTIMIZED,
      OrchestrationStrategy.RESOURCE_OPTIMIZED,
      OrchestrationStrategy.RISK_MINIMIZED,
      OrchestrationStrategy.VALUE_MAXIMIZED
    ].filter(strategy => strategy !== options.strategy);

    for (const strategy of strategies) {
      const altOptions = { ...options, strategy };
      const altExecutionPath = await this.generateExecutionPath(taskPlan, analysis, altOptions);
      const altOptimizedPlan = await this.optimizeTaskOrder(taskPlan, altExecutionPath, altOptions);
      const altMetrics = this.calculateMetrics(altOptimizedPlan, altExecutionPath, altOptions);

      alternatives.push({
        id: `alt-${strategy}`,
        name: this.getStrategyName(strategy),
        description: this.getStrategyDescription(strategy),
        strategy,
        metrics: altMetrics,
        tradeoffs: this.getStrategyTradeoffs(strategy),
        suitableFor: this.getStrategySuitability(strategy)
      });
    }

    return alternatives.sort((a, b) => b.metrics.overallScore - a.metrics.overallScore);
  }

  /**
   * 获取策略名称
   */
  private getStrategyName(strategy: OrchestrationStrategy): string {
    const names = {
      [OrchestrationStrategy.TIME_OPTIMIZED]: '时间优化方案',
      [OrchestrationStrategy.RESOURCE_OPTIMIZED]: '资源优化方案',
      [OrchestrationStrategy.RISK_MINIMIZED]: '风险最小化方案',
      [OrchestrationStrategy.VALUE_MAXIMIZED]: '价值最大化方案',
      [OrchestrationStrategy.BALANCED]: '平衡方案'
    };
    return names[strategy];
  }

  /**
   * 获取策略描述
   */
  private getStrategyDescription(strategy: OrchestrationStrategy): string {
    const descriptions = {
      [OrchestrationStrategy.TIME_OPTIMIZED]: '优先考虑项目完成时间，通过并行执行和关键路径优化来缩短总体时长',
      [OrchestrationStrategy.RESOURCE_OPTIMIZED]: '优化资源利用率，平衡团队工作负载，避免资源瓶颈',
      [OrchestrationStrategy.RISK_MINIMIZED]: '优先处理高风险任务，通过早期风险识别和缓解来提高项目成功率',
      [OrchestrationStrategy.VALUE_MAXIMIZED]: '优先交付高价值功能，确保项目能够尽早产生业务价值',
      [OrchestrationStrategy.BALANCED]: '综合考虑时间、资源、风险和价值，寻求最佳平衡点'
    };
    return descriptions[strategy];
  }

  /**
   * 获取策略权衡点
   */
  private getStrategyTradeoffs(strategy: OrchestrationStrategy): string[] {
    const tradeoffs = {
      [OrchestrationStrategy.TIME_OPTIMIZED]: ['可能增加资源压力', '风险控制相对较弱', '可能影响质量'],
      [OrchestrationStrategy.RESOURCE_OPTIMIZED]: ['项目时间可能延长', '并行度较低', '灵活性有限'],
      [OrchestrationStrategy.RISK_MINIMIZED]: ['项目进度可能较慢', '资源利用率不够高', '可能过度保守'],
      [OrchestrationStrategy.VALUE_MAXIMIZED]: ['技术债务可能累积', '长期维护成本较高', '系统稳定性风险'],
      [OrchestrationStrategy.BALANCED]: ['各方面都不是最优', '决策复杂度较高', '需要更多协调']
    };
    return tradeoffs[strategy] || [];
  }

  /**
   * 获取策略适用性
   */
  private getStrategySuitability(strategy: OrchestrationStrategy): string[] {
    const suitability = {
      [OrchestrationStrategy.TIME_OPTIMIZED]: ['紧急项目', '市场窗口期有限', '竞争激烈的环境'],
      [OrchestrationStrategy.RESOURCE_OPTIMIZED]: ['资源有限的团队', '长期项目', '成本敏感的项目'],
      [OrchestrationStrategy.RISK_MINIMIZED]: ['关键业务系统', '合规要求严格', '新技术探索项目'],
      [OrchestrationStrategy.VALUE_MAXIMIZED]: ['创业公司', 'MVP开发', '用户导向的产品'],
      [OrchestrationStrategy.BALANCED]: ['大多数常规项目', '团队经验丰富', '需求相对稳定']
    };
    return suitability[strategy] || [];
  }

  /**
   * 验证结果
   * @param optimizedPlan 优化后的计划
   * @param executionPath 执行路径
   * @param options 编排选项
   */
  private validateResult(optimizedPlan: TaskPlan, executionPath: ExecutionPath, options: OrchestrationOptions): string[] {
    const warnings: string[] = [];

    // 检查循环依赖
    if (this.hasCircularDependencies(optimizedPlan.tasks)) {
      warnings.push('检测到循环依赖，可能导致任务无法执行');
    }

    // 检查资源约束
    const maxConcurrency = Math.max(...executionPath.parallelGroups.map(g => g.requiredResources));
    if (maxConcurrency > options.teamSize) {
      warnings.push(`最大并发资源需求(${maxConcurrency})超过团队规模(${options.teamSize})`);
    }

    // 检查时间约束
    if (options.timeConstraint && executionPath.estimatedDuration > options.timeConstraint) {
      warnings.push(`预计项目时长(${executionPath.estimatedDuration}天)超过时间约束(${options.timeConstraint}天)`);
    }

    // 检查关键路径
    if (executionPath.criticalPath.length > optimizedPlan.tasks.length * 0.8) {
      warnings.push('关键路径过长，项目灵活性较低');
    }

    return warnings;
  }

  /**
   * 检查循环依赖
   * @param tasks 任务列表
   */
  private hasCircularDependencies(tasks: Task[]): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    const hasCycle = (taskId: string): boolean => {
      if (recStack.has(taskId)) return true;
      if (visited.has(taskId)) return false;

      visited.add(taskId);
      recStack.add(taskId);

      const task = taskMap.get(taskId);
      if (task) {
        for (const depId of task.dependencies) {
          if (hasCycle(depId)) return true;
        }
      }

      recStack.delete(taskId);
      return false;
    };

    return tasks.some(task => hasCycle(task.id));
  }
}