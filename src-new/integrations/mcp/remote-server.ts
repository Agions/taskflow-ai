/**
 * TaskFlow AI 远程 MCP 服务器支持
 * 支持连接和管理远程 MCP 服务器
 */

import { EventEmitter } from 'events';
import WebSocket from 'ws';
import axios, { AxiosInstance } from 'axios';
import { ConfigManager } from '../../infrastructure/config/manager';
import { CacheManager } from '../../infrastructure/storage/cache';

export interface RemoteMCPServerConfig {
  id: string;
  name: string;
  endpoint: string;
  protocol: 'websocket' | 'http' | 'sse';
  authentication: {
    type: 'none' | 'api_key' | 'oauth' | 'jwt';
    credentials: Record<string, any>;
  };
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  healthCheck: {
    enabled: boolean;
    interval: number;
    timeout: number;
  };
  rateLimiting: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
  };
}

export interface RemoteServerStatus {
  id: string;
  connected: boolean;
  lastConnected: Date | null;
  lastDisconnected: Date | null;
  reconnectAttempts: number;
  latency: number;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
  capabilities: string[];
  version: string;
}

export interface RemoteRequest {
  id: string;
  method: string;
  params: any;
  timestamp: Date;
}

export interface RemoteResponse {
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  timestamp: Date;
}

/**
 * 远程MCP服务器客户端
 */
export class RemoteMCPClient extends EventEmitter {
  private config: RemoteMCPServerConfig;
  private connection: WebSocket | AxiosInstance | null = null;
  private status: RemoteServerStatus;
  private requestQueue = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timeout: NodeJS.Timeout;
  }>();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(config: RemoteMCPServerConfig) {
    super();
    this.config = config;
    this.status = {
      id: config.id,
      connected: false,
      lastConnected: null,
      lastDisconnected: null,
      reconnectAttempts: 0,
      latency: 0,
      healthStatus: 'unhealthy',
      capabilities: [],
      version: 'unknown',
    };
  }

  /**
   * 连接远程服务器
   */
  async connect(): Promise<void> {
    try {
      console.log(`🔗 连接远程MCP服务器: ${this.config.name}`);

      switch (this.config.protocol) {
        case 'websocket':
          await this.connectWebSocket();
          break;
        case 'http':
          await this.connectHTTP();
          break;
        case 'sse':
          await this.connectSSE();
          break;
        default:
          throw new Error(`不支持的协议: ${this.config.protocol}`);
      }

      this.status.connected = true;
      this.status.lastConnected = new Date();
      this.status.reconnectAttempts = 0;

      // 获取服务器能力
      await this.fetchCapabilities();

      // 启动健康检查
      if (this.config.healthCheck.enabled) {
        this.startHealthCheck();
      }

      this.emit('connected', this.status);
      console.log(`✅ 成功连接远程MCP服务器: ${this.config.name}`);

    } catch (error) {
      this.status.connected = false;
      this.status.lastDisconnected = new Date();
      this.emit('connectionError', error);
      throw error;
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    try {
      console.log(`🔌 断开远程MCP服务器: ${this.config.name}`);

      // 停止健康检查
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }

      // 清理重连定时器
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      // 拒绝所有待处理的请求
      for (const [id, pending] of this.requestQueue) {
        clearTimeout(pending.timeout);
        pending.reject(new Error('连接已断开'));
      }
      this.requestQueue.clear();

      // 关闭连接
      if (this.connection) {
        if (this.config.protocol === 'websocket' && this.connection instanceof WebSocket) {
          this.connection.close();
        }
        this.connection = null;
      }

      this.status.connected = false;
      this.status.lastDisconnected = new Date();
      this.emit('disconnected', this.status);

    } catch (error) {
      console.error(`断开连接失败: ${error}`);
    }
  }

  /**
   * 发送请求到远程服务器
   */
  async sendRequest(method: string, params: any = {}): Promise<any> {
    if (!this.status.connected) {
      throw new Error('未连接到远程服务器');
    }

    const request: RemoteRequest = {
      id: this.generateRequestId(),
      method,
      params,
      timestamp: new Date(),
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.requestQueue.delete(request.id);
        reject(new Error(`请求超时: ${method}`));
      }, this.config.timeout);

      this.requestQueue.set(request.id, { resolve, reject, timeout });

      try {
        this.sendMessage(request);
      } catch (error) {
        this.requestQueue.delete(request.id);
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * 获取服务器状态
   */
  getStatus(): RemoteServerStatus {
    return { ...this.status };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<RemoteMCPServerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // 私有方法

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = this.buildWebSocketUrl();
      const ws = new WebSocket(wsUrl);

      ws.on('open', () => {
        this.connection = ws;
        this.setupWebSocketHandlers(ws);
        resolve();
      });

      ws.on('error', (error) => {
        reject(new Error(`WebSocket连接失败: ${error.message}`));
      });

      setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          reject(new Error('WebSocket连接超时'));
        }
      }, this.config.timeout);
    });
  }

  private async connectHTTP(): Promise<void> {
    const httpClient = axios.create({
      baseURL: this.config.endpoint,
      timeout: this.config.timeout,
      headers: this.buildAuthHeaders(),
    });

    // 测试连接
    try {
      await httpClient.get('/health');
      this.connection = httpClient;
    } catch (error) {
      throw new Error(`HTTP连接失败: ${error}`);
    }
  }

  private async connectSSE(): Promise<void> {
    // SSE 连接实现
    throw new Error('SSE协议暂未实现');
  }

  private setupWebSocketHandlers(ws: WebSocket): void {
    ws.on('message', (data) => {
      try {
        const response: RemoteResponse = JSON.parse(data.toString());
        this.handleResponse(response);
      } catch (error) {
        console.error('解析WebSocket消息失败:', error);
      }
    });

    ws.on('close', () => {
      this.status.connected = false;
      this.status.lastDisconnected = new Date();
      this.emit('disconnected', this.status);
      this.scheduleReconnect();
    });

    ws.on('error', (error) => {
      console.error(`WebSocket错误:`, error);
      this.emit('error', error);
    });
  }

  private sendMessage(request: RemoteRequest): void {
    const message = JSON.stringify(request);

    if (this.config.protocol === 'websocket' && this.connection instanceof WebSocket) {
      this.connection.send(message);
    } else if (this.config.protocol === 'http' && this.connection) {
      // HTTP 请求通过 axios 发送
      (this.connection as AxiosInstance).post('/rpc', request)
        .then(response => this.handleResponse({
          id: request.id,
          result: response.data,
          timestamp: new Date(),
        }))
        .catch(error => this.handleResponse({
          id: request.id,
          error: {
            code: -1,
            message: error.message,
          },
          timestamp: new Date(),
        }));
    }
  }

  private handleResponse(response: RemoteResponse): void {
    const pending = this.requestQueue.get(response.id);
    if (!pending) {
      return;
    }

    this.requestQueue.delete(response.id);
    clearTimeout(pending.timeout);

    if (response.error) {
      pending.reject(new Error(response.error.message));
    } else {
      pending.resolve(response.result);
    }
  }

  private async fetchCapabilities(): Promise<void> {
    try {
      const result = await this.sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'TaskFlow AI',
          version: '2.0.0',
        },
      });

      this.status.capabilities = result.capabilities || [];
      this.status.version = result.serverInfo?.version || 'unknown';
      this.status.healthStatus = 'healthy';

    } catch (error) {
      console.warn('获取服务器能力失败:', error);
      this.status.healthStatus = 'degraded';
    }
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const start = Date.now();
        await this.sendRequest('ping');
        this.status.latency = Date.now() - start;
        this.status.healthStatus = 'healthy';
      } catch (error) {
        this.status.healthStatus = 'unhealthy';
        console.warn(`健康检查失败: ${error}`);
      }
    }, this.config.healthCheck.interval);
  }

  private scheduleReconnect(): void {
    if (this.status.reconnectAttempts >= this.config.retryAttempts) {
      console.error(`重连次数超过限制: ${this.config.name}`);
      return;
    }

    const delay = this.config.retryDelay * Math.pow(2, this.status.reconnectAttempts);
    this.status.reconnectAttempts++;

    console.log(`${delay}ms 后重连远程服务器: ${this.config.name}`);

    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error(`重连失败: ${error}`);
        this.scheduleReconnect();
      }
    }, delay);
  }

  private buildWebSocketUrl(): string {
    const url = new URL(this.config.endpoint);
    
    // 添加认证参数
    if (this.config.authentication.type === 'api_key') {
      url.searchParams.set('api_key', this.config.authentication.credentials.apiKey);
    }

    return url.toString();
  }

  private buildAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    switch (this.config.authentication.type) {
      case 'api_key':
        headers['Authorization'] = `Bearer ${this.config.authentication.credentials.apiKey}`;
        break;
      case 'jwt':
        headers['Authorization'] = `Bearer ${this.config.authentication.credentials.token}`;
        break;
    }

    return headers;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 远程MCP服务器管理器
 */
export class RemoteMCPServerManager extends EventEmitter {
  private clients = new Map<string, RemoteMCPClient>();
  private configManager: ConfigManager;
  private cacheManager: CacheManager;

  constructor(configManager: ConfigManager, cacheManager: CacheManager) {
    super();
    this.configManager = configManager;
    this.cacheManager = cacheManager;
  }

  /**
   * 添加远程服务器
   */
  async addServer(config: RemoteMCPServerConfig): Promise<void> {
    if (this.clients.has(config.id)) {
      throw new Error(`远程服务器已存在: ${config.id}`);
    }

    const client = new RemoteMCPClient(config);
    
    // 设置事件监听
    client.on('connected', (status) => {
      this.emit('serverConnected', status);
    });

    client.on('disconnected', (status) => {
      this.emit('serverDisconnected', status);
    });

    client.on('error', (error) => {
      this.emit('serverError', config.id, error);
    });

    this.clients.set(config.id, client);

    // 尝试连接
    try {
      await client.connect();
    } catch (error) {
      console.warn(`初始连接失败，将在后台重试: ${config.name}`);
    }

    console.log(`✅ 远程服务器已添加: ${config.name}`);
  }

  /**
   * 移除远程服务器
   */
  async removeServer(serverId: string): Promise<void> {
    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(`远程服务器不存在: ${serverId}`);
    }

    await client.disconnect();
    this.clients.delete(serverId);

    console.log(`🗑️ 远程服务器已移除: ${serverId}`);
  }

  /**
   * 获取所有远程服务器状态
   */
  getAllServerStatuses(): RemoteServerStatus[] {
    return Array.from(this.clients.values()).map(client => client.getStatus());
  }

  /**
   * 获取特定服务器状态
   */
  getServerStatus(serverId: string): RemoteServerStatus | null {
    const client = this.clients.get(serverId);
    return client ? client.getStatus() : null;
  }

  /**
   * 向远程服务器发送请求
   */
  async sendRequest(serverId: string, method: string, params: any = {}): Promise<any> {
    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(`远程服务器不存在: ${serverId}`);
    }

    return await client.sendRequest(method, params);
  }

  /**
   * 关闭所有远程连接
   */
  async shutdown(): Promise<void> {
    const disconnectPromises = Array.from(this.clients.values()).map(client => 
      client.disconnect()
    );

    await Promise.allSettled(disconnectPromises);
    this.clients.clear();

    console.log('✅ 所有远程MCP服务器连接已关闭');
  }
}

export default RemoteMCPServerManager;