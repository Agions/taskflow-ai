/**
 * Knowledge Base Types Tests - TaskFlow AI v4.0
 */

import type {
  Document, DocumentMetadata, DocumentType, DocumentChunk, ChunkMetadata,
  RetrievalResult, RetrievedChunk, RetrievalOptions, FilterCondition,
  EmbeddingModel, VectorStore, VectorStoreConnection,
  KnowledgeBaseConfig, IndexStatus, QAResult, Source,
  KnowledgeStats, SyncConfig, KnowledgeContext,
} from '../types';

const ALL_DOC_TYPES: DocumentType[] = [
  'prd','code','markdown','api-doc','design','requirement','task','conversation','other',
];

describe('Knowledge Types', () => {
  describe('Document', () => {
    it('should create valid document', () => {
      const d: Document = {
        id: 'doc-1', content: 'Hello world',
        metadata: { title: 'Hello', source: 'test.md', type: 'markdown', tags: [] },
        createdAt: new Date(), updatedAt: new Date(),
      };
      expect(d.metadata.title).toBe('Hello');
    });

    it('should support embedding', () => {
      const d: Document = {
        id: 'doc-2', content: '',
        metadata: { title: '', source: '', type: 'code', tags: [] },
        embedding: [0.1, 0.2, 0.3],
        createdAt: new Date(), updatedAt: new Date(),
      };
      expect(d.embedding).toHaveLength(3);
    });
  });

  describe('DocumentMetadata', () => {
    it('should support optional fields', () => {
      const m: DocumentMetadata = {
        title: 'Test', source: 'file.ts', type: 'code', tags: ['js'],
        author: 'Agions', project: 'taskflow', version: '1.0',
        chunkIndex: 0, totalChunks: 5,
      };
      expect(m.totalChunks).toBe(5);
    });
  });

  describe('DocumentType', () => {
    it('should have 9 types', () => {
      expect(ALL_DOC_TYPES).toHaveLength(9);
    });
  });

  describe('DocumentChunk', () => {
    it('should create valid chunk', () => {
      const c: DocumentChunk = {
        id: 'ch-1', documentId: 'doc-1', content: 'part',
        embedding: [0.1], metadata: { title: '', source: '', type: 'markdown', tags: [] },
        index: 0,
      };
      expect(c.index).toBe(0);
    });

    it('should support chunkMetadata', () => {
      const c: DocumentChunk = {
        id: 'ch-2', documentId: 'doc-1', content: '',
        embedding: [], metadata: { title: '', source: '', type: 'markdown', tags: [] },
        index: 1,
        chunkMetadata: { start: 0, end: 100, overlap: 20, tokenCount: 50, title: '', source: '', type: 'markdown', tags: [] },
      };
      expect(c.chunkMetadata?.tokenCount).toBe(50);
    });
  });

  describe('RetrievalResult', () => {
    it('should create valid result', () => {
      const r: RetrievalResult = { chunks: [], query: 'test', totalResults: 0, latency: 12 };
      expect(r.latency).toBe(12);
    });
  });

  describe('RetrievedChunk', () => {
    it('should have score and distance', () => {
      const rc: RetrievedChunk = {
        chunk: {} as DocumentChunk, score: 0.95, distance: 0.05,
      };
      expect(rc.score).toBe(0.95);
    });
  });

  describe('RetrievalOptions', () => {
    it('should create options', () => {
      const o: RetrievalOptions = {
        topK: 5, threshold: 0.7, filters: [{ field: 'type', operator: 'eq', value: 'code' }],
        rerank: true, hybridSearch: true,
      };
      expect(o.topK).toBe(5);
    });
  });

  describe('FilterCondition', () => {
    it('should support 8 operators', () => {
      const ops: FilterCondition['operator'][] = ['eq','ne','gt','gte','lt','lte','in','contains'];
      expect(ops).toHaveLength(8);
    });
  });

  describe('EmbeddingModel', () => {
    it('should support 4 providers', () => {
      const p: EmbeddingModel['provider'][] = ['openai','local','huggingface','custom'];
      expect(p).toHaveLength(4);
    });
  });

  describe('VectorStore', () => {
    it('should support 5 types', () => {
      const types: VectorStore['type'][] = ['lancedb','chroma','pinecone','weaviate','qdrant'];
      expect(types).toHaveLength(5);
    });
  });

  describe('KnowledgeBaseConfig', () => {
    it('should create valid config', () => {
      const c: KnowledgeBaseConfig = {
        embeddingModel: { name: 'text-embedding-3-small', provider: 'openai', dimensions: 1536, maxTokens: 8192, batchSize: 100 },
        vectorStore: { name: 'local', type: 'lancedb', connection: { path: './vectors' } },
        chunkSize: 1000, chunkOverlap: 200, indexName: 'default', autoIndex: true,
      };
      expect(c.chunkSize).toBe(1000);
    });
  });

  describe('IndexStatus', () => {
    it('should create valid status', () => {
      const s: IndexStatus = { totalDocuments: 10, totalChunks: 50, indexedAt: new Date(), lastUpdated: new Date(), size: 1024000 };
      expect(s.size).toBe(1024000);
    });
  });

  describe('QAResult', () => {
    it('should create valid result', () => {
      const r: QAResult = {
        answer: 'Yes', sources: [], confidence: 0.92, latency: 45,
      };
      expect(r.confidence).toBe(0.92);
    });
  });

  describe('Source', () => {
    it('should create valid source', () => {
      const s: Source = {
        documentId: 'doc-1', title: 'Test', content: 'data', score: 0.9,
        metadata: { title: '', source: '', type: 'markdown', tags: [] },
      };
      expect(s.score).toBe(0.9);
    });
  });

  describe('KnowledgeStats', () => {
    it('should create valid stats', () => {
      const s: KnowledgeStats = {
        documents: 10, chunks: 50, size: 1024000, queries: 100, avgLatency: 12,
        topTags: ['code'], documentTypes: {} as Record<DocumentType, number>,
      };
      expect(s.avgLatency).toBe(12);
    });
  });

  describe('SyncConfig', () => {
    it('should create valid config', () => {
      const c: SyncConfig = {
        watch: true, interval: 60, includePatterns: ['**/*.md'], excludePatterns: ['node_modules/**'], autoIndex: true,
      };
      expect(c.interval).toBe(60);
    });
  });

  describe('KnowledgeContext', () => {
    it('should create valid context', () => {
      const c: KnowledgeContext = { relevantDocs: [], summary: 'Summary', suggestions: ['Try A'] };
      expect(c.suggestions).toHaveLength(1);
    });
  });
});

describe('Knowledge Modules', () => {
  it('KnowledgeRetrievalEngine should be importable', async () => {
    const mod = await import('../retrieval');
    expect(mod.KnowledgeRetrievalEngine).toBeDefined();
  });

  it('EmbeddingManager should be importable', async () => {
    const mod = await import('../embedding');
    expect(mod.EmbeddingManager).toBeDefined();
  });

  it('VectorStoreManager should be importable', async () => {
    const mod = await import('../storage');
    expect(mod.VectorStoreManager).toBeDefined();
  });

  it('DocumentChunker should be importable', async () => {
    const mod = await import('../retrieval/chunker');
    expect(mod.DocumentChunker).toBeDefined();
  });

  it('DocumentScanner should be importable', async () => {
    const mod = await import('../retrieval/scanner');
    expect(mod.DocumentScanner).toBeDefined();
  });
});
