import { getLogger } from '../../utils/logger';
/**
 * SQLite 存储后端
 */

import { WorkflowExecution } from './types';
import { StorageBackend } from './storage-types';
import { Logger } from '../../utils/logger';
const logger = getLogger('core/workflow/sqlite-storage');


export class SQLiteStorage implements StorageBackend {
  private logger = Logger.getInstance('SQLiteStorage');
  private db: unknown = null;
  private initialized = false;

  constructor(private dbPath: string = './taskflow.db') {}

  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const Database = require('better-sqlite3');
      this.db = new Database(this.dbPath);

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

  async saveWorkflow(workflow: unknown): Promise<void> {
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

  async getWorkflow(id: string): Promise<any | null> {
    await this.initialize();
    const stmt = this.db.prepare('SELECT * FROM workflows WHERE id = ?');
    const row = stmt.get(id);
    if (!row) return null;
    return { ...JSON.parse(row.definition), createdAt: row.created_at, updatedAt: row.updated_at };
  }

  async listWorkflows(): Promise<unknown[]> {
    await this.initialize();
    const stmt = this.db.prepare(
      'SELECT id, name, version, description, created_at FROM workflows ORDER BY updated_at DESC'
    );
    return stmt.all();
  }

  async deleteWorkflow(id: string): Promise<void> {
    await this.initialize();
    const stmt = this.db.prepare('DELETE FROM workflows WHERE id = ?');
    stmt.run(id);
  }

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

  async getExecution(id: string): Promise<WorkflowExecution | null> {
    await this.initialize();
    const stmt = this.db.prepare('SELECT * FROM executions WHERE id = ?');
    const row = stmt.get(id);
    if (!row) return null;
    return this.rowToExecution(row);
  }

  async listExecutions(workflowId?: string, limit: number = 50): Promise<WorkflowExecution[]> {
    await this.initialize();
    if (workflowId) {
      const stmt = this.db.prepare(
        'SELECT * FROM executions WHERE workflow_id = ? ORDER BY started_at DESC LIMIT ?'
      );
      return (stmt.all(workflowId, limit) as unknown[]).map(row => this.rowToExecution(row));
    } else {
      const stmt = this.db.prepare('SELECT * FROM executions ORDER BY started_at DESC LIMIT ?');
      return (stmt.all(limit) as unknown[]).map(row => this.rowToExecution(row));
    }
  }

  async updateExecution(execution: WorkflowExecution): Promise<void> {
    await this.saveExecution(execution);
  }

  async deleteExecution(id: string): Promise<void> {
    await this.initialize();
    const stmt = this.db.prepare('DELETE FROM executions WHERE id = ?');
    stmt.run(id);
  }

  private rowToExecution(row: unknown): WorkflowExecution {
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

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}
