/**
 * 配置统计信息
 */

import fs from 'fs-extra';
import { ConfigStats } from './types';
import { ConfigOperations } from './operations';

/**
 * 配置统计管理器
 */
export class ConfigStatsManager {
  constructor(private operations: ConfigOperations) {}

  /**
   * 获取配置统计信息
   */
  async getConfigStats(): Promise<ConfigStats> {
    const hasConfig = await this.operations.configExists();

    if (!hasConfig) {
      return {
        hasConfig: false,
        aiModelsCount: 0,
        enabledModelsCount: 0,
        mcpEnabled: false,
      };
    }

    const config = await this.operations.loadConfig();
    const stats = await fs.stat(this.operations.getConfigPath());

    return {
      hasConfig: true,
      aiModelsCount: config?.aiModels.length || 0,
      enabledModelsCount: config?.aiModels.filter(m => m.enabled).length || 0,
      mcpEnabled: config?.mcpSettings.enabled || false,
      lastModified: stats.mtime,
    };
  }
}
