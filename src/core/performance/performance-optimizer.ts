/**
 * 性能优化器 - 提升TaskFlow AI系统性能
 * 包括缓存优化、并发处理、内存管理、算法优化等
 */

import { Logger } from '../../infra/logger';
import { ConfigManager } from '../../infra/config';
import { Task, TaskPlan } from '../../types/task';
import { Requirement } from '../parser/requirement-extractor';

/**
 * 性能指标接口
 */
export interface PerformanceMetrics {
  executionTime: number;                       // 执行时间(ms)
  memoryUsage: number;                         // 内存使用量(MB)
  cpuUsage: number;                           // CPU使用率(%)
  throughput: number;                         // 吞吐量(ops/sec)
  latency: number;                            // 延迟(ms)
  errorRate: number;                          // 错误率(%)
  cacheHitRate: number;                       // 缓存命中率(%)
  concurrency: number;                        // 并发数
}

/**
 * 性能优化配置
 */
export interface OptimizationConfig {
  enableCaching: boolean;
  enableParallelProcessing: boolean;
  enableMemoryOptimization: boolean;
  enableAlgorithmOptimization: boolean;
  maxConcurrency: number;
  cacheSize: number;
  memoryThreshold: number;                    // 内存阈值(MB)
  timeoutThreshold: number;                   // 超时阈值(ms)
}

/**
 * 缓存项接口
 */
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;                                // 生存时间(ms)
  accessCount: number;
  lastAccessed: number;
}

/**
 * 性能优化器类
 */
export class PerformanceOptimizer {
  private logger: Logger;
  private configManager: ConfigManager;
  private config: OptimizationConfig;
  private cache: Map<string, CacheItem<any>> = new Map();
  private metrics: PerformanceMetrics;
  private performanceHistory: PerformanceMetrics[] = [];
  private concurrentTasks: Set<string> = new Set();

  constructor(logger: Logger, configManager: ConfigManager) {
    this.logger = logger;
    this.configManager = configManager;
    this.config = this.loadOptimizationConfig();
    this.metrics = this.initializeMetrics();

    // 启动性能监控
    this.startPerformanceMonitoring();

    // 启动缓存清理
    if (this.config.enableCaching) {
      this.startCacheCleanup();
    }
  }

  /**
   * 优化需求解析性能
   * @param extractFunction 原始提取函数
   * @param content 文档内容
   * @param options 选项
   */
  public async optimizeRequirementExtraction<T>(
    extractFunction: (content: string, options?: any) => Promise<T>,
    content: string,
    options?: any
  ): Promise<T> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey('requirement_extraction', content, options);

    try {
      // 检查缓存
      if (this.config.enableCaching) {
        const cached = this.getFromCache<T>(cacheKey);
        if (cached) {
          this.updateMetrics({ executionTime: Date.now() - startTime, cacheHitRate: 1 });
          return cached;
        }
      }

      // 内存优化：分块处理大文档
      let result: T;
      if (content.length > 100000) { // 100KB以上的文档
        result = await this.processLargeDocument(extractFunction, content, options);
      } else {
        result = await extractFunction(content, options);
      }

      // 缓存结果
      if (this.config.enableCaching) {
        this.setCache(cacheKey, result, 3600000); // 1小时TTL
      }

      this.updateMetrics({
        executionTime: Date.now() - startTime,
        cacheHitRate: 0
      });

      return result;
    } catch (error) {
      this.updateMetrics({
        executionTime: Date.now() - startTime,
        errorRate: 1
      });
      throw error;
    }
  }

  /**
   * 优化任务生成性能
   * @param generateFunction 原始生成函数
   * @param requirements 需求列表
   * @param options 选项
   */
  public async optimizeTaskGeneration(
    generateFunction: (requirements: Requirement[], options?: any) => Promise<TaskPlan>,
    requirements: Requirement[],
    options?: any
  ): Promise<TaskPlan> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey('task_generation', requirements, options);

    try {
      // 检查缓存
      if (this.config.enableCaching) {
        const cached = this.getFromCache<TaskPlan>(cacheKey);
        if (cached) {
          this.updateMetrics({ executionTime: Date.now() - startTime, cacheHitRate: 1 });
          return cached;
        }
      }

      // 并行处理优化
      let result: TaskPlan;
      if (this.config.enableParallelProcessing && requirements.length > 10) {
        result = await this.parallelTaskGeneration(generateFunction, requirements, options);
      } else {
        result = await generateFunction(requirements, options);
      }

      // 算法优化：优化任务依赖关系计算
      if (this.config.enableAlgorithmOptimization) {
        result = this.optimizeTaskDependencies(result);
      }

      // 缓存结果
      if (this.config.enableCaching) {
        this.setCache(cacheKey, result, 1800000); // 30分钟TTL
      }

      this.updateMetrics({
        executionTime: Date.now() - startTime,
        cacheHitRate: 0
      });

      return result;
    } catch (error) {
      this.updateMetrics({
        executionTime: Date.now() - startTime,
        errorRate: 1
      });
      throw error;
    }
  }

  /**
   * 优化AI模型调用性能
   * @param modelFunction 模型调用函数
   * @param input 输入数据
   * @param options 选项
   */
  public async optimizeAIModelCall<T, R>(
    modelFunction: (input: T, options?: any) => Promise<R>,
    input: T,
    options?: any
  ): Promise<R> {
    const startTime = Date.now();
    const taskId = this.generateTaskId();

    try {
      // 并发控制
      if (this.concurrentTasks.size >= this.config.maxConcurrency) {
        await this.waitForAvailableSlot();
      }

      this.concurrentTasks.add(taskId);

      // 超时控制
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI模型调用超时')), this.config.timeoutThreshold);
      });

      const result = await Promise.race([
        modelFunction(input, options),
        timeoutPromise
      ]);

      this.updateMetrics({
        executionTime: Date.now() - startTime,
        concurrency: this.concurrentTasks.size
      });

      return result;
    } catch (error) {
      this.updateMetrics({
        executionTime: Date.now() - startTime,
        errorRate: 1
      });
      throw error;
    } finally {
      this.concurrentTasks.delete(taskId);
    }
  }

  /**
   * 批量优化处理
   * @param items 待处理项目列表
   * @param processor 处理函数
   * @param batchSize 批次大小
   */
  public async batchOptimize<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 10
  ): Promise<R[]> {
    const results: R[] = [];
    const startTime = Date.now();

    try {
      // 分批处理
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);

        // 并行处理批次内的项目
        const batchPromises = batch.map(item =>
          this.withRetry(() => processor(item), 3)
        );

        const batchResults = await Promise.allSettled(batchPromises);

        // 收集成功的结果
        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            this.logger.warn(`批处理项目失败: ${result.reason}`);
          }
        });

        // 内存管理：强制垃圾回收
        if (this.config.enableMemoryOptimization && i % (batchSize * 5) === 0) {
          await this.forceGarbageCollection();
        }
      }

      this.updateMetrics({
        executionTime: Date.now() - startTime,
        throughput: results.length / ((Date.now() - startTime) / 1000)
      });

      return results;
    } catch (error) {
      this.updateMetrics({
        executionTime: Date.now() - startTime,
        errorRate: 1
      });
      throw error;
    }
  }

  /**
   * 获取性能指标
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 获取性能历史
   */
  public getPerformanceHistory(): PerformanceMetrics[] {
    return [...this.performanceHistory];
  }

  /**
   * 获取缓存统计
   */
  public getCacheStats(): {
    size: number;
    hitRate: number;
    memoryUsage: number;
  } {
    const totalAccess = Array.from(this.cache.values())
      .reduce((sum, item) => sum + item.accessCount, 0);

    const hits = Array.from(this.cache.values())
      .reduce((sum, item) => sum + (item.accessCount > 1 ? item.accessCount - 1 : 0), 0);

    const memoryUsage = this.estimateCacheMemoryUsage();

    return {
      size: this.cache.size,
      hitRate: totalAccess > 0 ? hits / totalAccess : 0,
      memoryUsage
    };
  }

  /**
   * 清理缓存
   */
  public clearCache(): void {
    this.cache.clear();
    this.logger.info('缓存已清理');
  }

  /**
   * 优化系统配置
   */
  public optimizeConfiguration(): void {
    const currentMetrics = this.getMetrics();

    // 基于性能指标调整配置
    if (currentMetrics.memoryUsage > this.config.memoryThreshold) {
      this.config.cacheSize = Math.max(this.config.cacheSize * 0.8, 100);
      this.logger.info(`内存使用过高，减少缓存大小到 ${this.config.cacheSize}`);
    }

    if (currentMetrics.latency > this.config.timeoutThreshold * 0.8) {
      this.config.maxConcurrency = Math.max(this.config.maxConcurrency - 1, 1);
      this.logger.info(`延迟过高，减少最大并发数到 ${this.config.maxConcurrency}`);
    }

    if (currentMetrics.errorRate > 0.05) { // 错误率超过5%
      this.config.timeoutThreshold *= 1.2;
      this.logger.info(`错误率过高，增加超时阈值到 ${this.config.timeoutThreshold}ms`);
    }
  }

  // 私有方法

  /**
   * 加载优化配置
   */
  private loadOptimizationConfig(): OptimizationConfig {
    return {
      enableCaching: this.configManager.get('performance.caching.enabled', true),
      enableParallelProcessing: this.configManager.get('performance.parallel.enabled', true),
      enableMemoryOptimization: this.configManager.get('performance.memory.enabled', true),
      enableAlgorithmOptimization: this.configManager.get('performance.algorithm.enabled', true),
      maxConcurrency: this.configManager.get('performance.maxConcurrency', 5),
      cacheSize: this.configManager.get('performance.cacheSize', 1000),
      memoryThreshold: this.configManager.get('performance.memoryThreshold', 512),
      timeoutThreshold: this.configManager.get('performance.timeoutThreshold', 30000)
    };
  }

  /**
   * 初始化性能指标
   */
  private initializeMetrics(): PerformanceMetrics {
    return {
      executionTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      throughput: 0,
      latency: 0,
      errorRate: 0,
      cacheHitRate: 0,
      concurrency: 0
    };
  }

  /**
   * 更新性能指标
   */
  private updateMetrics(updates: Partial<PerformanceMetrics>): void {
    Object.assign(this.metrics, updates);

    // 更新内存和CPU使用率
    this.metrics.memoryUsage = this.getCurrentMemoryUsage();
    this.metrics.cpuUsage = this.getCurrentCpuUsage();

    // 记录历史
    this.performanceHistory.push({ ...this.metrics });

    // 保持历史记录在合理范围内
    if (this.performanceHistory.length > 1000) {
      this.performanceHistory = this.performanceHistory.slice(-1000);
    }
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(operation: string, ...args: any[]): string {
    const hash = this.simpleHash(JSON.stringify(args));
    return `${operation}_${hash}`;
  }

  /**
   * 简单哈希函数
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 从缓存获取数据
   */
  private getFromCache<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    // 更新访问信息
    item.accessCount++;
    item.lastAccessed = Date.now();

    return item.data;
  }

  /**
   * 设置缓存数据
   */
  private setCache<T>(key: string, data: T, ttl: number): void {
    // 检查缓存大小限制
    if (this.cache.size >= this.config.cacheSize) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 1,
      lastAccessed: Date.now()
    });
  }

  /**
   * 驱逐最近最少使用的缓存项
   */
  private evictLeastRecentlyUsed(): void {
    let lruKey: string | null = null;
    let lruTime = Date.now();

    for (const [key, item] of this.cache) {
      if (item.lastAccessed < lruTime) {
        lruTime = item.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * 处理大文档
   */
  private async processLargeDocument<T>(
    extractFunction: (content: string, options?: any) => Promise<T>,
    content: string,
    options?: any
  ): Promise<T> {
    // 将大文档分块处理
    const chunkSize = 50000; // 50KB per chunk
    const chunks: string[] = [];

    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push(content.slice(i, i + chunkSize));
    }

    // 并行处理各个块
    const chunkResults = await Promise.all(
      chunks.map(chunk => extractFunction(chunk, options))
    );

    // 合并结果（这里需要根据具体的返回类型实现合并逻辑）
    return this.mergeResults(chunkResults);
  }

  /**
   * 合并结果
   */
  private mergeResults<T>(results: T[]): T {
    // 这里需要根据具体的数据类型实现合并逻辑
    // 为了示例，假设结果是数组类型
    if (Array.isArray(results[0])) {
      return results.flat() as unknown as T;
    }

    // 对于对象类型，合并属性
    if (typeof results[0] === 'object') {
      return Object.assign({}, ...results);
    }

    // 对于其他类型，返回第一个结果
    return results[0];
  }

  /**
   * 并行任务生成
   */
  private async parallelTaskGeneration(
    generateFunction: (requirements: Requirement[], options?: any) => Promise<TaskPlan>,
    requirements: Requirement[],
    options?: any
  ): Promise<TaskPlan> {
    // 将需求分组并行处理
    const groupSize = Math.ceil(requirements.length / this.config.maxConcurrency);
    const groups: Requirement[][] = [];

    for (let i = 0; i < requirements.length; i += groupSize) {
      groups.push(requirements.slice(i, i + groupSize));
    }

    // 并行处理各组
    const groupResults = await Promise.all(
      groups.map(group => generateFunction(group, options))
    );

    // 合并任务计划
    return this.mergeTaskPlans(groupResults);
  }

  /**
   * 合并任务计划
   */
  private mergeTaskPlans(plans: TaskPlan[]): TaskPlan {
    if (plans.length === 0) {
      throw new Error('没有任务计划可合并');
    }

    const mergedPlan: TaskPlan = {
      id: plans[0].id,
      name: plans[0].name,
      description: plans[0].description,
      tasks: [],
      createdAt: plans[0].createdAt,
      updatedAt: new Date(),
      dueDate: plans[0].dueDate,
      status: plans[0].status || 'draft'
    };

    // 合并所有任务
    plans.forEach(plan => {
      mergedPlan.tasks.push(...plan.tasks);
    });

    return mergedPlan;
  }

  /**
   * 优化任务依赖关系
   */
  private optimizeTaskDependencies(taskPlan: TaskPlan): TaskPlan {
    // 使用拓扑排序优化任务顺序
    const optimizedTasks = this.topologicalSort(taskPlan.tasks);

    return {
      ...taskPlan,
      tasks: optimizedTasks
    };
  }

  /**
   * 拓扑排序
   */
  private topologicalSort(tasks: Task[]): Task[] {
    const taskMap = new Map(tasks.map(task => [task.id, task]));
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const result: Task[] = [];

    const visit = (taskId: string) => {
      if (visiting.has(taskId)) {
        throw new Error(`检测到循环依赖: ${taskId}`);
      }

      if (visited.has(taskId)) {
        return;
      }

      visiting.add(taskId);

      const task = taskMap.get(taskId);
      if (task) {
        task.dependencies.forEach(depId => {
          if (taskMap.has(depId)) {
            visit(depId);
          }
        });

        visiting.delete(taskId);
        visited.add(taskId);
        result.push(task);
      }
    };

    tasks.forEach(task => {
      if (!visited.has(task.id)) {
        visit(task.id);
      }
    });

    return result;
  }

  /**
   * 重试机制
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (i === maxRetries) {
          break;
        }

        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }

    throw lastError!;
  }

  /**
   * 等待可用槽位
   */
  private async waitForAvailableSlot(): Promise<void> {
    return new Promise(resolve => {
      const checkSlot = () => {
        if (this.concurrentTasks.size < this.config.maxConcurrency) {
          resolve();
        } else {
          setTimeout(checkSlot, 100);
        }
      };
      checkSlot();
    });
  }

  /**
   * 生成任务ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 强制垃圾回收
   */
  private async forceGarbageCollection(): Promise<void> {
    if (global.gc) {
      global.gc();
    }

    // 等待一小段时间让垃圾回收完成
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * 获取当前内存使用量
   */
  private getCurrentMemoryUsage(): number {
    const usage = process.memoryUsage();
    return Math.round(usage.heapUsed / 1024 / 1024); // MB
  }

  /**
   * 获取当前CPU使用率
   */
  private getCurrentCpuUsage(): number {
    // 简化的CPU使用率计算
    const usage = process.cpuUsage();
    return Math.round((usage.user + usage.system) / 1000000); // 转换为百分比
  }

  /**
   * 估算缓存内存使用量
   */
  private estimateCacheMemoryUsage(): number {
    let totalSize = 0;

    for (const item of this.cache.values()) {
      totalSize += this.estimateObjectSize(item.data);
    }

    return Math.round(totalSize / 1024 / 1024); // MB
  }

  /**
   * 估算对象大小
   */
  private estimateObjectSize(obj: any): number {
    const jsonString = JSON.stringify(obj);
    return new Blob([jsonString]).size;
  }

  /**
   * 启动性能监控
   */
  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.updateMetrics({});

      // 自动优化配置
      if (this.performanceHistory.length > 10) {
        this.optimizeConfiguration();
      }
    }, 60000); // 每分钟更新一次
  }

  /**
   * 启动缓存清理
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();

      for (const [key, item] of this.cache) {
        if (now - item.timestamp > item.ttl) {
          this.cache.delete(key);
        }
      }
    }, 300000); // 每5分钟清理一次过期缓存
  }
}
