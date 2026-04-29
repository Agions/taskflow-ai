import { getLogger } from '../../utils/logger';
/**
 * MCP 工具执行器
 */

import { execSync } from 'child_process';
import { ToolResponse, toolOk, toolError } from '../tools/types';
const logger = getLogger('mcp/server/executor');

import path = require('path');
import fs = require('fs-extra');

interface TerminalArgs {
  command: string;
  cwd?: string;
  timeout?: number;
}

interface ProjectAnalyzeArgs {
  path?: string;
  depth?: number;
}

interface ProjectAnalysisResult {
  path: string;
  files: number;
  directories: number;
  languages: Record<string, number>;
  structure: ProjectScanItem[];
}

interface ProjectScanItem {
  type: 'file' | 'directory';
  name: string;
  size?: number;
  children?: ProjectScanItem[];
}

interface TaskCreateArgs {
  title?: string;
  description?: string;
  type?: string;
  priority?: string;
}

export class MCPToolExecutor {
  /** 默认超时时间（毫秒）*/
  private readonly DEFAULT_TIMEOUT = 30000; // 30秒

  /**
   * 执行工具（带超时控制）
   */
  async execute(name: string, args: Record<string, unknown>): Promise<ToolResponse<unknown>> {
    const startTime = Date.now();
    const timeoutMs = (args.timeout as number) || this.DEFAULT_TIMEOUT;

    try {
      // 使用 Promise.race 实现超时控制
      const result = await Promise.race([
        this.executeInternal(name, args, startTime),
        this.createTimeoutPromise(timeoutMs, name)
      ]);
      return result;
    } catch (error) {
      if (error === 'TIMEOUT') {
        return toolError('TIMEOUT', `Tool execution timeout after ${timeoutMs}ms`, {
          tool: name,
          duration: Date.now() - startTime,
        });
      }
      return toolError('EXECUTION_ERROR', error instanceof Error ? error.message : String(error), {
        tool: name,
        duration: Date.now() - startTime,
      });
    }
  }

  /**
   * 内部执行逻辑
   */
  private async executeInternal(
    name: string, 
    args: Record<string, unknown>,
    startTime: number
  ): Promise<ToolResponse<unknown>> {
    try {
      switch (name) {
        case 'terminal_execute':
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return toolOk(this.executeTerminal(args as any), {
            tool: name,
            duration: Date.now() - startTime,
          });
        case 'project_analyze':
          return toolOk(await this.executeProjectAnalyze(args as ProjectAnalyzeArgs), {
            tool: name,
            duration: Date.now() - startTime,
          });
        case 'task_create':
          return toolOk(this.executeTaskCreate(args), {
            tool: name,
            duration: Date.now() - startTime,
          });
        default:
          return toolError('UNKNOWN_TOOL', `Unknown tool: ${name}`, {
            tool: name,
            duration: Date.now() - startTime,
          });
      }
    } catch (error) {
      throw error; // 重新抛出错误，由外部处理
    }
  }

  /**
   * 创建超时 Promise
   */
  private createTimeoutPromise(timeoutMs: number, toolName: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject('TIMEOUT');
      }, timeoutMs);
    });
  }

  private executeTerminal(args: TerminalArgs): { output: string; command: string } {
    const { command, cwd, timeout = 30 } = args;

    if (!command) {
      throw new Error('Command is required');
    }

    const allowedCommands = [
      'ls',
      'cat',
      'grep',
      'find',
      'head',
      'tail',
      'wc',
      'git',
      'npm',
      'node',
      'npx',
      'tsc',
      'eslint',
      'prettier',
      'mkdir',
      'touch',
      'rm',
      'cp',
      'mv',
      'echo',
      'pwd',
      'whoami',
      'date',
      'which',
    ];

    const shellMetacharacters = /[;&|`$(){}<>\\*!?]/;
    if (shellMetacharacters.test(command)) {
      throw new Error('Command contains forbidden shell metacharacters');
    }

    const commandSubstitution = /\$\(|`/;
    if (commandSubstitution.test(command)) {
      throw new Error('Command substitution is not allowed');
    }

    const cmdBase = command.trim().split(' ')[0];
    if (!allowedCommands.includes(cmdBase)) {
      throw new Error(`Command not allowed: ${cmdBase}`);
    }

    try {
      const result = execSync(command, {
        cwd: cwd || process.cwd(),
        timeout: timeout * 1000,
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024,
      });
      return { output: result, command };
    } catch (error: unknown) {
      const err = error as { message?: string };
      throw new Error(`Command failed: ${err.message || String(error)}`);
    }
  }

  private async executeProjectAnalyze(args: ProjectAnalyzeArgs): Promise<unknown> {
    const { path: projectPath = process.cwd(), depth = 3 } = args;

    const analysis: ProjectAnalysisResult = {
      path: projectPath,
      files: 0,
      directories: 0,
      languages: {},
      structure: [],
    };

    const scanDirectory = async (
      dirPath: string,
      currentDepth: number
    ): Promise<ProjectScanItem[]> => {
      if (currentDepth > depth) return [];

      const items = await fs.readdir(dirPath, { withFileTypes: true });
      const results: ProjectScanItem[] = [];

      for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        if (item.isDirectory()) {
          analysis.directories++;
          if (currentDepth < depth) {
            const subResults = await scanDirectory(fullPath, currentDepth + 1);
            results.push({ type: 'directory', name: item.name, children: subResults });
          } else {
            results.push({ type: 'directory', name: item.name });
          }
        } else {
          analysis.files++;
          const ext = path.extname(item.name).slice(1);
          analysis.languages[ext] = (analysis.languages[ext] || 0) + 1;
          results.push({ type: 'file', name: item.name, size: (await fs.stat(fullPath)).size });
        }
      }

      return results;
    };

    analysis.structure = await scanDirectory(projectPath, 0);
    return analysis;
  }

  private executeTaskCreate(args: TaskCreateArgs): { id: string; status: string; title?: string } {
    return { id: 'task-' + Date.now(), status: 'created', title: args.title };
  }
}
