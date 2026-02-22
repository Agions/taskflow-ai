/**
 * 插件加载器
 * 负责插件的发现、加载、卸载
 */

import path from 'path';
import fs from 'fs-extra';
import { Logger } from '../../utils/logger';
import { Plugin, PluginContext, PluginHooks } from './types';

export interface PluginLoadResult {
  success: boolean;
  plugin?: Plugin;
  error?: string;
}

/**
 * 插件管理器
 */
export class PluginManager {
  private logger: Logger;
  private plugins: Map<string, Plugin> = new Map();
  private hooks: Map<string, Set<Function>> = new Map();
  private context: PluginContext;

  constructor(private pluginDir: string = './plugins') {
    this.logger = Logger.getInstance('PluginManager');
    this.context = this.createContext();
  }

  /**
   * 创建插件上下文
   */
  private createContext(): PluginContext {
    return {
      appRoot: process.cwd(),
      workspace: process.cwd(),
      config: {},
      logger: this.logger,
      registry: this,
    };
  }

  /**
   * 加载所有插件
   */
  async loadAll(): Promise<void> {
    this.logger.info(`加载插件目录: ${this.pluginDir}`);

    if (!(await fs.pathExists(this.pluginDir))) {
      this.logger.warn('插件目录不存在');
      return;
    }

    const entries = await fs.readdir(this.pluginDir);
    const pluginDirs = entries.filter(e => !e.startsWith('.'));

    for (const dir of pluginDirs) {
      await this.load(dir);
    }

    this.logger.info(`已加载 ${this.plugins.size} 个插件`);
  }

  /**
   * 加载单个插件
   */
  async load(pluginId: string): Promise<PluginLoadResult> {
    try {
      const pluginPath = path.resolve(this.pluginDir, pluginId);
      const packageJson = await this.loadPackageJson(pluginPath);

      if (!packageJson) {
        return { success: false, error: '无效的插件: 缺少 package.json' };
      }

      // 检查是否是 TaskFlow 插件
      if (!packageJson.keywords?.includes('taskflow-plugin')) {
        return { success: false, error: '不是 TaskFlow 插件' };
      }

      // 加载插件入口
      const mainPath = path.join(pluginPath, packageJson.main || 'index.js');
      if (!(await fs.pathExists(mainPath))) {
        return { success: false, error: '插件入口文件不存在' };
      }

      // 动态加载插件
      const plugin = await this.importPlugin(pluginId, packageJson, mainPath);

      // 注册插件
      this.plugins.set(pluginId, plugin);

      // 注册钩子
      this.registerHooks(plugin);

      // 调用 onLoad 钩子
      if (plugin.hooks?.onLoad) {
        await plugin.hooks.onLoad(plugin);
      }

      this.logger.info(`插件已加载: ${plugin.name} v${plugin.version}`);

      return { success: true, plugin };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`插件加载失败: ${pluginId}`, error);
      return { success: false, error: message };
    }
  }

  /**
   * 卸载插件
   */
  async unload(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return false;
    }

    try {
      // 调用 onUnload 钩子
      if (plugin.hooks?.onUnload) {
        await plugin.hooks.onUnload(plugin);
      }

      // 注销钩子
      this.unregisterHooks(plugin);

      // 移除插件
      this.plugins.delete(pluginId);

      this.logger.info(`插件已卸载: ${plugin.name}`);
      return true;
    } catch (error) {
      this.logger.error(`插件卸载失败: ${pluginId}`, error);
      return false;
    }
  }

  /**
   * 加载 package.json
   */
  private async loadPackageJson(pluginPath: string): Promise<any | null> {
    const packageJsonPath = path.join(pluginPath, 'package.json');
    
    if (!(await fs.pathExists(packageJsonPath))) {
      return null;
    }

    const content = await fs.readFile(packageJsonPath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * 导入插件
   */
  private async importPlugin(
    pluginId: string,
    packageJson: any,
    mainPath: string
  ): Promise<Plugin> {
    // 简单实现 - 实际需要动态 require
    const plugin: Plugin = {
      id: pluginId,
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      author: packageJson.author,
      main: packageJson.main,
      dependencies: packageJson.dependencies,
    };

    return plugin;
  }

  /**
   * 注册钩子
   */
  private registerHooks(plugin: Plugin): void {
    const hookNames = [
      'onInit',
      'onLoad',
      'onUnload',
      'onTaskCreate',
      'onTaskUpdate',
      'onTaskComplete',
      'onWorkflowExecute',
      'onCommand',
    ];

    for (const name of hookNames) {
      if (plugin.hooks && typeof (plugin.hooks as any)[name] === 'function') {
        if (!this.hooks.has(name)) {
          this.hooks.set(name, new Set());
        }
        this.hooks.get(name)!.add((plugin.hooks as any)[name]);
      }
    }
  }

  /**
   * 注销钩子
   */
  private unregisterHooks(plugin: Plugin): void {
    const hookNames = [
      'onInit',
      'onLoad',
      'onUnload',
      'onTaskCreate',
      'onTaskUpdate',
      'onTaskComplete',
      'onWorkflowExecute',
      'onCommand',
    ];

    for (const name of hookNames) {
      if (plugin.hooks && typeof (plugin.hooks as any)[name] === 'function') {
        this.hooks.get(name)?.delete((plugin.hooks as any)[name]);
      }
    }
  }

  /**
   * 触发钩子
   */
  async triggerHook<T>(hookName: string, ...args: any[]): Promise<T[]> {
    const handlers = this.hooks.get(hookName);
    if (!handlers) {
      return [];
    }

    const results: T[] = [];
    for (const handler of handlers) {
      try {
        const result = await handler(...args);
        if (result !== undefined) {
          results.push(result);
        }
      } catch (error) {
        this.logger.error(`钩子执行失败: ${hookName}`, error);
      }
    }

    return results;
  }

  /**
   * 获取插件
   */
  get(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * 列出所有插件
   */
  list(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 获取插件数量
   */
  count(): number {
    return this.plugins.size;
  }

  /**
   * 初始化所有插件
   */
  async initialize(): Promise<void> {
    await this.triggerHook('onInit', this.context);
  }
}

export default PluginManager;
