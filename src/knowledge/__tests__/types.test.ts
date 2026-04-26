/**
 * Knowledge Base Types Tests
 * TaskFlow AI v4.0.1
 *
 * Tests for RAG (Retrieval-Augmented Generation) knowledge base types including
 * documents, embeddings, retrieval, and vector store management.
 */

import {
  Document,
  DocumentMetadata,
  DocumentType,
  DocumentChunk,
  ChunkMetadata,
  RetrievalResult,
  RetrievedChunk,
  RetrievalOptions,
  FilterCondition,
  EmbeddingModel,
  VectorStore,
  VectorStoreConnection,
  KnowledgeBaseConfig,
  IndexStatus,
  QAResult,
  Source,
  KnowledgeStats,
  SyncConfig,
  KnowledgeContext,
} from '../types';

describe('Document Types', () => {
  describe('DocumentType', () => {
    it('should support all document type values', () => {
      const types: DocumentType[] = [
        'prd',
        'code',
        'markdown',
        'api-doc',
        'design',
        'requirement',
        'task',
        'conversation',
        'other',
      ];
      expect(types).toHaveLength(9);
    });

    it('should create single document type', () => {
      const type: DocumentType = 'prd';
      expect(type).toBe('prd');
    });
  });

  describe('DocumentMetadata', () => {
    it('should create complete metadata', () => {
      const metadata: DocumentMetadata = {
        title: 'API Authentication PRD',
        source: 'docs/auth.md',
        type: 'prd',
        tags: ['security', 'authentication'],
        author: 'Agions',
        project: 'TaskFlow AI',
        version: '1.0.0',
        chunkIndex: 0,
        totalChunks: 5,
      };

      expect(metadata.title).toBe('API Authentication PRD');
      expect(metadata.type).toBe('prd');
      expect(metadata.tags).toContain('security');
    });

    it('should create minimal metadata', () => {
      const metadata: DocumentMetadata = {
        title: 'Simple Document',
        source: 'test.txt',
        type: 'other',
        tags: [],
      };

      expect(metadata.title).toBe('Simple Document');
    });
  });

  describe('Document', () => {
    it('should create complete document', () => {
      const metadata: DocumentMetadata = {
        title: 'Authentication Guide',
        source: 'docs/auth.md',
        type: 'code',
        tags: ['security', 'api'],
      };

      const doc: Document = {
        id: 'doc-1',
        content: 'This is a document about authentication methods...',
        metadata,
        embedding: [0.1, 0.2, 0.3],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-04-01'),
      };

      expect(doc.id).toBe('doc-1');
      expect(doc.embedding).toBeDefined();
      expect(doc.embedding).toHaveLength(3);
    });

    it('should create document without embedding', () => {
      const metadata: DocumentMetadata = {
        title: 'Test Document',
        source: 'test.md',
        type: 'markdown',
        tags: [],
      };

      const doc: Document = {
        id: 'doc-2',
        content: 'Content',
        metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(doc.embedding).toBeUndefined();
    });
  });
});

describe('Document Chunking', () => {
  describe('ChunkMetadata', () => {
    it('should create chunk metadata', () => {
      const metadata: ChunkMetadata = {
        start: 0,
        end: 500,
        overlap: 50,
        tokenCount: 128,
        title: 'Authentication Section',
        source: 'docs/auth.md',
        type: 'code',
        tags: ['security'],
        chunkIndex: 0,
        startPosition: 0,
        endPosition: 500,
        totalChunks: 10,
      };

      expect(metadata.tokenCount).toBe(128);
      expect(metadata.overlap).toBe(50);
      expect(metadata.chunkIndex).toBe(0);
    });
  });

  describe('DocumentChunk', () => {
    it('should create complete chunk', () => {
      const chunkMetadata: DocumentMetadata = {
        title: 'API Section',
        source: 'docs/api.md',
        type: 'api-doc',
        tags: ['api', 'rest'],
      };

      const chunkExtraMetadata: ChunkMetadata = {
        start: 100,
        end: 600,
        overlap: 50,
        tokenCount: 150,
        title: 'Authentication Block',
        source: 'docs/api.md',
        type: 'api-doc',
        tags: ['auth'],
      };

      const chunk: DocumentChunk = {
        id: 'chunk-1',
        documentId: 'doc-1',
        content: 'This chunk covers authentication in REST API...',
        embedding: [0.5, 0.6, 0.7],
        metadata: chunkMetadata,
        index: 0,
        chunkMetadata: chunkExtraMetadata,
      };

      expect(chunk.documentId).toBe('doc-1');
      expect(chunk.index).toBe(0);
      expect(chunk.embedding).toHaveLength(3);
    });
  });
});

describe('Retrieval System', () => {
  describe('FilterCondition', () => {
    it('should support all operators', () => {
      const operators: FilterCondition['operator'][] = [
        'eq',
        'ne',
        'gt',
        'gte',
        'lt',
        'lte',
        'in',
        'contains',
      ];
      expect(operators).toHaveLength(8);
    });

    it('should create equality filter', () => {
      const filter: FilterCondition = {
        field: 'type',
        operator: 'eq',
        value: 'prd',
      };

      expect(filter.operator).toBe('eq');
    });

    it('should create contains filter', () => {
      const filter: FilterCondition = {
        field: 'tags',
        operator: 'contains',
        value: 'security',
      };

      expect(filter.operator).toBe('contains');
    });

    it('should create in operator filter', () => {
      const filter: FilterCondition = {
        field: 'type',
        operator: 'in',
        value: ['prd', 'code', 'design'],
      };

      expect(filter.operator).toBe('in');
    });
  });

  describe('RetrievalOptions', () => {
    it('should create complete retrieval options', () => {
      const filters: FilterCondition[] = [
        {
          field: 'type',
          operator: 'eq',
          value: 'prd',
        },
      ];

      const options: RetrievalOptions = {
        topK: 10,
        threshold: 0.7,
        filters,
        rerank: true,
        hybridSearch: true,
      };

      expect(options.topK).toBe(10);
      expect(options.threshold).toBe(0.7);
      expect(options.filters).toHaveLength(1);
      expect(options.hybridSearch).toBe(true);
    });

    it('should create minimal options', () => {
      const options: RetrievalOptions = {
        topK: 5,
      };

      expect(options.topK).toBe(5);
    });
  });

  describe('RetrievedChunk', () => {
    it('should create retrieved chunk with scores', () => {
      const metadata: DocumentMetadata = {
        title: 'API Doc',
        source: 'docs.md',
        type: 'api-doc',
        tags: [],
      };

      const chunk: DocumentChunk = {
        id: 'chunk-1',
        documentId: 'doc-1',
        content: 'Content',
        embedding: [0.1, 0.2, 0.3],
        metadata,
        index: 0,
      };

      const retrieved: RetrievedChunk = {
        chunk,
        score: 0.95,
        distance: 0.05,
      };

      expect(retrieved.score).toBe(0.95);
      expect(retrieved.distance).toBe(0.05);
    });
  });

  describe('RetrievalResult', () => {
    it('should create retrieval result', () => {
      const metadata: DocumentMetadata = {
        title: 'Test',
        source: 'test.md',
        type: 'code',
        tags: [],
      };

      const chunk: DocumentChunk = {
        id: 'c-1',
        documentId: 'd-1',
        content: 'Content',
        embedding: [0.1, 0.2],
        metadata,
        index: 0,
      };

      const retrieved: RetrievedChunk = {
        chunk,
        score: 0.9,
        distance: 0.1,
      };

      const result: RetrievalResult = {
        chunks: [retrieved],
        query: 'authentication methods',
        totalResults: 50,
        latency: 150,
      };

      expect(result.chunks).toHaveLength(1);
      expect(result.query).toBe('authentication methods');
      expect(result.totalResults).toBe(50);
      expect(result.latency).toBe(150);
    });
  });
});

describe('Embedding and Vector Store', () => {
  describe('EmbeddingModel', () => {
    it('should create OpenAI embedding model', () => {
      const model: EmbeddingModel = {
        name: 'text-embedding-3-small',
        provider: 'openai',
        dimensions: 1536,
        maxTokens: 8191,
        batchSize: 100,
      };

      expect(model.provider).toBe('openai');
      expect(model.dimensions).toBe(1536);
    });

    it('should create local embedding model', () => {
      const model: EmbeddingModel = {
        name: 'all-MiniLM-L6-v2',
        provider: 'local',
        dimensions: 384,
        maxTokens: 512,
        batchSize: 32,
      };

      expect(model.provider).toBe('local');
    });

    it('should create HuggingFace model', () => {
      const model: EmbeddingModel = {
        name: 'sentence-transformers/all-mpnet-base-v2',
        provider: 'huggingface',
        dimensions: 768,
        maxTokens: 512,
        batchSize: 64,
      };

      expect(model.provider).toBe('huggingface');
    });
  });

  describe('VectorStoreConnection', () => {
    it('should create local connection', () => {
      const connection: VectorStoreConnection = {
        path: '/data/vector-store',
      };

      expect(connection.path).toBe('/data/vector-store');
    });

    it('should create remote connection', () => {
      const connection: VectorStoreConnection = {
        url: 'https://api.pinecone.io',
        apiKey: 'sk-xxx',
        collection: 'knowledge-base',
      };

      expect(connection.url).toBe('https://api.pinecone.io');
      expect(connection.apiKey).toBe('sk-xxx');
    });
  });

  describe('VectorStore', () => {
    it('should create LanceDB store', () => {
      const connection: VectorStoreConnection = {
        path: '/data/lancedb',
      };

      const store: VectorStore = {
        name: 'lancedb-store',
        type: 'lancedb',
        connection,
      };

      expect(store.type).toBe('lancedb');
    });

    it('should support all vector store types', () => {
      const types: VectorStore['type'][] = [
        'lancedb',
        'chroma',
        'pinecone',
        'weaviate',
        'qdrant',
      ];
      expect(types).toHaveLength(5);
    });
  });

  describe('KnowledgeBaseConfig', () => {
    it('should create complete config', () => {
      const embeddingModel: EmbeddingModel = {
        name: 'text-embedding-3-small',
        provider: 'openai',
        dimensions: 1536,
        maxTokens: 8191,
        batchSize: 100,
      };

      const connection: VectorStoreConnection = {
        path: '/data/knowledge',
      };

      const vectorStore: VectorStore = {
        name: 'local-store',
        type: 'lancedb',
        connection,
      };

      const config: KnowledgeBaseConfig = {
        embeddingModel,
        vectorStore,
        chunkSize: 1000,
        chunkOverlap: 200,
        indexName: 'taskflow-kb',
        autoIndex: true,
      };

      expect(config.chunkSize).toBe(1000);
      expect(config.chunkOverlap).toBe(200);
      expect(config.autoIndex).toBe(true);
    });
  });
});

describe('Indexing and Status', () => {
  describe('IndexStatus', () => {
    it('should report index statistics', () => {
      const status: IndexStatus = {
        totalDocuments: 100,
        totalChunks: 500,
        indexedAt: new Date('2024-01-01'),
        lastUpdated: new Date('2024-04-01'),
        size: 10485760, // 10MB
      };

      expect(status.totalDocuments).toBe(100);
      expect(status.totalChunks).toBe(500);
      expect(status.size).toBe(10485760);
    });
  });
});

describe('QA and Question Answering', () => {
  describe('Source', () => {
    it('should create source citation', () => {
      const metadata: DocumentMetadata = {
        title: 'Authentication Guide',
        source: 'docs/auth.md',
        type: 'code',
        tags: ['security'],
      };

      const source: Source = {
        documentId: 'doc-1',
        title: 'Authentication Guide',
        content: 'Authentication is done via JWT tokens...',
        score: 0.92,
        metadata,
      };

      expect(source.documentId).toBe('doc-1');
      expect(source.score).toBe(0.92);
    });
  });

  describe('QAResult', () => {
    it('should create complete QA result', () => {
      const metadata: DocumentMetadata = {
        title: 'API Docs',
        source: 'docs/api.md',
        type: 'api-doc',
        tags: ['api'],
      };

      const sources: Source[] = [
        {
          documentId: 'doc-1',
          title: 'API Docs',
          content: 'Content',
          score: 0.9,
          metadata,
        },
      ];

      const result: QAResult = {
        answer: 'Authentication is done using JWT tokens with a 24-hour expiration',
        sources,
        confidence: 0.95,
        latency: 200,
      };

      expect(result.sources).toHaveLength(1);
      expect(result.confidence).toBe(0.95);
    });
  });
});

describe('Knowledge Statistics', () => {
  describe('KnowledgeStats', () => {
    it('should report knowledge base statistics', () => {
      const stats: KnowledgeStats = {
        documents: 100,
        chunks: 500,
        size: 50 * 1024 * 1024, // 50MB
        queries: 1000,
        avgLatency: 150,
        topTags: ['api', 'authentication', 'security'],
        documentTypes: {
          prd: 20,
          code: 30,
          markdown: 25,
          'api-doc': 15,
          design: 5,
          requirement: 3,
          task: 2,
          conversation: 0,
          other: 0,
        },
      };

      expect(stats.documents).toBe(100);
      expect(stats.chunks).toBe(500);
      expect(stats.topTags).toContain('security');
      expect(stats.documentTypes.code).toBe(30);
    });
  });
});

describe('Synchronization', () => {
  describe('SyncConfig', () => {
    it('should create sync configuration', () => {
      const config: SyncConfig = {
        watch: true,
        interval: 5,
        includePatterns: ['**/*.md', '**/*.ts'],
        excludePatterns: ['**/node_modules/**', '**/dist/**'],
        autoIndex: true,
      };

      expect(config.watch).toBe(true);
      expect(config.interval).toBe(5);
      expect(config.includePatterns).toHaveLength(2);
      expect(config.autoIndex).toBe(true);
    });
  });
});

describe('Knowledge Context', () => {
  describe('KnowledgeContext', () => {
    it('should create knowledge context for AI', () => {
      const metadata: DocumentMetadata = {
        title: 'Test',
        source: 'test.md',
        type: 'code',
        tags: [],
      };

      const chunk: DocumentChunk = {
        id: 'c-1',
        documentId: 'd-1',
        content: 'Content',
        embedding: [0.1, 0.2],
        metadata,
        index: 0,
      };

      const retrieved: RetrievedChunk = {
        chunk,
        score: 0.9,
        distance: 0.1,
      };

      const context: KnowledgeContext = {
        relevantDocs: [retrieved],
        summary: 'Found 1 document related to the query',
        suggestions: ['Consider also checking the API documentation'],
      };

      expect(context.relevantDocs).toHaveLength(1);
      expect(context.suggestions).toHaveLength(1);
    });
  });
});

describe('Integration Scenarios', () => {
  it('should handle document indexing workflow', () => {
    const metadata: DocumentMetadata = {
      title: 'Feature PRD',
      source: 'docs/features/user-auth.md',
      type: 'prd',
      tags: ['feature', 'user', 'authentication'],
      author: 'Agions',
      project: 'TaskFlow AI',
      version: '1.0.0',
    };

    const doc: Document = {
      id: 'doc-1',
      content: 'This PRD describes user authentication feature...',
      metadata,
      embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const chunkMetadata: ChunkMetadata = {
      start: 0,
      end: 500,
      overlap: 50,
      tokenCount: 128,
      title: 'Overview',
      source: metadata.source,
      type: metadata.type,
      tags: metadata.tags,
      chunkIndex: 0,
      startPosition: 0,
      endPosition: 500,
      totalChunks: 3,
    };

    const chunk: DocumentChunk = {
      id: 'chunk-1',
      documentId: doc.id,
      content: 'This chunk contains the overview section...',
      embedding: doc.embedding || [0.1, 0.2, 0.3, 0.4, 0.5],
      metadata,
      index: 0,
      chunkMetadata,
    };

    expect(doc.id).toBe('doc-1');
    expect(chunk.documentId).toBe(doc.id);
    expect(chunk.chunkMetadata?.totalChunks).toBe(3);
  });

  it('should handle semantic search workflow', () => {
    const options: RetrievalOptions = {
      topK: 5,
      threshold: 0.8,
      filters: [
        {
          field: 'type',
          operator: 'eq',
          value: 'prd',
        },
      ],
      rerank: true,
      hybridSearch: false,
    };

    const metadata: DocumentMetadata = {
      title: 'API PRD',
      source: 'docs/api.md',
      type: 'prd',
      tags: ['api'],
    };

    const chunk: DocumentChunk = {
      id: 'c-1',
      documentId: 'd-1',
      content: 'Content',
      embedding: [0.1, 0.2],
      metadata,
      index: 0,
    };

    const retrieved: RetrievedChunk = {
      chunk,
      score: 0.9,
      distance: 0.1,
    };

    const result: RetrievalResult = {
      chunks: [retrieved],
      query: 'REST API authentication',
      totalResults: 10,
      latency: 120,
    };

    expect(options.filters).toHaveLength(1);
    expect(result.chunks).toHaveLength(1);
  });

  it('should handle QA workflow with confidence scoring', () => {
    const metadata: DocumentMetadata = {
      title: 'Auth Guide',
      source: 'docs/auth.md',
      type: 'code',
      tags: ['authentication'],
    };

    const source: Source = {
      documentId: 'doc-1',
      title: 'Auth Guide',
      content: 'Use JWT tokens for authentication...',
      score: 0.95,
      metadata,
    };

    const qaResult: QAResult = {
      answer: 'JWT tokens should be used with RS256 algorithm',
      sources: [source],
      confidence: 0.92,
      latency: 250,
    };

    expect(qaResult.confidence).toBeGreaterThan(0.9);
    expect(qaResult.sources[0].score).toBe(0.95);
  });
});
