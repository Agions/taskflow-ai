/**
 * 任务相关类型
 */

/**
 * 任务
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  estimate: number;
  assignee?: string;
  dependencies: string[];
  outputPath?: string;
  metadata: TaskMetadata;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 任务类型
 */
export type TaskType =
  | 'code'
  | 'file'
  | 'shell'
  | 'analysis'
  | 'design'
  | 'test';

/**
 * 任务状态
 */
export type TaskStatus =
  | 'pending'
  | 'in-progress'
  | 'completed'
  | 'failed'
  | 'blocked';

/**
 * 任务优先级
 */
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * 任务元数据
 */
export interface TaskMetadata {
  framework?: string;
  language?: string;
  template?: string;
  source?: string;
  tags: string[];
}

/**
 * 任务计划
 */
export interface TaskPlan {
  tasks: Task[];
  dependencies: Dependency[];
  totalEstimate: number;
  criticalPath: string[];
  continueOnError?: boolean;
}

/**
 * 依赖关系
 */
export interface Dependency {
  from: string;
  to: string;
  type: 'blocks' | 'depends-on';
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
  artifacts?: string[];
}

/**
 * 执行结果
 */
export interface ExecutionResult {
  results: TaskResult[];
  completedAt: Date;
  success: boolean;
  summary: ExecutionSummary;
}

/**
 * 执行摘要
 */
export interface ExecutionSummary {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalDuration: number;
}
