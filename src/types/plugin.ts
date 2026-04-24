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

/**
 * 插件配置 API
 */
export interface PluginConfig {
  get<T = unknown>(key: string, defaultValue?: T): T;
  set<T = unknown>(key: string, value: T): void;
  has(key: string): boolean;
  delete(key: string): void;
  clear(): void;
}

/**
 * 插件文件系统 API
 */
export interface PluginFilesystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  readdir(path: string): Promise<string[]>;
  mkdir(path: string): Promise<void>;
  rm(path: string): Promise<void>;
}

/**
 * 插件 HTTP API
 */
export interface PluginHTTP {
  get(url: string, options?: Record<string, unknown>): Promise<unknown>;
  post(url: string, data: unknown, options?: Record<string, unknown>): Promise<unknown>;
  put(url: string, data: unknown, options?: Record<string, unknown>): Promise<unknown>;
  delete(url: string, options?: Record<string, unknown>): Promise<unknown>;
}

/**
 * 插件数据库 API
 */
export interface PluginDatabase {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  execute(sql: string, params?: unknown[]): Promise<number>;
}

/**
 * 插件存储 API
 */
export interface PluginStorage {
  get<T = unknown>(key: string): Promise<T | undefined>;
  set<T = unknown>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * 插件事件 API
 */
export interface PluginEvents {
  emit(event: string, data?: unknown): void;
  on(event: string, handler: (data: unknown) => void): void;
  off(event: string, handler: (data: unknown) => void): void;
}

/**
 * 插件命令 API
 */
export interface PluginCommands {
  register(name: string, handler: (args: string[]) => Promise<string>): void;
  unregister(name: string): boolean;
  execute(name: string, args: string[]): Promise<string>;
}

/**
 * 插件工作流 API
 */
export interface PluginWorkflows {
  register(workflow: unknown): void;
  unregister(name: string): boolean;
  execute(name: string, context?: unknown): Promise<unknown>;
}

/**
 * 插件代理 API
 */
export interface PluginAgents {
  create(config: unknown): Promise<string>;
  destroy(id: string): Promise<void>;
  execute(id: string, task: string): Promise<unknown>;
}

/**
 * 插件工具 API
 */
export interface PluginTools {
  register(tool: unknown): void;
  unregister(name: string): boolean;
  execute(name: string, params?: unknown): Promise<unknown>;
}

/**
 * 插件 UI API
 */
export interface PluginUI {
  showNotification(message: string, type?: string): void;
  showDialog(title: string, message: string): Promise<boolean>;
  showInput(prompt: string): Promise<string>;
}