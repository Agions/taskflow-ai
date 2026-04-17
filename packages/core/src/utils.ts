import { TaskFlowConfig, Task, Project } from './types';

export class ConfigManager {
  private config: TaskFlowConfig;

  constructor(config: TaskFlowConfig) {
    if (!TaskFlowAI.validateConfig(config)) {
      throw new Error('Invalid configuration');
    }
    this.config = config;
  }

  getConfig(): TaskFlowConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<TaskFlowConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

export class TaskManager {
  private tasks: Map<string, Task> = new Map();

  createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const task: Task = {
      ...taskData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tasks.set(task.id, task);
    return task;
  }

  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  updateTask(id: string, updates: Partial<Task>): Task | null {
    const task = this.tasks.get(id);
    if (!task) return null;

    const updatedTask = {
      ...task,
      ...updates,
      updatedAt: new Date(),
    };

    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  deleteTask(id: string): boolean {
    return this.tasks.delete(id);
  }

  listTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}