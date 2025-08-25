/**
/**
 * TaskFlow AI MCP 服务器管理器
 * 参考 gemini-cli 实现服务器生命周期管理和工具注册
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import axios, { AxiosInstance } from 'axios';
import { MCPConfigManager, MCPServerConfig, MCPServerStatus, MCPTool, MCPResource } from './mcp-config-manager';
import { MCPToolRegistry, ToolRegistrationResult } from './tool-registry';

export interface MCPServerProcess {
  id: string;
  config: MCPServerConfig;
  process?: ChildProcess;
  httpClient?: AxiosInstance;
  status: MCPServerStatus;
  startTime: Date;
  restartCount: number;
  lastHeartbeat: Date;
}

export interface MCPMessage {
  jsonrpc: '2.0';
  id?: string | number;
  method?: string;
  params?: any;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

/**
 * MCP 服务器管理器
 * 负责启动、停止、监控 MCP 服务器
 */
export class MCPServerManager extends EventEmitter {
  private configManager: MCPConfigManager;
  private toolRegistry: MCPToolRegistry;
  private servers = new Map<string, MCPServerProcess>();
  private tools = new Map<string, MCPTool[]>();
  private resources = new Map<string, MCPResource[]>();
  private healthCheckInterval?: NodeJS.Timeout;
  private isShuttingDown = false;

  constructor(configManager: MCPConfigManager, toolRegistry: MCPToolRegistry) {
    super();
    this.configManager = configManager;
    this.toolRegistry = toolRegistry;
    
    // 监听配置变化
    this.configManager.addWatcher((config) => {
      this.handleConfigChange();
    });

    // 监听工具注册事件
    this.toolRegistry.on('toolRegistered', (tool) => {
      this.handleToolRegistered(tool);
    });

    this.toolRegistry.on('toolUnregistered', (tool) => {
      this.handleToolUnregistered(tool);
    });

    // 优雅关闭处理
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  /**
   * 初始化管理器
   */
  async initialize(): Promise<void> {
    console.log('🚀 初始化 MCP 服务器管理器...');

    // 启动已启用的服务器
    const enabledServers = this.configManager.getEnabledServers();
    
    for (const { id, config } of enabledServers) {
      try {
        await this.startServer(id, config);
      } catch (error) {
        console.error(`❌ 启动服务器 ${id} 失败:`, error);
      }
    }

    // 启动健康检查
    this.startHealthCheck();

    // 初始化工具注册系统
    await this.toolRegistry.initialize();

    console.log(`✅ MCP 服务器管理器初始化完成，已启动 ${this.servers.size} 个服务器`);
  }

  /**
   * 启动 MCP 服务器
   */
  async startServer(serverId: string, config: MCPServerConfig): Promise<void> {
    if (this.servers.has(serverId)) {
      console.warn(`⚠️ 服务器 ${serverId} 已在运行`);
      return;
    }

    console.log(`🚀 启动 MCP 服务器: ${serverId}`);

    const serverProcess: MCPServerProcess = {
      id: serverId,
      config,
      status: {
        id: serverId,
        name: config.description || serverId,
        status: 'starting',
        uptime: 0,
        restartCount: 0,
        tools: [],
        resources: [],
        isRemote: !!config.httpUrl,
        healthCheck: {
          lastCheck: new Date(),
          healthy: false,
          responseTime: 0,
        },
      },
      startTime: new Date(),
      restartCount: 0,
      lastHeartbeat: new Date(),
    };

    try {
      if (config.httpUrl) {
        // 远程 MCP 服务器
        await this.startRemoteServer(serverProcess);
      } else {
        // 本地 MCP 服务器
        await this.startLocalServer(serverProcess);
      }

      this.servers.set(serverId, serverProcess);
      this.configManager.setServerStatus(serverId, serverProcess.status);

      // 发现工具和资源
      await this.discoverServerCapabilities(serverId);

      this.emit('serverStarted', serverId, serverProcess);
      console.log(`✅ 服务器 ${serverId} 启动成功`);

    } catch (error) {
      console.error(`❌ 启动服务器 ${serverId} 失败:`, error);
      serverProcess.status.status = 'error';
      serverProcess.status.lastError = error instanceof Error ? error.message : String(error);
      this.emit('serverError', serverId, error);
      throw error;
    }
  }

  /**
   * 启动本地 MCP 服务器
   */
  private async startLocalServer(serverProcess: MCPServerProcess): Promise<void> {
    const { config } = serverProcess;
    
    if (!config.command) {
      throw new Error('本地服务器缺少 command 配置');
    }

    const env = {
      ...process.env,
      ...this.resolveEnvironmentVariables(config.env || {}),
    };

    const childProcess = spawn(config.command, config.args || [], {
      cwd: config.cwd || process.cwd(),
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    serverProcess.process = childProcess;
    serverProcess.status.pid = childProcess.pid;

    // 设置进程事件监听
    childProcess.on('exit', (code, signal) => {
      console.log(`📤 服务器 ${serverProcess.id} 退出: code=${code}, signal=${signal}`);
      this.handleServerExit(serverProcess.id, code, signal);
    });

    childProcess.on('error', (error) => {
      console.error(`❌ 服务器 ${serverProcess.id} 进程错误:`, error);
      this.handleServerError(serverProcess.id, error);
    });

    // 处理标准输出
    childProcess.stdout?.on('data', (data) => {
      this.handleServerMessage(serverProcess.id, data.toString());
    });

    // 处理错误输出
    childProcess.stderr?.on('data', (data) => {
      console.error(`🔴 服务器 ${serverProcess.id} 错误输出:`, data.toString());
    });

    // 等待服务器启动
    await this.waitForServerReady(serverProcess);
  }

  /**
   * 启动远程 MCP 服务器
   */
  private async startRemoteServer(serverProcess: MCPServerProcess): Promise<void> {
    const { config } = serverProcess;
    
    if (!config.httpUrl) {
      throw new Error('远程服务器缺少 httpUrl 配置');
    }

    // 验证远程服务器
    if (!this.configManager.validateRemoteServer(config)) {
      throw new Error('远程服务器未通过安全验证');
    }

    const headers = this.resolveHeaders(config.headers || {});
    
    serverProcess.httpClient = axios.create({
      baseURL: config.httpUrl,
      timeout: config.timeout,
      headers,
    });

    serverProcess.status.endpoint = config.httpUrl;

    // 测试连接
    await this.testRemoteConnection(serverProcess);
  }

  /**
   * 测试远程连接
   */
  private async testRemoteConnection(serverProcess: MCPServerProcess): Promise<void> {
    const startTime = Date.now();
    
    try {
      const response = await serverProcess.httpClient!.post('/', {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'TaskFlow AI',
            version: '2.0.0',
          },
        },
      });

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      serverProcess.status.healthCheck.responseTime = Date.now() - startTime;
      serverProcess.status.healthCheck.healthy = true;
      serverProcess.status.status = 'running';

    } catch (error) {
      throw new Error(`远程连接测试失败: ${error}`);
    }
  }

  /**
   * 等待服务器就绪
   */
  private async waitForServerReady(serverProcess: MCPServerProcess, timeout = 10000): Promise<void> {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const checkReady = () => {
        if (Date.now() - startTime > timeout) {
          reject(new Error('服务器启动超时'));
          return;
        }

        if (serverProcess.status.status === 'running') {
          resolve();
          return;
        }

        setTimeout(checkReady, 100);
      };

      checkReady();
    });
  }

  /**
   * 发现服务器能力
   */
  private async discoverServerCapabilities(serverId: string): Promise<void> {
    const serverProcess = this.servers.get(serverId);
    if (!serverProcess) return;

    try {
      // 获取工具列表
      const tools = await this.listServerTools(serverId);
      this.tools.set(serverId, tools);
      serverProcess.status.tools = tools;

      // 获取资源列表
      const resources = await this.listServerResources(serverId);
      this.resources.set(serverId, resources);
      serverProcess.status.resources = resources;

      serverProcess.status.status = 'running';
      this.configManager.updateServerStatus(serverId, serverProcess.status);

      console.log(`🔍 服务器 ${serverId} 发现: ${tools.length} 个工具, ${resources.length} 个资源`);

    } catch (error) {
      console.error(`❌ 发现服务器 ${serverId} 能力失败:`, error);
    }
  }

  /**
   * 获取服务器工具列表
   */
  private async listServerTools(serverId: string): Promise<MCPTool[]> {
    const message: MCPMessage = {
      jsonrpc: '2.0',
      id: `list-tools-${Date.now()}`,
      method: 'tools/list',
      params: {},
    };

    const response = await this.sendMessage(serverId, message);
    
    if (response.error) {
      throw new Error(`获取工具列表失败: ${response.error.message}`);
    }

    const tools = response.result?.tools || [];
    
    return tools.map((tool: any) => ({
      name: tool.name,
      description: tool.description || '',
      inputSchema: tool.inputSchema || {},
      trusted: false,
      usage: {
        callCount: 0,
        lastUsed: new Date(),
        averageResponseTime: 0,
      },
    }));
  }

  /**
   * 获取服务器资源列表
   */
  private async listServerResources(serverId: string): Promise<MCPResource[]> {
    const message: MCPMessage = {
      jsonrpc: '2.0',
      id: `list-resources-${Date.now()}`,
      method: 'resources/list',
      params: {},
    };

    try {
      const response = await this.sendMessage(serverId, message);
      
      if (response.error) {
        console.warn(`获取资源列表失败: ${response.error.message}`);
        return [];
      }

      const resources = response.result?.resources || [];
      
      return resources.map((resource: any) => ({
        uri: resource.uri,
        name: resource.name || '',
        description: resource.description || '',
        mimeType: resource.mimeType || 'text/plain',
      }));

    } catch (error) {
      console.warn(`获取服务器 ${serverId} 资源列表失败:`, error);
      return [];
    }
  }

  /**
   * 发送消息到服务器
   */
  private async sendMessage(serverId: string, message: MCPMessage): Promise<MCPMessage> {
    const serverProcess = this.servers.get(serverId);
    if (!serverProcess) {
      throw new Error(`服务器不存在: ${serverId}`);
    }

    if (serverProcess.httpClient) {
      // 远程服务器
      const response = await serverProcess.httpClient.post('/', message);
      return response.data;
    } else if (serverProcess.process) {
      // 本地服务器
      return this.sendLocalMessage(serverProcess, message);
    } else {
      throw new Error(`服务器 ${serverId} 未就绪`);
    }
  }

  /**
   * 向本地服务器发送消息
   */
  private async sendLocalMessage(serverProcess: MCPServerProcess, message: MCPMessage): Promise<MCPMessage> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('消息发送超时'));
      }, serverProcess.config.timeout || 30000);

      const messageStr = JSON.stringify(message) + '\n';
      
      const onData = (data: Buffer) => {
        clearTimeout(timeout);
        try {
          const response = JSON.parse(data.toString());
          resolve(response);
        } catch (error) {
          reject(new Error(`解析响应失败: ${error}`));
        }
      };

      serverProcess.process!.stdout?.once('data', onData);
      serverProcess.process!.stdin?.write(messageStr);
    });
  }

  /**
   * 停止服务器
   */
  async stopServer(serverId: string): Promise<void> {
    const serverProcess = this.servers.get(serverId);
    if (!serverProcess) {
      console.warn(`⚠️ 服务器 ${serverId} 不存在`);
      return;
    }

    console.log(`🛑 停止服务器: ${serverId}`);
    
    serverProcess.status.status = 'stopping';
    this.configManager.updateServerStatus(serverId, serverProcess.status);

    try {
      if (serverProcess.process) {
        // 发送关闭信号
        serverProcess.process.kill('SIGTERM');
        
        // 等待进程退出
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            serverProcess.process!.kill('SIGKILL');
            resolve();
          }, 5000);

          serverProcess.process!.on('exit', () => {
            clearTimeout(timeout);
            resolve();
          });
        });
      }

      serverProcess.status.status = 'stopped';
      this.servers.delete(serverId);
      this.tools.delete(serverId);
      this.resources.delete(serverId);

      this.emit('serverStopped', serverId);
      console.log(`✅ 服务器 ${serverId} 已停止`);

    } catch (error) {
      console.error(`❌ 停止服务器 ${serverId} 失败:`, error);
      throw error;
    }
  }

  /**
   * 重启服务器
   */
  async restartServer(serverId: string): Promise<void> {
    console.log(`🔄 重启服务器: ${serverId}`);
    
    const config = this.configManager.getServerConfig(serverId);
    if (!config) {
      throw new Error(`服务器配置不存在: ${serverId}`);
    }

    await this.stopServer(serverId);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
    await this.startServer(serverId, config);
  }

  /**
   * 处理服务器退出
   */
  private async handleServerExit(serverId: string, code: number | null, signal: string | null): Promise<void> {
    const serverProcess = this.servers.get(serverId);
    if (!serverProcess || this.isShuttingDown) return;

    console.log(`📤 服务器 ${serverId} 退出: code=${code}, signal=${signal}`);

    serverProcess.status.status = 'stopped';
    this.configManager.updateServerStatus(serverId, serverProcess.status);

    // 自动重启
    if (serverProcess.config.autoRestart && serverProcess.restartCount < (serverProcess.config.maxRetries || 3)) {
      serverProcess.restartCount++;
      
      console.log(`🔄 自动重启服务器 ${serverId} (${serverProcess.restartCount}/${serverProcess.config.maxRetries})`);
      
      setTimeout(async () => {
        try {
          await this.restartServer(serverId);
        } catch (error) {
          console.error(`❌ 自动重启服务器 ${serverId} 失败:`, error);
        }
      }, 2000);
    }

    this.emit('serverExit', serverId, code, signal);
  }

  /**
   * 处理服务器错误
   */
  private handleServerError(serverId: string, error: Error): void {
    const serverProcess = this.servers.get(serverId);
    if (!serverProcess) return;

    serverProcess.status.status = 'error';
    serverProcess.status.lastError = error.message;
    this.configManager.updateServerStatus(serverId, serverProcess.status);

    this.emit('serverError', serverId, error);
  }

  /**
   * 处理服务器消息
   */
  private handleServerMessage(serverId: string, message: string): void {
    try {
      const parsedMessage = JSON.parse(message);
      this.emit('serverMessage', serverId, parsedMessage);
    } catch (error) {
      // 忽略无法解析的消息
    }
  }

  /**
   * 处理配置变化
   */
  private async handleConfigChange(): Promise<void> {
    const enabledServers = this.configManager.getEnabledServers();
    const enabledServerIds = new Set(enabledServers.map(s => s.id));

    // 停止已禁用的服务器
    for (const serverId of this.servers.keys()) {
      if (!enabledServerIds.has(serverId)) {
        await this.stopServer(serverId);
      }
    }

    // 启动新启用的服务器
    for (const { id, config } of enabledServers) {
      if (!this.servers.has(id)) {
        try {
          await this.startServer(id, config);
        } catch (error) {
          console.error(`❌ 启动新服务器 ${id} 失败:`, error);
        }
      }
    }
  }

  /**
   * 启动健康检查
   */
  private startHealthCheck(): void {
    const config = this.configManager.getConfig();
    if (!config.globalSettings.enableHealthCheck) return;

    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, config.globalSettings.healthCheckInterval);

    console.log('💓 MCP 服务器健康检查已启动');
  }

  /**
   * 执行健康检查
   */
  private async performHealthCheck(): Promise<void> {
    for (const [serverId, serverProcess] of this.servers) {
      try {
        const startTime = Date.now();
        
        const message: MCPMessage = {
          jsonrpc: '2.0',
          id: `health-${Date.now()}`,
          method: 'ping',
          params: {},
        };

        await this.sendMessage(serverId, message);
        
        const responseTime = Date.now() - startTime;
        
        serverProcess.status.healthCheck = {
          lastCheck: new Date(),
          healthy: true,
          responseTime,
        };

        serverProcess.lastHeartbeat = new Date();

      } catch (error) {
        serverProcess.status.healthCheck = {
          lastCheck: new Date(),
          healthy: false,
          responseTime: 0,
        };

        console.warn(`⚠️ 服务器 ${serverId} 健康检查失败:`, error);
      }

      this.configManager.updateServerStatus(serverId, serverProcess.status);
    }
  }

  /**
   * 解析环境变量
   */
  private resolveEnvironmentVariables(env: Record<string, string>): Record<string, string> {
    const resolved: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(env)) {
      resolved[key] = value.replace(/\$\{(.+?)\}/g, (_, envVar) => {
        return process.env[envVar] || '';
      });
    }

    return resolved;
  }

  /**
   * 解析 HTTP 头部
   */
  private resolveHeaders(headers: Record<string, string>): Record<string, string> {
    const resolved: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(headers)) {
      resolved[key] = value.replace(/\$\{(.+?)\}/g, (_, envVar) => {
        return process.env[envVar] || '';
      });
    }

    return resolved;
  }

  /**
   * 获取服务器状态
   */
  public getServerStatus(serverId: string): MCPServerStatus | undefined {
    return this.servers.get(serverId)?.status;
  }

  /**
   * 获取所有服务器状态
   */
  public getAllServerStatuses(): MCPServerStatus[] {
    return Array.from(this.servers.values()).map(s => s.status);
  }

  /**
   * 获取可用工具
   */
  public getAvailableTools(): Map<string, MCPTool[]> {
    return new Map(this.tools);
  }

  /**
   * 获取可用资源
   */
  public getAvailableResources(): Map<string, MCPResource[]> {
    return new Map(this.resources);
  }

  /**
   * 关闭管理器
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    
    console.log('🛑 关闭 MCP 服务器管理器...');

    // 停止健康检查
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // 停止所有服务器
    const stopPromises = Array.from(this.servers.keys()).map(serverId => 
      this.stopServer(serverId).catch(error => 
        console.error(`停止服务器 ${serverId} 失败:`, error)
      )
    );

    await Promise.all(stopPromises);

    console.log('✅ MCP 服务器管理器已关闭');
  }

  // 工具注册相关方法

  /**
   * 处理工具注册事件
   */
  private handleToolRegistered(tool: any): void {
    console.log(`🔧 工具已注册: ${tool.name} (${tool.id})`);
    
    // 如果工具有对应的MCP服务器，尝试启动
    if (tool.type === 'installed' && tool.manifest) {
      this.tryAutoStartServer(tool);
    }

    this.emit('toolRegistered', tool);
  }

  /**
   * 处理工具卸载事件
   */
  private handleToolUnregistered(tool: any): void {
    console.log(`🗑️ 工具已卸载: ${tool.name} (${tool.id})`);
    
    // 如果有对应的服务器，停止它
    const serverId = this.findServerByTool(tool.id);
    if (serverId) {
      this.stopServer(serverId);
    }

    this.emit('toolUnregistered', tool);
  }

  /**
   * 尝试自动启动服务器
   */
  private async tryAutoStartServer(tool: any): Promise<void> {
    try {
      const serverId = tool.id;
      
      // 检查是否已经有配置
      if (this.configManager.hasServer && this.configManager.hasServer(serverId)) {
        return;
      }

      // 创建自动配置
      const config: MCPServerConfig = {
        name: tool.name,
        description: tool.description,
        command: tool.command,
        args: tool.args,
        env: tool.env,
        enabled: true,
        autoStart: true,
        cwd: tool.installPath,
      };

      // 注册并启动服务器
      if (this.configManager.addServer) {
        this.configManager.addServer(serverId, config);
        await this.startServer(serverId, config);
        console.log(`✅ 自动启动服务器: ${serverId}`);
      }
      
    } catch (error) {
      console.warn(`⚠️ 自动启动服务器失败 ${tool.id}:`, error);
    }
  }

  /**
   * 根据工具ID查找服务器
   */
  private findServerByTool(toolId: string): string | null {
    for (const [serverId, serverProcess] of this.servers) {
      if (serverProcess.config.name === toolId || serverId === toolId) {
        return serverId;
      }
    }
    return null;
  }

  /**
   * 获取所有已注册的工具
   */
  getAllRegisteredTools(): any[] {
    return this.toolRegistry.getAllTools();
  }

  /**
   * 搜索工具
   */
  searchTools(query: string): any[] {
    return this.toolRegistry.searchTools(query);
  }

  /**
   * 获取工具统计
   */
  getToolStats(): any {
    return this.toolRegistry.getToolStats();
  }

  /**
   * 注册新工具
   */
  async registerTool(toolPath: string): Promise<ToolRegistrationResult> {
    return await this.toolRegistry.registerTool(toolPath);
  }

  /**
   * 卸载工具
   */
  async unregisterTool(toolId: string): Promise<boolean> {
    return await this.toolRegistry.unregisterTool(toolId);
  }
}