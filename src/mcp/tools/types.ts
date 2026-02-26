/**
 * 工具类型定义
 */

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: ToolHandler;
  category?: string;
  tags?: string[];
  version?: string;
}

export type ToolHandler = (input: Record<string, unknown>) => Promise<unknown>;

export interface ToolRegistration {
  tool: ToolDefinition;
  registeredAt: number;
  callCount: number;
  lastCalled?: number;
}

export interface ToolCategory {
  name: string;
  description: string;
  tools: string[];
}
