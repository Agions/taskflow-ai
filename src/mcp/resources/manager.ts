import { getLogger } from '../../utils/logger';
/**
 * MCP资源管理器
 * 管理项目中的各种资源，如任务、项目、配置等
 */

import path from 'path';
import fs from 'fs-extra';
import { Logger } from '../../utils/logger';
import { MCPResource } from './types';
import { defaultResources } from './defaults';
import { ResourceScanner } from './scanner';
import { DataProviders } from './data-providers';
const logger = getLogger('mcp/resources/manager');

export * from './types';

export class MCPResourceManager {
  private resources: Map<string, MCPResource> = new Map();
  private logger: Logger;
  private dataDir: string;
  private scanner: ResourceScanner;
  private dataProviders: DataProviders;

  constructor(
    private config: unknown,
    logger?: Logger
  ) {
    this.logger = logger || Logger.getInstance('MCPResourceManager');
    this.dataDir = path.join(process.cwd(), '.taskflow', 'data');
    this.scanner = new ResourceScanner(this.dataDir, this.logger);
    this.dataProviders = new DataProviders(this.logger);
  }

  async initialize(): Promise<void> {
    this.logger.info('正在初始化MCP资源管理器...');

    try {
      await fs.ensureDir(this.dataDir);
      await this.registerDefaultResources();
      await this.scanResources();

      this.logger.info(`资源管理器初始化完成，共注册 ${this.resources.size} 个资源`);
    } catch (error) {
      this.logger.error('资源管理器初始化失败:', error);
      throw error;
    }
  }

  private async registerDefaultResources(): Promise<void> {
    for (const resource of defaultResources) {
      this.registerResource(resource);
    }
  }

  private async scanResources(): Promise<void> {
    try {
      const resources = await this.scanner.scan();
      for (const resource of resources) {
        this.registerResource(resource);
      }
    } catch (error) {
      this.logger.warn('扫描资源失败:', error);
    }
  }

  registerResource(resource: MCPResource): void {
    this.resources.set(resource.uri, resource);
    this.logger.debug(`注册资源: ${resource.uri}`);
  }

  getResource(uri: string): MCPResource | undefined {
    return this.resources.get(uri);
  }

  getAllResources(): MCPResource[] {
    return Array.from(this.resources.values());
  }

  async getResourceData(uri: string): Promise<unknown> {
    switch (uri) {
      case '/tasks':
        return this.dataProviders.getTasksData();
      case '/projects':
        return this.dataProviders.getProjectsData();
      case '/config':
        return this.dataProviders.getConfigData();
      case '/models':
        return this.dataProviders.getModelsData();
      case '/status':
        return this.dataProviders.getStatusData(this.resources.size);
      case '/analytics':
        return this.dataProviders.getAnalyticsData(this.resources.size);
      default:
        if (uri.startsWith('/files/')) {
          return this.getFileData(uri);
        }
        throw new Error(`Unknown resource: ${uri}`);
    }
  }

  private async getFileData(uri: string): Promise<unknown> {
    const fileName = uri.replace('/files/', '');
    const filePath = path.join(this.dataDir, fileName);

    if (!(await fs.pathExists(filePath))) {
      throw new Error(`File not found: ${fileName}`);
    }

    const content = await fs.readFile(filePath, 'utf-8');

    try {
      return JSON.parse(content);
    } catch {
      return { content };
    }
  }

  getResourcesCount(): number {
    return this.resources.size;
  }

  getResourceNames(): string[] {
    return Array.from(this.resources.values()).map(r => r.name);
  }

  async cleanup(): Promise<void> {
    this.resources.clear();
    this.logger.info('资源管理器已清理');
  }
}

export default MCPResourceManager;
