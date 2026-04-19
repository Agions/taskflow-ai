/**
 * MCP设置管理
 */

import { TaskFlowConfig } from '../../types';
import { ERROR_CODES } from '../../constants';
import { createTaskFlowError } from '../../utils/errors';
import { ConfigOperations } from './operations';

/**
 * MCP设置管理器
 */
export class MCPSettingsManager {
  constructor(private operations: ConfigOperations) {}

  /**
   * 更新MCP设置
   */
  async updateMCPSettings(mcpSettings: Partial<TaskFlowConfig['mcpSettings']>): Promise<void> {
    const config = await this.operations.loadConfig();
    if (!config) {
      throw createTaskFlowError('config', ERROR_CODES.CONFIG_NOT_FOUND, '配置文件不存在');
    }

    config.mcpSettings = {
      ...config.mcpSettings,
      ...mcpSettings,
    };

    await this.operations.saveConfig(config);
  }

  /**
   * 获取MCP设置
   */
  async getMCPSettings(): Promise<TaskFlowConfig['mcpSettings'] | null> {
    const config = await this.operations.loadConfig();
    return config?.mcpSettings || null;
  }

  /**
   * 启用MCP
   */
  async enableMCP(): Promise<void> {
    await this.updateMCPSettings({ enabled: true });
  }

  /**
   * 禁用MCP
   */
  async disableMCP(): Promise<void> {
    await this.updateMCPSettings({ enabled: false });
  }

  /**
   * 更新MCP安全设置
   */
  async updateSecuritySettings(
    securitySettings: Partial<TaskFlowConfig['mcpSettings']['security']>
  ): Promise<void> {
    const config = await this.operations.loadConfig();
    if (!config) {
      throw createTaskFlowError('config', ERROR_CODES.CONFIG_NOT_FOUND, '配置文件不存在');
    }

    config.mcpSettings.security = {
      ...config.mcpSettings.security,
      ...securitySettings,
    };

    await this.operations.saveConfig(config);
  }
}
