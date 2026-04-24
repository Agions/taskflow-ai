/**
 * 配置核心操作
 */

import path = require('path');
import fs = require('fs-extra');
import { TaskFlowConfig, AIModelConfig } from '../../types';
import { CONFIG_DIR, CONFIG_FILE, DEFAULT_CONFIG, ERROR_CODES } from '../../constants';
import { createTaskFlowError } from '../../utils/errors';
import { validateConfig, encryptApiKeys, decryptApiKeys } from '../../utils/config';

/**
 * 配置操作类
 */
export class ConfigOperations {
  private configPath: string;
  private configDir: string;

  constructor(basePath?: string) {
    const baseDir = basePath || process.cwd();
    this.configDir = path.join(baseDir, CONFIG_DIR);
    this.configPath = path.join(this.configDir, CONFIG_FILE);
  }

  /**
   * 加载配置文件
   */
  async loadConfig(): Promise<TaskFlowConfig | null> {
    try {
      if (!(await fs.pathExists(this.configPath))) {
        return null;
      }

      const configData = await fs.readJson(this.configPath);
      const config = this.mergeWithDefaults(configData);

      const validation = validateConfig(config as any);
      if (!validation.valid) {
        throw createTaskFlowError(
          'config',
          ERROR_CODES.CONFIG_INVALID,
          `配置文件无效: ${validation.errors?.join(', ')}`,
          { errors: validation.errors }
        );
      }

      if (config.aiModels && config.aiModels.length > 0) {
        const model = config.aiModels[0];
        if (model.apiKey) {
          model.apiKey = await decryptApiKeys(model.apiKey);
        }
      }

      return config;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }

      if (error.name === 'TaskFlowError') {
        throw error;
      }

      throw createTaskFlowError('config', ERROR_CODES.CONFIG_PARSE_ERROR, '配置文件解析失败', {
        originalError: error,
      });
    }
  }

  /**
   * 保存配置文件
   */
  async saveConfig(config: TaskFlowConfig): Promise<void> {
    try {
      const validation = validateConfig(config as any);
      if (!validation.valid) {
        throw createTaskFlowError(
          'config',
          ERROR_CODES.CONFIG_INVALID,
          `配置无效: ${validation.errors?.join(', ')}`,
          { errors: validation.errors }
        );
      }

      await fs.ensureDir(this.configDir);

      const configToSave = { ...config };
      if (configToSave.aiModels) {
        configToSave.aiModels = await Promise.all(
          configToSave.aiModels.map(async model => ({
            ...model,
            apiKey: model.apiKey ? await encryptApiKeys(model.apiKey) : undefined,
          }))
        );
      }

      await fs.writeJson(this.configPath, configToSave, { spaces: 2 });
      await fs.chmod(this.configPath, 0o600);
    } catch (error: any) {
      if (error?.name === 'TaskFlowError') {
        throw error;
      }

      throw createTaskFlowError('config', ERROR_CODES.FILE_WRITE_ERROR, '配置文件保存失败', {
        originalError: error,
      });
    }
  }

  /**
   * 合并默认配置
   */
  private mergeWithDefaults(config: Partial<TaskFlowConfig>): TaskFlowConfig {
    const defaults = DEFAULT_CONFIG as TaskFlowConfig;
    
    // 安全地获取嵌套属性
    const getNestedValue = (obj: any, path: string, defaultValue: any) => {
      return path.split('.').reduce((current, key) => 
        current && current[key] !== undefined ? current[key] : defaultValue, obj);
    };

    // 安全合并 mcpSettings
    const mergedMcpSettings = {
      ...defaults.mcpSettings,
      ...config.mcpSettings,
      tools: config.mcpSettings?.tools ?? defaults.mcpSettings?.tools ?? [],
      resources: config.mcpSettings?.resources ?? defaults.mcpSettings?.resources ?? [],
      security: {
        ...(defaults.mcpSettings?.security || {}),
        ...(config.mcpSettings?.security || {}),
        rateLimit: {
          ...getNestedValue(defaults, 'mcpSettings.security.rateLimit', {}),
          ...getNestedValue(config, 'mcpSettings.security.rateLimit', {}),
        },
        sandbox: {
          ...getNestedValue(defaults, 'mcpSettings.security.sandbox', {}),
          ...getNestedValue(config, 'mcpSettings.security.sandbox', {}),
        },
      },
    };

    return {
      ...defaults,
      ...config,
      mcpSettings: mergedMcpSettings,
    };
  }

  getConfigPath(): string {
    return this.configPath;
  }

  getConfigDir(): string {
    return this.configDir;
  }

  async configExists(): Promise<boolean> {
    return await fs.pathExists(this.configPath);
  }
}
