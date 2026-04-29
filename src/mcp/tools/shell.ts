import { getLogger } from '../../utils/logger';
/**
 * Shell 工具 - 命令执行
 */

import { ToolDefinition, PermissionLevel } from './types';
import { execSync, spawn } from 'child_process';
import { promisify } from 'util';
import { validateCommand } from '../security/validator';
const logger = getLogger('mcp/tools/shell');

const execAsync = promisify(execSync);

export const shellTools: ToolDefinition[] = [
  {
    name: 'shell_exec',
    description: '执行 shell 命令（白名单验证）',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: '要执行的命令' },
        cwd: { type: 'string', description: '工作目录' },
        timeout: { type: 'number', description: '超时时间(秒)', default: 30 },
        env: {
          type: 'object',
          description: '环境变量',
          additionalProperties: { type: 'string' },
        },
      },
      required: ['command'],
    },
    handler: async input => {
      const command = input.command as string;

      // 验证命令安全性
      const validation = validateCommand(command);
      if (!validation.valid) {
        return {
          success: false,
          error: `命令验证失败: ${validation.reason}`,
          command,
        };
      }

      const cwd = (input.cwd as string) || process.cwd();
      const timeout = ((input.timeout as number) || 30) * 1000;
      const env = { ...process.env, ...(input.env as Record<string, string>) };

      try {
        const startTime = Date.now();
        const result = execSync(command, {
          cwd,
          timeout,
          shell: '/bin/bash',
          env,
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024, // 10MB
        });

        return {
          success: true,
          output: result,
          command,
          cwd,
          duration: Date.now() - startTime,
        };
      } catch (error: any) {
        const err = error as { stdout?: string; stderr?: string; status?: number };
        let errorMessage: string;
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof err === 'object' && err !== null) {
          errorMessage = err.stderr || String(error);
        } else {
          errorMessage = String(error);
        }
        return {
          success: false,
          output: err.stdout || '',
          error: errorMessage,
          stderr: err.stderr || '',
          command,
          cwd,
          exitCode: err.status || 1,
        };
      }
    },
    category: 'shell',
    tags: ['shell', 'exec', 'command'],
    permissions: [PermissionLevel.EXECUTE],
  },
  {
    name: 'shell_exec_async',
    description: '异步执行 shell 命令 (长时间运行，白名单验证)',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: '要执行的命令' },
        cwd: { type: 'string', description: '工作目录' },
        env: {
          type: 'object',
          description: '环境变量',
          additionalProperties: { type: 'string' },
        },
      },
      required: ['command'],
    },
    handler: async input => {
      const command = input.command as string;

      // 验证命令安全性
      const validation = validateCommand(command);
      if (!validation.valid) {
        return {
          success: false,
          error: `命令验证失败: ${validation.reason}`,
          command,
        };
      }

      const cwd = (input.cwd as string) || process.cwd();
      const env = { ...process.env, ...(input.env as Record<string, string>) };

      return new Promise(resolve => {
        const child = spawn('/bin/bash', ['-c', command], {
          cwd,
          env,
        });

        let stdout = '';
        let stderr = '';

        child.stdout?.on('data', data => {
          stdout += data.toString();
        });

        child.stderr?.on('data', data => {
          stderr += data.toString();
        });

        child.on('close', code => {
          resolve({
            success: code === 0,
            output: stdout,
            stderr,
            exitCode: code,
            pid: child.pid,
          });
        });

        child.on('error', error => {
          resolve({
            success: false,
            error:
              error instanceof Error
                ? error instanceof Error
                  ? error.message
                  : String(error)
                : String(error),
            pid: child.pid,
          });
        });
      });
    },
    category: 'shell',
    tags: ['shell', 'exec', 'async', 'background'],
    permissions: [PermissionLevel.EXECUTE],
  },
  {
    name: 'shell_test',
    description: '测试命令是否可用',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: '要测试的命令' },
      },
      required: ['command'],
    },
    handler: async input => {
      const command = `command -v ${input.command}`;
      try {
        execSync(command, { encoding: 'utf-8' });
        return { available: true, command: input.command };
      } catch {
        return { available: false, command: input.command };
      }
    },
    category: 'shell',
    tags: ['shell', 'test', 'which'],
  }
  // shell_kill 工具已移除 - 安全原因
  // 原因：进程管理是操作系统的职责，MCP Server 不应提供进程终止功能
  // 如果需要终止进程，请使用操作系统的进程管理工具（如 kill 命令）
];
