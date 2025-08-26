/**
 * 日志工具
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs-extra';
import { CONFIG_DIR, LOGS_DIR } from '../constants';

export class Logger {
  private logger: winston.Logger;
  private static instances: Map<string, Logger> = new Map();

  private constructor(private name: string) {
    this.logger = this.createWinstonLogger();
  }

  /**
   * 获取Logger实例
   */
  static getInstance(name: string): Logger {
    if (!Logger.instances.has(name)) {
      Logger.instances.set(name, new Logger(name));
    }
    return Logger.instances.get(name)!;
  }

  /**
   * 创建Winston Logger
   */
  private createWinstonLogger(): winston.Logger {
    const logsDir = path.join(process.cwd(), CONFIG_DIR, LOGS_DIR);
    fs.ensureDirSync(logsDir);

    const logFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      winston.format.errors({ stack: true }),
      winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
        const stackStr = stack ? `\n${stack}` : '';
        return `[${timestamp}] [${this.name}] ${level.toUpperCase()}: ${message}${metaStr}${stackStr}`;
      })
    );

    const transports: winston.transport[] = [
      // 控制台输出
      new winston.transports.Console({
        level: process.env.LOG_LEVEL || 'info',
        format: winston.format.combine(winston.format.colorize(), logFormat),
      }),

      // 所有日志文件
      new winston.transports.File({
        filename: path.join(logsDir, 'taskflow.log'),
        level: 'debug',
        format: logFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      }),

      // 错误日志文件
      new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        format: logFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 3,
      }),
    ];

    return winston.createLogger({
      level: 'debug',
      format: logFormat,
      transports,
      exitOnError: false,
    });
  }

  /**
   * Debug级别日志
   */
  debug(message: string, ...args: any[]): void {
    this.logger.debug(message, ...args);
  }

  /**
   * Info级别日志
   */
  info(message: string, ...args: any[]): void {
    this.logger.info(message, ...args);
  }

  /**
   * Warning级别日志
   */
  warn(message: string, ...args: any[]): void {
    this.logger.warn(message, ...args);
  }

  /**
   * Error级别日志
   */
  error(message: string, error?: Error | any, ...args: any[]): void {
    if (error instanceof Error) {
      this.logger.error(message, { error: error.message, stack: error.stack, ...args });
    } else if (error) {
      this.logger.error(message, { error, ...args });
    } else {
      this.logger.error(message, ...args);
    }
  }

  /**
   * 性能日志
   */
  perf(operation: string, duration: number, details?: any): void {
    this.logger.info(`Performance: ${operation} completed in ${duration}ms`, {
      operation,
      duration,
      ...details,
    });
  }

  /**
   * 审计日志
   */
  audit(action: string, user: string, details?: any): void {
    this.logger.info(`Audit: ${action} by ${user}`, {
      action,
      user,
      timestamp: new Date().toISOString(),
      ...details,
    });
  }

  /**
   * 创建子Logger
   */
  child(childName: string): Logger {
    return Logger.getInstance(`${this.name}:${childName}`);
  }

  /**
   * 添加上下文信息
   */
  withContext(context: Record<string, any>): LoggerWithContext {
    return new LoggerWithContext(this, context);
  }
}

/**
 * 带上下文的Logger
 */
class LoggerWithContext {
  constructor(
    private logger: Logger,
    private context: Record<string, any>
  ) {}

  debug(message: string, ...args: any[]): void {
    this.logger.debug(message, this.context, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.logger.info(message, this.context, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.logger.warn(message, this.context, ...args);
  }

  error(message: string, error?: Error | any, ...args: any[]): void {
    this.logger.error(message, error, this.context, ...args);
  }
}

/**
 * 性能监控装饰器
 */
export function logPerformance(logger: Logger, operation?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const opName = operation || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - start;
        logger.perf(opName, duration, { success: true });
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        logger.perf(opName, duration, { success: false, error: (error as Error).message });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * 获取默认Logger实例
 */
export function getLogger(name: string = 'default'): Logger {
  return Logger.getInstance(name);
}

/**
 * 创建带计时的执行器
 */
export async function withTiming<T>(
  logger: Logger,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    logger.perf(operation, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.perf(operation, duration, { error: (error as Error).message });
    throw error;
  }
}
