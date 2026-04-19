/**
 * MCP 提示类型定义
 */

export interface MCPPrompt {
  name: string;
  description: string;
  template: string;
  arguments: PromptArgument[];
  category: string;
  version: string;
  metadata?: PromptMetadata;
}

export interface PromptMetadata {
  author?: string;
  tags?: string[];
  examples?: PromptExample[];
}

export interface PromptArgument {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  default?: unknown;
}

export interface PromptExample {
  title: string;
  description: string;
  /** 参数值，与 PromptArgument schema 对应 */
  arguments: PromptArguments;
  expectedOutput?: string;
}

/** Prompt 参数值 — 键为参数名，值为对应类型 */
export type PromptArguments = Record<string, PromptArgumentValue>;

export type PromptArgumentValue =
  | string
  | number
  | boolean
  | unknown[]
  | Record<string, unknown>
  | null;

export interface PromptRenderOptions {
  strict?: boolean;
  fallback?: string;
}

/** MCPPromptManager 配置 */
export interface MCPPromptManagerConfig {
  /** 自定义提示目录 */
  promptsDir?: string;
  /** 是否启用缓存 */
  enableCache?: boolean;
  /** 模板缓存大小 */
  cacheSize?: number;
}
