/**
 * 工具分类管理
 */

import { ToolCategory } from './types';

export const defaultCategories: ToolCategory[] = [
  {
    name: 'File Operations',
    description: '文件读写操作',
    tools: [],
  },
  {
    name: 'Shell Commands',
    description: 'Shell 命令执行',
    tools: [],
  },
  {
    name: 'Analysis',
    description: '项目分析工具',
    tools: [],
  },
  {
    name: 'Task Management',
    description: '任务管理工具',
    tools: [],
  },
  {
    name: 'FileSystem',
    description: '文件系统操作',
    tools: [],
  },
  {
    name: 'HTTP',
    description: 'HTTP 请求工具',
    tools: [],
  },
  {
    name: 'Custom',
    description: '自定义工具',
    tools: [],
  },
];

export const categoryMap: Record<string, string> = {
  'file': 'File Operations',
  'shell': 'Shell Commands',
  'analysis': 'Analysis',
  'task': 'Task Management',
  'filesystem': 'FileSystem',
  'http': 'HTTP',
  'custom': 'Custom',
};
