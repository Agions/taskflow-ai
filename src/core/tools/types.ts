/**
 * Tool System - Type Definitions
 */

/**
 * 工具类别
 */
export type ToolCategory = 'filesystem' | 'system' | 'network' | 'code' | 'database' | 'custom';

/**
 * 工具参数 schema (JSON Schema format)
 */
export interface ToolParameterSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  default?: unknown;
  enum?: string[];
  properties?: Record<string, ToolParameterSchema>;
  required?: string[];
  items?: ToolParameterSchema;
}

/**
 * 工具定义
 */
export interface Tool {
  /** 工具唯一名称 */
  name: string;
  /** 工具描述 */
  description: string;
  /** 工具类别 */
  category: ToolCategory;
  /** 参数 schema */
  parameters: ToolParameterSchema;
  /** 执行函数 */
  handler: ToolHandler;
  /** 是否可重试 */
  retryable?: boolean;
  /** 超时时间 (ms) */
  timeout?: number;
  /** 是否需要确认 */
  requiresConfirmation?: boolean;
  /** 标签 */
  tags?: string[];
}

/**
 * 工具处理器类型
 */
export type ToolHandler = (params: Record<string, unknown>, context: ToolContext) => Promise<ToolResult>;

/**
 * 工具执行上下文
 */
export interface ToolContext {
  /** 当前工作目录 */
  cwd: string;
  /** 环境变量 */
  env: Record<string, string>;
  /** 用户信息 */
  user?: {
    id: string;
    name: string;
  };
  /** 工具调用来源 */
  source?: string;
  /** 附加数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 工具执行结果
 */
export interface ToolResult {
  /** 是否成功 */
  success: boolean;
  /** 输出内容 */
  output?: string;
  /** 错误信息 */
  error?: string;
  /** 执行时间 (ms) */
  duration?: number;
  /** 输出格式 */
  format?: 'text' | 'json' | 'html' | 'binary';
  /** 附加数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 工具调用记录
 */
export interface ToolCall {
  id: string;
  toolName: string;
  params: Record<string, unknown>;
  context: ToolContext;
  startTime: number;
  endTime?: number;
  result?: ToolResult;
}

/**
 * 内置工具信息
 */
export interface BuiltInToolInfo {
  name: string;
  category: ToolCategory;
  description: string;
}

/**
 * 工具执行选项
 */
export interface ToolExecuteOptions {
  /** 超时时间 (ms) */
  timeout?: number;
  /** 是否重试 */
  retry?: boolean;
  /** 最大重试次数 */
  maxRetries?: number;
}

/**
 * 工具调用事件
 */
export interface ToolCallEvent {
  type: 'tool_call_start' | 'tool_call_complete' | 'tool_call_error';
  toolName: string;
  toolCallId: string;
  params?: Record<string, unknown>;
  result?: ToolResult;
  error?: string;
  timestamp: number;
}
