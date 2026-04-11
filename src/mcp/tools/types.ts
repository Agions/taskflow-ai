import { getLogger } from '../../utils/logger';
const logger = getLogger('mcp/tools/types');

/**
 * 工具类型定义 - 增强版
 */

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: ToolHandler;
  category?: string;
  tags?: string[];
  version?: string;

  // 增强字段
  auth?: AuthConfig;
  rateLimit?: RateLimitConfig;
  permissions?: PermissionLevel[];
  examples?: ToolExample[];
}

export type ToolHandler = (
  input: Record<string, unknown>,
  context?: ToolContext
) => Promise<unknown>;

export interface ToolContext {
  workspace?: string;
  userId?: string;
  sessionId?: string;
  variables?: Record<string, unknown>;
}

export interface ToolExample {
  input: Record<string, unknown>;
  description?: string;
}

export interface ToolRegistration {
  tool: ToolDefinition;
  registeredAt: number;
  callCount: number;
  lastCalled?: number;
}

export interface ToolCategory {
  id: string;
  name: string;
  description: string;
  tools: string[];
  icon?: string;
}

// ============ 权限系统 ============

export enum PermissionLevel {
  NONE = 0,
  READ = 1,
  WRITE = 2,
  EXECUTE = 4,
  ADMIN = 8,
}

export interface AuthConfig {
  type: 'none' | 'bearer' | 'basic' | 'apiKey';
  required?: boolean;
  keyName?: string;
}

export interface RateLimitConfig {
  maxCalls: number;
  windowMs: number;
}

// ============ 统一工具响应 Schema ============

/**
 * 所有工具的标准化响应格式
 * 替代散乱的 unknown 返回值
 */
export interface ToolResponse<T = unknown> {
  /** 执行是否成功（不论是否有业务层面的数据） */
  success: boolean;
  /** 业务数据负载 */
  data?: T;
  /** 错误信息（success=false 时填充） */
  error?: {
    code: string;
    message: string;
    recoverable?: boolean;
  };
  /** 执行元数据 */
  metadata: {
    tool: string;
    duration: number;
    timestamp: number;
    tokens?: number;
    cacheHit?: boolean;
  };
}

/** 工具执行失败时的错误响应便捷构造器 */
export function toolError(
  code: string,
  message: string,
  options?: { recoverable?: boolean; tool?: string; duration?: number }
): ToolResponse<never> {
  return {
    success: false,
    error: { code, message, recoverable: options?.recoverable },
    metadata: {
      tool: options?.tool ?? 'unknown',
      duration: options?.duration ?? 0,
      timestamp: Date.now(),
    },
  };
}

/** 工具执行成功时的响应便捷构造器 */
export function toolOk<T>(
  data: T,
  options?: { tool?: string; duration?: number; tokens?: number; cacheHit?: boolean }
): ToolResponse<T> {
  return {
    success: true,
    data,
    metadata: {
      tool: options?.tool ?? 'unknown',
      duration: options?.duration ?? 0,
      timestamp: Date.now(),
      tokens: options?.tokens,
      cacheHit: options?.cacheHit,
    },
  };
}

// ============ 遗留类型（兼容）=========== /** @deprecated 使用 ToolResponse 代替 */
export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  isError?: boolean;
  metadata?: {
    duration?: number;
    tokens?: number;
    cacheHit?: boolean;
  };
}

// ============ 工具调用请求 ============

export interface ToolCallRequest {
  name: string;
  arguments: Record<string, unknown>;
  id?: string;
}

export interface ToolCallResponse {
  id?: string;
  result?: unknown;
  error?: {
    code: string;
    message: string;
  };
}

// ============ MCP 协议类型 ============

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface MCPToolsListResponse {
  tools: MCPTool[];
}
