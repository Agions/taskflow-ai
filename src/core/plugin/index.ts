/**
 * 插件模块导出
 */

export * from './types';
export * from './manager';
export * from './template';

import { PluginManager } from './manager';
import { TemplateManager } from './template';

export const pluginManager = new PluginManager();
export const templateManager = new TemplateManager();
