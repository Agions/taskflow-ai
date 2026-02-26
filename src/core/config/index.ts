/**
 * 配置管理器 - 负责加载、保存和验证项目配置
 */

import { TaskFlowConfig, AIModelConfig } from '../../types';
import { ConfigOperations } from './operations';
import { AIModelManager } from './ai-models';
import { ConfigBackupManager } from './backup';
import { MCPSettingsManager } from './mcp-settings';
import { ConfigImportExportManager } from './import-export';
import { ConfigStatsManager } from './stats';
import { ConfigStats, ApiKeyValidationResult, IConfigManager } from './types';

/**
 * 配置管理器
 * 整合所有配置相关功能
 */
export class ConfigManager implements IConfigManager {
  private operations: ConfigOperations;
  private aiModelManager: AIModelManager;
  private backupManager: ConfigBackupManager;
  private mcpSettingsManager: MCPSettingsManager;
  private importExportManager: ConfigImportExportManager;
  private statsManager: ConfigStatsManager;

  constructor(basePath?: string) {
    this.operations = new ConfigOperations(basePath);
    this.aiModelManager = new AIModelManager(this.operations);
    this.backupManager = new ConfigBackupManager(this.operations);
    this.mcpSettingsManager = new MCPSettingsManager(this.operations);
    this.importExportManager = new ConfigImportExportManager(this.operations);
    this.statsManager = new ConfigStatsManager(this.operations);
  }

  // 基础操作
  async loadConfig(): Promise<TaskFlowConfig | null> {
    return this.operations.loadConfig();
  }

  async saveConfig(config: TaskFlowConfig): Promise<void> {
    return this.operations.saveConfig(config);
  }

  async configExists(): Promise<boolean> {
    return this.operations.configExists();
  }

  getConfigPath(): string {
    return this.operations.getConfigPath();
  }

  getConfigDir(): string {
    return this.operations.getConfigDir();
  }

  // AI模型管理
  async updateAIModel(modelConfig: AIModelConfig): Promise<void> {
    return this.aiModelManager.updateAIModel(modelConfig);
  }

  async removeAIModel(provider: string, modelName: string): Promise<void> {
    return this.aiModelManager.removeAIModel(provider, modelName);
  }

  async getAIModels(): Promise<AIModelConfig[]> {
    return this.aiModelManager.getAIModels();
  }

  async getEnabledAIModels(): Promise<AIModelConfig[]> {
    return this.aiModelManager.getEnabledAIModels();
  }

  async validateApiKeys(): Promise<ApiKeyValidationResult[]> {
    return this.aiModelManager.validateApiKeys();
  }

  // MCP设置
  async updateMCPSettings(mcpSettings: Partial<TaskFlowConfig['mcpSettings']>): Promise<void> {
    return this.mcpSettingsManager.updateMCPSettings(mcpSettings);
  }

  // 备份与恢复
  async backupConfig(): Promise<string> {
    return this.backupManager.backupConfig();
  }

  async restoreConfig(backupPath: string): Promise<void> {
    return this.backupManager.restoreConfig(backupPath);
  }

  async listBackups(): Promise<{ path: string; created: Date; size: number }[]> {
    return this.backupManager.listBackups();
  }

  async cleanupOldBackups(keepCount?: number): Promise<number> {
    return this.backupManager.cleanupOldBackups(keepCount);
  }

  // 导入导出
  async exportConfig(): Promise<Partial<TaskFlowConfig>> {
    return this.importExportManager.exportConfig();
  }

  async importConfig(configData: Partial<TaskFlowConfig>): Promise<void> {
    return this.importExportManager.importConfig(configData);
  }

  async resetConfig(): Promise<void> {
    return this.importExportManager.resetConfig();
  }

  // 统计信息
  async getConfigStats(): Promise<ConfigStats> {
    return this.statsManager.getConfigStats();
  }
}

// 便捷函数
export async function loadConfig(basePath?: string): Promise<TaskFlowConfig | null> {
  const manager = new ConfigManager(basePath);
  return manager.loadConfig();
}

export async function saveConfig(config: TaskFlowConfig, basePath?: string): Promise<void> {
  const manager = new ConfigManager(basePath);
  await manager.saveConfig(config);
}

// 导出子模块
export * from './types';
export { ConfigOperations } from './operations';
export { AIModelManager } from './ai-models';
export { ConfigBackupManager } from './backup';
export { MCPSettingsManager } from './mcp-settings';
export { ConfigImportExportManager } from './import-export';
export { ConfigStatsManager } from './stats';
