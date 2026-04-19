/**
 * Function Calling - Type Definitions
 */

import { ToolParameterSchema } from '../tools/types';

/**
 * 函数定义 (OpenAI Function Calling 格式)
 */
export interface FunctionDefinition {
  /** 函数名称 */
  name: string;
  /** 函数描述 */
  description?: string;
  /** 参数 schema */
  parameters?: ToolParameterSchema;
}

/**
 * 函数调用请求
 */
export interface FunctionCallRequest {
  /** 模型名称 */
  model: string;
  /** 消息列表 */
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  /** 可用函数列表 */
  functions?: FunctionDefinition[];
  /** 强制使用函数 (不生成文本) */
  function_call?: 'auto' | 'none' | { name: string };
  /** 温度 */
  temperature?: number;
  /** 最大 token 数 */
  max_tokens?: number;
}

/**
 * 函数调用响应
 */
export interface FunctionCallResponse {
  /** .finish_reason */
  finishReason: 'stop' | 'function_call' | 'length';
  /** 生成的文本 */
  content?: string;
  /** 函数调用 */
  functionCall?: {
    name: string;
    arguments: string; // JSON 字符串
    parsedArguments?: Record<string, unknown>;
  };
  /** 消耗的 tokens */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * 函数调用结果
 */
export interface FunctionCallResult {
  /** 是否成功 */
  success: boolean;
  /** 函数名称 */
  functionName: string;
  /** 解析后的参数 */
  arguments: Record<string, unknown>;
  /** 函数执行结果 */
  result?: unknown;
  /** 错误信息 */
  error?: string;
}

/**
 * 函数执行器接口
 */
export interface FunctionExecutor {
  /** 执行函数 */
  execute(name: string, args: Record<string, unknown>): Promise<FunctionCallResult>;
}

/**
 * 结构化输出模式
 */
export interface StructuredOutputSchema {
  /** 输出类型名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** JSON Schema */
  schema: Record<string, unknown>;
}

/**
 * 结构化输出请求
 */
export interface StructuredOutputRequest {
  /** 模型名称 */
  model: string;
  /** 消息 */
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  /** 输出模式 */
  outputSchema: StructuredOutputSchema;
  /** 温度 */
  temperature?: number;
}

/**
 * 结构化输出响应
 */
export interface StructuredOutputResponse {
  /** 是否成功 */
  success: boolean;
  /** 解析后的输出 */
  output?: Record<string, unknown>;
  /** 原始文本 */
  rawText?: string;
  /** 错误信息 */
  error?: string;
  /** Token 消耗 */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Function Calling 选项
 */
export interface FunctionCallingOptions {
  /** 函数定义列表 */
  functions?: FunctionDefinition[];
  /** 执行器 */
  executor?: FunctionExecutor;
  /** 是否强制使用函数 */
  forceFunctionCall?: boolean;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 生成参数的最大 token 数 */
  maxFunctionArgsTokens?: number;
}

/**
 * 并行函数调用项
 */
export interface ParallelFunctionCall {
  index: number;
  id: string;
  name: string;
  arguments: string;
  parsedArguments?: Record<string, unknown>;
}

/**
 * 并行函数调用响应
 */
export interface ParallelFunctionCallResponse {
  finishReason: 'stop' | 'function_call' | 'length';
  message: string;
  functionCalls: ParallelFunctionCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
