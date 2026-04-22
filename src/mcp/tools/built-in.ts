import { getLogger } from '../../utils/logger';
/**
 * 内置工具定义
 */

import { ToolDefinition } from './types';
const logger = getLogger('mcp/tools/built-in');

export const fileTools: ToolDefinition[] = [
  {
    name: 'file_read',
    description: '读取文件内容',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '文件路径' },
        offset: { type: 'number', description: '起始行' },
        limit: { type: 'number', description: '读取行数' },
      },
      required: ['path'],
    },
    handler: async input => {
      const fs = await import('fs/promises');
      const path = await import('path');
      const content = await fs.readFile(input.path as string, 'utf-8');
      const lines = content.split('\n');
      const offset = (input.offset as number) || 0;
      const limit = (input.limit as number) || lines.length;
      return {
        content: lines.slice(offset, offset + limit).join('\n'),
        totalLines: lines.length,
        path: path.resolve(input.path as string),
      };
    },
    category: 'file',
    tags: ['read', 'file'],
  },
  {
    name: 'file_write',
    description: '写入文件内容',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '文件路径' },
        content: { type: 'string', description: '文件内容' },
        mode: { type: 'string', description: '写入模式: write|append' },
      },
      required: ['path', 'content'],
    },
    handler: async input => {
      const fs = await import('fs/promises');
      const path = await import('path');
      const mode = (input.mode as string) || 'write';
      const fullPath = path.resolve(input.path as string);
      if (mode === 'append') {
        await fs.appendFile(fullPath, input.content as string);
      } else {
        await fs.writeFile(fullPath, input.content as string);
      }
      return { success: true, path: fullPath };
    },
    category: 'file',
    tags: ['write', 'file'],
  },
  {
    name: 'file_edit',
    description: '编辑文件局部内容',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '文件路径' },
        oldText: { type: 'string', description: '要替换的文本' },
        newText: { type: 'string', description: '替换后的文本' },
      },
      required: ['path', 'oldText', 'newText'],
    },
    handler: async input => {
      const fs = await import('fs/promises');
      const path = await import('path');
      const fullPath = path.resolve(input.path as string);
      let content = await fs.readFile(fullPath, 'utf-8');
      const oldText = input.oldText as string;
      const newText = input.newText as string;
      if (!content.includes(oldText)) {
        throw new Error('未找到要替换的文本');
      }
      content = content.replace(oldText, newText);
      await fs.writeFile(fullPath, content);
      return { success: true, path: fullPath };
    },
    category: 'file',
    tags: ['edit', 'file'],
  },
];

export const shellTools: ToolDefinition[] = [
  {
    name: 'shell_exec',
    description: '执行 shell 命令',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: '命令' },
        cwd: { type: 'string', description: '工作目录' },
        timeout: { type: 'number', description: '超时(秒)' },
      },
      required: ['command'],
    },
    handler: async input => {
      const { execSync } = await import('child_process');
      const { validateCommand } = await import('../security/validator');
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

      const result = execSync(command, {
        cwd: (input.cwd as string) || process.cwd(),
        timeout: ((input.timeout as number) || 30) * 1000,
        encoding: 'utf-8',
      });
      return { output: result, command };
    },
    category: 'shell',
    tags: ['shell', 'exec'],
  },
];

export const taskTools: ToolDefinition[] = [
  {
    name: 'task_create',
    description: '创建任务',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '任务标题' },
        description: { type: 'string', description: '任务描述' },
        priority: { type: 'string', description: '优先级' },
      },
      required: ['title'],
    },
    handler: async input => {
      return {
        id: `task-${Date.now()}`,
        title: input.title,
        description: input.description || '',
        priority: input.priority || 'medium',
        status: 'todo',
        createdAt: new Date().toISOString(),
      };
    },
    category: 'task',
    tags: ['task', 'create'],
  },
];

export const allBuiltInTools: ToolDefinition[] = [...fileTools, ...shellTools, ...taskTools];
