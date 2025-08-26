/**
 * 配置工具函数
 */

import crypto from 'crypto';
import { TaskFlowConfig } from '../types';
import { REGEX_PATTERNS } from '../constants';

/**
 * 验证配置对象
 */
export function validateConfig(config: any): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];

  // 检查基本字段
  if (!config.projectName || typeof config.projectName !== 'string') {
    errors.push('projectName is required and must be a string');
  }

  if (!config.version || !REGEX_PATTERNS.SEMVER.test(config.version)) {
    errors.push('version must be a valid semantic version');
  }

  // 检查AI模型配置
  if (config.aiModels && Array.isArray(config.aiModels)) {
    config.aiModels.forEach((model: any, index: number) => {
      if (!model.provider || typeof model.provider !== 'string') {
        errors.push(`aiModels[${index}].provider is required`);
      }
      if (!model.modelName || typeof model.modelName !== 'string') {
        errors.push(`aiModels[${index}].modelName is required`);
      }
      if (typeof model.enabled !== 'boolean') {
        errors.push(`aiModels[${index}].enabled must be a boolean`);
      }
    });
  }

  // 检查MCP设置
  if (config.mcpSettings) {
    const mcp = config.mcpSettings;
    if (typeof mcp.enabled !== 'boolean') {
      errors.push('mcpSettings.enabled must be a boolean');
    }
    if (mcp.port && (typeof mcp.port !== 'number' || mcp.port < 1 || mcp.port > 65535)) {
      errors.push('mcpSettings.port must be a valid port number');
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * 加密API密钥
 */
export async function encryptApiKeys(apiKey: string): Promise<string> {
  if (!apiKey) return '';

  // 简单的base64编码（生产环境应使用更安全的加密）
  return Buffer.from(apiKey).toString('base64');
}

/**
 * 解密API密钥
 */
export async function decryptApiKeys(encryptedKey: string): Promise<string> {
  if (!encryptedKey) return '';

  try {
    return Buffer.from(encryptedKey, 'base64').toString('utf-8');
  } catch {
    return encryptedKey; // 如果解密失败，返回原始值
  }
}

/**
 * 合并配置
 */
export function mergeConfig(
  base: Partial<TaskFlowConfig>,
  override: Partial<TaskFlowConfig>
): TaskFlowConfig {
  return {
    ...base,
    ...override,
    aiModels: override.aiModels || base.aiModels || [],
    mcpSettings: {
      ...base.mcpSettings,
      ...override.mcpSettings,
    },
  } as TaskFlowConfig;
}
