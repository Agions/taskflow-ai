/**
 * MCP安全管理器
 * 提供身份验证、权限控制和安全策略
 */

import { Logger } from '../../utils/logger';
import { SecuritySettings, SecurityContext, SecurityStats } from './types';
import { AuthManager } from './auth';
import { RateLimiter } from './rate-limiter';
import { IPFilter } from './ip-filter';
import { SandboxManager } from './sandbox';

export class SecurityManager {
  private logger: Logger;
  private authManager: AuthManager;
  private rateLimiter: RateLimiter;
  private ipFilter: IPFilter;
  private sandboxManager: SandboxManager;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(
    private settings: SecuritySettings,
    logger?: Logger
  ) {
    this.logger = logger || Logger.getInstance('SecurityManager');
    this.authManager = new AuthManager();
    this.rateLimiter = new RateLimiter(settings.rateLimit);
    this.ipFilter = new IPFilter(settings.allowedOrigins);
    this.sandboxManager = new SandboxManager(settings.sandbox, logger);
  }

  /**
   * 初始化安全管理器
   */
  async initialize(): Promise<void> {
    this.logger.info('正在初始化安全管理器...');

    try {
      const defaultToken = this.authManager.generateToken();
      this.authManager.addToken(defaultToken);

      if (this.settings.rateLimit.enabled) {
        this.cleanupInterval = this.rateLimiter.startAutoCleanup();
      }

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
  async validateRequest(request: unknown,: Promise<SecurityContext> {
    const context: SecurityContext = {
      permissions: [],
      timestamp: Date.now(),
    };

    try {
      const clientIP = this.ipFilter.getClientIP(request);
      if (this.ipFilter.isBlacklisted(clientIP)) {
        throw new Error('IP已被禁止访问');
      }

      if (!this.ipFilter.validateOrigin(request)) {
        throw new Error('来源不被允许');
      }

      if (!this.rateLimiter.checkLimit(clientIP)) {
        throw new Error('请求频率超过限制');
      }

      if (this.settings.authRequired) {
        await this.authenticateRequest(request, context);
      } else {
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
   * 身份验证
   */
  private async authenticateRequest(request: unknown, context: SecurityContext): Promise<void> {
    const authHeader = request.headers?.authorization;

    if (!authHeader) {
      throw new Error('缺少身份验证信息');
    }

    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (!this.authManager.validateToken(token, context)) {
        throw new Error('无效的访问令牌');
      }
    } else if (authHeader.startsWith('Basic ')) {
      const credentials = authHeader.substring(6);
      if (!this.authManager.validateBasicAuth(credentials, context)) {
        throw new Error('用户名或密码错误');
      }
    } else {
      throw new Error('不支持的身份验证方式');
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
    return this.authManager.generateToken();
  }

  /**
   * 添加访问令牌
   */
  addToken(token: string): void {
    this.authManager.addToken(token);
    this.logger.debug(`访问令牌已添加: ${token.substring(0, 8)}...`);
  }

  /**
   * 移除访问令牌
   */
  removeToken(token: string): boolean {
    const result = this.authManager.removeToken(token);
    if (result) {
      this.logger.debug(`访问令牌已移除: ${token.substring(0, 8)}...`);
    }
    return result;
  }

  /**
   * 加入IP黑名单
   */
  blacklistIP(ip: string): void {
    this.ipFilter.blacklist(ip);
    this.logger.warn(`IP已加入黑名单: ${ip}`);
  }

  /**
   * 移除IP黑名单
   */
  removeFromBlacklist(ip: string): boolean {
    const result = this.ipFilter.removeFromBlacklist(ip);
    if (result) {
      this.logger.info(`IP已从黑名单移除: ${ip}`);
    }
    return result;
  }

  /**
   * 创建安全沙箱
   */
  createSandbox(): unknown {
    return this.sandboxManager.createSandbox();
  }

  /**
   * 记录安全事件
   */
  logSecurityEvent(event: string, details: unknown,: void {
    this.logger.warn(`安全事件: ${event}`, details);
  }

  /**
   * 获取安全统计
   */
  getSecurityStats(): SecurityStats {
    return {
      rateLimitEntries: this.rateLimiter.getEntryCount(),
      blacklistedIPs: this.ipFilter.getBlacklistCount(),
      allowedTokens: this.authManager.getTokenCount(),
      settings: {
        authRequired: this.settings.authRequired,
        rateLimitEnabled: this.settings.rateLimit.enabled,
        sandboxEnabled: this.settings.sandbox.enabled,
      },
    };
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.rateLimiter.clear();
    this.ipFilter.clearBlacklist();
    this.authManager.clearTokens();
    this.logger.info('安全管理器已清理');
  }
}

export * from './types';
export { AuthManager } from './auth';
export { RateLimiter } from './rate-limiter';
export { IPFilter } from './ip-filter';
export { SandboxManager } from './sandbox';
export { validateCommand, validateUrl, validateFilePath, validateDownloadPath } from './validator';
