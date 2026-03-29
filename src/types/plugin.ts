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

import { PluginConfig } from './config';

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
  data?: unknown;
  error?: string;
  warnings?: string[];
}
