/**
 * 配置相关类型
 */

/**
 * TaskFlow 配置
 */
export interface TaskFlowConfig {
  projectName: string;
  version: string;
  aiModels: AIModelConfig[];
  mcpSettings: MCPSettings;
  outputFormats: string[];
  plugins: PluginConfig[];
}

/**
 * AI 模型配置
 */
export interface AIModelConfig {
  provider: AIProvider;
  modelName: string;
  apiKey: string;
  endpoint?: string;
  maxTokens?: number;
  temperature?: number;
  priority: number;
  enabled: boolean;
}

/**
 * AI 提供商
 */
export type AIProvider =
  | 'deepseek'
  | 'zhipu'
  | 'qwen'
  | 'baidu'
  | 'moonshot'
  | 'spark'
  | 'openai'
  | 'claude';

/**
 * MCP 设置
 */
export interface MCPSettings {
  enabled: boolean;
  port: number;
  host: string;
  serverName: string;
  version: string;
  capabilities: MCPCapability[];
  security: MCPSecurity;
  tools: MCPTool[];
  resources: MCPResource[];
}

/**
 * MCP 能力
 */
export interface MCPCapability {
  name: string;
  version: string;
  description: string;
  enabled: boolean;
}

/**
 * MCP 安全设置
 */
export interface MCPSecurity {
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
 * MCP 工具
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: object;
  outputSchema?: object;
  handler: string;
  enabled: boolean;
  category: string;
}

/**
 * MCP 资源
 */
export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  handler: string;
}

/**
 * 插件配置
 */
export interface PluginConfig {
  name: string;
  version: string;
  enabled: boolean;
  settings: Record<string, any>;
}
