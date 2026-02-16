/**
 * 执行引擎
 * 执行任务计划中的各项任务
 */

import {
  TaskPlan,
  Task,
  TaskType,
  ExecutionResult,
  TaskResult,
  ExecutionContext,
  ExecutionSummary
} from '../types';
import { MCPServer } from '../../mcp/server';
import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class ExecutionEngine {
  private mcpServer: MCPServer;
  private context: ExecutionContext;
  private abortController: AbortController;

  constructor(mcpServer: MCPServer, context: ExecutionContext) {
    this.mcpServer = mcpServer;
    this.context = context;
    this.abortController = new AbortController();
  }

  /**
   * 执行任务计划
   */
  async execute(plan: TaskPlan): Promise<ExecutionResult> {
    console.log(`🚀 Starting execution of ${plan.tasks.length} tasks...`);

    const results: TaskResult[] = [];
    const startTime = Date.now();

    // 拓扑排序，按依赖顺序执行
    const sortedTasks = this.topologicalSort(plan.tasks, plan.dependencies);

    for (const task of sortedTasks) {
      // 检查是否已中止
      if (this.abortController.signal.aborted) {
        console.log('⏹️  Execution aborted');
        break;
      }

      console.log(`\n📝 Task: ${task.title}`);
      console.log(`   Type: ${task.type} | Priority: ${task.priority} | Estimate: ${task.estimate}h`);

      try {
        const result = await this.executeTask(task);
        results.push(result);

        if (!result.success) {
          console.error(`   ❌ Failed: ${result.error}`);

          if (!this.context.config.continueOnError) {
            console.log('⏹️  Stopping execution due to failure');
            break;
          }
        } else {
          console.log(`   ✅ Completed in ${result.duration}ms`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`   ❌ Error: ${errorMessage}`);

        results.push({
          taskId: task.id,
          success: false,
          error: errorMessage,
          duration: 0
        });

        if (!this.context.config.continueOnError) {
          break;
        }
      }
    }

    const endTime = Date.now();
    const summary = this.calculateSummary(results);

    console.log(`\n📊 Execution Summary:`);
    console.log(`   Total: ${summary.totalTasks} | Completed: ${summary.completedTasks} | Failed: ${summary.failedTasks}`);
    console.log(`   Duration: ${(endTime - startTime) / 1000}s`);

    return {
      results,
      completedAt: new Date(),
      success: summary.failedTasks === 0,
      summary
    };
  }

  /**
   * 中止执行
   */
  abort(): void {
    this.abortController.abort();
  }

  /**
   * 执行单个任务
   */
  private async executeTask(task: Task): Promise<TaskResult> {
    const startTime = Date.now();

    switch (task.type) {
      case 'code':
        return await this.executeCodeTask(task, startTime);
      case 'file':
        return await this.executeFileTask(task, startTime);
      case 'shell':
        return await this.executeShellTask(task, startTime);
      case 'analysis':
        return await this.executeAnalysisTask(task, startTime);
      case 'design':
        return await this.executeDesignTask(task, startTime);
      case 'test':
        return await this.executeTestTask(task, startTime);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  /**
   * 执行代码任务
   */
  private async executeCodeTask(task: Task, startTime: number): Promise<TaskResult> {
    console.log(`   💻 Generating code...`);

    // 这里应该调用代码生成引擎
    // 简化实现：创建文件并写入模板代码
    if (task.outputPath) {
      const fullPath = path.join(this.context.projectPath, task.outputPath);
      await fs.ensureDir(path.dirname(fullPath));

      // 生成代码内容（实际应该调用 AI）
      const code = this.generateCodeTemplate(task);
      await fs.writeFile(fullPath, code, 'utf-8');

      return {
        taskId: task.id,
        success: true,
        output: code,
        duration: Date.now() - startTime,
        artifacts: [fullPath]
      };
    }

    return {
      taskId: task.id,
      success: true,
      duration: Date.now() - startTime
    };
  }

  /**
   * 执行文件任务
   */
  private async executeFileTask(task: Task, startTime: number): Promise<TaskResult> {
    console.log(`   📄 Processing file...`);

    if (task.outputPath) {
      const fullPath = path.join(this.context.projectPath, task.outputPath);
      await fs.ensureDir(path.dirname(fullPath));

      // 使用 MCP 工具
      const result = await this.mcpServer.callTool('file_write', {
        path: fullPath,
        content: task.description
      });

      return {
        taskId: task.id,
        success: result.success,
        output: result.data as string,
        duration: Date.now() - startTime,
        artifacts: result.success ? [fullPath] : undefined
      };
    }

    return {
      taskId: task.id,
      success: true,
      duration: Date.now() - startTime
    };
  }

  /**
   * 执行 Shell 任务
   */
  private async executeShellTask(task: Task, startTime: number): Promise<TaskResult> {
    console.log(`   🖥️  Executing shell command...`);

    // 解析命令
    const command = this.parseShellCommand(task.description);

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.context.projectPath,
        timeout: this.context.config.timeout,
        signal: this.abortController.signal
      });

      return {
        taskId: task.id,
        success: true,
        output: stdout,
        duration: Date.now() - startTime
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        taskId: task.id,
        success: false,
        error: errorMessage,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * 执行分析任务
   */
  private async executeAnalysisTask(task: Task, startTime: number): Promise<TaskResult> {
    console.log(`   🔍 Analyzing...`);

    // 使用 MCP 工具分析项目
    const result = await this.mcpServer.callTool('project_analyze', {
      path: this.context.projectPath
    });

    return {
      taskId: task.id,
      success: result.success,
      output: JSON.stringify(result.data, null, 2),
      duration: Date.now() - startTime
    };
  }

  /**
   * 执行设计任务
   */
  private async executeDesignTask(task: Task, startTime: number): Promise<TaskResult> {
    console.log(`   🎨 Processing design...`);

    // 设计任务通常是创建设计文档或资源
    if (task.outputPath) {
      const fullPath = path.join(this.context.projectPath, task.outputPath);
      await fs.ensureDir(path.dirname(fullPath));

      const designDoc = this.generateDesignDoc(task);
      await fs.writeFile(fullPath, designDoc, 'utf-8');

      return {
        taskId: task.id,
        success: true,
        output: designDoc,
        duration: Date.now() - startTime,
        artifacts: [fullPath]
      };
    }

    return {
      taskId: task.id,
      success: true,
      duration: Date.now() - startTime
    };
  }

  /**
   * 执行测试任务
   */
  private async executeTestTask(task: Task, startTime: number): Promise<TaskResult> {
    console.log(`   🧪 Running tests...`);

    try {
      const { stdout, stderr } = await execAsync('npm test', {
        cwd: this.context.projectPath,
        timeout: this.context.config.timeout,
        signal: this.abortController.signal
      });

      return {
        taskId: task.id,
        success: true,
        output: stdout,
        duration: Date.now() - startTime
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        taskId: task.id,
        success: false,
        error: errorMessage,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * 拓扑排序
   */
  private topologicalSort(tasks: Task[], dependencies: any[]): Task[] {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const inDegree = new Map<string, number>();
    const graph = new Map<string, string[]>();

    // 初始化
    for (const task of tasks) {
      inDegree.set(task.id, 0);
      graph.set(task.id, []);
    }

    // 构建图
    for (const dep of dependencies) {
      const next = graph.get(dep.from) || [];
      next.push(dep.to);
      graph.set(dep.from, next);
      inDegree.set(dep.to, (inDegree.get(dep.to) || 0) + 1);
    }

    // 添加显式依赖
    for (const task of tasks) {
      for (const depId of task.dependencies) {
        if (taskMap.has(depId)) {
          const next = graph.get(depId) || [];
          if (!next.includes(task.id)) {
            next.push(task.id);
            graph.set(depId, next);
            inDegree.set(task.id, (inDegree.get(task.id) || 0) + 1);
          }
        }
      }
    }

    // Kahn 算法
    const queue: string[] = [];
    const result: Task[] = [];

    for (const [taskId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(taskId);
      }
    }

    while (queue.length > 0) {
      const taskId = queue.shift()!;
      const task = taskMap.get(taskId);
      if (task) {
        result.push(task);
      }

      const nextTasks = graph.get(taskId) || [];
      for (const nextId of nextTasks) {
        const newDegree = (inDegree.get(nextId) || 0) - 1;
        inDegree.set(nextId, newDegree);
        if (newDegree === 0) {
          queue.push(nextId);
        }
      }
    }

    // 检查是否有环
    if (result.length !== tasks.length) {
      console.warn('⚠️  Circular dependencies detected');
      // 返回原始顺序
      return tasks;
    }

    return result;
  }

  /**
   * 解析 Shell 命令
   */
  private parseShellCommand(description: string): string {
    // 从描述中提取命令
    // 支持格式："Run: npm install" 或 "Execute: git init"
    const match = description.match(/(?:run|execute|command):?\s*(.+)/i);
    if (match) {
      return match[1].trim();
    }
    return description;
  }

  /**
   * 生成代码模板
   */
  private generateCodeTemplate(task: Task): string {
    const componentName = task.title.replace(/\s+/g, '');

    return `import React from 'react';

export interface ${componentName}Props {
  // TODO: Define props
}

export const ${componentName}: React.FC<${componentName}Props> = (props) => {
  return (
    <div>
      {/* TODO: Implement ${task.title} */}
      <h1>${task.title}</h1>
      <p>${task.description}</p>
    </div>
  );
};

export default ${componentName};
`;
  }

  /**
   * 生成设计文档
   */
  private generateDesignDoc(task: Task): string {
    return `# Design: ${task.title}

## Overview
${task.description}

## Design Decisions
- TODO: Add design decisions

## Implementation Notes
- TODO: Add implementation notes

## References
- TODO: Add references
`;
  }

  /**
   * 计算执行摘要
   */
  private calculateSummary(results: TaskResult[]): ExecutionSummary {
    return {
      totalTasks: results.length,
      completedTasks: results.filter(r => r.success).length,
      failedTasks: results.filter(r => !r.success).length,
      totalDuration: results.reduce((sum, r) => sum + r.duration, 0)
    };
  }
}

export default ExecutionEngine;
