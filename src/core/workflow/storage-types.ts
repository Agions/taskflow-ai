/**
 * 存储类型定义
 */

import { WorkflowExecution } from './types';

/**
 * 存储后端接口
 */
export interface StorageBackend {
  saveWorkflow(workflow: any): Promise<void>;
  getWorkflow(id: string): Promise<any | null>;
  listWorkflows(): Promise<any[]>;
  deleteWorkflow(id: string): Promise<void>;

  saveExecution(execution: WorkflowExecution): Promise<void>;
  getExecution(id: string): Promise<WorkflowExecution | null>;
  listExecutions(workflowId?: string, limit?: number): Promise<WorkflowExecution[]>;
  updateExecution(execution: WorkflowExecution): Promise<void>;
  deleteExecution(id: string): Promise<void>;
}

/**
 * 存储配置
 */
export interface StorageConfig {
  type: 'sqlite' | 'memory';
  dbPath?: string;
}
