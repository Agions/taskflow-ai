/**
 * Logger - 统一日志系统
 * TaskFlow AI v4.0
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4
}

export interface LoggerContext {
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LoggerContext;
  timestamp: number;
  source: string;
}

export class Logger {
  private static instances: Map<string, Logger> = new Map();
  private source: string;
  private level: LogLevel;
  private context: LoggerContext;
  private history: LogEntry[] = [];
  private maxHistorySize = 1000;

  private constructor(source: string, context: LoggerContext = {}) {
    this.source = source;
    this.level = this.getLevelFromEnv();
    this.context = context;
  }

  static getInstance(source: string, context?: LoggerContext): Logger {
    if (!Logger.instances.has(source)) {
      Logger.instances.set(source, new Logger(source, context));
    }
    return Logger.instances.get(source)!;
  }

  static reset(): void {
    Logger.instances.clear();
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  setContext(context: LoggerContext): void {
    this.context = { ...this.context, ...context };
  }

  debug(message: string, context?: LoggerContext | unknown): void {
    if (this.level > LogLevel.DEBUG) return;

    const entry = this.log(LogLevel.DEBUG, message, context as LoggerContext);
    this.output(entry);
  }

  info(message: string, context?: LoggerContext | unknown): void {
    if (this.level > LogLevel.INFO) return;

    const entry = this.log(LogLevel.INFO, message, context as LoggerContext);
    this.output(entry);
  }

  warn(message: string, context?: LoggerContext | unknown): void {
    if (this.level > LogLevel.WARN) return;

    const entry = this.log(LogLevel.WARN, message, context as LoggerContext);
    this.output(entry);
  }

  error(message: string, context?: LoggerContext | unknown): void {
    if (this.level > LogLevel.ERROR) return;

    const entry = this.log(LogLevel.ERROR, message, context as LoggerContext);
    this.output(entry);
  }

  private log(level: LogLevel, message: string, context?: LoggerContext): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      context: { ...this.context, ...context },
      timestamp: Date.now(),
      source: this.source
    };

    // 添加到历史
    this.history.push(entry);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    const levelName = this.getLevelName(entry.level);
    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[${timestamp}] [${levelName}] [${entry.source}]`;

    // 格式化上下文
    let contextStr = '';
    if (entry.context && Object.keys(entry.context).length > 0) {
      contextStr = ` ${JSON.stringify(entry.context)}`;
    }

    const message = `${prefix} ${entry.message}${contextStr}`;

    // 根据级别输出到不同的 stream
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.log(message);
        break;
      case LogLevel.INFO:
        console.log(message);
        break;
      case LogLevel.WARN:
        console.warn(message);
        break;
      case LogLevel.ERROR:
        console.error(message);
        break;
    }
  }

  private getLevelName(level: LogLevel): string {
    return LogLevel[level];
  }

  private getLevelFromEnv(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    if (envLevel && envLevel in LogLevel) {
      return LogLevel[envLevel as keyof typeof LogLevel];
    }
    return LogLevel.INFO;
  }

  getHistory(): LogEntry[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }
}

/**
 * 全局日志方法
 */
export const logger = Logger.getInstance('global');

export const log = {
  debug: (message: string, context?: LoggerContext) => logger.debug(message, context),
  info: (message: string, context?: LoggerContext) => logger.info(message, context),
  warn: (message: string, context?: LoggerContext) => logger.warn(message, context),
  error: (message: string, context?: LoggerContext) => logger.error(message, context)
};

/**
 * 获取 Logger 实例（兼容旧代码）
 */
export function getLogger(source: string, context?: LoggerContext): Logger {
  return Logger.getInstance(source, context);
}
