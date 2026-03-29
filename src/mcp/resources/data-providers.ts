import { getLogger } from '../../utils/logger';
/**
 * 数据提供者
 */

import path from 'path';
import fs from 'fs-extra';
import { Logger } from '../../utils/logger';
const logger = getLogger('mcp/resources/data-providers');


export class DataProviders {
  constructor(private logger: Logger) {}

  async getTasksData(): Promise<unknown[]> {
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
            return data.tasks || [];
          }
        }
      }

      return [];
    } catch (error) {
      this.logger.warn('获取任务数据失败:', error);
      return [];
    }
  }

  async getProjectsData(): Promise<unknown> {
    try {
      const configPath = path.join(process.cwd(), '.taskflow', 'config.json');
      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);
        return {
          name: config.projectName || 'Unknown Project',
          version: config.version || '1.0.0',
          description: 'TaskFlow AI managed project',
          createdAt: new Date().toISOString(),
          aiModels: config.aiModels?.length || 0,
          mcpEnabled: config.mcpSettings?.enabled || false,
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

  async getConfigData(): Promise<unknown> {
    try {
      const configPath = path.join(process.cwd(), '.taskflow', 'config.json');
      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);
        const safeConfig = { ...config };
        if (safeConfig.aiModels) {
          safeConfig.aiModels = safeConfig.aiModels.map((model: unknown) => ({
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

  async getModelsData(): Promise<unknown> {
    try {
      const configData = await this.getConfigData();
      return {
        models: configData.aiModels || [],
        totalModels: configData.aiModels?.length || 0,
        enabledModels: configData.aiModels?.filter((m: unknown) => m.enabled).length || 0,
      };
    } catch (error) {
      this.logger.warn('获取模型数据失败:', error);
      return { models: [], totalModels: 0, enabledModels: 0 };
    }
  }

  getStatusData(resourceCount: number): unknown {
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

  async getAnalyticsData(resourceCount: number): Promise<unknown> {
    try {
      const tasks = await this.getTasksData();
      const projects = await this.getProjectsData();

      return {
        tasks: {
          total: tasks.length,
          byStatus: this.groupBy(tasks, 'status'),
          byType: this.groupBy(tasks, 'type'),
          byPriority: this.groupBy(tasks, 'priority'),
          totalHours: tasks.reduce((sum: number, task: unknown) => sum + (task.estimatedHours || 0), 0),
        },
        projects: {
          total: 1,
          aiModelsConfigured: projects.aiModels || 0,
          mcpEnabled: projects.mcpEnabled,
        },
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.warn('获取分析数据失败:', error);
      return { error: 'Failed to generate analytics' };
    }
  }

  private groupBy(array: unknown[], field: string): Record<string, number> {
    return array.reduce((acc, item) => {
      const key = item[field] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }
}
