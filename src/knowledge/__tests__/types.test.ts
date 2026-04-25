/**
 * Knowledge Types Tests
 * TaskFlow AI v4.0
 */

import type {
  Document,
  DocumentMetadata,
  DocumentType,
  DocumentChunk,
  ChunkMetadata,
  RetrievalResult,
  RetrievalOptions,
  FilterCondition,
  EmbeddingModel,
  VectorStore,
  KnowledgeBaseConfig
} from '../types';

describe('Knowledge Types', () => {
  describe('DocumentType', () => {
    it('should support prd document type', () => {
      const type: DocumentType = 'prd';
      expect(type).toBe('prd');
    });

    it('should support code document type', () => {
      const type: DocumentType = 'code';
      expect(type).toBe('code');
    });

    it('should support markdown document type', () => {
      const type: DocumentType = 'markdown';
      expect(type).toBe('markdown');
    });

    it('should support api-doc document type', () => {
      const type: DocumentType = 'api-doc';
      expect(type).toBe('api-doc');
    });
  });

  describe('DocumentMetadata', () => {
    it('should create complete metadata', () => {
      const metadata: DocumentMetadata = {
        title: 'API Documentation',
        source: '/docs/api.md',
        type: 'api-doc',
        tags: ['api', 'documentation', 'rest'],
        author: 'Agions',
        project: 'TaskFlow AI',
        version: '1.0.0'
      };

      expect(metadata.title).toBe('API Documentation');
      expect(metadata.author).toBe('Agions');
      expect(metadata.tags).toContain('api');
    });

    it('should create minimal metadata', () => {
      const metadata: DocumentMetadata = {
        title: 'Simple Document',
        source: '/docs/simple.md',
        type: 'markdown',
        tags: []
      };

      expect(metadata.title).toBe('Simple Document');
      expect(metadata.tags).toHaveLength(0);
    });
  });

  describe('Document', () => {
    it('should create complete document', () => {
      const document: Document = {
        id: 'doc-123',
        content: 'This is the document content.',
        metadata: {
          title: 'Test Document',
          source: '/test.md',
          type: 'markdown',
          tags: ['test']
        },
        embedding: [0.1, 0.2, 0.3],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15')
      };

      expect(document.id).toBe('doc-123');
      expect(document.content).toBe('This is the document content.');
      expect(document.embedding).toBeDefined();
      expect(document.embedding).toHaveLength(3);
    });
  });

  describe('DocumentChunk', () => {
    it('should create document chunk', () => {
      const chunk: DocumentChunk = {
        id: 'chunk-789',
        documentId: 'doc-123',
        content: 'This is a chunk of the document.',
        embedding: [0.4, 0.5, 0.6],
        metadata: {
          title: 'Test Document',
          source: '/test.md',
          type: 'markdown',
          tags: ['test']
        },
        index: 0
      };

      expect(chunk.id).toBe('chunk-789');
      expect(chunk.documentId).toBe('doc-123');
      expect(chunk.index).toBe(0);
    });
  });

  describe('ChunkMetadata', () => {
    it('should create chunk metadata', () => {
      const chunkMetadata: ChunkMetadata = {
        start: 0,
        end: 150,
        overlap: 50,
        tokenCount: 150,
        title: 'Test Document',
        source: '/test.md',
        type: 'markdown',
        tags: ['test']
      };

      expect(chunkMetadata.start).toBe(0);
      expect(chunkMetadata.end).toBe(150);
      expect(chunkMetadata.tokenCount).toBe(150);
    });
  });

  describe('RetrievalOptions', () => {
    it('should create retrieval options', () => {
      const filters: FilterCondition[] = [
        {
          field: 'type',
          operator: 'eq',
          value: 'api-doc'
        }
      ];

      const options: RetrievalOptions = {
        topK: 5,
        threshold: 0.8,
        filters,
        rerank: true,
        hybridSearch: false
      };

      expect(options.topK).toBe(5);
      expect(options.threshold).toBe(0.8);
      expect(options.filters).toHaveLength(1);
      expect(options.filters![0].operator).toBe('eq');
    });
  });

  describe('EmbeddingModel', () => {
    it('should create embedding model config', () => {
      const model: EmbeddingModel = {
        name: 'text-embedding-ada-002',
        provider: 'openai',
        dimensions: 1536,
        maxTokens: 8191,
        batchSize: 100
      };

      expect(model.name).toBe('text-embedding-ada-002');
      expect(model.provider).toBe('openai');
      expect(model.dimensions).toBe(1536);
      expect(model.batchSize).toBe(100);
    });

    it('should create local embedding model', () => {
      const model: EmbeddingModel = {
        name: 'all-MiniLM-L6-v2',
        provider: 'local',
        dimensions: 384,
        maxTokens: 512,
        batchSize: 32
      };

      expect(model.provider).toBe('local');
      expect(model.dimensions).toBe(384);
    });
  });

  describe('VectorStore', () => {
    it('should create vector store config', () => {
      const vectorStore: VectorStore = {
        name: 'main-store',
        type: 'chroma',
        connection: {
          path: '/data/vectorstore',
          collection: 'documents'
        }
      };

      expect(vectorStore.type).toBe('chroma');
      expect(vectorStore.connection.path).toBe('/data/vectorstore');
    });

    it('should create remote vector store', () => {
      const vectorStore: VectorStore = {
        name: 'pinecone-store',
        type: 'pinecone',
        connection: {
          url: 'https://index.pinecone.io',
          apiKey: 'sk-xxx',
          collection: 'vectors'
        }
      };

      expect(vectorStore.type).toBe('pinecone');
      expect(vectorStore.connection.apiKey).toBeDefined();
    });
  });

  describe('KnowledgeBaseConfig', () => {
    it('should create complete knowledge base configuration', () => {
      const embeddingModel: EmbeddingModel = {
        name: 'text-embedding-ada-002',
        provider: 'openai',
        dimensions: 1536,
        maxTokens: 8191,
        batchSize: 100
      };

      const vectorStore: VectorStore = {
        name: 'default-store',
        type: 'chroma',
        connection: {
          path: '/data/vectorstore',
          collection: 'documents'
        }
      };

      const config: KnowledgeBaseConfig = {
        embeddingModel,
        vectorStore,
        chunkSize: 512,
        chunkOverlap: 50,
        indexName: 'taskflow-kb',
        autoIndex: true
      };

      expect(config.chunkSize).toBe(512);
      expect(config.chunkOverlap).toBe(50);
      expect(config.indexName).toBe('taskflow-kb');
      expect(config.autoIndex).toBe(true);
      expect(config.embeddingModel.provider).toBe('openai');
      expect(config.vectorStore.type).toBe('chroma');
    });
  });
});
