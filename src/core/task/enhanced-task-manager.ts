/**
 * 增强的任务管理系统
 * 支持完整的任务生命周期管理、协作功能和通知机制
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { EventEmitter } from 'events';
import { Task, TaskPlan, TaskStatus, TaskPriority, TaskType } from '../../types/task';
import { Logger } from '../../infra/logger';
import { ConfigManager } from '../../infra/config';

/**
 * 任务事件类型
 */
export enum TaskEventType {
  TASK_CREATED = 'task_created',
  TASK_UPDATED = 'task_updated',
  TASK_DELETED = 'task_deleted',
  TASK_STATUS_CHANGED = 'task_status_changed',
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMPLETED = 'task_completed',
  TASK_BLOCKED = 'task_blocked',
  PLAN_UPDATED = 'plan_updated'
}

/**
 * 任务事件接口
 */
export interface TaskEvent {
  type: TaskEventType;
  taskId: string;
  userId?: string;
  timestamp: Date;
  data: any;
  metadata?: Record<string, any>;
}

/**
 * 任务过滤器
 */
export interface TaskFilter {
  status?: TaskStatus | TaskStatus[];
  type?: TaskType | TaskType[];
  priority?: TaskPriority | TaskPriority[];
  assignee?: string | string[];
  tags?: string | string[];
  createdAfter?: Date;
  createdBefore?: Date;
  dueAfter?: Date;
  dueBefore?: Date;
  hasNotes?: boolean;
  hasDependencies?: boolean;
}

/**
 * 任务排序选项
 */
export interface TaskSortOptions {
  field: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'estimatedHours' | 'progress';
  direction: 'asc' | 'desc';
}

/**
 * 任务统计信息
 */
export interface TaskStatistics {
  total: number;
  byStatus: Record<TaskStatus, number>;
  byType: Record<TaskType, number>;
  byPriority: Record<TaskPriority, number>;
  byAssignee: Record<string, number>;
  averageCompletionTime: number; // 小时
  totalEstimatedHours: number;
  totalActualHours: number;
  completionRate: number; // 百分比
  overdueCount: number;
  blockedCount: number;
}

/**
 * 任务依赖分析结果
 */
export interface DependencyAnalysis {
  circularDependencies: string[][];
  criticalPath: string[];
  bottlenecks: string[];
  parallelGroups: string[][];
  dependencyDepth: Record<string, number>;
}

/**
 * 增强的任务管理器类
 */
export class EnhancedTaskManager extends EventEmitter {
  private taskPlan: TaskPlan | null = null;
  private taskFilePath: string;
  private logger: Logger;
  private configManager: ConfigManager;
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private taskHistory: TaskEvent[] = [];
  private collaborators: Map<string, any> = new Map();

  constructor(logger: Logger, configManager: ConfigManager) {
    super();
    this.logger = logger;
    this.configManager = configManager;

    // 获取配置
    const config = this.configManager.get('taskManager', {
      outputDir: './taskflow',
      autoSave: true,
      saveInterval: 300000, // 5分钟
      maxHistorySize: 1000
    });

    this.taskFilePath = path.join(config.outputDir, 'tasks.json');

    // 启动自动保存
    if (config.autoSave) {
      this.startAutoSave(config.saveInterval);
    }
  }

  /**
   * 设置任务计划
   * @param taskPlan 任务计划
   */
  public setTaskPlan(taskPlan: TaskPlan): void {
    const oldPlan = this.taskPlan;
    this.taskPlan = taskPlan;

    this.emit(TaskEventType.PLAN_UPDATED, {
      type: TaskEventType.PLAN_UPDATED,
      taskId: '',
      timestamp: new Date(),
      data: { oldPlan, newPlan: taskPlan }
    });

    this.logger.info(`任务计划已设置: ${taskPlan.name}`);
  }

  /**
   * 获取任务计划
   */
  public getTaskPlan(): TaskPlan | null {
    return this.taskPlan;
  }

  /**
   * 创建新任务
   * @param taskData 任务数据
   * @param userId 用户ID
   */
  public createTask(taskData: Partial<Task>, userId?: string): Task {
    if (!this.taskPlan) {
      throw new Error('未设置任务计划');
    }

    const task: Task = {
      id: this.generateTaskId(),
      name: taskData.name || taskData.title || '新任务',
      title: taskData.title || taskData.name || '新任务',
      description: taskData.description || '',
      status: taskData.status || TaskStatus.NOT_STARTED,
      priority: taskData.priority || TaskPriority.MEDIUM,
      type: taskData.type || TaskType.FEATURE,
      dependencies: taskData.dependencies || [],
      estimatedHours: taskData.estimatedHours,
      actualHours: taskData.actualHours,
      createdAt: new Date(),
      updatedAt: new Date(),
      startedAt: taskData.startedAt,
      completedAt: taskData.completedAt,
      dueDate: taskData.dueDate,
      assignee: taskData.assignee,
      tags: taskData.tags || [],
      acceptance: taskData.acceptance,
      notes: taskData.notes,
      progress: taskData.progress || 0,
      metadata: taskData.metadata || {}
    };

    this.taskPlan.tasks.push(task);
    this.taskPlan.updatedAt = new Date();

    // 记录事件
    this.recordEvent({
      type: TaskEventType.TASK_CREATED,
      taskId: task.id,
      userId,
      timestamp: new Date(),
      data: task
    });

    this.logger.info(`任务已创建: ${task.title} (${task.id})`);
    return task;
  }

  /**
   * 更新任务
   * @param taskId 任务ID
   * @param updates 更新数据
   * @param userId 用户ID
   */
  public updateTask(taskId: string, updates: Partial<Task>, userId?: string): Task | null {
    if (!this.taskPlan) {
      throw new Error('未设置任务计划');
    }

    const task = this.taskPlan.tasks.find(t => t.id === taskId);
    if (!task) {
      this.logger.warn(`任务不存在: ${taskId}`);
      return null;
    }

    const oldTask = { ...task };

    // 更新任务属性
    Object.assign(task, updates, { updatedAt: new Date() });

    // 处理状态变更
    if (updates.status && updates.status !== oldTask.status) {
      this.handleStatusChange(task, oldTask.status, updates.status, userId);
    }

    // 处理分配变更
    if (updates.assignee && updates.assignee !== oldTask.assignee) {
      this.handleAssignmentChange(task, oldTask.assignee, updates.assignee, userId);
    }

    this.taskPlan.updatedAt = new Date();

    // 记录事件
    this.recordEvent({
      type: TaskEventType.TASK_UPDATED,
      taskId: task.id,
      userId,
      timestamp: new Date(),
      data: { oldTask, newTask: task, updates }
    });

    this.logger.info(`任务已更新: ${task.title} (${task.id})`);
    return task;
  }

  /**
   * 删除任务
   * @param taskId 任务ID
   * @param userId 用户ID
   */
  public deleteTask(taskId: string, userId?: string): boolean {
    if (!this.taskPlan) {
      throw new Error('未设置任务计划');
    }

    const taskIndex = this.taskPlan.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      this.logger.warn(`任务不存在: ${taskId}`);
      return false;
    }

    const task = this.taskPlan.tasks[taskIndex];

    // 检查依赖关系
    const dependentTasks = this.taskPlan.tasks.filter(t =>
      t.dependencies.includes(taskId)
    );

    if (dependentTasks.length > 0) {
      throw new Error(`无法删除任务 ${taskId}，存在依赖此任务的其他任务`);
    }

    // 删除任务
    this.taskPlan.tasks.splice(taskIndex, 1);
    this.taskPlan.updatedAt = new Date();

    // 记录事件
    this.recordEvent({
      type: TaskEventType.TASK_DELETED,
      taskId: task.id,
      userId,
      timestamp: new Date(),
      data: task
    });

    this.logger.info(`任务已删除: ${task.title} (${task.id})`);
    return true;
  }

  /**
   * 获取任务
   * @param taskId 任务ID
   */
  public getTask(taskId: string): Task | null {
    if (!this.taskPlan) {
      return null;
    }

    return this.taskPlan.tasks.find(t => t.id === taskId) || null;
  }

  /**
   * 获取所有任务
   */
  public getAllTasks(): Task[] {
    return this.taskPlan?.tasks || [];
  }

  /**
   * 过滤任务
   * @param filter 过滤条件
   * @param sort 排序选项
   */
  public filterTasks(filter: TaskFilter, sort?: TaskSortOptions): Task[] {
    if (!this.taskPlan) {
      return [];
    }

    const filteredTasks = this.taskPlan.tasks.filter(task => {
      // 状态过滤
      if (filter.status) {
        const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
        if (!statuses.includes(task.status)) return false;
      }

      // 类型过滤
      if (filter.type) {
        const types = Array.isArray(filter.type) ? filter.type : [filter.type];
        if (!types.includes(task.type)) return false;
      }

      // 优先级过滤
      if (filter.priority) {
        const priorities = Array.isArray(filter.priority) ? filter.priority : [filter.priority];
        if (!priorities.includes(task.priority)) return false;
      }

      // 负责人过滤
      if (filter.assignee) {
        const assignees = Array.isArray(filter.assignee) ? filter.assignee : [filter.assignee];
        if (!task.assignee || !assignees.includes(task.assignee)) return false;
      }

      // 标签过滤
      if (filter.tags) {
        const tags = Array.isArray(filter.tags) ? filter.tags : [filter.tags];
        if (!tags.some(tag => task.tags.includes(tag))) return false;
      }

      // 日期过滤
      if (filter.createdAfter && task.createdAt < filter.createdAfter) return false;
      if (filter.createdBefore && task.createdAt > filter.createdBefore) return false;
      if (filter.dueAfter && (!task.dueDate || task.dueDate < filter.dueAfter)) return false;
      if (filter.dueBefore && (!task.dueDate || task.dueDate > filter.dueBefore)) return false;

      // 其他条件
      if (filter.hasNotes !== undefined) {
        const hasNotes = !!(task.notes && task.notes.trim());
        if (filter.hasNotes !== hasNotes) return false;
      }

      if (filter.hasDependencies !== undefined) {
        const hasDeps = task.dependencies.length > 0;
        if (filter.hasDependencies !== hasDeps) return false;
      }

      return true;
    });

    // 排序
    if (sort) {
      filteredTasks.sort((a, b) => {
        let aValue: any = a[sort.field];
        let bValue: any = b[sort.field];

        // 处理日期类型
        if (aValue instanceof Date) aValue = aValue.getTime();
        if (bValue instanceof Date) bValue = bValue.getTime();

        // 处理优先级排序
        if (sort.field === 'priority') {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[aValue as TaskPriority] || 0;
          bValue = priorityOrder[bValue as TaskPriority] || 0;
        }

        if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filteredTasks;
  }

  /**
   * 获取推荐的下一个任务
   * @param assignee 负责人（可选）
   * @param maxCount 最大返回数量
   */
  public getNextTasks(assignee?: string, maxCount: number = 5): Task[] {
    if (!this.taskPlan) {
      return [];
    }

    // 获取可执行的任务（状态为未开始且依赖已完成）
    const availableTasks = this.taskPlan.tasks.filter(task => {
      // 状态检查
      if (task.status !== TaskStatus.NOT_STARTED) return false;

      // 负责人检查
      if (assignee && task.assignee && task.assignee !== assignee) return false;

      // 依赖检查
      const dependenciesMet = task.dependencies.every(depId => {
        const depTask = this.taskPlan!.tasks.find(t => t.id === depId);
        return depTask && depTask.status === TaskStatus.COMPLETED;
      });

      return dependenciesMet;
    });

    // 按优先级和创建时间排序
    availableTasks.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 0;
      const bPriority = priorityOrder[b.priority] || 0;

      if (aPriority !== bPriority) {
        return bPriority - aPriority; // 高优先级在前
      }

      return a.createdAt.getTime() - b.createdAt.getTime(); // 早创建的在前
    });

    return availableTasks.slice(0, maxCount);
  }

  /**
   * 获取任务统计信息
   */
  public getStatistics(): TaskStatistics {
    if (!this.taskPlan) {
      return this.getEmptyStatistics();
    }

    const tasks = this.taskPlan.tasks;
    const stats: TaskStatistics = {
      total: tasks.length,
      byStatus: {} as Record<TaskStatus, number>,
      byType: {} as Record<TaskType, number>,
      byPriority: {} as Record<TaskPriority, number>,
      byAssignee: {},
      averageCompletionTime: 0,
      totalEstimatedHours: 0,
      totalActualHours: 0,
      completionRate: 0,
      overdueCount: 0,
      blockedCount: 0
    };

    // 初始化计数器
    Object.values(TaskStatus).forEach(status => {
      stats.byStatus[status] = 0;
    });
    Object.values(TaskType).forEach(type => {
      stats.byType[type] = 0;
    });
    Object.values(TaskPriority).forEach(priority => {
      stats.byPriority[priority] = 0;
    });

    let completedTasks = 0;
    let totalCompletionTime = 0;
    const now = new Date();

    tasks.forEach(task => {
      // 状态统计
      stats.byStatus[task.status]++;

      // 类型统计
      stats.byType[task.type]++;

      // 优先级统计
      stats.byPriority[task.priority]++;

      // 负责人统计
      if (task.assignee) {
        stats.byAssignee[task.assignee] = (stats.byAssignee[task.assignee] || 0) + 1;
      }

      // 工作量统计
      if (task.estimatedHours) {
        stats.totalEstimatedHours += task.estimatedHours;
      }
      if (task.actualHours) {
        stats.totalActualHours += task.actualHours;
      }

      // 完成时间统计
      if (task.status === TaskStatus.COMPLETED && task.startedAt && task.completedAt) {
        completedTasks++;
        totalCompletionTime += task.completedAt.getTime() - task.startedAt.getTime();
      }

      // 逾期统计
      if (task.dueDate && task.dueDate < now && task.status !== TaskStatus.COMPLETED) {
        stats.overdueCount++;
      }

      // 阻塞统计
      if (task.status === TaskStatus.BLOCKED) {
        stats.blockedCount++;
      }
    });

    // 计算平均完成时间（小时）
    if (completedTasks > 0) {
      stats.averageCompletionTime = totalCompletionTime / completedTasks / (1000 * 60 * 60);
    }

    // 计算完成率
    if (tasks.length > 0) {
      stats.completionRate = (stats.byStatus[TaskStatus.COMPLETED] / tasks.length) * 100;
    }

    return stats;
  }

  /**
   * 分析任务依赖关系
   */
  public analyzeDependencies(): DependencyAnalysis {
    if (!this.taskPlan) {
      return {
        circularDependencies: [],
        criticalPath: [],
        bottlenecks: [],
        parallelGroups: [],
        dependencyDepth: {}
      };
    }

    const tasks = this.taskPlan.tasks;
    // const taskMap = new Map(tasks.map(t => [t.id, t])); // 暂时未使用

    // 检测循环依赖
    const circularDependencies = this.detectCircularDependencies(tasks);

    // 计算关键路径
    const criticalPath = this.calculateCriticalPath(tasks);

    // 识别瓶颈任务
    const bottlenecks = this.identifyBottlenecks(tasks);

    // 识别并行任务组
    const parallelGroups = this.identifyParallelGroups(tasks);

    // 计算依赖深度
    const dependencyDepth = this.calculateDependencyDepth(tasks);

    return {
      circularDependencies,
      criticalPath,
      bottlenecks,
      parallelGroups,
      dependencyDepth
    };
  }

  /**
   * 处理状态变更
   * @param task 任务
   * @param oldStatus 旧状态
   * @param newStatus 新状态
   * @param userId 用户ID
   */
  private handleStatusChange(task: Task, oldStatus: TaskStatus, newStatus: TaskStatus, userId?: string): void {
    // 更新时间戳
    if (newStatus === TaskStatus.IN_PROGRESS && !task.startedAt) {
      task.startedAt = new Date();
    }

    if (newStatus === TaskStatus.COMPLETED && !task.completedAt) {
      task.completedAt = new Date();
      task.progress = 100;
    }

    // 发送事件
    this.recordEvent({
      type: TaskEventType.TASK_STATUS_CHANGED,
      taskId: task.id,
      userId,
      timestamp: new Date(),
      data: { oldStatus, newStatus, task }
    });

    if (newStatus === TaskStatus.COMPLETED) {
      this.recordEvent({
        type: TaskEventType.TASK_COMPLETED,
        taskId: task.id,
        userId,
        timestamp: new Date(),
        data: task
      });
    }

    if (newStatus === TaskStatus.BLOCKED) {
      this.recordEvent({
        type: TaskEventType.TASK_BLOCKED,
        taskId: task.id,
        userId,
        timestamp: new Date(),
        data: task
      });
    }
  }

  /**
   * 处理分配变更
   * @param task 任务
   * @param oldAssignee 旧负责人
   * @param newAssignee 新负责人
   * @param userId 用户ID
   */
  private handleAssignmentChange(task: Task, oldAssignee: string | undefined, newAssignee: string, userId?: string): void {
    this.recordEvent({
      type: TaskEventType.TASK_ASSIGNED,
      taskId: task.id,
      userId,
      timestamp: new Date(),
      data: { oldAssignee, newAssignee, task }
    });
  }

  /**
   * 记录事件
   * @param event 事件
   */
  private recordEvent(event: TaskEvent): void {
    this.taskHistory.push(event);

    // 限制历史记录大小
    const maxHistorySize = this.configManager.get('taskManager.maxHistorySize', 1000);
    if (this.taskHistory.length > maxHistorySize) {
      this.taskHistory = this.taskHistory.slice(-maxHistorySize);
    }

    // 发送事件
    this.emit(event.type, event);
  }

  /**
   * 生成任务ID
   */
  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 启动自动保存
   * @param interval 保存间隔（毫秒）
   */
  private startAutoSave(interval: number): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = setInterval(async () => {
      try {
        await this.saveTaskPlan();
      } catch (error) {
        this.logger.error(`自动保存失败: ${(error as Error).message}`);
      }
    }, interval);
  }

  /**
   * 保存任务计划
   * @param filePath 文件路径（可选）
   */
  public async saveTaskPlan(filePath?: string): Promise<void> {
    if (!this.taskPlan) {
      throw new Error('没有任务计划可保存');
    }

    const targetPath = filePath || this.taskFilePath;
    await fs.ensureDir(path.dirname(targetPath));

    const data = {
      taskPlan: this.taskPlan,
      history: this.taskHistory.slice(-100), // 只保存最近100条历史记录
      savedAt: new Date()
    };

    await fs.writeFile(targetPath, JSON.stringify(data, null, 2), 'utf-8');
    this.logger.info(`任务计划已保存到: ${targetPath}`);
  }

  /**
   * 加载任务计划
   * @param filePath 文件路径（可选）
   */
  public async loadTaskPlan(filePath?: string): Promise<TaskPlan> {
    const targetPath = filePath || this.taskFilePath;

    if (!await fs.pathExists(targetPath)) {
      throw new Error(`任务计划文件不存在: ${targetPath}`);
    }

    const data = await fs.readJson(targetPath);

    if (data.taskPlan) {
      this.taskPlan = data.taskPlan;

      // 恢复历史记录
      if (data.history) {
        this.taskHistory = data.history;
      }

      this.logger.info(`任务计划已加载: ${this.taskPlan?.name || '未命名'}`);
      return this.taskPlan!;
    }

    throw new Error('无效的任务计划文件格式');
  }

  /**
   * 获取空统计信息
   */
  private getEmptyStatistics(): TaskStatistics {
    return {
      total: 0,
      byStatus: {} as Record<TaskStatus, number>,
      byType: {} as Record<TaskType, number>,
      byPriority: {} as Record<TaskPriority, number>,
      byAssignee: {},
      averageCompletionTime: 0,
      totalEstimatedHours: 0,
      totalActualHours: 0,
      completionRate: 0,
      overdueCount: 0,
      blockedCount: 0
    };
  }

  /**
   * 检测循环依赖
   * @param tasks 任务列表
   */
  private detectCircularDependencies(_tasks: Task[]): string[][] {
    // 简化实现，实际应该使用图算法
    return [];
  }

  /**
   * 计算关键路径
   * @param tasks 任务列表
   */
  private calculateCriticalPath(_tasks: Task[]): string[] {
    // 简化实现，实际应该使用关键路径方法
    return [];
  }

  /**
   * 识别瓶颈任务
   * @param tasks 任务列表
   */
  private identifyBottlenecks(tasks: Task[]): string[] {
    // 简化实现，识别被多个任务依赖的任务
    const dependencyCount = new Map<string, number>();

    tasks.forEach(task => {
      task.dependencies.forEach(depId => {
        dependencyCount.set(depId, (dependencyCount.get(depId) || 0) + 1);
      });
    });

    return Array.from(dependencyCount.entries())
      .filter(([_, count]) => count >= 3)
      .map(([taskId]) => taskId);
  }

  /**
   * 识别并行任务组
   * @param tasks 任务列表
   */
  private identifyParallelGroups(_tasks: Task[]): string[][] {
    // 简化实现
    return [];
  }

  /**
   * 计算依赖深度
   * @param tasks 任务列表
   */
  private calculateDependencyDepth(tasks: Task[]): Record<string, number> {
    const depth: Record<string, number> = {};
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    const calculateDepth = (taskId: string, visited = new Set<string>()): number => {
      if (visited.has(taskId)) return 0; // 避免循环
      if (depth[taskId] !== undefined) return depth[taskId];

      visited.add(taskId);
      const task = taskMap.get(taskId);

      if (!task || task.dependencies.length === 0) {
        depth[taskId] = 1;
      } else {
        const maxDepth = Math.max(
          ...task.dependencies.map(depId => calculateDepth(depId, new Set(visited)))
        );
        depth[taskId] = maxDepth + 1;
      }

      visited.delete(taskId);
      return depth[taskId];
    };

    tasks.forEach(task => {
      calculateDepth(task.id);
    });

    return depth;
  }

  /**
   * 销毁管理器
   */
  public destroy(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }

    this.removeAllListeners();
    this.logger.info('任务管理器已销毁');
  }
}
