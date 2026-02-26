/**
 * MCP资源类型定义
 */

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  metadata?: {
    size?: number;
    lastModified?: string;
    version?: string;
    tags?: string[];
  };
}
