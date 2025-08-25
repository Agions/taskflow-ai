/**
 * TaskFlow AI 统一任务管理器
 * 简化任务创建、执行、跟踪和完成的生命周期管理
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { ConfigManager } from '../../infrastructure/config/manager';
import { CacheManager } from '../../infrastructure/storage/cache';

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  
  // 时间相关
  createdAt: Date;
  updatedAt: Date;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  deadline?: Date;
  
  // 进度和估算
  progress: number; // 0-100
  estimatedHours: number;
  actualHours: number;
  
  // 关系
  parentId?: string;
  dependencies: string[];
  subtasks: string[];
  
  // 执行相关
  assignedTo?: string;
  requirements: string[];
  acceptanceCriteria: string[];
  
  // 结果和反馈
  result?: TaskResult;
  feedback?: string;
  errorMessage?: string;
  
  // 元数据
  metadata: Record<string, any>;
}

export interface TaskResult {
  success: boolean;
  output?: any;
  artifacts: string[];
  metrics: TaskMetrics;
  logs: string[];
}

export interface TaskMetrics {
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  apiCalls: number;
  cost: number;
}

export enum TaskType {
  ANALYSIS = 'analysis',
  PARSING = 'parsing',
  GENERATION = 'generation',
  REVIEW = 'review',
  TESTING = 'testing',
  DEPLOYMENT = 'deployment',
  OPTIMIZATION = 'optimization',
  MAINTENANCE = 'maintenance'
}

export enum TaskStatus {
  DRAFT = 'draft',
  PLANNED = 'planned',
  READY = 'ready',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  BLOCKED = 'blocked'
}

export enum TaskPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export interface TaskFilter {
  status?: TaskStatus[];
  type?: TaskType[];
  priority?: TaskPriority[];
  tags?: string[];
  assignedTo?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface TaskTemplate {
  name: string;
  type: TaskType;
  title: string;
  description: string;
  estimatedHours: number;
  requirements: string[];
  acceptanceCriteria: string[];
  tags: string[];
}

/**
 * 统一任务管理器
 * 提供任务的完整生命周期管理
 */
export class TaskManager extends EventEmitter {
  private tasks = new Map<string, Task>();
  private templates = new Map<string, TaskTemplate>();
  private configManager: ConfigManager;
  private cacheManager: CacheManager;
  private initialized = false;

  constructor(configManager: ConfigManager, cacheManager: CacheManager) {
    super();
    this.configManager = configManager;
    this.cacheManager = cacheManager;
  }

  /**
   * 初始化任务管理器
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 加载保存的任务
      await this.loadTasks();
      
      // 加载任务模板
      await this.loadTemplates();
      
      // 启动定期保存
      this.startPeriodicSave();
      
      this.initialized = true;
      console.log('📋 任务管理器初始化成功');

    } catch (error) {
      console.error('❌ 任务管理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 创建新任务
   */
  async createTask(taskData: Partial<Task>): Promise<Task> {
    this.ensureInitialized();

    const task: Task = {
      id: uuidv4(),
      title: taskData.title || '新任务',
      description: taskData.description || '',
      type: taskData.type || TaskType.ANALYSIS,
      status: TaskStatus.DRAFT,
      priority: taskData.priority || TaskPriority.MEDIUM,
      tags: taskData.tags || [],
      
      createdAt: new Date(),
      updatedAt: new Date(),
      scheduledAt: taskData.scheduledAt,
      deadline: taskData.deadline,
      
      progress: 0,
      estimatedHours: taskData.estimatedHours || 1,
      actualHours: 0,
      
      parentId: taskData.parentId,
      dependencies: taskData.dependencies || [],
      subtasks: [],
      
      assignedTo: taskData.assignedTo,
      requirements: taskData.requirements || [],
      acceptanceCriteria: taskData.acceptanceCriteria || [],
      
      metadata: taskData.metadata || {},
    };

    this.tasks.set(task.id, task);
    
    // 更新父任务的子任务列表
    if (task.parentId) {
      const parent = this.tasks.get(task.parentId);
      if (parent) {
        parent.subtasks.push(task.id);
        parent.updatedAt = new Date();
      }
    }

    this.emit('taskCreated', task);
    console.log(`✅ 任务已创建: ${task.title} (${task.id})`);
    
    return task;
  }

  /**
   * 从模板创建任务
   */
  async createFromTemplate(templateName: string, overrides?: Partial<Task>): Promise<Task> {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`任务模板不存在: ${templateName}`);
    }

    const taskData: Partial<Task> = {
      title: template.title,
      description: template.description,
      type: template.type,
      estimatedHours: template.estimatedHours,
      requirements: [...template.requirements],
      acceptanceCriteria: [...template.acceptanceCriteria],
      tags: [...template.tags],
      ...overrides,
    };

    return await this.createTask(taskData);
  }

  /**
   * 更新任务
   */
  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    this.ensureInitialized();

    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`任务不存在: ${taskId}`);
    }

    const oldStatus = task.status;
    
    // 应用更新
    Object.assign(task, updates, { 
      updatedAt: new Date(),
      id: taskId, // 确保ID不被修改
    });

    // 状态变更处理
    if (updates.status && updates.status !== oldStatus) {
      await this.handleStatusChange(task, oldStatus, updates.status);
    }

    // 进度更新处理
    if (updates.progress !== undefined) {
      await this.handleProgressUpdate(task);
    }

    this.emit('taskUpdated', task, oldStatus);
    console.log(`🔄 任务已更新: ${task.title} (${task.status})`);
    
    return task;
  }

  /**
   * 开始执行任务
   */
  async startTask(taskId: string): Promise<Task> {
    const task = await this.updateTask(taskId, {
      status: TaskStatus.IN_PROGRESS,
      startedAt: new Date(),
    });

    this.emit('taskStarted', task);
    return task;
  }

  /**
   * 完成任务
   */
  async completeTask(taskId: string, result?: TaskResult): Promise<Task> {
    const task = await this.updateTask(taskId, {
      status: TaskStatus.COMPLETED,
      completedAt: new Date(),
      progress: 100,
      result,
    });

    this.emit('taskCompleted', task);
    return task;
  }

  /**
   * 失败任务
   */
  async failTask(taskId: string, errorMessage: string): Promise<Task> {
    const task = await this.updateTask(taskId, {
      status: TaskStatus.FAILED,
      errorMessage,
      completedAt: new Date(),
    });

    this.emit('taskFailed', task);
    return task;
  }

  /**
   * 暂停任务
   */
  async pauseTask(taskId: string): Promise<Task> {
    const task = await this.updateTask(taskId, {
      status: TaskStatus.PAUSED,
    });

    this.emit('taskPaused', task);
    return task;
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: string, reason?: string): Promise<Task> {
    const task = await this.updateTask(taskId, {
      status: TaskStatus.CANCELLED,
      errorMessage: reason,
      completedAt: new Date(),
    });

    this.emit('taskCancelled', task);
    return task;
  }

  /**
   * 删除任务
   */
  async deleteTask(taskId: string): Promise<void> {
    this.ensureInitialized();

    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`任务不存在: ${taskId}`);
    }

    // 删除子任务
    for (const subtaskId of task.subtasks) {
      await this.deleteTask(subtaskId);
    }

    // 从父任务中移除
    if (task.parentId) {
      const parent = this.tasks.get(task.parentId);
      if (parent) {
        parent.subtasks = parent.subtasks.filter(id => id !== taskId);
        parent.updatedAt = new Date();
      }
    }

    // 移除依赖关系
    for (const otherTask of this.tasks.values()) {
      if (otherTask.dependencies.includes(taskId)) {
        otherTask.dependencies = otherTask.dependencies.filter(id => id !== taskId);
        otherTask.updatedAt = new Date();
      }
    }

    this.tasks.delete(taskId);
    this.emit('taskDeleted', taskId);
    console.log(`🗑️ 任务已删除: ${task.title} (${taskId})`);
  }

  /**
   * 获取任务
   */
  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * 查询任务
   */
  queryTasks(filter?: TaskFilter): Task[] {
    let tasks = Array.from(this.tasks.values());

    if (!filter) {
      return tasks;
    }

    // 状态过滤
    if (filter.status && filter.status.length > 0) {
      tasks = tasks.filter(task => filter.status!.includes(task.status));
    }

    // 类型过滤
    if (filter.type && filter.type.length > 0) {
      tasks = tasks.filter(task => filter.type!.includes(task.type));
    }

    // 优先级过滤
    if (filter.priority && filter.priority.length > 0) {
      tasks = tasks.filter(task => filter.priority!.includes(task.priority));
    }

    // 标签过滤
    if (filter.tags && filter.tags.length > 0) {
      tasks = tasks.filter(task => 
        filter.tags!.some(tag => task.tags.includes(tag))
      );
    }

    // 分配人过滤
    if (filter.assignedTo) {
      tasks = tasks.filter(task => task.assignedTo === filter.assignedTo);
    }

    // 日期范围过滤
    if (filter.dateRange) {
      tasks = tasks.filter(task => 
        task.createdAt >= filter.dateRange!.start && 
        task.createdAt <= filter.dateRange!.end
      );
    }

    return tasks;
  }

  /**
   * 获取任务统计
   */
  getTaskStats(): TaskStats {
    const tasks = this.getAllTasks();
    
    const stats: TaskStats = {
      total: tasks.length,
      byStatus: {},
      byType: {},
      byPriority: {},
      averageCompletionTime: 0,
      totalEstimatedHours: 0,
      totalActualHours: 0,
      completionRate: 0,
      overdueTasks: 0,
    };

    // 统计各维度数据
    let completedTasks = 0;
    let totalCompletionTime = 0;
    const now = new Date();

    for (const task of tasks) {
      // 状态统计
      stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1;
      
      // 类型统计
      stats.byType[task.type] = (stats.byType[task.type] || 0) + 1;
      
      // 优先级统计
      stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;
      
      // 工时统计
      stats.totalEstimatedHours += task.estimatedHours;
      stats.totalActualHours += task.actualHours;
      
      // 完成时间统计
      if (task.status === TaskStatus.COMPLETED && task.startedAt && task.completedAt) {
        completedTasks++;
        totalCompletionTime += task.completedAt.getTime() - task.startedAt.getTime();
      }
      
      // 逾期任务统计
      if (task.deadline && task.deadline < now && task.status !== TaskStatus.COMPLETED) {
        stats.overdueTasks++;
      }
    }

    // 计算平均完成时间（小时）
    if (completedTasks > 0) {
      stats.averageCompletionTime = totalCompletionTime / completedTasks / (1000 * 60 * 60);
    }

    // 计算完成率
    stats.completionRate = tasks.length > 0 ? 
      (stats.byStatus[TaskStatus.COMPLETED] || 0) / tasks.length : 0;

    return stats;
  }

  /**
   * 获取任务依赖图
   */
  getDependencyGraph(): TaskDependencyGraph {
    const nodes: TaskNode[] = [];
    const edges: TaskEdge[] = [];

    for (const task of this.tasks.values()) {
      nodes.push({
        id: task.id,
        title: task.title,
        status: task.status,
        type: task.type,
        priority: task.priority,
      });

      for (const depId of task.dependencies) {
        edges.push({
          from: depId,
          to: task.id,
          type: 'dependency',
        });
      }

      if (task.parentId) {
        edges.push({
          from: task.parentId,
          to: task.id,
          type: 'parent',
        });
      }
    }

    return { nodes, edges };
  }

  /**
   * 检查任务依赖
   */
  canStartTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    // 检查所有依赖是否已完成
    for (const depId of task.dependencies) {
      const depTask = this.tasks.get(depId);
      if (!depTask || depTask.status !== TaskStatus.COMPLETED) {
        return false;
      }
    }

    return true;
  }

  /**
   * 获取任务管理器状态
   */
  getStatus(): TaskManagerStatus {
    const stats = this.getTaskStats();
    
    return {
      initialized: this.initialized,
      totalTasks: stats.total,
      activeTasks: (stats.byStatus[TaskStatus.IN_PROGRESS] || 0) + (stats.byStatus[TaskStatus.READY] || 0),
      completedTasks: stats.byStatus[TaskStatus.COMPLETED] || 0,
      failedTasks: stats.byStatus[TaskStatus.FAILED] || 0,
      overdueTasks: stats.overdueTasks,
      completionRate: stats.completionRate,
      availableTemplates: this.templates.size,
      lastActivity: new Date(),
    };
  }
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      // 保存所有任务
      await this.saveTasks();
      
      this.initialized = false;
      console.log('✅ 任务管理器已关闭');

    } catch (error) {
      console.error('❌ 任务管理器关闭失败:', error);
      throw error;
    }
  }

  // 私有方法

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('任务管理器尚未初始化');
    }
  }

  private async handleStatusChange(task: Task, oldStatus: TaskStatus, newStatus: TaskStatus): Promise<void> {
    // 状态变更时的特殊处理
    switch (newStatus) {
      case TaskStatus.IN_PROGRESS:
        if (!task.startedAt) {
          task.startedAt = new Date();
        }
        break;
        
      case TaskStatus.COMPLETED:
      case TaskStatus.FAILED:
      case TaskStatus.CANCELLED:
        if (!task.completedAt) {
          task.completedAt = new Date();
        }
        // 计算实际工时
        if (task.startedAt) {
          task.actualHours = (task.completedAt.getTime() - task.startedAt.getTime()) / (1000 * 60 * 60);
        }
        break;
    }

    console.log(`🔄 任务 ${task.title} 状态变更: ${oldStatus} → ${newStatus}`);
  }

  private async handleProgressUpdate(task: Task): Promise<void> {
    // 进度更新时的处理
    if (task.progress >= 100 && task.status !== TaskStatus.COMPLETED) {
      await this.updateTask(task.id, { status: TaskStatus.COMPLETED });
    }
  }

  private async loadTasks(): Promise<void> {
    try {
      const cachedTasks = await this.cacheManager.get('tasks:all');
      if (cachedTasks) {
        const tasks = cachedTasks as Task[];
        for (const task of tasks) {
          this.tasks.set(task.id, task);
        }
        console.log(`📦 加载了 ${tasks.length} 个任务`);
      }
    } catch (error) {
      console.warn('⚠️ 加载任务失败:', error);
    }
  }

  private async saveTasks(): Promise<void> {
    try {
      const tasks = Array.from(this.tasks.values());
      await this.cacheManager.set('tasks:all', tasks, 86400); // 24小时缓存
      console.log(`💾 保存了 ${tasks.length} 个任务`);
    } catch (error) {
      console.error('❌ 保存任务失败:', error);
    }
  }

  private async loadTemplates(): Promise<void> {
    // 加载内置模板
    const builtinTemplates: TaskTemplate[] = [
      {
        name: 'analysis',
        type: TaskType.ANALYSIS,
        title: '需求分析',
        description: '分析PRD文档，提取关键需求',
        estimatedHours: 2,
        requirements: ['PRD文档', 'stakeholder访谈'],
        acceptanceCriteria: ['需求列表完整', '验收标准明确'],
        tags: ['analysis', 'requirements'],
      },
      {
        name: 'code_review',
        type: TaskType.REVIEW,
        title: '代码审查',
        description: '审查代码质量和规范',
        estimatedHours: 1,
        requirements: ['代码提交', 'review checklist'],
        acceptanceCriteria: ['代码符合规范', '无安全漏洞'],
        tags: ['review', 'quality'],
      },
    ];

    for (const template of builtinTemplates) {
      this.templates.set(template.name, template);
    }

    console.log(`📋 加载了 ${builtinTemplates.length} 个任务模板`);
  }

  private startPeriodicSave(): void {
    // 每5分钟自动保存
    setInterval(() => {
      this.saveTasks().catch(error => 
        console.error('定期保存任务失败:', error)
      );
    }, 5 * 60 * 1000);
  }
}

// 类型定义

export interface TaskStats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  averageCompletionTime: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  completionRate: number;
  overdueTasks: number;
}

export interface TaskDependencyGraph {
  nodes: TaskNode[];
  edges: TaskEdge[];
}

export interface TaskNode {
  id: string;
  title: string;
  status: TaskStatus;
  type: TaskType;
  priority: TaskPriority;
}

export interface TaskEdge {
  from: string;
  to: string;
  type: 'dependency' | 'parent';
}

export interface TaskManagerStatus {
  initialized: boolean;
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
  overdueTasks: number;
  completionRate: number;
  availableTemplates: number;
  lastActivity: Date;
}
