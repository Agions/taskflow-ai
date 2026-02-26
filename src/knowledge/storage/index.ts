/**
 * 向量存储管理器
 * 支持 LanceDB、Chroma 等向量数据库
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { VectorStore, DocumentChunk, RetrievedChunk, RetrievalOptions, IndexStatus } from '../types';
import { EmbeddingManager } from '../embedding';
import { StoredChunk } from './types';
import { DataPersistence } from './persistence';
import { SearchManager } from './search';

export class VectorStoreManager {
  private store: VectorStore;
  private embeddingManager: EmbeddingManager;
  private data: Map<string, StoredChunk> = new Map();
  private dataDir: string;
  private persistence: DataPersistence;
  private searchManager: SearchManager;

  constructor(store: VectorStore, embeddingManager: EmbeddingManager, dataDir?: string) {
    this.store = store;
    this.embeddingManager = embeddingManager;
    this.dataDir = dataDir || path.join(process.cwd(), '.taskflow', 'vector-store');
    this.persistence = new DataPersistence(this.dataDir, store.connection.collection || 'default');
    this.searchManager = new SearchManager(this.data, embeddingManager);
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
      const storedChunk: StoredChunk = { ...chunk, timestamp: Date.now() };
      this.data.set(chunk.id, storedChunk);
    }
    await this.persistence.saveData(this.data);
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

    await this.persistence.saveData(this.data);
    console.log(`✅ Deleted ${deleted} chunks for document ${documentId}`);
  }

  /**
   * 相似度搜索
   */
  async search(query: string, options: RetrievalOptions = {}): Promise<RetrievedChunk[]> {
    return this.searchManager.search(query, options);
  }

  /**
   * 混合搜索（向量 + 关键词）
   */
  async hybridSearch(query: string, options: RetrievalOptions = {}): Promise<RetrievedChunk[]> {
    return this.searchManager.hybridSearch(query, options);
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

    const size = await this.persistence.getDataSize();

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
    await this.persistence.deleteData();
    console.log('🗑️  Vector store cleared');
  }

  /**
   * 加载数据
   */
  private async loadData(): Promise<void> {
    const data = await this.persistence.loadData();
    for (const chunk of data) {
      this.data.set(chunk.id, chunk);
    }
    console.log(`📚 Loaded ${data.length} chunks from storage`);
  }
}

export default VectorStoreManager;
export * from './types';
export { DataPersistence } from './persistence';
export { SearchManager } from './search';
