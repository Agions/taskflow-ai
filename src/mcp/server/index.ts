/**
 * MCP服务器核心实现 - 支持MCP协议标准 (stdio 传输方式)
 * 兼容 Trae, Cursor, Claude Desktop 等编辑器
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Logger } from '../../utils/logger';
import { MCPRequestHandlers } from './handlers';
import { MCPToolExecutor } from './executor';

export * from './handlers';
export * from './executor';

export class MCPServer {
  private server?: Server;
  private transport?: StdioServerTransport;
  private isRunning = false;
  private logger: Logger;
  private toolExecutor: MCPToolExecutor;

  constructor(
    private settings: any,
    private config: any
  ) {
    this.logger = Logger.getInstance('MCPServer');
    this.toolExecutor = new MCPToolExecutor();
  }

  async start(): Promise<void> {
    try {
      this.logger.info('正在启动MCP服务器...');

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

      const handlers = new MCPRequestHandlers(
        this.server,
        this.logger,
        (name, args) => this.toolExecutor.execute(name, args),
        () => this.config
      );
      handlers.setup();

      this.transport = new StdioServerTransport();
      await this.server.connect(this.transport);

      this.isRunning = true;
      this.logger.info('MCP服务器已启动 (stdio模式)');

      this.setupShutdownHandlers();
    } catch (error) {
      this.logger.error('MCP服务器启动失败:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      this.logger.info('正在停止MCP服务器...');
      this.isRunning = false;

      if (this.server) {
        await this.server.close();
      }

      this.logger.info('MCP服务器已停止');
    } catch (error) {
      this.logger.error('停止MCP服务器时出错:', error);
      throw error;
    }
  }

  private setupShutdownHandlers(): void {
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
  }

  isServerRunning(): boolean {
    return this.isRunning;
  }

  async callTool(
    name: string,
    args: any
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const result = await this.toolExecutor.execute(name, args);
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
