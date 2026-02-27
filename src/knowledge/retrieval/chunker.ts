/**
 * 文档分块器
 */

import { Document, DocumentChunk, ChunkMetadata } from '../types';

export class DocumentChunker {
  constructor(
    private chunkSize: number = 1000,
    private chunkOverlap: number = 200
  ) {}

  chunk(doc: Document): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const content = doc.content;

    if (content.length <= this.chunkSize) {
      chunks.push({
        id: `${doc.id}-chunk-0`,
        documentId: doc.id,
        content: content,
        metadata: this.createMetadata(doc, 0, 0, content.length),
        embedding: [],
        index: 0
      });
      return chunks;
    }

    let position = 0;
    let chunkIndex = 0;

    while (position < content.length) {
      const end = Math.min(position + this.chunkSize, content.length);
      const chunkContent = content.slice(position, end);

      chunks.push({
        id: `${doc.id}-chunk-${chunkIndex}`,
        documentId: doc.id,
        content: chunkContent,
        metadata: this.createMetadata(doc, chunkIndex, position, end),
        embedding: [],
        index: chunkIndex
      });

      position = end - this.chunkOverlap;
      chunkIndex++;

      if (end === content.length) break;
    }

    return chunks;
  }

  private createMetadata(doc: Document, index: number, start: number, end: number): ChunkMetadata {
    return {
      ...doc.metadata,
      chunkIndex: index,
      start,
      end,
      overlap: this.chunkOverlap,
      tokenCount: end - start,
      totalChunks: Math.ceil(doc.content.length / (this.chunkSize - this.chunkOverlap))
    };
  }
}
