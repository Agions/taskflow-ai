/**
 * 代码执行器工具
 * 支持多种编程语言的代码执行
 */

import { MCPTool } from './types';

export interface CodeExecutorOptions {
  /** 最大执行时间 (ms) */
  timeout?: number;
  /** 允许的语言 */
  allowedLanguages?: string[];
  /** 内存限制 (MB) */
  memoryLimit?: number;
}

/**
 * 代码执行器工具集
 */
export const codeExecutorTools: MCPTool[] = [
  {
    name: 'code_execute',
    description: 'Execute code in a sandboxed environment. Supports JavaScript, Python, and more.',
    inputSchema: {
      type: 'object',
      properties: {
        language: {
          type: 'string',
          enum: ['javascript', 'python', 'bash', 'typescript'],
          description: 'Programming language to execute',
        },
        code: {
          type: 'string',
          description: 'Code to execute',
        },
        timeout: {
          type: 'number',
          description: 'Execution timeout in milliseconds (default: 30000)',
        },
      },
      required: ['language', 'code'],
    },
  },
  {
    name: 'code_eval',
    description: 'Evaluate a JavaScript expression and return the result.',
    inputSchema: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'JavaScript expression to evaluate',
        },
        context: {
          type: 'object',
          description: 'Optional context object',
        },
      },
      required: ['expression'],
    },
  },
  {
    name: 'code_parse',
    description: 'Parse and analyze code structure without execution.',
    inputSchema: {
      type: 'object',
      properties: {
        language: {
          type: 'string',
          enum: ['javascript', 'typescript', 'python'],
          description: 'Programming language',
        },
        code: {
          type: 'string',
          description: 'Code to parse',
        },
        options: {
          type: 'object',
          properties: {
            ast: { type: 'boolean', description: 'Return AST' },
            tokens: { type: 'boolean', description: 'Return tokens' },
          },
        },
      },
      required: ['language', 'code'],
    },
  },
];

export default codeExecutorTools;
