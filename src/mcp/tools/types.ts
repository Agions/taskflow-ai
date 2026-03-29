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

// ============ 工具结果 ============

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
