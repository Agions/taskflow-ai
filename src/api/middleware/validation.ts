/**
 * 验证中间件
 */

import { Request, Response, NextFunction } from 'express';
const { validationResult } = require('express-validator');

/**
 * 验证中间件工厂函数
 */
export function validationMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array()
        }
      });
      return;
    }

    next();
  };
}
