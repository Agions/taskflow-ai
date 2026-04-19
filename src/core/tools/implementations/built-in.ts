/**
 * Built-in Tools - 内置工具实现
 */

import { readFile, writeFile, readdir, stat } from 'fs/promises';
import { join } from 'path';
import { Tool, ToolContext, ToolResult, ToolHandler } from '../types';

/**
 * 读取文件工具
 */
export const fileReadTool: Tool = {
  name: 'file_read',
  description: '读取文件内容',
  category: 'filesystem',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: '文件路径',
      },
      encoding: {
        type: 'string',
        description: '文件编码',
        default: 'utf-8',
      },
      limit: {
        type: 'number',
        description: '读取行数限制',
      },
    },
    required: ['path'],
  },
  handler: async (params, context): Promise<ToolResult> => {
    try {
      const filePath = join(context.cwd, params.path as string);
      const content = await readFile(filePath, (params.encoding as BufferEncoding) || 'utf-8');

      let result = content.toString();
      if (params.limit && typeof params.limit === 'number') {
        const lines = result.split('\n');
        result = lines.slice(0, params.limit).join('\n');
      }

      return {
        success: true,
        output: result,
        format: 'text',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

/**
 * 写入文件工具
 */
export const fileWriteTool: Tool = {
  name: 'file_write',
  description: '写入文件内容',
  category: 'filesystem',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: '文件路径',
      },
      content: {
        type: 'string',
        description: '文件内容',
      },
      encoding: {
        type: 'string',
        description: '文件编码',
        default: 'utf-8',
      },
    },
    required: ['path', 'content'],
  },
  handler: async (params, context): Promise<ToolResult> => {
    try {
      const filePath = join(context.cwd, params.path as string);
      await writeFile(
        filePath,
        params.content as string,
        (params.encoding as BufferEncoding) || 'utf-8'
      );

      return {
        success: true,
        output: `文件已写入: ${params.path}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

/**
 * 列出目录工具
 */
export const fileListTool: Tool = {
  name: 'file_list',
  description: '列出目录文件',
  category: 'filesystem',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: '目录路径',
        default: '.',
      },
      recursive: {
        type: 'boolean',
        description: '是否递归',
        default: false,
      },
    },
  },
  handler: async (params, context): Promise<ToolResult> => {
    try {
      const dirPath = join(context.cwd, (params.path as string) || '.');
      const entries = await readdir(dirPath, { withFileTypes: true });

      const files = entries.map(entry => ({
        name: entry.name,
        type: entry.isDirectory() ? 'dir' : 'file',
        path: join(dirPath, entry.name),
      }));

      return {
        success: true,
        output: JSON.stringify(files, null, 2),
        format: 'json',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

/**
 * 文件搜索工具
 */
export const fileSearchTool: Tool = {
  name: 'file_search',
  description: '搜索文件',
  category: 'filesystem',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: '搜索路径',
        default: '.',
      },
      pattern: {
        type: 'string',
        description: '文件名模式 (支持 glob)',
      },
      content: {
        type: 'string',
        description: '文件内容搜索',
      },
    },
  },
  handler: async (params, context): Promise<ToolResult> => {
    try {
      // 简化实现：只返回搜索提示
      return {
        success: true,
        output: `在 ${params.path || '.'} 中搜索: ${params.pattern || params.content || '所有文件'}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

/**
 * Bash 命令执行工具
 */
export const bashTool: Tool = {
  name: 'bash',
  description: '执行 Bash 命令',
  category: 'system',
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: '要执行的命令',
      },
      timeout: {
        type: 'number',
        description: '超时时间 (ms)',
        default: 30000,
      },
    },
    required: ['command'],
  },
  timeout: 60000,
  retryable: true,
  handler: async (params, _context): Promise<ToolResult> => {
    return new Promise(resolve => {
      const { exec } = require('child_process');
      const command = params.command as string;
      const timeout = (params.timeout as number) || 30000;

      const child = exec(
        command,
        { timeout },
        async (error: Error | null, stdout: string, stderr: string) => {
          if (error) {
            resolve({
              success: false,
              error: stderr || error.message,
              output: stdout,
            });
          } else {
            resolve({
              success: true,
              output: stdout,
            });
          }
        }
      );
    });
  },
};

/**
 * Git 命令工具
 */
export const gitTool: Tool = {
  name: 'git',
  description: '执行 Git 命令',
  category: 'system',
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'Git 命令 (不含 git 前缀)',
      },
    },
    required: ['command'],
  },
  timeout: 30000,
  handler: async (params, context): Promise<ToolResult> => {
    return new Promise(resolve => {
      const { exec } = require('child_process');
      const command = `git ${params.command}`;

      exec(command, { cwd: context.cwd }, (error: Error | null, stdout: string, stderr: string) => {
        if (error) {
          resolve({
            success: false,
            error: stderr || error.message,
            output: stdout,
          });
        } else {
          resolve({
            success: true,
            output: stdout,
          });
        }
      });
    });
  },
};

/**
 * HTTP 请求工具
 */
export const httpRequestTool: Tool = {
  name: 'http_request',
  description: '发送 HTTP 请求',
  category: 'network',
  parameters: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: '请求 URL',
      },
      method: {
        type: 'string',
        description: 'HTTP 方法',
        enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        default: 'GET',
      },
      headers: {
        type: 'object',
        description: '请求头',
      },
      body: {
        type: 'string',
        description: '请求体',
      },
    },
    required: ['url'],
  },
  timeout: 30000,
  handler: async (params): Promise<ToolResult> => {
    try {
      const response = await fetch(params.url as string, {
        method: (params.method as string) || 'GET',
        headers: params.headers as Record<string, string>,
        body: params.body as string,
      });

      const text = await response.text();

      return {
        success: response.ok,
        output: text,
        metadata: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

/**
 * 获取所有内置工具
 */
export function getBuiltInTools(): Tool[] {
  return [
    fileReadTool,
    fileWriteTool,
    fileListTool,
    fileSearchTool,
    bashTool,
    gitTool,
    httpRequestTool,
  ];
}
