import { getLogger } from '../../utils/logger';
const logger = getLogger('mcp/security/ip-filter');

/**
 * HTTP 请求对象的最小接口（兼容 Express / http / 自定义）
 */
export interface RequestLike {
  headers?: {
    origin?: string;
    authorization?: string;
    'x-forwarded-for'?: string;
    'x-real-ip'?: string;
    [key: string]: unknown;
  };
  connection?: { remoteAddress?: string };
  socket?: { remoteAddress?: string };
}

/**
 * IP 过滤器
 */
export class IPFilter {
  private blacklistedIPs: Set<string> = new Set();
  private allowedOrigins: string[];

  constructor(allowedOrigins: string[]) {
    this.allowedOrigins = allowedOrigins;
  }

  /**
   * 检查 IP 是否在黑名单中
   */
  isBlacklisted(ip: string): boolean {
    return this.blacklistedIPs.has(ip);
  }

  /**
   * 将 IP 加入黑名单
   */
  blacklist(ip: string): void {
    this.blacklistedIPs.add(ip);
  }

  /**
   * 将 IP 从黑名单移除
   */
  removeFromBlacklist(ip: string): boolean {
    return this.blacklistedIPs.delete(ip);
  }

  /**
   * 获取黑名单数量
   */
  getBlacklistCount(): number {
    return this.blacklistedIPs.size;
  }

  /**
   * 验证来源
   */
  validateOrigin(request: RequestLike): boolean {
    if (this.allowedOrigins.includes('*')) {
      return true;
    }

    const origin = request.headers?.origin;
    if (!origin) {
      return true;
    }

    return this.allowedOrigins.includes(origin);
  }

  /**
   * 获取客户端 IP
   */
  getClientIP(request: RequestLike): string {
    return (
      request.headers?.['x-forwarded-for']?.split(',')[0] ||
      request.headers?.['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      '127.0.0.1'
    );
  }

  /**
   * 清空黑名单
   */
  clearBlacklist(): void {
    this.blacklistedIPs.clear();
  }
}
