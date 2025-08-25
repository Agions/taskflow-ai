/**
 * TaskFlow AI 沙箱执行环境
 * 提供安全的代码和命令执行环境，支持Docker和VM模式
 */

import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

export interface SandboxConfig {
  type: 'docker' | 'vm' | 'process' | 'worker';
  timeoutMs: number;
  memoryLimitMB: number;
  cpuLimitPercent: number;
  networkEnabled: boolean;
  filesystemAccess: 'none' | 'readonly' | 'restricted' | 'full';
  allowedCommands: string[];
  blockedCommands: string[];
  environmentVariables: Record<string, string>;
  workingDirectory?: string;
  image?: string; // Docker镜像
  volumes?: SandboxVolume[];
}

export interface SandboxVolume {
  host: string;
  container: string;
  readonly: boolean;
}

export interface ExecutionContext {
  id: string;
  code?: string;
  command?: string;
  args?: string[];
  language?: string;
  files?: SandboxFile[];
  config: SandboxConfig;
}

export interface SandboxFile {
  path: string;
  content: string;
  permissions?: string;
}

export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  memoryUsed: number;
  error?: string;
  warnings: string[];
  artifacts?: SandboxFile[];
}

export interface SandboxStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  totalMemoryUsed: number;
  activeSandboxes: number;
}

/**
 * 沙箱执行环境管理器
 */
export class SandboxManager extends EventEmitter {
  private config: SandboxConfig;
  private activeSandboxes = new Map<string, SandboxInstance>();
  private stats: SandboxStats;
  private tempDir: string;
  private initialized = false;

  constructor(config: Partial<SandboxConfig> = {}) {
    super();
    
    this.config = {
      type: 'process',
      timeoutMs: 30000, // 30秒
      memoryLimitMB: 512,
      cpuLimitPercent: 50,
      networkEnabled: false,
      filesystemAccess: 'restricted',
      allowedCommands: ['node', 'python3', 'python', 'bash', 'sh'],
      blockedCommands: ['rm', 'rmdir', 'del', 'format', 'sudo', 'su'],
      environmentVariables: {},
      ...config,
    };

    this.stats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      totalMemoryUsed: 0,
      activeSandboxes: 0,
    };

    this.tempDir = path.join(os.tmpdir(), 'taskflow-sandbox');
  }

  /**
   * 初始化沙箱管理器
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 创建临时目录
      await fs.ensureDir(this.tempDir);

      // 检查Docker是否可用
      if (this.config.type === 'docker') {
        await this.checkDockerAvailability();
      }

      // 设置清理定时器
      this.startCleanupTimer();

      this.initialized = true;
      console.log('🛡️ 沙箱执行环境初始化成功');

    } catch (error) {
      console.error('❌ 沙箱执行环境初始化失败:', error);
      throw error;
    }
  }

  /**
   * 执行代码或命令
   */
  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    this.ensureInitialized();

    const startTime = Date.now();
    const sandboxId = context.id || this.generateSandboxId();

    try {
      console.log(`🏃 开始执行沙箱任务: ${sandboxId}`);

      // 创建沙箱实例
      const sandbox = await this.createSandbox(sandboxId, context);
      this.activeSandboxes.set(sandboxId, sandbox);

      // 执行任务
      const result = await this.executeSandbox(sandbox, context);

      // 更新统计信息
      this.updateStats(result, Date.now() - startTime);

      // 清理沙箱
      await this.cleanupSandbox(sandboxId);

      this.emit('executionCompleted', sandboxId, result);
      return result;

    } catch (error) {
      console.error(`❌ 沙箱执行失败 ${sandboxId}:`, error);
      
      // 清理失败的沙箱
      await this.cleanupSandbox(sandboxId);

      const result: ExecutionResult = {
        success: false,
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error),
        exitCode: -1,
        executionTime: Date.now() - startTime,
        memoryUsed: 0,
        error: error instanceof Error ? error.message : String(error),
        warnings: [],
      };

      this.updateStats(result, Date.now() - startTime);
      this.emit('executionFailed', sandboxId, error);
      
      return result;
    }
  }

  /**
   * 创建沙箱实例
   */
  private async createSandbox(sandboxId: string, context: ExecutionContext): Promise<SandboxInstance> {
    const sandboxPath = path.join(this.tempDir, sandboxId);
    await fs.ensureDir(sandboxPath);

    // 创建工作目录结构
    const workDir = path.join(sandboxPath, 'work');
    const outputDir = path.join(sandboxPath, 'output');
    await fs.ensureDir(workDir);
    await fs.ensureDir(outputDir);

    // 写入文件
    if (context.files) {
      for (const file of context.files) {
        const filePath = path.join(workDir, file.path);
        await fs.ensureDir(path.dirname(filePath));
        await fs.writeFile(filePath, file.content);
        
        if (file.permissions) {
          await fs.chmod(filePath, file.permissions);
        }
      }
    }

    // 创建执行脚本
    let scriptContent = '';
    if (context.code) {
      if (context.language === 'javascript' || context.language === 'node') {
        scriptContent = context.code;
        await fs.writeFile(path.join(workDir, 'script.js'), scriptContent);
      } else if (context.language === 'python') {
        scriptContent = context.code;
        await fs.writeFile(path.join(workDir, 'script.py'), scriptContent);
      } else {
        scriptContent = context.code;
        await fs.writeFile(path.join(workDir, 'script.sh'), scriptContent);
        await fs.chmod(path.join(workDir, 'script.sh'), '755');
      }
    }

    const sandbox: SandboxInstance = {
      id: sandboxId,
      path: sandboxPath,
      workDir,
      outputDir,
      config: context.config,
      startTime: new Date(),
      process: null,
      status: 'created',
    };

    return sandbox;
  }

  /**
   * 执行沙箱任务
   */
  private async executeSandbox(sandbox: SandboxInstance, context: ExecutionContext): Promise<ExecutionResult> {
    switch (sandbox.config.type) {
      case 'docker':
        return await this.executeDocker(sandbox, context);
      case 'process':
        return await this.executeProcess(sandbox, context);
      case 'worker':
        return await this.executeWorker(sandbox, context);
      default:
        throw new Error(`不支持的沙箱类型: ${sandbox.config.type}`);
    }
  }

  /**
   * Docker容器执行
   */
  private async executeDocker(sandbox: SandboxInstance, context: ExecutionContext): Promise<ExecutionResult> {
    const image = sandbox.config.image || 'node:18-alpine';
    const containerName = `taskflow-${sandbox.id}`;

    const dockerArgs = [
      'run',
      '--rm',
      '--name', containerName,
      '--memory', `${sandbox.config.memoryLimitMB}m`,
      '--cpus', (sandbox.config.cpuLimitPercent / 100).toString(),
      '--user', '1000:1000', // 非root用户
      '--workdir', '/workspace',
      '-v', `${sandbox.workDir}:/workspace:rw`,
      '-v', `${sandbox.outputDir}:/output:rw`,
    ];

    // 网络限制
    if (!sandbox.config.networkEnabled) {
      dockerArgs.push('--network', 'none');
    }

    // 文件系统限制
    if (sandbox.config.filesystemAccess === 'readonly') {
      dockerArgs.push('--read-only');
    }

    // 环境变量
    Object.entries(sandbox.config.environmentVariables).forEach(([key, value]) => {
      dockerArgs.push('-e', `${key}=${value}`);
    });

    dockerArgs.push(image);

    // 添加执行命令
    if (context.command) {
      dockerArgs.push(context.command, ...(context.args || []));
    } else if (context.language === 'javascript' || context.language === 'node') {
      dockerArgs.push('node', 'script.js');
    } else if (context.language === 'python') {
      dockerArgs.push('python3', 'script.py');
    } else {
      dockerArgs.push('sh', 'script.sh');
    }

    return await this.runCommand('docker', dockerArgs, sandbox);
  }

  /**
   * 进程执行
   */
  private async executeProcess(sandbox: SandboxInstance, context: ExecutionContext): Promise<ExecutionResult> {
    let command: string;
    let args: string[];

    if (context.command) {
      // 验证命令是否被允许
      if (!this.isCommandAllowed(context.command, sandbox.config)) {
        throw new Error(`命令被禁止: ${context.command}`);
      }
      command = context.command;
      args = context.args || [];
    } else if (context.language === 'javascript' || context.language === 'node') {
      command = 'node';
      args = [path.join(sandbox.workDir, 'script.js')];
    } else if (context.language === 'python') {
      command = 'python3';
      args = [path.join(sandbox.workDir, 'script.py')];
    } else {
      command = 'sh';
      args = [path.join(sandbox.workDir, 'script.sh')];
    }

    return await this.runCommand(command, args, sandbox);
  }

  /**
   * Worker线程执行
   */
  private async executeWorker(sandbox: SandboxInstance, context: ExecutionContext): Promise<ExecutionResult> {
    // 这里可以实现Worker线程执行逻辑
    // 由于复杂性，暂时使用进程执行作为回退
    return await this.executeProcess(sandbox, context);
  }

  /**
   * 运行命令
   */
  private async runCommand(command: string, args: string[], sandbox: SandboxInstance): Promise<ExecutionResult> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let stdout = '';
      let stderr = '';
      
      const env = {
        ...process.env,
        ...sandbox.config.environmentVariables,
        // 限制环境变量
        PATH: this.getSafePathEnv(),
        HOME: sandbox.workDir,
        TMPDIR: sandbox.outputDir,
      };

      const childProcess = spawn(command, args, {
        cwd: sandbox.workDir,
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      sandbox.process = childProcess;
      sandbox.status = 'running';

      // 超时处理
      const timeout = setTimeout(() => {
        if (childProcess && !childProcess.killed) {
          childProcess.kill('SIGKILL');
          reject(new Error(`执行超时 (${sandbox.config.timeoutMs}ms)`));
        }
      }, sandbox.config.timeoutMs);

      // 收集输出
      childProcess.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      childProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      // 进程结束
      childProcess.on('close', async (exitCode) => {
        clearTimeout(timeout);
        sandbox.status = 'completed';
        
        const executionTime = Date.now() - startTime;
        
        // 收集输出文件
        const artifacts: SandboxFile[] = [];
        try {
          const outputFiles = await this.collectOutputFiles(sandbox.outputDir);
          artifacts.push(...outputFiles);
        } catch (error) {
          console.warn('收集输出文件失败:', error);
        }

        const result: ExecutionResult = {
          success: exitCode === 0,
          stdout,
          stderr,
          exitCode: exitCode || 0,
          executionTime,
          memoryUsed: 0, // TODO: 实现内存使用监控
          warnings: [],
          artifacts,
        };

        resolve(result);
      });

      childProcess.on('error', (error) => {
        clearTimeout(timeout);
        sandbox.status = 'failed';
        reject(error);
      });
    });
  }

  /**
   * 收集输出文件
   */
  private async collectOutputFiles(outputDir: string): Promise<SandboxFile[]> {
    const files: SandboxFile[] = [];
    
    try {
      const entries = await fs.readdir(outputDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile()) {
          const filePath = path.join(outputDir, entry.name);
          const content = await fs.readFile(filePath, 'utf8');
          const stats = await fs.stat(filePath);
          
          files.push({
            path: entry.name,
            content,
            permissions: stats.mode.toString(8),
          });
        }
      }
    } catch (error) {
      console.warn('读取输出目录失败:', error);
    }
    
    return files;
  }

  /**
   * 检查命令是否被允许
   */
  private isCommandAllowed(command: string, config: SandboxConfig): boolean {
    const baseCommand = command.split(' ')[0];
    
    // 检查黑名单
    if (config.blockedCommands.includes(baseCommand)) {
      return false;
    }
    
    // 检查白名单
    if (config.allowedCommands.length > 0) {
      return config.allowedCommands.includes(baseCommand);
    }
    
    return true;
  }

  /**
   * 获取安全的PATH环境变量
   */
  private getSafePathEnv(): string {
    const safePaths = [
      '/usr/local/bin',
      '/usr/bin',
      '/bin',
      '/usr/local/sbin',
      '/usr/sbin',
      '/sbin',
    ];
    
    return safePaths.join(':');
  }

  /**
   * 清理沙箱
   */
  private async cleanupSandbox(sandboxId: string): Promise<void> {
    const sandbox = this.activeSandboxes.get(sandboxId);
    if (!sandbox) {
      return;
    }

    try {
      // 终止进程
      if (sandbox.process && !sandbox.process.killed) {
        sandbox.process.kill('SIGTERM');
        
        // 等待1秒后强制终止
        setTimeout(() => {
          if (sandbox.process && !sandbox.process.killed) {
            sandbox.process.kill('SIGKILL');
          }
        }, 1000);
      }

      // 清理Docker容器
      if (sandbox.config.type === 'docker') {
        try {
          spawn('docker', ['rm', '-f', `taskflow-${sandboxId}`], {
            stdio: 'ignore'
          });
        } catch (error) {
          console.warn(`清理Docker容器失败 ${sandboxId}:`, error);
        }
      }

      // 清理文件系统
      await fs.remove(sandbox.path);
      
      this.activeSandboxes.delete(sandboxId);
      console.log(`🧹 沙箱已清理: ${sandboxId}`);

    } catch (error) {
      console.error(`❌ 清理沙箱失败 ${sandboxId}:`, error);
    }
  }

  /**
   * 检查Docker可用性
   */
  private async checkDockerAvailability(): Promise<void> {
    return new Promise((resolve, reject) => {
      const dockerProcess = spawn('docker', ['--version'], {
        stdio: 'pipe'
      });

      dockerProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Docker可用');
          resolve();
        } else {
          reject(new Error('Docker不可用，请安装Docker'));
        }
      });

      dockerProcess.on('error', () => {
        reject(new Error('Docker不可用，请安装Docker'));
      });
    });
  }

  /**
   * 生成沙箱ID
   */
  private generateSandboxId(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * 更新统计信息
   */
  private updateStats(result: ExecutionResult, executionTime: number): void {
    this.stats.totalExecutions++;
    
    if (result.success) {
      this.stats.successfulExecutions++;
    } else {
      this.stats.failedExecutions++;
    }
    
    // 更新平均执行时间
    this.stats.averageExecutionTime = 
      (this.stats.averageExecutionTime * (this.stats.totalExecutions - 1) + executionTime) / 
      this.stats.totalExecutions;
    
    this.stats.totalMemoryUsed += result.memoryUsed;
    this.stats.activeSandboxes = this.activeSandboxes.size;
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupExpiredSandboxes();
    }, 60000); // 每分钟清理一次
  }

  /**
   * 清理过期的沙箱
   */
  private async cleanupExpiredSandboxes(): Promise<void> {
    const now = Date.now();
    const expiredThreshold = 5 * 60 * 1000; // 5分钟

    for (const [sandboxId, sandbox] of this.activeSandboxes) {
      const age = now - sandbox.startTime.getTime();
      
      if (age > expiredThreshold) {
        console.log(`🧹 清理过期沙箱: ${sandboxId}`);
        await this.cleanupSandbox(sandboxId);
      }
    }
  }

  /**
   * 停止特定沙箱
   */
  async stopSandbox(sandboxId: string): Promise<boolean> {
    const sandbox = this.activeSandboxes.get(sandboxId);
    if (!sandbox) {
      return false;
    }

    await this.cleanupSandbox(sandboxId);
    return true;
  }

  /**
   * 获取沙箱统计信息
   */
  getStats(): SandboxStats {
    return { ...this.stats };
  }

  /**
   * 获取活跃沙箱列表
   */
  getActiveSandboxes(): SandboxInstance[] {
    return Array.from(this.activeSandboxes.values());
  }

  /**
   * 关闭沙箱管理器
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      console.log('🛑 正在关闭沙箱管理器...');

      // 清理所有活跃沙箱
      const cleanupPromises = Array.from(this.activeSandboxes.keys()).map(
        sandboxId => this.cleanupSandbox(sandboxId)
      );
      
      await Promise.all(cleanupPromises);

      // 清理临时目录
      await fs.remove(this.tempDir);

      this.initialized = false;
      console.log('✅ 沙箱管理器已关闭');

    } catch (error) {
      console.error('❌ 沙箱管理器关闭失败:', error);
      throw error;
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('沙箱管理器尚未初始化');
    }
  }
}

// 类型定义

export interface SandboxInstance {
  id: string;
  path: string;
  workDir: string;
  outputDir: string;
  config: SandboxConfig;
  startTime: Date;
  process: ChildProcess | null;
  status: 'created' | 'running' | 'completed' | 'failed';
}

export default SandboxManager;