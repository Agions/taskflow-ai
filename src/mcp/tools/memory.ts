import { getLogger } from '../../utils/logger';
/**
 * Memory 工具 - 短期记忆与上下文管理
 */

import { ToolDefinition } from './types';
const logger = getLogger('mcp/tools/memory');

// 内存存储
interface MemoryItem {
  key: string;
  value: unknown;
  createdAt: number;
  updatedAt: number;
  ttl?: number; // 过期时间(毫秒)
}

class MemoryStore {
  private store: Map<string, MemoryItem> = new Map();

  set(key: string, value: unknown, ttl?: number): void {
    const now = Date.now();
    this.store.set(key, {
      key,
      value,
      createdAt: this.store.get(key)?.createdAt || now,
      updatedAt: now,
      ttl,
    });
  }

  get(key: string): unknown | undefined {
    const item = this.store.get(key);
    if (!item) return undefined;

    // 检查过期
    if (item.ttl && Date.now() > item.createdAt + item.ttl) {
      this.store.delete(key);
      return undefined;
    }

    return item.value;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  keys(): string[] {
    return Array.from(this.store.keys());
  }

  size(): number {
    return this.store.size;
  }

  // 清理过期项
  cleanup(): number {
    const now = Date.now();
    let count = 0;
    for (const [key, item] of this.store) {
      if (item.ttl && now > item.createdAt + item.ttl) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }
}

// 全局内存存储
const globalMemory = new MemoryStore();
// 会话内存 (按 sessionId 隔离)
const sessionMemory = new Map<string, MemoryStore>();

function getSessionMemory(sessionId: string): MemoryStore {
  let mem = sessionMemory.get(sessionId);
  if (!mem) {
    mem = new MemoryStore();
    sessionMemory.set(sessionId, mem);
  }
  return mem;
}

export const memoryTools: ToolDefinition[] = [
  {
    name: 'memory_set',
    description: '存储数据到内存',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: '键名' },
        value: { type: 'string', description: '值 (JSON 字符串或纯文本)' },
        ttl: { type: 'number', description: '过期时间 (毫秒)' },
        session: { type: 'boolean', description: '是否仅当前会话有效', default: false },
      },
      required: ['key', 'value'],
    },
    handler: async input => {
      const key = input.key as string;
      const value = input.value as string;
      const ttl = input.ttl as number | undefined;
      const session = input.session as boolean;

      // 尝试解析 JSON
      let parsedValue: unknown = value;
      try {
        parsedValue = JSON.parse(value);
      } catch {
        // 保持为字符串
      }

      if (session) {
        // 从 context 获取 sessionId，这里简化处理
        const sessionId = 'default';
        getSessionMemory(sessionId).set(key, parsedValue, ttl);
      } else {
        globalMemory.set(key, parsedValue, ttl);
      }

      return { success: true, key, ttl };
    },
    category: 'memory',
    tags: ['memory', 'set', 'store'],
  },
  {
    name: 'memory_get',
    description: '从内存获取数据',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: '键名' },
        session: { type: 'boolean', description: '是否从会话内存读取', default: false },
      },
      required: ['key'],
    },
    handler: async input => {
      const key = input.key as string;
      const session = input.session as boolean;

      let value: unknown;
      if (session) {
        const sessionId = 'default';
        value = getSessionMemory(sessionId).get(key);
      } else {
        value = globalMemory.get(key);
      }

      return {
        success: value !== undefined,
        key,
        value: value !== undefined ? JSON.stringify(value) : null,
        exists: value !== undefined,
      };
    },
    category: 'memory',
    tags: ['memory', 'get', 'retrieve'],
  },
  {
    name: 'memory_delete',
    description: '从内存删除数据',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: '键名' },
        session: { type: 'boolean', description: '是否从会话内存删除', default: false },
      },
      required: ['key'],
    },
    handler: async input => {
      const key = input.key as string;
      const session = input.session as boolean;

      let deleted: boolean;
      if (session) {
        const sessionId = 'default';
        deleted = getSessionMemory(sessionId).delete(key);
      } else {
        deleted = globalMemory.delete(key);
      }

      return { success: deleted, key };
    },
    category: 'memory',
    tags: ['memory', 'delete', 'remove'],
  },
  {
    name: 'memory_list',
    description: '列出内存中的所有键',
    inputSchema: {
      type: 'object',
      properties: {
        session: { type: 'boolean', description: '是否列出会话内存', default: false },
      },
    },
    handler: async input => {
      const session = input.session as boolean;

      let keys: string[];
      if (session) {
        const sessionId = 'default';
        keys = getSessionMemory(sessionId).keys();
      } else {
        keys = globalMemory.keys();
      }

      return { keys, count: keys.length };
    },
    category: 'memory',
    tags: ['memory', 'list', 'keys'],
  },
  {
    name: 'memory_clear',
    description: '清空内存',
    inputSchema: {
      type: 'object',
      properties: {
        session: { type: 'boolean', description: '是否仅清空会话内存', default: false },
      },
    },
    handler: async input => {
      const session = input.session as boolean;

      if (session) {
        const sessionId = 'default';
        getSessionMemory(sessionId).clear();
      } else {
        globalMemory.clear();
      }

      return { success: true, session };
    },
    category: 'memory',
    tags: ['memory', 'clear', 'reset'],
  },
  {
    name: 'memory_stats',
    description: '获取内存统计',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      const globalSize = globalMemory.size();
      let sessionSize = 0;
      for (const mem of sessionMemory.values()) {
        sessionSize += mem.size();
      }

      return {
        global: globalSize,
        sessions: sessionMemory.size,
        total: globalSize + sessionSize,
      };
    },
    category: 'memory',
    tags: ['memory', 'stats', 'info'],
  },
];
