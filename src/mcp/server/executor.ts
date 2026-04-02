import { getLogger } from '../../utils/logger';
/**
 * MCP 工具执行器
 */

import { execSync } from 'child_process';
const logger = getLogger('mcp/server/executor');

import path from 'path';
import fs from 'fs-extra';

interface TerminalArgs {
  command: string;
  cwd?: string;
  timeout?: number;
}

interface ProjectAnalyzeArgs {
  path?: string;
  depth?: number;
}

export class MCPToolExecutor {
  async execute(name: string, args: Record<string, unknown>): Promise<unknown> {
    switch (name) {
      case 'terminal_execute':
        return this.executeTerminal(args as any);
      case 'project_analyze':
        return this.executeProjectAnalyze(args as ProjectAnalyzeArgs);
      case 'task_create':
        return this.executeTaskCreate(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
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

    const shellMetacharacters = /[;&|`$(){}[\]<>\\!*?]/;
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
    } catch (error: any) {
      const err = error as { message?: string };
      throw new Error(`Command failed: ${err.message || String(error)}`);
    }
  }

  private async executeProjectAnalyze(args: ProjectAnalyzeArgs): Promise<unknown> {
    const { path: projectPath = process.cwd(), depth = 3 } = args;

    const analysis: any = {
      path: projectPath,
      files: 0,
      directories: 0,
      languages: {},
      structure: [],
    };

    const scanDirectory = async (dirPath: string, currentDepth: number): Promise<unknown[]> => {
      if (currentDepth > depth) return [];

      const items = await fs.readdir(dirPath, { withFileTypes: true });
      const results: any[] = [];

      for (const item of items as any[]) {
        const fullPath = path.join(dirPath, item.name);
        if (item.isDirectory()) {
          analysis.directories++;
          if (currentDepth < depth) {
            const subResults = await scanDirectory(fullPath, currentDepth + 1);
            results.push({ type: 'directory', name: item.name, children: subResults });
          }
        } else {
          analysis.files++;
          const ext = path.extname(item.name).slice(1);
          (analysis.languages as Record<string, number>)[ext] =
            ((analysis.languages as Record<string, number>)[ext] || 0) + 1;
          results.push({ type: 'file', name: item.name, size: (await fs.stat(fullPath)).size });
        }
      }

      return results;
    };

    analysis.structure = await scanDirectory(projectPath, 0);
    return analysis;
  }

  private executeTaskCreate(args: any): { id: string; status: string } {
    return { id: 'task-' + Date.now(), status: 'created' };
  }
}
