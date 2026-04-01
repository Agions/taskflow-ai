/**
 * 错误处理工具
 */

import { TaskFlowError, ErrorType } from '../types';
import { ERROR_CODES } from '../constants';

/**
 * 创建TaskFlow错误
 */
export function createTaskFlowError(
  type: ErrorType,
  code: string,
  message: string,
  context?: Record<string, any>
): TaskFlowError {
  const error = new Error(message) as TaskFlowError;
  error.name = 'TaskFlowError';
  error.type = type;
  error.code = code;
  error.context = context;

  return error;
}

/**
 * 检查是否为TaskFlow错误
 */
export function isTaskFlowError(error: any): error is TaskFlowError {
  return error && error.name === 'TaskFlowError';
}

/**
 * 格式化错误消息
 */
export function formatError(error: Error | TaskFlowError): string {
  if (isTaskFlowError(error)) {
    return `[${error.type.toUpperCase()}:${error.code}] ${(error instanceof Error ? error.message : String(error))}`;
  }

  return (error instanceof Error ? error.message : String(error)) || 'Unknown error';
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
        lastError = error as Error;

        if (attempt <= maxRetries) {
          // 指数退避: delay, 2*delay, 4*delay, ...
          const backoffDelay = delay * Math.pow(2, attempt - 1);
          // 添加随机抖动 (0-25%)
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
      error: error as Error,
      ...(fallback !== undefined && { data: fallback }),
    };
  }
}

/**
 * 验证必需参数
 */
export function validateRequired(params: Record<string, any>, required: string[]): void {
  for (const field of required as any[]) {
    if (!params[field]) {
      throw createTaskFlowError(
        'validation',
        ERROR_CODES.REQUIRED_FIELD_MISSING,
        `缺少必需参数: ${field}`,
        { field, provided: Object.keys(params) }
      );
    }
  }
}

/**
 * 验证文件路径
 */
export function validateFilePath(filePath: string): void {
  if (!filePath || typeof filePath !== 'string') {
    throw createTaskFlowError('validation', ERROR_CODES.INVALID_FORMAT, '无效的文件路径');
  }

  const dangerous = ['../', '..\\', '/etc/', '/root/', 'C:\\Windows\\'];
  if (dangerous.some(pattern => filePath.includes(pattern))) {
    throw createTaskFlowError('validation', ERROR_CODES.VALIDATION_ERROR, '不安全的文件路径');
  }
}

/**
 * 异步错误边界
 */
export class AsyncErrorBoundary {
  private handlers: Map<ErrorType, (error: TaskFlowError) => void> = new Map();

  onError(type: ErrorType, handler: (error: TaskFlowError) => void): void {
    this.handlers.set(type, handler);
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (isTaskFlowError(error)) {
        const handler = this.handlers.get(error.type);
        if (handler) {
          handler(error);
          return Promise.reject(error);
        }
      }

      throw error;
    }
  }
}
