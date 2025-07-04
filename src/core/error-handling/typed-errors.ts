/**
 * 类型安全的错误处理系统
 */

import { JSONObject, JSONValue } from '../../types/strict-types';

/**
 * 错误上下文接口
 */
export interface ErrorContext {
  timestamp: string;
  source: string;
  details: JSONObject;
  stackTrace?: string;
}

/**
 * 基础错误类
 */
export class TaskFlowError extends Error {
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly timestamp: string;

  constructor(
    message: string,
    code: string,
    context: ErrorContext
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.timestamp = context.timestamp || new Date().toISOString();
    this.context = context;

    // 确保错误堆栈正确显示
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * 序列化错误信息
   */
  public toJSON(): JSONObject {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context as unknown as JSONObject,
      stack: this.stack || ''
    };
  }
}

/**
 * 验证错误
 */
export class ValidationError extends TaskFlowError {
  constructor(message: string, field: string, value?: unknown, source = 'validation') {
    const context: ErrorContext = {
      timestamp: new Date().toISOString(),
      source,
      details: {
        field,
        value: value as JSONValue,
        validationType: 'schema'
      }
    };
    super(message, 'VALIDATION_ERROR', context);
  }
}

/**
 * 配置错误
 */
export class ConfigurationError extends TaskFlowError {
  constructor(message: string, configKey: string, source = 'configuration') {
    const context: ErrorContext = {
      timestamp: new Date().toISOString(),
      source,
      details: {
        configKey,
        suggestion: 'Check configuration file and environment variables'
      }
    };
    super(message, 'CONFIGURATION_ERROR', context);
  }
}

/**
 * 网络错误
 */
export class NetworkError extends TaskFlowError {
  constructor(
    message: string,
    url: string,
    statusCode?: number,
    source = 'network'
  ) {
    const context: ErrorContext = {
      timestamp: new Date().toISOString(),
      source,
      details: {
        url,
        statusCode: statusCode || null,
        retryable: statusCode ? statusCode >= 500 : true
      }
    };
    super(message, 'NETWORK_ERROR', context);
  }
}

/**
 * 文件系统错误
 */
export class FileSystemError extends TaskFlowError {
  constructor(
    message: string,
    path: string,
    operation: string,
    source = 'filesystem'
  ) {
    const context: ErrorContext = {
      timestamp: new Date().toISOString(),
      source,
      details: {
        path,
        operation,
        suggestion: 'Check file permissions and path existence'
      }
    };
    super(message, 'FILESYSTEM_ERROR', context);
  }
}

/**
 * API错误
 */
export class APIError extends TaskFlowError {
  constructor(
    message: string,
    provider: string,
    statusCode?: number,
    source = 'api'
  ) {
    const context: ErrorContext = {
      timestamp: new Date().toISOString(),
      source,
      details: {
        provider,
        statusCode: statusCode || null,
        retryable: statusCode ? statusCode >= 500 : false
      }
    };
    super(message, 'API_ERROR', context);
  }
}

/**
 * 解析错误
 */
export class ParseError extends TaskFlowError {
  constructor(
    message: string,
    format: string,
    line?: number,
    source = 'parser'
  ) {
    const context: ErrorContext = {
      timestamp: new Date().toISOString(),
      source,
      details: {
        format,
        line: line || null,
        suggestion: 'Check input format and syntax'
      }
    };
    super(message, 'PARSE_ERROR', context);
  }
}

/**
 * 性能错误
 */
export class PerformanceError extends TaskFlowError {
  constructor(
    message: string,
    operation: string,
    duration: number,
    threshold: number,
    source = 'performance'
  ) {
    const context: ErrorContext = {
      timestamp: new Date().toISOString(),
      source,
      details: {
        operation,
        duration,
        threshold,
        suggestion: 'Consider optimizing the operation or increasing timeout'
      }
    };
    super(message, 'PERFORMANCE_ERROR', context);
  }
}

/**
 * 错误处理工具类
 */
export class ErrorHandler {
  /**
   * 安全地处理未知错误
   */
  public static handleUnknownError(error: unknown, source: string): TaskFlowError {
    if (error instanceof TaskFlowError) {
      return error;
    }

    if (error instanceof Error) {
      const context: ErrorContext = {
        timestamp: new Date().toISOString(),
        source,
        details: {
          originalName: error.name,
          originalStack: error.stack || ''
        }
      };
      return new TaskFlowError(error.message, 'UNKNOWN_ERROR', context);
    }

    if (typeof error === 'string') {
      const context: ErrorContext = {
        timestamp: new Date().toISOString(),
        source,
        details: {}
      };
      return new TaskFlowError(error, 'STRING_ERROR', context);
    }

    const context: ErrorContext = {
      timestamp: new Date().toISOString(),
      source,
      details: {
        errorType: typeof error,
        errorValue: String(error)
      }
    };
    return new TaskFlowError('An unknown error occurred', 'UNKNOWN_ERROR', context);
  }

  /**
   * 检查错误是否可重试
   */
  public static isRetryable(error: TaskFlowError): boolean {
    const retryableCodes = ['NETWORK_ERROR', 'API_ERROR', 'PERFORMANCE_ERROR'];
    return retryableCodes.includes(error.code) && 
           error.context.details?.retryable === true;
  }

  /**
   * 获取错误的严重程度
   */
  public static getSeverity(error: TaskFlowError): 'low' | 'medium' | 'high' | 'critical' {
    const criticalCodes = ['FILESYSTEM_ERROR', 'CONFIGURATION_ERROR'];
    const highCodes = ['API_ERROR', 'NETWORK_ERROR'];
    const mediumCodes = ['VALIDATION_ERROR', 'PARSE_ERROR'];

    if (criticalCodes.includes(error.code)) return 'critical';
    if (highCodes.includes(error.code)) return 'high';
    if (mediumCodes.includes(error.code)) return 'medium';
    return 'low';
  }

  /**
   * 格式化错误消息用于用户显示
   */
  public static formatUserMessage(error: TaskFlowError): string {
    const baseMessage = error.message;
    const suggestion = error.context.details?.suggestion as string;
    
    if (suggestion) {
      return `${baseMessage}\n💡 建议: ${suggestion}`;
    }
    
    return baseMessage;
  }

  /**
   * 创建错误报告
   */
  public static createErrorReport(error: TaskFlowError): JSONObject {
    return {
      id: this.generateErrorId(),
      timestamp: error.timestamp,
      severity: this.getSeverity(error),
      retryable: this.isRetryable(error),
      error: error.toJSON(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };
  }

  /**
   * 生成错误ID
   */
  private static generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 错误装饰器 - 用于自动错误处理
 */
export function handleErrors(source: string) {
  return function(target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: unknown[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        const taskFlowError = ErrorHandler.handleUnknownError(error, source);
        
        // 记录错误
        console.error('Error occurred:', ErrorHandler.createErrorReport(taskFlowError));
        
        throw taskFlowError;
      }
    };

    return descriptor;
  };
}

/**
 * 类型安全的结果类型
 */
export type Result<T, E = TaskFlowError> = {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
};

/**
 * 创建成功结果
 */
export function createSuccess<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * 创建失败结果
 */
export function createFailure<E extends TaskFlowError>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * 安全执行函数 - 返回Result类型而不是抛出异常
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  source: string
): Promise<Result<T>> {
  try {
    const data = await operation();
    return createSuccess(data);
  } catch (error) {
    const taskFlowError = ErrorHandler.handleUnknownError(error, source);
    return createFailure(taskFlowError);
  }
}
