/**
 * 插件系统核心类型定义
 */

export interface Plugin {
  /** 插件唯一标识 */
  id: string;
  /** 插件名称 */
  name: string;
  /** 版本 */
  version: string;
  /** 描述 */
  description?: string;
  /** 作者 */
  author?: string;
  /** 入口文件 */
  main: string;
  /** 依赖 */
  dependencies?: Record<string, string>;
  /** 生命周期钩子 */
  hooks?: PluginHooks;
  /** 命令 */
  commands?: PluginCommand[];
  /** 可视化 */
  visualizations?: PluginVisualization[];
  /** 配置 schema */
  configSchema?: Record<string, unknown>;
}

export interface PluginHooks {
  onInit?: (context: PluginContext) => void | Promise<void>;
  onLoad?: (plugin: Plugin) => void | Promise<void>;
  onUnload?: (plugin: Plugin) => void | Promise<void>;
  onTaskCreate?: (task: any) => any | Promise<any>;
  onTaskUpdate?: (task: any) => any | Promise<any>;
  onTaskComplete?: (task: any) => void | Promise<void>;
  onWorkflowExecute?: (workflow: any, context: any) => void | Promise<void>;
  onCommand?: (command: string, args: string[]) => string | void | Promise<string | void>;
}

export interface PluginCommand {
  name: string;
  description: string;
  action: (args: string[]) => void | Promise<void>;
}

export interface PluginVisualization {
  name: string;
  type: string;
  renderer: (data: any) => string;
}

export interface PluginContext {
  /** 应用根目录 */
  appRoot: string;
  /** 工作目录 */
  workspace: string;
  /** 配置 */
  config: Record<string, unknown>;
  /** 日志 */
  logger: any;
  /** 注册表 */
  registry: PluginRegistry;
}

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  repository?: string;
  keywords?: string[];
  license?: string;
}
