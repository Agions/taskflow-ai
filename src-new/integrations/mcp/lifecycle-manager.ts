/**
 * TaskFlow AI MCP 服务器生命周期管理
 * 提供完整的服务器生命周期管理功能
 */

import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import { ConfigManager } from '../../infrastructure/config/manager';
import { CacheManager } from '../../infrastructure/storage/cache';
import { MCPServerConfig } from './mcp-config-manager';

export interface ServerProcess {
  id: string;
  pid?: number;
  process?: ChildProcess;
  status: ServerProcessStatus;
  startTime: Date | null;
  endTime: Date | null;
  restartCount: number;
  lastHealthCheck: Date | null;
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  memoryUsage: number;
  cpuUsage: number;
  uptime: number;
}

export enum ServerProcessStatus {
  STOPPED = 'stopped',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  CRASHED = 'crashed',
  FAILED = 'failed'
}

export interface LifecycleConfig {
  autoRestart: boolean;
  maxRestartAttempts: number;
  restartDelay: number;
  healthCheckInterval: number;
  processTimeout: number;
  gracefulShutdownTimeout: number;
  crashThreshold: number;
  memoryThreshold: number;
  cpuThreshold: number;
}

export interface ProcessMetrics {
  pid: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  cpuUsage: number;
  uptime: number;
  connections: number;
  requestsPerSecond: number;
  errorRate: number;
}

/**
 * MCP服务器生命周期管理器
 */
export class MCPServerLifecycleManager extends EventEmitter {
  private processes = new Map<string, ServerProcess>();
  private configs = new Map<string, MCPServerConfig>();
  private lifecycleConfig: LifecycleConfig;
  private healthCheckIntervals = new Map<string, NodeJS.Timeout>();
  private configManager: ConfigManager;
  private cacheManager: CacheManager;
  private initialized = false;

  constructor(
    configManager: ConfigManager, 
    cacheManager: CacheManager,
    lifecycleConfig?: Partial<LifecycleConfig>
  ) {
    super();
    this.configManager = configManager;
    this.cacheManager = cacheManager;
    
    this.lifecycleConfig = {
      autoRestart: true,
      maxRestartAttempts: 3,
      restartDelay: 5000,
      healthCheckInterval: 30000,
      processTimeout: 60000,
      gracefulShutdownTimeout: 10000,
      crashThreshold: 3,
      memoryThreshold: 512 * 1024 * 1024, // 512MB
      cpuThreshold: 80, // 80%
      ...lifecycleConfig
    };
  }

  /**
   * 初始化生命周期管理器
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🔄 初始化MCP服务器生命周期管理器...');

      // 加载保存的进程状态
      await this.loadProcessStates();

      // 设置进程监控
      this.setupProcessMonitoring();

      this.initialized = true;
      console.log('✅ MCP服务器生命周期管理器初始化完成');

    } catch (error) {
      console.error('❌ 生命周期管理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 启动MCP服务器
   */
  async startServer(serverId: string, config: MCPServerConfig): Promise<void> {
    try {
      console.log(`🚀 启动MCP服务器: ${serverId}`);

      // 检查服务器是否已在运行
      const existingProcess = this.processes.get(serverId);
      if (existingProcess && existingProcess.status === ServerProcessStatus.RUNNING) {
        throw new Error(`服务器已在运行: ${serverId}`);
      }

      // 创建进程记录
      const serverProcess: ServerProcess = {
        id: serverId,
        status: ServerProcessStatus.STARTING,
        startTime: null,
        endTime: null,
        restartCount: existingProcess?.restartCount || 0,
        lastHealthCheck: null,
        healthStatus: 'unknown',
        memoryUsage: 0,
        cpuUsage: 0,
        uptime: 0
      };

      this.processes.set(serverId, serverProcess);
      this.configs.set(serverId, config);

      // 启动进程
      const childProcess = await this.spawnServerProcess(config);
      
      serverProcess.process = childProcess;
      serverProcess.pid = childProcess.pid;
      serverProcess.status = ServerProcessStatus.RUNNING;
      serverProcess.startTime = new Date();

      // 设置进程事件监听
      this.setupProcessHandlers(serverId, childProcess);

      // 启动健康检查
      this.startHealthCheck(serverId);

      // 保存状态
      await this.saveProcessState(serverId);

      this.emit('serverStarted', serverId, serverProcess);
      console.log(`✅ MCP服务器启动成功: ${serverId} (PID: ${childProcess.pid})`);

    } catch (error) {
      const process = this.processes.get(serverId);
      if (process) {
        process.status = ServerProcessStatus.FAILED;
        process.endTime = new Date();
      }

      this.emit('serverStartFailed', serverId, error);
      console.error(`❌ MCP服务器启动失败: ${serverId}`, error);
      throw error;
    }
  }

  /**
   * 停止MCP服务器
   */
  async stopServer(serverId: string, force: boolean = false): Promise<void> {
    try {
      console.log(`🛑 停止MCP服务器: ${serverId}`);

      const serverProcess = this.processes.get(serverId);
      if (!serverProcess || serverProcess.status === ServerProcessStatus.STOPPED) {
        console.warn(`服务器未运行: ${serverId}`);
        return;
      }

      serverProcess.status = ServerProcessStatus.STOPPING;

      // 停止健康检查
      this.stopHealthCheck(serverId);

      // 终止进程
      if (serverProcess.process) {
        if (force) {
          // 强制终止
          serverProcess.process.kill('SIGKILL');
        } else {
          // 优雅关闭
          serverProcess.process.kill('SIGTERM');
          
          // 等待优雅关闭超时
          setTimeout(() => {
            if (serverProcess.process && !serverProcess.process.killed) {
              console.warn(`强制终止服务器: ${serverId}`);
              serverProcess.process.kill('SIGKILL');
            }
          }, this.lifecycleConfig.gracefulShutdownTimeout);
        }
      }

      serverProcess.status = ServerProcessStatus.STOPPED;
      serverProcess.endTime = new Date();

      await this.saveProcessState(serverId);

      this.emit('serverStopped', serverId, serverProcess);
      console.log(`✅ MCP服务器已停止: ${serverId}`);

    } catch (error) {
      console.error(`❌ 停止MCP服务器失败: ${serverId}`, error);
      throw error;
    }
  }

  /**
   * 重启MCP服务器
   */
  async restartServer(serverId: string): Promise<void> {
    try {
      console.log(`🔄 重启MCP服务器: ${serverId}`);

      const config = this.configs.get(serverId);
      if (!config) {
        throw new Error(`服务器配置不存在: ${serverId}`);
      }

      // 先停止服务器
      await this.stopServer(serverId);

      // 等待一段时间
      await new Promise(resolve => setTimeout(resolve, this.lifecycleConfig.restartDelay));

      // 增加重启计数
      const process = this.processes.get(serverId);
      if (process) {
        process.restartCount++;
      }

      // 重新启动
      await this.startServer(serverId, config);

      this.emit('serverRestarted', serverId);
      console.log(`✅ MCP服务器重启成功: ${serverId}`);

    } catch (error) {
      console.error(`❌ 重启MCP服务器失败: ${serverId}`, error);
      throw error;
    }
  }

  /**
   * 获取服务器进程信息
   */
  getServerProcess(serverId: string): ServerProcess | undefined {
    return this.processes.get(serverId);
  }

  /**
   * 获取所有服务器进程信息
   */
  getAllServerProcesses(): ServerProcess[] {
    return Array.from(this.processes.values());
  }

  /**
   * 获取服务器进程指标
   */
  async getProcessMetrics(serverId: string): Promise<ProcessMetrics | null> {
    const serverProcess = this.processes.get(serverId);
    if (!serverProcess || !serverProcess.pid) {
      return null;
    }

    try {
      // 获取进程内存和CPU信息
      const memoryUsage = process.memoryUsage();
      const uptime = serverProcess.startTime ? 
        (Date.now() - serverProcess.startTime.getTime()) / 1000 : 0;

      return {
        pid: serverProcess.pid,
        memoryUsage,
        cpuUsage: serverProcess.cpuUsage,
        uptime,
        connections: 0, // TODO: 实现连接数统计
        requestsPerSecond: 0, // TODO: 实现RPS统计
        errorRate: 0 // TODO: 实现错误率统计
      };

    } catch (error) {
      console.error(`获取进程指标失败: ${serverId}`, error);
      return null;
    }
  }

  /**
   * 设置自动重启策略
   */
  setAutoRestartPolicy(serverId: string, enabled: boolean): void {
    const config = this.configs.get(serverId);
    if (config) {
      // 这里可以为特定服务器设置自动重启策略
      console.log(`设置服务器 ${serverId} 自动重启: ${enabled}`);
    }
  }

  /**
   * 关闭生命周期管理器
   */
  async shutdown(): Promise<void> {
    try {
      console.log('🔄 关闭MCP服务器生命周期管理器...');

      // 停止所有健康检查
      for (const interval of this.healthCheckIntervals.values()) {
        clearInterval(interval);
      }
      this.healthCheckIntervals.clear();

      // 停止所有服务器
      const stopPromises = Array.from(this.processes.keys()).map(serverId =>
        this.stopServer(serverId)
      );

      await Promise.allSettled(stopPromises);

      this.initialized = false;
      console.log('✅ MCP服务器生命周期管理器已关闭');

    } catch (error) {
      console.error('❌ 关闭生命周期管理器失败:', error);
    }
  }

  // 私有方法

  private async spawnServerProcess(config: MCPServerConfig): Promise<ChildProcess> {
    return new Promise((resolve, reject) => {
      const args = config.args || [];
      const env = { ...process.env, ...config.env };

      const childProcess = spawn(config.command, args, {
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false
      });

      const timeout = setTimeout(() => {
        childProcess.kill('SIGKILL');
        reject(new Error('进程启动超时'));
      }, this.lifecycleConfig.processTimeout);

      childProcess.on('spawn', () => {
        clearTimeout(timeout);
        resolve(childProcess);
      });

      childProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  private setupProcessHandlers(serverId: string, childProcess: ChildProcess): void {
    childProcess.on('exit', (code, signal) => {
      const serverProcess = this.processes.get(serverId);
      if (serverProcess) {
        serverProcess.endTime = new Date();
        
        if (code === 0) {
          serverProcess.status = ServerProcessStatus.STOPPED;
        } else {
          serverProcess.status = ServerProcessStatus.CRASHED;
          
          // 检查是否需要自动重启
          if (this.shouldAutoRestart(serverId)) {
            this.scheduleRestart(serverId);
          }
        }

        this.stopHealthCheck(serverId);
        this.emit('serverExited', serverId, code, signal);
      }
    });

    childProcess.on('error', (error) => {
      const serverProcess = this.processes.get(serverId);
      if (serverProcess) {
        serverProcess.status = ServerProcessStatus.FAILED;
        serverProcess.endTime = new Date();
      }

      this.emit('serverError', serverId, error);
    });

    // 处理标准输出和错误输出
    childProcess.stdout?.on('data', (data) => {
      this.emit('serverOutput', serverId, 'stdout', data.toString());
    });

    childProcess.stderr?.on('data', (data) => {
      this.emit('serverOutput', serverId, 'stderr', data.toString());
    });
  }

  private startHealthCheck(serverId: string): void {
    const interval = setInterval(async () => {
      await this.performHealthCheck(serverId);
    }, this.lifecycleConfig.healthCheckInterval);

    this.healthCheckIntervals.set(serverId, interval);
  }

  private stopHealthCheck(serverId: string): void {
    const interval = this.healthCheckIntervals.get(serverId);
    if (interval) {
      clearInterval(interval);
      this.healthCheckIntervals.delete(serverId);
    }
  }

  private async performHealthCheck(serverId: string): Promise<void> {
    const serverProcess = this.processes.get(serverId);
    if (!serverProcess || !serverProcess.process) {
      return;
    }

    try {
      // 检查进程是否仍在运行
      const isRunning = !serverProcess.process.killed && serverProcess.process.exitCode === null;
      
      if (isRunning) {
        // 更新健康状态
        serverProcess.healthStatus = 'healthy';
        serverProcess.lastHealthCheck = new Date();
        
        // 检查资源使用情况
        await this.checkResourceUsage(serverId);
      } else {
        serverProcess.healthStatus = 'unhealthy';
      }

      await this.saveProcessState(serverId);

    } catch (error) {
      console.error(`健康检查失败: ${serverId}`, error);
      if (serverProcess) {
        serverProcess.healthStatus = 'unhealthy';
      }
    }
  }

  private async checkResourceUsage(serverId: string): Promise<void> {
    const serverProcess = this.processes.get(serverId);
    if (!serverProcess || !serverProcess.pid) {
      return;
    }

    try {
      // 这里可以使用系统命令或第三方库获取更详细的资源使用情况
      // 简化实现
      const memoryUsage = process.memoryUsage().rss;
      serverProcess.memoryUsage = memoryUsage;

      // 检查是否超过阈值
      if (memoryUsage > this.lifecycleConfig.memoryThreshold) {
        this.emit('resourceThresholdExceeded', serverId, 'memory', memoryUsage);
      }

    } catch (error) {
      console.error(`检查资源使用失败: ${serverId}`, error);
    }
  }

  private shouldAutoRestart(serverId: string): boolean {
    if (!this.lifecycleConfig.autoRestart) {
      return false;
    }

    const serverProcess = this.processes.get(serverId);
    if (!serverProcess) {
      return false;
    }

    return serverProcess.restartCount < this.lifecycleConfig.maxRestartAttempts;
  }

  private scheduleRestart(serverId: string): void {
    setTimeout(async () => {
      try {
        const config = this.configs.get(serverId);
        if (config) {
          console.log(`自动重启服务器: ${serverId}`);
          await this.restartServer(serverId);
        }
      } catch (error) {
        console.error(`自动重启失败: ${serverId}`, error);
      }
    }, this.lifecycleConfig.restartDelay);
  }

  private setupProcessMonitoring(): void {
    // 监听系统信号
    process.on('SIGTERM', () => {
      console.log('收到SIGTERM信号，正在关闭所有MCP服务器...');
      this.shutdown();
    });

    process.on('SIGINT', () => {
      console.log('收到SIGINT信号，正在关闭所有MCP服务器...');
      this.shutdown();
    });
  }

  private async loadProcessStates(): Promise<void> {
    try {
      const states = await this.cacheManager.get('mcp-server-processes');
      if (states && Array.isArray(states)) {
        for (const state of states) {
          // 恢复非运行状态的进程记录
          if (state.status !== ServerProcessStatus.RUNNING) {
            this.processes.set(state.id, state);
          }
        }
      }
    } catch (error) {
      console.warn('加载进程状态失败:', error);
    }
  }

  private async saveProcessState(serverId: string): Promise<void> {
    try {
      const states = Array.from(this.processes.values());
      await this.cacheManager.set('mcp-server-processes', states, 86400);
    } catch (error) {
      console.warn('保存进程状态失败:', error);
    }
  }
}

export default MCPServerLifecycleManager;