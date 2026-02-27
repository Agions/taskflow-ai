/**
 * 执行相关类型
 */

import { Task } from './task';

/**
 * 执行上下文
 */
export interface ExecutionContext {
  projectPath: string;
  config: Record<string, unknown>;
}

/**
 * 任务结果
 */
export interface TaskResult {
  taskId: string;
  success: boolean;
  output?: string;
  error?: string;
  duration: number;
}

/**
 * 执行结果
 */
export interface ExecutionResult {
  results: TaskResult[];
  tasks?: TaskResult[];
  files?: string[];
  summary: ExecutionSummary;
  startTime: Date;
  endTime: Date;
}

/**
 * 执行摘要
 */
export interface ExecutionSummary {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  skippedTasks?: number;
  totalDuration: number;
  averageDuration?: number;
}
