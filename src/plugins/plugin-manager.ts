/**
 * Plugin Manager - 插件管理器
 * 负责插件的加载、启用、禁用、卸载
 */

import { getLogger } from '../utils/logger';
import { getEventBus, TaskFlowEvent } from '../core/events';
import {
  TaskFlowPlugin,
  PluginManifest,
  PluginInfo,
  PluginContext,
  PluginStatus,
  HookHandler,
  HookContext,
  HookResult,
} from './types';

const logger = getLogger('plugins');

/**
 * 插件管理器选项
 */
export interface PluginManagerOptions {
  /** 插件目录 */
  pluginDir?: string;
  /** 自动启用 */
  autoEnable?: boolean;
}

/**
 * 插件管理器
 */
export class PluginManager {
  private plugins: Map<string, TaskFlowPlugin> = new Map();
  private pluginInfo: Map<string, PluginInfo> = new Map();
  private hookHandlers: Map<string, Set<HookHandler>> = new Map();
  private context: PluginContext;
  private pluginDir: string;
  private autoEnable: boolean;

  constructor(options: PluginManagerOptions = {}) {
    this.pluginDir = options.pluginDir || './plugins';
    this.autoEnable = options.autoEnable ?? true;

    // 创建插件上下文
    this.context = this.createContext();

    // 订阅事件系统
    this.setupEventBusHooks();

    logger.info(`PluginManager 初始化: pluginDir=${this.pluginDir}, autoEnable=${this.autoEnable}`);
  }

  /**
   * 创建插件上下文
   */
  private createContext(): PluginContext {
    const eventBus = getEventBus();

    return {
      config: {
        get: <T>(key: string, defaultValue?: T): T => {
          // 简化实现，实际应连接配置服务
          return defaultValue as T;
        },
        set: (_key: string, _value: unknown): void => {
          // 简化实现
        },
      },
      eventBus: {
        emit: (event: string, data?: unknown) => {
          eventBus.emit({
            type: event as TaskFlowEvent,
            payload: data,
            timestamp: Date.now(),
            source: 'Plugin',
          });
        },
        on: (event: string, handler: (data: unknown) => void) => {
          eventBus.on(event as TaskFlowEvent, handler as (payload: unknown) => void);
        },
        off: (event: string, _handler: (data: unknown) => void) => {
          // 注意: EventBus.off() 只接受事件名，不支持按处理器取消
          eventBus.off(event as TaskFlowEvent);
        },
      },
      cache: {
        get: <T>(_key: string): T | undefined => undefined,
        set: (_key: string, _value: unknown, _ttl?: number): void => {},
        delete: (_key: string): void => {},
      },
      logger: {
        info: (message: string, ...meta: unknown[]) => logger.info(`[Plugin] ${message}`, ...meta),
        warn: (message: string, ...meta: unknown[]) => logger.warn(`[Plugin] ${message}`, ...meta),
        error: (message: string, ...meta: unknown[]) =>
          logger.error(`[Plugin] ${message}`, ...meta),
        debug: (message: string, ...meta: unknown[]) =>
          logger.debug(`[Plugin] ${message}`, ...meta),
      },
      storage: {
        get: async (_key: string): Promise<unknown> => undefined,
        set: async (_key: string, _value: unknown): Promise<void> => {},
        delete: async (_key: string): Promise<void> => {},
        clear: async (): Promise<void> => {},
      },
    };
  }

  /**
   * 设置事件总线钩子
   */
  private setupEventBusHooks(): void {
    const eventBus = getEventBus();

    // 监听各种事件并触发插件钩子
    const hookMap: Record<string, TaskFlowEvent[]> = {
      beforeWorkflowExecute: [TaskFlowEvent.WORKFLOW_START],
      afterWorkflowComplete: [TaskFlowEvent.WORKFLOW_COMPLETE],
      beforeStepExecute: [TaskFlowEvent.STEP_START],
      afterStepComplete: [TaskFlowEvent.STEP_COMPLETE],
      onAIRequest: [TaskFlowEvent.AI_REQUEST],
      onAIResponse: [TaskFlowEvent.AI_RESPONSE],
      onCacheHit: [TaskFlowEvent.CACHE_HIT],
    };

    for (const [hookName, events] of Object.entries(hookMap)) {
      for (const event of events) {
        eventBus.on(event, async (payload: unknown) => {
          await this.executeHook(hookName, payload);
        });
      }
    }
  }

  /**
   * 执行钩子
   */
  private async executeHook(hookName: string, payload: unknown): Promise<void> {
    const handlers = this.hookHandlers.get(hookName);
    if (!handlers || handlers.size === 0) return;

    const context: HookContext = {
      event: hookName,
      data: payload as Record<string, unknown>,
      timestamp: Date.now(),
      source: 'EventBus',
    };

    for (const handler of handlers) {
      try {
        const result = await handler(context);
        if (result && !result.continue) {
          logger.debug(`Hook ${hookName} returned false, stopping execution`);
          break;
        }
      } catch (error) {
        logger.error(`Hook ${hookName} execution error:`, error);
      }
    }
  }

  /**
   * 注册插件
   */
  async register(plugin: TaskFlowPlugin): Promise<void> {
    if (this.plugins.has(plugin.manifest.name)) {
      throw new Error(`Plugin ${plugin.manifest.name} is already registered`);
    }

    this.plugins.set(plugin.manifest.name, plugin);
    this.pluginInfo.set(plugin.manifest.name, {
      manifest: plugin.manifest,
      status: 'loaded',
    });

    // 注册钩子
    if (plugin.hooks) {
      for (const [hookName, handler] of Object.entries(plugin.hooks)) {
        if (handler) {
          this.registerHook(hookName, handler);
        }
      }
    }

    // 加载插件
    await plugin.onLoad(this.context);

    // 自动启用
    if (this.autoEnable) {
      await this.enable(plugin.manifest.name);
    }

    logger.info(`Plugin registered: ${plugin.manifest.name}@${plugin.manifest.version}`);
  }

  /**
   * 注册钩子处理器
   */
  private registerHook(hookName: string, handler: HookHandler): void {
    if (!this.hookHandlers.has(hookName)) {
      this.hookHandlers.set(hookName, new Set());
    }
    this.hookHandlers.get(hookName)!.add(handler);
  }

  /**
   * 启用插件
   */
  async enable(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} is not registered`);
    }

    const info = this.pluginInfo.get(pluginName)!;
    if (info.status === 'enabled') {
      logger.warn(`Plugin ${pluginName} is already enabled`);
      return;
    }

    try {
      await plugin.onEnable();
      info.status = 'enabled';
      info.enabledAt = Date.now();
      logger.info(`Plugin enabled: ${pluginName}`);
    } catch (error) {
      info.status = 'error';
      info.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  /**
   * 禁用插件
   */
  async disable(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} is not registered`);
    }

    const info = this.pluginInfo.get(pluginName)!;
    if (info.status !== 'enabled') {
      logger.warn(`Plugin ${pluginName} is not enabled`);
      return;
    }

    try {
      await plugin.onDisable();
      info.status = 'disabled';
      delete info.enabledAt;
      logger.info(`Plugin disabled: ${pluginName}`);
    } catch (error) {
      logger.error(`Failed to disable plugin ${pluginName}:`, error);
      throw error;
    }
  }

  /**
   * 卸载插件
   */
  async unregister(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} is not registered`);
    }

    const info = this.pluginInfo.get(pluginName)!;

    // 如果已启用，先禁用
    if (info.status === 'enabled') {
      await this.disable(pluginName);
    }

    // 取消注册钩子
    if (plugin.hooks) {
      for (const [hookName, handler] of Object.entries(plugin.hooks)) {
        if (handler) {
          this.unregisterHook(hookName, handler);
        }
      }
    }

    // 调用卸载钩子
    await plugin.onUnload();

    // 移除插件
    this.plugins.delete(pluginName);
    this.pluginInfo.delete(pluginName);

    logger.info(`Plugin unregistered: ${pluginName}`);
  }

  /**
   * 取消注册钩子
   */
  private unregisterHook(hookName: string, handler: HookHandler): void {
    const handlers = this.hookHandlers.get(hookName);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * 获取插件信息
   */
  getPlugin(pluginName: string): TaskFlowPlugin | undefined {
    return this.plugins.get(pluginName);
  }

  /**
   * 获取所有插件信息
   */
  listPlugins(): PluginInfo[] {
    return Array.from(this.pluginInfo.values());
  }

  /**
   * 获取已启用的插件
   */
  getEnabledPlugins(): TaskFlowPlugin[] {
    return Array.from(this.plugins.values()).filter(
      p => this.pluginInfo.get(p.manifest.name)?.status === 'enabled'
    );
  }

  /**
   * 获取钩子处理器
   */
  getHookHandlers(hookName: string): HookHandler[] {
    return Array.from(this.hookHandlers.get(hookName) || []);
  }

  /**
   * 检查插件是否启用
   */
  isEnabled(pluginName: string): boolean {
    return this.pluginInfo.get(pluginName)?.status === 'enabled';
  }
}

// 默认插件管理器实例
let defaultManager: PluginManager | null = null;

/**
 * 获取默认插件管理器
 */
export function getPluginManager(): PluginManager {
  if (!defaultManager) {
    defaultManager = new PluginManager();
  }
  return defaultManager;
}

export default PluginManager;
