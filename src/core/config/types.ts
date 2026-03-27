/**
 * 配置管理类型定义
 */

import { TaskFlowConfig, AIModelConfig } from '../../types';

/**
 * 配置统计信息
 */
export interface ConfigStats {
  hasConfig: boolean;
  aiModelsCount: number;
  enabledModelsCount: number;
  mcpEnabled: boolean;
  lastModified?: Date;
}

/**
 * API密钥验证结果
 */
export interface ApiKeyValidationResult {
  provider: string;
  valid: boolean;
  error?: string;
}

/**
 * 配置管理器接口
 */
export interface IConfigManager {
  loadConfig(): Promise<TaskFlowConfig | null>;
  saveConfig(config: TaskFlowConfig): Promise<void>;
  updateAIModel(modelConfig: AIModelConfig): Promise<void>;
  removeAIModel(provider: string, modelName: string): Promise<void>;
  getAIModels(): Promise<AIModelConfig[]>;
  getEnabledAIModels(): Promise<AIModelConfig[]>;
  updateMCPSettings(mcpSettings: Partial<TaskFlowConfig['mcpSettings']>): Promise<void>;
  configExists(): Promise<boolean>;
  getConfigPath(): string;
  getConfigDir(): string;
  backupConfig(): Promise<string>;
  restoreConfig(backupPath: string): Promise<void>;
  resetConfig(): Promise<void>;
  getConfigStats(): Promise<ConfigStats>;
  validateApiKeys(): Promise<ApiKeyValidationResult[]>;
  exportConfig(): Promise<Partial<TaskFlowConfig>>;
  importConfig(configData: Partial<TaskFlowConfig>): Promise<void>;
}
