/**
 * Config Manager - 配置管理器
 * TaskFlow AI v4.0
 */

import { TaskFlowConfig } from '../types/config';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class ConfigManager {
  private config: TaskFlowConfig;
  private cacheEnabled = false;
  private filePath?: string;

  constructor(initialConfig?: Partial<TaskFlowConfig>) {
    this.config = this.createDefaultConfig();
    if (initialConfig) {
      this.config = { ...this.config, ...initialConfig } as TaskFlowConfig;
    }
  }

  /**
   * 创建默认配置
   */
  private createDefaultConfig(): TaskFlowConfig {
    return {
      version: '4.0.0',
      workspace: process.cwd(),
      environment: 'development',
      models: [],
      cache: {
        enabled: true,
        l1: {
          enabled: true,
          maxSize: 100,
          ttl: 600
        },
        l2: {
          enabled: false,
          ttl: 3600
        }
      },
      logging: {
        level: 'info',
        console: true,
        format: 'text'
      },
      plugins: {
        enabled: [],
        directory: './plugins',
        autoLoad: true
      },
      extensions: {
        agents: {
          directory: './extensions/agents',
          autoDiscover: true
        },
        tools: {
          directory: './extensions/tools',
          autoDiscover: true
        },
        workflows: {
          directory: './extensions/workflows',
          autoDiscover: true
        }
      },
      security: {
        enableCommandWhitelist: true,
        enablePrivateIPRestriction: true,
        enablePathTraversalProtection: true,
        enableCredentialMasking: true
      }
    };
  }

  /**
   * 获取完整配置
   */
  getConfig(): TaskFlowConfig {
    return this.cacheEnabled ? this.config : { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(updates: Partial<TaskFlowConfig>): void {
    this.config = this.mergeConfig(this.config, updates);
    if (this.filePath) {
      this.save();
    }
  }

  /**
   * 合并配置
   */
  private mergeConfig(base: TaskFlowConfig, updates: Partial<TaskFlowConfig>): TaskFlowConfig {
    return {
      ...base,
      ...updates,
      models: updates.models || base.models,
      cache: { ...base.cache, ...updates.cache },
      plugins: { ...base.plugins, ...updates.plugins },
      extensions: {
        ...base.extensions,
        ...updates.extensions,
        agents: { ...base.extensions.agents, ...updates.extensions?.agents },
        tools: { ...base.extensions.tools, ...updates.extensions?.tools },
        workflows: { ...base.extensions.workflows, ...updates.extensions?.workflows }
      }
    };
  }

  /**
   * 获取模型配置
   */
  getModel(modelId: string) {
    return this.config.models.find(m => m.id === modelId);
  }

  /**
   * 添加模型
   */
  addModel(model: Omit<TaskFlowConfig['models'][0], 'provider'> & { provider: string }): void {
    this.config.models.push(model as any);
    if (this.filePath) {
      this.save();
    }
  }

  /**
   * 从文件加载配置
   */
  async load(filePath: string): Promise<TaskFlowConfig> {
    this.filePath = path.resolve(filePath);

    if (!(await fs.pathExists(filePath))) {
      throw new Error(`Config file not found: ${filePath}`);
    }

    const content = await fs.readFile(filePath, 'utf-8');
    const loadedConfig = JSON.parse(content);

    this.config = { ...this.createDefaultConfig(), ...loadedConfig };
    return this.config;
  }

  /**
   * 保存配置到文件
   */
  async save(filePath?: string): Promise<void> {
    const targetPath = filePath || this.filePath;
    if (!targetPath) {
      throw new Error('No file path specified for saving');
    }

    await fs.writeFile(targetPath, JSON.stringify(this.config, null, 2));
  }

  /**
   * 启用缓存
   */
  setCache(enabled: boolean): void {
    this.cacheEnabled = enabled;
  }

  /**
   * 验证配置
   */
  validateConfig(config: Partial<TaskFlowConfig>): ValidationResult {
    const errors: string[] = [];

    if (!config.version) {
      errors.push('version is required');
    }

    if (!config.workspace) {
      errors.push('workspace is required');
    }

    if (!config.environment || !['development', 'staging', 'production'].includes(config.environment)) {
      errors.push('environment must be one of: development, staging, production');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 导出配置为 JSON
   */
  toJSON(): string {
    return JSON.stringify(this.config, null, 2);
  }
}

/**
 * 单例实例
 */
let configManagerInstance: ConfigManager | null = null;

export function getConfigManager(): ConfigManager {
  if (!configManagerInstance) {
    configManagerInstance = new ConfigManager();
  }
  return configManagerInstance;
}

export function resetConfigManager(): void {
  configManagerInstance = null;
}
