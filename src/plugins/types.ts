/**
 * TaskFlow Plugin System - Type Definitions
 */

/**
 * 插件清单元数据
 */
export interface PluginManifest {
  /** 插件唯一名称 */
  name: string;
  /** 插件版本 */
  version: string;
  /** 插件描述 */
  description: string;
  /** 作者 */
  author: string;
  /** 入口文件 */
  main: string;
  /** 插件依赖 */
  dependencies?: Record<string, string>;
  /** 暴露的钩子列表 */
  hooks?: string[];
  /** 权限需求 */
  permissions?: string[];
  /** 标签 */
  tags?: string[];
}

/**
 * 钩子处理器类型
 */
export type HookHandler = (context: HookContext) => Promise<HookResult> | HookResult;

/**
 * 钩子上下文
 */
export interface HookContext {
  /** 事件类型 */
  event: string;
  /** 事件数据 */
  data: Record<string, unknown>;
  /** 时间戳 */
  timestamp: number;
  /** 触发来源 */
  source: string;
}

/**
 * 钩子结果
 */
export interface HookResult {
  /** 是否继续执行 */
  continue: boolean;
  /** 修改后的数据 */
  data?: Record<string, unknown>;
  /** 错误信息 */
  error?: string;
}

/**
 * 插件状态
 */
export type PluginStatus = 'loaded' | 'enabled' | 'disabled' | 'error';

/**
 * 插件信息 (用于列表展示)
 */
export interface PluginInfo {
  manifest: PluginManifest;
  status: PluginStatus;
  enabledAt?: number;
  error?: string;
}

/**
 * 插件存储接口
 */
export interface PluginStorage {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * 插件上下文
 */
export interface PluginContext {
  /** 配置服务 */
  config: {
    get<T>(key: string, defaultValue?: T): T;
    set(key: string, value: unknown): void;
  };
  /** 事件总线 */
  eventBus: {
    emit(event: string, data?: unknown): void;
    on(event: string, handler: (data: unknown) => void): void;
    off(event: string, handler: (data: unknown) => void): void;
  };
  /** 缓存管理器 */
  cache: {
    get<T>(key: string): T | undefined;
    set(key: string, value: unknown, ttl?: number): void;
    delete(key: string): void;
  };
  /** 日志器 */
  logger: {
    info(message: string, ...meta: unknown[]): void;
    warn(message: string, ...meta: unknown[]): void;
    error(message: string, ...meta: unknown[]): void;
    debug(message: string, ...meta: unknown[]): void;
  };
  /** 存储 */
  storage: PluginStorage;
}

/**
 * 任务流插件接口
 */
export interface TaskFlowPlugin {
  /** 元数据 */
  manifest: PluginManifest;
  
  /** 生命周期 */
  onLoad(context: PluginContext): Promise<void>;
  onEnable(): Promise<void>;
  onDisable(): Promise<void>;
  onUnload(): Promise<void>;
  
  /** 钩子实现 */
  hooks?: {
    beforeWorkflowExecute?: HookHandler;
    afterWorkflowComplete?: HookHandler;
    beforeStepExecute?: HookHandler;
    afterStepComplete?: HookHandler;
    onCacheHit?: HookHandler;
    onAIRequest?: HookHandler;
    onAIResponse?: HookHandler;
    onError?: HookHandler;
  };
}

/**
 * 内置插件名称
 */
export const BUILTIN_PLUGINS = {
  CACHE: '@taskflow/cache',
  TELEMETRY: '@taskflow/telemetry',
  STORAGE: '@taskflow/storage',
  NOTIFIER: '@taskflow/notifier',
} as const;

export type BuiltinPluginName = typeof BUILTIN_PLUGINS[keyof typeof BUILTIN_PLUGINS];
