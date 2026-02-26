/**
 * 知识检索引擎
 * RAG (Retrieval-Augmented Generation) 实现
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import {
  Document,
  DocumentChunk,
  ChunkMetadata,
  RetrievalResult,
  RetrievedChunk,
  RetrievalOptions,
  QAResult,
  Source,
  KnowledgeContext,
  KnowledgeStats
} from '../types';
import { EmbeddingManager } from '../embedding';
import { VectorStoreManager } from '../storage';

export class KnowledgeRetrievalEngine {
  private embeddingManager: EmbeddingManager;
  private vectorStore: VectorStoreManager;
  private chunkSize: number;
  private chunkOverlap: number;

  constructor(
    embeddingManager: EmbeddingManager,
    vectorStore: VectorStoreManager,
    chunkSize: number = 1000,
    chunkOverlap: number = 200
  ) {
    this.embeddingManager = embeddingManager;
    this.vectorStore = vectorStore;
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
  }

  /**
   * 初始化引擎
   */
  async initialize(): Promise<void> {
    await this.vectorStore.initialize();
    console.log('✅ Knowledge retrieval engine initialized');
  }

  /**
   * 索引文档
   */
  async indexDocument(doc: Document): Promise<void> {
    console.log(`📄 Indexing document: ${doc.metadata.title}`);

    const chunks = this.chunkDocument(doc);

    const chunksWithEmbedding = await this.embeddingManager.embedChunks(chunks);

    await this.vectorStore.addChunks(chunksWithEmbedding);

    console.log(`✅ Indexed ${chunks.length} chunks for ${doc.metadata.title}`);
  }

  /**
   * 删除文档索引
   */
  async deleteDocument(documentId: string): Promise<void> {
    await this.vectorStore.deleteChunks(documentId);
  }

  /**
   * 检索相关知识
   */
  async retrieve(
    query: string,
    options: RetrievalOptions = {}
  ): Promise<RetrievalResult> {
    const startTime = Date.now();

    const chunks = await this.vectorStore.hybridSearch(query, {
      topK: options.topK || 5,
      threshold: options.threshold || 0.6,
      filters: options.filters,
      rerank: options.rerank ?? true
    });

    const latency = Date.now() - startTime;

    return {
      chunks,
      query,
      totalResults: chunks.length,
      latency
    };
  }

  /**
   * 问答
   */
  async answer(
    question: string,
    options: RetrievalOptions = {}
  ): Promise<QAResult> {
    const startTime = Date.now();

    const retrievalResult = await this.retrieve(question, options);

    const context = this.buildContext(retrievalResult.chunks);

    const answer = this.generateAnswer(question, context);

    const sources = this.buildSources(retrievalResult.chunks);

    const confidence = this.calculateConfidence(retrievalResult.chunks);

    const latency = Date.now() - startTime;

    return {
      answer,
      sources,
      confidence,
      latency
    };
  }

  /**
   * 获取知识上下文
   */
  async getKnowledgeContext(
    query: string,
    options: RetrievalOptions = {}
  ): Promise<KnowledgeContext> {
    const result = await this.retrieve(query, options);

    return {
      relevantDocs: result.chunks,
      summary: this.generateSummary(result.chunks),
      suggestions: this.generateSuggestions(result.chunks, query)
    };
  }

  /**
   * 批量索引目录
   */
  async indexDirectory(
    dirPath: string,
    options?: {
      includePatterns?: string[];
      excludePatterns?: string[];
    }
  ): Promise<{ indexed: number; failed: number }> {
    const includePatterns = options?.includePatterns || ['**/*.md', '**/*.txt', '**/*.prd'];
    const excludePatterns = options?.excludePatterns || ['node_modules/**', '.git/**', 'dist/**'];

    let indexed = 0;
    let failed = 0;

    const files = await this.scanDirectory(dirPath, includePatterns, excludePatterns);

    for (const file of files) {
      try {
        const doc = await this.loadDocument(file);
        await this.indexDocument(doc);
        indexed++;
      } catch (error) {
        console.warn(`Failed to index ${file}:`, error);
        failed++;
      }
    }

    console.log(`✅ Indexed ${indexed} documents (${failed} failed)`);

    return { indexed, failed };
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<KnowledgeStats> {
    const status = await this.vectorStore.getStatus();

    const chunks = await this.getAllChunks();
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
      queries: 0, // 需要从日志统计
      avgLatency: 0, // 需要从日志统计
      topTags,
      documentTypes: documentTypes as any
    };
  }

  /**
   * 分块文档
   */
  private chunkDocument(doc: Document): DocumentChunk[] {
    const content = doc.content;
    const chunks: DocumentChunk[] = [];

    const paragraphs = content.split(/\n\n+/);
    let currentChunk = '';
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > this.chunkSize && currentChunk.length > 0) {
        chunks.push(this.createChunk(doc, currentChunk, chunkIndex++));

        const overlapStart = Math.max(0, currentChunk.length - this.chunkOverlap);
        currentChunk = currentChunk.slice(overlapStart) + '\n\n' + paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(this.createChunk(doc, currentChunk, chunkIndex));
    }

    return chunks;
  }

  /**
   * 创建文档块
   */
  private createChunk(doc: Document, content: string, index: number): DocumentChunk {
    return {
      id: `${doc.id}-chunk-${index}`,
      documentId: doc.id,
      content,
      embedding: [], // 稍后生成
      metadata: {
        ...doc.metadata,
        chunkIndex: index,
        totalChunks: 0 // 稍后更新
      },
      index,
      chunkMetadata: {
        start: 0,
        end: content.length,
        overlap: this.chunkOverlap,
        tokenCount: this.estimateTokenCount(content)
      }
    };
  }

  /**
   * 估计 token 数量
   */
  private estimateTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * 构建上下文
   */
  private buildContext(chunks: RetrievedChunk[]): string {
    return chunks
      .map((result, index) => `[${index + 1}] ${result.chunk.content}`)
      .join('\n\n');
  }

  /**
   * 生成答案（简化实现）
   */
  private generateAnswer(question: string, context: string): string {
    const relevantInfo = context.slice(0, 500);
    return `Based on the retrieved information:\n\n${relevantInfo}\n\n[Note: This is a simplified answer. In production, this would be generated by an AI model.]\n\nQuestion: ${question}`;
  }

  /**
   * 构建来源
   */
  private buildSources(chunks: RetrievedChunk[]): Source[] {
    const sourceMap = new Map<string, Source>();

    for (const result of chunks) {
      const docId = result.chunk.documentId;

      if (!sourceMap.has(docId)) {
        sourceMap.set(docId, {
          documentId: docId,
          title: (result.chunk.metadata as any).title || 'Unknown',
          content: result.chunk.content,
          score: result.score,
          metadata: result.chunk.metadata
        });
      }
    }

    return Array.from(sourceMap.values());
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(chunks: RetrievedChunk[]): number {
    if (chunks.length === 0) return 0;

    const avgScore = chunks.reduce((sum, c) => sum + c.score, 0) / chunks.length;
    return Math.min(avgScore * 1.2, 1); // 稍微提升置信度
  }

  /**
   * 生成摘要
   */
  private generateSummary(chunks: RetrievedChunk[]): string {
    if (chunks.length === 0) return 'No relevant information found.';

    const contents = chunks.map(c => c.chunk.content);
    const combined = contents.join(' ');

    return combined.length > 200
      ? combined.slice(0, 200) + '...'
      : combined;
  }

  /**
   * 生成建议
   */
  private generateSuggestions(chunks: RetrievedChunk[], query: string): string[] {
    const suggestions: string[] = [];

    const topics = new Set<string>();
    for (const chunk of chunks) {
      const words = chunk.chunk.content.split(/\s+/).filter(w => w.length > 5);
      for (const word of words.slice(0, 5)) {
        topics.add(word.toLowerCase());
      }
    }

    for (const topic of Array.from(topics).slice(0, 3)) {
      suggestions.push(`Tell me more about ${topic}`);
    }

    return suggestions;
  }

  /**
   * 扫描目录
   */
  private async scanDirectory(
    dirPath: string,
    includePatterns: string[],
    excludePatterns: string[]
  ): Promise<string[]> {
    const files: string[] = [];

    const scan = async (currentPath: string) => {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        if (excludePatterns.some(pattern => this.matchPattern(fullPath, pattern))) {
          continue;
        }

        if (entry.isDirectory()) {
          await scan(fullPath);
        } else {
          if (includePatterns.some(pattern => this.matchPattern(fullPath, pattern))) {
            files.push(fullPath);
          }
        }
      }
    };

    await scan(dirPath);
    return files;
  }

  /**
   * 匹配模式
   */
  private matchPattern(filePath: string, pattern: string): boolean {
    const regex = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.');

    return new RegExp(regex).test(filePath);
  }

  /**
   * 加载文档
   */
  private async loadDocument(filePath: string): Promise<Document> {
    const content = await fs.readFile(filePath, 'utf-8');
    const stats = await fs.stat(filePath);
    const fileName = path.basename(filePath);

    return {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      metadata: {
        title: fileName,
        source: filePath,
        type: this.detectDocumentType(filePath) as any,
        tags: [],
        author: 'unknown',
        project: path.basename(path.dirname(filePath))
      },
      createdAt: stats.birthtime,
      updatedAt: stats.mtime
    };
  }

  /**
   * 检测文档类型
   */
  private detectDocumentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const name = path.basename(filePath).toLowerCase();

    if (name.includes('.prd') || name.includes('prd')) return 'prd';
    if (ext === '.md') return 'markdown';
    if (ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx') return 'code';
    if (name.includes('api') || name.includes('openapi')) return 'api-doc';
    if (name.includes('design') || name.includes('ui')) return 'design';
    if (name.includes('requirement')) return 'requirement';

    return 'other';
  }

  /**
   * 获取所有块
   */
  private async getAllChunks(): Promise<DocumentChunk[]> {
    const status = await this.vectorStore.getStatus();
    return []; // 简化实现
  }
}

export default KnowledgeRetrievalEngine;
