/**
 * 状态管理系统
 * 包含 SQLite 存储、执行状态管理、执行历史
 */

import { WorkflowExecution, StepStatus } from './types';
import { Logger } from '../../utils/logger';

export interface StorageBackend {
  // 工作流
  saveWorkflow(workflow: any): Promise<void>;
  getWorkflow(id: string): Promise<any | null>;
  listWorkflows(): Promise<any[]>;
  deleteWorkflow(id: string): Promise<void>;

  // 执行
  saveExecution(execution: WorkflowExecution): Promise<void>;
  getExecution(id: string): Promise<WorkflowExecution | null>;
  listExecutions(workflowId?: string, limit?: number): Promise<WorkflowExecution[]>;
  updateExecution(execution: WorkflowExecution): Promise<void>;
  deleteExecution(id: string): Promise<void>;
}

/**
 * SQLite 存储后端
 */
export class SQLiteStorage implements StorageBackend {
  private logger = Logger.getInstance('SQLiteStorage');
  private db: any = null;
  private initialized = false;

  constructor(private dbPath: string = './taskflow.db') {}

  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // 动态导入 better-sqlite3
      const Database = require('better-sqlite3');
      this.db = new Database(this.dbPath);
      
      // 创建表
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS workflows (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          version TEXT,
          description TEXT,
          definition TEXT NOT NULL,
          created_at INTEGER,
          updated_at INTEGER
        );

        CREATE TABLE IF NOT EXISTS executions (
          id TEXT PRIMARY KEY,
          workflow_id TEXT NOT NULL,
          status TEXT NOT NULL,
          current_step TEXT,
          variables TEXT,
          outputs TEXT,
          step_statuses TEXT,
          error TEXT,
          started_at INTEGER,
          finished_at INTEGER,
          paused_at TEXT,
          FOREIGN KEY (workflow_id) REFERENCES workflows(id)
        );

        CREATE INDEX IF NOT EXISTS idx_executions_workflow ON executions(workflow_id);
        CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);
      `);

      this.initialized = true;
      this.logger.info(`数据库初始化完成: ${this.dbPath}`);
    } catch (error) {
      this.logger.error('数据库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 保存工作流
   */
  async saveWorkflow(workflow: any): Promise<void> {
    await this.initialize();
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO workflows (id, name, version, description, definition, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      workflow.id,
      workflow.name,
      workflow.version,
      workflow.description,
      JSON.stringify(workflow),
      Date.now(),
      Date.now()
    );
  }

  /**
   * 获取工作流
   */
  async getWorkflow(id: string): Promise<any | null> {
    await this.initialize();
    
    const stmt = this.db.prepare('SELECT * FROM workflows WHERE id = ?');
    const row = stmt.get(id);

    if (!row) return null;

    return {
      ...JSON.parse(row.definition),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * 列出工作流
   */
  async listWorkflows(): Promise<any[]> {
    await this.initialize();
    
    const stmt = this.db.prepare('SELECT id, name, version, description, created_at FROM workflows ORDER BY updated_at DESC');
    return stmt.all();
  }

  /**
   * 删除工作流
   */
  async deleteWorkflow(id: string): Promise<void> {
    await this.initialize();
    
    const stmt = this.db.prepare('DELETE FROM workflows WHERE id = ?');
    stmt.run(id);
  }

  /**
   * 保存执行记录
   */
  async saveExecution(execution: WorkflowExecution): Promise<void> {
    await this.initialize();
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO executions 
      (id, workflow_id, status, current_step, variables, outputs, step_statuses, error, started_at, finished_at, paused_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      execution.id,
      execution.workflowId,
      execution.status,
      execution.currentStep || null,
      JSON.stringify(execution.variables),
      JSON.stringify(execution.outputs),
      JSON.stringify(execution.stepStatuses),
      execution.error || null,
      execution.startedAt,
      execution.finishedAt || null,
      execution.pausedAt || null
    );
  }

  /**
   * 获取执行记录
   */
  async getExecution(id: string): Promise<WorkflowExecution | null> {
    await this.initialize();
    
    const stmt = this.db.prepare('SELECT * FROM executions WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.rowToExecution(row);
  }

  /**
   * 列出执行记录
   */
  async listExecutions(workflowId?: string, limit: number = 50): Promise<WorkflowExecution[]> {
    await this.initialize();
    
    let stmt;
    if (workflowId) {
      stmt = this.db.prepare('SELECT * FROM executions WHERE workflow_id = ? ORDER BY started_at DESC LIMIT ?');
      return (stmt.all(workflowId, limit) as any[]).map(row => this.rowToExecution(row));
    } else {
      stmt = this.db.prepare('SELECT * FROM executions ORDER BY started_at DESC LIMIT ?');
      return (stmt.all(limit) as any[]).map(row => this.rowToExecution(row));
    }
  }

  /**
   * 更新执行记录
   */
  async updateExecution(execution: WorkflowExecution): Promise<void> {
    await this.saveExecution(execution);
  }

  /**
   * 删除执行记录
   */
  async deleteExecution(id: string): Promise<void> {
    await this.initialize();
    
    const stmt = this.db.prepare('DELETE FROM executions WHERE id = ?');
    stmt.run(id);
  }

  /**
   * 行数据转换为执行对象
   */
  private rowToExecution(row: any): WorkflowExecution {
    return {
      id: row.id,
      workflowId: row.workflow_id,
      status: row.status,
      currentStep: row.current_step || undefined,
      variables: JSON.parse(row.variables || '{}'),
      outputs: JSON.parse(row.outputs || '{}'),
      stepStatuses: JSON.parse(row.step_statuses || '{}'),
      error: row.error || undefined,
      startedAt: row.started_at,
      finishedAt: row.finished_at || undefined,
      pausedAt: row.paused_at || undefined,
    };
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}

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

  async listWorkflows(): Promise<any[]> {
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
}

/**
 * 存储工厂
 */
export function createStorage(type: 'sqlite' | 'memory', options?: { dbPath?: string }): StorageBackend {
  switch (type) {
    case 'sqlite':
      return new SQLiteStorage(options?.dbPath);
    case 'memory':
    default:
      return new MemoryStorage();
  }
}
