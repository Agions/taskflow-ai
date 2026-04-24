import { getLogger } from '../../utils/logger';
/**
 * 认证管理
 */

import * as crypto from 'crypto';
import { SecurityContext } from './types';
const logger = getLogger('mcp/security/auth');

/**
 * 认证管理器
 */
export class AuthManager {
  private allowedTokens: Set<string> = new Set();

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
  }

  /**
   * 移除访问令牌
   */
  removeToken(token: string): boolean {
    return this.allowedTokens.delete(token);
  }

  /**
   * 验证令牌
   */
  validateToken(token: string, context: SecurityContext): boolean {
    if (!this.allowedTokens.has(token)) {
      return false;
    }

    context.userId = 'token-user';
    context.permissions = ['read', 'write', 'execute'];
    return true;
  }

  /**
   * 验证基本认证
   */
  validateBasicAuth(credentials: string, context: SecurityContext): boolean {
    try {
      const decoded = Buffer.from(credentials, 'base64').toString('utf-8');
      const [username, password] = decoded.split(':');

      if (username === 'admin' && password === 'taskflow2024') {
        context.userId = username;
        context.permissions = ['read', 'write', 'execute', 'admin'];
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * 获取令牌数量
   */
  getTokenCount(): number {
    return this.allowedTokens.size;
  }

  /**
   * 清空令牌
   */
  clearTokens(): void {
    this.allowedTokens.clear();
  }
}
