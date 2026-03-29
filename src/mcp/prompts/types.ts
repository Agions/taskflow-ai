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
  metadata?: {
    author?: string;
    tags?: string[];
    examples?: PromptExample[];
  };
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
  arguments: Record<string, any>;
  expectedOutput?: string;
}

export interface PromptRenderOptions {
  strict?: boolean;
  fallback?: string;
}
