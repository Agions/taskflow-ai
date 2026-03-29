import { getLogger } from '../../utils/logger';
const logger = getLogger('module');
/**
 * 知识检索引擎
 * RAG (Retrieval-Augmented Generation) 实现
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import {
  Document,
  RetrievalResult,
  RetrievalOptions,
  QAResult,
  KnowledgeContext,
  KnowledgeStats,
} from '../types';
import { EmbeddingManager } from '../embedding';
import { VectorStoreManager } from '../storage';
import { DocumentChunker } from './chunker';
import { DocumentScanner } from './scanner';
import { QAProcessor } from './qa';

export * from './chunker';
export * from './scanner';
export * from './qa';

export class KnowledgeRetrievalEngine {
  private chunker: DocumentChunker;
  private scanner: DocumentScanner;
  private qaProcessor: QAProcessor;

  constructor(
    private embeddingManager: EmbeddingManager,
    private vectorStore: VectorStoreManager,
    chunkSize: number = 1000,
    chunkOverlap: number = 200
  ) {
    this.chunker = new DocumentChunker(chunkSize, chunkOverlap);
    this.scanner = new DocumentScanner();
    this.qaProcessor = new QAProcessor();
  }

  async initialize(): Promise<void> {
    await this.vectorStore.initialize();
    console.log('✅ Knowledge retrieval engine initialized');
  }

  async indexDocument(doc: Document): Promise<void> {
    console.log(`📄 Indexing document: ${doc.metadata.title}`);

    const chunks = this.chunker.chunk(doc);
    const chunksWithEmbedding = await this.embeddingManager.embedChunks(chunks);
    await this.vectorStore.addChunks(chunksWithEmbedding);

    console.log(`✅ Indexed ${chunks.length} chunks for ${doc.metadata.title}`);
  }

  async deleteDocument(documentId: string): Promise<void> {
    await this.vectorStore.deleteChunks(documentId);
  }

  async retrieve(query: string, options: RetrievalOptions = {}): Promise<RetrievalResult> {
    const startTime = Date.now();

    const chunks = await this.vectorStore.hybridSearch(query, {
      topK: options.topK || 5,
      threshold: options.threshold || 0.6,
      filters: options.filters,
      rerank: options.rerank ?? true,
    });

    return {
      chunks,
      query,
      totalResults: chunks.length,
      latency: Date.now() - startTime,
    };
  }

  async answer(question: string, options: RetrievalOptions = {}): Promise<QAResult> {
    const retrievalResult = await this.retrieve(question, options);
    return this.qaProcessor.answer(question, retrievalResult.chunks);
  }

  async getKnowledgeContext(
    query: string,
    options: RetrievalOptions = {}
  ): Promise<KnowledgeContext> {
    const result = await this.retrieve(query, options);

    return {
      relevantDocs: result.chunks,
      summary: this.generateSummary(result.chunks),
      suggestions: this.generateSuggestions(result.chunks, query),
    };
  }

  async indexDirectory(
    dirPath: string,
    options?: { includePatterns?: string[]; excludePatterns?: string[] }
  ): Promise<{ indexed: number; failed: number }> {
    const includePatterns = options?.includePatterns || ['**/*.md', '**/*.txt', '**/*.prd'];
    const excludePatterns = options?.excludePatterns || ['node_modules/**', '.git/**', 'dist/**'];

    let indexed = 0;
    let failed = 0;

    const files = await this.scanner.scan(dirPath, includePatterns, excludePatterns);

    for (const file of files) {
      try {
        const doc = await this.loadDocument(file);
        await this.indexDocument(doc);
        indexed++;
      } catch (error) {
        logger.warn(`Failed to index ${file}:`, error);
        failed++;
      }
    }

    console.log(`✅ Indexed ${indexed} documents (${failed} failed)`);
    return { indexed, failed };
  }

  async getStats(): Promise<KnowledgeStats> {
    const status = await this.vectorStore.getStatus();
    const chunks = await (this.vectorStore as any).getAllChunks();

    const documentTypes: Record<string, number> = {};
    const tags: string[] = [];

    for (const chunk of chunks) {
      const type = chunk.metadata.type || 'other';
      documentTypes[type] = (documentTypes[type] || 0) + 1;
      tags.push(...(chunk.metadata.tags || []));
    }

    const tagCounts = new Map<string, number>();
    for (const tag of tags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }

    const topTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);

    return {
      documents: status.totalDocuments,
      chunks: status.totalChunks,
      size: status.size,
      queries: 0,
      avgLatency: 0,
      topTags,
      documentTypes: documentTypes as any,
    };
  }

  private async loadDocument(filePath: string): Promise<Document> {
    const fs = await import('fs-extra');
    const content = await fs.readFile(filePath, 'utf-8');
    const stats = await fs.stat(filePath);

    return {
      id: path.basename(filePath, path.extname(filePath)),
      content,
      metadata: {
        title: path.basename(filePath),
        source: filePath,
        type: path.extname(filePath).slice(1) as import('../types').DocumentType,
        tags: [],
      },
      createdAt: stats.birthtime,
      updatedAt: stats.mtime,
    };
  }

  private generateSummary(chunks: any[]): string {
    if (chunks.length === 0) return 'No relevant information found.';
    const contents = chunks.map(c => c.chunk.content);
    return contents.slice(0, 3).join(' ').slice(0, 500) + '...';
  }

  private generateSuggestions(chunks: any[], query: string): string[] {
    const suggestions: string[] = [];
    const keywords = query.toLowerCase().split(' ');

    for (const chunk of chunks.slice(0, 3)) {
      const content = chunk.chunk.content.toLowerCase();
      for (const keyword of keywords) {
        if (content.includes(keyword) && !suggestions.includes(keyword)) {
          suggestions.push(keyword);
        }
      }
    }

    return suggestions.slice(0, 5);
  }
}

export default KnowledgeRetrievalEngine;
