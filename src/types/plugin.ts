/**\n * 插件扩展\n */
export interface PluginExtension {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  repository?: string;
  license?: string;
  extensionPoints: ExtensionPoint[];
  hooks: PluginHooks;
  dependencies?: string[];
  keywords?: string[];
}

/**
 * 扩展点
 */
export interface ExtensionPoint {
  type: ExtensionType;
  id: string;
  implementation: unknown;
  metadata?: Record<string, unknown>;
}

/**
 * 扩展点类型
 */
export type ExtensionType = 'plugin' | 'agent' | 'tool' | 'workflow' | 'command' | 'ui' | 'middleware';

/**
 * 插件扩展类型别名（向后兼容）
 */
export type PluginPluginExtension = ExtensionType;

/**
 * 插件钩子
 */
export interface PluginHooks {
  onInit?: (context: PluginContext) => Promise<void> | void;
  onLoad?: () => Promise<void> | void;
  onUnload?: () => Promise<void> | void;
  onError?: (error: Error) => Promise<void> | void;
  onAgentCreate?: (agent: unknown) => Promise<unknown>;
  onAgentDestroy?: (agentId: string) => Promise<void>;
  onToolRegister?: (tool: unknown) => Promise<unknown>;
  onToolExecute?: (toolId: string, params: Record<string, unknown>) => Promise<void>;
  onWorkflowStart?: (workflow: unknown) => Promise<void>;
  onWorkflowComplete?: (result: unknown) => Promise<void>;
  onWorkflowError?: (error: Error) => Promise<void>;
  onCommand?: (command: string, args: string[]) => Promise<string> | string;
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

/**
 * 插件上下文
 */
export interface PluginContext {
  pluginId: string;
  appRoot: string;
  workspace: string;
  config: Record<string, unknown>;
  logger: PluginLogger;
  registry: PluginRegistry;
  api: PluginAPI;
}

/**
 * 插件日志器
 */
export interface PluginLogger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
  verbose(message: string, context?: Record<string, unknown>): void;
  silly(message: string, context?: Record<string, unknown>): void;
}

/**
 * 插件注册表
 */
export interface PluginRegistry {
  register<T = unknown>(name: string, implementation: T): void;
  unregister(name: string): boolean;
  get<T = unknown>(name: string): T | undefined;
  has(name: string): boolean;
  getAll(): string[];
  clear(): void;
}

/**
 * 插件 API
 */
export interface PluginAPI {
  config: PluginConfig;
  filesystem: PluginFilesystem;
  http: PluginHTTP;
  database: PluginDatabase;
  storage: PluginStorage;
  events: PluginEvents;
  commands: PluginCommands;
  workflows: PluginWorkflows;
  agents: PluginAgents;
  tools: PluginTools;
  ui: PluginUI;
}