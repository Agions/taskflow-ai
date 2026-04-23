/**
 * Extensions 类型定义
 * TaskFlow AI v4.0 - Unified Extensions Types
 */

/**
 * 扩展类型
 */
export enum ExtensionType {
  PLUGIN = 'plugin',
  AGENT = 'agent',
  TOOL = 'tool',
  WORKFLOW = 'workflow'
}

/**
 * 扩展状态
 */
export enum ExtensionStatus {
  LOADED = 'loaded',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error'
}

/**
 * 扩展定义
 */
export interface ExtensionDefinition<T = unknown> {
  type: ExtensionType;
  id: string;
  version: string;
  name: string;
  description?: string;
  implementation: T;
  dependencies?: string[];
  configSchema?: Record<string, unknown>;
}

/**
 * 扩展注册表
 */
export interface ExtensionRegistry {
  register<T = unknown>(definition: ExtensionDefinition<T>): void;
  unregister(extensionId: string): boolean;
  get<T = unknown>(extensionId: string): ExtensionDefinition<T> | undefined;
  getAll<T = unknown>(type?: ExtensionType): ExtensionDefinition<T>[];
  has(extensionId: string): boolean;
  clear(): void;
}

/**
 * 扩展生命周期
 */
export interface ExtensionLifecycle {
  onRegister?(extension: ExtensionDefinition): Promise<void> | void;
  onActivate?(extensionId: string): Promise<void> | void;
  onDeactivate?(extensionId: string): Promise<void> | void;
  onUnregister?(extensionId: string): Promise<void> | void;
  onError?(error: Error, extensionId: string): Promise<void> | void;
}

/**
 * 扩展加载器
 */
export interface ExtensionLoader {
  load<T = unknown>(definition: ExtensionDefinition<T>): Promise<T>;
  loadFromFile<T = unknown>(filePath: string): Promise<ExtensionDefinition<T>>;
  loadFromDirectory<T = unknown>(directoryPath: string, pattern?: string): Promise<ExtensionDefinition<T>[]>;
  unload(extensionId: string): Promise<boolean>;
  reload(extensionId: string): Promise<ExtensionDefinition<unknown> | undefined>;
}

/**
 * 扩展上下文
 */
export interface ExtensionContext {
  extensionId: string;
  extensionType: ExtensionType;
  workspace: string;
  config: Record<string, unknown>;
  logger: ExtensionLogger;
  api: ExtensionAPI;
}

/**
 * 扩展日志器
 */
export interface ExtensionLogger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

/**
 * 扩展 API
 */
export interface ExtensionAPI {
  registerAgent: (definition: unknown) => void;
  registerTool: (definition: unknown) => void;
  registerWorkflowNode: (definition: unknown) => void;
  getAgent: (id: string) => unknown | undefined;
  getTool: (id: string) => unknown | undefined;
  getWorkflowNode: (id: string) => unknown | undefined;
  emit: (event: string, data: unknown) => void;
  on: (event: string, handler: (data: unknown) => void) => () => void;
}
