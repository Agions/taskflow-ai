/**
 * Built-in Plugins
 */

import { TaskFlowPlugin, PluginManifest, PluginContext, HookContext } from './types';

/**
 * 日志插件 - 记录所有事件到控制台
 */
export class LoggerPlugin implements TaskFlowPlugin {
  manifest: PluginManifest = {
    name: '@taskflow/logger',
    version: '1.0.0',
    description: '内置日志插件，记录所有事件到控制台',
    author: 'TaskFlow Team',
    main: './built-in/logger.js',
    hooks: ['beforeWorkflowExecute', 'afterWorkflowComplete', 'onAIRequest', 'onAIResponse', 'onCacheHit'],
    permissions: [],
    tags: ['builtin', 'logging'],
  };

  private context!: PluginContext;

  async onLoad(context: PluginContext): Promise<void> {
    this.context = context;
    this.context.logger.info('LoggerPlugin loaded');
  }

  async onEnable(): Promise<void> {
    this.context.logger.info('LoggerPlugin enabled');
  }

  async onDisable(): Promise<void> {
    this.context.logger.info('LoggerPlugin disabled');
  }

  async onUnload(): Promise<void> {
    this.context.logger.info('LoggerPlugin unloaded');
  }

    hooks = {
    beforeWorkflowExecute: async (context: HookContext) => {
      this.context.logger.info('[Workflow] 开始执行', context.data);
      return { continue: true };
    },
    afterWorkflowComplete: async (context: HookContext) => {
      this.context.logger.info('[Workflow] 执行完成', context.data);
      return { continue: true };
    },
    onAIRequest: async (context: HookContext) => {
      this.context.logger.debug('[AI] 发送请求', context.data);
      return { continue: true };
    },
    onAIResponse: async (context: HookContext) => {
      this.context.logger.debug('[AI] 收到响应', context.data);
      return { continue: true };
    },
    onCacheHit: async (context: HookContext) => {
      this.context.logger.debug('[Cache] 缓存命中', context.data);
      return { continue: true };
    },
  };
}

/**
 * 存储插件 - 简单的内存存储实现
 */
export class StoragePlugin implements TaskFlowPlugin {
  manifest: PluginManifest = {
    name: '@taskflow/storage',
    version: '1.0.0',
    description: '内置存储插件，提供键值存储功能',
    author: 'TaskFlow Team',
    main: './built-in/storage.js',
    hooks: [],
    permissions: [],
    tags: ['builtin', 'storage'],
  };

  private context!: PluginContext;
  private store: Map<string, unknown> = new Map();

  async onLoad(context: PluginContext): Promise<void> {
    this.context = context;
    
    // 替换上下文中的存储实现
    this.context.storage = {
      get: async (key: string): Promise<unknown> => this.store.get(key),
      set: async (key: string, value: unknown): Promise<void> => { this.store.set(key, value); },
      delete: async (key: string): Promise<void> => { this.store.delete(key); },
      clear: async (): Promise<void> => { this.store.clear(); },
    };
    
    this.context.logger.info('StoragePlugin loaded');
  }

  async onEnable(): Promise<void> {
    this.context.logger.info('StoragePlugin enabled');
  }

  async onDisable(): Promise<void> {
    this.context.logger.info('StoragePlugin disabled');
  }

  async onUnload(): Promise<void> {
    this.store.clear();
    this.context.logger.info('StoragePlugin unloaded');
  }
}

/**
 * 获取所有内置插件
 */
export function getBuiltInPlugins(): TaskFlowPlugin[] {
  return [
    new LoggerPlugin(),
    new StoragePlugin(),
  ];
}
