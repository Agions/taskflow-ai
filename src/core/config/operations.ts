/**
 * 配置核心操作
 */

import path from 'path';
import fs from 'fs-extra';
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

      const validation = validateConfig(config);
      if (!validation.valid) {
        throw createTaskFlowError(
          'config',
          ERROR_CODES.CONFIG_INVALID,
          `配置文件无效: ${validation.errors?.join(', ')}`,
          { errors: validation.errors }
        );
      }

      if (config.aiModels) {
        config.aiModels = await Promise.all(
          config.aiModels.map(async model => ({
            ...model,
            apiKey: await decryptApiKeys(model.apiKey),
          }))
        );
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
      const validation = validateConfig(config);
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
            apiKey: await encryptApiKeys(model.apiKey),
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
    return {
      ...DEFAULT_CONFIG,
      ...config,
      mcpSettings: {
        ...DEFAULT_CONFIG.mcpSettings,
        ...(config.mcpSettings || {}),
        security: {
          ...DEFAULT_CONFIG.mcpSettings.security,
          ...(config.mcpSettings?.security || {}),
          rateLimit: {
            ...DEFAULT_CONFIG.mcpSettings.security.rateLimit,
            ...(config.mcpSettings?.security?.rateLimit || {}),
          },
          sandbox: {
            ...DEFAULT_CONFIG.mcpSettings.security.sandbox,
            ...(config.mcpSettings?.security?.sandbox || {}),
          },
        },
      },
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
