/**
 * 插件相关类型
 */

import { TaskFlowConfig } from './config';
import { Project } from './project';
import { Task } from './task';
import { Logger } from './utils';

/**
 * 插件
 */
export interface Plugin {
  name: string;
  version: string;
  description: string;
  author: string;
  initialize: (config: PluginConfig) => Promise<void>;
  execute: (context: PluginContext) => Promise<PluginResult>;
  cleanup: () => Promise<void>;
}

/**
 * 插件配置
 */
export interface PluginConfig {
  name: string;
  version: string;
  enabled: boolean;
  settings: Record<string, any>;
}

/**
 * 插件上下文
 */
export interface PluginContext {
  project: Project;
  tasks: Task[];
  config: TaskFlowConfig;
  logger: Logger;
}

/**
 * 插件执行结果
 */
export interface PluginResult {
  success: boolean;
  data?: any;
  error?: string;
  warnings?: string[];
}
