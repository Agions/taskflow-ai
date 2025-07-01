/**
 * 项目管理API路由
 * 提供项目的CRUD操作、任务管理、进度跟踪等功能
 */

import { Router, Request, Response } from 'express';
const { body, param, query, validationResult } = require('express-validator');
import { ProjectController } from '../controllers/project-controller';
import { asyncHandler } from '../middleware/async-handler';
import { authorize } from '../middleware/auth';

const router = Router();
const projectController = new ProjectController();

/**
 * 获取项目列表
 * GET /api/v1/projects
 */
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('status').optional().isIn(['active', 'completed', 'archived']).withMessage('状态值无效'),
    query('search').optional().isString().withMessage('搜索关键词必须是字符串'),
    query('sortBy').optional().isIn(['name', 'createdAt', 'updatedAt', 'dueDate']).withMessage('排序字段无效'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('排序方向无效')
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '请求参数验证失败',
        errors: errors.array()
      });
    }

    await ProjectController.getProjects(req, res);
  })
);

/**
 * 获取项目详情
 * GET /api/v1/projects/:id
 */
router.get('/:id',
  [
    param('id').isUUID().withMessage('项目ID格式无效')
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '请求参数验证失败',
        errors: errors.array()
      });
    }

    await ProjectController.getProject(req, res);
  })
);

/**
 * 创建新项目
 * POST /api/v1/projects
 */
router.post('/',
  authorize(['admin', 'project_manager']),
  [
    body('name').notEmpty().isLength({ min: 1, max: 100 }).withMessage('项目名称长度必须在1-100字符之间'),
    body('description').optional().isLength({ max: 1000 }).withMessage('项目描述不能超过1000字符'),
    body('dueDate').optional().isISO8601().withMessage('截止日期格式无效'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('优先级值无效'),
    body('tags').optional().isArray().withMessage('标签必须是数组'),
    body('teamMembers').optional().isArray().withMessage('团队成员必须是数组'),
    body('requirements').optional().isArray().withMessage('需求列表必须是数组')
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '请求参数验证失败',
        errors: errors.array()
      });
    }

    await ProjectController.createProject(req, res);
  })
);

/**
 * 更新项目
 * PUT /api/v1/projects/:id
 */
router.put('/:id',
  authorize(['admin', 'project_manager']),
  [
    param('id').isUUID().withMessage('项目ID格式无效'),
    body('name').optional().isLength({ min: 1, max: 100 }).withMessage('项目名称长度必须在1-100字符之间'),
    body('description').optional().isLength({ max: 1000 }).withMessage('项目描述不能超过1000字符'),
    body('dueDate').optional().isISO8601().withMessage('截止日期格式无效'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('优先级值无效'),
    body('status').optional().isIn(['active', 'completed', 'archived']).withMessage('状态值无效'),
    body('tags').optional().isArray().withMessage('标签必须是数组'),
    body('teamMembers').optional().isArray().withMessage('团队成员必须是数组')
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '请求参数验证失败',
        errors: errors.array()
      });
    }

    await ProjectController.updateProject(req, res);
  })
);

/**
 * 删除项目
 * DELETE /api/v1/projects/:id
 */
router.delete('/:id',
  authorize(['admin']),
  [
    param('id').isUUID().withMessage('项目ID格式无效')
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '请求参数验证失败',
        errors: errors.array()
      });
    }

    await ProjectController.deleteProject(req, res);
  })
);

/**
 * 获取项目任务列表
 * GET /api/v1/projects/:id/tasks
 */
router.get('/:id/tasks',
  [
    param('id').isUUID().withMessage('项目ID格式无效'),
    query('status').optional().isIn(['not_started', 'in_progress', 'completed', 'blocked', 'cancelled']).withMessage('状态值无效'),
    query('assignee').optional().isString().withMessage('负责人必须是字符串'),
    query('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('优先级值无效')
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '请求参数验证失败',
        errors: errors.array()
      });
    }

    await ProjectController.getProjectTasks(req, res);
  })
);

/**
 * 获取项目统计信息
 * GET /api/v1/projects/:id/stats
 */
router.get('/:id/stats',
  [
    param('id').isUUID().withMessage('项目ID格式无效')
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '请求参数验证失败',
        errors: errors.array()
      });
    }

    await ProjectController.getProjectStats(req, res);
  })
);

/**
 * 生成项目报告
 * POST /api/v1/projects/:id/reports
 */
router.post('/:id/reports',
  authorize(['admin', 'project_manager']),
  [
    param('id').isUUID().withMessage('项目ID格式无效'),
    body('type').isIn(['progress', 'performance', 'summary']).withMessage('报告类型无效'),
    body('format').optional().isIn(['json', 'pdf', 'excel']).withMessage('报告格式无效'),
    body('dateRange').optional().isObject().withMessage('日期范围必须是对象'),
    body('includeCharts').optional().isBoolean().withMessage('包含图表必须是布尔值')
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '请求参数验证失败',
        errors: errors.array()
      });
    }

    await ProjectController.generateReport(req, res);
  })
);

/**
 * 导出项目数据
 * GET /api/v1/projects/:id/export
 */
router.get('/:id/export',
  authorize(['admin', 'project_manager']),
  [
    param('id').isUUID().withMessage('项目ID格式无效'),
    query('format').optional().isIn(['json', 'csv', 'excel']).withMessage('导出格式无效'),
    query('includeFiles').optional().isBoolean().withMessage('包含文件必须是布尔值')
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '请求参数验证失败',
        errors: errors.array()
      });
    }

    // 设置下载响应头
    const format = req.query.format as string || 'json';
    const filename = `project-${req.params.id}.${format}`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', getContentType(format));

    await ProjectController.exportProject(req, res);
  })
);

/**
 * 复制项目
 * POST /api/v1/projects/:id/clone
 */
router.post('/:id/clone',
  authorize(['admin', 'project_manager']),
  [
    param('id').isUUID().withMessage('项目ID格式无效'),
    body('name').notEmpty().isLength({ min: 1, max: 100 }).withMessage('新项目名称长度必须在1-100字符之间'),
    body('includeTasks').optional().isBoolean().withMessage('包含任务必须是布尔值'),
    body('includeTeam').optional().isBoolean().withMessage('包含团队必须是布尔值'),
    body('includeFiles').optional().isBoolean().withMessage('包含文件必须是布尔值')
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '请求参数验证失败',
        errors: errors.array()
      });
    }

    await ProjectController.cloneProject(req, res);
  })
);

/**
 * 归档项目
 * POST /api/v1/projects/:id/archive
 */
router.post('/:id/archive',
  authorize(['admin', 'project_manager']),
  [
    param('id').isUUID().withMessage('项目ID格式无效')
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '请求参数验证失败',
        errors: errors.array()
      });
    }

    await ProjectController.archiveProject(req, res);
  })
);

/**
 * 恢复项目
 * POST /api/v1/projects/:id/restore
 */
router.post('/:id/restore',
  authorize(['admin', 'project_manager']),
  [
    param('id').isUUID().withMessage('项目ID格式无效')
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '请求参数验证失败',
        errors: errors.array()
      });
    }

    await ProjectController.restoreProject(req, res);
  })
);

/**
 * 获取内容类型
 * @param format 文件格式
 */
function getContentType(format: string): string {
  const contentTypes: Record<string, string> = {
    json: 'application/json',
    csv: 'text/csv',
    excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pdf: 'application/pdf'
  };

  return contentTypes[format] || 'application/octet-stream';
}

export { router as projectRoutes };
