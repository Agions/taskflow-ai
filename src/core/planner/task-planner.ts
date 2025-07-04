/* eslint-disable @typescript-eslint/no-unused-vars */
import * as fs from 'fs-extra';
import * as path from 'path';
import { ModelCoordinator } from '../models/coordinator';
import { PRDParseResult } from '../parser/prd-parser';
import { PlanningOptions } from '../../types/model';
import { Logger } from '../../infra/logger';
import { Task, TaskPlan, TaskStatus, TaskPriority, TaskType, ParsedPRD } from '../../types/task';



/**
 * 任务规划器类
 * 负责根据PRD生成任务计划
 */
export class TaskPlanner {
  private modelCoordinator: ModelCoordinator;
  private logger: Logger;

  /**
   * 创建任务规划器实例
   * @param modelCoordinator 模型协调器实例
   * @param logger 日志记录器
   */
  constructor(modelCoordinator: ModelCoordinator, logger: Logger) {
    this.modelCoordinator = modelCoordinator;
    this.logger = logger;
  }

  /**
   * 根据PRD解析结果生成任务计划
   * @param prdResult PRD解析结果
   * @param options 规划选项
   */
  public async generateTaskPlan(prdResult: ParsedPRD | PRDParseResult, options?: PlanningOptions): Promise<TaskPlan> {
    try {
      this.logger.info('开始生成任务计划');

      // 使用模型生成任务计划
      const response = await this.modelCoordinator.planTasks(prdResult, options);

      try {
        // 解析模型返回的任务计划
        const taskPlan = JSON.parse(response.content) as TaskPlan;
        this.validateTaskPlan(taskPlan);

        // 后处理任务计划
        this.postProcessTaskPlan(taskPlan);

        this.logger.info(`任务计划生成成功，共 ${taskPlan.tasks.length} 个任务`);
        return taskPlan;
      } catch (error) {
        this.logger.error(`解析模型返回的任务计划失败：${(error as Error).message}`);
        throw new Error(`无法解析模型返回的JSON结果：${(error as Error).message}`);
      }
    } catch (error) {
      this.logger.error(`生成任务计划失败：${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * 优化任务计划
   * @param taskPlan 原始任务计划
   * @param options 优化选项
   */
  public async optimizeTaskPlan(taskPlan: TaskPlan, options?: PlanningOptions): Promise<TaskPlan> {
    try {
      this.logger.info('开始优化任务计划');

      // 1. 依赖关系优化
      this.optimizeDependencies(taskPlan);

      // 2. 优先级优化
      this.optimizePriorities(taskPlan, options);

      // 3. 并行任务识别
      this.identifyParallelTasks(taskPlan, options);

      // 4. 工作量平衡
      this.balanceWorkload(taskPlan, options);

      this.logger.info('任务计划优化完成');
      return taskPlan;

    } catch (error) {
      this.logger.error(`优化任务计划失败：${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * 将任务计划保存到文件
   * @param taskPlan 任务计划
   * @param outputPath 输出路径
   */
  public async saveTaskPlan(taskPlan: TaskPlan, outputPath: string): Promise<void> {
    try {
      // 确保目录存在
      await fs.ensureDir(path.dirname(outputPath));

      // 写入文件
      await fs.writeFile(outputPath, JSON.stringify(taskPlan, null, 2), 'utf-8');

      this.logger.info(`任务计划已保存至 ${outputPath}`);
    } catch (error) {
      this.logger.error(`保存任务计划失败：${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * 验证任务计划是否符合预期格式
   * @param taskPlan 任务计划
   */
  private validateTaskPlan(taskPlan: TaskPlan): void {
    // 验证基本结构
    if (!taskPlan.name) {
      this.logger.warn('任务计划缺少名称');
    }

    if (!taskPlan.description) {
      this.logger.warn('任务计划缺少描述');
    }

    if (!Array.isArray(taskPlan.tasks)) {
      throw new Error('任务计划必须包含tasks数组');
    }

    // 验证每个任务的结构
    taskPlan.tasks.forEach((task, index) => {
      if (!task.id) {
        throw new Error(`第${index + 1}个任务缺少ID`);
      }

      if (!task.title) {
        this.logger.warn(`任务 ${task.id} 缺少标题`);
      }

      if (!task.priority) {
        this.logger.warn(`任务 ${task.id} 缺少优先级，设置为默认值'medium'`);
        task.priority = TaskPriority.MEDIUM;
      }

      if (!task.type) {
        this.logger.warn(`任务 ${task.id} 缺少类型，设置为默认值'feature'`);
        task.type = TaskType.FEATURE;
      }

      if (!Array.isArray(task.dependencies)) {
        this.logger.warn(`任务 ${task.id} 的dependencies字段不是数组，设置为空数组`);
        task.dependencies = [];
      }

      // 设置默认状态
      if (!task.status) {
        task.status = TaskStatus.NOT_STARTED;
      }
    });
  }

  /**
   * 后处理任务计划，添加一些自动生成的信息
   * @param taskPlan 任务计划
   */
  private postProcessTaskPlan(taskPlan: TaskPlan): void {
    // 检查任务ID的唯一性
    const taskIds = new Set<string>();

    taskPlan.tasks.forEach(task => {
      if (taskIds.has(task.id)) {
        // 如果ID重复，生成新的ID
        const newId = this.generateUniqueId(task.id, taskIds);
        this.logger.warn(`发现重复的任务ID: ${task.id}，自动更新为: ${newId}`);
        task.id = newId;
      }
      taskIds.add(task.id);

      // 验证依赖是否存在
      task.dependencies = task.dependencies.filter(depId => {
        if (!taskIds.has(depId) && depId !== task.id) {
          this.logger.warn(`任务 ${task.id} 依赖的任务 ${depId} 不存在，已移除此依赖`);
          return false;
        }

        if (depId === task.id) {
          this.logger.warn(`任务 ${task.id} 不能依赖自身，已移除此依赖`);
          return false;
        }

        return true;
      });

      // Note: Subtasks are not part of the Task interface in this implementation
    });

    // 检测依赖环
    this.checkCircularDependencies(taskPlan);
  }

  /**
   * 生成唯一ID
   * @param baseId 基础ID
   * @param existingIds 已存在的ID集合
   */
  private generateUniqueId(baseId: string, existingIds: Set<string>): string {
    let counter = 1;
    let newId = `${baseId}_${counter}`;

    while (existingIds.has(newId)) {
      counter++;
      newId = `${baseId}_${counter}`;
    }

    return newId;
  }

  /**
   * 检测任务依赖是否存在循环依赖
   * @param taskPlan 任务计划
   */
  private checkCircularDependencies(taskPlan: TaskPlan): void {
    const graph: Map<string, string[]> = new Map();

    // 构建依赖图
    taskPlan.tasks.forEach(task => {
      graph.set(task.id, [...task.dependencies]);
    });

    const visited = new Set<string>();
    const recStack = new Set<string>();

    // 对每个任务进行DFS检测
    taskPlan.tasks.forEach(task => {
      this.detectCycle(task.id, graph, visited, recStack);
    });
  }

  /**
   * 使用DFS检测有向图中的环
   * @param node 当前节点
   * @param graph 依赖图
   * @param visited 已访问节点集合
   * @param recStack 递归栈
   */
  private detectCycle(node: string, graph: Map<string, string[]>, visited: Set<string>, recStack: Set<string>): boolean {
    if (recStack.has(node)) {
      // 检测到环，记录并移除造成环的依赖
      this.logger.warn(`检测到循环依赖，包含任务: ${node}`);
      return true;
    }

    if (visited.has(node)) {
      return false;
    }

    visited.add(node);
    recStack.add(node);

    const neighbors = graph.get(node) || [];

    for (const neighbor of neighbors) {
      if (this.detectCycle(neighbor, graph, visited, recStack)) {
        // 发现循环依赖，从图中移除这条边
        const deps = graph.get(node) || [];
        graph.set(node, deps.filter(d => d !== neighbor));
        this.logger.warn(`移除循环依赖: ${node} -> ${neighbor}`);
      }
    }

    recStack.delete(node);
    return false;
  }

  /**
   * 优化任务依赖关系
   * @param taskPlan 任务计划
   */
  private optimizeDependencies(taskPlan: TaskPlan): void {
    this.logger.info('优化任务依赖关系');

    // 移除冗余依赖
    taskPlan.tasks.forEach(task => {
      const optimizedDeps = this.removeRedundantDependencies(task.dependencies, taskPlan);
      task.dependencies = optimizedDeps;
    });

    // 重新检测循环依赖
    this.checkCircularDependencies(taskPlan);
  }

  /**
   * 移除冗余依赖（传递依赖）
   * @param dependencies 依赖列表
   * @param taskPlan 任务计划
   */
  private removeRedundantDependencies(dependencies: string[], taskPlan: TaskPlan): string[] {
    if (dependencies.length <= 1) {
      return dependencies;
    }

    const taskMap = new Map<string, Task>();
    taskPlan.tasks.forEach(task => taskMap.set(task.id, task));

    const result: string[] = [];

    for (const depId of dependencies) {
      const depTask = taskMap.get(depId);
      if (!depTask) continue;

      // 检查是否存在传递依赖
      let isRedundant = false;
      for (const otherId of dependencies) {
        if (otherId === depId) continue;

        if (this.hasTransitiveDependency(otherId, depId, taskMap)) {
          isRedundant = true;
          break;
        }
      }

      if (!isRedundant) {
        result.push(depId);
      }
    }

    return result;
  }

  /**
   * 检查是否存在传递依赖
   * @param fromId 起始任务ID
   * @param toId 目标任务ID
   * @param taskMap 任务映射
   */
  private hasTransitiveDependency(fromId: string, toId: string, taskMap: Map<string, Task>): boolean {
    const visited = new Set<string>();
    const queue = [fromId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const currentTask = taskMap.get(currentId);
      if (!currentTask) continue;

      for (const depId of currentTask.dependencies) {
        if (depId === toId) {
          return true;
        }
        if (!visited.has(depId)) {
          queue.push(depId);
        }
      }
    }

    return false;
  }

  /**
   * 优化任务优先级
   * @param taskPlan 任务计划
   * @param options 优化选项
   */
  private optimizePriorities(taskPlan: TaskPlan, _options?: PlanningOptions): void {
    this.logger.info('优化任务优先级');

    // 基于依赖关系调整优先级
    taskPlan.tasks.forEach(task => {
      // 如果任务有很多依赖者，提高其优先级
      const dependents = this.findDependentTasks(task.id, taskPlan);
      if (dependents.length >= 3) {
        task.priority = TaskPriority.HIGH;
      } else if (dependents.length >= 2) {
        task.priority = TaskPriority.MEDIUM;
      }

      // 关键路径上的任务提高优先级
      if (this.isOnCriticalPath(task.id, taskPlan)) {
        task.priority = TaskPriority.CRITICAL;
      }
    });
  }

  /**
   * 查找依赖某个任务的所有任务
   * @param taskId 任务ID
   * @param taskPlan 任务计划
   */
  private findDependentTasks(taskId: string, taskPlan: TaskPlan): Task[] {
    return taskPlan.tasks.filter(task =>
      task.dependencies.includes(taskId)
    );
  }

  /**
   * 检查任务是否在关键路径上
   * @param taskId 任务ID
   * @param taskPlan 任务计划
   */
  private isOnCriticalPath(taskId: string, taskPlan: TaskPlan): boolean {
    // 简化的关键路径检测：检查任务是否有长依赖链
    const task = taskPlan.tasks.find(t => t.id === taskId);
    if (!task) return false;

    const maxDepth = this.calculateDependencyDepth(taskId, taskPlan);
    const avgDepth = this.calculateAverageDependencyDepth(taskPlan);

    return maxDepth > avgDepth * 1.5;
  }

  /**
   * 计算任务的依赖深度
   * @param taskId 任务ID
   * @param taskPlan 任务计划
   */
  private calculateDependencyDepth(taskId: string, taskPlan: TaskPlan): number {
    const visited = new Set<string>();

    const dfs = (id: string): number => {
      if (visited.has(id)) return 0;
      visited.add(id);

      const task = taskPlan.tasks.find(t => t.id === id);
      if (!task || task.dependencies.length === 0) {
        return 1;
      }

      let maxDepth = 0;
      for (const depId of task.dependencies) {
        maxDepth = Math.max(maxDepth, dfs(depId));
      }

      return maxDepth + 1;
    };

    return dfs(taskId);
  }

  /**
   * 计算平均依赖深度
   * @param taskPlan 任务计划
   */
  private calculateAverageDependencyDepth(taskPlan: TaskPlan): number {
    const depths = taskPlan.tasks.map(task =>
      this.calculateDependencyDepth(task.id, taskPlan)
    );

    return depths.reduce((sum, depth) => sum + depth, 0) / depths.length;
  }

  /**
   * 识别可并行执行的任务
   * @param taskPlan 任务计划
   * @param options 优化选项
   */
  private identifyParallelTasks(taskPlan: TaskPlan, _options?: PlanningOptions): void {
    this.logger.info('识别并行任务');

    const maxParallel = 3; // Default maximum parallel tasks

    // 为可并行的任务添加标签
    const parallelGroups = this.findParallelGroups(taskPlan, maxParallel);

    parallelGroups.forEach((group, index) => {
      group.forEach(task => {
        if (!task.tags) task.tags = [];
        task.tags.push(`parallel-group-${index + 1}`);
      });
    });
  }

  /**
   * 查找可并行执行的任务组
   * @param taskPlan 任务计划
   * @param maxGroupSize 最大组大小
   */
  private findParallelGroups(taskPlan: TaskPlan, maxGroupSize: number): Task[][] {
    const groups: Task[][] = [];
    const processed = new Set<string>();

    taskPlan.tasks.forEach(task => {
      if (processed.has(task.id)) return;

      const parallelTasks = this.findParallelTasks(task, taskPlan, processed);
      if (parallelTasks.length > 1 && parallelTasks.length <= maxGroupSize) {
        groups.push(parallelTasks);
        parallelTasks.forEach(t => processed.add(t.id));
      }
    });

    return groups;
  }

  /**
   * 查找与指定任务可并行执行的任务
   * @param task 基准任务
   * @param taskPlan 任务计划
   * @param processed 已处理的任务
   */
  private findParallelTasks(task: Task, taskPlan: TaskPlan, processed: Set<string>): Task[] {
    const parallel = [task];

    taskPlan.tasks.forEach(otherTask => {
      if (otherTask.id === task.id || processed.has(otherTask.id)) return;

      // 检查是否可以并行执行
      if (this.canRunInParallel(task, otherTask, taskPlan)) {
        parallel.push(otherTask);
      }
    });

    return parallel;
  }

  /**
   * 检查两个任务是否可以并行执行
   * @param task1 任务1
   * @param task2 任务2
   * @param taskPlan 任务计划
   */
  private canRunInParallel(task1: Task, task2: Task, taskPlan: TaskPlan): boolean {
    // 检查直接依赖关系
    if (task1.dependencies.includes(task2.id) || task2.dependencies.includes(task1.id)) {
      return false;
    }

    // 检查间接依赖关系
    if (this.hasIndirectDependency(task1.id, task2.id, taskPlan) ||
      this.hasIndirectDependency(task2.id, task1.id, taskPlan)) {
      return false;
    }

    // 检查资源冲突（简化版本：同类型任务可能冲突）
    if (task1.type === task2.type &&
      (task1.type === TaskType.DEPLOYMENT || task1.type === TaskType.TEST)) {
      return false;
    }

    return true;
  }

  /**
   * 检查是否存在间接依赖关系
   * @param fromId 起始任务ID
   * @param toId 目标任务ID
   * @param taskPlan 任务计划
   */
  private hasIndirectDependency(fromId: string, toId: string, taskPlan: TaskPlan): boolean {
    const taskMap = new Map<string, Task>();
    taskPlan.tasks.forEach(task => taskMap.set(task.id, task));

    return this.hasTransitiveDependency(fromId, toId, taskMap);
  }

  /**
   * 平衡工作量
   * @param taskPlan 任务计划
   * @param options 优化选项
   */
  private balanceWorkload(taskPlan: TaskPlan, options?: PlanningOptions): void {
    this.logger.info('平衡工作量');

    const teamSize = options?.considerTeamSize || 3;

    // 计算总工作量
    const totalHours = taskPlan.tasks.reduce((sum, task) =>
      sum + (task.estimatedHours || 8), 0
    );

    const avgHoursPerPerson = totalHours / teamSize;

    // 标记工作量过大的任务，建议拆分
    taskPlan.tasks.forEach(task => {
      const estimatedHours = task.estimatedHours || 8;

      if (estimatedHours > avgHoursPerPerson * 0.5) {
        if (!task.tags) task.tags = [];
        task.tags.push('consider-splitting');

        if (!task.notes) {
          task.notes = '';
        }
        task.notes += `\n建议拆分：预计工作量 ${estimatedHours} 小时，超过平均值的50%`;
      }
    });
  }
}