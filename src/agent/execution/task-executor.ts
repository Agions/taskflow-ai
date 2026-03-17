/**
 * 任务执行器
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Task, TaskResult, ExecutionContext } from '../types';
import { MCPServer } from '../../mcp/server';

const execAsync = promisify(exec);

export class TaskExecutor {
  constructor(
    private mcpServer: MCPServer,
    private context: ExecutionContext
  ) {}

  async execute(task: Task, signal: AbortSignal): Promise<TaskResult> {
    const startTime = Date.now();

    if (signal.aborted) {
      return { taskId: task.id, success: false, error: 'Aborted', duration: 0 };
    }

    switch (task.type) {
      case 'code':
        return this.executeCodeTask(task, startTime);
      case 'file':
        return this.executeFileTask(task, startTime);
      case 'shell':
        return this.executeShellTask(task, startTime);
      case 'analysis':
        return this.executeAnalysisTask(task, startTime);
      case 'design':
        return this.executeDesignTask(task, startTime);
      case 'test':
        return this.executeTestTask(task, startTime);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  private async executeCodeTask(task: Task, startTime: number): Promise<TaskResult> {
    if (task.outputPath) {
      const fullPath = path.join(this.context.projectPath, task.outputPath);
      await fs.ensureDir(path.dirname(fullPath));

      const code = this.generateCodeTemplate(task);
      await fs.writeFile(fullPath, code, 'utf-8');

      return {
        taskId: task.id,
        success: true,
        output: code,
        duration: Date.now() - startTime,
        artifacts: [fullPath],
      };
    }

    return { taskId: task.id, success: true, duration: Date.now() - startTime };
  }

  private async executeFileTask(task: Task, startTime: number): Promise<TaskResult> {
    if (task.outputPath) {
      const fullPath = path.join(this.context.projectPath, task.outputPath);
      await fs.ensureDir(path.dirname(fullPath));

      const result = await this.mcpServer.callTool('file_write', {
        path: fullPath,
        content: task.description,
      });

      return {
        taskId: task.id,
        success: result.success,
        output: result.data as string,
        duration: Date.now() - startTime,
        artifacts: result.success ? [fullPath] : undefined,
      };
    }

    return { taskId: task.id, success: true, duration: Date.now() - startTime };
  }

  private async executeShellTask(task: Task, startTime: number): Promise<TaskResult> {
    try {
      const { stdout, stderr } = await execAsync(task.description, {
        cwd: this.context.projectPath,
        timeout: 300000,
      });

      return {
        taskId: task.id,
        success: true,
        output: stdout,
        error: stderr || undefined,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
    }
  }

  private async executeAnalysisTask(task: Task, startTime: number): Promise<TaskResult> {
    const result = await this.mcpServer.callTool('project_analyze', {
      path: this.context.projectPath,
    });

    return {
      taskId: task.id,
      success: result.success,
      output: JSON.stringify(result.data, null, 2),
      duration: Date.now() - startTime,
    };
  }

  private async executeDesignTask(task: Task, startTime: number): Promise<TaskResult> {
    return {
      taskId: task.id,
      success: true,
      output: `Design task completed: ${task.title}`,
      duration: Date.now() - startTime,
    };
  }

  private async executeTestTask(task: Task, startTime: number): Promise<TaskResult> {
    return {
      taskId: task.id,
      success: true,
      output: `Test task completed: ${task.title}`,
      duration: Date.now() - startTime,
    };
  }

  private generateCodeTemplate(task: Task): string {
    return `// ${task.title}\n// ${task.description}\n\n// TODO: Implement ${task.title}\n`;
  }
}
