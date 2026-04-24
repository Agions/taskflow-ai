import { getLogger } from '../../utils/logger';
/**
 * 资源扫描器
 */

import path = require('path');
import fs = require('fs-extra');
import { MCPResource } from './types';
import { Logger } from '../../utils/logger';
const logger = getLogger('mcp/resources/scanner');

export class ResourceScanner {
  constructor(
    private dataDir: string,
    private logger: Logger
  ) {}

  async scan(): Promise<MCPResource[]> {
    const files = await this.findDataFiles();
    const resources: MCPResource[] = [];

    for (const file of files) {
      const resource = await this.createFileResource(file);
      if (resource) {
        resources.push(resource);
      }
    }

    return resources;
  }

  private async findDataFiles(): Promise<string[]> {
    const files: string[] = [];

    try {
      const items = await fs.readdir(this.dataDir);

      for (const item of items) {
        const itemPath = path.join(this.dataDir, item);
        const stats = await fs.stat(itemPath);

        if (stats.isFile()) {
          files.push(itemPath);
        }
      }
    } catch (error) {
      this.logger.warn('查找数据文件失败:', error);
    }

    return files;
  }

  private async createFileResource(filePath: string): Promise<MCPResource | null> {
    try {
      const stats = await fs.stat(filePath);
      const fileName = path.basename(filePath);
      const ext = path.extname(fileName);

      return {
        uri: `/files/${fileName}`,
        name: fileName,
        description: `文件: ${fileName}`,
        mimeType: this.getMimeType(ext),
        metadata: {
          size: stats.size,
          lastModified: stats.mtime.toISOString(),
          tags: ['file', 'data'],
        },
      };
    } catch (error) {
      this.logger.warn(`创建资源失败: ${filePath}`, error);
      return null;
    }
  }

  private getMimeType(ext: string): string {
    const mimeTypes: Record<string, string> = {
      '.json': 'application/json',
      '.md': 'text/markdown',
      '.txt': 'text/plain',
      '.yaml': 'application/yaml',
      '.yml': 'application/yaml',
      '.csv': 'text/csv',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}
