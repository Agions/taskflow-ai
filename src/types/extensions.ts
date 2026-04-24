/**
 * Extensions 类型定义
 * TaskFlow AI v4.0 - Unified Extensions Types
 */

/**
 * ExtensionType 类型别名（向后兼容）
 */
export type ExtensionType = 'plugin' | 'agent' | 'tool' | 'workflow' | 'command' | 'ui' | 'middleware';

/**
 * Extension 类型常量
 */
export const ExtensionTypes = {
  COMMAND: 'command',
  TOOL: 'tool',
  PLUGIN: 'plugin',
  AGENT: 'agent',
  WORKFLOW: 'workflow',
  UI: 'ui',
  MIDDLEWARE: 'middleware'
} as const;

/**
 * 扩展状态
 */
export enum ExtensionStatus {
  LOADED = 'loaded',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  PENDING = 'pending',
  LOADING = 'loading',
  DISPOSED = 'disposed'
}

/**
 * ExtensionStatus 值数组
 */
export const EXTENSION_STATUS_VALUES: ExtensionStatus[] = [
  ExtensionStatus.PENDING,
  ExtensionStatus.LOADING,
  ExtensionStatus.LOADED,
  ExtensionStatus.ACTIVE,
  ExtensionStatus.INACTIVE,
  ExtensionStatus.ERROR,
  ExtensionStatus.DISPOSED
];

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
  status: ExtensionStatus;
  metadata: Record<string, unknown>;
  dependencies: string[];
  config: Record<string, unknown>;
  logger: ExtensionLogger;
  registry: ExtensionRegistry;
  lifecycle: ExtensionLifecycle;
}

/**
 * 扩展日志器
 */
export interface ExtensionLogger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
}

/**
 * 扩展管理器
 */
export interface ExtensionManager {
  initialize(config?: ExtensionManagerConfig): Promise<void>;
  shutdown(): Promise<void>;
  register<T = unknown>(definition: ExtensionDefinition<T>): Promise<void>;
  unregister(extensionId: string): Promise<boolean>;
  activate(extensionId: string): Promise<void>;
  deactivate(extensionId: string): Promise<void>;
  get<T = unknown>(extensionId: string): ExtensionDefinition<T> | undefined;
  getActive(): ExtensionDefinition<unknown>[];
  getByType<T = unknown>(type: ExtensionType): ExtensionDefinition<T>[];
  has(extensionId: string): boolean;
  reload(extensionId: string): Promise<ExtensionDefinition<unknown> | undefined>;
  validateDependencies(extensionId: string): Promise<boolean>;
  exportConfiguration(): Record<string, unknown>;
  importConfiguration(config: Record<string, unknown>): Promise<void>;
}

/**
 * 扩展配置
 */
export interface ExtensionConfig {
  get<T = unknown>(key: string, defaultValue?: T): T | undefined;
  set(key: string, value: unknown): void;
  delete(key: string): void;
  has(key: string): boolean;
  getAll(): Record<string, unknown>;
  merge(config: Record<string, unknown>): void;
  validate(): ValidationResult;
}

/**
 * 扩展管理器配置
 */
export interface ExtensionManagerConfig {
  extensionsPath?: string;
  autoLoad?: boolean;
  hotReload?: boolean;
  logging?: {
    level?: 'debug' | 'info' | 'warn' | 'error';
    format?: 'json' | 'text';
  };
  validation?: {
    strictMode?: boolean;
    allowIncompatibleVersions?: boolean;
  };
}

/**
 * 扩展事件
 */
export interface ExtensionEvent {
  type: 'registered' | 'activated' | 'deactivated' | 'unregistered' | 'error' | 'reloaded';
  extensionId: string;
  timestamp: number;
  data?: Record<string, unknown>;
  error?: Error;
}

/**
 * 扩展事件监听器
 */
export type ExtensionEventListener = (event: ExtensionEvent) => void | Promise<void>;

/**
 * 扩展事件总线
 */
export interface ExtensionEventBus {
  emit(event: ExtensionEvent): void;
  on(eventType: string, listener: ExtensionEventListener): void;
  off(eventType: string, listener: ExtensionEventListener): void;
  once(eventType: string, listener: ExtensionEventListener): void;
  removeAllListeners(eventType?: string): void;
}

/**
 * 扩展验证器
 */
export interface ExtensionValidator {
  validate(definition: ExtensionDefinition): ValidationResult;
  validateConfig(extensionId: string, config: Record<string, unknown>): ValidationResult;
  validateDependencies(extensionId: string): ValidationResult;
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * 验证错误
 */
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * 验证警告
 */
export interface ValidationWarning {
  field: string;
  message: string;
}

/**
 * 扩展加载策略
 */
export enum ExtensionLoadStrategy {
  EAGER = 'eager',
  LAZY = 'lazy',
  ON_DEMAND = 'on-demand'
}

/**
 * 扩展优先级
 */
export enum ExtensionPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  CRITICAL = 4
}

/**
 * 扩展元数据
 */
export interface ExtensionMetadata {
  author?: string;
  repository?: string;
  homepage?: string;
  bugs?: string;
  license?: string;
  keywords?: string[];
  categories?: string[];
  screenshots?: string[];
  videos?: string[];
  downloads?: number;
  rating?: number;
  lastUpdated?: number;
  compatibility?: {
    minVersion?: string;
    maxVersion?: string;
    nodeVersions?: string[];
  };
}

/**
 * 扩展包信息
 */
export interface ExtensionPackage extends ExtensionDefinition {
  metadata: ExtensionMetadata;
  entryPoint: string;
  main: string;
  bin?: Record<string, string>;
  files?: string[];
  engines?: Record<string, string>;
  scripts?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

/**
 * 扩展安装选项
 */
export interface ExtensionInstallOptions {
  force?: boolean;
  skipDependencies?: boolean;
  installPath?: string;
  version?: string;
  registry?: string;
}

/**
 * 扩展卸载选项
 */
export interface ExtensionUninstallOptions {
  keepConfig?: boolean;
  removeData?: boolean;
  removeLogs?: boolean;
}

/**
 * 扩展更新选项
 */
export interface ExtensionUpdateOptions {
  force?: boolean;
  reinstallDependencies?: boolean;
  rollbackOnFailure?: boolean;
}

/**
 * 扩展搜索选项
 */
export interface ExtensionSearchOptions {
  query?: string;
  type?: ExtensionType;
  category?: string;
  author?: string;
  sortBy?: 'name' | 'downloads' | 'rating' | 'updated';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * 扩展搜索结果
 */
export interface ExtensionSearchResult {
  extensions: ExtensionPackage[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * 扩展市场信息
 */
export interface ExtensionMarketplace {
  search(options: ExtensionSearchOptions): Promise<ExtensionSearchResult>;
  getDetails(packageName: string): Promise<ExtensionPackage | null>;
  getPopular(type?: ExtensionType): Promise<ExtensionPackage[]>;
  getUpdates(): Promise<ExtensionPackage[]>;
  install(packageName: string, options?: ExtensionInstallOptions): Promise<void>;
  uninstall(packageName: string, options?: ExtensionUninstallOptions): Promise<void>;
  update(packageName: string, options?: ExtensionUpdateOptions): Promise<void>;
  publish(packageInfo: ExtensionPackage): Promise<void>;
}

/**
 * 扩展依赖关系
 */
export interface ExtensionDependency {
  name: string;
  version: string;
  required: boolean;
  optional?: boolean;
  peer?: boolean;
  dev?: boolean;
  resolved?: string;
  integrity?: string;
  from?: string;
}

/**
 * 依赖图节点
 */
export interface DependencyNode {
  name: string;
  version: string;
  dependencies: ExtensionDependency[];
  dependents: string[];
  depth: number;
  loaded: boolean;
}

/**
 * 依赖图
 */
export interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  rootNodes: string[];
  leafNodes: string[];
  circularDependencies: string[][];
  addNode(name: string, version: string, dependencies: ExtensionDependency[]): void;
  removeNode(name: string): void;
  getNode(name: string): DependencyNode | undefined;
  findCircularDependencies(): string[][] | [];
  topologicalSort(): string[];
  validateOrder(order: string[]): ValidationResult;
}

/**
 * 扩展 API
 */
export interface ExtensionAPI {
  config: ExtensionConfig;
  registry: ExtensionRegistry;
  lifecycle: ExtensionLifecycle;
  loader: ExtensionLoader;
  logger: ExtensionLogger;
  events: ExtensionEventBus;
  manager: ExtensionManager;
}