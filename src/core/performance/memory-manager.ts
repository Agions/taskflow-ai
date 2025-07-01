/**
 * 内存管理器 - 优化TaskFlow AI的内存使用
 * 提供内存监控、垃圾回收、内存泄漏检测等功能
 */

import { Logger } from '../../infra/logger';
import { ConfigManager } from '../../infra/config';

/**
 * 内存使用统计
 */
export interface MemoryStats {
  heapUsed: number;                           // 已使用堆内存(MB)
  heapTotal: number;                          // 总堆内存(MB)
  external: number;                           // 外部内存(MB)
  rss: number;                               // 常驻集大小(MB)
  arrayBuffers: number;                       // ArrayBuffer内存(MB)
  timestamp: Date;
}

/**
 * 内存阈值配置
 */
export interface MemoryThresholds {
  warning: number;                            // 警告阈值(MB)
  critical: number;                           // 严重阈值(MB)
  maximum: number;                            // 最大阈值(MB)
}

/**
 * 内存泄漏检测结果
 */
export interface MemoryLeakDetection {
  isLeaking: boolean;
  growthRate: number;                         // 增长率(MB/min)
  suspiciousObjects: string[];
  recommendations: string[];
}

/**
 * 对象池接口
 */
interface ObjectPool<T> {
  acquire(): T;
  release(obj: T): void;
  size(): number;
  clear(): void;
}

/**
 * 内存管理器类
 */
export class MemoryManager {
  private logger: Logger;
  private configManager: ConfigManager;
  private thresholds: MemoryThresholds;
  private memoryHistory: MemoryStats[] = [];
  private objectPools: Map<string, ObjectPool<any>> = new Map();
  private weakRefs: Set<WeakRef<any>> = new Set();
  private monitoringInterval?: NodeJS.Timeout;
  private gcInterval?: NodeJS.Timeout;

  constructor(logger: Logger, configManager: ConfigManager) {
    this.logger = logger;
    this.configManager = configManager;
    this.thresholds = this.loadMemoryThresholds();
    
    this.startMemoryMonitoring();
    this.startPeriodicGC();
    this.setupProcessHandlers();
  }

  /**
   * 获取当前内存统计
   */
  public getCurrentMemoryStats(): MemoryStats {
    const usage = process.memoryUsage();
    
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024),
      arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024),
      timestamp: new Date()
    };
  }

  /**
   * 获取内存历史记录
   */
  public getMemoryHistory(): MemoryStats[] {
    return [...this.memoryHistory];
  }

  /**
   * 检测内存泄漏
   */
  public detectMemoryLeak(): MemoryLeakDetection {
    if (this.memoryHistory.length < 10) {
      return {
        isLeaking: false,
        growthRate: 0,
        suspiciousObjects: [],
        recommendations: ['需要更多数据来检测内存泄漏']
      };
    }

    // 计算内存增长率
    const recent = this.memoryHistory.slice(-10);
    const growthRate = this.calculateGrowthRate(recent);
    
    // 判断是否存在内存泄漏
    const isLeaking = growthRate > 5; // 每分钟增长超过5MB认为可能泄漏
    
    const suspiciousObjects = this.identifySuspiciousObjects();
    const recommendations = this.generateRecommendations(growthRate, suspiciousObjects);

    return {
      isLeaking,
      growthRate,
      suspiciousObjects,
      recommendations
    };
  }

  /**
   * 强制垃圾回收
   */
  public forceGarbageCollection(): void {
    if (global.gc) {
      const beforeGC = this.getCurrentMemoryStats();
      global.gc();
      const afterGC = this.getCurrentMemoryStats();
      
      const freed = beforeGC.heapUsed - afterGC.heapUsed;
      this.logger.info(`强制垃圾回收完成，释放内存: ${freed}MB`);
    } else {
      this.logger.warn('垃圾回收不可用，请使用 --expose-gc 启动参数');
    }
  }

  /**
   * 创建对象池
   */
  public createObjectPool<T>(
    name: string,
    factory: () => T,
    reset?: (obj: T) => void,
    maxSize: number = 100
  ): ObjectPool<T> {
    const pool = new SimpleObjectPool<T>(factory, reset, maxSize);
    this.objectPools.set(name, pool);
    return pool;
  }

  /**
   * 获取对象池
   */
  public getObjectPool<T>(name: string): ObjectPool<T> | undefined {
    return this.objectPools.get(name);
  }

  /**
   * 注册弱引用
   */
  public registerWeakRef<T extends object>(obj: T): WeakRef<T> {
    const weakRef = new WeakRef(obj);
    this.weakRefs.add(weakRef);
    return weakRef;
  }

  /**
   * 清理弱引用
   */
  public cleanupWeakRefs(): number {
    let cleaned = 0;
    
    for (const weakRef of this.weakRefs) {
      if (weakRef.deref() === undefined) {
        this.weakRefs.delete(weakRef);
        cleaned++;
      }
    }
    
    this.logger.debug(`清理了 ${cleaned} 个弱引用`);
    return cleaned;
  }

  /**
   * 优化内存使用
   */
  public optimizeMemoryUsage(): void {
    const currentStats = this.getCurrentMemoryStats();
    
    // 检查内存使用情况
    if (currentStats.heapUsed > this.thresholds.warning) {
      this.logger.warn(`内存使用超过警告阈值: ${currentStats.heapUsed}MB`);
      
      // 执行优化措施
      this.performMemoryOptimization();
    }
    
    if (currentStats.heapUsed > this.thresholds.critical) {
      this.logger.error(`内存使用超过严重阈值: ${currentStats.heapUsed}MB`);
      
      // 执行紧急优化
      this.performEmergencyOptimization();
    }
  }

  /**
   * 获取内存使用报告
   */
  public generateMemoryReport(): {
    current: MemoryStats;
    trend: 'increasing' | 'decreasing' | 'stable';
    leakDetection: MemoryLeakDetection;
    objectPools: Array<{ name: string; size: number }>;
    recommendations: string[];
  } {
    const current = this.getCurrentMemoryStats();
    const trend = this.analyzeTrend();
    const leakDetection = this.detectMemoryLeak();
    
    const objectPools = Array.from(this.objectPools.entries()).map(([name, pool]) => ({
      name,
      size: pool.size()
    }));

    const recommendations = this.generateGeneralRecommendations(current, trend, leakDetection);

    return {
      current,
      trend,
      leakDetection,
      objectPools,
      recommendations
    };
  }

  /**
   * 销毁内存管理器
   */
  public destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
    }
    
    // 清理对象池
    this.objectPools.forEach(pool => pool.clear());
    this.objectPools.clear();
    
    // 清理弱引用
    this.weakRefs.clear();
    
    this.logger.info('内存管理器已销毁');
  }

  // 私有方法

  /**
   * 加载内存阈值配置
   */
  private loadMemoryThresholds(): MemoryThresholds {
    return {
      warning: this.configManager.get('memory.thresholds.warning', 512),
      critical: this.configManager.get('memory.thresholds.critical', 1024),
      maximum: this.configManager.get('memory.thresholds.maximum', 2048)
    };
  }

  /**
   * 启动内存监控
   */
  private startMemoryMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      const stats = this.getCurrentMemoryStats();
      this.memoryHistory.push(stats);
      
      // 保持历史记录在合理范围内
      if (this.memoryHistory.length > 1000) {
        this.memoryHistory = this.memoryHistory.slice(-1000);
      }
      
      // 检查内存使用
      this.optimizeMemoryUsage();
      
      // 清理弱引用
      this.cleanupWeakRefs();
      
    }, 30000); // 每30秒监控一次
  }

  /**
   * 启动定期垃圾回收
   */
  private startPeriodicGC(): void {
    const gcInterval = this.configManager.get('memory.gc.interval', 300000); // 5分钟
    
    this.gcInterval = setInterval(() => {
      if (global.gc) {
        this.forceGarbageCollection();
      }
    }, gcInterval);
  }

  /**
   * 设置进程处理器
   */
  private setupProcessHandlers(): void {
    // 监听内存警告
    process.on('warning', (warning) => {
      if (warning.name === 'MaxListenersExceededWarning') {
        this.logger.warn('检测到可能的内存泄漏：事件监听器过多');
      }
    });

    // 监听未捕获异常
    process.on('uncaughtException', (error) => {
      this.logger.error('未捕获异常可能导致内存泄漏:', error);
    });
  }

  /**
   * 计算内存增长率
   */
  private calculateGrowthRate(stats: MemoryStats[]): number {
    if (stats.length < 2) return 0;
    
    const first = stats[0];
    const last = stats[stats.length - 1];
    
    const timeDiff = (last.timestamp.getTime() - first.timestamp.getTime()) / 60000; // 分钟
    const memoryDiff = last.heapUsed - first.heapUsed;
    
    return timeDiff > 0 ? memoryDiff / timeDiff : 0;
  }

  /**
   * 识别可疑对象
   */
  private identifySuspiciousObjects(): string[] {
    const suspicious: string[] = [];
    
    // 检查事件监听器数量
    const emitters = process.listeners('warning');
    if (emitters.length > 10) {
      suspicious.push('事件监听器过多');
    }
    
    // 检查定时器数量
    const activeHandles = (process as any)._getActiveHandles();
    if (activeHandles && activeHandles.length > 50) {
      suspicious.push('活跃句柄过多');
    }
    
    // 检查对象池大小
    for (const [name, pool] of this.objectPools) {
      if (pool.size() > 1000) {
        suspicious.push(`对象池 ${name} 过大`);
      }
    }
    
    return suspicious;
  }

  /**
   * 生成建议
   */
  private generateRecommendations(growthRate: number, suspiciousObjects: string[]): string[] {
    const recommendations: string[] = [];
    
    if (growthRate > 10) {
      recommendations.push('内存增长过快，检查是否存在内存泄漏');
    }
    
    if (suspiciousObjects.includes('事件监听器过多')) {
      recommendations.push('移除不必要的事件监听器');
    }
    
    if (suspiciousObjects.includes('活跃句柄过多')) {
      recommendations.push('清理未关闭的定时器和文件句柄');
    }
    
    if (suspiciousObjects.some(obj => obj.includes('对象池'))) {
      recommendations.push('清理或调整对象池大小');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('内存使用正常，继续监控');
    }
    
    return recommendations;
  }

  /**
   * 分析趋势
   */
  private analyzeTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.memoryHistory.length < 5) return 'stable';
    
    const recent = this.memoryHistory.slice(-5);
    const growthRate = this.calculateGrowthRate(recent);
    
    if (growthRate > 1) return 'increasing';
    if (growthRate < -1) return 'decreasing';
    return 'stable';
  }

  /**
   * 执行内存优化
   */
  private performMemoryOptimization(): void {
    // 清理对象池
    this.objectPools.forEach(pool => {
      if (pool.size() > 100) {
        // 清理一半的对象
        const currentSize = pool.size();
        for (let i = 0; i < currentSize / 2; i++) {
          try {
            const obj = pool.acquire();
            // 不放回池中，让其被垃圾回收
          } catch (error) {
            break;
          }
        }
      }
    });
    
    // 清理弱引用
    this.cleanupWeakRefs();
    
    // 强制垃圾回收
    if (global.gc) {
      this.forceGarbageCollection();
    }
  }

  /**
   * 执行紧急优化
   */
  private performEmergencyOptimization(): void {
    this.logger.warn('执行紧急内存优化');
    
    // 清空所有对象池
    this.objectPools.forEach(pool => pool.clear());
    
    // 清理所有弱引用
    this.weakRefs.clear();
    
    // 多次强制垃圾回收
    if (global.gc) {
      for (let i = 0; i < 3; i++) {
        this.forceGarbageCollection();
      }
    }
  }

  /**
   * 生成通用建议
   */
  private generateGeneralRecommendations(
    current: MemoryStats,
    trend: string,
    leakDetection: MemoryLeakDetection
  ): string[] {
    const recommendations: string[] = [];
    
    if (current.heapUsed > this.thresholds.warning) {
      recommendations.push('内存使用较高，考虑优化代码或增加内存');
    }
    
    if (trend === 'increasing') {
      recommendations.push('内存使用呈上升趋势，需要关注');
    }
    
    if (leakDetection.isLeaking) {
      recommendations.push('检测到可能的内存泄漏，需要立即处理');
    }
    
    if (current.external > current.heapUsed) {
      recommendations.push('外部内存使用较高，检查Buffer和ArrayBuffer使用');
    }
    
    return recommendations;
  }
}

/**
 * 简单对象池实现
 */
class SimpleObjectPool<T> implements ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset?: (obj: T) => void;
  private maxSize: number;

  constructor(factory: () => T, reset?: (obj: T) => void, maxSize: number = 100) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      if (this.reset) {
        this.reset(obj);
      }
      this.pool.push(obj);
    }
  }

  size(): number {
    return this.pool.length;
  }

  clear(): void {
    this.pool.length = 0;
  }
}
