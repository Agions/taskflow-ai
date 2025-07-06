/**
 * TaskFlow AI 任务管理器
 * 提供任务状态管理、进度跟踪和依赖关系管理功能
 */

import { EventEmitter } from 'events';
import fs from 'fs-extra';
import path from 'path';
import { Logger } from '../../infra/logger';
import { LogLevel } from '../../types/config';

/**
 * 任务状态枚举
 */
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
  CANCELLED = 'cancelled'
}

/**
 * 任务优先级
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * 任务定义
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  estimatedHours: number;
  actualHours?: number;
  progress: number; // 0-100
  dependencies: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  dueDate?: Date;
  metadata: Record<string, unknown>;
}

/**
 * 任务统计信息
 */
export interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  blocked: number;
  cancelled: number;
  overallProgress: number;
  estimatedTotalHours: number;
  actualTotalHours: number;
}

/**
 * 任务更新选项
 */
export interface TaskUpdateOptions {
  progress?: number;
  notes?: string;
  actualHours?: number;
  assignee?: string;
  dueDate?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * 任务管理器类
 */
export class TaskManager extends EventEmitter {
  private tasks: Map<string, Task>;
  private logger: Logger;
  private dataFile: string;
  private autoSaveInterval: NodeJS.Timeout | null = null;

  constructor(dataDir: string = '.taskflow') {
    super();
    this.tasks = new Map();
    this.logger = Logger.getInstance({
      level: LogLevel.INFO,
      output: 'console'
    });
    this.dataFile = path.join(dataDir, 'tasks.json');
    
    this.initializeDataFile();
    this.loadTasks();
    this.startAutoSave();
  }

  /**
   * 初始化数据文件
   */
  private async initializeDataFile(): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(this.dataFile));
      if (!await fs.pathExists(this.dataFile)) {
        await fs.writeJson(this.dataFile, { tasks: [] });
      }
    } catch (error) {
      this.logger.error('初始化任务数据文件失败:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  /**
   * 加载任务数据
   */
  private async loadTasks(): Promise<void> {
    try {
      if (await fs.pathExists(this.dataFile)) {
        const data = await fs.readJson(this.dataFile);
        if (data.tasks && Array.isArray(data.tasks)) {
          for (const taskData of data.tasks) {
            const task: Task = {
              ...taskData,
              createdAt: new Date(taskData.createdAt),
              updatedAt: new Date(taskData.updatedAt),
              startedAt: taskData.startedAt ? new Date(taskData.startedAt) : undefined,
              completedAt: taskData.completedAt ? new Date(taskData.completedAt) : undefined,
              dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined
            };
            this.tasks.set(task.id, task);
          }
        }
      }
      this.logger.info(`已加载 ${this.tasks.size} 个任务`);
    } catch (error) {
      this.logger.error('加载任务数据失败:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  /**
   * 保存任务数据
   */
  private async saveTasks(): Promise<void> {
    try {
      const tasksArray = Array.from(this.tasks.values());
      await fs.writeJson(this.dataFile, { tasks: tasksArray }, { spaces: 2 });
    } catch (error) {
      this.logger.error('保存任务数据失败:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  /**
   * 启动自动保存
   */
  private startAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    
    this.autoSaveInterval = setInterval(() => {
      this.saveTasks();
    }, 30000); // 每30秒自动保存
  }

  /**
   * 停止自动保存
   */
  public stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  /**
   * 创建新任务
   */
  public createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'progress'>): Task {
    const task: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: 0,
      ...taskData
    };

    this.tasks.set(task.id, task);
    this.emit('taskCreated', task);
    this.logger.info(`创建任务: ${task.title} (${task.id})`);
    
    return task;
  }

  /**
   * 获取任务
   */
  public getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * 获取所有任务
   */
  public getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * 更新任务
   */
  public updateTask(taskId: string, updates: Partial<Task>): boolean {
    const task = this.tasks.get(taskId);
    if (!task) {
      this.logger.warn(`任务不存在: ${taskId}`);
      return false;
    }

    // 更新任务属性
    Object.assign(task, updates, {
      updatedAt: new Date()
    });

    this.tasks.set(taskId, task);
    this.emit('taskUpdated', { taskId, task, updates });

    // 触发自动保存
    this.saveTasks();

    this.logger.info(`任务已更新: ${taskId}`);
    return true;
  }

  /**
   * 更新任务状态
   */
  public updateTaskStatus(taskId: string, status: TaskStatus, options: TaskUpdateOptions = {}): boolean {
    const task = this.tasks.get(taskId);
    if (!task) {
      this.logger.warn(`任务不存在: ${taskId}`);
      return false;
    }

    const oldStatus = task.status;
    task.status = status;
    task.updatedAt = new Date();

    // 更新进度
    if (options.progress !== undefined) {
      task.progress = Math.max(0, Math.min(100, options.progress));
    }

    // 更新其他字段
    if (options.actualHours !== undefined) {
      task.actualHours = options.actualHours;
    }
    if (options.assignee !== undefined) {
      task.assignee = options.assignee;
    }
    if (options.dueDate !== undefined) {
      task.dueDate = options.dueDate;
    }
    if (options.metadata) {
      task.metadata = { ...task.metadata, ...options.metadata };
    }

    // 设置状态相关的时间戳
    if (status === TaskStatus.IN_PROGRESS && oldStatus !== TaskStatus.IN_PROGRESS) {
      task.startedAt = new Date();
    } else if (status === TaskStatus.COMPLETED && oldStatus !== TaskStatus.COMPLETED) {
      task.completedAt = new Date();
      task.progress = 100;
    }

    this.emit('taskUpdated', task, oldStatus);
    this.logger.info(`更新任务状态: ${task.title} (${oldStatus} -> ${status})`);
    
    return true;
  }

  /**
   * 删除任务
   */
  public deleteTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    this.tasks.delete(taskId);
    this.emit('taskDeleted', task);
    this.logger.info(`删除任务: ${task.title} (${taskId})`);
    
    return true;
  }

  /**
   * 获取任务统计信息
   */
  public getTaskStats(): TaskStats {
    const tasks = Array.from(this.tasks.values());
    
    const stats: TaskStats = {
      total: tasks.length,
      pending: 0,
      in_progress: 0,
      completed: 0,
      blocked: 0,
      cancelled: 0,
      overallProgress: 0,
      estimatedTotalHours: 0,
      actualTotalHours: 0
    };

    for (const task of tasks) {
      // 统计状态
      switch (task.status) {
        case TaskStatus.PENDING:
          stats.pending++;
          break;
        case TaskStatus.IN_PROGRESS:
          stats.in_progress++;
          break;
        case TaskStatus.COMPLETED:
          stats.completed++;
          break;
        case TaskStatus.BLOCKED:
          stats.blocked++;
          break;
        case TaskStatus.CANCELLED:
          stats.cancelled++;
          break;
      }

      // 统计工时
      stats.estimatedTotalHours += task.estimatedHours;
      if (task.actualHours) {
        stats.actualTotalHours += task.actualHours;
      }
    }

    // 计算整体进度
    if (tasks.length > 0) {
      const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
      stats.overallProgress = Math.round(totalProgress / tasks.length);
    }

    return stats;
  }

  /**
   * 根据状态筛选任务
   */
  public getTasksByStatus(status: TaskStatus): Task[] {
    return Array.from(this.tasks.values()).filter(task => task.status === status);
  }

  /**
   * 根据优先级筛选任务
   */
  public getTasksByPriority(priority: TaskPriority): Task[] {
    return Array.from(this.tasks.values()).filter(task => task.priority === priority);
  }

  /**
   * 根据分配人筛选任务
   */
  public getTasksByAssignee(assignee: string): Task[] {
    return Array.from(this.tasks.values()).filter(task => task.assignee === assignee);
  }

  /**
   * 检查任务依赖关系
   */
  public checkTaskDependencies(taskId: string): { canStart: boolean; blockedBy: string[] } {
    const task = this.tasks.get(taskId);
    if (!task) {
      return { canStart: false, blockedBy: [] };
    }

    const blockedBy: string[] = [];
    
    for (const depId of task.dependencies) {
      const depTask = this.tasks.get(depId);
      if (!depTask || depTask.status !== TaskStatus.COMPLETED) {
        blockedBy.push(depId);
      }
    }

    return {
      canStart: blockedBy.length === 0,
      blockedBy
    };
  }

  /**
   * 获取可以开始的任务
   */
  public getReadyTasks(): Task[] {
    return Array.from(this.tasks.values()).filter(task => {
      if (task.status !== TaskStatus.PENDING) return false;
      const { canStart } = this.checkTaskDependencies(task.id);
      return canStart;
    });
  }

  /**
   * 手动保存
   */
  public async save(): Promise<void> {
    await this.saveTasks();
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    this.stopAutoSave();
    this.saveTasks();
    this.removeAllListeners();
  }
}
