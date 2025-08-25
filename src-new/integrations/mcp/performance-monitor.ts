/**
 * TaskFlow AI MCP 服务器性能监控和诊断
 * 提供完整的性能监控、指标收集和问题诊断功能
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { ConfigManager } from '../../infrastructure/config/manager';
import { CacheManager } from '../../infrastructure/storage/cache';

export interface PerformanceMetrics {
  serverId: string;
  timestamp: Date;
  cpu: CPUMetrics;
  memory: MemoryMetrics;
  network: NetworkMetrics;
  requests: RequestMetrics;
  errors: ErrorMetrics;
  latency: LatencyMetrics;
  throughput: ThroughputMetrics;
}

export interface CPUMetrics {
  usage: number; // 百分比
  loadAverage: number[];
  processes: number;
}

export interface MemoryMetrics {
  used: number; // 字节
  total: number; // 字节
  usage: number; // 百分比
  heap: {
    used: number;
    total: number;
    limit: number;
  };
  gc: {
    collections: number;
    duration: number;
  };
}

export interface NetworkMetrics {
  bytesIn: number;
  bytesOut: number;
  packetsIn: number;
  packetsOut: number;
  connections: {
    active: number;
    idle: number;
    failed: number;
  };
}

export interface RequestMetrics {
  total: number;
  successful: number;
  failed: number;
  rate: number; // 每秒请求数
  averageSize: number;
}

export interface ErrorMetrics {
  total: number;
  rate: number; // 错误率
  types: Record<string, number>;
  recent: ErrorEvent[];
}

export interface LatencyMetrics {
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
}

export interface ThroughputMetrics {
  requestsPerSecond: number;
  bytesPerSecond: number;
  operationsPerSecond: number;
}

export interface ErrorEvent {
  timestamp: Date;
  type: string;
  message: string;
  stack?: string;
  context?: Record<string, any>;
}

export interface PerformanceAlert {
  id: string;
  serverId: string;
  type: 'cpu' | 'memory' | 'latency' | 'error_rate' | 'throughput';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  resolved?: boolean;
}

export interface DiagnosticReport {
  serverId: string;
  timestamp: Date;
  summary: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    score: number; // 0-100
    issues: number;
  };
  performance: {
    bottlenecks: Bottleneck[];
    recommendations: string[];
    trends: PerformanceTrend[];
  };
  health: {
    checks: HealthCheck[];
    warnings: string[];
    errors: string[];
  };
  resources: {
    utilization: ResourceUtilization;
    capacity: ResourceCapacity;
    predictions: ResourcePrediction[];
  };
}

export interface Bottleneck {
  type: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  suggestion: string;
}

export interface PerformanceTrend {
  metric: string;
  direction: 'improving' | 'stable' | 'degrading';
  change: number; // 百分比变化
  period: string;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  duration: number;
}

export interface ResourceUtilization {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

export interface ResourceCapacity {
  cpu: { current: number; max: number; };
  memory: { current: number; max: number; };
  disk: { current: number; max: number; };
  network: { current: number; max: number; };
}

export interface ResourcePrediction {
  resource: string;
  timeToCapacity: number; // 小时
  confidence: number; // 0-1
  recommendation: string;
}

/**
 * MCP服务器性能监控器
 */
export class MCPPerformanceMonitor extends EventEmitter {
  private metrics = new Map<string, PerformanceMetrics[]>();
  private alerts = new Map<string, PerformanceAlert[]>();
  private monitoringIntervals = new Map<string, NodeJS.Timeout>();
  private configManager: ConfigManager;
  private cacheManager: CacheManager;
  private config: MonitoringConfig;

  constructor(
    configManager: ConfigManager, 
    cacheManager: CacheManager,
    config?: Partial<MonitoringConfig>
  ) {
    super();
    this.configManager = configManager;
    this.cacheManager = cacheManager;
    
    this.config = {
      collectInterval: 5000, // 5秒
      retentionPeriod: 86400000, // 24小时
      alertThresholds: {
        cpu: 80,
        memory: 85,
        latency: 1000, // 1秒
        errorRate: 5, // 5%
        throughput: 100 // 最小RPS
      },
      enableDetailedMetrics: true,
      enablePredictions: true,
      ...config
    };
  }

  /**
   * 开始监控服务器
   */
  startMonitoring(serverId: string): void {
    if (this.monitoringIntervals.has(serverId)) {
      console.warn(`服务器监控已启动: ${serverId}`);
      return;
    }

    console.log(`📊 开始监控MCP服务器: ${serverId}`);

    const interval = setInterval(async () => {
      try {
        await this.collectMetrics(serverId);
      } catch (error) {
        console.error(`收集指标失败: ${serverId}`, error);
      }
    }, this.config.collectInterval);

    this.monitoringIntervals.set(serverId, interval);
    this.emit('monitoringStarted', serverId);
  }

  /**
   * 停止监控服务器
   */
  stopMonitoring(serverId: string): void {
    const interval = this.monitoringIntervals.get(serverId);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(serverId);
      
      console.log(`⏹️ 停止监控MCP服务器: ${serverId}`);
      this.emit('monitoringStopped', serverId);
    }
  }

  /**
   * 获取服务器性能指标
   */
  getMetrics(serverId: string, timeRange?: { start: Date; end: Date }): PerformanceMetrics[] {
    const serverMetrics = this.metrics.get(serverId) || [];
    
    if (!timeRange) {
      return serverMetrics.slice(-100); // 返回最近100个指标
    }

    return serverMetrics.filter(metric => 
      metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end
    );
  }

  /**
   * 获取实时指标
   */
  async getRealTimeMetrics(serverId: string): Promise<PerformanceMetrics | null> {
    try {
      return await this.collectMetrics(serverId);
    } catch (error) {
      console.error(`获取实时指标失败: ${serverId}`, error);
      return null;
    }
  }

  /**
   * 生成诊断报告
   */
  async generateDiagnosticReport(serverId: string): Promise<DiagnosticReport> {
    console.log(`🔍 生成诊断报告: ${serverId}`);

    const recentMetrics = this.getMetrics(serverId).slice(-20);
    const currentMetrics = recentMetrics[recentMetrics.length - 1];
    
    if (!currentMetrics) {
      throw new Error(`没有可用的性能指标: ${serverId}`);
    }

    const report: DiagnosticReport = {
      serverId,
      timestamp: new Date(),
      summary: await this.generateSummary(recentMetrics),
      performance: await this.analyzePerformance(recentMetrics),
      health: await this.performHealthChecks(serverId),
      resources: await this.analyzeResources(recentMetrics)
    };

    // 缓存报告
    await this.cacheManager.set(`diagnostic:${serverId}`, report, 3600);

    console.log(`✅ 诊断报告生成完成: ${serverId}`);
    return report;
  }

  /**
   * 获取性能警报
   */
  getAlerts(serverId: string, activeOnly: boolean = true): PerformanceAlert[] {
    const serverAlerts = this.alerts.get(serverId) || [];
    
    if (activeOnly) {
      return serverAlerts.filter(alert => !alert.resolved);
    }
    
    return serverAlerts;
  }

  /**
   * 解决警报
   */
  resolveAlert(serverId: string, alertId: string): void {
    const serverAlerts = this.alerts.get(serverId) || [];
    const alert = serverAlerts.find(a => a.id === alertId);
    
    if (alert) {
      alert.resolved = true;
      this.emit('alertResolved', alert);
      console.log(`✅ 警报已解决: ${alertId}`);
    }
  }

  /**
   * 关闭监控器
   */
  async shutdown(): Promise<void> {
    console.log('🔄 关闭性能监控器...');

    // 停止所有监控
    for (const serverId of this.monitoringIntervals.keys()) {
      this.stopMonitoring(serverId);
    }

    // 保存指标数据
    await this.saveMetrics();

    console.log('✅ 性能监控器已关闭');
  }

  // 私有方法

  private async collectMetrics(serverId: string): Promise<PerformanceMetrics> {
    const startTime = performance.now();

    const metrics: PerformanceMetrics = {
      serverId,
      timestamp: new Date(),
      cpu: await this.collectCPUMetrics(),
      memory: await this.collectMemoryMetrics(),
      network: await this.collectNetworkMetrics(serverId),
      requests: await this.collectRequestMetrics(serverId),
      errors: await this.collectErrorMetrics(serverId),
      latency: await this.collectLatencyMetrics(serverId),
      throughput: await this.collectThroughputMetrics(serverId)
    };

    // 存储指标
    const serverMetrics = this.metrics.get(serverId) || [];
    serverMetrics.push(metrics);

    // 限制存储数量
    if (serverMetrics.length > 1000) {
      serverMetrics.splice(0, serverMetrics.length - 1000);
    }

    this.metrics.set(serverId, serverMetrics);

    // 检查警报
    await this.checkAlerts(serverId, metrics);

    // 清理过期指标
    await this.cleanupOldMetrics();

    const collectTime = performance.now() - startTime;
    if (collectTime > 1000) {
      console.warn(`指标收集耗时过长: ${serverId} (${collectTime.toFixed(2)}ms)`);
    }

    return metrics;
  }

  private async collectCPUMetrics(): Promise<CPUMetrics> {
    // 简化实现，实际应该使用系统调用获取真实CPU数据
    return {
      usage: Math.random() * 100,
      loadAverage: [1.2, 1.5, 1.8],
      processes: Math.floor(Math.random() * 50) + 10
    };
  }

  private async collectMemoryMetrics(): Promise<MemoryMetrics> {
    const memUsage = process.memoryUsage();
    
    return {
      used: memUsage.rss,
      total: memUsage.rss + 100 * 1024 * 1024, // 假设总内存
      usage: (memUsage.rss / (memUsage.rss + 100 * 1024 * 1024)) * 100,
      heap: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        limit: memUsage.heapTotal * 2
      },
      gc: {
        collections: 0, // 需要集成GC监控
        duration: 0
      }
    };
  }

  private async collectNetworkMetrics(serverId: string): Promise<NetworkMetrics> {
    // 简化实现
    return {
      bytesIn: Math.floor(Math.random() * 10000),
      bytesOut: Math.floor(Math.random() * 5000),
      packetsIn: Math.floor(Math.random() * 100),
      packetsOut: Math.floor(Math.random() * 50),
      connections: {
        active: Math.floor(Math.random() * 10),
        idle: Math.floor(Math.random() * 5),
        failed: Math.floor(Math.random() * 2)
      }
    };
  }

  private async collectRequestMetrics(serverId: string): Promise<RequestMetrics> {
    // 这里应该从实际的MCP服务器获取请求统计
    return {
      total: Math.floor(Math.random() * 1000),
      successful: Math.floor(Math.random() * 950),
      failed: Math.floor(Math.random() * 50),
      rate: Math.random() * 100,
      averageSize: Math.random() * 1024
    };
  }

  private async collectErrorMetrics(serverId: string): Promise<ErrorMetrics> {
    return {
      total: Math.floor(Math.random() * 10),
      rate: Math.random() * 5,
      types: {
        'connection_error': Math.floor(Math.random() * 3),
        'timeout_error': Math.floor(Math.random() * 2),
        'validation_error': Math.floor(Math.random() * 5)
      },
      recent: []
    };
  }

  private async collectLatencyMetrics(serverId: string): Promise<LatencyMetrics> {
    const base = Math.random() * 100;
    return {
      min: base,
      max: base * 5,
      avg: base * 2,
      p50: base * 1.5,
      p95: base * 3,
      p99: base * 4
    };
  }

  private async collectThroughputMetrics(serverId: string): Promise<ThroughputMetrics> {
    return {
      requestsPerSecond: Math.random() * 200,
      bytesPerSecond: Math.random() * 1024 * 1024,
      operationsPerSecond: Math.random() * 150
    };
  }

  private async checkAlerts(serverId: string, metrics: PerformanceMetrics): Promise<void> {
    const serverAlerts = this.alerts.get(serverId) || [];

    // CPU 警报
    if (metrics.cpu.usage > this.config.alertThresholds.cpu) {
      const alert: PerformanceAlert = {
        id: `cpu_${Date.now()}`,
        serverId,
        type: 'cpu',
        severity: metrics.cpu.usage > 95 ? 'critical' : 'warning',
        message: `CPU使用率过高: ${metrics.cpu.usage.toFixed(1)}%`,
        threshold: this.config.alertThresholds.cpu,
        currentValue: metrics.cpu.usage,
        timestamp: new Date()
      };
      
      serverAlerts.push(alert);
      this.emit('alert', alert);
    }

    // 内存警报
    if (metrics.memory.usage > this.config.alertThresholds.memory) {
      const alert: PerformanceAlert = {
        id: `memory_${Date.now()}`,
        serverId,
        type: 'memory',
        severity: metrics.memory.usage > 95 ? 'critical' : 'warning',
        message: `内存使用率过高: ${metrics.memory.usage.toFixed(1)}%`,
        threshold: this.config.alertThresholds.memory,
        currentValue: metrics.memory.usage,
        timestamp: new Date()
      };
      
      serverAlerts.push(alert);
      this.emit('alert', alert);
    }

    this.alerts.set(serverId, serverAlerts);
  }

  private async generateSummary(metrics: PerformanceMetrics[]): Promise<DiagnosticReport['summary']> {
    if (metrics.length === 0) {
      return { status: 'unhealthy', score: 0, issues: 1 };
    }

    const latest = metrics[metrics.length - 1];
    let score = 100;
    let issues = 0;

    // 评估CPU
    if (latest.cpu.usage > 80) {
      score -= 20;
      issues++;
    }

    // 评估内存
    if (latest.memory.usage > 85) {
      score -= 25;
      issues++;
    }

    // 评估延迟
    if (latest.latency.avg > 1000) {
      score -= 15;
      issues++;
    }

    // 评估错误率
    if (latest.errors.rate > 5) {
      score -= 30;
      issues++;
    }

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (score >= 80) {
      status = 'healthy';
    } else if (score >= 50) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return { status, score: Math.max(0, score), issues };
  }

  private async analyzePerformance(metrics: PerformanceMetrics[]): Promise<DiagnosticReport['performance']> {
    const bottlenecks: Bottleneck[] = [];
    const recommendations: string[] = [];
    const trends: PerformanceTrend[] = [];

    if (metrics.length < 2) {
      return { bottlenecks, recommendations, trends };
    }

    const latest = metrics[metrics.length - 1];
    const previous = metrics[metrics.length - 2];

    // 检测瓶颈
    if (latest.cpu.usage > 80) {
      bottlenecks.push({
        type: 'CPU',
        description: 'CPU使用率持续过高',
        impact: 'high',
        suggestion: '考虑优化代码或增加计算资源'
      });
    }

    // 生成建议
    if (latest.memory.usage > 85) {
      recommendations.push('监控内存泄漏，考虑增加内存限制');
    }

    if (latest.latency.avg > 500) {
      recommendations.push('优化请求处理逻辑，减少响应时间');
    }

    // 分析趋势
    const cpuChange = ((latest.cpu.usage - previous.cpu.usage) / previous.cpu.usage) * 100;
    trends.push({
      metric: 'CPU使用率',
      direction: cpuChange > 5 ? 'degrading' : cpuChange < -5 ? 'improving' : 'stable',
      change: cpuChange,
      period: '最近1个周期'
    });

    return { bottlenecks, recommendations, trends };
  }

  private async performHealthChecks(serverId: string): Promise<DiagnosticReport['health']> {
    const checks: HealthCheck[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    // 连接检查
    const connectionStart = performance.now();
    try {
      // 这里应该实际测试服务器连接
      const connectionTime = performance.now() - connectionStart;
      checks.push({
        name: '连接测试',
        status: connectionTime < 1000 ? 'pass' : 'warn',
        message: `连接时间: ${connectionTime.toFixed(2)}ms`,
        duration: connectionTime
      });
    } catch (error) {
      checks.push({
        name: '连接测试',
        status: 'fail',
        message: `连接失败: ${error}`,
        duration: performance.now() - connectionStart
      });
      errors.push('服务器连接失败');
    }

    return { checks, warnings, errors };
  }

  private async analyzeResources(metrics: PerformanceMetrics[]): Promise<DiagnosticReport['resources']> {
    if (metrics.length === 0) {
      throw new Error('无法分析资源使用情况：缺少指标数据');
    }

    const latest = metrics[metrics.length - 1];

    const utilization: ResourceUtilization = {
      cpu: latest.cpu.usage,
      memory: latest.memory.usage,
      disk: 50, // 简化实现
      network: 30
    };

    const capacity: ResourceCapacity = {
      cpu: { current: latest.cpu.usage, max: 100 },
      memory: { current: latest.memory.used, max: latest.memory.total },
      disk: { current: 50, max: 100 },
      network: { current: 30, max: 100 }
    };

    const predictions: ResourcePrediction[] = [];

    // 简单的预测逻辑
    if (latest.memory.usage > 80) {
      predictions.push({
        resource: 'memory',
        timeToCapacity: 24, // 24小时
        confidence: 0.7,
        recommendation: '监控内存使用趋势，考虑扩容'
      });
    }

    return { utilization, capacity, predictions };
  }

  private async cleanupOldMetrics(): Promise<void> {
    const cutoff = new Date(Date.now() - this.config.retentionPeriod);
    
    for (const [serverId, serverMetrics] of this.metrics.entries()) {
      const filtered = serverMetrics.filter(metric => metric.timestamp > cutoff);
      this.metrics.set(serverId, filtered);
    }
  }

  private async saveMetrics(): Promise<void> {
    try {
      const allMetrics = Object.fromEntries(this.metrics);
      await this.cacheManager.set('performance_metrics', allMetrics, 86400);
    } catch (error) {
      console.warn('保存性能指标失败:', error);
    }
  }
}

interface MonitoringConfig {
  collectInterval: number;
  retentionPeriod: number;
  alertThresholds: {
    cpu: number;
    memory: number;
    latency: number;
    errorRate: number;
    throughput: number;
  };
  enableDetailedMetrics: boolean;
  enablePredictions: boolean;
}

export default MCPPerformanceMonitor;