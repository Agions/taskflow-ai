/**
 * 代码执行器工具 - 支持多语言代码执行
 */

import { ToolDefinition, PermissionLevel } from './types';
import { spawn } from 'child_process';
import * as vm from 'vm';

// JavaScript 沙箱执行
async function executeJavaScript(
  code: string,
  timeout: number = 5000
): Promise<{ output: string; error?: string }> {
  return new Promise(resolve => {
    const timeoutId = setTimeout(() => {
      resolve({ output: '', error: 'Execution timeout' });
    }, timeout);

    try {
      const context = {
        console: {
          log: (...args: unknown[]) => outputs.push(args.map(String).join(' ')),
          error: (...args: unknown[]) => outputs.push('[ERROR] ' + args.map(String).join(' ')),
          warn: (...args: unknown[]) => outputs.push('[WARN] ' + args.map(String).join(' ')),
        },
        setTimeout,
        setInterval,
        clearTimeout,
        clearInterval,
        Math,
        Date,
        JSON,
        Array,
        Object,
        String,
        Number,
        Boolean,
        Map,
        Set,
        Promise,
        RegExp,
        Error,
        TypeError,
        SyntaxError,
      };

      vm.createContext(context);
      const outputs: string[] = [];

      const result = vm.runInContext(code, context, { timeout });

      if (result !== undefined) {
        outputs.push(String(result));
      }

      clearTimeout(timeoutId);
      resolve({ output: outputs.join('\n') });
    } catch (error: any) {
      clearTimeout(timeoutId);
      resolve({ output: '', error: error.message });
    }
  });
}

// Python 执行
async function executePython(
  code: string,
  timeout: number = 30000
): Promise<{ output: string; error?: string }> {
  return new Promise(resolve => {
    const child = spawn('python3', ['-c', code]);

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });
    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('close', code => {
      if (code === 0) {
        resolve({ output: stdout });
      } else {
        resolve({ output: stdout, error: stderr || `Exit code: ${code}` });
      }
    });

    child.on('error', error => {
      resolve({ output: '', error: error.message });
    });

    setTimeout(() => {
      child.kill();
      resolve({ output: '', error: 'Execution timeout' });
    }, timeout);
  });
}

// Node.js 执行 (子进程)
async function executeNode(
  code: string,
  timeout: number = 30000
): Promise<{ output: string; error?: string }> {
  return new Promise(resolve => {
    const child = spawn('node', ['-e', code]);

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });
    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('close', code => {
      if (code === 0) {
        resolve({ output: stdout });
      } else {
        resolve({ output: stdout, error: stderr || `Exit code: ${code}` });
      }
    });

    child.on('error', error => {
      resolve({ output: '', error: error.message });
    });

    setTimeout(() => {
      child.kill();
      resolve({ output: '', error: 'Execution timeout' });
    }, timeout);
  });
}

export const codeTools: ToolDefinition[] = [
  {
    name: 'code_execute',
    description: '执行代码 (JavaScript/Python/Node.js)',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: '要执行的代码' },
        language: {
          type: 'string',
          description: '语言: javascript, python, node',
          enum: ['javascript', 'python', 'node', 'js'],
        },
        timeout: { type: 'number', description: '超时时间(毫秒)', default: 5000 },
      },
      required: ['code', 'language'],
    },
    handler: async input => {
      const code = input.code as string;
      const language = ((input.language as string) || 'javascript').toLowerCase();
      const timeout = (input.timeout as number) || 5000;

      let result: { output: string; error?: string };

      switch (language) {
        case 'python':
        case 'python3':
          result = await executePython(code, timeout);
          break;
        case 'node':
          result = await executeNode(code, timeout);
          break;
        case 'javascript':
        case 'js':
        default:
          result = await executeJavaScript(code, timeout);
          break;
      }

      return {
        success: !result.error,
        output: result.output,
        error: result.error,
        language,
      };
    },
    category: 'code',
    tags: ['code', 'execute', 'run', 'eval', 'javascript', 'python'],
    permissions: [PermissionLevel.EXECUTE],
  },
  {
    name: 'code_eval_js',
    description: '快速执行 JavaScript 代码 (沙箱)',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'JavaScript 代码' },
        timeout: { type: 'number', description: '超时时间(毫秒)', default: 3000 },
      },
      required: ['code'],
    },
    handler: async input => {
      const code = input.code as string;
      const timeout = (input.timeout as number) || 3000;

      const result = await executeJavaScript(code, timeout);

      return {
        success: !result.error,
        output: result.output,
        error: result.error,
      };
    },
    category: 'code',
    tags: ['javascript', 'js', 'eval', 'sandbox'],
    permissions: [PermissionLevel.EXECUTE],
  },
  {
    name: 'code_eval_python',
    description: '快速执行 Python 代码',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Python 代码' },
        timeout: { type: 'number', description: '超时时间(毫秒)', default: 10000 },
      },
      required: ['code'],
    },
    handler: async input => {
      const code = input.code as string;
      const timeout = (input.timeout as number) || 10000;

      const result = await executePython(code, timeout);

      return {
        success: !result.error,
        output: result.output,
        error: result.error,
      };
    },
    category: 'code',
    tags: ['python', 'python3', 'execute'],
    permissions: [PermissionLevel.EXECUTE],
  },
  {
    name: 'code_test',
    description: '测试代码是否可执行',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: '要测试的代码' },
        language: {
          type: 'string',
          description: '语言',
          enum: ['javascript', 'python', 'node'],
        },
      },
      required: ['code', 'language'],
    },
    handler: async input => {
      const code = input.code as string;
      const language = ((input.language as string) || 'javascript').toLowerCase();

      let available = false;
      let error: string | undefined;

      try {
        if (language === 'python' || language === 'python3') {
          await executePython('print("test")', 5000);
          available = true;
        } else if (language === 'node') {
          await executeNode('console.log("test")', 5000);
          available = true;
        } else {
          await executeJavaScript('console.log("test")', 5000);
          available = true;
        }
      } catch (e: any) {
        error = e.message;
      }

      return { available, language, error };
    },
    category: 'code',
    tags: ['code', 'test', 'available'],
  },
];
