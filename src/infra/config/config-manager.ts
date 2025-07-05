/**
 * 配置管理器 - 统一管理TaskFlow AI的所有配置
 * 支持多环境配置、动态配置更新、配置验证等功能
 */

import { readFileSync, writeFileSync, existsSync, watchFile } from 'fs';
import { resolve } from 'path';
import { Logger } from '../logger';
import { JSONValue } from '../../types/strict-types';
// InputValidator, ValidationRule, JSONObject 未使用，已移除
import { MCPConfigGenerator } from './mcp-config-generator';
import {
  EditorType,
  MCPConfig,
  MCPConfigOptions,
  ValidationResult,
  TestResult
} from '../../types/mcp';

/**
 * 配置环境枚举
 */
export enum ConfigEnvironment {
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  STAGING = 'staging',
  PRODUCTION = 'production'
}

/**
 * 配置源类型
 */
export enum ConfigSource {
  FILE = 'file',
  ENVIRONMENT = 'environment',
  DATABASE = 'database',
  REMOTE = 'remote',
  MEMORY = 'memory'
}

/**
 * 配置项接口
 */
export interface ConfigItem {
  key: string;
  value: JSONValue;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  required?: boolean;
  defaultValue?: JSONValue;
  validation?: ConfigValidation;
  source: ConfigSource;
  lastModified: Date;
  environment?: ConfigEnvironment;
}

/**
 * 配置验证规则
 */
export interface ConfigValidation {
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'email' | 'url' | 'regex';
  min?: number;
  max?: number;
  pattern?: string;
  enum?: JSONValue[];
  required?: boolean;
  custom?: (value: JSONValue) => boolean | string;
}

/**
 * 配置变更事件
 */
export interface ConfigChangeEvent {
  key: string;
  oldValue: JSONValue | undefined;
  newValue: JSONValue | undefined;
  source: ConfigSource;
  timestamp: Date;
  environment: ConfigEnvironment;
}

/**
 * 配置管理器选项
 */
export interface ConfigManagerOptions {
  environment: ConfigEnvironment;
  configDir: string;
  enableFileWatch: boolean;
  enableValidation: boolean;
  enableCache: boolean;
  cacheTimeout: number;                        // 缓存超时时间(ms)
  autoSave: boolean;
  backupEnabled: boolean;
  encryptSensitive: boolean;
}

/**
 * 配置管理器类
 */
export class ConfigManager {
  private logger: Logger;
  private options: ConfigManagerOptions;
  private configs: Map<string, ConfigItem> = new Map();
  private watchers: Map<string, ((event: ConfigChangeEvent) => void)[]> = new Map();
  private cache: Map<string, { value: JSONValue; timestamp: number }> = new Map();
  private validationRules: Map<string, ConfigValidation> = new Map();
  private changeListeners: Array<(event: ConfigChangeEvent) => void> = [];
  private mcpGenerator: MCPConfigGenerator;

  constructor(logger: Logger, options?: Partial<ConfigManagerOptions>) {
    this.logger = logger;
    this.options = {
      environment: ConfigEnvironment.DEVELOPMENT,
      configDir: './config',
      enableFileWatch: true,
      enableValidation: true,
      enableCache: true,
      cacheTimeout: 300000, // 5分钟
      autoSave: false,
      backupEnabled: true,
      encryptSensitive: false,
      ...options
    };

    // 初始化MCP配置生成器
    this.mcpGenerator = new MCPConfigGenerator(logger);

    this.initializeDefaultConfigs();
    this.loadConfigurations();

    if (this.options.enableFileWatch) {
      this.setupFileWatching();
    }
  }

  /**
   * 获取配置值
   * @param key 配置键
   * @param defaultValue 默认值
   */
  public get<T extends JSONValue = JSONValue>(key: string, defaultValue?: T): T {
    // 检查缓存
    if (this.options.enableCache) {
      const cached = this.cache.get(key);
      if (cached && Date.now() - cached.timestamp < this.options.cacheTimeout) {
        return cached.value as T;
      }
    }

    const configItem = this.configs.get(key);
    let value: T;

    if (configItem) {
      value = configItem.value as T;
    } else {
      // 尝试从环境变量获取
      const envValue = this.getFromEnvironment(key);
      if (envValue !== undefined) {
        value = envValue as T;
      } else {
        value = defaultValue as T;
      }
    }

    // 更新缓存
    if (this.options.enableCache && value !== undefined) {
      this.cache.set(key, { value, timestamp: Date.now() });
    }

    return value;
  }

  /**
   * 设置配置值
   * @param key 配置键
   * @param value 配置值
   * @param source 配置源
   */
  public set(key: string, value: JSONValue, source: ConfigSource = ConfigSource.MEMORY): void {
    const oldValue = this.get(key);

    // 验证配置值
    if (this.options.enableValidation) {
      const validation = this.validationRules.get(key);
      if (validation) {
        const validationResult = this.validateValue(value, validation);
        if (validationResult !== true) {
          throw new Error(`配置验证失败 ${key}: ${validationResult}`);
        }
      }
    }

    const configItem: ConfigItem = {
      key,
      value,
      type: this.inferType(value),
      source,
      lastModified: new Date(),
      environment: this.options.environment
    };

    this.configs.set(key, configItem);

    // 清除缓存
    if (this.options.enableCache) {
      this.cache.delete(key);
    }

    // 触发变更事件
    this.notifyChange({
      key,
      oldValue,
      newValue: value,
      source,
      timestamp: new Date(),
      environment: this.options.environment
    });

    // 自动保存
    if (this.options.autoSave && source !== ConfigSource.FILE) {
      this.saveToFile();
    }

    this.logger.debug(`配置已更新: ${key} = ${JSON.stringify(value)}`);
  }

  /**
   * 检查配置是否存在
   * @param key 配置键
   */
  public has(key: string): boolean {
    return this.configs.has(key) || this.getFromEnvironment(key) !== undefined;
  }

  /**
   * 删除配置
   * @param key 配置键
   */
  public delete(key: string): boolean {
    const existed = this.configs.has(key);

    if (existed) {
      const oldValue = this.configs.get(key)?.value;
      this.configs.delete(key);
      this.cache.delete(key);

      // 触发变更事件
      this.notifyChange({
        key,
        oldValue,
        newValue: undefined,
        source: ConfigSource.MEMORY,
        timestamp: new Date(),
        environment: this.options.environment
      });

      if (this.options.autoSave) {
        this.saveToFile();
      }

      this.logger.debug(`配置已删除: ${key}`);
    }

    return existed;
  }

  /**
   * 清空所有配置
   */
  public clear(): void {
    const keys = Array.from(this.configs.keys());
    this.configs.clear();
    this.cache.clear();

    keys.forEach(key => {
      this.notifyChange({
        key,
        oldValue: undefined,
        newValue: undefined,
        source: ConfigSource.MEMORY,
        timestamp: new Date(),
        environment: this.options.environment
      });
    });

    if (this.options.autoSave) {
      this.saveToFile();
    }

    this.logger.info('所有配置已清空');
  }

  /**
   * 获取所有配置
   */
  public getAll(): Record<string, JSONValue> {
    const result: Record<string, JSONValue> = {};

    this.configs.forEach((item, key) => {
      result[key] = item.value;
    });

    return result;
  }

  /**
   * 批量设置配置
   * @param configs 配置对象
   * @param source 配置源
   */
  public setMany(configs: Record<string, JSONValue>, source: ConfigSource = ConfigSource.MEMORY): void {
    Object.entries(configs).forEach(([key, value]) => {
      this.set(key, value, source);
    });
  }

  /**
   * 监听配置变更
   * @param key 配置键，为空则监听所有变更
   * @param callback 回调函数
   */
  public watch(key: string | null, callback: (event: ConfigChangeEvent) => void): () => void {
    if (key) {
      if (!this.watchers.has(key)) {
        this.watchers.set(key, []);
      }
      this.watchers.get(key)!.push(callback);

      // 返回取消监听的函数
      return () => {
        const callbacks = this.watchers.get(key);
        if (callbacks) {
          const index = callbacks.indexOf(callback);
          if (index > -1) {
            callbacks.splice(index, 1);
          }
        }
      };
    } else {
      this.changeListeners.push(callback);

      return () => {
        const index = this.changeListeners.indexOf(callback);
        if (index > -1) {
          this.changeListeners.splice(index, 1);
        }
      };
    }
  }

  /**
   * 添加配置验证规则
   * @param key 配置键
   * @param validation 验证规则
   */
  public addValidation(key: string, validation: ConfigValidation): void {
    this.validationRules.set(key, validation);
  }

  /**
   * 验证所有配置
   */
  public validateAll(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    this.validationRules.forEach((validation, key) => {
      const value = this.get(key);
      const result = this.validateValue(value, validation);

      if (result !== true) {
        errors.push(`${key}: ${result}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 从文件加载配置
   * @param filePath 文件路径
   */
  public loadFromFile(filePath?: string): void {
    const configPath = filePath || this.getConfigFilePath();

    if (!existsSync(configPath)) {
      this.logger.warn(`配置文件不存在: ${configPath}`);
      return;
    }

    try {
      const content = readFileSync(configPath, 'utf-8');
      const configs = JSON.parse(content);

      Object.entries(configs).forEach(([key, value]) => {
        this.set(key, value as JSONValue, ConfigSource.FILE);
      });

      this.logger.info(`配置已从文件加载: ${configPath}`);
    } catch (error) {
      this.logger.error(`加载配置文件失败: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * 保存配置到文件
   * @param filePath 文件路径
   */
  public saveToFile(filePath?: string): void {
    const configPath = filePath || this.getConfigFilePath();

    try {
      // 创建备份
      if (this.options.backupEnabled && existsSync(configPath)) {
        const backupPath = `${configPath}.backup.${Date.now()}`;
        const content = readFileSync(configPath, 'utf-8');
        writeFileSync(backupPath, content);
      }

      const configs = this.getAll();
      const content = JSON.stringify(configs, null, 2);
      writeFileSync(configPath, content, 'utf-8');

      this.logger.info(`配置已保存到文件: ${configPath}`);
    } catch (error) {
      this.logger.error(`保存配置文件失败: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * 重新加载配置
   */
  public reload(): void {
    this.logger.info('重新加载配置');
    this.cache.clear();
    this.loadConfigurations();
  }

  /**
   * 获取配置统计信息
   */
  public getStats(): {
    totalConfigs: number;
    configsBySource: Record<ConfigSource, number>;
    configsByType: Record<string, number>;
    cacheHitRate: number;
  } {
    const configsBySource: Record<ConfigSource, number> = {
      [ConfigSource.FILE]: 0,
      [ConfigSource.ENVIRONMENT]: 0,
      [ConfigSource.DATABASE]: 0,
      [ConfigSource.REMOTE]: 0,
      [ConfigSource.MEMORY]: 0
    };

    const configsByType: Record<string, number> = {};

    this.configs.forEach(item => {
      configsBySource[item.source]++;
      configsByType[item.type] = (configsByType[item.type] || 0) + 1;
    });

    return {
      totalConfigs: this.configs.size,
      configsBySource,
      configsByType,
      cacheHitRate: this.cache.size / Math.max(this.configs.size, 1)
    };
  }

  // 私有方法

  /**
   * 初始化默认配置
   */
  private initializeDefaultConfigs(): void {
    const defaultConfigs = {
      // 应用配置
      'app.name': 'TaskFlow AI',
      'app.version': '1.0.0',
      'app.environment': this.options.environment,

      // 服务器配置
      'server.port': 3000,
      'server.host': '0.0.0.0',
      'server.timeout': 30000,

      // 数据库配置
      'database.host': 'localhost',
      'database.port': 5432,
      'database.name': 'taskflow',
      'database.pool.min': 2,
      'database.pool.max': 10,

      // 日志配置
      'logging.level': 'info',
      'logging.format': 'json',
      'logging.file.enabled': true,
      'logging.file.path': './logs/app.log',

      // AI模型配置
      'ai.models.default': 'alibaba_qwen',
      'ai.models.timeout': 30000,
      'ai.models.retryCount': 3,

      // 缓存配置
      'cache.enabled': true,
      'cache.ttl': 300,
      'cache.maxSize': 1000,

      // 安全配置
      'security.jwt.secret': 'your-secret-key',
      'security.jwt.expiresIn': '24h',
      'security.cors.enabled': true,
      'security.rateLimit.enabled': true,
      'security.rateLimit.max': 100
    };

    Object.entries(defaultConfigs).forEach(([key, value]) => {
      if (!this.configs.has(key)) {
        this.set(key, value, ConfigSource.MEMORY);
      }
    });

    // 添加验证规则
    this.addValidationRules();
  }

  /**
   * 添加验证规则
   */
  private addValidationRules(): void {
    this.addValidation('server.port', {
      type: 'number',
      min: 1,
      max: 65535,
      required: true
    });

    this.addValidation('database.port', {
      type: 'number',
      min: 1,
      max: 65535,
      required: true
    });

    this.addValidation('logging.level', {
      type: 'string',
      enum: ['error', 'warn', 'info', 'debug'],
      required: true
    });

    this.addValidation('ai.models.timeout', {
      type: 'number',
      min: 1000,
      max: 300000,
      required: true
    });
  }

  /**
   * 加载配置
   */
  private loadConfigurations(): void {
    // 1. 从文件加载
    try {
      this.loadFromFile();
    } catch {
      this.logger.warn('从文件加载配置失败，使用默认配置');
    }

    // 2. 从环境变量覆盖
    this.loadFromEnvironment();
  }

  /**
   * 从环境变量加载配置
   */
  private loadFromEnvironment(): void {
    const envPrefix = 'TASKFLOW_';

    Object.keys(process.env).forEach(envKey => {
      if (envKey.startsWith(envPrefix)) {
        const configKey = envKey
          .substring(envPrefix.length)
          .toLowerCase()
          .replace(/_/g, '.');

        const envValue = process.env[envKey];
        if (envValue !== undefined) {
          const parsedValue = this.parseEnvironmentValue(envValue);
          this.set(configKey, parsedValue, ConfigSource.ENVIRONMENT);
        }
      }
    });
  }

  /**
   * 从环境变量获取值
   * @param key 配置键
   */
  private getFromEnvironment(key: string): JSONValue | undefined {
    const envKey = `TASKFLOW_${key.toUpperCase().replace(/\./g, '_')}`;
    const envValue = process.env[envKey];

    if (envValue !== undefined) {
      return this.parseEnvironmentValue(envValue);
    }

    return undefined;
  }

  /**
   * 解析环境变量值
   * @param value 环境变量值
   */
  private parseEnvironmentValue(value: string): JSONValue {
    // 尝试解析为JSON
    if (value.startsWith('{') || value.startsWith('[')) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }

    // 解析布尔值
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // 解析数字
    if (/^\d+$/.test(value)) return parseInt(value, 10);
    if (/^\d+\.\d+$/.test(value)) return parseFloat(value);

    return value;
  }

  /**
   * 推断值类型
   * @param value 值
   */
  private inferType(value: JSONValue): 'string' | 'number' | 'boolean' | 'object' | 'array' {
    if (Array.isArray(value)) return 'array';
    const type = typeof value;
    if (type === 'string' || type === 'number' || type === 'boolean') {
      return type;
    }
    return 'object';
  }

  /**
   * 验证配置值
   * @param value 配置值
   * @param validation 验证规则
   */
  private validateValue(value: JSONValue, validation: ConfigValidation): true | string {
    // 必填检查
    if (validation.required && (value === undefined || value === null)) {
      return '配置值不能为空';
    }

    if (value === undefined || value === null) {
      return true; // 非必填且为空，跳过验证
    }

    // 类型检查
    if (validation.type) {
      const actualType = this.inferType(value);
      if (actualType !== validation.type) {
        return `期望类型 ${validation.type}，实际类型 ${actualType}`;
      }
    }

    // 数值范围检查
    if (typeof value === 'number') {
      if (validation.min !== undefined && value < validation.min) {
        return `值不能小于 ${validation.min}`;
      }
      if (validation.max !== undefined && value > validation.max) {
        return `值不能大于 ${validation.max}`;
      }
    }

    // 字符串长度检查
    if (typeof value === 'string') {
      if (validation.min !== undefined && value.length < validation.min) {
        return `长度不能小于 ${validation.min}`;
      }
      if (validation.max !== undefined && value.length > validation.max) {
        return `长度不能大于 ${validation.max}`;
      }
    }

    // 正则表达式检查
    if (validation.pattern && typeof value === 'string') {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        return `值不匹配模式 ${validation.pattern}`;
      }
    }

    // 枚举值检查
    if (validation.enum && !validation.enum.includes(value)) {
      return `值必须是以下之一: ${validation.enum.join(', ')}`;
    }

    // 自定义验证
    if (validation.custom) {
      const result = validation.custom(value);
      if (result !== true) {
        return typeof result === 'string' ? result : '自定义验证失败';
      }
    }

    return true;
  }

  /**
   * 获取配置文件路径
   */
  private getConfigFilePath(): string {
    const fileName = `config.${this.options.environment}.json`;
    return resolve(this.options.configDir, fileName);
  }

  /**
   * 设置文件监听
   */
  private setupFileWatching(): void {
    const configPath = this.getConfigFilePath();

    if (existsSync(configPath)) {
      watchFile(configPath, (curr, prev) => {
        if (curr.mtime !== prev.mtime) {
          this.logger.info('配置文件已更改，重新加载配置');
          this.reload();
        }
      });
    }
  }

  /**
   * 通知配置变更
   * @param event 变更事件
   */
  private notifyChange(event: ConfigChangeEvent): void {
    // 通知全局监听器
    this.changeListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        this.logger.error(`配置变更监听器执行失败: ${(error as Error).message}`);
      }
    });

    // 通知特定键的监听器
    const keyWatchers = this.watchers.get(event.key);
    if (keyWatchers) {
      keyWatchers.forEach(watcher => {
        try {
          watcher(event);
        } catch (error) {
          this.logger.error(`配置变更监听器执行失败: ${(error as Error).message}`);
        }
      });
    }
  }

  // ==================== MCP 配置管理方法 ====================

  /**
   * 为指定编辑器生成MCP配置
   * @param editor 编辑器类型
   * @param options 配置选项
   * @returns MCP配置对象
   */
  public generateMCPConfig(editor: EditorType, options?: MCPConfigOptions): MCPConfig {
    this.logger.info(`生成 ${editor} 编辑器的MCP配置`);
    return this.mcpGenerator.generateMCPConfig(editor, options);
  }

  /**
   * 验证MCP配置
   * @param config MCP配置对象
   * @returns 验证结果
   */
  public validateMCPConfig(config: MCPConfig): ValidationResult {
    this.logger.debug(`验证 ${config.editor} 编辑器的MCP配置`);
    return this.mcpGenerator.validateMCPConfig(config);
  }

  /**
   * 导出MCP配置为JSON字符串
   * @param editor 编辑器类型
   * @param options 配置选项
   * @returns JSON格式的配置字符串
   */
  public exportMCPConfig(editor: EditorType, options?: MCPConfigOptions): string {
    const config = this.generateMCPConfig(editor, options);
    return this.mcpGenerator.exportMCPConfig(config);
  }

  /**
   * 导入MCP配置
   * @param editor 编辑器类型
   * @param configJson JSON格式的配置字符串
   */
  public importMCPConfig(editor: EditorType, configJson: string): void {
    try {
      const config = JSON.parse(configJson);
      this.logger.info(`导入 ${editor} 编辑器的MCP配置`);
      // 这里可以添加配置导入逻辑
      this.logger.debug('MCP配置导入成功', config);
    } catch (error) {
      this.logger.error(`导入MCP配置失败: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * 测试MCP配置
   * @param editor 编辑器类型
   * @param options 配置选项
   * @returns 测试结果
   */
  public async testMCPConfiguration(editor: EditorType, options?: MCPConfigOptions): Promise<TestResult> {
    this.logger.info(`测试 ${editor} 编辑器的MCP配置`);
    const config = this.generateMCPConfig(editor, options);
    return await this.mcpGenerator.testMCPConfiguration(config);
  }

  /**
   * 获取MCP服务支持的能力
   * @returns MCP能力对象
   */
  public getMCPCapabilities() {
    return this.mcpGenerator.getMCPCapabilities();
  }

  /**
   * 写入MCP配置文件到磁盘
   * @param editor 编辑器类型
   * @param projectRoot 项目根目录
   * @param options 配置选项
   */
  public async writeMCPConfigFiles(
    editor: EditorType,
    projectRoot: string = '.',
    options?: MCPConfigOptions
  ): Promise<void> {
    const config = this.generateMCPConfig(editor, options);
    await this.mcpGenerator.writeMCPConfigFiles(config, projectRoot);
  }

  /**
   * 为所有支持的编辑器生成MCP配置文件
   * @param projectRoot 项目根目录
   * @param options 配置选项
   */
  public async generateAllMCPConfigs(
    projectRoot: string = '.',
    options?: MCPConfigOptions
  ): Promise<void> {
    const editors: EditorType[] = ['windsurf', 'trae', 'cursor', 'vscode'];

    this.logger.info('开始生成所有编辑器的MCP配置文件');

    for (const editor of editors) {
      try {
        await this.writeMCPConfigFiles(editor, projectRoot, options);
        this.logger.info(`✅ ${editor} MCP配置生成成功`);
      } catch (error) {
        this.logger.error(`❌ ${editor} MCP配置生成失败: ${(error as Error).message}`);
      }
    }

    this.logger.info('所有编辑器的MCP配置文件生成完成');
  }
}
