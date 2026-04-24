/**
 * Task 类型定义
 * TaskFlow AI v4.0 - Unified Task Types
 */

/**
 * Task 状态
 */
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped' | 'todo' | 'review' | 'done';

/**
 * Task 优先级
 */
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Task 类型
 */
export type TaskType = 'code' | 'test' | 'analysis' | 'documentation' | 'deployment' | 'frontend' | 'backend' | 'design' | 'research' | 'testing';

/**
 * Task
 */
export interface Task {
  id: string;
  name: string;
  title?: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  complexity?: 'low' | 'medium' | 'high';
  dependsOn: string[];
  dependencies?: string[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  progress?: number;
  estimatedDuration?: number;
  estimatedHours?: number;
  actualDuration?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Task 执行上下文
 */
export interface TaskExecutionContext {
  taskId: string;
  projectPath: string;
  workspacePath?: string;
  environment: 'development' | 'staging' | 'production';
  config: Record<string, unknown>;
  variables: Record<string, unknown>;
}

/**
 * Task 执行结果
 */
export interface TaskResult {
  taskId: string;
  success: boolean;
  output?: string;
  error?: string;
  duration: number;
  artifacts: Artifact[];
  logs: TaskLog[];
  metrics: TaskMetrics;
}

/**
 * 任务产物
 */
export interface Artifact {
  path: string;
  type: 'file' | 'directory' | 'url';
  size?: number;
  checksum?: string;
}

/**
 * 任务日志
 */
export interface TaskLog {
  level: 'info' | 'warn' | 'error' | 'debug';
  timestamp: number;
  message: string;
  context?: Record<string, unknown>;
}

/**
 * 任务指标
 */
export interface TaskMetrics {
  cpuTime: number;
  memoryPeak: number;
  networkCalls: number;
  cacheHits: number;
  cacheMisses: number;
}
