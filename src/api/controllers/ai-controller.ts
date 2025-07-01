/**
 * AI 控制器
 * 处理AI相关的API请求
 */

import { Request, Response } from 'express';
import { taskFlowService } from '../../mcp/index';
import { ModelType } from '../../types/config';
import { FileType } from '../../types/model';

/**
 * AI 控制器类
 */
export class AIController {
  /**
   * 解析PRD文档
   */
  static async parsePRD(req: Request, res: Response) {
    try {
      const { content, modelType = ModelType.DEEPSEEK } = req.body;
      const file = (req as any).file;

      let result;
      if (file) {
        // 从文件解析
        result = await taskFlowService.parsePRDFromFile(file.path, { modelType });
      } else if (content) {
        // 从内容解析
        result = await taskFlowService.parsePRD(content, FileType.MARKDOWN, { modelType });
      } else {
        return res.status(400).json({
          success: false,
          error: { message: 'Content or file is required' }
        });
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message }
      });
    }
  }

  /**
   * 生成任务计划
   */
  static async generatePlan(req: Request, res: Response) {
    try {
      const { prdData, options } = req.body;

      const result = await taskFlowService.generateTaskPlan(prdData, options);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message }
      });
    }
  }

  /**
   * 获取任务状态
   */
  static async getTaskStatus(req: Request, res: Response) {
    try {
      const result = await taskFlowService.getTaskStatus();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message }
      });
    }
  }

  /**
   * 更新任务状态
   */
  static async updateTaskStatus(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const { status, data } = req.body;

      const result = await taskFlowService.updateTaskStatus(taskId, status, data);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message }
      });
    }
  }

  /**
   * 获取推荐任务
   */
  static async getRecommendedTask(req: Request, res: Response) {
    try {
      const result = await taskFlowService.getRecommendedTask();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message }
      });
    }
  }

  /**
   * 生成可视化
   */
  static async generateVisualization(req: Request, res: Response) {
    try {
      const { type, options } = req.body;

      const result = await taskFlowService.generateVisualization(type, options);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message }
      });
    }
  }

  /**
   * AI 聊天
   */
  static async chat(req: Request, res: Response) {
    try {
      const { message, context } = req.body;

      const result = await taskFlowService.chat(message, context);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message }
      });
    }
  }

  /**
   * 生成任务
   */
  static async generateTasks(req: Request, res: Response) {
    try {
      const result = await taskFlowService.generateTasks(req, res);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message }
      });
    }
  }

  /**
   * 编排任务
   */
  static async orchestrateTasks(req: Request, res: Response) {
    try {
      const result = await taskFlowService.orchestrateTasks(req, res);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message }
      });
    }
  }

  /**
   * 生成文档
   */
  static async generateDocuments(req: Request, res: Response) {
    try {
      const result = await taskFlowService.generateDocuments(req, res);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message }
      });
    }
  }

  /**
   * 生成图表
   */
  static async generateCharts(req: Request, res: Response) {
    try {
      const result = await taskFlowService.generateCharts(req, res);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message }
      });
    }
  }

  /**
   * 聊天流式响应
   */
  static async chatStream(req: Request, res: Response) {
    try {
      await taskFlowService.chatStream(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message }
      });
    }
  }

  /**
   * 获取模型列表
   */
  static async getModels(req: Request, res: Response) {
    try {
      const result = await taskFlowService.getModels(req, res);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message }
      });
    }
  }

  /**
   * 获取模型状态
   */
  static async getModelStatus(req: Request, res: Response) {
    try {
      const result = await taskFlowService.getModelStatus(req, res);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message }
      });
    }
  }

  /**
   * 验证需求
   */
  static async validateRequirements(req: Request, res: Response) {
    try {
      const result = await taskFlowService.validateRequirements(req, res);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message }
      });
    }
  }

  /**
   * 估算工作量
   */
  static async estimateEffort(req: Request, res: Response) {
    try {
      const result = await taskFlowService.estimateEffort(req, res);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message }
      });
    }
  }

  /**
   * 获取使用统计
   */
  static async getUsageStats(req: Request, res: Response) {
    try {
      const result = await taskFlowService.getUsageStats(req, res);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message }
      });
    }
  }
}
