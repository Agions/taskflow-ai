/**
 * Error Handler - 统一错误处理
 * TaskFlow AI v4.0
 */

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  operation?: string;
  severity?: ErrorSeverity;
  code?: string;
  metadata?: Record<string, unknown>;
  stack?: string;
  recoverable?: boolean;
}

export interface HandledError {
  id: string;
  message: string;
  severity: ErrorSeverity;
  operation?: string;
  code?: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
  recoverable: boolean;
  suggestions: string[];
}

export interface ErrorStats {
  totalErrors: number;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByOperation: Record<string, number>;
  lastErrorTime: number;
}

export class ErrorHandler {
  private logger: any;
  private errorHistory: HandledError[] = [];
  private maxHistorySize = 100;
  private debugMode: boolean;
  private errorStats: Record<string, number> = {};

  constructor(logger: any, debugMode: boolean = false) {
    this.logger = logger;
    this.debugMode = debugMode;
  }

  async handle(error: Error | unknown, context: ErrorContext = {}): Promise<HandledError> {
    const handledError = this.createHandledError(error, context);

    // 记录错误
    this.logError(handledError);

    // 添加到历史
    this.addToHistory(handledError);

    // 更新统计
    this.updateStats(handledError);

    // 如果是 critical 错误，可能需要特殊处理
    if (handledError.severity === ErrorSeverity.CRITICAL) {
      await this.handleCritical(handledError);
    }

    return handledError;
  }

  private createHandledError(error: Error | unknown, context: ErrorContext): HandledError {
    const isError = error instanceof Error;
    const message = isError ? error.message : String(error);
    const severity = context.severity || this.determineSeverity(error);

    return {
      id: this.generateErrorId(),
      message,
      severity,
      operation: context.operation,
      code: context.code,
      metadata: {
        ...context.metadata,
        stack: isError ? error.stack : undefined
      },
      timestamp: Date.now(),
      recoverable: context.recoverable ?? true,
      suggestions: this.generateSuggestions(message, severity)
    };
  }

  private determineSeverity(error: Error | unknown): ErrorSeverity {
    const errorStr = String(error).toLowerCase();

    if (errorStr.includes('permission') || errorStr.includes('authorization')) {
      return ErrorSeverity.CRITICAL;
    }

    if (errorStr.includes('timeout') || errorStr.includes('network')) {
      return ErrorSeverity.WARNING;
    }

    return ErrorSeverity.ERROR;
  }

  private generateSuggestions(message: string, severity: ErrorSeverity): string[] {
    const suggestions: string[] = [];

    if (message.includes('timeout')) {
      suggestions.push('Consider increasing the timeout value');
      suggestions.push('Check network connectivity');
    }

    if (message.includes('permission')) {
      suggestions.push('Verify your API credentials');
      suggestions.push('Check the required permissions');
    }

    if (severity === ErrorSeverity.CRITICAL) {
      suggestions.push('This is a critical error, please check the logs');
    }

    return suggestions;
  }

  private logError(error: HandledError): void {
    const logMessage = `[${error.id}] ${error.operation || 'Unknown'}: ${error.message}`;

    switch (error.severity) {
      case ErrorSeverity.INFO:
        this.logger.info(logMessage, error.metadata);
        break;
      case ErrorSeverity.WARNING:
        this.logger.warn(logMessage, error.metadata);
        break;
      case ErrorSeverity.ERROR:
      case ErrorSeverity.CRITICAL:
        this.logger.error(logMessage, error.metadata);
        break;
    }
  }

  private addToHistory(error: HandledError): void {
    this.errorHistory.push(error);

    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }
  }

  private updateStats(error: HandledError): void {
    const key = error.operation || 'unknown';
    this.errorStats[key] = (this.errorStats[key] || 0) + 1;
  }

  private async handleCritical(error: HandledError): Promise<void> {
    // Critical 错误的特殊处理
    // 例如：发送警报、记录到专门的分析系统等
    if (this.debugMode) {
      console.error('CRITICAL ERROR:', error);
    }
  }

  private generateErrorId(): string {
    return `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getErrorHistory(limit?: number): HandledError[] {
    if (limit) {
      return this.errorHistory.slice(-limit);
    }
    return [...this.errorHistory];
  }

  clearHistory(): void {
    this.errorHistory = [];
    this.errorStats = {};
  }

  getErrorStats(): ErrorStats {
    const errorsBySeverity: Record<ErrorSeverity, number> = {
      [ErrorSeverity.INFO]: 0,
      [ErrorSeverity.WARNING]: 0,
      [ErrorSeverity.ERROR]: 0,
      [ErrorSeverity.CRITICAL]: 0
    };

    this.errorHistory.forEach(error => {
      errorsBySeverity[error.severity]++;
    });

    const lastErrorTime = this.errorHistory.length > 0
      ? this.errorHistory[this.errorHistory.length - 1].timestamp
      : 0;

    return {
      totalErrors: this.errorHistory.length,
      errorsBySeverity,
      errorsByOperation: { ...this.errorStats },
      lastErrorTime
    };
  }

  setDebugMode(debug: boolean): void {
    this.debugMode = debug;
  }
}
