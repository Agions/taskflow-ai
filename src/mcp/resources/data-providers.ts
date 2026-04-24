import { getLogger } from '../../utils/logger';

/**
 * 数据提供者
 */

import path from 'path';
import fs from 'fs-extra';
import { Logger } from '../../utils/logger';
import { Task, TaskStatus, TaskType } from '../../types/task';
import { AIModelConfig } from '../../types';
const logger = getLogger('mcp/resources/data-providers');

/** 任务数据统计 */
interface TaskAnalytics {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  totalHours: number;
}

/** 项目分析数据 */
interface ProjectAnalytics {
  total: number;
  aiModelsConfigured: number;
  mcpEnabled: boolean;
}

/** 分析数据输出 */
interface AnalyticsData {
  tasks: TaskAnalytics;
  projects: ProjectAnalytics;
  generatedAt: string;
}

/** 模型数据统计 */
interface ModelsData {
  models: AIModelConfig[];
  totalModels: number;
  enabledModels: number;
}

export class DataProviders {
  constructor(private logger: Logger) {}

  async getTasksData(): Promise<Task[]> {
    try {
      const possiblePaths = [
        path.join(process.cwd(), '.taskflow', 'data'),
        path.join(process.cwd(), '.taskflow'),
      ];

      for (const dir of possiblePaths) {
        if (await fs.pathExists(dir)) {
          const files = await fs.readdir(dir);
          const taskFiles = files.filter(f => f.includes('task') && f.endsWith('.json'));

          if (taskFiles.length > 0) {
            const latestFile = path.join(dir, taskFiles[taskFiles.length - 1]);
            const data = await fs.readJson(latestFile);
            return (data.tasks || []) as Task[];
          }
        }
      }

      return [];
    } catch (error) {
      this.logger.warn('获取任务数据失败:', error);
      return [];
    }
  }

  async getProjectsData(): Promise<Record<string, unknown>> {
    try {
      const configPath = path.join(process.cwd(), '.taskflow', 'config.json');
      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);
        return {
          name: config.projectName || 'Unknown Project',
          version: config.version || '1.0.0',
          description: 'TaskFlow AI managed project',
          createdAt: new Date().toISOString(),
          aiModels: config.aiModels!?.length || 0,
          mcpEnabled: config.mcpSettings!?.enabled || false,
        };
      }

      return {
        name: 'Default Project',
        version: '1.0.0',
        description: 'No configuration found',
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.warn('获取项目数据失败:', error);
      return { error: 'Failed to load project data' };
    }
  }

  async getConfigData(): Promise<Record<string, unknown>> {
    try {
      const configPath = path.join(process.cwd(), '.taskflow', 'config.json');
      if (await fs.pathExists(configPath)) {
        const config: Record<string, unknown> = await fs.readJson(configPath);
        const safeConfig = { ...config };
        if (Array.isArray(safeConfig.aiModels)) {
          safeConfig.aiModels = (safeConfig.aiModels as Record<string, unknown>[]).map(model => ({
            ...model,
            apiKey: model.apiKey ? '***' : undefined,
          }));
        }
        return safeConfig;
      }

      return { error: 'No configuration found' };
    } catch (error) {
      this.logger.warn('获取配置数据失败:', error);
      return { error: 'Failed to load configuration' };
    }
  }

  async getModelsData(): Promise<ModelsData> {
    try {
      const configData: Record<string, unknown> = (await this.getConfigData()) as Record<
        string,
        unknown
      >;
      const models = (configData.aiModels || []) as AIModelConfig[];
      return {
        models,
        totalModels: models.length,
        enabledModels: models.filter(m => m.enabled).length,
      };
    } catch (error) {
      this.logger.warn('获取模型数据失败:', error);
      return { models: [], totalModels: 0, enabledModels: 0 };
    }
  }

  getStatusData(resourceCount: number): Record<string, unknown> {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      timestamp: new Date().toISOString(),
      resourceCount,
    };
  }

  async getAnalyticsData(resourceCount: number): Promise<AnalyticsData | { error: string }> {
    try {
      const tasks = await this.getTasksData();
      const projects = await this.getProjectsData();

      return {
        tasks: {
          total: tasks.length,
          byStatus: this.groupBy(tasks, 'status'),
          byType: this.groupBy(tasks, 'type'),
          byPriority: this.groupBy(tasks, 'priority'),
          totalHours: tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
        },
        projects: {
          total: 1,
          aiModelsConfigured: (projects as Record<string, number>).aiModels || 0,
          mcpEnabled: (projects as Record<string, boolean>).mcpEnabled || false,
        },
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.warn('获取分析数据失败:', error);
      return { error: 'Failed to generate analytics' };
    }
  }

  private groupBy<T extends object>(array: T[], field: keyof T): Record<string, number> {
    return array.reduce(
      (acc, item) => {
        const key = String(item[field] ?? 'unknown');
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }
}
