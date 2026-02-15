/**
 * MCP服务器核心实现 - 支持MCP协议标准
 */

import express, { Application, Request, Response } from 'express';
import { createServer, Server as HttpServer } from 'http';
import cors from 'cors';

// MCP协议类型定义
interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export class MCPServer {
  private app?: Application;
  private httpServer?: HttpServer;
  private isRunning = false;
  private tools: Map<string, any> = new Map();
  private resources: Map<string, any> = new Map();

  constructor(
    private settings: any,
    private config: any
  ) {}

  /**
   * 注册工具
   */
  registerTool(name: string, tool: any): void {
    this.tools.set(name, tool);
  }

  /**
   * 注册资源
   */
  registerResource(name: string, resource: any): void {
    this.resources.set(name, resource);
  }

  /**
   * 启动MCP服务器
   */
  async start(): Promise<void> {
    try {
      console.log('正在启动MCP服务器...');

      // 设置Express应用
      this.app = express();
      this.httpServer = createServer(this.app);

      // 启用CORS - 允许所有来源访问（开发环境）
      this.app.use(cors({
        origin: '*',
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
      }));

      // 基本中间件
      this.app.use(express.json());

      // 注册内置工具
      this.registerBuiltinTools();

      // 设置MCP协议路由
      this.setupMCPRoutes();

      // 设置基本路由
      this.setupRoutes();

      // 启动HTTP服务器
      await new Promise<void>((resolve, reject) => {
        this.httpServer!.listen(this.settings.port, this.settings.host, () => {
          console.log(`MCP服务器已启动 - http://${this.settings.host}:${this.settings.port}`);
          resolve();
        }).on('error', reject);
      });

      this.isRunning = true;
    } catch (error) {
      console.error('MCP服务器启动失败:', error);
      throw error;
    }
  }

  /**
   * 停止MCP服务器
   */
  async stop(): Promise<void> {
    try {
      console.log('正在停止MCP服务器...');
      this.isRunning = false;

      if (this.httpServer) {
        await new Promise<void>(resolve => {
          this.httpServer!.close(() => resolve());
        });
      }

      console.log('MCP服务器已停止');
    } catch (error) {
      console.error('停止MCP服务器时出错:', error);
      throw error;
    }
  }

  /**
   * 注册内置工具
   */
  private registerBuiltinTools(): void {
    // 文件读取工具
    this.registerTool('file_read', {
      description: '读取文件内容',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '文件路径' }
        },
        required: ['path']
      }
    });

    // 文件写入工具
    this.registerTool('file_write', {
      description: '写入文件内容',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '文件路径' },
          content: { type: 'string', description: '文件内容' }
        },
        required: ['path', 'content']
      }
    });

    // 项目分析工具
    this.registerTool('project_analyze', {
      description: '分析项目结构',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '项目路径' }
        },
        required: ['path']
      }
    });

    // 任务创建工具
    this.registerTool('task_create', {
      description: '创建新任务',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '任务标题' },
          description: { type: 'string', description: '任务描述' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'], description: '优先级' }
        },
        required: ['title', 'description']
      }
    });
  }

  /**
   * 设置MCP协议路由
   */
  private setupMCPRoutes(): void {
    if (!this.app) return;

    // MCP协议主端点 - 支持POST请求
    this.app.post('/mcp', (req: Request, res: Response) => {
      this.handleMCPRequest(req, res);
    });

    // MCP协议 - 支持GET请求（用于SSE）
    this.app.get('/mcp', (req: Request, res: Response) => {
      res.json({
        jsonrpc: '2.0',
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
            resources: {},
            prompts: {}
          },
          serverInfo: {
            name: this.settings.serverName || 'taskflow-ai',
            version: this.settings.version || '1.0.0'
          }
        }
      });
    });

    // 工具列表端点
    this.app.get('/mcp/tools', (req: Request, res: Response) => {
      const toolsList = Array.from(this.tools.entries()).map(([name, tool]) => ({
        name,
        description: tool.description,
        parameters: tool.parameters
      }));

      res.json({
        jsonrpc: '2.0',
        result: { tools: toolsList }
      });
    });

    // 资源列表端点
    this.app.get('/mcp/resources', (req: Request, res: Response) => {
      const resourcesList = Array.from(this.resources.entries()).map(([name, resource]) => ({
        name,
        ...resource
      }));

      res.json({
        jsonrpc: '2.0',
        result: { resources: resourcesList }
      });
    });
  }

  /**
   * 处理MCP请求
   */
  private handleMCPRequest(req: Request, res: Response): void {
    const request: MCPRequest = req.body;

    // 验证JSON-RPC格式
    if (request.jsonrpc !== '2.0') {
      res.status(400).json({
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32600,
          message: 'Invalid Request: jsonrpc must be "2.0"'
        }
      });
      return;
    }

    // 处理不同的MCP方法
    switch (request.method) {
      case 'initialize':
        this.handleInitialize(request, res);
        break;

      case 'tools/list':
        this.handleToolsList(request, res);
        break;

      case 'tools/call':
        this.handleToolCall(request, res);
        break;

      case 'resources/list':
        this.handleResourcesList(request, res);
        break;

      case 'resources/read':
        this.handleResourceRead(request, res);
        break;

      default:
        res.status(400).json({
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32601,
            message: `Method not found: ${request.method}`
          }
        });
    }
  }

  /**
   * 处理初始化请求
   */
  private handleInitialize(request: MCPRequest, res: Response): void {
    const response: MCPResponse = {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {},
          prompts: {}
        },
        serverInfo: {
          name: this.settings.serverName || 'taskflow-ai',
          version: this.settings.version || '1.0.0'
        }
      }
    };

    res.json(response);
  }

  /**
   * 处理工具列表请求
   */
  private handleToolsList(request: MCPRequest, res: Response): void {
    const toolsList = Array.from(this.tools.entries()).map(([name, tool]) => ({
      name,
      description: tool.description,
      inputSchema: tool.parameters
    }));

    res.json({
      jsonrpc: '2.0',
      id: request.id,
      result: { tools: toolsList }
    });
  }

  /**
   * 处理工具调用请求
   */
  private handleToolCall(request: MCPRequest, res: Response): void {
    const { name, arguments: args } = request.params || {};

    if (!name) {
      res.status(400).json({
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32602,
          message: 'Invalid params: tool name is required'
        }
      });
      return;
    }

    const tool = this.tools.get(name);
    if (!tool) {
      res.status(400).json({
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32602,
          message: `Tool not found: ${name}`
        }
      });
      return;
    }

    // 模拟工具执行
    res.json({
      jsonrpc: '2.0',
      id: request.id,
      result: {
        content: [
          {
            type: 'text',
            text: `Tool "${name}" executed successfully with args: ${JSON.stringify(args)}`
          }
        ],
        isError: false
      }
    });
  }

  /**
   * 处理资源列表请求
   */
  private handleResourcesList(request: MCPRequest, res: Response): void {
    const resourcesList = Array.from(this.resources.entries()).map(([name, resource]) => ({
      uri: `taskflow://${name}`,
      name,
      ...resource
    }));

    res.json({
      jsonrpc: '2.0',
      id: request.id,
      result: { resources: resourcesList }
    });
  }

  /**
   * 处理资源读取请求
   */
  private handleResourceRead(request: MCPRequest, res: Response): void {
    const { uri } = request.params || {};

    res.json({
      jsonrpc: '2.0',
      id: request.id,
      result: {
        contents: [
          {
            uri: uri || 'unknown',
            mimeType: 'application/json',
            text: JSON.stringify({ message: 'Resource content placeholder' })
          }
        ]
      }
    });
  }

  /**
   * 设置基本路由
   */
  private setupRoutes(): void {
    if (!this.app) return;

    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        server: this.settings.serverName || 'taskflow-ai',
        version: this.settings.version || '1.0.0',
        timestamp: new Date().toISOString(),
      });
    });

    // 服务器信息
    this.app.get('/info', (req, res) => {
      res.json({
        name: this.settings.serverName || 'taskflow-ai',
        version: this.settings.version || '1.0.0',
        capabilities: ['tools', 'resources', 'prompts'],
        endpoints: {
          mcp: '/mcp',
          tools: '/mcp/tools',
          resources: '/mcp/resources',
          health: '/health',
          info: '/info'
        }
      });
    });

    // 基本API端点
    this.app.get('/api/status', (req, res) => {
      res.json({
        running: this.isRunning,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        tools: this.tools.size,
        resources: this.resources.size
      });
    });

    // 根路径
    this.app.get('/', (req, res) => {
      res.json({
        name: 'TaskFlow AI MCP Server',
        version: this.settings.version || '1.0.0',
        status: 'running',
        documentation: 'https://github.com/Agions/taskflow-ai'
      });
    });
  }

  /**
   * 检查服务器状态
   */
  isServerRunning(): boolean {
    return this.isRunning;
  }
}
