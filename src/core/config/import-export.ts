/**
 * 配置导入导出
 */

import { TaskFlowConfig } from '../../types';
import { DEFAULT_CONFIG, ERROR_CODES } from '../../constants';
import { createTaskFlowError } from '../../utils/errors';
import { ConfigOperations } from './operations';

/**
 * 配置导入导出管理器
 */
export class ConfigImportExportManager {
  constructor(private operations: ConfigOperations) {}

  /**
   * 导出配置（不包含敏感信息）
   */
  async exportConfig(): Promise<Partial<TaskFlowConfig>> {
    const config = await this.operations.loadConfig();
    if (!config) {
      throw createTaskFlowError('config', ERROR_CODES.CONFIG_NOT_FOUND, '配置文件不存在');
    }

    const exportConfig = {
      ...config,
      aiModels: config.aiModels!.map(model => ({
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
    const currentConfig = (await this.operations.loadConfig()) || DEFAULT_CONFIG;

    const mergedConfig = {
      ...currentConfig,
      ...configData,
      aiModels: configData.aiModels || currentConfig.aiModels,
      mcpSettings: {
        ...currentConfig.mcpSettings,
        ...(configData.mcpSettings || {}),
      },
    };

    await this.operations.saveConfig(mergedConfig as any);
  }

  /**
   * 导出完整配置（包含敏感信息，谨慎使用）
   */
  async exportFullConfig(): Promise<TaskFlowConfig | null> {
    return await this.operations.loadConfig();
  }

  /**
   * 重置配置为默认值
   */
  async resetConfig(): Promise<void> {
    await this.operations.saveConfig(DEFAULT_CONFIG as any);
  }
}
