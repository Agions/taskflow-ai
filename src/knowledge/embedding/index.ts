/**
 * 嵌入模型管理器
 * 支持多种嵌入模型
 */

import axios from 'axios';
import {
  EmbeddingModel,
  Document,
  DocumentChunk
} from '../types';

export class EmbeddingManager {
  private model: EmbeddingModel;
  private cache: Map<string, number[]> = new Map();

  constructor(model?: Partial<EmbeddingModel>) {
    this.model = {
      name: model?.name || 'text-embedding-3-small',
      provider: model?.provider || 'openai',
      dimensions: model?.dimensions || 1536,
      maxTokens: model?.maxTokens || 8192,
      batchSize: model?.batchSize || 100
    };
  }

  /**
   * 生成文本嵌入
   */
  async embed(text: string): Promise<number[]> {
    // 检查缓存
    const cacheKey = this.hashText(text);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    let embedding: number[];

    switch (this.model.provider) {
      case 'openai':
        embedding = await this.embedWithOpenAI(text);
        break;
      case 'local':
        embedding = await this.embedWithLocal(text);
        break;
      case 'huggingface':
        embedding = await this.embedWithHuggingFace(text);
        break;
      default:
        // 使用简单的哈希作为回退
        embedding = this.simpleEmbedding(text);
    }

    // 缓存结果
    this.cache.set(cacheKey, embedding);

    return embedding;
  }

  /**
   * 批量生成嵌入
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];

    // 分批处理
    for (let i = 0; i < texts.length; i += this.model.batchSize) {
      const batch = texts.slice(i, i + this.model.batchSize);
      const batchResults = await Promise.all(
        batch.map(text => this.embed(text))
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * 为文档生成嵌入
   */
  async embedDocument(doc: Document): Promise<Document> {
    const embedding = await this.embed(doc.content);
    return {
      ...doc,
      embedding
    };
  }

  /**
   * 为文档块生成嵌入
   */
  async embedChunks(chunks: DocumentChunk[]): Promise<DocumentChunk[]> {
    const texts = chunks.map(c => c.content);
    const embeddings = await this.embedBatch(texts);

    return chunks.map((chunk, index) => ({
      ...chunk,
      embedding: embeddings[index]
    }));
  }

  /**
   * 计算相似度
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same dimensions');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * 使用 OpenAI 生成嵌入
   */
  private async embedWithOpenAI(text: string): Promise<number[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('OPENAI_API_KEY not set, using fallback embedding');
      return this.simpleEmbedding(text);
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/embeddings',
        {
          input: text,
          model: this.model.name,
          dimensions: this.model.dimensions
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data.data[0].embedding;
    } catch (error) {
      console.warn('OpenAI embedding failed:', error);
      return this.simpleEmbedding(text);
    }
  }

  /**
   * 使用本地模型生成嵌入
   */
  private async embedWithLocal(text: string): Promise<number[]> {
    // 简化实现：实际应该调用本地模型服务
    return this.simpleEmbedding(text);
  }

  /**
   * 使用 Hugging Face 生成嵌入
   */
  private async embedWithHuggingFace(text: string): Promise<number[]> {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      return this.simpleEmbedding(text);
    }

    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/pipeline/feature-extraction/${this.model.name}`,
        { inputs: text },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data[0];
    } catch (error) {
      console.warn('HuggingFace embedding failed:', error);
      return this.simpleEmbedding(text);
    }
  }

  /**
   * 简单的回退嵌入（基于词频）
   */
  private simpleEmbedding(text: string): number[] {
    // 创建一个简单的基于字符的嵌入
    // 实际应用中应该使用真实的嵌入模型
    const dimensions = this.model.dimensions;
    const embedding = new Array(dimensions).fill(0);

    // 使用字符编码创建简单的向量
    for (let i = 0; i < text.length && i < dimensions; i++) {
      embedding[i] = text.charCodeAt(i) / 255;
    }

    // 归一化
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      return embedding.map(val => val / norm);
    }

    return embedding;
  }

  /**
   * 文本哈希
   */
  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  /**
   * 获取模型信息
   */
  getModelInfo(): EmbeddingModel {
    return { ...this.model };
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

export default EmbeddingManager;
