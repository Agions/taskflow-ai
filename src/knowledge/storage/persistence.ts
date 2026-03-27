/**
 * 向量存储持久化
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { StoredChunk } from './types';

/**
 * 数据持久化管理器
 */
export class DataPersistence {
  constructor(
    private dataDir: string,
    private collection: string
  ) {}

  /**
   * 获取数据文件路径
   */
  private getDataFile(): string {
    return path.join(this.dataDir, `${this.collection}.json`);
  }

  /**
   * 保存数据
   */
  async saveData(data: Map<string, StoredChunk>): Promise<void> {
    const dataFile = this.getDataFile();
    const chunks = Array.from(data.values());
    await fs.writeJson(dataFile, chunks, { spaces: 2 });
  }

  /**
   * 加载数据
   */
  async loadData(): Promise<StoredChunk[]> {
    const dataFile = this.getDataFile();

    if (!(await fs.pathExists(dataFile))) {
      return [];
    }

    try {
      return await fs.readJson(dataFile);
    } catch (error) {
      console.warn('Failed to load vector store data:', error);
      return [];
    }
  }

  /**
   * 获取数据文件大小
   */
  async getDataSize(): Promise<number> {
    const dataFile = this.getDataFile();

    if (!(await fs.pathExists(dataFile))) {
      return 0;
    }

    const stats = await fs.stat(dataFile);
    return stats.size;
  }

  /**
   * 删除数据文件
   */
  async deleteData(): Promise<void> {
    const dataFile = this.getDataFile();
    if (await fs.pathExists(dataFile)) {
      await fs.remove(dataFile);
    }
  }
}
