/**
 * 向量存储管理器
 * 支持 LanceDB、Chroma 等向量数据库
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import {
  VectorStore,
  VectorStoreConnection,
  DocumentChunk,
  RetrievedChunk,
  RetrievalOptions,
  FilterCondition,
  IndexStatus
} from '../types';
import { EmbeddingManager } from '../embedding';


interface StoredChunk extends DocumentChunk {
  timestamp: number;
}

export class VectorStoreManager {
  private store: VectorStore;
  private embeddingManager: EmbeddingManager;
  private data: Map<string, StoredChunk> = new Map();
  private dataDir: string;

  constructor(
    store: VectorStore,
    embeddingManager: EmbeddingManager,
    dataDir?: string
  ) {
    this.store = store;
    this.embeddingManager = embeddingManager;
    this.dataDir = dataDir || path.join(process.cwd(), '.taskflow', 'vector-store');
  }

  /**
   * 初始化存储
   */
  async initialize(): Promise<void> {
    await fs.ensureDir(this.dataDir);

    await this.loadData();

    console.log(`✅ Vector store initialized: ${this.store.type}`);
  }

  /**
   * 添加文档块
   */
  async addChunks(chunks: DocumentChunk[]): Promise<void> {
    for (const chunk of chunks) {
      const storedChunk: StoredChunk = {
        ...chunk,
        timestamp: Date.now()
      };
      this.data.set(chunk.id, storedChunk);
    }

    await this.saveData();

    console.log(`✅ Added ${chunks.length} chunks to vector store`);
  }

  /**
   * 删除文档块
   */
  async deleteChunks(documentId: string): Promise<void> {
    let deleted = 0;

    for (const [id, chunk] of this.data) {
      if (chunk.documentId === documentId) {
        this.data.delete(id);
        deleted++;
      }
    }

    await this.saveData();

    console.log(`✅ Deleted ${deleted} chunks for document ${documentId}`);
  }

  /**
   * 相似度搜索
   */
  async search(
    query: string,
    options: RetrievalOptions = {}
  ): Promise<RetrievedChunk[]> {
    const startTime = Date.now();

    const {
      topK = 5,
      threshold = 0.7,
      filters = [],
      rerank = false
    } = options;

    const queryEmbedding = await this.embeddingManager.embed(query);

    let results: RetrievedChunk[] = [];

    for (const chunk of this.data.values()) {
      if (!this.matchesFilters(chunk, filters)) {
        continue;
      }

      const score = this.embeddingManager.cosineSimilarity(
        queryEmbedding,
        chunk.embedding
      );

      if (score >= threshold) {
        results.push({
          chunk,
          score,
          distance: 1 - score
        });
      }
    }

    results.sort((a, b) => b.score - a.score);

    results = results.slice(0, topK);

    if (rerank) {
      results = this.rerank(results, query);
    }

    const latency = Date.now() - startTime;
    console.log(`🔍 Search completed: ${results.length} results in ${latency}ms`);

    return results;
  }

  /**
   * 混合搜索（向量 + 关键词）
   */
  async hybridSearch(
    query: string,
    options: RetrievalOptions = {}
  ): Promise<RetrievedChunk[]> {
    const vectorResults = await this.search(query, options);

    const keywordResults = this.keywordSearch(query, options);

    const merged = this.mergeResults(vectorResults, keywordResults);

    return merged.slice(0, options.topK || 5);
  }

  /**
   * 获取索引状态
   */
  async getStatus(): Promise<IndexStatus> {
    const documents = new Set<string>();
    let totalChunks = 0;

    for (const chunk of this.data.values()) {
      documents.add(chunk.documentId);
      totalChunks++;
    }

    const dataFile = path.join(this.dataDir, `${this.store.connection.collection || 'default'}.json`);
    let size = 0;
    if (await fs.pathExists(dataFile)) {
      const stats = await fs.stat(dataFile);
      size = stats.size;
    }

    return {
      totalDocuments: documents.size,
      totalChunks,
      indexedAt: new Date(),
      lastUpdated: new Date(),
      size
    };
  }

  /**
   * 清空存储
   */
  async clear(): Promise<void> {
    this.data.clear();
    await this.saveData();
    console.log('🗑️  Vector store cleared');
  }

  /**
   * 关键词搜索
   */
  private keywordSearch(query: string, options: RetrievalOptions): RetrievedChunk[] {
    const keywords = query.toLowerCase().split(/\s+/);
    const results: RetrievedChunk[] = [];

    for (const chunk of this.data.values()) {
      const content = chunk.content.toLowerCase();
      let matches = 0;

      for (const keyword of keywords) {
        if (content.includes(keyword)) {
          matches++;
        }
      }

      if (matches > 0) {
        const score = matches / keywords.length;
        if (score >= (options.threshold || 0.3)) {
          results.push({
            chunk,
            score,
            distance: 1 - score
          });
        }
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, options.topK || 5);
  }

  /**
   * 合并结果
   */
  private mergeResults(
    vectorResults: RetrievedChunk[],
    keywordResults: RetrievedChunk[]
  ): RetrievedChunk[] {
    const merged = new Map<string, RetrievedChunk>();

    for (const result of vectorResults) {
      merged.set(result.chunk.id, {
        ...result,
        score: result.score * 0.7 // 向量权重 0.7
      });
    }

    for (const result of keywordResults) {
      const existing = merged.get(result.chunk.id);
      if (existing) {
        existing.score += result.score * 0.3; // 关键词权重 0.3
      } else {
        merged.set(result.chunk.id, {
          ...result,
          score: result.score * 0.3
        });
      }
    }

    return Array.from(merged.values()).sort((a, b) => b.score - a.score);
  }

  /**
   * 重排序
   */
  private rerank(results: RetrievedChunk[], query: string): RetrievedChunk[] {
    const keywords = query.toLowerCase().split(/\s+/);

    return results.map(result => {
      const content = result.chunk.content.toLowerCase();
      let keywordScore = 0;

      for (const keyword of keywords) {
        const count = (content.match(new RegExp(keyword, 'g')) || []).length;
        keywordScore += count;
      }

      const combinedScore = result.score * 0.8 + Math.min(keywordScore * 0.1, 0.2);

      return {
        ...result,
        score: combinedScore
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * 检查是否匹配过滤器
   */
  private matchesFilters(chunk: DocumentChunk, filters: FilterCondition[]): boolean {
    if (filters.length === 0) return true;

    return filters.every(filter => {
      const value = this.getFieldValue(chunk, filter.field);

      switch (filter.operator) {
        case 'eq':
          return value === filter.value;
        case 'ne':
          return value !== filter.value;
        case 'gt':
          return value > filter.value;
        case 'gte':
          return value >= filter.value;
        case 'lt':
          return value < filter.value;
        case 'lte':
          return value <= filter.value;
        case 'in':
          return Array.isArray(filter.value) && filter.value.includes(value);
        case 'contains':
          return String(value).includes(String(filter.value));
        default:
          return true;
      }
    });
  }

  /**
   * 获取字段值
   */
  private getFieldValue(chunk: DocumentChunk, field: string): any {
    const parts = field.split('.');
    let value: any = chunk;

    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * 保存数据
   */
  private async saveData(): Promise<void> {
    const dataFile = path.join(this.dataDir, `${this.store.connection.collection || 'default'}.json`);
    const data = Array.from(this.data.values());
    await fs.writeJson(dataFile, data, { spaces: 2 });
  }

  /**
   * 加载数据
   */
  private async loadData(): Promise<void> {
    const dataFile = path.join(this.dataDir, `${this.store.connection.collection || 'default'}.json`);

    if (await fs.pathExists(dataFile)) {
      try {
        const data: StoredChunk[] = await fs.readJson(dataFile);
        for (const chunk of data) {
          this.data.set(chunk.id, chunk);
        }
        console.log(`📚 Loaded ${data.length} chunks from storage`);
      } catch (error) {
        console.warn('Failed to load vector store data:', error);
      }
    }
  }
}

export default VectorStoreManager;
