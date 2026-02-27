/**
 * 工具相关类型
 */

/**
 * 工具
 */
export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: ToolHandler;
}

/**
 * 工具处理器
 */
export type ToolHandler = (params: Record<string, unknown>) => Promise<ToolResult>;

/**
 * 工具结果
 */
export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}
