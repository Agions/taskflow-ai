/**
 * 内存存储后端
 */

import { WorkflowExecution } from './types';
import { StorageBackend } from './storage-types';

/**
 * 内存存储 (开发/测试用)
 */
export class MemoryStorage implements StorageBackend {
  private workflows: Map<string, any> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();

  async saveWorkflow(workflow: any): Promise<void> {
    this.workflows.set(workflow.id, workflow);
  }

  async getWorkflow(id: string): Promise<any | null> {
    return this.workflows.get(id) || null;
  }

  async listWorkflows(): Promise<unknown[]> {
    return Array.from(this.workflows.values());
  }

  async deleteWorkflow(id: string): Promise<void> {
    this.workflows.delete(id);
  }

  async saveExecution(execution: WorkflowExecution): Promise<void> {
    this.executions.set(execution.id, execution);
  }

  async getExecution(id: string): Promise<WorkflowExecution | null> {
    return this.executions.get(id) || null;
  }

  async listExecutions(workflowId?: string, limit: number = 50): Promise<WorkflowExecution[]> {
    let all = Array.from(this.executions.values());
    if (workflowId) {
      all = all.filter(e => e.workflowId === workflowId);
    }
    all.sort((a, b) => b.startedAt - a.startedAt);
    return all.slice(0, limit);
  }

  async updateExecution(execution: WorkflowExecution): Promise<void> {
    this.executions.set(execution.id, execution);
  }

  async deleteExecution(id: string): Promise<void> {
    this.executions.delete(id);
  }

  /**
   * 清空所有数据
   */
  clear(): void {
    this.workflows.clear();
    this.executions.clear();
  }

  /**
   * 获取统计信息
   */
  getStats(): { workflows: number; executions: number } {
    return {
      workflows: this.workflows.size,
      executions: this.executions.size,
    };
  }
}
