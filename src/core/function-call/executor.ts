/**
 * Function Calling Executor - 函数调用执行器
 */

import { getLogger } from '../../utils/logger';
import { getToolRegistry, Tool } from '../tools';
import { FunctionExecutor, FunctionCallResult, FunctionCallingOptions, FunctionDefinition, FunctionCallRequest, FunctionCallResponse, ParallelFunctionCall } from './types';

const logger = getLogger('function-call');

/**
 * 基于工具注册表的函数执行器
 */
export class ToolBasedFunctionExecutor implements FunctionExecutor {
  private registry = getToolRegistry();

  async execute(name: string, args: Record<string, unknown>): Promise<FunctionCallResult> {
    const tool = this.registry.get(name);
    
    if (!tool) {
      return {
        success: false,
        functionName: name,
        arguments: args,
        error: `函数 ${name} 不存在`,
      };
    }

    try {
      const result = await this.registry.execute(name, args, {
        cwd: process.cwd(),
        env: process.env as Record<string, string>,
        metadata: { source: 'function-call' },
      });

      return {
        success: result.success,
        functionName: name,
        arguments: args,
        result: result.output,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        functionName: name,
        arguments: args,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

/**
 * Function Calling 处理器
 */
export class FunctionCallingHandler {
  private executor: FunctionExecutor;
  private defaultExecutor = new ToolBasedFunctionExecutor();

  constructor(executor?: FunctionExecutor) {
    this.executor = executor || this.defaultExecutor;
  }

  /**
   * 执行函数调用
   */
  async handle(
    request: FunctionCallRequest,
    options?: FunctionCallingOptions
  ): Promise<FunctionCallResponse> {
    // 简化实现：生成模拟响应
    // 实际应连接 ModelGateway 使用模型

    const functions = options?.functions || request.functions || [];
    
    if (!functions.length) {
      return {
        finishReason: 'stop',
        content: '没有可用的函数',
      };
    }

    // 模拟选择函数
    const selectedFunction = functions[0];
    const mockArgs = '{}';

    return {
      finishReason: 'function_call',
      content: undefined,
      functionCall: {
        name: selectedFunction.name,
        arguments: mockArgs,
        parsedArguments: {},
      },
    };
  }

  /**
   * 执行函数并返回结果
   */
  async executeFunction(
    name: string,
    args: Record<string, unknown>
  ): Promise<FunctionCallResult> {
    return this.executor.execute(name, args);
  }

  /**
   * 处理并行函数调用
   */
  async handleParallel(
    calls: ParallelFunctionCall[],
    options?: FunctionCallingOptions
  ): Promise<FunctionCallResult[]> {
    const results: FunctionCallResult[] = [];
    
    for (const call of calls) {
      const result = await this.executor.execute(call.name, call.parsedArguments || {});
      results.push(result);
    }
    
    return results;
  }

  /**
   * 将函数定义转换为工具注册表格式
   */
  static toToolDefinitions(functions: FunctionDefinition[]): Tool[] {
    return functions.map(fn => ({
      name: fn.name,
      description: fn.description || '',
      category: 'custom' as const,
      parameters: fn.parameters || { type: 'object', properties: {} },
      handler: async (args) => ({ success: true, output: JSON.stringify(args) }),
    }));
  }
}

/**
 * 结构化输出处理器
 */
export class StructuredOutputHandler {
  /**
   * 处理结构化输出请求
   */
  async handle(
    request: FunctionCallRequest,
    options?: { outputSchema?: Record<string, unknown> }
  ): Promise<FunctionCallResponse> {
    // 简化实现
    // 实际应使用 JSON Schema 约束输出

    return {
      finishReason: 'stop',
      content: JSON.stringify({ 
        structured: true,
        schema: options?.outputSchema,
        message: '结构化输出处理' 
      }),
    };
  }

  /**
   * 解析结构化输出
   */
  parseStructuredOutput(
    text: string,
    schema: Record<string, unknown>
  ): Record<string, unknown> | null {
    try {
      const parsed = JSON.parse(text);
      
      // 简单的 schema 验证
      if (this.validateSchema(parsed, schema)) {
        return parsed;
      }
      
      return null;
    } catch {
      return null;
    }
  }

  /**
   * 验证 schema
   */
  private validateSchema(
    data: unknown,
    schema: Record<string, unknown>
  ): boolean {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    // 简化验证：只检查必需字段
    const required = schema['required'] as string[] | undefined;
    if (required && Array.isArray(required)) {
      const obj = data as Record<string, unknown>;
      for (const field of required) {
        if (!(field in obj)) {
          return false;
        }
      }
    }

    return true;
  }
}

/**
 * 工具注册表函数执行器适配器
 */
export class RegistryFunctionExecutor implements FunctionExecutor {
  private registry = getToolRegistry();

  async execute(name: string, args: Record<string, unknown>): Promise<FunctionCallResult> {
    const startTime = Date.now();
    
    try {
      const result = await this.registry.execute(name, args, {
        cwd: process.cwd(),
        env: process.env as Record<string, string>,
        metadata: { source: 'function-call' },
      });

      return {
        success: result.success || false,
        functionName: name,
        arguments: args,
        result: result.output,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        functionName: name,
        arguments: args,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

// 默认实例
let defaultHandler: FunctionCallingHandler | null = null;

export function getFunctionCallingHandler(): FunctionCallingHandler {
  if (!defaultHandler) {
    defaultHandler = new FunctionCallingHandler(new RegistryFunctionExecutor());
  }
  return defaultHandler;
}
