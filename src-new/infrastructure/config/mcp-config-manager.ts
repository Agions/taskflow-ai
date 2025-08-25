/**
 * TaskFlow AI 增强的 MCP 配置管理系统
 * 参考 gemini-cli 的设计，支持本地和远程 MCP 服务器
 */

import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { z } from 'zod';

// MCP 服务器配置类型定义
export const MCPServerConfigSchema = z.object({
  // 本地 MCP 服务器配置
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
  cwd: z.string().optional(),
  
  // 远程 MCP 服务器配置
  httpUrl: z.string().optional(),
  headers: z.record(z.string()).optional(),
  
  // 通用配置
  timeout: z.number().default(30000),
  trust: z.boolean().default(false),
  enabled: z.boolean().default(true),
  autoRestart: z.boolean().default(true),
  maxRetries: z.number().default(3),
  
  // 描述信息
  description: z.string().optional(),
  version: z.string().optional(),
  tags: z.array(z.string()).optional(),
}).refine(
  (data) => data.command || data.httpUrl,
  {
    message: "Either 'command' or 'httpUrl' must be provided",
    path: ["command", "httpUrl"]
  }
);

export const MCPConfigSchema = z.object({
  mcpServers: z.record(MCPServerConfigSchema),
  globalSettings: z.object({
    defaultTimeout: z.number().default(30000),
    maxConcurrentServers: z.number().default(10),
    enableHealthCheck: z.boolean().default(true),
    healthCheckInterval: z.number().default(30000),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    enableMetrics: z.boolean().default(true),
    trustedDomains: z.array(z.string()).default([]),
  }).default({}),
});

export type MCPServerConfig = z.infer<typeof MCPServerConfigSchema>;
export type MCPConfig = z.infer<typeof MCPConfigSchema>;

export interface MCPServerStatus {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error' | 'starting' | 'stopping';
  pid?: number;
  uptime: number;
  lastError?: string;
  restartCount: number;
  tools: MCPTool[];
  resources: MCPResource[];
  isRemote: boolean;
  endpoint?: string;
  healthCheck: {
    lastCheck: Date;
    healthy: boolean;
    responseTime: number;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
  trusted: boolean;
  usage: {
    callCount: number;
    lastUsed: Date;
    averageResponseTime: number;
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

/**
 * 增强的 MCP 配置管理器
 * 参考 gemini-cli 的设计模式
 */
export class MCPConfigManager {
  private configPath: string;
  private config: MCPConfig;
  private serverStatuses = new Map<string, MCPServerStatus>();
  private watchers = new Set<(config: MCPConfig) => void>();

  constructor(configPath?: string) {
    this.configPath = configPath || this.getDefaultConfigPath();
    this.config = this.loadConfig();
  }

  /**
   * 获取默认配置文件路径
   */
  private getDefaultConfigPath(): string {
    const taskflowDir = path.join(os.homedir(), '.taskflow');
    if (!fs.existsSync(taskflowDir)) {
      fs.mkdirSync(taskflowDir, { recursive: true });
    }
    return path.join(taskflowDir, 'settings.json');
  }

  /**
   * 加载配置文件
   */
  private loadConfig(): MCPConfig {
    try {
      if (!fs.existsSync(this.configPath)) {
        return this.createDefaultConfig();
      }

      const configData = fs.readJsonSync(this.configPath);
      const result = MCPConfigSchema.safeParse(configData);

      if (!result.success) {
        console.warn('⚠️ MCP 配置文件格式错误，使用默认配置:', result.error.message);
        return this.createDefaultConfig();
      }

      console.log(`✅ MCP 配置加载成功: ${this.configPath}`);
      return result.data;

    } catch (error) {
      console.error('❌ 加载 MCP 配置失败:', error);
      return this.createDefaultConfig();
    }
  }

  /**
   * 创建默认配置
   */
  private createDefaultConfig(): MCPConfig {
    const defaultConfig: MCPConfig = {
      mcpServers: {
        // TaskFlow 内置工具服务器
        'taskflow-tools': {
          command: 'node',
          args: ['bin/mcp-server.js'],
          cwd: process.cwd(),
          trust: true,
          description: 'TaskFlow AI 内置工具服务器',
          tags: ['builtin', 'taskflow', 'tools'],
        },
        
        // 文件系统服务器（默认禁用）
        'filesystem': {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
          enabled: false,
          description: '文件系统访问服务器',
          tags: ['filesystem', 'files'],
        },
        
        // GitHub 服务器示例（需要配置）
        'github': {
          httpUrl: 'https://api.githubcopilot.com/mcp/',
          headers: {
            'Authorization': 'Bearer ${GITHUB_TOKEN}',
          },
          enabled: false,
          description: 'GitHub 集成服务器',
          tags: ['github', 'remote', 'git'],
        },
      },
      globalSettings: {
        defaultTimeout: 30000,
        maxConcurrentServers: 10,
        enableHealthCheck: true,
        healthCheckInterval: 30000,
        logLevel: 'info',
        enableMetrics: true,
        trustedDomains: ['api.githubcopilot.com', 'localhost'],
      },
    };

    this.saveConfig(defaultConfig);
    return defaultConfig;
  }

  /**
   * 保存配置
   */
  public saveConfig(config?: MCPConfig): void {
    const configToSave = config || this.config;

    try {
      fs.writeJsonSync(this.configPath, configToSave, { spaces: 2 });
      this.config = configToSave;
      
      // 通知观察者
      this.watchers.forEach(watcher => watcher(this.config));
      
      console.log(`✅ MCP 配置已保存: ${this.configPath}`);
    } catch (error) {
      console.error('❌ 保存 MCP 配置失败:', error);
      throw error;
    }
  }

  /**
   * 获取当前配置
   */
  public getConfig(): MCPConfig {
    return this.config;
  }

  /**
   * 获取服务器配置
   */
  public getServerConfig(serverId: string): MCPServerConfig | undefined {
    return this.config.mcpServers[serverId];
  }

  /**
   * 添加或更新服务器配置
   */
  public setServerConfig(serverId: string, config: MCPServerConfig): void {
    const result = MCPServerConfigSchema.safeParse(config);
    if (!result.success) {
      throw new Error(`无效的服务器配置: ${result.error.message}`);
    }

    this.config.mcpServers[serverId] = result.data;
    this.saveConfig();
  }

  /**
   * 删除服务器配置
   */
  public removeServerConfig(serverId: string): boolean {
    if (!(serverId in this.config.mcpServers)) {
      return false;
    }

    delete this.config.mcpServers[serverId];
    this.saveConfig();
    return true;
  }

  /**
   * 获取启用的服务器列表
   */
  public getEnabledServers(): Array<{ id: string; config: MCPServerConfig }> {
    return Object.entries(this.config.mcpServers)
      .filter(([_, config]) => config.enabled)
      .map(([id, config]) => ({ id, config }));
  }

  /**
   * 启用/禁用服务器
   */
  public toggleServer(serverId: string, enabled: boolean): void {
    const config = this.config.mcpServers[serverId];
    if (!config) {
      throw new Error(`服务器不存在: ${serverId}`);
    }

    config.enabled = enabled;
    this.saveConfig();
  }

  /**
   * 获取服务器状态
   */
  public getServerStatus(serverId: string): MCPServerStatus | undefined {
    return this.serverStatuses.get(serverId);
  }

  /**
   * 更新服务器状态
   */
  public updateServerStatus(serverId: string, status: Partial<MCPServerStatus>): void {
    const currentStatus = this.serverStatuses.get(serverId);
    if (!currentStatus) {
      return;
    }

    const updatedStatus = { ...currentStatus, ...status };
    this.serverStatuses.set(serverId, updatedStatus);
  }

  /**
   * 设置服务器状态
   */
  public setServerStatus(serverId: string, status: MCPServerStatus): void {
    this.serverStatuses.set(serverId, status);
  }

  /**
   * 获取所有服务器状态
   */
  public getAllServerStatuses(): Map<string, MCPServerStatus> {
    return new Map(this.serverStatuses);
  }

  /**
   * 验证远程服务器配置
   */
  public validateRemoteServer(config: MCPServerConfig): boolean {
    if (!config.httpUrl) {
      return false;
    }

    try {
      const url = new URL(config.httpUrl);
      const trustedDomains = this.config.globalSettings.trustedDomains;
      
      return trustedDomains.includes(url.hostname) || config.trust;
    } catch {
      return false;
    }
  }

  /**
   * 获取服务器预设配置
   */
  public getServerPresets(): Record<string, MCPServerConfig> {
    return {
      'github': {
        httpUrl: 'https://api.githubcopilot.com/mcp/',
        headers: {
          'Authorization': 'Bearer ${GITHUB_TOKEN}',
        },
        description: 'GitHub 官方 MCP 服务器',
        tags: ['github', 'remote', 'git'],
      },
      'filesystem': {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem'],
        description: '文件系统访问服务器',
        tags: ['filesystem', 'files'],
      },
      'brave-search': {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-brave-search'],
        env: {
          'BRAVE_API_KEY': '${BRAVE_API_KEY}',
        },
        description: 'Brave 搜索服务器',
        tags: ['search', 'web'],
      },
      'postgres': {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-postgres'],
        env: {
          'POSTGRES_CONNECTION_STRING': '${POSTGRES_CONNECTION_STRING}',
        },
        description: 'PostgreSQL 数据库服务器',
        tags: ['database', 'postgres'],
      },
    };
  }

  /**
   * 从预设创建服务器配置
   */
  public createFromPreset(serverId: string, presetName: string, overrides?: Partial<MCPServerConfig>): void {
    const presets = this.getServerPresets();
    const preset = presets[presetName];
    
    if (!preset) {
      throw new Error(`预设不存在: ${presetName}`);
    }

    const config = { ...preset, ...overrides };
    this.setServerConfig(serverId, config);
  }

  /**
   * 添加配置观察者
   */
  public addWatcher(callback: (config: MCPConfig) => void): void {
    this.watchers.add(callback);
  }

  /**
   * 移除配置观察者
   */
  public removeWatcher(callback: (config: MCPConfig) => void): void {
    this.watchers.delete(callback);
  }

  /**
   * 重新加载配置
   */
  public reloadConfig(): void {
    this.config = this.loadConfig();
    this.watchers.forEach(watcher => watcher(this.config));
  }

  /**
   * 验证配置完整性
   */
  public validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      MCPConfigSchema.parse(this.config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
      }
    }

    // 检查环境变量
    for (const [serverId, serverConfig] of Object.entries(this.config.mcpServers)) {
      if (serverConfig.httpUrl && serverConfig.headers) {
        for (const [key, value] of Object.entries(serverConfig.headers)) {
          if (typeof value === 'string' && value.includes('${') && value.includes('}')) {
            const envVar = value.match(/\$\{(.+?)\}/)?.[1];
            if (envVar && !process.env[envVar]) {
              errors.push(`服务器 ${serverId}: 环境变量 ${envVar} 未设置`);
            }
          }
        }
      }

      if (serverConfig.env) {
        for (const [key, value] of Object.entries(serverConfig.env)) {
          if (value.includes('${') && value.includes('}')) {
            const envVar = value.match(/\$\{(.+?)\}/)?.[1];
            if (envVar && !process.env[envVar]) {
              errors.push(`服务器 ${serverId}: 环境变量 ${envVar} 未设置`);
            }
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 导出配置
   */
  public exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * 导入配置
   */
  public importConfig(configJson: string): void {
    try {
      const importedConfig = JSON.parse(configJson);
      const result = MCPConfigSchema.safeParse(importedConfig);

      if (!result.success) {
        throw new Error(`无效的配置格式: ${result.error.message}`);
      }

      this.config = result.data;
      this.saveConfig();
    } catch (error) {
      throw new Error(`导入配置失败: ${error}`);
    }
  }
}