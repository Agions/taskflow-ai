/**
 * TaskFlow AI - 智能任务编排引擎
 * 
 * 实现基于依赖关系的智能任务排序、关键路径分析和并行任务优化
 * 
 * @author TaskFlow AI Team
 * @version 1.0.0
 */

import {
  Task,
  TaskDependency,
  TaskOrchestrationConfig,
  TaskOrchestrationResult,
  SchedulingStrategy,
  OptimizationGoal,
  DependencyType,
  TaskStatus,
  ResourceUtilization,
  RiskAssessment,
  RiskFactor,
  RiskCategory,
  ContingencyPlan,
} from '../types/task.js';

/**
 * 图节点（用于依赖关系分析）
 */
interface GraphNode {
  taskId: string;
  task: Task;
  inDegree: number;
  outDegree: number;
  predecessors: Set<string>;
  successors: Set<string>;
  earliestStart: number;
  latestStart: number;
  earliestFinish: number;
  latestFinish: number;
  totalFloat: number;
  freeFloat: number;
  isCritical: boolean;
}

/**
 * 智能任务编排引擎
 */
export class TaskOrchestrationEngine {
  private config: TaskOrchestrationConfig;
  private tasks: Map<string, Task>;
  private dependencies: Map<string, TaskDependency>;
  private graph: Map<string, GraphNode>;

  constructor(config: TaskOrchestrationConfig = {}) {
    this.config = {
      enableCriticalPath: true,
      enableParallelOptimization: true,
      enableResourceLeveling: false,
      enableRiskAnalysis: true,
      schedulingStrategy: SchedulingStrategy.CRITICAL_PATH,
      optimizationGoal: OptimizationGoal.MINIMIZE_DURATION,
      maxParallelTasks: 10,
      workingHoursPerDay: 8,
      workingDaysPerWeek: 5,
      bufferPercentage: 0.1,
      ...config,
    };
    
    this.tasks = new Map();
    this.dependencies = new Map();
    this.graph = new Map();
  }

  /**
   * 执行任务编排
   */
  public async orchestrate(tasks: Task[]): Promise<TaskOrchestrationResult> {
    console.log(`🎯 开始任务编排，共 ${tasks.length} 个任务`);
    
    // 1. 初始化数据结构
    this.initializeDataStructures(tasks);
    
    // 2. 构建依赖关系图
    this.buildDependencyGraph();
    
    // 3. 验证依赖关系
    this.validateDependencies();
    
    // 4. 计算关键路径
    const criticalPath = this.config.enableCriticalPath 
      ? this.calculateCriticalPath() 
      : [];
    
    // 5. 优化任务排序
    const optimizedTasks = this.optimizeTaskOrder();
    
    // 6. 识别并行任务组
    const parallelGroups = this.config.enableParallelOptimization 
      ? this.identifyParallelGroups() 
      : [];
    
    // 7. 计算资源利用率
    const resourceUtilization = this.config.enableResourceLeveling 
      ? this.calculateResourceUtilization(optimizedTasks) 
      : [];
    
    // 8. 风险评估
    const riskAssessment = this.config.enableRiskAnalysis 
      ? this.performRiskAssessment(optimizedTasks) 
      : this.createEmptyRiskAssessment();
    
    // 9. 生成优化建议
    const recommendations = this.generateRecommendations(
      optimizedTasks,
      criticalPath,
      parallelGroups,
      resourceUtilization,
      riskAssessment
    );
    
    // 10. 计算项目总持续时间
    const totalDuration = this.calculateTotalDuration(optimizedTasks);
    
    console.log(`✅ 任务编排完成，项目预计持续时间: ${totalDuration} 小时`);
    
    return {
      tasks: optimizedTasks,
      criticalPath,
      totalDuration,
      parallelGroups,
      resourceUtilization,
      riskAssessment,
      recommendations,
      metadata: {
        orchestrationTime: new Date(),
        strategy: this.config.schedulingStrategy!,
        goal: this.config.optimizationGoal!,
        version: '1.0.0',
      },
    };
  }

  /**
   * 初始化数据结构
   */
  private initializeDataStructures(tasks: Task[]): void {
    this.tasks.clear();
    this.dependencies.clear();
    this.graph.clear();

    // 初始化任务映射
    for (const task of tasks) {
      this.tasks.set(task.id, task);
      
      // 初始化图节点
      this.graph.set(task.id, {
        taskId: task.id,
        task,
        inDegree: 0,
        outDegree: 0,
        predecessors: new Set(),
        successors: new Set(),
        earliestStart: 0,
        latestStart: 0,
        earliestFinish: 0,
        latestFinish: 0,
        totalFloat: 0,
        freeFloat: 0,
        isCritical: false,
      });
    }

    // 初始化依赖关系
    for (const task of tasks) {
      // 处理传统的依赖关系（向后兼容）
      if (task.dependencies && task.dependencies.length > 0) {
        for (const depId of task.dependencies) {
          const dependency: TaskDependency = {
            id: `${depId}-${task.id}`,
            predecessorId: depId,
            successorId: task.id,
            type: DependencyType.FINISH_TO_START,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          this.dependencies.set(dependency.id, dependency);
        }
      }
      
      // 处理新的详细依赖关系
      if (task.dependencyRelations && task.dependencyRelations.length > 0) {
        for (const dep of task.dependencyRelations) {
          this.dependencies.set(dep.id, dep);
        }
      }
    }
  }

  /**
   * 构建依赖关系图
   */
  private buildDependencyGraph(): void {
    for (const dependency of this.dependencies.values()) {
      const predecessorNode = this.graph.get(dependency.predecessorId);
      const successorNode = this.graph.get(dependency.successorId);
      
      if (!predecessorNode || !successorNode) {
        console.warn(`⚠️ 发现无效依赖关系: ${dependency.id}`);
        continue;
      }
      
      // 更新图结构
      predecessorNode.successors.add(dependency.successorId);
      predecessorNode.outDegree++;
      
      successorNode.predecessors.add(dependency.predecessorId);
      successorNode.inDegree++;
    }
  }

  /**
   * 验证依赖关系（检测循环依赖）
   */
  private validateDependencies(): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) {
        return true; // 发现循环
      }
      
      if (visited.has(nodeId)) {
        return false; // 已访问过，无循环
      }
      
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      const node = this.graph.get(nodeId);
      if (node) {
        for (const successorId of node.successors) {
          if (hasCycle(successorId)) {
            return true;
          }
        }
      }
      
      recursionStack.delete(nodeId);
      return false;
    };
    
    for (const nodeId of this.graph.keys()) {
      if (!visited.has(nodeId) && hasCycle(nodeId)) {
        throw new Error(`检测到循环依赖，涉及任务: ${nodeId}`);
      }
    }
  }

  /**
   * 计算关键路径（CPM算法）
   */
  private calculateCriticalPath(): string[] {
    // 前向计算（计算最早开始和完成时间）
    this.forwardPass();
    
    // 反向计算（计算最晚开始和完成时间）
    this.backwardPass();
    
    // 计算浮动时间
    this.calculateFloat();
    
    // 识别关键路径
    const criticalTasks: string[] = [];
    for (const node of this.graph.values()) {
      if (node.totalFloat === 0) {
        node.isCritical = true;
        criticalTasks.push(node.taskId);
      }
    }
    
    console.log(`🎯 识别到关键路径，包含 ${criticalTasks.length} 个关键任务`);
    return criticalTasks;
  }

  /**
   * 前向计算
   */
  private forwardPass(): void {
    const queue: string[] = [];
    const inDegreeCount = new Map<string, number>();
    
    // 初始化入度计数
    for (const [nodeId, node] of this.graph) {
      inDegreeCount.set(nodeId, node.inDegree);
      if (node.inDegree === 0) {
        queue.push(nodeId);
        node.earliestStart = 0;
        node.earliestFinish = this.getTaskDuration(node.task);
      }

  /**
   * 反向计算
   */
  private backwardPass(): void {
    // 找到项目结束时间
    let projectFinish = 0;
    for (const node of this.graph.values()) {
      if (node.outDegree === 0) {
        projectFinish = Math.max(projectFinish, node.earliestFinish);
      }
    }

    // 初始化最晚时间
    for (const node of this.graph.values()) {
      if (node.outDegree === 0) {
        node.latestFinish = projectFinish;
        node.latestStart = node.latestFinish - this.getTaskDuration(node.task);
      } else {
        node.latestFinish = Infinity;
        node.latestStart = Infinity;
      }
    }

    // 反向拓扑排序
    const queue: string[] = [];
    const outDegreeCount = new Map<string, number>();

    for (const [nodeId, node] of this.graph) {
      outDegreeCount.set(nodeId, node.outDegree);
      if (node.outDegree === 0) {
        queue.push(nodeId);
      }
    }

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const currentNode = this.graph.get(currentId)!;

      for (const predecessorId of currentNode.predecessors) {
        const predecessorNode = this.graph.get(predecessorId)!;
        const dependency = this.findDependency(predecessorId, currentId);

        // 计算基于依赖类型的最晚完成时间
        let latestFinish = Infinity;
        if (dependency) {
          switch (dependency.type) {
            case DependencyType.FINISH_TO_START:
              latestFinish = currentNode.latestStart - (dependency.lag || 0);
              break;
            case DependencyType.START_TO_START:
              latestFinish = currentNode.latestStart + this.getTaskDuration(predecessorNode.task) - (dependency.lag || 0);
              break;
            case DependencyType.FINISH_TO_FINISH:
              latestFinish = currentNode.latestFinish - (dependency.lag || 0);
              break;
            case DependencyType.START_TO_FINISH:
              latestFinish = currentNode.latestFinish + this.getTaskDuration(predecessorNode.task) - (dependency.lag || 0);
              break;
          }
        }

        predecessorNode.latestFinish = Math.min(predecessorNode.latestFinish, latestFinish);
        predecessorNode.latestStart = predecessorNode.latestFinish - this.getTaskDuration(predecessorNode.task);

        const newOutDegree = outDegreeCount.get(predecessorId)! - 1;
        outDegreeCount.set(predecessorId, newOutDegree);

        if (newOutDegree === 0) {
          queue.push(predecessorId);
        }
      }
    }
  }

  /**
   * 计算浮动时间
   */
  private calculateFloat(): void {
    for (const node of this.graph.values()) {
      node.totalFloat = node.latestStart - node.earliestStart;

      // 计算自由浮动时间
      let minSuccessorEarliestStart = Infinity;
      for (const successorId of node.successors) {
        const successorNode = this.graph.get(successorId)!;
        minSuccessorEarliestStart = Math.min(minSuccessorEarliestStart, successorNode.earliestStart);
      }

      if (minSuccessorEarliestStart === Infinity) {
        node.freeFloat = node.totalFloat;
      } else {
        node.freeFloat = minSuccessorEarliestStart - node.earliestFinish;
      }
    }
  }

  /**
   * 优化任务排序
   */
  private optimizeTaskOrder(): Task[] {
    const sortedTasks: Task[] = [];

    switch (this.config.schedulingStrategy) {
      case SchedulingStrategy.CRITICAL_PATH:
        return this.sortByCriticalPath();
      case SchedulingStrategy.PRIORITY_FIRST:
        return this.sortByPriority();
      case SchedulingStrategy.SHORTEST_FIRST:
        return this.sortByDuration(true);
      case SchedulingStrategy.LONGEST_FIRST:
        return this.sortByDuration(false);
      case SchedulingStrategy.EARLY_START:
        return this.sortByEarlyStart();
      default:
        return Array.from(this.tasks.values());
    }
  }

  /**
   * 按关键路径排序
   */
  private sortByCriticalPath(): Task[] {
    const tasks = Array.from(this.tasks.values());

    return tasks.sort((a, b) => {
      const nodeA = this.graph.get(a.id)!;
      const nodeB = this.graph.get(b.id)!;

      // 关键任务优先
      if (nodeA.isCritical && !nodeB.isCritical) return -1;
      if (!nodeA.isCritical && nodeB.isCritical) return 1;

      // 按最早开始时间排序
      if (nodeA.earliestStart !== nodeB.earliestStart) {
        return nodeA.earliestStart - nodeB.earliestStart;
      }

      // 按总浮动时间排序（浮动时间少的优先）
      return nodeA.totalFloat - nodeB.totalFloat;
    });
  }

  /**
   * 按优先级排序
   */
  private sortByPriority(): Task[] {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const tasks = Array.from(this.tasks.values());

    return tasks.sort((a, b) => {
      const priorityA = priorityOrder[a.priority] || 0;
      const priorityB = priorityOrder[b.priority] || 0;

      if (priorityA !== priorityB) {
        return priorityB - priorityA; // 高优先级在前
      }

      // 优先级相同时按最早开始时间排序
      const nodeA = this.graph.get(a.id)!;
      const nodeB = this.graph.get(b.id)!;
      return nodeA.earliestStart - nodeB.earliestStart;
    });
  }

  /**
   * 按持续时间排序
   */
  private sortByDuration(shortestFirst: boolean): Task[] {
    const tasks = Array.from(this.tasks.values());

    return tasks.sort((a, b) => {
      const durationA = this.getTaskDuration(a);
      const durationB = this.getTaskDuration(b);

      return shortestFirst ? durationA - durationB : durationB - durationA;
    });
  }

  /**
   * 按最早开始时间排序
   */
  private sortByEarlyStart(): Task[] {
    const tasks = Array.from(this.tasks.values());

    return tasks.sort((a, b) => {
      const nodeA = this.graph.get(a.id)!;
      const nodeB = this.graph.get(b.id)!;
      return nodeA.earliestStart - nodeB.earliestStart;
    });
  }

  /**
   * 识别并行任务组
   */
  private identifyParallelGroups(): string[][] {
    const parallelGroups: string[][] = [];
    const processed = new Set<string>();

    // 按最早开始时间分组
    const timeGroups = new Map<number, string[]>();

    for (const [taskId, node] of this.graph) {
      if (!processed.has(taskId)) {
        const startTime = node.earliestStart;
        if (!timeGroups.has(startTime)) {
          timeGroups.set(startTime, []);
        }
        timeGroups.get(startTime)!.push(taskId);
      }
    }

    // 检查每个时间组内的任务是否可以并行
    for (const [startTime, taskIds] of timeGroups) {
      if (taskIds.length > 1) {
        const parallelGroup = this.findParallelTasks(taskIds);
        if (parallelGroup.length > 1) {
          parallelGroups.push(parallelGroup);
        }
      }
    }

    console.log(`🔄 识别到 ${parallelGroups.length} 个并行任务组`);
    return parallelGroups;
  }

  /**
   * 在给定任务列表中找到可并行执行的任务
   */
  private findParallelTasks(taskIds: string[]): string[] {
    const parallelTasks: string[] = [];

    for (const taskId of taskIds) {
      const task = this.tasks.get(taskId)!;
      const node = this.graph.get(taskId)!;

      // 检查是否可并行化
      const canParallelize = task.orchestrationMetadata?.parallelizable !== false;

      // 检查资源冲突
      const hasResourceConflict = this.checkResourceConflict(taskId, parallelTasks);

      if (canParallelize && !hasResourceConflict) {
        parallelTasks.push(taskId);
      }
    }

    return parallelTasks;
  }

  /**
   * 检查资源冲突
   */
  private checkResourceConflict(taskId: string, existingTasks: string[]): boolean {
    const task = this.tasks.get(taskId)!;
    const taskResources = task.resourceRequirements || [];

    for (const existingTaskId of existingTasks) {
      const existingTask = this.tasks.get(existingTaskId)!;
      const existingResources = existingTask.resourceRequirements || [];

      // 检查是否有相同的人力资源冲突
      for (const resource of taskResources) {
        for (const existingResource of existingResources) {
          if (resource.type === 'human' &&
              existingResource.type === 'human' &&
              resource.name === existingResource.name) {
            return true; // 发现资源冲突
          }
        }
      }
    }

    return false;
  }

  /**
   * 计算资源利用率
   */
  private calculateResourceUtilization(tasks: Task[]): ResourceUtilization[] {
    const resourceMap = new Map<string, ResourceUtilization>();

    // 收集所有资源
    for (const task of tasks) {
      if (task.resourceRequirements) {
        for (const resource of task.resourceRequirements) {
          if (!resourceMap.has(resource.id)) {
            resourceMap.set(resource.id, {
              resourceId: resource.id,
              resourceName: resource.name,
              totalCapacity: resource.availability || 1,
              allocatedCapacity: 0,
              utilizationRate: 0,
              overallocation: 0,
              timeline: [],
            });
          }
        }
      }
    }

    // 计算资源分配
    for (const task of tasks) {
      const node = this.graph.get(task.id);
      if (task.resourceRequirements && node) {
        for (const resource of task.resourceRequirements) {
          const utilization = resourceMap.get(resource.id);
          if (utilization) {
            utilization.allocatedCapacity += resource.quantity;
          }
        }
      }
    }

    // 计算利用率
    for (const utilization of resourceMap.values()) {
      utilization.utilizationRate = utilization.allocatedCapacity / utilization.totalCapacity;
      utilization.overallocation = Math.max(0, utilization.allocatedCapacity - utilization.totalCapacity);
    }

    return Array.from(resourceMap.values());
  }

  /**
   * 执行风险评估
   */
  private performRiskAssessment(tasks: Task[]): RiskAssessment {
    const riskFactors: RiskFactor[] = [];
    let overallRiskLevel = 0;

    // 分析各种风险因素
    riskFactors.push(...this.analyzeScheduleRisks(tasks));
    riskFactors.push(...this.analyzeResourceRisks(tasks));
    riskFactors.push(...this.analyzeTechnicalRisks(tasks));
    riskFactors.push(...this.analyzeQualityRisks(tasks));

    // 计算整体风险等级
    if (riskFactors.length > 0) {
      overallRiskLevel = riskFactors.reduce((sum, risk) => sum + risk.riskScore, 0) / riskFactors.length;
    }

    // 生成缓解建议
    const mitigationSuggestions = this.generateMitigationSuggestions(riskFactors);

    // 生成应急计划
    const contingencyPlans = this.generateContingencyPlans(riskFactors);

    return {
      overallRiskLevel,
      riskFactors,
      mitigationSuggestions,
      contingencyPlans,
    };
  }

  /**
   * 分析进度风险
   */
  private analyzeScheduleRisks(tasks: Task[]): RiskFactor[] {
    const risks: RiskFactor[] = [];

    // 检查关键路径风险
    const criticalTasks = tasks.filter(task => this.graph.get(task.id)?.isCritical);
    if (criticalTasks.length > tasks.length * 0.3) {
      risks.push({
        id: 'critical-path-risk',
        name: '关键路径风险',
        description: '关键路径上的任务过多，项目延期风险较高',
        probability: 0.7,
        impact: 8,
        riskScore: 5.6,
        affectedTaskIds: criticalTasks.map(t => t.id),
        category: RiskCategory.SCHEDULE,
      });
    }

    // 检查任务持续时间风险
    const longTasks = tasks.filter(task => this.getTaskDuration(task) > 40); // 超过5天
    if (longTasks.length > 0) {
      risks.push({
        id: 'long-duration-risk',
        name: '长持续时间任务风险',
        description: '存在持续时间过长的任务，可能影响项目进度',
        probability: 0.5,
        impact: 6,
        riskScore: 3.0,
        affectedTaskIds: longTasks.map(t => t.id),
        category: RiskCategory.SCHEDULE,
      });
    }

    return risks;
  }

  /**
   * 分析资源风险
   */
  private analyzeResourceRisks(tasks: Task[]): RiskFactor[] {
    const risks: RiskFactor[] = [];

    // 检查资源过度分配
    const resourceUtilization = this.calculateResourceUtilization(tasks);
    const overallocatedResources = resourceUtilization.filter(r => r.overallocation > 0);

    if (overallocatedResources.length > 0) {
      risks.push({
        id: 'resource-overallocation-risk',
        name: '资源过度分配风险',
        description: '部分资源分配超出可用容量',
        probability: 0.8,
        impact: 7,
        riskScore: 5.6,
        affectedTaskIds: tasks.map(t => t.id), // 简化处理
        category: RiskCategory.RESOURCE,
      });
    }

    return risks;
  }

  /**
   * 分析技术风险
   */
  private analyzeTechnicalRisks(tasks: Task[]): RiskFactor[] {
    const risks: RiskFactor[] = [];

    // 检查高复杂度任务
    const complexTasks = tasks.filter(task =>
      (task.orchestrationMetadata?.complexity || 0) > 7
    );

    if (complexTasks.length > 0) {
      risks.push({
        id: 'technical-complexity-risk',
        name: '技术复杂度风险',
        description: '存在高复杂度的技术任务',
        probability: 0.6,
        impact: 7,
        riskScore: 4.2,
        affectedTaskIds: complexTasks.map(t => t.id),
        category: RiskCategory.TECHNICAL,
      });
    }

    return risks;
  }

  /**
   * 分析质量风险
   */
  private analyzeQualityRisks(tasks: Task[]): RiskFactor[] {
    const risks: RiskFactor[] = [];

    // 检查缺少评审的任务
    const noReviewTasks = tasks.filter(task =>
      task.orchestrationMetadata?.requiresReview === false
    );

    if (noReviewTasks.length > tasks.length * 0.5) {
      risks.push({
        id: 'quality-review-risk',
        name: '质量评审风险',
        description: '过多任务缺少质量评审环节',
        probability: 0.4,
        impact: 6,
        riskScore: 2.4,
        affectedTaskIds: noReviewTasks.map(t => t.id),
        category: RiskCategory.QUALITY,
      });
    }

    return risks;
  }

  /**
   * 生成缓解建议
   */
  private generateMitigationSuggestions(riskFactors: RiskFactor[]): string[] {
    const suggestions: string[] = [];

    for (const risk of riskFactors) {
      switch (risk.category) {
        case RiskCategory.SCHEDULE:
          if (risk.id === 'critical-path-risk') {
            suggestions.push('考虑增加关键路径上的资源投入');
            suggestions.push('寻找可以并行化的关键任务');
            suggestions.push('评估是否可以缩短关键任务的持续时间');
          }
          if (risk.id === 'long-duration-risk') {
            suggestions.push('将长持续时间任务分解为更小的子任务');
            suggestions.push('增加里程碑检查点');
          }
          break;

        case RiskCategory.RESOURCE:
          if (risk.id === 'resource-overallocation-risk') {
            suggestions.push('重新平衡资源分配');
            suggestions.push('考虑增加额外资源或外包');
            suggestions.push('调整任务时间安排以避免资源冲突');
          }
          break;

        case RiskCategory.TECHNICAL:
          if (risk.id === 'technical-complexity-risk') {
            suggestions.push('为高复杂度任务分配经验丰富的团队成员');
            suggestions.push('增加技术评审和原型验证');
            suggestions.push('考虑技术培训或外部咨询');
          }
          break;

        case RiskCategory.QUALITY:
          if (risk.id === 'quality-review-risk') {
            suggestions.push('为关键任务增加质量评审环节');
            suggestions.push('建立代码审查和测试标准');
            suggestions.push('实施持续集成和自动化测试');
          }
          break;
      }
    }

    return suggestions;
  }

  /**
   * 生成应急计划
   */
  private generateContingencyPlans(riskFactors: RiskFactor[]): ContingencyPlan[] {
    const plans: ContingencyPlan[] = [];

    for (const risk of riskFactors) {
      if (risk.riskScore > 4.0) { // 高风险才生成应急计划
        plans.push({
          id: `contingency-${risk.id}`,
          name: `${risk.name}应急计划`,
          description: `针对${risk.name}的应急响应计划`,
          triggerConditions: [
            `${risk.name}发生概率超过阈值`,
            '项目进度出现明显延迟',
            '相关任务状态异常',
          ],
          actions: [
            '立即评估影响范围',
            '启动风险响应流程',
            '调整项目计划和资源分配',
            '通知相关利益相关者',
          ],
          estimatedCost: risk.impact * 1000, // 简化计算
          estimatedTime: risk.impact * 2,    // 简化计算
        });
      }
    }

    return plans;
  }

  /**
   * 生成优化建议
   */
  private generateRecommendations(
    tasks: Task[],
    criticalPath: string[],
    parallelGroups: string[][],
    resourceUtilization: ResourceUtilization[],
    riskAssessment: RiskAssessment
  ): string[] {
    const recommendations: string[] = [];

    // 关键路径建议
    if (criticalPath.length > 0) {
      recommendations.push(`项目关键路径包含 ${criticalPath.length} 个任务，建议重点关注这些任务的执行`);

      if (criticalPath.length > tasks.length * 0.4) {
        recommendations.push('关键路径任务比例较高，建议寻找优化机会以减少项目风险');
      }
    }

    // 并行化建议
    if (parallelGroups.length > 0) {
      const totalParallelTasks = parallelGroups.reduce((sum, group) => sum + group.length, 0);
      recommendations.push(`识别到 ${parallelGroups.length} 个并行任务组，共 ${totalParallelTasks} 个任务可并行执行`);
      recommendations.push('合理安排并行任务可以显著缩短项目周期');
    }

    // 资源利用率建议
    const overutilizedResources = resourceUtilization.filter(r => r.utilizationRate > 1.0);
    if (overutilizedResources.length > 0) {
      recommendations.push(`发现 ${overutilizedResources.length} 个资源过度分配，建议调整资源计划`);
    }

    const underutilizedResources = resourceUtilization.filter(r => r.utilizationRate < 0.5);
    if (underutilizedResources.length > 0) {
      recommendations.push(`发现 ${underutilizedResources.length} 个资源利用率较低，可考虑重新分配`);
    }

    // 风险建议
    if (riskAssessment.overallRiskLevel > 6.0) {
      recommendations.push('项目整体风险等级较高，建议制定详细的风险应对计划');
    }

    // 优化建议
    const longTasks = tasks.filter(task => this.getTaskDuration(task) > 40);
    if (longTasks.length > 0) {
      recommendations.push(`发现 ${longTasks.length} 个长持续时间任务，建议考虑任务分解`);
    }

    return recommendations;
  }

  /**
   * 计算项目总持续时间
   */
  private calculateTotalDuration(tasks: Task[]): number {
    let maxFinishTime = 0;

    for (const task of tasks) {
      const node = this.graph.get(task.id);
      if (node && node.outDegree === 0) { // 项目结束任务
        maxFinishTime = Math.max(maxFinishTime, node.earliestFinish);
      }
    }

    return maxFinishTime;
  }

  /**
   * 创建空的风险评估
   */
  private createEmptyRiskAssessment(): RiskAssessment {
    return {
      overallRiskLevel: 0,
      riskFactors: [],
      mitigationSuggestions: [],
      contingencyPlans: [],
    };
  }

  /**
   * 获取任务持续时间
   */
  private getTaskDuration(task: Task): number {
    return task.timeInfo?.estimatedDuration || task.estimatedHours || 8; // 默认8小时
  }

  /**
   * 查找依赖关系
   */
  private findDependency(predecessorId: string, successorId: string): TaskDependency | undefined {
    for (const dependency of this.dependencies.values()) {
      if (dependency.predecessorId === predecessorId && dependency.successorId === successorId) {
        return dependency;
      }
    }
    return undefined;
  }

  /**
   * 更新任务时间信息
   */
  public updateTaskTimeInfo(tasks: Task[]): Task[] {
    const updatedTasks = [...tasks];

    for (const task of updatedTasks) {
      const node = this.graph.get(task.id);
      if (node) {
        task.timeInfo = {
          estimatedDuration: this.getTaskDuration(task),
          earliestStart: new Date(Date.now() + node.earliestStart * 60 * 60 * 1000),
          latestStart: new Date(Date.now() + node.latestStart * 60 * 60 * 1000),
          earliestFinish: new Date(Date.now() + node.earliestFinish * 60 * 60 * 1000),
          latestFinish: new Date(Date.now() + node.latestFinish * 60 * 60 * 1000),
          totalFloat: node.totalFloat,
          freeFloat: node.freeFloat,
          isCritical: node.isCritical,
        };
      }
    }

    return updatedTasks;
  }

  /**
   * 获取编排统计信息
   */
  public getOrchestrationStats(): {
    totalTasks: number;
    criticalTasks: number;
    parallelGroups: number;
    averageFloat: number;
    longestPath: number;
  } {
    const totalTasks = this.tasks.size;
    const criticalTasks = Array.from(this.graph.values()).filter(node => node.isCritical).length;
    const parallelGroups = this.identifyParallelGroups().length;

    const totalFloat = Array.from(this.graph.values()).reduce((sum, node) => sum + node.totalFloat, 0);
    const averageFloat = totalTasks > 0 ? totalFloat / totalTasks : 0;

    const longestPath = Math.max(...Array.from(this.graph.values()).map(node => node.earliestFinish));

    return {
      totalTasks,
      criticalTasks,
      parallelGroups,
      averageFloat,
      longestPath,
    };
  }
}
    }
    
    // 拓扑排序并计算最早时间
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const currentNode = this.graph.get(currentId)!;
      
      for (const successorId of currentNode.successors) {
        const successorNode = this.graph.get(successorId)!;
        const dependency = this.findDependency(currentId, successorId);
        
        // 计算基于依赖类型的最早开始时间
        let earliestStart = 0;
        if (dependency) {
          switch (dependency.type) {
            case DependencyType.FINISH_TO_START:
              earliestStart = currentNode.earliestFinish + (dependency.lag || 0);
              break;
            case DependencyType.START_TO_START:
              earliestStart = currentNode.earliestStart + (dependency.lag || 0);
              break;
            case DependencyType.FINISH_TO_FINISH:
              earliestStart = currentNode.earliestFinish - this.getTaskDuration(successorNode.task) + (dependency.lag || 0);
              break;
            case DependencyType.START_TO_FINISH:
              earliestStart = currentNode.earliestStart - this.getTaskDuration(successorNode.task) + (dependency.lag || 0);
              break;
          }
        }
        
        successorNode.earliestStart = Math.max(successorNode.earliestStart, earliestStart);
        successorNode.earliestFinish = successorNode.earliestStart + this.getTaskDuration(successorNode.task);
        
        const newInDegree = inDegreeCount.get(successorId)! - 1;
        inDegreeCount.set(successorId, newInDegree);
        
        if (newInDegree === 0) {
          queue.push(successorId);
        }
      }
    }
  }
