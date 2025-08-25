/**
 * TaskFlow AI 智能缓存管理器
 * 提供多级缓存、自动失效、LRU策略等功能
 */

import { EventEmitter } from 'events';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

export interface CacheConfig {
  type: 'memory' | 'filesystem' | 'hybrid';
  maxSize: number;
  ttl: number; // 默认TTL（秒）
  cleanupInterval: number; // 清理间隔（秒）
  persistToDisk: boolean;
  compression: boolean;
  maxFileSize: number; // 单个缓存文件最大大小（字节）
}

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  ttl: number;
  createdAt: number;
  accessedAt: number;
  accessCount: number;
  size: number;
  compressed: boolean;
  tags: string[];
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  memoryUsage: number;
  diskUsage: number;
}

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  compress?: boolean;
  priority?: number;
}

/**
 * 智能缓存管理器
 * 支持内存、文件系统和混合缓存策略
 */
export class CacheManager extends EventEmitter {
  private config: CacheConfig;
  private memoryCache = new Map<string, CacheEntry>();
  private accessOrder: string[] = []; // LRU跟踪
  private stats: CacheStats;
  private cleanupTimer?: NodeJS.Timeout;
  private cacheDir: string;
  private initialized = false;

  constructor(config: Partial<CacheConfig> = {}) {
    super();
    
    this.config = {
      type: 'hybrid',
      maxSize: 100 * 1024 * 1024, // 100MB
      ttl: 3600, // 1小时
      cleanupInterval: 300, // 5分钟
      persistToDisk: true,
      compression: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      ...config,
    };

    this.cacheDir = path.join(os.tmpdir(), 'taskflow-cache');
    
    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hitCount: 0,
      missCount: 0,
      hitRate: 0,
      memoryUsage: 0,
      diskUsage: 0,
    };
  }

  /**
   * 初始化缓存管理器
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 创建缓存目录
      if (this.config.persistToDisk) {
        await fs.ensureDir(this.cacheDir);
      }

      // 加载持久化缓存
      if (this.config.persistToDisk) {
        await this.loadPersistedCache();
      }

      // 启动清理定时器
      this.startCleanupTimer();

      this.initialized = true;
      console.log('⚡ 缓存管理器初始化成功');

    } catch (error) {
      console.error('❌ 缓存管理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 设置缓存项
   */
  async set<T>(key: string, value: T, ttl?: number, options?: CacheOptions): Promise<void> {
    this.ensureInitialized();

    const now = Date.now();
    const finalTtl = ttl || options?.ttl || this.config.ttl;
    const serializedValue = JSON.stringify(value);
    const size = Buffer.byteLength(serializedValue, 'utf8');

    // 检查单个文件大小限制
    if (size > this.config.maxFileSize) {
      console.warn(`⚠️ 缓存项 ${key} 大小超过限制: ${size} bytes`);
      return;
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      ttl: finalTtl,
      createdAt: now,
      accessedAt: now,
      accessCount: 1,
      size,
      compressed: false,
      tags: options?.tags || [],
    };

    // 压缩处理
    if (this.config.compression && (options?.compress !== false)) {
      try {
        const compressed = await this.compress(serializedValue);
        if (compressed.length < serializedValue.length) {
          entry.value = compressed as any;
          entry.compressed = true;
          entry.size = compressed.length;
        }
      } catch (error) {
        console.warn(`⚠️ 压缩缓存项 ${key} 失败:`, error);
      }
    }

    // 检查是否需要清理空间
    await this.ensureSpace(entry.size);

    // 存储到内存
    if (this.config.type === 'memory' || this.config.type === 'hybrid') {
      this.memoryCache.set(key, entry);
      this.updateLRU(key);
    }

    // 存储到磁盘
    if (this.config.persistToDisk && (this.config.type === 'filesystem' || this.config.type === 'hybrid')) {
      await this.persistToDisk(key, entry);
    }

    // 更新统计
    this.updateStats(entry, 'set');

    this.emit('set', key, entry);
  }

  /**
   * 获取缓存项
   */
  async get<T>(key: string): Promise<T | null> {
    this.ensureInitialized();

    let entry: CacheEntry<T> | undefined;

    // 从内存获取
    if (this.config.type === 'memory' || this.config.type === 'hybrid') {
      entry = this.memoryCache.get(key) as CacheEntry<T>;
    }

    // 从磁盘获取
    if (!entry && (this.config.type === 'filesystem' || this.config.type === 'hybrid')) {
      entry = await this.loadFromDisk<T>(key);
      
      // 加载到内存（热数据）
      if (entry && this.config.type === 'hybrid') {
        this.memoryCache.set(key, entry);
      }
    }

    if (!entry) {
      this.stats.missCount++;
      this.updateHitRate();
      return null;
    }

    // 检查过期
    const now = Date.now();
    if (this.isExpired(entry, now)) {
      await this.delete(key);
      this.stats.missCount++;
      this.updateHitRate();
      return null;
    }

    // 更新访问信息
    entry.accessedAt = now;
    entry.accessCount++;
    this.updateLRU(key);

    // 解压缩
    let value = entry.value;
    if (entry.compressed) {
      try {
        const decompressed = await this.decompress(value as any);
        value = JSON.parse(decompressed);
      } catch (error) {
        console.error(`❌ 解压缩缓存项 ${key} 失败:`, error);
        await this.delete(key);
        this.stats.missCount++;
        this.updateHitRate();
        return null;
      }
    }

    this.stats.hitCount++;
    this.updateHitRate();
    this.emit('get', key, entry);

    return value;
  }

  /**
   * 删除缓存项
   */
  async delete(key: string): Promise<boolean> {
    this.ensureInitialized();

    let deleted = false;

    // 从内存删除
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key)!;
      this.memoryCache.delete(key);
      this.removeFromLRU(key);
      this.updateStats(entry, 'delete');
      deleted = true;
    }

    // 从磁盘删除
    const diskPath = this.getDiskPath(key);
    if (await fs.pathExists(diskPath)) {
      await fs.unlink(diskPath);
      deleted = true;
    }

    if (deleted) {
      this.emit('delete', key);
    }

    return deleted;
  }

  /**
   * 检查缓存项是否存在
   */
  async has(key: string): Promise<boolean> {
    this.ensureInitialized();

    // 检查内存
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key)!;
      if (!this.isExpired(entry)) {
        return true;
      }
    }

    // 检查磁盘
    const diskPath = this.getDiskPath(key);
    if (await fs.pathExists(diskPath)) {
      const entry = await this.loadFromDisk(key);
      if (entry && !this.isExpired(entry)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    this.ensureInitialized();

    // 清空内存
    this.memoryCache.clear();
    this.accessOrder.length = 0;

    // 清空磁盘
    if (this.config.persistToDisk) {
      await fs.emptyDir(this.cacheDir);
    }

    // 重置统计
    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hitCount: 0,
      missCount: 0,
      hitRate: 0,
      memoryUsage: 0,
      diskUsage: 0,
    };

    this.emit('clear');
    console.log('🧹 缓存已清空');
  }

  /**
   * 按标签删除缓存
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    this.ensureInitialized();

    let deletedCount = 0;
    const keysToDelete: string[] = [];

    // 查找匹配标签的缓存项
    for (const [key, entry] of this.memoryCache) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        keysToDelete.push(key);
      }
    }

    // 删除匹配的缓存项
    for (const key of keysToDelete) {
      await this.delete(key);
      deletedCount++;
    }

    console.log(`🏷️ 按标签删除了 ${deletedCount} 个缓存项`);
    return deletedCount;
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats {
    this.updateMemoryUsage();
    return { ...this.stats };
  }

  /**
   * 获取所有缓存键
   */
  async keys(): Promise<string[]> {
    this.ensureInitialized();

    const keys = new Set<string>();

    // 内存中的键
    for (const key of this.memoryCache.keys()) {
      keys.add(key);
    }

    // 磁盘中的键
    if (this.config.persistToDisk) {
      const files = await fs.readdir(this.cacheDir);
      for (const file of files) {
        if (file.endsWith('.cache')) {
          const key = this.decodeKey(file.slice(0, -6));
          keys.add(key);
        }
      }
    }

    return Array.from(keys);
  }

  /**
   * 预热缓存
   */
  async warmup(entries: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
    console.log(`🔥 开始预热 ${entries.length} 个缓存项...`);

    const promises = entries.map(({ key, value, ttl }) => 
      this.set(key, value, ttl).catch(error => 
        console.error(`预热缓存项 ${key} 失败:`, error)
      )
    );

    await Promise.all(promises);
    console.log('✅ 缓存预热完成');
  }

  /**
   * 关闭缓存管理器
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      // 停止清理定时器
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
      }

      // 持久化内存中的缓存
      if (this.config.persistToDisk) {
        await this.persistAllToDisk();
      }

      this.initialized = false;
      console.log('✅ 缓存管理器已关闭');

    } catch (error) {
      console.error('❌ 缓存管理器关闭失败:', error);
      throw error;
    }
  }

  // 私有方法

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('缓存管理器尚未初始化');
    }
  }

  private isExpired(entry: CacheEntry, now: number = Date.now()): boolean {
    return (entry.createdAt + entry.ttl * 1000) < now;
  }

  private updateLRU(key: string): void {
    // 移除旧位置
    this.removeFromLRU(key);
    // 添加到末尾（最新访问）
    this.accessOrder.push(key);
  }

  private removeFromLRU(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  private async ensureSpace(requiredSize: number): Promise<void> {
    const currentSize = this.stats.memoryUsage + requiredSize;
    
    if (currentSize <= this.config.maxSize) {
      return;
    }

    // 需要清理空间
    const targetSize = this.config.maxSize * 0.8; // 清理到80%
    let freedSize = 0;

    // 按LRU顺序删除（最久未访问的先删除）
    while (freedSize < (currentSize - targetSize) && this.accessOrder.length > 0) {
      const keyToRemove = this.accessOrder[0];
      const entry = this.memoryCache.get(keyToRemove);
      
      if (entry) {
        freedSize += entry.size;
        await this.delete(keyToRemove);
      } else {
        this.accessOrder.shift();
      }
    }

    console.log(`🧹 清理了 ${freedSize} 字节的缓存空间`);
  }

  private updateStats(entry: CacheEntry, operation: 'set' | 'delete'): void {
    if (operation === 'set') {
      this.stats.totalEntries++;
      this.stats.totalSize += entry.size;
    } else {
      this.stats.totalEntries--;
      this.stats.totalSize -= entry.size;
    }

    this.updateMemoryUsage();
  }

  private updateMemoryUsage(): void {
    let memoryUsage = 0;
    for (const entry of this.memoryCache.values()) {
      memoryUsage += entry.size;
    }
    this.stats.memoryUsage = memoryUsage;
  }

  private updateHitRate(): void {
    const total = this.stats.hitCount + this.stats.missCount;
    this.stats.hitRate = total > 0 ? this.stats.hitCount / total : 0;
  }

  private async compress(data: string): Promise<Buffer> {
    const zlib = await import('zlib');
    return new Promise((resolve, reject) => {
      zlib.gzip(Buffer.from(data, 'utf8'), (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });
  }

  private async decompress(data: Buffer): Promise<string> {
    const zlib = await import('zlib');
    return new Promise((resolve, reject) => {
      zlib.gunzip(data, (error, result) => {
        if (error) reject(error);
        else resolve(result.toString('utf8'));
      });
    });
  }

  private getDiskPath(key: string): string {
    const encodedKey = this.encodeKey(key);
    return path.join(this.cacheDir, `${encodedKey}.cache`);
  }

  private encodeKey(key: string): string {
    return crypto.createHash('md5').update(key).digest('hex');
  }

  private decodeKey(encoded: string): string {
    // 在实际应用中，需要维护一个映射表
    // 这里简化实现
    return encoded;
  }

  private async persistToDisk<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    try {
      const diskPath = this.getDiskPath(key);
      const data = {
        ...entry,
        originalKey: key, // 保存原始键名
      };
      
      await fs.writeJson(diskPath, data);
    } catch (error) {
      console.error(`❌ 持久化缓存项 ${key} 失败:`, error);
    }
  }

  private async loadFromDisk<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const diskPath = this.getDiskPath(key);
      
      if (!await fs.pathExists(diskPath)) {
        return null;
      }

      const data = await fs.readJson(diskPath);
      return data as CacheEntry<T>;
      
    } catch (error) {
      console.error(`❌ 从磁盘加载缓存项 ${key} 失败:`, error);
      return null;
    }
  }

  private async loadPersistedCache(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      let loadedCount = 0;

      for (const file of files) {
        if (file.endsWith('.cache')) {
          try {
            const filePath = path.join(this.cacheDir, file);
            const entry = await fs.readJson(filePath);
            
            // 检查是否过期
            if (!this.isExpired(entry)) {
              const key = entry.originalKey || this.decodeKey(file.slice(0, -6));
              this.memoryCache.set(key, entry);
              this.updateLRU(key);
              loadedCount++;
            } else {
              // 删除过期文件
              await fs.unlink(filePath);
            }
          } catch (error) {
            console.error(`加载缓存文件 ${file} 失败:`, error);
          }
        }
      }

      console.log(`📦 从磁盘加载了 ${loadedCount} 个缓存项`);
    } catch (error) {
      console.error('❌ 加载持久化缓存失败:', error);
    }
  }

  private async persistAllToDisk(): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const [key, entry] of this.memoryCache) {
      if (!this.isExpired(entry)) {
        promises.push(this.persistToDisk(key, entry));
      }
    }

    await Promise.all(promises);
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup().catch(error => 
        console.error('缓存清理失败:', error)
      );
    }, this.config.cleanupInterval * 1000);

    console.log(`🧹 缓存自动清理已启动，间隔 ${this.config.cleanupInterval} 秒`);
  }

  private async cleanup(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    // 查找过期的内存缓存项
    for (const [key, entry] of this.memoryCache) {
      if (this.isExpired(entry, now)) {
        expiredKeys.push(key);
      }
    }

    // 删除过期项
    for (const key of expiredKeys) {
      await this.delete(key);
    }

    // 清理磁盘上的过期文件
    if (this.config.persistToDisk) {
      await this.cleanupDiskCache();
    }

    if (expiredKeys.length > 0) {
      console.log(`🧹 清理了 ${expiredKeys.length} 个过期缓存项`);
    }
  }

  private async cleanupDiskCache(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      
      for (const file of files) {
        if (file.endsWith('.cache')) {
          const filePath = path.join(this.cacheDir, file);
          
          try {
            const entry = await fs.readJson(filePath);
            if (this.isExpired(entry)) {
              await fs.unlink(filePath);
            }
          } catch (error) {
            // 损坏的文件，直接删除
            await fs.unlink(filePath);
          }
        }
      }
    } catch (error) {
      console.error('清理磁盘缓存失败:', error);
    }
  }
}