/**
 * 文档扫描器
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { minimatch } from 'minimatch';

export class DocumentScanner {
  async scan(
    dirPath: string,
    includePatterns: string[],
    excludePatterns: string[]
  ): Promise<string[]> {
    const files: string[] = [];

    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        if (this.shouldExcludeDir(entry.name, excludePatterns)) {
          continue;
        }
        const subFiles = await this.scan(fullPath, includePatterns, excludePatterns);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        if (this.shouldIncludeFile(fullPath, includePatterns, excludePatterns)) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  private shouldExcludeDir(name: string, excludePatterns: string[]): boolean {
    return excludePatterns.some(
      pattern => minimatch(name, pattern) || minimatch(name, pattern.replace('/**', ''))
    );
  }

  private shouldIncludeFile(
    filePath: string,
    includePatterns: string[],
    excludePatterns: string[]
  ): boolean {
    const relativePath = path.relative(process.cwd(), filePath);

    if (excludePatterns.some(pattern => minimatch(relativePath, pattern))) {
      return false;
    }

    return includePatterns.some(pattern => minimatch(relativePath, pattern));
  }
}
