/**
 * IP 过滤器
 */

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
  validateOrigin(request: unknown,: boolean {
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
  getClientIP(request: unknown,: string {
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
