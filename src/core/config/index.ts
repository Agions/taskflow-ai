/**
 * 配置管理器 - 负责加载、保存和验证项目配置
 */

import path from 'path';
import fs from 'fs-extra';
import { TaskFlowConfig, AIModelConfig } from '../../types';
import { CONFIG_DIR, CONFIG_FILE, DEFAULT_CONFIG, ERROR_CODES } from '../../constants';
import { createTaskFlowError } from '../../utils/errors';
import { validateConfig, encryptApiKeys, decryptApiKeys } from '../../utils/config';

export class ConfigManager {
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

      // 验证配置
      const validation = validateConfig(config);
      if (!validation.valid) {
        throw createTaskFlowError(
          'config',
          ERROR_CODES.CONFIG_INVALID,
          `配置文件无效: ${validation.errors?.join(', ')}`,
          { errors: validation.errors }
        );
      }

      // 解密API密钥
      if (config.aiModels) {
        config.aiModels = await Promise.all(
          config.aiModels.map(async model => ({
            ...model,
            apiKey: await decryptApiKeys(model.apiKey),
          }))
        );
      }

      return config;
    } catch (error) {
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
      // 验证配置
      const validation = validateConfig(config);
      if (!validation.valid) {
        throw createTaskFlowError(
          'config',
          ERROR_CODES.CONFIG_INVALID,
          `配置无效: ${validation.errors?.join(', ')}`,
          { errors: validation.errors }
        );
      }

      // 确保配置目录存在
      await fs.ensureDir(this.configDir);

      // 复制配置并加密API密钥
      const configToSave = { ...config };
      if (configToSave.aiModels) {
        configToSave.aiModels = await Promise.all(
          configToSave.aiModels.map(async model => ({
            ...model,
            apiKey: await encryptApiKeys(model.apiKey),
          }))
        );
      }

      // 保存配置文件
      await fs.writeJson(this.configPath, configToSave, { spaces: 2 });

      // 设置文件权限（仅用户可读写）
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
   * 更新AI模型配置
   */
  async updateAIModel(modelConfig: AIModelConfig): Promise<void> {
    const config = await this.loadConfig();
    if (!config) {
      throw createTaskFlowError('config', ERROR_CODES.CONFIG_NOT_FOUND, '配置文件不存在');
    }

    const existingIndex = config.aiModels.findIndex(
      model => model.provider === modelConfig.provider && model.modelName === modelConfig.modelName
    );

    if (existingIndex >= 0) {
      config.aiModels[existingIndex] = modelConfig;
    } else {
      config.aiModels.push(modelConfig);
    }

    await this.saveConfig(config);
  }

  /**
   * 删除AI模型配置
   */
  async removeAIModel(provider: string, modelName: string): Promise<void> {
    const config = await this.loadConfig();
    if (!config) {
      throw createTaskFlowError('config', ERROR_CODES.CONFIG_NOT_FOUND, '配置文件不存在');
    }

    config.aiModels = config.aiModels.filter(
      model => !(model.provider === provider && model.modelName === modelName)
    );

    await this.saveConfig(config);
  }

  /**
   * 获取AI模型配置
   */
  async getAIModels(): Promise<AIModelConfig[]> {
    const config = await this.loadConfig();
    return config?.aiModels || [];
  }

  /**
   * 获取启用的AI模型
   */
  async getEnabledAIModels(): Promise<AIModelConfig[]> {
    const models = await this.getAIModels();
    return models.filter(model => model.enabled).sort((a, b) => a.priority - b.priority);
  }

  /**
   * 更新MCP设置
   */
  async updateMCPSettings(mcpSettings: Partial<TaskFlowConfig['mcpSettings']>): Promise<void> {
    const config = await this.loadConfig();
    if (!config) {
      throw createTaskFlowError('config', ERROR_CODES.CONFIG_NOT_FOUND, '配置文件不存在');
    }

    config.mcpSettings = {
      ...config.mcpSettings,
      ...mcpSettings,
    };

    await this.saveConfig(config);
  }

  /**
   * 检查配置文件是否存在
   */
  async configExists(): Promise<boolean> {
    return await fs.pathExists(this.configPath);
  }

  /**
   * 获取配置文件路径
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * 获取配置目录路径
   */
  getConfigDir(): string {
    return this.configDir;
  }

  /**
   * 备份配置文件
   */
  async backupConfig(): Promise<string> {
    if (!(await this.configExists())) {
      throw createTaskFlowError('config', ERROR_CODES.CONFIG_NOT_FOUND, '配置文件不存在，无法备份');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.configDir, `${CONFIG_FILE}.backup.${timestamp}`);

    await fs.copy(this.configPath, backupPath);
    return backupPath;
  }

  /**
   * 恢复配置文件
   */
  async restoreConfig(backupPath: string): Promise<void> {
    if (!(await fs.pathExists(backupPath))) {
      throw createTaskFlowError('config', ERROR_CODES.FILE_NOT_FOUND, '备份文件不存在');
    }

    // 验证备份文件
    const backupData = await fs.readJson(backupPath);
    const validation = validateConfig(backupData);

    if (!validation.valid) {
      throw createTaskFlowError(
        'config',
        ERROR_CODES.CONFIG_INVALID,
        `备份文件无效: ${validation.errors?.join(', ')}`
      );
    }

    await fs.copy(backupPath, this.configPath);
  }

  /**
   * 重置配置为默认值
   */
  async resetConfig(): Promise<void> {
    await this.saveConfig(DEFAULT_CONFIG);
  }

  /**
   * 获取配置统计信息
   */
  async getConfigStats(): Promise<{
    hasConfig: boolean;
    aiModelsCount: number;
    enabledModelsCount: number;
    mcpEnabled: boolean;
    lastModified?: Date;
  }> {
    const hasConfig = await this.configExists();

    if (!hasConfig) {
      return {
        hasConfig: false,
        aiModelsCount: 0,
        enabledModelsCount: 0,
        mcpEnabled: false,
      };
    }

    const config = await this.loadConfig();
    const stats = await fs.stat(this.configPath);

    return {
      hasConfig: true,
      aiModelsCount: config?.aiModels.length || 0,
      enabledModelsCount: config?.aiModels.filter(m => m.enabled).length || 0,
      mcpEnabled: config?.mcpSettings.enabled || false,
      lastModified: stats.mtime,
    };
  }

  /**
   * 验证API密钥
   */
  async validateApiKeys(): Promise<{ provider: string; valid: boolean; error?: string }[]> {
    const models = await this.getEnabledAIModels();
    const results = [];

    for (const model of models) {
      try {
        // 这里可以添加实际的API密钥验证逻辑
        // 暂时只检查密钥是否存在
        const valid = !!model.apiKey && model.apiKey.length > 0;
        results.push({
          provider: model.provider,
          valid,
          error: valid ? undefined : 'API密钥为空或无效',
        });
      } catch (error) {
        results.push({
          provider: model.provider,
          valid: false,
          error: (error as Error).message,
        });
      }
    }

    return results;
  }

  /**
   * 导出配置（不包含敏感信息）
   */
  async exportConfig(): Promise<Partial<TaskFlowConfig>> {
    const config = await this.loadConfig();
    if (!config) {
      throw createTaskFlowError('config', ERROR_CODES.CONFIG_NOT_FOUND, '配置文件不存在');
    }

    // 移除敏感信息
    const exportConfig = {
      ...config,
      aiModels: config.aiModels.map(model => ({
        ...model,
        apiKey: '***', // 隐藏API密钥
      })),
    };

    return exportConfig;
  }

  /**
   * 导入配置
   */
  async importConfig(configData: Partial<TaskFlowConfig>): Promise<void> {
    const currentConfig = (await this.loadConfig()) || DEFAULT_CONFIG;

    // 合并配置
    const mergedConfig = {
      ...currentConfig,
      ...configData,
      aiModels: configData.aiModels || currentConfig.aiModels,
      mcpSettings: {
        ...currentConfig.mcpSettings,
        ...(configData.mcpSettings || {}),
      },
    };

    await this.saveConfig(mergedConfig);
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
}
