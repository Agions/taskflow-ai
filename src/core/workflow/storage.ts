/**
 * 状态管理系统
 * 包含 SQLite 存储、执行状态管理、执行历史
 */

import { WorkflowExecution } from './types';
import { StorageBackend, StorageConfig } from './storage-types';
import { SQLiteStorage } from './sqlite-storage';
import { MemoryStorage } from './memory-storage';

export { StorageBackend, StorageConfig } from './storage-types';
export { SQLiteStorage } from './sqlite-storage';
export { MemoryStorage } from './memory-storage';

/**
 * 存储工厂
 */
export function createStorage(
  type: 'sqlite' | 'memory',
  options?: { dbPath?: string }
): StorageBackend {
  switch (type) {
    case 'sqlite':
      return new SQLiteStorage(options?.dbPath);
    case 'memory':
    default:
      return new MemoryStorage();
  }
}

/**
 * 工作流存储管理器
 */
export class WorkflowStorage {
  private backend: StorageBackend;

  constructor(config: StorageConfig) {
    this.backend = createStorage(config.type, { dbPath: config.dbPath });
  }

  async saveWorkflow(workflow: any): Promise<void> {
    return this.backend.saveWorkflow(workflow);
  }

  async getWorkflow(id: string): Promise<any | null> {
    return this.backend.getWorkflow(id);
  }

  async listWorkflows(): Promise<any[]> {
    return this.backend.listWorkflows();
  }

  async deleteWorkflow(id: string): Promise<void> {
    return this.backend.deleteWorkflow(id);
  }

  async saveExecution(execution: WorkflowExecution): Promise<void> {
    return this.backend.saveExecution(execution);
  }

  async getExecution(id: string): Promise<WorkflowExecution | null> {
    return this.backend.getExecution(id);
  }

  async listExecutions(workflowId?: string, limit?: number): Promise<WorkflowExecution[]> {
    return this.backend.listExecutions(workflowId, limit);
  }

  async updateExecution(execution: WorkflowExecution): Promise<void> {
    return this.backend.updateExecution(execution);
  }

  async deleteExecution(id: string): Promise<void> {
    return this.backend.deleteExecution(id);
  }
}

export default WorkflowStorage;
