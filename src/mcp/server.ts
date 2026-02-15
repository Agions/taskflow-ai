/**
 * MCP服务器核心实现 - 支持MCP协议标准 (stdio 传输方式)
 * 兼容 Trae, Cursor, Claude Desktop 等编辑器
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import path from 'path';
import fs from 'fs-extra';
import { execSync } from 'child_process';
import { MCPToolRegistry } from './tools/registry';
import { Logger } from '../utils/logger';

export class MCPServer {
  private server?: Server;
  private transport?: StdioServerTransport;
  private isRunning = false;
  private toolRegistry?: MCPToolRegistry;
  private logger: Logger;

  constructor(
    private settings: any,
    private config: any
  ) {
    this.logger = Logger.getInstance('MCPServer');
  }

  /**
   * 启动MCP服务器
   */
  async start(): Promise<void> {
    try {
      this.logger.info('正在启动MCP服务器...');

      // 初始化工具注册表
      this.toolRegistry = new MCPToolRegistry(this.config, this.logger);
      await this.toolRegistry.initialize();

      // 创建MCP服务器实例
      this.server = new Server(
        {
          name: this.settings.serverName || 'taskflow-ai',
          version: this.settings.version || '1.0.0',
        },
        {
          capabilities: {
            tools: {},
            resources: {},
            prompts: {},
          },
        }
      );

      // 设置请求处理器
      this.setupRequestHandlers();

      // 创建stdio传输层
      this.transport = new StdioServerTransport();

      // 连接服务器到传输层
      await this.server.connect(this.transport);

      this.isRunning = true;
      this.logger.info('MCP服务器已启动 (stdio模式)');

      // 保持进程运行
      process.stdin.on('end', () => {
        this.logger.info('stdin ended, shutting down...');
        this.stop();
      });

      process.on('SIGINT', () => {
        this.logger.info('SIGINT received, shutting down...');
        this.stop();
      });

      process.on('SIGTERM', () => {
        this.logger.info('SIGTERM received, shutting down...');
        this.stop();
      });
    } catch (error) {
      this.logger.error('MCP服务器启动失败:', error);
      throw error;
    }
  }

  /**
   * 停止MCP服务器
   */
  async stop(): Promise<void> {
    try {
      this.logger.info('正在停止MCP服务器...');
      this.isRunning = false;

      if (this.toolRegistry) {
        await this.toolRegistry.cleanup();
      }

      if (this.server) {
        await this.server.close();
      }

      this.logger.info('MCP服务器已停止');
    } catch (error) {
      this.logger.error('停止MCP服务器时出错:', error);
      throw error;
    }
  }

  /**
   * 设置请求处理器
   */
  private setupRequestHandlers(): void {
    if (!this.server) return;

    // 工具列表处理器
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = this.toolRegistry?.getAllTools() || [];
      return {
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    // 工具调用处理器
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const { name, arguments: args } = request.params;

      try {
        const result = await this.executeTool(name, args);
        return {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });

    // 资源列表处理器
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'taskflow://config',
            name: 'TaskFlow Configuration',
            mimeType: 'application/json',
            description: 'Current TaskFlow AI configuration',
          },
          {
            uri: 'taskflow://tools',
            name: 'Available Tools',
            mimeType: 'application/json',
            description: 'List of all available MCP tools',
          },
        ],
      };
    });

    // 资源读取处理器
    this.server.setRequestHandler(ReadResourceRequestSchema, async request => {
      const { uri } = request.params;

      if (uri === 'taskflow://config') {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(this.sanitizeConfig(this.config), null, 2),
            },
          ],
        };
      }

      if (uri === 'taskflow://tools') {
        const tools = this.toolRegistry?.getAllTools() || [];
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(tools, null, 2),
            },
          ],
        };
      }

      throw new Error(`Unknown resource: ${uri}`);
    });

    // Prompt列表处理器
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: [
          {
            name: 'analyze-project',
            description: 'Analyze a project structure and provide insights',
          },
          {
            name: 'create-task',
            description: 'Create a new task with proper structure',
          },
        ],
      };
    });

    // Prompt获取处理器
    this.server.setRequestHandler(GetPromptRequestSchema, async request => {
      const { name, arguments: args } = request.params;

      if (name === 'analyze-project') {
        return {
          description: 'Analyze project structure',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Please analyze the project at ${args?.path || process.cwd()} and provide insights about its structure, technologies used, and potential improvements.`,
              },
            },
          ],
        };
      }

      if (name === 'create-task') {
        return {
          description: 'Create a new task',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Create a new task with title: "${args?.title || 'New Task'}"${args?.description ? ` and description: "${args.description}"` : ''}`,
              },
            },
          ],
        };
      }

      throw new Error(`Unknown prompt: ${name}`);
    });
  }

  /**
   * 执行工具
   */
  private async executeTool(name: string, args: any): Promise<any> {
    // 首先尝试从注册表执行
    if (this.toolRegistry) {
      try {
        return await this.toolRegistry.callTool(name, args);
      } catch (error: any) {
        // 如果注册表中没有，尝试内置执行
        if (!error.message?.includes('工具不存在')) {
          throw error;
        }
      }
    }

    // 内置工具执行
    switch (name) {
      case 'file_read':
        return await this.executeFileRead(args);
      case 'file_write':
        return await this.executeFileWrite(args);
      case 'shell_exec':
        return await this.executeShellExec(args);
      case 'project_analyze':
        return await this.executeProjectAnalyze(args);
      case 'task_create':
        return await this.executeTaskCreate(args);
      default:
        throw new Error(`Tool not found: ${name}`);
    }
  }

  /**
   * 执行文件读取
   */
  private async executeFileRead(args: any): Promise<string> {
    const { path: filePath } = args;

    if (!filePath) {
      throw new Error('Path is required');
    }

    // 安全检查：确保路径在允许范围内
    const resolvedPath = path.resolve(filePath);
    const cwd = process.cwd();

    // 只允许访问当前工作目录及其子目录
    if (!resolvedPath.startsWith(cwd)) {
      throw new Error('Access denied: path outside of working directory');
    }

    try {
      const content = await fs.readFile(resolvedPath, 'utf-8');
      return content;
    } catch (error: any) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }

  /**
   * 执行文件写入
   */
  private async executeFileWrite(args: any): Promise<any> {
    const { path: filePath, content } = args;

    if (!filePath || content === undefined) {
      throw new Error('Path and content are required');
    }

    // 安全检查
    const resolvedPath = path.resolve(filePath);
    const cwd = process.cwd();

    if (!resolvedPath.startsWith(cwd)) {
      throw new Error('Access denied: path outside of working directory');
    }

    try {
      await fs.ensureDir(path.dirname(resolvedPath));
      await fs.writeFile(resolvedPath, content, 'utf-8');
      return { success: true, path: resolvedPath };
    } catch (error: any) {
      throw new Error(`Failed to write file: ${error.message}`);
    }
  }

  /**
   * 执行Shell命令
   */
  private async executeShellExec(args: any): Promise<any> {
    const { command, cwd, timeout = 30 } = args;

    if (!command) {
      throw new Error('Command is required');
    }

    // 命令白名单检查
    const allowedCommands = [
      'ls', 'cat', 'grep', 'find', 'head', 'tail', 'wc',
      'git', 'npm', 'node', 'npx', 'tsc', 'eslint', 'prettier',
      'mkdir', 'touch', 'rm', 'cp', 'mv', 'echo',
      'pwd', 'whoami', 'date', 'which',
    ];

    const cmdBase = command.trim().split(' ')[0];
    if (!allowedCommands.includes(cmdBase)) {
      throw new Error(`Command not allowed: ${cmdBase}. Allowed commands: ${allowedCommands.join(', ')}`);
    }

    try {
      const result = execSync(command, {
        cwd: cwd || process.cwd(),
        timeout: timeout * 1000,
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024, // 1MB buffer
      });
      return { output: result, command };
    } catch (error: any) {
      throw new Error(`Command failed: ${error.message}`);
    }
  }

  /**
   * 执行项目分析
   */
  private async executeProjectAnalyze(args: any): Promise<any> {
    const { path: projectPath = process.cwd(), depth = 3 } = args;

    const analysis: {
      path: string;
      files: number;
      directories: number;
      languages: Record<string, number>;
      structure: any[];
    } = {
      path: projectPath,
      files: 0,
      directories: 0,
      languages: {},
      structure: [],
    };

    const scanDirectory = async (dirPath: string, currentDepth: number): Promise<any[]> => {
      if (currentDepth > depth) return [];

      const items: any[] = [];

      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          // 跳过隐藏文件和 node_modules
          if (entry.name.startsWith('.') || entry.name === 'node_modules') {
            continue;
          }

          const fullPath = path.join(dirPath, entry.name);

          if (entry.isDirectory()) {
            analysis.directories++;
            const children = await scanDirectory(fullPath, currentDepth + 1);
            items.push({
              name: entry.name,
              type: 'directory',
              children,
            });
          } else {
            analysis.files++;
            const ext = path.extname(entry.name);
            if (ext) {
              analysis.languages[ext] = (analysis.languages[ext] || 0) + 1;
            }
            items.push({
              name: entry.name,
              type: 'file',
              extension: ext || null,
            });
          }
        }
      } catch (error) {
        // 忽略无法访问的目录
      }

      return items;
    };

    analysis.structure = await scanDirectory(projectPath, 0);
    return analysis;
  }

  /**
   * 执行任务创建
   */
  private async executeTaskCreate(args: any): Promise<any> {
    const { title, description = '', type = 'general', priority = 'medium' } = args;

    if (!title) {
      throw new Error('Title is required');
    }

    const task = {
      id: `task-${Date.now()}`,
      title,
      description,
      type,
      priority,
      status: 'todo',
      createdAt: new Date().toISOString(),
    };

    // 保存到任务文件
    const tasksDir = path.join(process.cwd(), '.taskflow', 'tasks');
    await fs.ensureDir(tasksDir);
    await fs.writeJson(path.join(tasksDir, `${task.id}.json`), task, { spaces: 2 });

    return task;
  }

  /**
   * 清理配置中的敏感信息
   */
  private sanitizeConfig(config: any): any {
    if (!config) return {};

    const sanitized = { ...config };

    if (sanitized.aiModels) {
      sanitized.aiModels = sanitized.aiModels.map((model: any) => ({
        ...model,
        apiKey: model.apiKey ? '***' : undefined,
      }));
    }

    return sanitized;
  }

  /**
   * 检查服务器状态
   */
  isServerRunning(): boolean {
    return this.isRunning;
  }
}
