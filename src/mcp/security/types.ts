/**
 * MCP 安全类型定义
 */

/**
 * 安全设置
 */
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

/**
 * 安全上下文
 */
export interface SecurityContext {
  userId?: string;
  permissions: string[];
  origin?: string;
  timestamp: number;
}

/**
 * 速率限制数据
 */
export interface RateLimitData {
  count: number;
  resetTime: number;
}

/**
 * 安全统计
 */
export interface SecurityStats {
  rateLimitEntries: number;
  blacklistedIPs: number;
  allowedTokens: number;
  settings: {
    authRequired: boolean;
    rateLimitEnabled: boolean;
    sandboxEnabled: boolean;
  };
}

/**
 * 沙箱配置
 */
export interface SandboxConfig {
  timeout: number;
  memoryLimit: number;
  allowedModules: string[];
  blockedModules: string[];
}
