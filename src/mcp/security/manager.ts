/**
 * MCP安全管理器
 * 提供身份验证、权限控制和安全策略
 */

import crypto from 'crypto';
import { Logger } from '../../utils/logger';

export interface SecuritySettings {
  authRequired: boolean;
  allowedOrigins: string[];
  rateLimit: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
  };
  sandbox: {
    enabled: boolean;
    timeout: number;
    memoryLimit: number;
  };
}

export interface SecurityContext {
  userId?: string;
  permissions: string[];
  origin?: string;
  timestamp: number;
}

export class SecurityManager {
  private logger: Logger;
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();
  private blacklistedIPs: Set<string> = new Set();
  private allowedTokens: Set<string> = new Set();

  constructor(
    private settings: SecuritySettings,
    logger?: Logger
  ) {
    this.logger = logger || Logger.getInstance('SecurityManager');
  }

  /**
   * 初始化安全管理器
   */
  async initialize(): Promise<void> {
    this.logger.info('正在初始化安全管理器...');

    try {
      // 生成默认访问令牌
      const defaultToken = this.generateToken();
      this.allowedTokens.add(defaultToken);

      // 启动清理任务
      this.startCleanupTasks();

      this.logger.info('安全管理器初始化完成');
      this.logger.debug(`默认访问令牌: ${defaultToken}`);
    } catch (error) {
      this.logger.error('安全管理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 验证请求
   */
  async validateRequest(request: any): Promise<SecurityContext> {
    const context: SecurityContext = {
      permissions: [],
      timestamp: Date.now(),
    };

    try {
      // 检查IP黑名单
      const clientIP = this.getClientIP(request);
      if (this.blacklistedIPs.has(clientIP)) {
        throw new Error('IP已被禁止访问');
      }

      // 检查来源
      if (!this.validateOrigin(request)) {
        throw new Error('来源不被允许');
      }

      // 检查速率限制
      if (this.settings.rateLimit.enabled) {
        if (!this.checkRateLimit(clientIP)) {
          throw new Error('请求频率超过限制');
        }
      }

      // 身份验证
      if (this.settings.authRequired) {
        await this.authenticateRequest(request, context);
      } else {
        // 匿名访问，给予基本权限
        context.permissions = ['read'];
      }

      context.origin = request.headers?.origin;

      return context;
    } catch (error) {
      this.logger.warn('请求验证失败:', error);
      throw error;
    }
  }

  /**
   * 验证来源
   */
  private validateOrigin(request: any): boolean {
    if (this.settings.allowedOrigins.includes('*')) {
      return true;
    }

    const origin = request.headers?.origin;
    if (!origin) {
      return true; // 允许无来源的请求（如直接API调用）
    }

    return this.settings.allowedOrigins.includes(origin);
  }

  /**
   * 检查速率限制
   */
  private checkRateLimit(clientIP: string): boolean {
    const now = Date.now();
    const windowMs = this.settings.rateLimit.windowMs;
    const maxRequests = this.settings.rateLimit.maxRequests;

    let clientData = this.rateLimitStore.get(clientIP);

    if (!clientData || now > clientData.resetTime) {
      // 重置或初始化
      clientData = {
        count: 1,
        resetTime: now + windowMs,
      };
      this.rateLimitStore.set(clientIP, clientData);
      return true;
    }

    if (clientData.count >= maxRequests) {
      return false;
    }

    clientData.count++;
    return true;
  }

  /**
   * 身份验证
   */
  private async authenticateRequest(request: any, context: SecurityContext): Promise<void> {
    const authHeader = request.headers?.authorization;

    if (!authHeader) {
      throw new Error('缺少身份验证信息');
    }

    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      await this.validateToken(token, context);
    } else if (authHeader.startsWith('Basic ')) {
      const credentials = authHeader.substring(6);
      await this.validateBasicAuth(credentials, context);
    } else {
      throw new Error('不支持的身份验证方式');
    }
  }

  /**
   * 验证令牌
   */
  private async validateToken(token: string, context: SecurityContext): Promise<void> {
    if (!this.allowedTokens.has(token)) {
      throw new Error('无效的访问令牌');
    }

    // 简单的令牌权限映射
    context.userId = 'token-user';
    context.permissions = ['read', 'write', 'execute'];
  }

  /**
   * 验证基本认证
   */
  private async validateBasicAuth(credentials: string, context: SecurityContext): Promise<void> {
    try {
      const decoded = Buffer.from(credentials, 'base64').toString('utf-8');
      const [username, password] = decoded.split(':');

      // 简单的用户验证（实际应用中应使用数据库）
      if (username === 'admin' && password === 'taskflow2024') {
        context.userId = username;
        context.permissions = ['read', 'write', 'execute', 'admin'];
      } else {
        throw new Error('用户名或密码错误');
      }
    } catch (error) {
      throw new Error('身份验证解析失败');
    }
  }

  /**
   * 检查权限
   */
  checkPermission(context: SecurityContext, requiredPermission: string): boolean {
    return (
      context.permissions.includes(requiredPermission) || context.permissions.includes('admin')
    );
  }

  /**
   * 生成访问令牌
   */
  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * 添加访问令牌
   */
  addToken(token: string): void {
    this.allowedTokens.add(token);
    this.logger.debug(`访问令牌已添加: ${token.substring(0, 8)}...`);
  }

  /**
   * 移除访问令牌
   */
  removeToken(token: string): boolean {
    const result = this.allowedTokens.delete(token);
    if (result) {
      this.logger.debug(`访问令牌已移除: ${token.substring(0, 8)}...`);
    }
    return result;
  }

  /**
   * 加入IP黑名单
   */
  blacklistIP(ip: string): void {
    this.blacklistedIPs.add(ip);
    this.logger.warn(`IP已加入黑名单: ${ip}`);
  }

  /**
   * 移除IP黑名单
   */
  removeFromBlacklist(ip: string): boolean {
    const result = this.blacklistedIPs.delete(ip);
    if (result) {
      this.logger.info(`IP已从黑名单移除: ${ip}`);
    }
    return result;
  }

  /**
   * 获取客户端IP
   */
  private getClientIP(request: any): string {
    return (
      request.headers?.['x-forwarded-for']?.split(',')[0] ||
      request.headers?.['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      '127.0.0.1'
    );
  }

  /**
   * 创建安全沙箱
   */
  createSandbox(): any {
    if (!this.settings.sandbox.enabled) {
      return null;
    }

    return {
      timeout: this.settings.sandbox.timeout,
      memoryLimit: this.settings.sandbox.memoryLimit,
      allowedModules: ['fs', 'path', 'util'],
      blockedModules: ['child_process', 'cluster', 'net', 'dgram'],
      executeInContext: (code: string, context: any) => {
        // 简单的沙箱实现
        try {
          const vm = require('vm');
          const sandbox = {
            ...context,
            console: {
              log: (...args: any[]) => this.logger.debug('Sandbox:', ...args),
            },
          };

          return vm.runInNewContext(code, sandbox, {
            timeout: this.settings.sandbox.timeout,
          });
        } catch (error: any) {
          throw new Error(`沙箱执行失败: ${error.message}`);
        }
      },
    };
  }

  /**
   * 记录安全事件
   */
  logSecurityEvent(event: string, details: any): void {
    this.logger.warn(`安全事件: ${event}`, details);
  }

  /**
   * 获取安全统计
   */
  getSecurityStats(): any {
    return {
      rateLimitEntries: this.rateLimitStore.size,
      blacklistedIPs: this.blacklistedIPs.size,
      allowedTokens: this.allowedTokens.size,
      settings: {
        authRequired: this.settings.authRequired,
        rateLimitEnabled: this.settings.rateLimit.enabled,
        sandboxEnabled: this.settings.sandbox.enabled,
      },
    };
  }

  /**
   * 启动清理任务
   */
  private startCleanupTasks(): void {
    // 每分钟清理过期的速率限制记录
    setInterval(() => {
      const now = Date.now();
      for (const [ip, data] of this.rateLimitStore.entries()) {
        if (now > data.resetTime) {
          this.rateLimitStore.delete(ip);
        }
      }
    }, 60000);
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    this.rateLimitStore.clear();
    this.blacklistedIPs.clear();
    this.allowedTokens.clear();
    this.logger.info('安全管理器已清理');
  }
}
