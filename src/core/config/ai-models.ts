/**
 * AI模型配置管理
 */

import { AIModelConfig, TaskFlowConfig } from '../../types';
import { ERROR_CODES } from '../../constants';
import { createTaskFlowError } from '../../utils/errors';
import { ConfigOperations } from './operations';

/**
 * AI模型管理器
 */
export class AIModelManager {
  constructor(private operations: ConfigOperations) {}

  /**
   * 更新AI模型配置
   */
  async updateAIModel(modelConfig: AIModelConfig): Promise<void> {
    const config = await this.operations.loadConfig();
    if (!config) {
      throw createTaskFlowError('config', ERROR_CODES.CONFIG_NOT_FOUND, '配置文件不存在');
    }

    const existingIndex = config.aiModels!.findIndex(
      model => model.provider === modelConfig.provider && model.modelName === modelConfig.modelName
    );

    if (existingIndex >= 0) {
      config.aiModels![existingIndex] = modelConfig;
    } else {
      config.aiModels!.push(modelConfig);
    }

    await this.operations.saveConfig(config);
  }

  /**
   * 删除AI模型配置
   */
  async removeAIModel(provider: string, modelName: string): Promise<void> {
    const config = await this.operations.loadConfig();
    if (!config) {
      throw createTaskFlowError('config', ERROR_CODES.CONFIG_NOT_FOUND, '配置文件不存在');
    }

    config.aiModels! = config.aiModels!.filter(
      model => !(model.provider === provider && model.modelName === modelName)
    );

    await this.operations.saveConfig(config);
  }

  /**
   * 获取AI模型配置
   */
  async getAIModels(): Promise<AIModelConfig[]> {
    const config = await this.operations.loadConfig();
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
   * 验证API密钥
   */
  async validateApiKeys(): Promise<{ provider: string; valid: boolean; error?: string }[]> {
    const models = await this.getEnabledAIModels();
    const results = [];

    for (const model of models) {
      try {
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
}
