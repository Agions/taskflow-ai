/**
 * MCP 工具执行器
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs-extra';

export class MCPToolExecutor {
  async execute(name: string, args: any): Promise<any> {
    switch (name) {
      case 'terminal_execute':
        return this.executeTerminal(args);
      case 'project_analyze':
        return this.executeProjectAnalyze(args);
      case 'task_create':
        return this.executeTaskCreate(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private executeTerminal(args: any): { output: string; command: string } {
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

    // 安全检查：检测 shell 元字符以防止命令注入
    const shellMetacharacters = /[;&|`$(){}[\]<>\\!*?]/;
    if (shellMetacharacters.test(command)) {
      throw new Error('Command contains forbidden shell metacharacters');
    }

    // 安全检查：检测命令替换模式
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
      throw new Error(`Command failed: ${error.message}`);
    }
  }

  private async executeProjectAnalyze(args: any): Promise<any> {
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

      const items: any[] = [];
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

          const fullPath = path.join(dirPath, entry.name);

          if (entry.isDirectory()) {
            analysis.directories++;
            const children = await scanDirectory(fullPath, currentDepth + 1);
            items.push({ name: entry.name, type: 'directory', children });
          } else {
            analysis.files++;
            const ext = path.extname(entry.name);
            if (ext) {
              analysis.languages[ext] = (analysis.languages[ext] || 0) + 1;
            }
            items.push({ name: entry.name, type: 'file', extension: ext || null });
          }
        }
      } catch {}

      return items;
    };

    analysis.structure = await scanDirectory(projectPath, 0);
    return analysis;
  }

  private async executeTaskCreate(args: any): Promise<any> {
    const { title, description = '', type = 'general', priority = 'medium' } = args;

    if (!title) {
      throw new Error('Title is required');
    }

    const task = {
      id: `task-${Date.now()}`,
      title,
      description,
      type,
      priority,
      status: 'todo',
      createdAt: new Date().toISOString(),
    };

    const tasksDir = path.join(process.cwd(), '.taskflow', 'tasks');
    await fs.ensureDir(tasksDir);
    await fs.writeJson(path.join(tasksDir, `${task.id}.json`), task, { spaces: 2 });

    return task;
  }
}
