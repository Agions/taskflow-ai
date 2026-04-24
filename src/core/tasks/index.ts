/**
 * 任务管理模块
 * TaskFlow AI v4.0 - Unified Task Management
 */

import { ExtensionType } from '../types/extensions';

export interface TaskDefinition {
  id: string;
  name: string;
  type: 'agent' | 'tool' | 'workflow';
  description?: string;
  config: Record<string, unknown>;
}

export class TaskGenerator {
  // 任务生成器实现
}

export interface TaskExecutor {
  execute(task: TaskDefinition): Promise<unknown>;
}

export interface TaskRegistry {
  register(taskType: string, executor: TaskExecutor): void;
  get(taskType: string): TaskExecutor | undefined;
  list(): string[];
}