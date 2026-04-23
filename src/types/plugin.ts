/**
 * Plugin 类型定义
 * TaskFlow AI v4.0 - Unified Plugin Types
 */

/**
 * 插件扩展
 */
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
export type ExtensionType = 'agent' | 'tool' | 'workflow' | 'command' | 'ui' | 'middleware';

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
}

/**
 * 插件注册表
 */
export interface PluginRegistry {
  register(extension: PluginExtension): void;
  unregister(pluginId: string): void;
  get(pluginId: string): PluginExtension | undefined;
  getAll(): PluginExtension[];
  getByType(type: ExtensionType): ExtensionPoint[];
}

/**
 * 插件 API
 */
export interface PluginAPI {
  registerAgent(definition: unknown): void;
  registerTool(definition: unknown): void;
  registerWorkflowNode(definition: unknown): void;
  emitEvent(event: string, data: unknown): void;
  subscribeEvent(event: string, handler: (data: unknown) => void): () => void;
}

/**
 * 插件命令
 */
export interface PluginCommand {
  name: string;
  description: string;
  action: (args: string[]) => Promise<void> | void;
}

/**
 * 插件元数据
 */
export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  repository?: string;
  keywords?: string[];
  license?: string;
  installedAt: number;
  enabled: boolean;
}
