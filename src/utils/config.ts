/**
 * 配置工具函数
 */

import crypto from 'crypto';
import { TaskFlowConfig } from '../types';
import { REGEX_PATTERNS } from '../constants';

/**
 * 验证配置对象
 */
export function validateConfig(config: unknown): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];

  // 类型守卫：检查 config 是否为有效对象
  if (typeof config !== 'object' || config === null) {
    errors.push('config must be an object');
    return { valid: false, errors };
  }

  const cfg = config as Record<string, unknown>;

  if (!cfg.projectName || typeof cfg.projectName !== 'string') {
    errors.push('projectName is required and must be a string');
  }

  if (!cfg.version || typeof cfg.version !== 'string' || !REGEX_PATTERNS.SEMVER.test(cfg.version)) {
    errors.push('version must be a valid semantic version');
  }

  if (cfg.aiModels && Array.isArray(cfg.aiModels)) {
    cfg.aiModels.forEach((model: unknown, index: number) => {
      if (typeof model !== 'object' || model === null) {
        errors.push(`aiModels[${index}] must be an object`);
        return;
      }
      const m = model as Record<string, unknown>;
      if (!m.provider || typeof m.provider !== 'string') {
        errors.push(`aiModels[${index}].provider is required`);
      }
      if (!m.modelName || typeof m.modelName !== 'string') {
        errors.push(`aiModels[${index}].modelName is required`);
      }
      if (typeof m.enabled !== 'boolean') {
        errors.push(`aiModels[${index}].enabled must be a boolean`);
      }
    });
  }

  if (cfg.mcpSettings) {
    const mcp = cfg.mcpSettings as Record<string, unknown>;
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
    return encryptedKey;
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
