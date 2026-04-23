/**
 * Config 类型定义
 * TaskFlow AI v4.0 - Unified Config Types
 */

/**
 * TaskFlow AI 配置
 */
export interface TaskFlowConfig {
  version: string;
  workspace: string;
  environment: 'development' | 'staging' | 'production';
  models: ModelConfig[];
  cache: CacheConfig;
  logging: LoggingConfig;
  plugins: PluginsConfig;
  extensions: ExtensionsConfig;
  security: SecurityConfig;
}

/**
 * 模型配置
 */
export interface ModelConfig {
  id: string;
  provider: ModelProvider;
  modelName: string;
  apiKey?: string;
  apiEndpoint?: string;
  enabled: boolean;
  priority: number;
  capabilities: ModelCapability[];
  rateLimits?: RateLimit;
}

/**
 * 模型提供商
 */
export type ModelProvider =
  | 'deepseek'
  | 'openai'
  | 'anthropic'
  | 'zhipu'
  | 'qwen'
  | 'moonshot'
  | 'custom';

/**
 * 模型能力
 */
export type ModelCapability =
  | 'chat'
  | 'completion'
  | 'embedding'
  | 'vision'
  | 'function_calling'
  | 'json_mode'
  | 'streaming';

/**
 * 速率限制配置
 */
export interface RateLimit {
  rpm: number;
  tpm: number;
  concurrent: number;
}

/**
 * 缓存配置
 */
export interface CacheConfig {
  enabled: boolean;
  l1: {
    enabled: boolean;
    maxSize: number;
    ttl: number;
  };
  l2: {
    enabled: boolean;
    ttl: number;
  };
}

/**
 * 日志配置
 */
export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  file?: string;
  console: boolean;
  format: 'json' | 'text';
}

/**
 * 插件配置
 */
export interface PluginsConfig {
  enabled: string[];
  directory: string;
  autoLoad: boolean;
}

/**
 * 扩展配置
 */
export interface ExtensionsConfig {
  agents: ExtensionsDirectoryConfig;
  tools: ExtensionsDirectoryConfig;
  workflows: ExtensionsDirectoryConfig;
}

/**
 * 扩展目录配置
 */
export interface ExtensionsDirectoryConfig {
  directory: string;
  autoDiscover: boolean;
}

/**
 * 安全配置
 */
export interface SecurityConfig {
  enableCommandWhitelist: boolean;
  allowedCommands?: string[];
  enablePrivateIPRestriction: boolean;
  enablePathTraversalProtection: boolean;
  enableCredentialMasking: boolean;
}
