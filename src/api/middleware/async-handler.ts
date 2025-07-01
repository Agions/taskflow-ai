/**
 * 异步处理器中间件
 * 用于包装异步路由处理器，自动捕获错误
 */

import { Request, Response, NextFunction } from 'express';

/**
 * 异步处理器类型
 */
export type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

/**
 * 包装异步处理器，自动捕获错误
 * @param fn 异步处理函数
 */
export function asyncHandler(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 默认导出
 */
export default asyncHandler;
