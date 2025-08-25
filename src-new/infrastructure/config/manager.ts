/**
 * TaskFlow AI 统一配置管理器
 * 整合项目、MCP、安全等所有配置管理功能
 */

import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { EventEmitter } from 'events';
import { z } from 'zod';

// 配置模式定义
export const ConfigSchema = z.object({
  // 基础设置
  general: z.object({
    version: z.string().default('2.0.0'),
    language: z.enum(['zh-CN', 'en-US']).default('zh-CN'),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    theme: z.enum(['light', 'dark', 'auto']).default('auto'),
    autoSave: z.boolean().default(true),
    autoUpdate: z.boolean().default(true),
  }).default({}),

  // AI模型配置
  models: z.object({
    default: z.string().default('deepseek'),
    providers: z.record(z.object({
      name: z.string(),
      endpoint: z.string(),
      apiKey: z.string(),
      model: z.string().optional(),
      maxTokens: z.number().default(4000),
      temperature: z.number().min(0).max(2).default(0.7),
      timeout: z.number().default(30000),
      enabled: z.boolean().default(true),
      costPerToken: z.number().default(0.001),
    })).default({}),
    fallback: z.array(z.string()).default(['deepseek', 'zhipu']),
    loadBalancing: z.object({
      enabled: z.boolean().default(true),
      strategy: z.enum(['round-robin', 'least-used', 'performance']).default('performance'),
      healthCheck: z.boolean().default(true),
    }).default({}),
  }).default({}),

  // 项目设置
  project: z.object({
    workspaceDir: z.string().default(process.cwd()),
    defaultLanguage: z.string().default('typescript'),
    templates: z.record(z.any()).default({}),
    estimation: z.object({
      defaultVelocity: z.number().default(6), // 每天6小时
      complexityMultiplier: z.object({
        simple: z.number().default(1),
        medium: z.number().default(2),
        complex: z.number().default(4),
      }).default({}),
    }).default({}),
  }).default({}),

  // 缓存配置
  cache: z.object({
    type: z.enum(['memory', 'filesystem', 'hybrid']).default('hybrid'),
    maxSize: z.number().default(100 * 1024 * 1024), // 100MB
    ttl: z.number().default(3600), // 1小时
    cleanupInterval: z.number().default(300), // 5分钟
    persistToDisk: z.boolean().default(true),
    compression: z.boolean().default(true),
  }).default({}),

  // 安全配置
  security: z.object({
    encryption: z.object({
      algorithm: z.string().default('aes-256-gcm'),
      keySize: z.number().default(32),
    }).default({}),
    jwt: z.object({
      secret: z.string().optional(),
      expiresIn: z.string().default('24h'),
    }).default({}),
    apiKeys: z.object({
      autoRotation: z.boolean().default(false),
      rotationInterval: z.number().default(30), // 30天
    }).default({}),
  }).default({}),

  // MCP服务器配置
  mcpServers: z.record(z.object({
    // 本地服务器
    command: z.string().optional(),
    args: z.array(z.string()).optional(),
    env: z.record(z.string()).optional(),
    cwd: z.string().optional(),
    
    // 远程服务器
    httpUrl: z.string().optional(),
    headers: z.record(z.string()).optional(),
    
    // 通用配置
    timeout: z.number().default(30000),
    trust: z.boolean().default(false),
    enabled: z.boolean().default(true),
    autoRestart: z.boolean().default(true),
    maxRetries: z.number().default(3),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
  })).default({}),

  // MCP全局设置
  mcpGlobal: z.object({
    defaultTimeout: z.number().default(30000),
    maxConcurrentServers: z.number().default(10),
    enableHealthCheck: z.boolean().default(true),
    healthCheckInterval: z.number().default(30000),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    enableMetrics: z.boolean().default(true),
    trustedDomains: z.array(z.string()).default([]),
  }).default({}),

  // CLI界面配置
  ui: z.object({
    editor: z.enum(['vscode', 'cursor', 'vim', 'nano']).default('vscode'),
    showWelcome: z.boolean().default(true),
    colorOutput: z.boolean().default(true),
    progressBar: z.boolean().default(true),
    notifications: z.boolean().default(true),
    shortcuts: z.record(z.string()).default({}),
  }).default({}),

  // 扩展配置
  extensions: z.record(z.any()).default({}),
});

export type Config = z.infer<typeof ConfigSchema>;

export interface ConfigWatcher {
  (config: Config, changes: string[]): void;
}

/**
 * 统一配置管理器
 * 负责配置文件的加载、保存、验证和热重载
 */
export class ConfigManager extends EventEmitter {
  private config: Config;
  private configPath: string;
  private watchers = new Set<ConfigWatcher>();
  private watcherTimer?: NodeJS.Timeout;
  private lastModified?: Date;
  private initialized = false;

  constructor(configPath?: string) {
    super();
    this.configPath = configPath || this.getDefaultConfigPath();
    this.config = this.createDefaultConfig();
  }

  /**
   * 初始化配置管理器
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 确保配置目录存在
      const configDir = path.dirname(this.configPath);
      await fs.ensureDir(configDir);

      // 加载配置文件
      await this.loadConfig();

      // 启动文件监控
      this.startFileWatcher();

      this.initialized = true;
      console.log(`✅ 配置管理器初始化成功: ${this.configPath}`);

    } catch (error) {
      console.error('❌ 配置管理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 获取配置值
   */
  get<T = any>(keyPath: string, defaultValue?: T): T {
    this.ensureInitialized();

    const keys = keyPath.split('.');
    let current: any = this.config;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue as T;
      }
    }

    return current as T;
  }

  /**
   * 设置配置值
   */
  async set(keyPath: string, value: any): Promise<void> {
    this.ensureInitialized();

    const keys = keyPath.split('.');
    const lastKey = keys.pop()!;
    let current: any = this.config;

    // 导航到目标对象
    for (const key of keys) {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    // 设置值
    const oldValue = current[lastKey];
    current[lastKey] = value;

    // 验证配置
    const result = ConfigSchema.safeParse(this.config);
    if (!result.success) {
      // 回滚更改
      current[lastKey] = oldValue;
      throw new Error(`配置验证失败: ${result.error.message}`);
    }

    // 保存配置
    await this.saveConfig();

    // 通知观察者
    this.notifyWatchers([keyPath]);

    console.log(`⚙️ 配置已更新: ${keyPath} = ${JSON.stringify(value)}`);
  }

  /**
   * 批量更新配置
   */
  async update(updates: Record<string, any>): Promise<void> {
    this.ensureInitialized();

    const changes: string[] = [];
    const backup = JSON.parse(JSON.stringify(this.config));

    try {
      // 应用所有更改
      for (const [keyPath, value] of Object.entries(updates)) {
        const keys = keyPath.split('.');
        const lastKey = keys.pop()!;
        let current: any = this.config;

        for (const key of keys) {
          if (!current[key] || typeof current[key] !== 'object') {
            current[key] = {};
          }
          current = current[key];
        }

        current[lastKey] = value;
        changes.push(keyPath);
      }

      // 验证整个配置
      const result = ConfigSchema.safeParse(this.config);
      if (!result.success) {
        throw new Error(`配置验证失败: ${result.error.message}`);
      }

      // 保存配置
      await this.saveConfig();

      // 通知观察者
      this.notifyWatchers(changes);

      console.log(`⚙️ 批量更新了 ${changes.length} 个配置项`);

    } catch (error) {
      // 回滚所有更改
      this.config = backup;
      throw error;
    }
  }

  /**
   * 重置配置为默认值
   */
  async reset(keyPath?: string): Promise<void> {
    this.ensureInitialized();

    if (keyPath) {
      // 重置特定配置项
      const defaultConfig = this.createDefaultConfig();
      const defaultValue = this.getValueByPath(defaultConfig, keyPath);
      await this.set(keyPath, defaultValue);
    } else {
      // 重置所有配置
      this.config = this.createDefaultConfig();
      await this.saveConfig();
      this.notifyWatchers(['*']);
      console.log('🔄 配置已重置为默认值');
    }
  }

  /**
   * 验证配置完整性
   */
  validate(): { valid: boolean; errors: string[] } {
    const result = ConfigSchema.safeParse(this.config);
    
    if (result.success) {
      return { valid: true, errors: [] };
    } else {
      const errors = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      return { valid: false, errors };
    }
  }

  /**
   * 获取当前完整配置
   */
  getAll(): Config {
    this.ensureInitialized();
    return JSON.parse(JSON.stringify(this.config));
  }

  /**
   * 导出配置到文件
   */
  async export(filePath: string): Promise<void> {
    this.ensureInitialized();

    const exportData = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      config: this.config,
    };

    await fs.writeJson(filePath, exportData, { spaces: 2 });
    console.log(`📤 配置已导出到: ${filePath}`);
  }

  /**
   * 从文件导入配置
   */
  async import(filePath: string, merge: boolean = true): Promise<void> {
    this.ensureInitialized();

    if (!await fs.pathExists(filePath)) {
      throw new Error(`配置文件不存在: ${filePath}`);
    }

    const importData = await fs.readJson(filePath);
    const importedConfig = importData.config || importData;

    // 验证导入的配置
    const result = ConfigSchema.safeParse(importedConfig);
    if (!result.success) {
      throw new Error(`导入配置验证失败: ${result.error.message}`);
    }

    if (merge) {
      // 合并配置
      this.config = this.mergeConfigs(this.config, result.data);
    } else {
      // 替换配置
      this.config = result.data;
    }

    await this.saveConfig();
    this.notifyWatchers(['*']);

    console.log(`📥 配置已从文件导入: ${filePath}`);
  }

  /**
   * 添加配置观察者
   */
  addWatcher(callback: ConfigWatcher): void {
    this.watchers.add(callback);
  }

  /**
   * 移除配置观察者
   */
  removeWatcher(callback: ConfigWatcher): void {
    this.watchers.delete(callback);
  }

  /**
   * 获取配置文件路径
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * 重新加载配置文件
   */
  async reload(): Promise<void> {
    await this.loadConfig();
    this.notifyWatchers(['*']);
    console.log('🔄 配置文件已重新加载');
  }

  /**
   * 关闭配置管理器
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      // 停止文件监控
      if (this.watcherTimer) {
        clearInterval(this.watcherTimer);
      }

      // 保存当前配置
      await this.saveConfig();

      // 清理观察者
      this.watchers.clear();

      this.initialized = false;
      console.log('✅ 配置管理器已关闭');

    } catch (error) {
      console.error('❌ 配置管理器关闭失败:', error);
      throw error;
    }
  }

  // 私有方法

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('配置管理器尚未初始化');
    }
  }

  private getDefaultConfigPath(): string {
    const taskflowDir = path.join(os.homedir(), '.taskflow');
    return path.join(taskflowDir, 'config.json');
  }

  private createDefaultConfig(): Config {
    return ConfigSchema.parse({});
  }

  private async loadConfig(): Promise<void> {
    try {
      if (await fs.pathExists(this.configPath)) {
        const fileContent = await fs.readJson(this.configPath);
        const result = ConfigSchema.safeParse(fileContent);

        if (result.success) {
          this.config = result.data;
          
          // 更新文件修改时间
          const stats = await fs.stat(this.configPath);
          this.lastModified = stats.mtime;
        } else {
          console.warn('⚠️ 配置文件格式错误，使用默认配置:', result.error.message);
          this.config = this.createDefaultConfig();
          await this.saveConfig();
        }
      } else {
        // 创建默认配置文件
        this.config = this.createDefaultConfig();
        await this.saveConfig();
      }
    } catch (error) {
      console.error('❌ 加载配置文件失败:', error);
      this.config = this.createDefaultConfig();
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      const configDir = path.dirname(this.configPath);
      await fs.ensureDir(configDir);
      
      await fs.writeJson(this.configPath, this.config, { spaces: 2 });
      
      // 更新文件修改时间
      const stats = await fs.stat(this.configPath);
      this.lastModified = stats.mtime;

    } catch (error) {
      console.error('❌ 保存配置文件失败:', error);
      throw error;
    }
  }

  private startFileWatcher(): void {
    // 定期检查文件是否被外部修改
    this.watcherTimer = setInterval(async () => {
      try {
        if (await fs.pathExists(this.configPath)) {
          const stats = await fs.stat(this.configPath);
          
          if (!this.lastModified || stats.mtime > this.lastModified) {
            console.log('📁 检测到配置文件外部修改，重新加载...');
            await this.loadConfig();
            this.notifyWatchers(['*']);
          }
        }
      } catch (error) {
        console.error('文件监控错误:', error);
      }
    }, 5000); // 每5秒检查一次
  }

  private notifyWatchers(changes: string[]): void {
    for (const watcher of this.watchers) {
      try {
        watcher(this.config, changes);
      } catch (error) {
        console.error('配置观察者错误:', error);
      }
    }

    this.emit('configChanged', this.config, changes);
  }

  private getValueByPath(obj: any, keyPath: string): any {
    const keys = keyPath.split('.');
    let current = obj;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return current;
  }

  private mergeConfigs(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.mergeConfigs(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }
}