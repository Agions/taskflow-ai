/**
 * L2 Local Cache - 基于文件系统的持久化缓存
 * 提供跨会话的数据持久化，支持 SQLite (如果可用)
 */

import { getLogger } from '../../utils/logger';
import { join } from 'path';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  statSync,
  readdirSync,
  unlinkSync,
} from 'fs';

const logger = getLogger('core/cache/local');

export interface LocalCacheOptions {
  /** 缓存目录 */
  cacheDir?: string;
  /** 默认 TTL (秒) */
  ttl?: number;
  /** 最大条目数，0 = 无限制 */
  maxEntries?: number;
}

interface CacheEntry {
  value: unknown;
  expiresAt: number | null;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
}

export class LocalCache {
  private cacheDir: string;
  private defaultTtl: number;
  private maxEntries: number;
  private index: Map<string, CacheEntry> = new Map();
  private indexPath: string;

  constructor(options: LocalCacheOptions = {}) {
    this.cacheDir =
      options.cacheDir ?? join(process.env.HOME || '/root', '.taskflow', 'cache', 'data');
    this.defaultTtl = options.ttl ?? 86400; // 默认 24 小时
    this.maxEntries = options.maxEntries ?? 10000;

    // 确保目录存在
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
    }

    this.indexPath = join(this.cacheDir, '.index.json');
    this.loadIndex();

    logger.info(`LocalCache 初始化: cacheDir=${this.cacheDir}, ttl=${this.defaultTtl}s`);
  }

  /**
   * 加载索引
   */
  private loadIndex(): void {
    try {
      if (existsSync(this.indexPath)) {
        const data = readFileSync(this.indexPath, 'utf-8');
        const entries = JSON.parse(data) as Record<string, CacheEntry>;
        this.index = new Map(Object.entries(entries));

        // 清理过期条目
        const now = Date.now();
        for (const [key, entry] of this.index) {
          if (entry.expiresAt && entry.expiresAt < now) {
            this.deleteFile(key);
            this.index.delete(key);
          }
        }
      }
    } catch (error) {
      logger.warn('索引加载失败，将创建新索引');
      this.index = new Map();
    }
  }

  /**
   * 保存索引
   */
  private saveIndex(): void {
    try {
      const entries = Object.fromEntries(this.index);
      writeFileSync(this.indexPath, JSON.stringify(entries), 'utf-8');
    } catch (error) {
      logger.error('索引保存失败', error);
    }
  }

  /**
   * 获取缓存值
   */
  get<T>(key: string): T | null {
    const entry = this.index.get(key);

    if (!entry) {
      return null;
    }

    // 检查过期
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }

    // 读取文件内容
    try {
      const filePath = this.getFilePath(key);
      const data = readFileSync(filePath, 'utf-8');

      // 更新访问统计
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      this.saveIndex();

      return JSON.parse(data) as T;
    } catch (error) {
      // 文件可能已删除
      this.index.delete(key);
      return null;
    }
  }

  /**
   * 设置缓存值
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = ttl
      ? now + ttl * 1000
      : this.defaultTtl
        ? now + this.defaultTtl * 1000
        : null;

    const filePath = this.getFilePath(key);

    try {
      // 写入数据文件
      const serialized = JSON.stringify(value);
      writeFileSync(filePath, serialized, 'utf-8');

      // 更新索引
      const existingEntry = this.index.get(key);
      this.index.set(key, {
        value, // 占位，实际值在文件中
        expiresAt,
        createdAt: existingEntry?.createdAt ?? now,
        accessCount: (existingEntry?.accessCount ?? 0) + 1,
        lastAccessed: now,
      });

      // 保存索引
      this.saveIndex();

      // 检查条目数限制，执行清理
      this.prune();
    } catch (error) {
      logger.error(`缓存写入失败: key=${key}`, error);
    }
  }

  /**
   * 检查键是否存在
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * 删除单个键
   */
  delete(key: string): boolean {
    const existed = this.index.has(key);

    this.deleteFile(key);
    this.index.delete(key);
    this.saveIndex();

    return existed;
  }

  /**
   * 删除文件
   */
  private deleteFile(key: string): void {
    try {
      const filePath = this.getFilePath(key);
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch (error) {
      // 忽略删除错误
    }
  }

  /**
   * 使缓存失效 (支持模式匹配)
   */
  invalidate(pattern: string | RegExp): number {
    const regex =
      typeof pattern === 'string' ? new RegExp('^' + pattern.replace(/\*/g, '.*') + '$') : pattern;

    let count = 0;
    const keysToDelete: string[] = [];

    for (const key of this.index.keys()) {
      if (regex.test(key)) {
        this.deleteFile(key);
        keysToDelete.push(key);
        count++;
      }
    }

    for (const key of keysToDelete) {
      this.index.delete(key);
    }

    if (count > 0) {
      this.saveIndex();
    }

    logger.debug(`缓存失效: pattern=${pattern}, count=${count}`);
    return count;
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    try {
      const files = readdirSync(this.cacheDir);
      for (const file of files) {
        if (file !== '.index.json') {
          unlinkSync(join(this.cacheDir, file));
        }
      }
    } catch (error) {
      // 忽略错误
    }

    this.index.clear();
    this.saveIndex();
    logger.debug('缓存已清空');
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    size: number;
    memorySize: number;
  } {
    let memorySize = 0;

    try {
      const files = readdirSync(this.cacheDir);
      for (const file of files) {
        if (file !== '.index.json') {
          const filePath = join(this.cacheDir, file);
          const stat = statSync(filePath);
          memorySize += stat.size;
        }
      }
    } catch (error) {
      // 忽略错误
    }

    return {
      size: this.index.size,
      memorySize,
    };
  }

  /**
   * 获取条目数
   */
  get size(): number {
    return this.index.size;
  }

  /**
   * 清理过期和超限条目
   */
  private prune(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    // 找出过期条目
    for (const [key, entry] of this.index) {
      if (entry.expiresAt && entry.expiresAt < now) {
        keysToDelete.push(key);
      }
    }

    // 如果超过最大条目数，删除最久未访问的
    if (this.maxEntries > 0 && this.index.size > this.maxEntries) {
      const entries = Array.from(this.index.entries()).sort(
        (a, b) => a[1].lastAccessed - b[1].lastAccessed
      );

      const excessCount = this.index.size - this.maxEntries;
      for (let i = 0; i < excessCount; i++) {
        if (!keysToDelete.includes(entries[i][0])) {
          keysToDelete.push(entries[i][0]);
        }
      }
    }

    // 删除
    for (const key of keysToDelete) {
      this.deleteFile(key);
      this.index.delete(key);
    }

    if (keysToDelete.length > 0) {
      this.saveIndex();
      logger.debug(`清理缓存: ${keysToDelete.length} 条`);
    }
  }

  /**
   * 获取文件路径
   */
  private getFilePath(key: string): string {
    // 使用安全的文件名
    const safeName = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    const hash = this.hashKey(key);
    return join(this.cacheDir, `${safeName}_${hash}.cache`);
  }

  /**
   * 计算 key 的哈希
   */
  private hashKey(key: string): string {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 关闭缓存
   */
  close(): void {
    this.saveIndex();
    logger.debug('LocalCache 已关闭');
  }
}
