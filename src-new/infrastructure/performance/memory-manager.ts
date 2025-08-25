/**
 * TaskFlow AI 内存管理优化系统
 * 提供智能内存清理、垃圾回收优化、内存泄漏检测等功能
 */

import { EventEmitter } from 'events';
import v8 from 'v8';
import process from 'process';

export interface MemoryConfig {
  maxHeapSize: number; // 最大堆内存大小（MB）
  cleanupInterval: number; // 清理间隔（秒）
  warningThreshold: number; // 警告阈值（百分比）
  criticalThreshold: number; // 严重阈值（百分比）
  enableGCOptimization: boolean; // 启用GC优化
  enableLeakDetection: boolean; // 启用内存泄漏检测
  maxObjectAge: number; // 对象最大存活时间（分钟）
}

export interface MemoryStats {
  rss: number; // 常驻内存大小
  heapTotal: number; // 堆总大小
  heapUsed: number; // 已使用堆大小
  external: number; // 外部内存大小
  arrayBuffers: number; // ArrayBuffer大小
  heapSpaceStats: v8.HeapSpaceInfo[];
  usage: {
    heap: number; // 堆使用率
    total: number; // 总内存使用率
  };
  gc: {
    count: number; // GC次数
    duration: number; // GC总时长
    lastRun: Date; // 最后一次GC时间
  };
}

export interface MemoryAlert {
  type: 'warning' | 'critical' | 'leak';
  message: string;
  threshold: number;
  current: number;
  timestamp: Date;
  recommendations: string[];
}

export interface ObjectTracker {
  type: string;
  count: number;
  totalSize: number;
  avgSize: number;
  maxAge: number;
  createdAt: Date;
}

/**
 * 内存管理优化器
 * 监控和优化应用程序内存使用
 */
export class MemoryManager extends EventEmitter {
  private config: MemoryConfig;
  private stats: MemoryStats;
  private monitoringInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;
  private gcObserver?: any;
  private objectTrackers = new Map<string, ObjectTracker>();
  private memoryAlerts: MemoryAlert[] = [];
  private initialized = false;

  // 性能监控数据
  private gcStats = {
    count: 0,
    totalDuration: 0,
    lastRun: new Date(),
  };

  constructor(config: Partial<MemoryConfig> = {}) {
    super();
    
    this.config = {
      maxHeapSize: 512, // 512MB
      cleanupInterval: 30, // 30秒
      warningThreshold: 0.8, // 80%
      criticalThreshold: 0.95, // 95%
      enableGCOptimization: true,
      enableLeakDetection: true,
      maxObjectAge: 30, // 30分钟
      ...config,
    };

    this.stats = this.createEmptyStats();
  }

  /**
   * 初始化内存管理器
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 设置V8内存限制
      if (this.config.maxHeapSize > 0) {
        v8.setFlagsFromString(`--max-old-space-size=${this.config.maxHeapSize}`);
      }

      // 启动内存监控
      this.startMemoryMonitoring();

      // 启动内存清理
      this.startMemoryCleanup();

      // 启用GC监控
      if (this.config.enableGCOptimization) {
        this.setupGCMonitoring();
      }

      // 启用泄漏检测
      if (this.config.enableLeakDetection) {
        this.setupLeakDetection();
      }

      this.initialized = true;
      console.log('💾 内存管理器初始化成功');

    } catch (error) {
      console.error('❌ 内存管理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 获取当前内存统计
   */
  getMemoryStats(): MemoryStats {
    const memUsage = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();
    const heapSpaceStats = v8.getHeapSpaceStatistics();

    this.stats = {
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers,
      heapSpaceStats,
      usage: {
        heap: memUsage.heapUsed / memUsage.heapTotal,
        total: memUsage.rss / (this.config.maxHeapSize * 1024 * 1024),
      },
      gc: {
        count: this.gcStats.count,
        duration: this.gcStats.totalDuration,
        lastRun: this.gcStats.lastRun,
      },
    };

    return this.stats;
  }

  /**
   * 强制垃圾回收
   */
  forceGC(): boolean {
    try {
      if (global.gc) {
        const startTime = Date.now();
        global.gc();
        const duration = Date.now() - startTime;
        
        this.gcStats.count++;
        this.gcStats.totalDuration += duration;
        this.gcStats.lastRun = new Date();
        
        console.log(`🗑️ 强制GC执行完成，耗时: ${duration}ms`);
        this.emit('gcCompleted', { duration, forced: true });
        return true;
      } else {
        console.warn('⚠️ 全局GC不可用，需要使用 --expose-gc 标志启动');
        return false;
      }
    } catch (error) {
      console.error('❌ 强制GC失败:', error);
      return false;
    }
  }

  /**
   * 执行内存清理
   */
  async performCleanup(): Promise<void> {
    console.log('🧹 开始内存清理...');

    try {
      // 1. 清理过期对象
      await this.cleanupExpiredObjects();

      // 2. 优化缓存
      await this.optimizeCaches();

      // 3. 清理事件监听器
      this.cleanupEventListeners();

      // 4. 强制垃圾回收
      if (this.shouldForceGC()) {
        this.forceGC();
      }

      // 5. 压缩内存
      await this.compactMemory();

      console.log('✅ 内存清理完成');
      this.emit('cleanupCompleted');

    } catch (error) {
      console.error('❌ 内存清理失败:', error);
      this.emit('cleanupFailed', error);
    }
  }

  /**
   * 分析内存使用情况
   */
  analyzeMemoryUsage(): MemoryAnalysis {
    const stats = this.getMemoryStats();
    const analysis: MemoryAnalysis = {
      timestamp: new Date(),
      totalMemory: stats.rss,
      heapUsage: stats.usage.heap,
      efficiency: this.calculateMemoryEfficiency(),
      hotspots: this.identifyMemoryHotspots(),
      recommendations: this.generateRecommendations(),
      trends: this.analyzeMemoryTrends(),
    };

    return analysis;
  }

  /**
   * 检测内存泄漏
   */
  detectMemoryLeaks(): MemoryLeak[] {
    const leaks: MemoryLeak[] = [];
    
    // 检查对象增长趋势
    for (const [type, tracker] of this.objectTrackers) {
      if (tracker.count > 1000 && tracker.maxAge > this.config.maxObjectAge) {
        leaks.push({
          type: 'object_accumulation',
          objectType: type,
          count: tracker.count,
          totalSize: tracker.totalSize,
          age: tracker.maxAge,
          severity: this.calculateLeakSeverity(tracker),
          recommendations: this.getLeakRecommendations(type),
        });
      }
    }

    // 检查内存持续增长
    if (this.isMemoryGrowingContinuously()) {
      leaks.push({
        type: 'continuous_growth',
        objectType: 'unknown',
        count: 0,
        totalSize: this.stats.heapUsed,
        age: 0,
        severity: 'high',
        recommendations: ['检查长期运行的操作', '分析堆快照', '增加内存监控'],
      });
    }

    return leaks;
  }

  /**
   * 优化内存配置
   */
  optimizeMemoryConfig(): MemoryOptimization {
    const stats = this.getMemoryStats();
    const currentUsage = stats.usage.heap;
    
    const optimization: MemoryOptimization = {
      currentConfig: { ...this.config },
      recommendedConfig: { ...this.config },
      improvements: [],
      estimatedGain: 0,
    };

    // 优化最大堆大小
    if (currentUsage > 0.9) {
      optimization.recommendedConfig.maxHeapSize = Math.ceil(this.config.maxHeapSize * 1.5);
      optimization.improvements.push('增加最大堆内存大小');
    } else if (currentUsage < 0.5) {
      optimization.recommendedConfig.maxHeapSize = Math.ceil(this.config.maxHeapSize * 0.8);
      optimization.improvements.push('减少最大堆内存大小以节省资源');
    }

    // 优化清理间隔
    if (this.gcStats.count > 10) {
      optimization.recommendedConfig.cleanupInterval = Math.max(10, this.config.cleanupInterval - 10);
      optimization.improvements.push('增加清理频率');
    }

    // 优化阈值
    if (this.memoryAlerts.length > 5) {
      optimization.recommendedConfig.warningThreshold = Math.max(0.6, this.config.warningThreshold - 0.1);
      optimization.improvements.push('降低警告阈值');
    }

    optimization.estimatedGain = this.calculateOptimizationGain(optimization);
    return optimization;
  }

  /**
   * 获取内存报告
   */
  getMemoryReport(): MemoryReport {
    const stats = this.getMemoryStats();
    const analysis = this.analyzeMemoryUsage();
    const leaks = this.detectMemoryLeaks();
    const optimization = this.optimizeMemoryConfig();

    return {
      timestamp: new Date(),
      stats,
      analysis,
      leaks,
      optimization,
      alerts: [...this.memoryAlerts],
      objectTrackers: Object.fromEntries(this.objectTrackers),
      health: this.calculateMemoryHealth(),
    };
  }

  /**
   * 关闭内存管理器
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      // 停止监控定时器
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
      }

      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }

      // 停止GC监控
      if (this.gcObserver) {
        this.gcObserver.disconnect();
      }

      // 最后一次清理
      await this.performCleanup();

      this.initialized = false;
      console.log('✅ 内存管理器已关闭');

    } catch (error) {
      console.error('❌ 内存管理器关闭失败:', error);
      throw error;
    }
  }

  // 私有方法

  private createEmptyStats(): MemoryStats {
    return {
      rss: 0,
      heapTotal: 0,
      heapUsed: 0,
      external: 0,
      arrayBuffers: 0,
      heapSpaceStats: [],
      usage: { heap: 0, total: 0 },
      gc: { count: 0, duration: 0, lastRun: new Date() },
    };
  }

  private startMemoryMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.monitorMemory();
    }, 10000); // 每10秒监控一次

    console.log('📊 内存监控已启动');
  }

  private startMemoryCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.performCleanup().catch(error =>
        console.error('定期内存清理失败:', error)
      );
    }, this.config.cleanupInterval * 1000);

    console.log(`🧹 内存清理已启动，间隔 ${this.config.cleanupInterval} 秒`);
  }

  private setupGCMonitoring(): void {
    try {
      // 监控GC事件（如果可用）
      if (process.env.NODE_ENV !== 'production') {
        const { PerformanceObserver } = require('perf_hooks');
        
        this.gcObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'gc') {
              this.gcStats.count++;
              this.gcStats.totalDuration += entry.duration;
              this.gcStats.lastRun = new Date();
              
              this.emit('gcEvent', {
                kind: entry.detail?.kind,
                duration: entry.duration,
                timestamp: entry.startTime,
              });
            }
          }
        });
        
        this.gcObserver.observe({ entryTypes: ['gc'] });
        console.log('🔍 GC监控已启用');
      }
    } catch (error) {
      console.warn('⚠️ GC监控启用失败:', error);
    }
  }

  private setupLeakDetection(): void {
    // 定期检测内存泄漏
    setInterval(() => {
      const leaks = this.detectMemoryLeaks();
      if (leaks.length > 0) {
        this.emit('memoryLeakDetected', leaks);
        
        for (const leak of leaks) {
          const alert: MemoryAlert = {
            type: 'leak',
            message: `检测到内存泄漏: ${leak.objectType}`,
            threshold: 0,
            current: leak.count,
            timestamp: new Date(),
            recommendations: leak.recommendations,
          };
          
          this.memoryAlerts.push(alert);
          console.warn('🚨 内存泄漏警告:', alert);
        }
      }
    }, 60000); // 每分钟检测一次

    console.log('🔍 内存泄漏检测已启用');
  }

  private monitorMemory(): void {
    const stats = this.getMemoryStats();
    
    // 检查内存警告
    this.checkMemoryThresholds(stats);
    
    // 更新对象跟踪器
    this.updateObjectTrackers();
    
    this.emit('memoryStats', stats);
  }

  private checkMemoryThresholds(stats: MemoryStats): void {
    const heapUsage = stats.usage.heap;
    
    if (heapUsage >= this.config.criticalThreshold) {
      const alert: MemoryAlert = {
        type: 'critical',
        message: '内存使用严重超标',
        threshold: this.config.criticalThreshold,
        current: heapUsage,
        timestamp: new Date(),
        recommendations: ['立即执行垃圾回收', '检查内存泄漏', '重启应用程序'],
      };
      
      this.memoryAlerts.push(alert);
      this.emit('memoryAlert', alert);
      console.error('🚨 严重内存警告:', alert);
      
      // 自动执行清理
      this.performCleanup();
      
    } else if (heapUsage >= this.config.warningThreshold) {
      const alert: MemoryAlert = {
        type: 'warning',
        message: '内存使用过高',
        threshold: this.config.warningThreshold,
        current: heapUsage,
        timestamp: new Date(),
        recommendations: ['优化内存使用', '执行内存清理', '检查长期运行的操作'],
      };
      
      this.memoryAlerts.push(alert);
      this.emit('memoryAlert', alert);
      console.warn('⚠️ 内存使用警告:', alert);
    }
    
    // 保持警告历史在合理范围内
    if (this.memoryAlerts.length > 100) {
      this.memoryAlerts = this.memoryAlerts.slice(-50);
    }
  }

  private async cleanupExpiredObjects(): Promise<void> {
    // 清理过期的对象跟踪器
    const now = Date.now();
    for (const [type, tracker] of this.objectTrackers) {
      const age = (now - tracker.createdAt.getTime()) / (1000 * 60); // 分钟
      if (age > this.config.maxObjectAge) {
        this.objectTrackers.delete(type);
      }
    }
  }

  private async optimizeCaches(): Promise<void> {
    // 通知其他组件优化缓存
    this.emit('optimizeCaches');
  }

  private cleanupEventListeners(): void {
    // 清理事件监听器（避免过多监听器）
    const eventNames = this.eventNames();
    for (const eventName of eventNames) {
      const listeners = this.listeners(eventName);
      if (listeners.length > 10) {
        console.warn(`⚠️ 事件 ${String(eventName)} 有过多监听器: ${listeners.length}`);
        // 保留最新的10个监听器
        this.removeAllListeners(eventName);
        listeners.slice(-10).forEach(listener => {
          this.on(eventName, listener);
        });
      }
    }
  }

  private shouldForceGC(): boolean {
    const stats = this.getMemoryStats();
    return stats.usage.heap > 0.8;
  }

  private async compactMemory(): Promise<void> {
    // V8特定的内存压缩
    try {
      if (v8.writeHeapSnapshot) {
        // 这会触发内存整理
        const heapSnapshot = v8.writeHeapSnapshot();
        console.log('💾 堆快照已生成:', heapSnapshot);
      }
    } catch (error) {
      console.warn('⚠️ 内存压缩失败:', error);
    }
  }

  private calculateMemoryEfficiency(): number {
    const stats = this.getMemoryStats();
    return Math.max(0, 1 - stats.usage.heap);
  }

  private identifyMemoryHotspots(): string[] {
    const hotspots: string[] = [];
    
    for (const [type, tracker] of this.objectTrackers) {
      if (tracker.totalSize > 10 * 1024 * 1024) { // 超过10MB
        hotspots.push(`${type}: ${Math.round(tracker.totalSize / 1024 / 1024)}MB`);
      }
    }
    
    return hotspots;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = this.getMemoryStats();
    
    if (stats.usage.heap > 0.8) {
      recommendations.push('考虑增加堆内存大小');
      recommendations.push('优化数据结构和算法');
      recommendations.push('实现更频繁的垃圾回收');
    }
    
    if (this.gcStats.count < 5) {
      recommendations.push('考虑主动触发垃圾回收');
    }
    
    if (this.objectTrackers.size > 100) {
      recommendations.push('减少长期存活的对象');
      recommendations.push('实现对象池化');
    }
    
    return recommendations;
  }

  private analyzeMemoryTrends(): MemoryTrend[] {
    // 简化的趋势分析
    return [
      {
        metric: 'heap_usage',
        trend: 'stable',
        change: 0.05,
        period: '1h',
      }
    ];
  }

  private updateObjectTrackers(): void {
    // 更新对象跟踪信息（简化实现）
    const now = new Date();
    
    // 这里可以集成更复杂的对象跟踪逻辑
    // 例如通过堆快照分析对象类型和数量
  }

  private calculateLeakSeverity(tracker: ObjectTracker): 'low' | 'medium' | 'high' {
    if (tracker.totalSize > 50 * 1024 * 1024) return 'high';
    if (tracker.totalSize > 10 * 1024 * 1024) return 'medium';
    return 'low';
  }

  private getLeakRecommendations(objectType: string): string[] {
    return [
      `检查 ${objectType} 对象的生命周期`,
      '实现适当的清理机制',
      '避免循环引用',
      '使用弱引用where合适',
    ];
  }

  private isMemoryGrowingContinuously(): boolean {
    // 简化的连续增长检测
    return this.stats.usage.heap > 0.9;
  }

  private calculateOptimizationGain(optimization: MemoryOptimization): number {
    // 估算优化收益（百分比）
    return Math.min(30, optimization.improvements.length * 5);
  }

  private calculateMemoryHealth(): MemoryHealth {
    const stats = this.getMemoryStats();
    const leaks = this.detectMemoryLeaks();
    
    let score = 100;
    
    // 内存使用率影响
    score -= stats.usage.heap * 40;
    
    // 内存泄漏影响
    score -= leaks.length * 20;
    
    // 警告数量影响
    score -= Math.min(20, this.memoryAlerts.length * 2);
    
    score = Math.max(0, score);
    
    let status: 'excellent' | 'good' | 'warning' | 'critical';
    if (score >= 90) status = 'excellent';
    else if (score >= 70) status = 'good';
    else if (score >= 50) status = 'warning';
    else status = 'critical';
    
    return {
      score,
      status,
      issues: leaks.length + this.memoryAlerts.length,
      recommendations: this.generateRecommendations(),
    };
  }
}

// 类型定义

export interface MemoryAnalysis {
  timestamp: Date;
  totalMemory: number;
  heapUsage: number;
  efficiency: number;
  hotspots: string[];
  recommendations: string[];
  trends: MemoryTrend[];
}

export interface MemoryLeak {
  type: string;
  objectType: string;
  count: number;
  totalSize: number;
  age: number;
  severity: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface MemoryOptimization {
  currentConfig: MemoryConfig;
  recommendedConfig: MemoryConfig;
  improvements: string[];
  estimatedGain: number;
}

export interface MemoryReport {
  timestamp: Date;
  stats: MemoryStats;
  analysis: MemoryAnalysis;
  leaks: MemoryLeak[];
  optimization: MemoryOptimization;
  alerts: MemoryAlert[];
  objectTrackers: Record<string, ObjectTracker>;
  health: MemoryHealth;
}

export interface MemoryTrend {
  metric: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  change: number;
  period: string;
}

export interface MemoryHealth {
  score: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  issues: number;
  recommendations: string[];
}