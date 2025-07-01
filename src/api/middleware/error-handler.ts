/**
 * 错误处理中间件
 */

import { Request, Response, NextFunction } from 'express';
import { Logger } from '../../infra/logger';
import { LogLevel } from '../../types/config';

/**
 * 自定义错误类
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 错误处理中间件工厂函数
 */
export function errorHandler(logger: Logger) {
  return (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {

    let statusCode = 500;
    let message = 'Internal Server Error';

    if (error instanceof AppError) {
      statusCode = error.statusCode;
      message = error.message;
    } else if (error.name === 'ValidationError') {
      statusCode = 400;
      message = 'Validation Error';
    } else if (error.name === 'UnauthorizedError') {
      statusCode = 401;
      message = 'Unauthorized';
    }

    // 记录错误
    logger.error(`Error ${statusCode}: ${message}`, {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip
    });

    // 返回错误响应
    res.status(statusCode).json({
      success: false,
      error: {
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      }
    });
  };
}

/**
 * 404 处理中间件
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
}
