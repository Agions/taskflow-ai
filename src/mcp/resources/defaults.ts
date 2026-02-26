/**
 * 默认资源定义
 */

import { MCPResource } from './types';

export const defaultResources: MCPResource[] = [
  {
    uri: '/tasks',
    name: 'tasks',
    description: '项目任务列表',
    mimeType: 'application/json',
    metadata: { tags: ['tasks', 'project', 'management'] },
  },
  {
    uri: '/projects',
    name: 'projects',
    description: '项目信息',
    mimeType: 'application/json',
    metadata: { tags: ['projects', 'metadata'] },
  },
  {
    uri: '/config',
    name: 'config',
    description: '项目配置',
    mimeType: 'application/json',
    metadata: { tags: ['config', 'settings'] },
  },
  {
    uri: '/models',
    name: 'models',
    description: 'AI模型配置',
    mimeType: 'application/json',
    metadata: { tags: ['ai', 'models', 'config'] },
  },
  {
    uri: '/status',
    name: 'status',
    description: '系统状态信息',
    mimeType: 'application/json',
    metadata: { tags: ['status', 'health', 'system'] },
  },
  {
    uri: '/analytics',
    name: 'analytics',
    description: '项目分析数据',
    mimeType: 'application/json',
    metadata: { tags: ['analytics', 'statistics', 'insights'] },
  },
];
