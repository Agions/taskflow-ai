/**
 * RAG 知识库类型定义
 * TaskFlow AI v3.0 - RAG 知识库集成
 */

// 文档
export interface Document {
  id: string;
  content: string;
  metadata: DocumentMetadata;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentMetadata {
  title: string;
  source: string;
  type: DocumentType;
  tags: string[];
  author?: string;
  project?: string;
  version?: string;
  chunkIndex?: number;
  totalChunks?: number;
}

export type DocumentType =
  | 'prd'
  | 'code'
  | 'markdown'
  | 'api-doc'
  | 'design'
  | 'requirement'
  | 'task'
  | 'conversation'
  | 'other';

// 文档块
export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  embedding: number[];
  metadata: DocumentMetadata;
  index: number;
  chunkMetadata?: ChunkMetadata;
}

export interface ChunkMetadata {
  start: number;
  end: number;
  overlap: number;
  tokenCount: number;
}

// 检索结果
export interface RetrievalResult {
  chunks: RetrievedChunk[];
  query: string;
  totalResults: number;
  latency: number;
}

export interface RetrievedChunk {
  chunk: DocumentChunk;
  score: number;
  distance: number;
}

// 检索选项
export interface RetrievalOptions {
  topK?: number;
  threshold?: number;
  filters?: FilterCondition[];
  rerank?: boolean;
  hybridSearch?: boolean;
}

export interface FilterCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: any;
}

// 嵌入模型
export interface EmbeddingModel {
  name: string;
  provider: 'openai' | 'local' | 'huggingface' | 'custom';
  dimensions: number;
  maxTokens: number;
  batchSize: number;
}

// 向量存储
export interface VectorStore {
  name: string;
  type: 'lancedb' | 'chroma' | 'pinecone' | 'weaviate' | 'qdrant';
  connection: VectorStoreConnection;
}

export interface VectorStoreConnection {
  path?: string;
  url?: string;
  apiKey?: string;
  collection?: string;
}

// 知识库配置
export interface KnowledgeBaseConfig {
  embeddingModel: EmbeddingModel;
  vectorStore: VectorStore;
  chunkSize: number;
  chunkOverlap: number;
  indexName: string;
  autoIndex: boolean;
}

// 索引状态
export interface IndexStatus {
  totalDocuments: number;
  totalChunks: number;
  indexedAt: Date;
  lastUpdated: Date;
  size: number; // bytes
}

// 问答结果
export interface QAResult {
  answer: string;
  sources: Source[];
  confidence: number;
  latency: number;
}

export interface Source {
  documentId: string;
  title: string;
  content: string;
  score: number;
  metadata: DocumentMetadata;
}

// 知识库统计
export interface KnowledgeStats {
  documents: number;
  chunks: number;
  size: number;
  queries: number;
  avgLatency: number;
  topTags: string[];
  documentTypes: Record<DocumentType, number>;
}

// 同步配置
export interface SyncConfig {
  watch: boolean;
  interval: number; // minutes
  includePatterns: string[];
  excludePatterns: string[];
  autoIndex: boolean;
}

// 知识应用
export interface KnowledgeContext {
  relevantDocs: RetrievedChunk[];
  summary: string;
  suggestions: string[];
}
