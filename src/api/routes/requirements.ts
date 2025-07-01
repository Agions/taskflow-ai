/**
 * 需求路由
 */

import { Router } from 'express';
const { body, param, query } = require('express-validator');
import { asyncHandler } from '../middleware/async-handler';
import { validationMiddleware } from '../middleware/validation';
import { authorize } from '../middleware/auth';

const router = Router();

/**
 * 获取需求列表
 */
router.get('/',
  authorize(['admin', 'project_manager', 'developer']),
  query('status').optional().isString(),
  query('priority').optional().isString(),
  validationMiddleware(),
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: [],
      message: 'Requirements retrieved successfully'
    });
  })
);

/**
 * 创建需求
 */
router.post('/',
  authorize(['admin', 'project_manager']),
  body('title').notEmpty().withMessage('Requirement title is required'),
  body('description').notEmpty().withMessage('Requirement description is required'),
  validationMiddleware(),
  asyncHandler(async (req, res) => {
    res.status(201).json({
      success: true,
      data: req.body,
      message: 'Requirement created successfully'
    });
  })
);

export { router as requirementRoutes };
