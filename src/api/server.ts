/**
 * TaskFlow AI API服务器
 * 提供RESTful API接口，支持PRD解析、任务生成、项目管理等功能
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer, Server } from 'http';
import { Logger } from '../infra/logger';
import { ConfigManager } from '../infra/config';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { authMiddleware } from './middleware/auth';
import { validationMiddleware } from './middleware/validation';

// 路由导入
import { projectRoutes } from './routes/projects';
import { taskRoutes } from './routes/tasks';
import { requirementRoutes } from './routes/requirements';
import { aiRoutes } from './routes/ai';
import { userRoutes } from './routes/users';
import { authRoutes } from './routes/auth';
import { healthRoutes } from './routes/health';
import { docsRoutes } from './routes/docs';

/**
 * API服务器类
 */
export class ApiServer {
  private app: Application;
  private server: Server;
  private logger: Logger;
  private configManager: ConfigManager;

  constructor(logger: Logger, configManager: ConfigManager) {
    this.logger = logger;
    this.configManager = configManager;
    this.app = express();
    this.server = createServer(this.app);

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * 启动服务器
   */
  public async start(): Promise<void> {
    const port = this.configManager.get('server.port', 3000);
    const host = this.configManager.get('server.host', '0.0.0.0');

    return new Promise((resolve, reject) => {
      this.server.listen(port, host, () => {
        this.logger.info(`TaskFlow AI API服务器已启动: http://${host}:${port}`);
        resolve();
      });

      this.server.on('error', (error: Error) => {
        this.logger.error(`服务器启动失败: ${error.message}`);
        reject(error);
      });
    });
  }

  /**
   * 停止服务器
   */
  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        this.logger.info('TaskFlow AI API服务器已停止');
        resolve();
      });
    });
  }

  /**
   * 获取Express应用实例
   */
  public getApp(): Application {
    return this.app;
  }

  /**
   * 设置中间件
   */
  private setupMiddleware(): void {
    // 安全中间件
    if (this.configManager.get('security.helmet.enabled', true)) {
      this.app.use(helmet(this.configManager.get('security.helmet.options', {})));
    }

    // CORS中间件
    if (this.configManager.get('server.cors.enabled', true)) {
      const corsOptions = {
        origin: this.configManager.get('server.cors.origins', ['*']),
        methods: this.configManager.get('server.cors.methods', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
        credentials: this.configManager.get('server.cors.credentials', true),
        optionsSuccessStatus: 200
      };
      this.app.use(cors(corsOptions));
    }

    // 压缩中间件
    if (this.configManager.get('server.compression.enabled', true)) {
      this.app.use(compression({
        level: this.configManager.get('server.compression.level', 6),
        threshold: 1024
      }));
    }

    // 限流中间件
    if (this.configManager.get('security.rateLimit.enabled', true)) {
      const limiter = rateLimit({
        windowMs: this.configManager.get('security.rateLimit.windowMs', 15 * 60 * 1000),
        max: this.configManager.get('security.rateLimit.max', 100),
        message: this.configManager.get('security.rateLimit.message', 'Too many requests'),
        standardHeaders: true,
        legacyHeaders: false
      });
      this.app.use('/api/', limiter);
    }

    // 请求解析中间件
    this.app.use(express.json({
      limit: this.configManager.get('server.bodyLimit', '10mb')
    }));
    this.app.use(express.urlencoded({
      extended: true,
      limit: this.configManager.get('server.bodyLimit', '10mb')
    }));

    // 请求日志中间件
    this.app.use(requestLogger(this.logger));

    // 健康检查（无需认证）
    this.app.use('/health', healthRoutes);

    // API文档（无需认证）
    this.app.use('/docs', docsRoutes);

    // 认证中间件（应用到所有API路由）
    this.app.use('/api', authMiddleware(this.configManager));

    // 验证中间件
    this.app.use('/api', validationMiddleware());
  }

  /**
   * 设置路由
   */
  private setupRoutes(): void {
    // API版本前缀
    const apiPrefix = '/api/v1';

    // 认证路由（无需token验证）
    this.app.use('/api/auth', authRoutes);

    // 业务路由
    this.app.use(`${apiPrefix}/projects`, projectRoutes);
    this.app.use(`${apiPrefix}/tasks`, taskRoutes);
    this.app.use(`${apiPrefix}/requirements`, requirementRoutes);
    this.app.use(`${apiPrefix}/ai`, aiRoutes);
    this.app.use(`${apiPrefix}/users`, userRoutes);

    // 根路径
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        name: 'TaskFlow AI API',
        version: this.configManager.get('app.version', '1.0.0'),
        description: '智能PRD文档解析与任务管理API',
        documentation: '/docs',
        health: '/health',
        timestamp: new Date().toISOString()
      });
    });

    // API信息
    this.app.get('/api', (req: Request, res: Response) => {
      res.json({
        name: 'TaskFlow AI API',
        version: 'v1',
        endpoints: {
          auth: '/api/auth',
          projects: `${apiPrefix}/projects`,
          tasks: `${apiPrefix}/tasks`,
          requirements: `${apiPrefix}/requirements`,
          ai: `${apiPrefix}/ai`,
          users: `${apiPrefix}/users`
        },
        documentation: '/docs',
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * 设置错误处理
   */
  private setupErrorHandling(): void {
    // 404处理
    this.app.use(notFoundHandler);

    // 全局错误处理
    this.app.use(errorHandler(this.logger));

    // 未捕获异常处理
    process.on('uncaughtException', (error: Error) => {
      this.logger.error('未捕获异常:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason: unknown, _promise: Promise<unknown>) => {
      this.logger.error('未处理的Promise拒绝:', reason);
      process.exit(1);
    });

    // 优雅关闭
    process.on('SIGTERM', async () => {
      this.logger.info('收到SIGTERM信号，开始优雅关闭...');
      await this.stop();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      this.logger.info('收到SIGINT信号，开始优雅关闭...');
      await this.stop();
      process.exit(0);
    });
  }
}

/**
 * 创建并启动API服务器
 */
export async function createApiServer(
  logger: Logger,
  configManager: ConfigManager
): Promise<ApiServer> {
  const server = new ApiServer(logger, configManager);
  await server.start();
  return server;
}
