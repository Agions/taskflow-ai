import { getLogger } from '../../utils/logger';
/**
 * 向量存储类型定义
 */

import {
  DocumentChunk,
  RetrievedChunk,
  RetrievalOptions,
  FilterCondition,
  IndexStatus,
} from '../types';
const logger = getLogger('knowledge/storage/types');


/**
 * 存储的文档块（带时间戳）
 */
export interface StoredChunk extends DocumentChunk {
  timestamp: number;
}

/**
 * 搜索结果
 */
export interface SearchResult {
  results: RetrievedChunk[];
  latency: number;
}

/**
 * 向量存储管理器接口
 */
export interface IVectorStoreManager {
  initialize(): Promise<void>;
  addChunks(chunks: DocumentChunk[]): Promise<void>;
  deleteChunks(documentId: string): Promise<void>;
  search(query: string, options?: RetrievalOptions): Promise<RetrievedChunk[]>;
  hybridSearch(query: string, options?: RetrievalOptions): Promise<RetrievedChunk[]>;
  getStatus(): Promise<IndexStatus>;
  clear(): Promise<void>;
}
