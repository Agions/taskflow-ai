import winston from 'winston';
import path from 'path';
import fs from 'fs-extra';
import {  LoggerConfig } from '../types/config';

/**
 * 日志服务，用于记录应用运行日志
 */
export class Logger {
  private static instance: Logger;
  private logger: winston.Logger;

  /**
   * 创建日志服务实例
   * @param config 日志配置
   */
  private constructor(config: LoggerConfig) {
    const logDir = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.config', 'mcp', 'logs');
    fs.ensureDirSync(logDir);

    const logFile = config.file || path.join(logDir, 'mcp.log');

    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} ${level}: ${message}`;
      })
    );

    const fileFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    );

    const transports: winston.transport[] = [];

    // 根据配置添加控制台日志传输
    if (config.output === 'console' || config.output === 'both') {
      transports.push(
        new winston.transports.Console({
          format: consoleFormat,
          level: config.level,
        })
      );
    }

    // 根据配置添加文件日志传输
    if (config.output === 'file' || config.output === 'both') {
      transports.push(
        new winston.transports.File({
          filename: logFile,
          format: fileFormat,
          level: config.level,
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        })
      );
    }

    this.logger = winston.createLogger({
      level: config.level,
      levels: winston.config.npm.levels,
      defaultMeta: { service: 'mcp' },
      transports,
    });
  }

  /**
   * 获取日志服务实例
   * @param config 日志配置
   */
  public static getInstance(config: LoggerConfig): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }

  /**
   * 更新日志配置
   * @param config 日志配置
   */
  public updateConfig(config: LoggerConfig): void {
    Logger.instance = new Logger(config);
  }

  /**
   * 记录错误级别日志
   * @param message 日志消息
   * @param meta 元数据
   */
  public error(message: string, meta?: any): void {
    this.logger.error(message, meta);
  }

  /**
   * 记录警告级别日志
   * @param message 日志消息
   * @param meta 元数据
   */
  public warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  /**
   * 记录信息级别日志
   * @param message 日志消息
   * @param meta 元数据
   */
  public info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  /**
   * 记录调试级别日志
   * @param message 日志消息
   * @param meta 元数据
   */
  public debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  /**
   * 通用日志记录方法
   * @param level 日志级别
   * @param message 日志消息
   * @param meta 元数据
   */
  public log(level: string, message: string, meta?: any): void {
    this.logger.log(level, message, meta);
  }
}