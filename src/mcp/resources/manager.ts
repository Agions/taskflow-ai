/**
 * MCP资源管理器
 * 管理项目中的各种资源，如任务、项目、配置等
 */

import path from 'path';
import fs from 'fs-extra';
import { Logger } from '../../utils/logger';

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  metadata?: {
    size?: number;
    lastModified?: string;
    version?: string;
    tags?: string[];
  };
}

export class MCPResourceManager {
  private resources: Map<string, MCPResource> = new Map();
  private logger: Logger;
  private dataDir: string;

  constructor(
    private config: any,
    logger?: Logger
  ) {
    this.logger = logger || Logger.getInstance('MCPResourceManager');
    this.dataDir = path.join(process.cwd(), '.taskflow', 'data');
  }

  /**
   * 初始化资源管理器
   */
  async initialize(): Promise<void> {
    this.logger.info('正在初始化MCP资源管理器...');

    try {
      // 确保数据目录存在
      await fs.ensureDir(this.dataDir);

      // 注册默认资源
      await this.registerDefaultResources();

      // 扫描现有资源
      await this.scanResources();

      this.logger.info(`资源管理器初始化完成，共注册 ${this.resources.size} 个资源`);
    } catch (error) {
      this.logger.error('资源管理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 注册默认资源
   */
  private async registerDefaultResources(): Promise<void> {
    const defaultResources: MCPResource[] = [
      {
        uri: '/tasks',
        name: 'tasks',
        description: '项目任务列表',
        mimeType: 'application/json',
        metadata: {
          tags: ['tasks', 'project', 'management'],
        },
      },
      {
        uri: '/projects',
        name: 'projects',
        description: '项目信息',
        mimeType: 'application/json',
        metadata: {
          tags: ['projects', 'metadata'],
        },
      },
      {
        uri: '/config',
        name: 'config',
        description: '项目配置',
        mimeType: 'application/json',
        metadata: {
          tags: ['config', 'settings'],
        },
      },
      {
        uri: '/models',
        name: 'models',
        description: 'AI模型配置',
        mimeType: 'application/json',
        metadata: {
          tags: ['ai', 'models', 'config'],
        },
      },
      {
        uri: '/status',
        name: 'status',
        description: '系统状态信息',
        mimeType: 'application/json',
        metadata: {
          tags: ['status', 'health', 'system'],
        },
      },
      {
        uri: '/analytics',
        name: 'analytics',
        description: '项目分析数据',
        mimeType: 'application/json',
        metadata: {
          tags: ['analytics', 'statistics', 'insights'],
        },
      },
    ];

    for (const resource of defaultResources) {
      this.registerResource(resource);
    }
  }

  /**
   * 扫描现有资源
   */
  private async scanResources(): Promise<void> {
    try {
      // 扫描数据目录中的文件
      const files = await this.findDataFiles();

      for (const file of files) {
        await this.registerFileResource(file);
      }
    } catch (error) {
      this.logger.warn('扫描资源失败:', error);
    }
  }

  /**
   * 查找数据文件
   */
  private async findDataFiles(): Promise<string[]> {
    const files: string[] = [];

    try {
      const items = await fs.readdir(this.dataDir);

      for (const item of items) {
        const itemPath = path.join(this.dataDir, item);
        const stats = await fs.stat(itemPath);

        if (stats.isFile()) {
          files.push(itemPath);
        }
      }
    } catch (error) {
      // 目录不存在或无法读取
    }

    return files;
  }

  /**
   * 注册文件资源
   */
  private async registerFileResource(filePath: string): Promise<void> {
    try {
      const stats = await fs.stat(filePath);
      const fileName = path.basename(filePath);
      const ext = path.extname(fileName);

      const resource: MCPResource = {
        uri: `/files/${fileName}`,
        name: fileName,
        description: `文件: ${fileName}`,
        mimeType: this.getMimeType(ext),
        metadata: {
          size: stats.size,
          lastModified: stats.mtime.toISOString(),
          tags: ['file', 'data'],
        },
      };

      this.registerResource(resource);
    } catch (error) {
      this.logger.warn(`注册文件资源失败: ${filePath}`, error);
    }
  }

  /**
   * 注册资源
   */
  registerResource(resource: MCPResource): void {
    this.resources.set(resource.uri, resource);
    this.logger.debug(`资源已注册: ${resource.uri}`);
  }

  /**
   * 取消注册资源
   */
  unregisterResource(uri: string): boolean {
    const result = this.resources.delete(uri);
    if (result) {
      this.logger.debug(`资源已取消注册: ${uri}`);
    }
    return result;
  }

  /**
   * 列出所有资源
   */
  async listResources(): Promise<MCPResource[]> {
    return Array.from(this.resources.values());
  }

  /**
   * 读取资源内容
   */
  async readResource(uri: string): Promise<any> {
    const resource = this.resources.get(uri);
    if (!resource) {
      throw new Error(`资源不存在: ${uri}`);
    }

    return await this.loadResourceContent(resource);
  }

  /**
   * 加载资源内容
   */
  private async loadResourceContent(resource: MCPResource): Promise<any> {
    const uri = resource.uri;

    // 处理默认资源
    if (uri.startsWith('/')) {
      return await this.loadDefaultResourceContent(uri);
    }

    // 处理文件资源
    if (uri.startsWith('/files/')) {
      const fileName = uri.substring(7);
      const filePath = path.join(this.dataDir, fileName);

      if (resource.mimeType === 'application/json') {
        return await fs.readJson(filePath);
      } else {
        return await fs.readFile(filePath, 'utf-8');
      }
    }

    throw new Error(`无法加载资源: ${uri}`);
  }

  /**
   * 加载默认资源内容
   */
  private async loadDefaultResourceContent(uri: string): Promise<any> {
    switch (uri) {
      case '/tasks':
        return await this.getTasksData();
      case '/projects':
        return await this.getProjectsData();
      case '/config':
        return await this.getConfigData();
      case '/models':
        return await this.getModelsData();
      case '/status':
        return await this.getStatusData();
      case '/analytics':
        return await this.getAnalyticsData();
      default:
        throw new Error(`未知的默认资源: ${uri}`);
    }
  }

  /**
   * 获取任务数据
   */
  private async getTasksData(): Promise<any> {
    try {
      // 尝试从多个可能的位置读取任务数据
      const possiblePaths = [
        path.join(process.cwd(), 'output'),
        path.join(process.cwd(), '.taskflow', 'data'),
        path.join(process.cwd(), 'data'),
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

  /**
   * 获取项目数据
   */
  private async getProjectsData(): Promise<any> {
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

  /**
   * 获取配置数据
   */
  private async getConfigData(): Promise<any> {
    try {
      const configPath = path.join(process.cwd(), '.taskflow', 'config.json');
      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);
        // 移除敏感信息
        const safeConfig = { ...config };
        if (safeConfig.aiModels) {
          safeConfig.aiModels = safeConfig.aiModels.map((model: any) => ({
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

  /**
   * 获取模型数据
   */
  private async getModelsData(): Promise<any> {
    try {
      const configData = await this.getConfigData();
      return {
        models: configData.aiModels || [],
        totalModels: configData.aiModels?.length || 0,
        enabledModels: configData.aiModels?.filter((m: any) => m.enabled).length || 0,
      };
    } catch (error) {
      this.logger.warn('获取模型数据失败:', error);
      return { models: [], totalModels: 0, enabledModels: 0 };
    }
  }

  /**
   * 获取状态数据
   */
  private async getStatusData(): Promise<any> {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      timestamp: new Date().toISOString(),
      resourceCount: this.resources.size,
    };
  }

  /**
   * 获取分析数据
   */
  private async getAnalyticsData(): Promise<any> {
    try {
      const tasks = await this.getTasksData();
      const projects = await this.getProjectsData();

      const analytics = {
        tasks: {
          total: tasks.length,
          byStatus: this.groupBy(tasks, 'status'),
          byType: this.groupBy(tasks, 'type'),
          byPriority: this.groupBy(tasks, 'priority'),
          totalHours: tasks.reduce((sum: number, task: any) => sum + (task.estimatedHours || 0), 0),
        },
        projects: {
          total: 1,
          aiModelsConfigured: projects.aiModels || 0,
          mcpEnabled: projects.mcpEnabled,
        },
        generatedAt: new Date().toISOString(),
      };

      return analytics;
    } catch (error) {
      this.logger.warn('获取分析数据失败:', error);
      return { error: 'Failed to generate analytics' };
    }
  }

  /**
   * 按字段分组
   */
  private groupBy(array: any[], field: string): Record<string, number> {
    return array.reduce((acc, item) => {
      const key = item[field] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * 获取MIME类型
   */
  private getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      '.json': 'application/json',
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.ts': 'application/typescript',
      '.xml': 'application/xml',
      '.yaml': 'application/yaml',
      '.yml': 'application/yaml',
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * 获取资源数量
   */
  getResourcesCount(): number {
    return this.resources.size;
  }

  /**
   * 获取资源名称列表
   */
  getResourceNames(): string[] {
    return Array.from(this.resources.values()).map(r => r.name);
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    this.resources.clear();
    this.logger.info('资源管理器已清理');
  }
}
