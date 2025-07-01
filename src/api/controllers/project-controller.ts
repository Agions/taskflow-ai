/**
 * 项目控制器
 * 处理项目相关的API请求
 */

import { Request, Response } from 'express';
import { taskFlowService } from '../../mcp/index';

/**
 * 项目控制器类
 */
export class ProjectController {
  /**
   * 创建项目
   */
  static async createProject(req: Request, res: Response) {
    try {
      const projectData = req.body;

      const result = await taskFlowService.createProject(projectData);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message }
      });
    }
  }

  /**
   * 获取项目列表
   */
  static async getProjects(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, status } = req.query;

      const result = await taskFlowService.getProjects({
        page: Number(page),
        limit: Number(limit),
        status: status as string
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message }
      });
    }
  }

  /**
   * 获取项目详情
   */
  static async getProject(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await taskFlowService.getProject(id);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message }
      });
    }
  }

  /**
   * 更新项目
   */
  static async updateProject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const result = await taskFlowService.updateProject(id, updateData);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message }
      });
    }
  }

  /**
   * 删除项目
   */
  static async deleteProject(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await taskFlowService.deleteProject(id);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message }
      });
    }
  }

  /**
   * 获取项目任务
   */
  static async getProjectTasks(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, assignee } = req.query;

      const result = await taskFlowService.getProjectTasks(id, {
        status: status as string,
        assignee: assignee as string
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message }
      });
    }
  }

  /**
   * 获取项目统计
   */
  static async getProjectStats(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await taskFlowService.getProjectStats(id);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message }
      });
    }
  }

  /**
   * 生成项目报告
   */
  static async generateReport(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { format = 'json', includeStats = true } = req.query;

      const result = await taskFlowService.generateProjectReport(id, {
        format: format as string,
        includeStats: includeStats === 'true'
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message }
      });
    }
  }

  /**
   * 导出项目
   */
  static async exportProject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { format = 'json' } = req.query;

      const result = await taskFlowService.exportProject(id, format as string);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message }
      });
    }
  }

  /**
   * 克隆项目
   */
  static async cloneProject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const result = await taskFlowService.cloneProject(id, { name, description });
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message }
      });
    }
  }

  /**
   * 归档项目
   */
  static async archiveProject(req: Request, res: Response) {
    try {
      await taskFlowService.archiveProject(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message }
      });
    }
  }

  /**
   * 恢复项目
   */
  static async restoreProject(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await taskFlowService.restoreProject(id);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message }
      });
    }
  }
}
