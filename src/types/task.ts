/**
 * 任务相关类型
 */

import { Priority, Complexity, Requirement } from './prd';

/**
 * 任务
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: Priority;
  complexity: Complexity;
  estimatedHours: number;
  actualHours?: number;
  assignee?: string;
  dependencies: string[];
  tags: string[];
  requirement?: Requirement;
  subtasks: SubTask[];
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  completedAt?: Date;
}

/**
 * 任务类型
 */
export type TaskType =
  | 'frontend'
  | 'backend'
  | 'database'
  | 'testing'
  | 'deployment'
  | 'documentation'
  | 'research'
  | 'design';

/**
 * 任务状态
 */
export type TaskStatus =
  | 'todo'
  | 'in-progress'
  | 'review'
  | 'testing'
  | 'done'
  | 'blocked'
  | 'cancelled';

/**
 * 子任务
 */
export interface SubTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  estimatedHours: number;
  actualHours?: number;
  completedAt?: Date;
}
