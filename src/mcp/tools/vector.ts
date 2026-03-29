import { getLogger } from '../../utils/logger';
/**
 * 向量存储工具 - 内存向量库
 */

import { ToolDefinition } from './types';
const logger = getLogger('mcp/tools/vector');


// 内存向量存储
interface VectorEntry {
  id: string;
  vector: number[];
  text: string;
  metadata: Record<string, any>;
}

class InMemoryVectorStore {
  private vectors: Map<string, VectorEntry> = new Map();
  private dimension: number = 1536; // 默认维度 (OpenAI ada-002)

  setDimension(dim: number) {
    this.dimension = dim;
  }

  add(entry: VectorEntry) {
    if (entry.vector.length !== this.dimension) {
      throw new Error(`向量维度不匹配: 期望 ${this.dimension}, 实际 ${entry.vector.length}`);
    }
    this.vectors.set(entry.id, entry);
    return { success: true, id: entry.id };
  }

  search(query: number[], k: number = 5, filter?: Record<string, any>): VectorEntry[] {
    // 计算余弦相似度
    const scores: Array<{ id: string; score: number; entry: VectorEntry }> = [];

    for (const [id, entry] of this.vectors) {
      // 应用过滤
      if (filter) {
        let match = true;
        for (const [key, value] of Object.entries(filter)) {
          if (entry.metadata[key] !== value) {
            match = false;
            break;
          }
        }
        if (!match) continue;
      }

      const score = this.cosineSimilarity(query, entry.vector);
      scores.push({ id, score, entry });
    }

    // 排序并返回 top-k
    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, k).map(s => s.entry);
  }

  delete(id: string) {
    return this.vectors.delete(id);
  }

  get(id: string) {
    return this.vectors.get(id);
  }

  count() {
    return this.vectors.size;
  }

  clear() {
    this.vectors.clear();
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }
}

// 全局向量存储实例
const vectorStore = new InMemoryVectorStore();

export const vectorTools: ToolDefinition[] = [
  {
    name: 'vector_init',
    description: '初始化向量存储',
    inputSchema: {
      type: 'object',
      properties: {
        dimension: { type: 'number', description: '向量维度 (默认 1536)' },
      },
    },
    handler: async input => {
      const dimension = (input.dimension as number) || 1536;
      vectorStore.setDimension(dimension);
      return { success: true, dimension };
    },
    category: 'vector',
    tags: ['vector', 'embedding', 'init'],
  },
  {
    name: 'vector_add',
    description: '添加向量到存储',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: '唯一ID' },
        vector: {
          type: 'array',
          description: '向量数组',
          items: { type: 'number' },
        },
        text: { type: 'string', description: '原始文本' },
        metadata: { type: 'object', description: '元数据' },
      },
      required: ['id', 'vector', 'text'],
    },
    handler: async input => {
      const result = vectorStore.add({
        id: input.id as string,
        vector: input.vector as number[],
        text: input.text as string,
        metadata: (input.metadata as Record<string, any>) || {},
      });
      return result;
    },
    category: 'vector',
    tags: ['vector', 'embedding', 'add'],
  },
  {
    name: 'vector_search',
    description: '相似向量搜索',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'array',
          description: '查询向量',
          items: { type: 'number' },
        },
        k: { type: 'number', description: '返回数量 (默认 5)' },
        filter: { type: 'object', description: '元数据过滤' },
        includeMetadata: { type: 'boolean', description: '包含元数据' },
      },
      required: ['query'],
    },
    handler: async input => {
      const k = (input.k as number) || 5;
      const filter = input.filter as Record<string, any> | undefined;
      const includeMetadata = (input.includeMetadata as boolean) ?? true;

      const results = vectorStore.search(input.query as number[], k, filter);

      return {
        success: true,
        results: results.map(r => ({
          id: r.id,
          text: r.text,
          metadata: includeMetadata ? r.metadata : undefined,
        })),
      };
    },
    category: 'vector',
    tags: ['vector', 'embedding', 'search', 'similarity'],
  },
  {
    name: 'vector_get',
    description: '获取指定向量',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: '向量 ID' },
      },
      required: ['id'],
    },
    handler: async input => {
      const entry = vectorStore.get(input.id as string);
      if (!entry) {
        return { success: false, error: 'Not found' };
      }
      return {
        success: true,
        id: entry.id,
        text: entry.text,
        metadata: entry.metadata,
      };
    },
    category: 'vector',
    tags: ['vector', 'get'],
  },
  {
    name: 'vector_delete',
    description: '删除向量',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: '向量 ID' },
      },
      required: ['id'],
    },
    handler: async input => {
      const deleted = vectorStore.delete(input.id as string);
      return { success: deleted };
    },
    category: 'vector',
    tags: ['vector', 'delete'],
  },
  {
    name: 'vector_stats',
    description: '获取向量存储统计',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      return {
        success: true,
        count: vectorStore.count(),
      };
    },
    category: 'vector',
    tags: ['vector', 'stats'],
  },
  {
    name: 'vector_clear',
    description: '清空向量存储',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      vectorStore.clear();
      return { success: true };
    },
    category: 'vector',
    tags: ['vector', 'clear'],
  },
];
