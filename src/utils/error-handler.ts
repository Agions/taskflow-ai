/**
 * 通用错误处理工具
 * 提供统一的错误处理模式和辅助函数
 */

import { Logger } from './logger';

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
  } catch (error: any) {
    const message = `${errorMessage}: ${error.message}`;
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
export function withSyncErrorHandling<T>(
  fn: () => T,
  errorMessage: string,
  logger?: Logger
): T {
  try {
    return fn();
  } catch (error: any) {
    const message = `${errorMessage}: ${error.message}`;
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
  context?: Record<string, any>;
}

/**
 * 创建带代码的错误
 * @param code 错误代码
 * @param message 错误消息
 * @param context 上下文信息
 * @returns CodedError
 */
export function createCodedError(
  code: ErrorCode,
  message: string,
  context?: Record<string, any>
): CodedError {
  const error = new Error(message) as CodedError;
  error.code = code;
  error.context = context;
  return error;
}

/**
 * 重试配置
 */
export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
  shouldRetry?: (error: Error) => boolean;
}

/**
 * 默认重试配置
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  shouldRetry: () => true,
};

/**
 * 带重试的异步操作
 * @param fn 异步函数
 * @param config 重试配置
 * @returns 操作结果
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  logger?: Logger
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (attempt === retryConfig.maxAttempts) {
        break;
      }

      if (retryConfig.shouldRetry && !retryConfig.shouldRetry(error)) {
        throw error;
      }

      const delay = retryConfig.delayMs * Math.pow(retryConfig.backoffMultiplier, attempt - 1);
      if (logger) {
        logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
      }

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * 睡眠函数
 * @param ms 毫秒
 * @returns Promise
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 超时包装器
 * @param fn 异步函数
 * @param timeoutMs 超时时间
 * @param errorMessage 错误消息
 * @returns 操作结果
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    }),
  ]);
}

/**
 * 批量操作错误处理
 * @param items 操作项
 * @param fn 操作函数
 * @param errorHandler 错误处理函数
 * @returns 成功和失败的结果
 */
export async function batchWithErrorHandling<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  errorHandler?: (item: T, error: Error) => void
): Promise<{ successes: R[]; failures: { item: T; error: Error }[] }> {
  const results = await Promise.allSettled(items.map(fn));

  const successes: R[] = [];
  const failures: { item: T; error: Error }[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successes.push(result.value);
    } else {
      const error = result.reason as Error;
      const item = items[index];
      failures.push({ item, error });
      if (errorHandler) {
        errorHandler(item, error);
      }
    }
  });

  return { successes, failures };
}

/**
 * 错误日志装饰器
 * @param target 目标类
 * @param propertyKey 方法名
 * @param descriptor 属性描述符
 */
export function LogErrors(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  const className = target.constructor.name;

  descriptor.value = async function (...args: any[]) {
    const logger = Logger.getInstance(className);

    try {
      return await originalMethod.apply(this, args);
    } catch (error: any) {
      logger.error(`${propertyKey} failed:`, error);
      throw error;
    }
  };

  return descriptor;
}

/**
 * 安全 JSON 解析
 * @param json JSON 字符串
 * @param defaultValue 默认值
 * @returns 解析结果
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * 安全 JSON 序列化
 * @param obj 对象
 * @param defaultValue 默认值
 * @returns JSON 字符串
 */
export function safeJsonStringify(obj: any, defaultValue: string = '{}'): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return defaultValue;
  }
}
