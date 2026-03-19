/**
 * 错误定位与重试机制
 * 提供自动错误恢复和调试支持
 */

import * as fs from 'fs-extra';
import * as path from 'path';

export interface ErrorContext {
  /** 错误唯一 ID */
  id: string;
  /** 错误类型 */
  type: ErrorType;
  /** 错误消息 */
  message: string;
  /** 堆栈跟踪 */
  stack?: string;
  /** 发生位置 */
  location?: {
    file?: string;
    line?: number;
    column?: number;
    function?: string;
  };
  /** 发生时的时间戳 */
  timestamp: number;
  /** 相关任务 ID */
  taskId?: string;
  /** 相关思维链 ID */
  chainId?: string;
  /** 上下文数据 */
  context?: Record<string, unknown>;
  /** 重试次数 */
  retryCount: number;
}

export type ErrorType =
  | 'network' // 网络错误
  | 'timeout' // 超时
  | 'rate_limit' // 速率限制
  | 'auth' // 认证错误
  | 'quota' // 配额超限
  | 'invalid_input' // 输入无效
  | 'execution' // 执行错误
  | 'tool' // 工具调用错误
  | 'unknown'; // 未知错误

export interface RetryConfig {
  /** 最大重试次数 */
  maxRetries: number;
  /** 初始重试间隔 (ms) */
  initialDelay: number;
  /** 最大重试间隔 (ms) */
  maxDelay: number;
  /** 指数退避因子 */
  backoffFactor: number;
  /** 可重试的错误类型 */
  retryableErrors: ErrorType[];
  /** 是否随机抖动 */
  jitter: boolean;
}

export interface ErrorRecoveryResult {
  success: boolean;
  recovered: boolean;
  finalError?: ErrorContext;
  attempts: number;
  totalDuration: number;
}

export class ErrorHandler {
  private errors: ErrorContext[] = [];
  private defaultConfig: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2,
    retryableErrors: ['network', 'timeout', 'rate_limit', 'quota'],
    jitter: true,
  };

  /**
   * 记录错误
   */
  record(
    error: Error | string,
    type: ErrorType,
    options?: {
      taskId?: string;
      chainId?: string;
      context?: Record<string, unknown>;
    }
  ): ErrorContext {
    const errorContext: ErrorContext = {
      id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'string' ? undefined : error.stack,
      timestamp: Date.now(),
      taskId: options?.taskId,
      chainId: options?.chainId,
      context: options?.context,
      retryCount: 0,
    };

    // 解析堆栈跟踪获取位置信息
    if (typeof error === 'object' && error.stack) {
      const stackFrame = this.parseStackFrame(error.stack);
      if (stackFrame) {
        errorContext.location = stackFrame;
      }
    }

    this.errors.push(errorContext);
    return errorContext;
  }

  /**
   * 解析堆栈跟踪
   */
  private parseStackFrame(stack: string): ErrorContext['location'] | null {
    const lines = stack.split('\n');
    for (const line of lines) {
      // 匹配 at function (file:line:column) 或 at file:line:column
      const match = line.match(/at\s+(?:(\S+)\s+\()?(.+?):(\d+):(\d+)\)?/);
      if (match) {
        return {
          function: match[1] || undefined,
          file: match[2],
          line: parseInt(match[3], 10),
          column: parseInt(match[4], 10),
        };
      }
    }
    return null;
  }

  /**
   * 错误分类
   */
  classify(error: Error | string): ErrorType {
    const message = typeof error === 'string' ? error : error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch') || message.includes('ECONNREFUSED')) {
      return 'network';
    }
    if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
      return 'timeout';
    }
    if (message.includes('rate limit') || message.includes('429') || message.includes('too many requests')) {
      return 'rate_limit';
    }
    if (message.includes('auth') || message.includes('401') || message.includes('403') || message.includes('unauthorized')) {
      return 'auth';
    }
    if (message.includes('quota') || message.includes('402') || message.includes('insufficient')) {
      return 'quota';
    }
    if (message.includes('invalid') || message.includes('400') || message.includes('validation')) {
      return 'invalid_input';
    }
    if (message.includes('execute') || message.includes('run')) {
      return 'execution';
    }
    if (message.includes('tool') || message.includes('mcp')) {
      return 'tool';
    }

    return 'unknown';
  }

  /**
   * 检查错误是否可重试
   */
  isRetryable(errorType: ErrorType, config?: Partial<RetryConfig>): boolean {
    const retryableErrors = config?.retryableErrors || this.defaultConfig.retryableErrors;
    return retryableErrors.includes(errorType);
  }

  /**
   * 执行带重试的操作
   */
  async retryWithRecovery<T>(
    operation: () => Promise<T>,
    config?: Partial<RetryConfig>,
    onRetry?: (error: ErrorContext, delay: number) => void
  ): Promise<{ result?: T; error?: ErrorContext; attempts: number }> {
    const cfg = { ...this.defaultConfig, ...config };
    let lastError: ErrorContext | undefined;
    let attempt = 0;

    while (attempt <= cfg.maxRetries) {
      attempt++;

      try {
        const result = await operation();
        return { result, attempts: attempt };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error : String(error);
        const errorType = this.classify(errorMessage);
        lastError = this.record(errorMessage, errorType);
        lastError.retryCount = attempt - 1;

        // 检查是否可重试
        if (!this.isRetryable(errorType, cfg) || attempt > cfg.maxRetries) {
          break;
        }

        // 计算退避延迟
        const delay = this.calculateBackoff(attempt - 1, cfg);

        if (onRetry) {
          onRetry(lastError, delay);
        }

        // 等待后重试
        await this.sleep(delay);
      }
    }

    return { error: lastError, attempts: attempt };
  }

  /**
   * 计算退避延迟
   */
  private calculateBackoff(attempt: number, config: RetryConfig): number {
    let delay = config.initialDelay * Math.pow(config.backoffFactor, attempt);
    delay = Math.min(delay, config.maxDelay);

    if (config.jitter) {
      // 添加 0-25% 的随机抖动
      delay *= 1 + Math.random() * 0.25;
    }

    return Math.floor(delay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 生成错误报告
   */
  generateErrorReport(error: ErrorContext): string {
    const lines: string[] = [
      '❌ 错误报告',
      '═'.repeat(50),
      `  ID:       ${error.id}`,
      `  类型:    ${this.getErrorTypeLabel(error.type)}`,
      `  消息:    ${error.message}`,
      `  时间:    ${new Date(error.timestamp).toISOString()}`,
      `  重试:    ${error.retryCount}次`,
    ];

    if (error.location) {
      lines.push(`  位置:     ${error.location.file || 'unknown'}:${error.location.line}:${error.location.column}`);
      if (error.location.function) {
        lines.push(`  函数:     ${error.location.function}`);
      }
    }

    if (error.taskId) {
      lines.push(`  任务ID:   ${error.taskId}`);
    }

    if (error.chainId) {
      lines.push(`  思维链ID: ${error.chainId}`);
    }

    if (error.stack) {
      lines.push('', '  堆栈跟踪:', '  ' + error.stack.split('\n').slice(0, 5).join('\n  '));
    }

    lines.push('═'.repeat(50));

    return lines.join('\n');
  }

  private getErrorTypeLabel(type: ErrorType): string {
    const labels: Record<ErrorType, string> = {
      network: '🌐 网络错误',
      timeout: '⏱️ 超时',
      rate_limit: '🚦 速率限制',
      auth: '🔐 认证错误',
      quota: '💰 配额超限',
      invalid_input: '📝 输入无效',
      execution: '⚡ 执行错误',
      tool: '🔧 工具调用错误',
      unknown: '❓ 未知错误',
    };
    return labels[type];
  }

  /**
   * 获取错误历史
   */
  getHistory(limit?: number): ErrorContext[] {
    if (limit) {
      return this.errors.slice(-limit);
    }
    return [...this.errors];
  }

  /**
   * 获取错误统计
   */
  getStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    retryable: number;
    nonRetryable: number;
  } {
    const stats = {
      total: this.errors.length,
      byType: {} as Record<ErrorType, number>,
      retryable: 0,
      nonRetryable: 0,
    };

    for (const error of this.errors) {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      if (this.isRetryable(error.type)) {
        stats.retryable++;
      } else {
        stats.nonRetryable++;
      }
    }

    return stats;
  }

  /**
   * 保存错误日志到文件
   */
  async saveToFile(filePath: string): Promise<void> {
    const content = JSON.stringify(this.errors, null, 2);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
  }

  /**
   * 清除错误历史
   */
  clear(): void {
    this.errors = [];
  }
}

/**
 * 创建错误处理器实例
 */
export function createErrorHandler(): ErrorHandler {
  return new ErrorHandler();
}

export default ErrorHandler;
