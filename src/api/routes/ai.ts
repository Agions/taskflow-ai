/**
 * AI功能API路由
 * 提供PRD解析、任务生成、智能编排等AI功能的API接口
 */

import { Router, Request, Response } from 'express';
const { body, query, validationResult } = require('express-validator');
import { AIController } from '../controllers/ai-controller';
import { asyncHandler } from '../middleware/async-handler';
import { authorize } from '../middleware/auth';
import { upload } from '../middleware/file-upload';

const router = Router();
const aiController = new AIController();

/**
 * 解析PRD文档
 * POST /api/v1/ai/parse-prd
 */
router.post('/parse-prd',
  authorize(['admin', 'project_manager', 'developer']),
  upload.single('file'),
  [
    body('content').optional().isString().withMessage('文档内容必须是字符串'),
    body('format').optional().isIn(['markdown', 'text', 'json']).withMessage('文档格式无效'),
    body('language').optional().isIn(['zh-CN', 'en-US']).withMessage('语言设置无效'),
    body('extractionOptions').optional().isObject().withMessage('提取选项必须是对象')
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

    // 检查是否提供了文档内容或文件
    if (!req.body.content && !req.file) {
      return res.status(400).json({
        success: false,
        message: '必须提供文档内容或上传文件'
      });
    }

    await AIController.parsePRD(req, res);
  })
);

/**
 * 生成任务计划
 * POST /api/v1/ai/generate-tasks
 */
router.post('/generate-tasks',
  authorize(['admin', 'project_manager']),
  [
    body('requirements').isArray({ min: 1 }).withMessage('需求列表不能为空'),
    body('requirements.*.title').notEmpty().withMessage('需求标题不能为空'),
    body('requirements.*.description').notEmpty().withMessage('需求描述不能为空'),
    body('requirements.*.priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('优先级值无效'),
    body('requirements.*.type').optional().isIn(['functional', 'non_functional', 'business', 'technical']).withMessage('需求类型无效'),
    body('generationOptions').optional().isObject().withMessage('生成选项必须是对象'),
    body('generationOptions.teamSize').optional().isInt({ min: 1, max: 50 }).withMessage('团队规模必须在1-50之间'),
    body('generationOptions.includeDocumentation').optional().isBoolean().withMessage('包含文档必须是布尔值'),
    body('generationOptions.estimationMethod').optional().isIn(['simple', 'detailed', 'expert']).withMessage('估算方法无效')
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

    await AIController.generateTasks(req, res);
  })
);

/**
 * 智能任务编排
 * POST /api/v1/ai/orchestrate
 */
router.post('/orchestrate',
  authorize(['admin', 'project_manager']),
  [
    body('taskPlan').isObject().withMessage('任务计划必须是对象'),
    body('taskPlan.tasks').isArray({ min: 1 }).withMessage('任务列表不能为空'),
    body('requirements').optional().isArray().withMessage('需求列表必须是数组'),
    body('orchestrationOptions').optional().isObject().withMessage('编排选项必须是对象'),
    body('orchestrationOptions.strategy').optional().isIn(['balanced', 'speed', 'quality', 'cost']).withMessage('编排策略无效'),
    body('orchestrationOptions.teamSize').optional().isInt({ min: 1, max: 50 }).withMessage('团队规模必须在1-50之间'),
    body('orchestrationOptions.riskTolerance').optional().isIn(['low', 'medium', 'high']).withMessage('风险容忍度无效')
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

    await AIController.orchestrateTasks(req, res);
  })
);

/**
 * 生成项目文档
 * POST /api/v1/ai/generate-docs
 */
router.post('/generate-docs',
  authorize(['admin', 'project_manager', 'developer']),
  [
    body('taskPlan').isObject().withMessage('任务计划必须是对象'),
    body('requirements').optional().isArray().withMessage('需求列表必须是数组'),
    body('documentTypes').isArray({ min: 1 }).withMessage('文档类型列表不能为空'),
    body('documentTypes.*').isIn([
      'project_overview', 'technical_spec', 'api_documentation',
      'user_manual', 'deployment_guide', 'test_plan'
    ]).withMessage('文档类型无效'),
    body('documentOptions').optional().isObject().withMessage('文档选项必须是对象'),
    body('documentOptions.format').optional().isIn(['markdown', 'html', 'pdf']).withMessage('文档格式无效'),
    body('documentOptions.language').optional().isIn(['zh-CN', 'en-US']).withMessage('语言设置无效')
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

    await AIController.generateDocuments(req, res);
  })
);

/**
 * 生成数据可视化
 * POST /api/v1/ai/generate-charts
 */
router.post('/generate-charts',
  authorize(['admin', 'project_manager', 'developer']),
  [
    body('taskPlan').isObject().withMessage('任务计划必须是对象'),
    body('chartTypes').isArray({ min: 1 }).withMessage('图表类型列表不能为空'),
    body('chartTypes.*').isIn([
      'gantt', 'burndown', 'progress', 'workload',
      'dependency', 'velocity', 'risk_matrix'
    ]).withMessage('图表类型无效'),
    body('chartOptions').optional().isObject().withMessage('图表选项必须是对象'),
    body('chartOptions.theme').optional().isIn(['light', 'dark', 'auto']).withMessage('主题设置无效'),
    body('chartOptions.format').optional().isIn(['svg', 'png', 'json']).withMessage('图表格式无效')
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

    await AIController.generateCharts(req, res);
  })
);

/**
 * AI聊天对话
 * POST /api/v1/ai/chat
 */
router.post('/chat',
  authorize(['admin', 'project_manager', 'developer']),
  [
    body('message').notEmpty().isLength({ max: 2000 }).withMessage('消息内容不能为空且不超过2000字符'),
    body('context').optional().isObject().withMessage('上下文必须是对象'),
    body('context.projectId').optional().isUUID().withMessage('项目ID格式无效'),
    body('context.taskId').optional().isUUID().withMessage('任务ID格式无效'),
    body('modelOptions').optional().isObject().withMessage('模型选项必须是对象'),
    body('modelOptions.model').optional().isString().withMessage('模型名称必须是字符串'),
    body('modelOptions.temperature').optional().isFloat({ min: 0, max: 2 }).withMessage('温度参数必须在0-2之间')
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

    await AIController.chat(req, res);
  })
);

/**
 * 流式AI聊天
 * POST /api/v1/ai/chat/stream
 */
router.post('/chat/stream',
  authorize(['admin', 'project_manager', 'developer']),
  [
    body('message').notEmpty().isLength({ max: 2000 }).withMessage('消息内容不能为空且不超过2000字符'),
    body('context').optional().isObject().withMessage('上下文必须是对象'),
    body('modelOptions').optional().isObject().withMessage('模型选项必须是对象')
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

    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    await AIController.chatStream(req, res);
  })
);

/**
 * 获取AI模型列表
 * GET /api/v1/ai/models
 */
router.get('/models',
  authorize(['admin', 'project_manager', 'developer']),
  asyncHandler(async (req: Request, res: Response) => {
    await AIController.getModels(req, res);
  })
);

/**
 * 获取AI模型状态
 * GET /api/v1/ai/models/status
 */
router.get('/models/status',
  authorize(['admin']),
  asyncHandler(async (req: Request, res: Response) => {
    await AIController.getModelStatus(req, res);
  })
);

/**
 * 验证需求质量
 * POST /api/v1/ai/validate-requirements
 */
router.post('/validate-requirements',
  authorize(['admin', 'project_manager', 'developer']),
  [
    body('requirements').isArray({ min: 1 }).withMessage('需求列表不能为空'),
    body('requirements.*.title').notEmpty().withMessage('需求标题不能为空'),
    body('requirements.*.description').notEmpty().withMessage('需求描述不能为空'),
    body('validationOptions').optional().isObject().withMessage('验证选项必须是对象'),
    body('validationOptions.checkCompleteness').optional().isBoolean().withMessage('检查完整性必须是布尔值'),
    body('validationOptions.checkConsistency').optional().isBoolean().withMessage('检查一致性必须是布尔值'),
    body('validationOptions.checkFeasibility').optional().isBoolean().withMessage('检查可行性必须是布尔值')
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

    await AIController.validateRequirements(req, res);
  })
);

/**
 * 估算项目工作量
 * POST /api/v1/ai/estimate-effort
 */
router.post('/estimate-effort',
  authorize(['admin', 'project_manager']),
  [
    body('requirements').optional().isArray().withMessage('需求列表必须是数组'),
    body('tasks').optional().isArray().withMessage('任务列表必须是数组'),
    body('estimationOptions').optional().isObject().withMessage('估算选项必须是对象'),
    body('estimationOptions.method').optional().isIn(['simple', 'detailed', 'expert', 'historical']).withMessage('估算方法无效'),
    body('estimationOptions.teamExperience').optional().isIn(['junior', 'intermediate', 'senior', 'expert']).withMessage('团队经验等级无效'),
    body('estimationOptions.projectComplexity').optional().isIn(['low', 'medium', 'high', 'very_high']).withMessage('项目复杂度无效')
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

    // 检查是否提供了需求或任务
    if (!req.body.requirements && !req.body.tasks) {
      return res.status(400).json({
        success: false,
        message: '必须提供需求列表或任务列表'
      });
    }

    await AIController.estimateEffort(req, res);
  })
);

/**
 * 获取AI使用统计
 * GET /api/v1/ai/usage-stats
 */
router.get('/usage-stats',
  authorize(['admin']),
  [
    query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
    query('groupBy').optional().isIn(['day', 'week', 'month']).withMessage('分组方式无效')
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

    await AIController.getUsageStats(req, res);
  })
);

export { router as aiRoutes };
