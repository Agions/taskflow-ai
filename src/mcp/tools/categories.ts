import { getLogger } from '../../utils/logger';
/**
 * 工具分类管理
 */

import { ToolCategory } from './types';
const logger = getLogger('mcp/tools/categories');


// 工具分类定义
export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'filesystem',
    name: 'FileSystem',
    description: '文件系统操作 - 读取、写入、搜索文件',
    tools: [],
    icon: '📁',
  },
  {
    id: 'http',
    name: 'HTTP',
    description: 'HTTP 请求工具 - API 调用、文件下载',
    tools: [],
    icon: '🌐',
  },
  {
    id: 'shell',
    name: 'Shell',
    description: 'Shell 命令执行',
    tools: [],
    icon: '💻',
  },
  {
    id: 'database',
    name: 'Database',
    description: '数据库操作 - SQLite 查询与管理',
    tools: [],
    icon: '🗄️',
  },
  {
    id: 'vector',
    name: 'Vector',
    description: '向量存储与语义搜索',
    tools: [],
    icon: '🔢',
  },
  {
    id: 'code',
    name: 'Code',
    description: '代码执行与分析',
    tools: [],
    icon: '⚡',
  },
  {
    id: 'git',
    name: 'Git',
    description: 'Git 版本控制操作',
    tools: [],
    icon: '📚',
  },
  {
    id: 'memory',
    name: 'Memory',
    description: '短期记忆与上下文管理',
    tools: [],
    icon: '🧠',
  },
  {
    id: 'notification',
    name: 'Notification',
    description: '消息通知 - Slack、Discord、Email',
    tools: [],
    icon: '🔔',
  },
];

// 分类映射
export const categoryMap: Record<string, string> = {
  fs: 'filesystem',
  file: 'filesystem',
  filesystem: 'filesystem',
  http: 'http',
  shell: 'shell',
  exec: 'shell',
  database: 'database',
  db: 'database',
  sqlite: 'database',
  vector: 'vector',
  embedding: 'vector',
  code: 'code',
  executor: 'code',
  git: 'git',
  version: 'git',
  memory: 'memory',
  context: 'memory',
  notification: 'notification',
  webhook: 'notification',
  slack: 'notification',
  discord: 'notification',
};

// 获取分类信息
export function getCategory(id: string): ToolCategory | undefined {
  return TOOL_CATEGORIES.find(c => c.id === id);
}

// 获取所有分类
export function getAllCategories(): ToolCategory[] {
  return TOOL_CATEGORIES;
}
