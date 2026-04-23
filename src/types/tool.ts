/**
 * Tool 类型定义
 * TaskFlow AI v4.0 - Unified Tool Types
 */

/**
 * JSON Schema 定义
 */
export type JSONSchema = {
  type: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  [key: string]: unknown;
};

/**
 * Tool 定义
 */
export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  parameters: JSONSchema;
  execute: ToolExecutor;
  permissions?: ToolPermission[];
  timeout?: number;
  version?: string;
  author?: string;
}

/**
 * Tool 类别
 */
export type ToolCategory =
  | 'filesystem'
  | 'shell'
  | 'http'
  | 'git'
  | 'database'
  | 'code'
  | 'ai'
  | 'custom';

/**
 * Tool 权限
 */
export type ToolPermission =
  | 'read:filesystem'
  | 'write:filesystem'
  | 'exec:shell'
  | 'network:http'
  | 'git:read'
  | 'git:write'
  | 'db:query'
  | 'db:write'
  | 'custom:*';

/**
 * Tool 执行器
 */
export type ToolExecutor = (
  params: Record<string, unknown>,
  context: ToolContext
) => Promise<ToolResult>;

/**
 * Tool 上下文
 */
export interface ToolContext {
  toolId: string;
  agentId?: string;
  workspace: string;
  environment: Record<string, unknown>;
  logger: ToolLogger;
  metadata: Record<string, unknown>;
}

/**
 * Tool 结果
 */
export interface ToolResult {
  success: boolean;
  output?: unknown;
  error?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Tool 日志器
 */
export interface ToolLogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string): void;
}

/**
 * Tool 注册表项
 */
export interface ToolRegistration {
  definition: ToolDefinition;
  registeredAt: number;
  usageCount: number;
  lastUsedAt: number;
}
