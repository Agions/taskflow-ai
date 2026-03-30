import { getLogger } from '../utils/logger';
/**
 * 通用错误处理工具
 * 提供统一的错误处理模式和辅助函数
 */

import { Logger } from './logger';
const logger = getLogger('utils/error-handler');


/**
 * 异步操作错误处理包装器
 * @param fn 异步函数
 * @param errorMessage 错误消息前缀
 * @returns 包装后的函数
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorMessage: string,
  logger?: Logger
): Promise<T> {
  try {
    return await fn();
  } catch (error: unknown) {
    const message = `${errorMessage}: ${error instanceof Error ? error.message : String(error)}`;
    if (logger) {
      logger.error(message, error);
    }
    throw new Error(message);
  }
}

/**
 * 同步操作错误处理包装器
 * @param fn 同步函数
 * @param errorMessage 错误消息前缀
 * @returns 包装后的函数
 */
export function withSyncErrorHandling<T>(fn: () => T, errorMessage: string, logger?: Logger): T {
  try {
    return fn();
  } catch (error: unknown) {
    const message = `${errorMessage}: ${error instanceof Error ? error.message : String(error)}`;
    if (logger) {
      logger.error(message, error);
    }
    throw new Error(message);
  }
}

/**
 * 错误类型守卫
 * @param error 错误对象
 * @returns 是否为 Error 类型
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * 获取错误消息
 * @param error 错误对象
 * @returns 错误消息字符串
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
}

/**
 * 错误代码类型
 */
export type ErrorCode =
  | 'FILE_NOT_FOUND'
  | 'FILE_READ_ERROR'
  | 'FILE_WRITE_ERROR'
  | 'CONFIG_INVALID'
  | 'CONFIG_NOT_FOUND'
  | 'CONFIG_PARSE_ERROR'
  | 'AI_SERVICE_ERROR'
  | 'AI_TIMEOUT'
  | 'MCP_TOOL_ERROR'
  | 'MCP_RESOURCE_ERROR'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * 带代码的错误
 */
export interface CodedError extends Error {
  code: ErrorCode;
  context?: Record<string, unknown>;
}

/**
 * 创建带代码的错误
 * @param code 错误代码
 */
export function createCodedError(
  code: ErrorCode,
  message: string,
  context?: Record<string, unknown>
): CodedError {
  const error = new Error(message) as CodedError;
  error.code = code;
  if (context) error.context = context;
  return error;
}

/**
 * 错误重试装饰器
 */
export function withRetry<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  maxRetries: number = 3,
  delay: number = 1000
) {
  return async (...args: T): Promise<R> => {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        if (isError(error)) {
          lastError = error;
        } else {
          lastError = new Error(String(error));
        }

        if (attempt <= maxRetries) {
          const backoffDelay = delay * Math.pow(2, attempt - 1);
          const jitter = Math.random() * backoffDelay * 0.25;
          await new Promise(resolve => setTimeout(resolve, backoffDelay + jitter));
        }
      }
    }

    throw lastError!;
  };
}

/**
 * 安全执行函数
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
  fallback?: T
): Promise<{ success: boolean; data?: T; error?: Error }> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: isError(error) ? error : new Error(String(error)),
      ...(fallback !== undefined && { data: fallback }),
    };
  }
}

/**
 * 验证必需参数
 */
export function validateRequired(
  params: Record<string, unknown>,
  required: string[]
): void {
  for (const field of required) {
    if (!params[field]) {
      throw createTaskFlowError(
        'VALIDATION_ERROR',
        'VALIDATION_ERROR',
        `Missing required field: ${field}`,
        { field, provided: Object.keys(params) }
      );
    }
  }
}

/**
 * 异步错误边界
 */
export class AsyncErrorBoundary {
  private handlers: Map<string, (error: CodedError) => void> = new Map();

  onError(type: string, handler: (error: CodedError) => void): void {
    this.handlers.set(type, handler);
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (isError(error) && 'code' in error) {
        const codedError = error as CodedError;
        const handler = this.handlers.get(codedError.code);
        if (handler) {
          handler(codedError);
          return Promise.reject(error);
        }
      }

      throw error;
    }
  }
}

/**
 * JSON 安全序列化
 */
export function safeJsonStringify(obj: unknown, space?: number): string {
  try {
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      if (value instanceof Error) {
        return { message: value.message, stack: value.stack };
      }
      return value;
    }, space);
  } catch (error) {
    return JSON.stringify({ error: 'Failed to stringify object' });
  }
}
