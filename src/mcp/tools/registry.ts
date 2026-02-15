/**
 * MCP工具注册管理器
 * 支持工具的注册、发现、分类和管理
 */

import path from 'path';
import fs from 'fs-extra';
import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger';

export interface MCPTool {
  name: string;
  description: string;
  category: string;
  version: string;
  author?: string;
  enabled: boolean;
  handler: string;
  inputSchema: any;
  outputSchema?: any;
  metadata?: {
    tags: string[];
    permissions: string[];
    dependencies: string[];
  };
}

export interface ToolRegistryOptions {
  toolsDir: string;
  autoReload: boolean;
  enableFileWatcher: boolean;
}

export class MCPToolRegistry extends EventEmitter {
  private tools: Map<string, MCPTool> = new Map();
  private categories: Map<string, string[]> = new Map();
  private logger: Logger;
  private options: ToolRegistryOptions;
  private fileWatcher?: any;

  constructor(
    private config: any,
    logger?: Logger
  ) {
    super();
    this.logger = logger || Logger.getInstance('MCPToolRegistry');
    this.options = {
      toolsDir: path.join(process.cwd(), '.taskflow', 'tools'),
      autoReload: true,
      enableFileWatcher: true,
    };
  }

  /**
   * 初始化工具注册表
   */
  async initialize(): Promise<void> {
    this.logger.info('正在初始化MCP工具注册表...');

    try {
      // 确保工具目录存在
      await fs.ensureDir(this.options.toolsDir);

      // 注册内置工具
      await this.registerBuiltinTools();

      // 扫描和加载工具
      await this.scanAndLoadTools();

      // 启动文件监听
      if (this.options.enableFileWatcher) {
        this.startFileWatcher();
      }

      this.logger.info(`工具注册表初始化完成，共加载 ${this.tools.size} 个工具`);
    } catch (error) {
      this.logger.error('工具注册表初始化失败:', error);
      throw error;
    }
  }

  /**
   * 注册内置工具
   */
  private async registerBuiltinTools(): Promise<void> {
    const builtinTools: MCPTool[] = [
      {
        name: 'file_read',
        description: '读取文件内容',
        category: 'filesystem',
        version: '1.0.0',
        enabled: true,
        handler: 'builtin:file_read',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: '文件路径' },
          },
          required: ['path'],
        },
        metadata: {
          tags: ['file', 'read', 'io'],
          permissions: ['read'],
          dependencies: [],
        },
      },
      {
        name: 'file_write',
        description: '写入文件内容',
        category: 'filesystem',
        version: '1.0.0',
        enabled: true,
        handler: 'builtin:file_write',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: '文件路径' },
            content: { type: 'string', description: '文件内容' },
          },
          required: ['path', 'content'],
        },
        metadata: {
          tags: ['file', 'write', 'io'],
          permissions: ['write'],
          dependencies: [],
        },
      },
      {
        name: 'shell_exec',
        description: '执行Shell命令',
        category: 'system',
        version: '1.0.0',
        enabled: true,
        handler: 'builtin:shell_exec',
        inputSchema: {
          type: 'object',
          properties: {
            command: { type: 'string', description: '要执行的命令' },
            cwd: { type: 'string', description: '工作目录' },
            timeout: { type: 'number', description: '超时时间(秒)' },
          },
          required: ['command'],
        },
        metadata: {
          tags: ['shell', 'command', 'system'],
          permissions: ['execute'],
          dependencies: [],
        },
      },
      {
        name: 'project_analyze',
        description: '分析项目结构',
        category: 'analysis',
        version: '1.0.0',
        enabled: true,
        handler: 'builtin:project_analyze',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: '项目路径' },
            depth: { type: 'number', description: '扫描深度' },
          },
          required: ['path'],
        },
        metadata: {
          tags: ['project', 'analysis', 'structure'],
          permissions: ['read'],
          dependencies: [],
        },
      },
      {
        name: 'task_create',
        description: '创建新任务',
        category: 'tasks',
        version: '1.0.0',
        enabled: true,
        handler: 'builtin:task_create',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: '任务标题' },
            description: { type: 'string', description: '任务描述' },
            type: { type: 'string', description: '任务类型' },
            priority: { type: 'string', description: '优先级' },
          },
          required: ['title'],
        },
        metadata: {
          tags: ['task', 'create', 'management'],
          permissions: ['write'],
          dependencies: [],
        },
      },
    ];

    for (const tool of builtinTools) {
      await this.registerTool(tool);
    }
  }

  /**
   * 扫描并加载工具
   */
  private async scanAndLoadTools(): Promise<void> {
    try {
      const toolFiles = await this.findToolFiles();

      for (const toolFile of toolFiles) {
        try {
          await this.loadToolFromFile(toolFile);
        } catch (error) {
          this.logger.warn(`加载工具失败: ${toolFile}`, error);
        }
      }
    } catch (error) {
      this.logger.error('扫描工具目录失败:', error);
    }
  }

  /**
   * 查找工具文件
   */
  private async findToolFiles(): Promise<string[]> {
    const toolFiles: string[] = [];

    try {
      const files = await fs.readdir(this.options.toolsDir);

      for (const file of files) {
        if (file.endsWith('.json') || file.endsWith('.js') || file.endsWith('.ts')) {
          toolFiles.push(path.join(this.options.toolsDir, file));
        }
      }
    } catch (error) {
      // 目录不存在或无法读取
    }

    return toolFiles;
  }

  /**
   * 从文件加载工具
   */
  private async loadToolFromFile(filePath: string): Promise<void> {
    const ext = path.extname(filePath);

    if (ext === '.json') {
      const toolData = await fs.readJson(filePath);
      await this.registerTool(toolData);
    } else if (ext === '.js' || ext === '.ts') {
      // 动态加载JavaScript/TypeScript工具
      try {
        const toolModule = require(filePath);
        const toolData = toolModule.default || toolModule;
        await this.registerTool(toolData);
      } catch (error) {
        this.logger.warn(`无法加载工具模块: ${filePath}`, error);
      }
    }
  }

  /**
   * 注册工具
   */
  async registerTool(tool: MCPTool): Promise<void> {
    // 验证工具数据
    if (!this.validateTool(tool)) {
      throw new Error(`工具验证失败: ${tool.name}`);
    }

    // 注册工具
    this.tools.set(tool.name, tool);

    // 更新分类
    this.updateCategory(tool.category, tool.name);

    // 发出事件
    this.emit('toolRegistered', tool);

    this.logger.debug(`工具已注册: ${tool.name} (${tool.category})`);
  }

  /**
   * 取消注册工具
   */
  async unregisterTool(name: string): Promise<boolean> {
    const tool = this.tools.get(name);
    if (!tool) {
      return false;
    }

    this.tools.delete(name);
    this.removeFromCategory(tool.category, name);
    this.emit('toolUnregistered', tool);

    this.logger.debug(`工具已取消注册: ${name}`);
    return true;
  }

  /**
   * 获取工具
   */
  getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  /**
   * 获取所有工具
   */
  getAllTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * 获取启用的工具
   */
  getEnabledTools(): MCPTool[] {
    return this.getAllTools().filter(tool => tool.enabled);
  }

  /**
   * 按分类获取工具
   */
  getToolsByCategory(category: string): MCPTool[] {
    return this.getAllTools().filter(tool => tool.category === category);
  }

  /**
   * 搜索工具
   */
  searchTools(query: string): MCPTool[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllTools().filter(
      tool =>
        tool.name.toLowerCase().includes(lowerQuery) ||
        tool.description.toLowerCase().includes(lowerQuery) ||
        tool.metadata?.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * 获取工具分类
   */
  getCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  /**
   * 调用工具
   */
  async callTool(name: string, args: any): Promise<any> {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`工具不存在: ${name}`);
    }

    if (!tool.enabled) {
      throw new Error(`工具已禁用: ${name}`);
    }

    // 验证输入参数
    if (!this.validateInput(args, tool.inputSchema)) {
      throw new Error(`工具参数验证失败: ${name}`);
    }

    // 调用工具处理器
    return await this.executeToolHandler(tool, args);
  }

  /**
   * 执行工具处理器
   */
  private async executeToolHandler(tool: MCPTool, args: any): Promise<any> {
    const handler = tool.handler;

    if (handler.startsWith('builtin:')) {
      return await this.executeBuiltinHandler(handler.substring(8), args);
    } else {
      // 外部处理器
      try {
        const handlerModule = require(handler);
        const handlerFunc = handlerModule.default || handlerModule;
        return await handlerFunc(args);
      } catch (error: any) {
        throw new Error(`工具处理器执行失败: ${error.message}`);
      }
    }
  }

  /**
   * 执行内置处理器
   */
  private async executeBuiltinHandler(handlerName: string, args: any): Promise<any> {
    switch (handlerName) {
      case 'file_read':
        return await fs.readFile(args.path, 'utf-8');

      case 'file_write':
        await fs.writeFile(args.path, args.content, 'utf-8');
        return { success: true, path: args.path };

      case 'shell_exec':
        const { execSync } = require('child_process');
        const result = execSync(args.command, {
          cwd: args.cwd || process.cwd(),
          timeout: (args.timeout || 30) * 1000,
          encoding: 'utf-8',
        });
        return { output: result, command: args.command };

      case 'project_analyze':
        return await this.analyzeProject(args.path, args.depth || 3);

      case 'task_create':
        return await this.createTask(args);

      default:
        throw new Error(`未知的内置处理器: ${handlerName}`);
    }
  }

  /**
   * 分析项目结构
   */
  private async analyzeProject(projectPath: string, maxDepth: number): Promise<any> {
    const analysis: {
      path: string;
      files: number;
      directories: number;
      languages: Record<string, number>;
      structure: Record<string, any>;
    } = {
      path: projectPath,
      files: 0,
      directories: 0,
      languages: {},
      structure: {},
    };

    const scanDirectory = async (dirPath: string, depth: number) => {
      if (depth > maxDepth) return;

      try {
        const items = await fs.readdir(dirPath);

        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stats = await fs.stat(itemPath);

          if (stats.isDirectory()) {
            analysis.directories++;
            await scanDirectory(itemPath, depth + 1);
          } else {
            analysis.files++;
            const ext = path.extname(item);
            if (ext) {
              analysis.languages[ext] = (analysis.languages[ext] || 0) + 1;
            }
          }
        }
      } catch (error) {
        // 忽略无法访问的目录
      }
    };

    await scanDirectory(projectPath, 0);
    return analysis;
  }

  /**
   * 创建任务
   */
  private async createTask(taskData: any): Promise<any> {
    const task = {
      id: `task-${Date.now()}`,
      title: taskData.title,
      description: taskData.description || '',
      type: taskData.type || 'general',
      priority: taskData.priority || 'medium',
      status: 'todo',
      createdAt: new Date().toISOString(),
    };

    // 这里可以添加保存任务到数据库的逻辑
    this.logger.info(`任务已创建: ${task.title}`);

    return task;
  }

  /**
   * 验证工具数据
   */
  private validateTool(tool: any): boolean {
    return !!(
      tool.name &&
      tool.description &&
      tool.category &&
      tool.handler &&
      typeof tool.enabled === 'boolean'
    );
  }

  /**
   * 验证输入参数
   */
  private validateInput(input: any, schema: any): boolean {
    // 简单的schema验证实现
    if (!schema || schema.type !== 'object') {
      return true;
    }

    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in input)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 更新分类
   */
  private updateCategory(category: string, toolName: string): void {
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }

    const tools = this.categories.get(category)!;
    if (!tools.includes(toolName)) {
      tools.push(toolName);
    }
  }

  /**
   * 从分类中移除
   */
  private removeFromCategory(category: string, toolName: string): void {
    const tools = this.categories.get(category);
    if (tools) {
      const index = tools.indexOf(toolName);
      if (index !== -1) {
        tools.splice(index, 1);
      }

      if (tools.length === 0) {
        this.categories.delete(category);
      }
    }
  }

  /**
   * 启动文件监听
   */
  private startFileWatcher(): void {
    if (this.fileWatcher) {
      return;
    }

    try {
      const chokidar = require('chokidar');
      this.fileWatcher = chokidar.watch(this.options.toolsDir, {
        ignored: /(^|[\/\\])\../,
        persistent: true,
      });

      this.fileWatcher
        .on('add', (filePath: string) => this.handleFileChange('add', filePath))
        .on('change', (filePath: string) => this.handleFileChange('change', filePath))
        .on('unlink', (filePath: string) => this.handleFileChange('unlink', filePath));

      this.logger.debug('文件监听已启动');
    } catch (error) {
      this.logger.warn('无法启动文件监听:', error);
    }
  }

  /**
   * 处理文件变化
   */
  private async handleFileChange(event: string, filePath: string): Promise<void> {
    if (!this.options.autoReload) {
      return;
    }

    try {
      if (event === 'unlink') {
        // 文件被删除，查找并移除对应的工具
        const toolName = path.basename(filePath, path.extname(filePath));
        await this.unregisterTool(toolName);
      } else {
        // 文件添加或修改，重新加载工具
        await this.loadToolFromFile(filePath);
      }
    } catch (error) {
      this.logger.warn(`处理文件变化失败: ${filePath}`, error);
    }
  }

  /**
   * 停止文件监听
   */
  private stopFileWatcher(): void {
    if (this.fileWatcher) {
      this.fileWatcher.close();
      this.fileWatcher = null;
      this.logger.debug('文件监听已停止');
    }
  }

  /**
   * 获取工具数量
   */
  getToolsCount(): number {
    return this.tools.size;
  }

  /**
   * 获取工具名称列表
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    this.stopFileWatcher();
    this.tools.clear();
    this.categories.clear();
    this.removeAllListeners();
    this.logger.info('工具注册表已清理');
  }
}
