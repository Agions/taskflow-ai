/**
 * 请求日志中间件
 */

import { Request, Response, NextFunction } from 'express';
import { Logger } from '../../infra/logger';
import { LogLevel } from '../../types/config';

/**
 * 请求日志中间件工厂函数
 */
export function requestLogger(logger: Logger) {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const { method, url, ip } = req;

    // 记录请求开始
    logger.info(`${method} ${url} - ${ip}`);

    // 监听响应结束
    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;

      logger.info(`${method} ${url} - ${statusCode} - ${duration}ms`);
    });

    next();
  };
}
