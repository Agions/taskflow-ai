import * as fs from 'fs-extra';
import * as path from 'path';
import { Task, TaskPlan, TaskStatus, TaskPriority, TaskType } from '../../types/task';
import { Logger } from '../../infra/logger';
import { ConfigManager } from '../../infra/config';

/**
 * 任务过滤条件
 */
export interface TaskFilter {
  status?: TaskStatus | TaskStatus[];
  type?: string | string[];
  assignee?: string;
  priority?: string | string[];
}

/**
 * 任务更新数据
 */
export interface TaskUpdateData {
  name?: string;
  description?: string;
  status?: TaskStatus;
  priority?: string;
  assignee?: string;
}

/**
 * 任务管理器类
 * 负责管理任务计划中的任务
 */
export class TaskManager {
  private taskPlan: TaskPlan | null = null;
  private taskFilePath: string;
  private logger: Logger;
  private configManager: ConfigManager;
  private autoSaveInterval: NodeJS.Timeout | null = null;

  /**
   * 创建任务管理器实例
   * @param logger 日志记录器
   * @param configManager 配置管理器
   */
  constructor(logger: Logger, configManager: ConfigManager) {
    this.logger = logger;
    this.configManager = configManager;

    // 获取任务文件路径配置
    const taskSettings = this.configManager.get('taskSettings', {
      outputDir: './tasks',
      autoSave: true,
      saveInterval: 300
    });

    this.taskFilePath = path.join(taskSettings.outputDir, 'tasks.json');

    // 启动自动保存
    if (taskSettings.autoSave) {
      this.startAutoSave(taskSettings.saveInterval * 1000);
    }
  }

  /**
   * 加载任务计划
   * @param filePath 任务计划文件路径，不指定则使用默认路径
   */
  public async loadTaskPlan(filePath?: string): Promise<TaskPlan> {
    const targetPath = filePath || this.taskFilePath;

    try {
      // 检查文件是否存在
      if (!fs.existsSync(targetPath)) {
        throw new Error(`任务计划文件不存在：${targetPath}`);
      }

      // 读取任务文件
      const content = await fs.readFile(targetPath, 'utf-8');
      this.taskPlan = JSON.parse(content) as TaskPlan;

      this.logger.info(`成功加载任务计划，共 ${this.taskPlan.tasks.length} 个任务`);
      return this.taskPlan;
    } catch (error) {
      this.logger.error(`加载任务计划失败：${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * 保存任务计划
   * @param filePath 保存路径，不指定则使用默认路径
   */
  public async saveTaskPlan(filePath?: string): Promise<void> {
    const targetPath = filePath || this.taskFilePath;

    if (!this.taskPlan) {
      throw new Error('没有任务计划可保存，请先加载或创建任务计划');
    }

    try {
      // 确保目录存在
      await fs.ensureDir(path.dirname(targetPath));

      // 写入文件
      await fs.writeFile(targetPath, JSON.stringify(this.taskPlan, null, 2), 'utf-8');

      this.logger.info(`任务计划已保存至 ${targetPath}`);
    } catch (error) {
      this.logger.error(`保存任务计划失败：${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * 设置任务计划
   * @param taskPlan 任务计划
   */
  public setTaskPlan(taskPlan: TaskPlan): void {
    this.taskPlan = taskPlan;
    this.logger.info(`设置任务计划成功，共 ${taskPlan.tasks.length} 个任务`);
  }

  /**
   * 获取任务计划
   */
  public getTaskPlan(): TaskPlan | null {
    return this.taskPlan;
  }

  /**
   * 获取所有任务
   */
  public getAllTasks(): Task[] {
    if (!this.taskPlan) {
      throw new Error('没有加载任务计划');
    }

    return [...this.taskPlan.tasks];
  }

  /**
   * 根据ID获取任务
   * @param id 任务ID
   */
  public getTaskById(id: string): Task | null {
    if (!this.taskPlan) {
      throw new Error('没有加载任务计划');
    }

    // 检查是否是子任务ID（包含点号）
    if (id.includes('.')) {
      const [parentId, subtaskId] = id.split('.');

      // 找到父任务
      const parentTask = this.taskPlan.tasks.find(task => task.id === parentId);
      if (!parentTask || !parentTask.subtasks) {
        return null;
      }

      // 查找完整的子任务ID
      const fullSubtaskId = `${parentId}.${subtaskId}`;
      const subtask = parentTask.subtasks.find(st => st.id === fullSubtaskId);

      // 如果找到子任务，将其转换为Task类型返回
      if (subtask) {
        return {
          id: subtask.id,
          name: subtask.name,
          title: subtask.name,
          description: subtask.description,
          status: subtask.status,
          priority: TaskPriority.MEDIUM, // 子任务默认继承父任务的优先级
          type: TaskType.FEATURE, // 子任务默认类型
          dependencies: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
          subtasks: []
        };
      }

      return null;
    }

    // 查找主任务
    return this.taskPlan.tasks.find(task => task.id === id) || null;
  }

  /**
   * 过滤任务
   * @param filter 过滤条件
   */
  public filterTasks(filter: TaskFilter): Task[] {
    if (!this.taskPlan) {
      throw new Error('没有加载任务计划');
    }

    return this.taskPlan.tasks.filter(task => {
      // 按状态过滤
      if (filter.status) {
        if (Array.isArray(filter.status)) {
          if (!filter.status.includes(task.status)) {
            return false;
          }
        } else if (task.status !== filter.status) {
          return false;
        }
      }

      // 按类型过滤
      if (filter.type) {
        if (Array.isArray(filter.type)) {
          if (!filter.type.includes(task.type)) {
            return false;
          }
        } else if (task.type !== filter.type) {
          return false;
        }
      }

      // 按负责人过滤
      if (filter.assignee && task.assignee !== filter.assignee) {
        return false;
      }

      // 按优先级过滤
      if (filter.priority) {
        if (Array.isArray(filter.priority)) {
          if (!filter.priority.includes(task.priority)) {
            return false;
          }
        } else if (task.priority !== filter.priority) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * 添加新任务
   * @param task 任务
   */
  public addTask(task: Task): Task {
    if (!this.taskPlan) {
      throw new Error('没有加载任务计划');
    }

    // 检查ID是否已存在
    const existingTask = this.taskPlan.tasks.find(t => t.id === task.id);
    if (existingTask) {
      throw new Error(`任务ID ${task.id} 已存在`);
    }

    // 添加新任务
    this.taskPlan.tasks.push(task);
    this.logger.info(`添加新任务 ${task.id}: ${task.name}`);

    return task;
  }

  /**
   * 更新任务
   * @param id 任务ID
   * @param data 更新数据
   */
  public updateTask(id: string, data: TaskUpdateData): Task | null {
    if (!this.taskPlan) {
      throw new Error('没有加载任务计划');
    }

    // 检查是否是子任务
    if (id.includes('.')) {
      const [parentId, subtaskIdPart] = id.split('.');

      // 找到父任务
      const parentTaskIndex = this.taskPlan.tasks.findIndex(task => task.id === parentId);
      if (parentTaskIndex < 0 || !this.taskPlan.tasks[parentTaskIndex].subtasks) {
        return null;
      }

      // 查找完整的子任务ID
      const fullSubtaskId = id;
      const subtaskIndex = this.taskPlan.tasks[parentTaskIndex].subtasks.findIndex(
        st => st.id === fullSubtaskId
      );

      if (subtaskIndex < 0) {
        return null;
      }

      // 更新子任务
      const subtask = this.taskPlan.tasks[parentTaskIndex].subtasks[subtaskIndex];

      if (data.name) subtask.name = data.name;
      if (data.description) subtask.description = data.description;
      if (data.status) subtask.status = data.status;

      this.logger.info(`更新子任务 ${id}: ${subtask.name}`);

      // 构造返回的任务对象
      return {
        id: subtask.id,
        name: subtask.name,
        title: subtask.name,
        description: subtask.description,
        status: subtask.status,
        priority: TaskPriority.MEDIUM,
        type: TaskType.FEATURE,
        dependencies: [],
        subtasks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: []
      };
    }

    // 更新主任务
    const taskIndex = this.taskPlan.tasks.findIndex(task => task.id === id);
    if (taskIndex < 0) {
      return null;
    }

    const task = this.taskPlan.tasks[taskIndex];

    if (data.name) task.name = data.name;
    if (data.description) task.description = data.description;
    if (data.status) task.status = data.status;
    if (data.priority) task.priority = data.priority as any;
    if (data.assignee) task.assignee = data.assignee;

    this.logger.info(`更新任务 ${id}: ${task.name}`);

    return task;
  }

  /**
   * 删除任务
   * @param id 任务ID
   */
  public removeTask(id: string): boolean {
    if (!this.taskPlan) {
      throw new Error('没有加载任务计划');
    }

    // 检查是否是子任务
    if (id.includes('.')) {
      const [parentId, subtaskIdPart] = id.split('.');

      // 找到父任务
      const parentTaskIndex = this.taskPlan.tasks.findIndex(task => task.id === parentId);
      if (parentTaskIndex < 0 || !this.taskPlan.tasks[parentTaskIndex].subtasks) {
        return false;
      }

      // 查找完整的子任务ID
      const fullSubtaskId = id;
      const subtaskIndex = this.taskPlan.tasks[parentTaskIndex].subtasks.findIndex(
        st => st.id === fullSubtaskId
      );

      if (subtaskIndex < 0) {
        return false;
      }

      // 删除子任务
      this.taskPlan.tasks[parentTaskIndex].subtasks.splice(subtaskIndex, 1);
      this.logger.info(`删除子任务 ${id}`);

      return true;
    }

    // 删除主任务
    const taskIndex = this.taskPlan.tasks.findIndex(task => task.id === id);
    if (taskIndex < 0) {
      return false;
    }

    // 删除任务
    this.taskPlan.tasks.splice(taskIndex, 1);

    // 清理其他任务对该任务的依赖
    this.taskPlan.tasks.forEach(task => {
      task.dependencies = task.dependencies.filter(depId => depId !== id);
    });

    this.logger.info(`删除任务 ${id}`);

    return true;
  }

  /**
   * 添加子任务
   * @param parentId 父任务ID
   * @param subtask 子任务
   */
  public addSubtask(parentId: string, subtask: any): any {
    if (!this.taskPlan) {
      throw new Error('没有加载任务计划');
    }

    // 找到父任务
    const parentTask = this.taskPlan.tasks.find(task => task.id === parentId);
    if (!parentTask) {
      throw new Error(`父任务 ${parentId} 不存在`);
    }

    // 确保subtasks是数组
    if (!Array.isArray(parentTask.subtasks)) {
      parentTask.subtasks = [];
    }

    // 设置子任务ID（如果没有的话）
    if (!subtask.id) {
      subtask.id = `${parentId}.${parentTask.subtasks.length + 1}`;
    }

    // 设置默认状态
    if (!subtask.status) {
      subtask.status = TaskStatus.TODO;
    }

    // 添加子任务
    parentTask.subtasks.push(subtask);

    this.logger.info(`为任务 ${parentId} 添加子任务 ${subtask.id}: ${subtask.name}`);

    return subtask;
  }

  /**
   * 获取下一个要处理的任务
   */
  public getNextTasks(): Task[] {
    if (!this.taskPlan) {
      throw new Error('没有加载任务计划');
    }

    // 查找所有未完成的任务
    const pendingTasks = this.taskPlan.tasks.filter(task =>
      task.status !== TaskStatus.DONE && task.status !== TaskStatus.REVIEW
    );

    // 筛选出可以开始的任务（没有未完成的依赖项）
    return pendingTasks.filter(task => {
      // 检查依赖
      if (!task.dependencies || task.dependencies.length === 0) {
        return true;
      }

      // 检查所有依赖任务是否已完成
      return task.dependencies.every(depId => {
        const depTask = this.getTaskById(depId);
        return depTask && depTask.status === TaskStatus.DONE;
      });
    });
  }

  /**
   * 添加依赖关系
   * @param taskId 任务ID
   * @param dependsOnId 依赖的任务ID
   */
  public addDependency(taskId: string, dependsOnId: string): boolean {
    if (!this.taskPlan) {
      throw new Error('没有加载任务计划');
    }

    // 找到任务
    const task = this.getTaskById(taskId);
    if (!task) {
      throw new Error(`任务 ${taskId} 不存在`);
    }

    // 检查依赖任务是否存在
    const dependsOnTask = this.getTaskById(dependsOnId);
    if (!dependsOnTask) {
      throw new Error(`依赖的任务 ${dependsOnId} 不存在`);
    }

    // 检查是否为自身
    if (taskId === dependsOnId) {
      throw new Error('任务不能依赖自身');
    }

    // 检查循环依赖
    if (this.checkCircularDependency(dependsOnId, taskId)) {
      throw new Error('添加此依赖会导致循环依赖');
    }

    // 检查依赖是否已存在
    if (!Array.isArray(task.dependencies)) {
      task.dependencies = [];
    }

    if (task.dependencies.includes(dependsOnId)) {
      return false; // 依赖已存在
    }

    // 添加依赖
    task.dependencies.push(dependsOnId);

    this.logger.info(`为任务 ${taskId} 添加依赖: ${dependsOnId}`);

    return true;
  }

  /**
   * 移除依赖关系
   * @param taskId 任务ID
   * @param dependsOnId 依赖的任务ID
   */
  public removeDependency(taskId: string, dependsOnId: string): boolean {
    if (!this.taskPlan) {
      throw new Error('没有加载任务计划');
    }

    // 找到任务
    const task = this.getTaskById(taskId);
    if (!task || !Array.isArray(task.dependencies)) {
      return false;
    }

    // 查找依赖索引
    const index = task.dependencies.indexOf(dependsOnId);
    if (index < 0) {
      return false;
    }

    // 移除依赖
    task.dependencies.splice(index, 1);

    this.logger.info(`从任务 ${taskId} 移除依赖: ${dependsOnId}`);

    return true;
  }

  /**
   * 检查是否存在循环依赖
   * @param task1Id 任务1ID
   * @param task2Id 任务2ID
   */
  private checkCircularDependency(task1Id: string, task2Id: string): boolean {
    if (!this.taskPlan) {
      return false;
    }

    // 构建依赖图
    const graph: Map<string, string[]> = new Map();

    this.taskPlan.tasks.forEach(task => {
      graph.set(task.id, [...(task.dependencies || [])]);
    });

    // 临时添加新依赖
    const task1Deps = graph.get(task1Id) || [];
    task1Deps.push(task2Id);
    graph.set(task1Id, task1Deps);

    // 检查是否有环
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const hasCycle = (node: string): boolean => {
      if (recStack.has(node)) {
        return true;
      }

      if (visited.has(node)) {
        return false;
      }

      visited.add(node);
      recStack.add(node);

      const neighbors = graph.get(node) || [];

      for (const neighbor of neighbors) {
        if (hasCycle(neighbor)) {
          return true;
        }
      }

      recStack.delete(node);
      return false;
    };

    return hasCycle(task1Id);
  }

  /**
   * 开始自动保存任务计划
   * @param interval 保存间隔（毫秒）
   */
  private startAutoSave(interval: number): void {
    // 停止现有的自动保存
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    // 设置新的自动保存
    this.autoSaveInterval = setInterval(async () => {
      if (this.taskPlan) {
        try {
          await this.saveTaskPlan();
        } catch (error) {
          this.logger.error(`自动保存任务计划失败：${(error as Error).message}`);
        }
      }
    }, interval);

    this.logger.info(`启动自动保存，间隔: ${interval / 1000} 秒`);
  }

  /**
   * 停止自动保存
   */
  public stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      this.logger.info('停止自动保存');
    }
  }

  /**
   * 析构函数，清理资源
   */
  public destroy(): void {
    this.stopAutoSave();
  }
} 