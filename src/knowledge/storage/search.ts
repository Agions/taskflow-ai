import { getLogger } from '../../utils/logger';
/**
 * 向量存储搜索
 */

import { DocumentChunk, RetrievedChunk, RetrievalOptions, FilterCondition } from '../types';
import { EmbeddingManager } from '../embedding';
import { StoredChunk } from './types';
const logger = getLogger('knowledge/storage/search');


/**
 * 搜索管理器
 */
export class SearchManager {
  constructor(
    private data: Map<string, StoredChunk>,
    private embeddingManager: EmbeddingManager
  ) {}

  /**
   * 相似度搜索
   */
  async search(query: string, options: RetrievalOptions = {}): Promise<RetrievedChunk[]> {
    const startTime = Date.now();

    const { topK = 5, threshold = 0.7, filters = [], rerank = false } = options;

    const queryEmbedding = await this.embeddingManager.embed(query);
    let results: RetrievedChunk[] = [];

    for (const chunk of this.data.values()) {
      if (!this.matchesFilters(chunk, filters)) {
        continue;
      }

      const score = this.embeddingManager.cosineSimilarity(queryEmbedding, chunk.embedding);

      if (score >= threshold) {
        results.push({ chunk, score, distance: 1 - score });
      }
    }

    results.sort((a, b) => b.score - a.score);
    results = results.slice(0, topK);

    if (rerank) {
      results = this.rerank(results, query);
    }

    const latency = Date.now() - startTime;
    logger.info(`🔍 Search completed: ${results.length} results in ${latency}ms`);

    return results;
  }

  /**
   * 关键词搜索
   */
  keywordSearch(query: string, options: RetrievalOptions): RetrievedChunk[] {
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
          results.push({ chunk, score, distance: 1 - score });
        }
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, options.topK || 5);
  }

  /**
   * 混合搜索（向量 + 关键词）
   */
  async hybridSearch(query: string, options: RetrievalOptions = {}): Promise<RetrievedChunk[]> {
    const vectorResults = await this.search(query, options);
    const keywordResults = this.keywordSearch(query, options);
    const merged = this.mergeResults(vectorResults, keywordResults);
    return merged.slice(0, options.topK || 5);
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
      merged.set(result.chunk.id, { ...result, score: result.score * 0.7 });
    }

    for (const result of keywordResults) {
      const existing = merged.get(result.chunk.id);
      if (existing) {
        existing.score += result.score * 0.3;
      } else {
        merged.set(result.chunk.id, { ...result, score: result.score * 0.3 });
      }
    }

    return Array.from(merged.values()).sort((a, b) => b.score - a.score);
  }

  /**
   * 重排序
   */
  private rerank(results: RetrievedChunk[], query: string): RetrievedChunk[] {
    const keywords = query.toLowerCase().split(/\s+/);

    return results
      .map(result => {
        const content = result.chunk.content.toLowerCase();
        let keywordScore = 0;

        for (const keyword of keywords) {
          const count = (content.match(new RegExp(keyword, 'g')) || []).length;
          keywordScore += count;
        }

        const combinedScore = result.score * 0.8 + Math.min(keywordScore * 0.1, 0.2);
        return { ...result, score: combinedScore };
      })
      .sort((a, b) => b.score - a.score);
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
  private getFieldValue(chunk: DocumentChunk, field: string): unknown {
    const parts = field.split('.');
    let value: unknown = chunk;

    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }
}
