import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ModelType } from '../types/config';

/**
 * 简化的配置管理器
 * 负责管理应用程序的配置信息
 */
export class SimpleConfigManager {
  private configPath: string;
  private config: Record<string, unknown>;

  constructor() {
    this.configPath = path.join(os.homedir(), '.taskflow-ai', 'config.json');
    this.config = this.loadConfig();
  }

  private loadConfig(): Record<string, unknown> {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        return JSON.parse(configData);
      }
    } catch (error) {
      console.warn(`加载配置文件失败: ${(error as Error).message}`);
    }

    // 返回默认配置
    return {
      models: {
        default: ModelType.DEEPSEEK,
        apiKeys: {},
        endpoints: {}
      },
      ui: {
        theme: 'light',
        language: 'zh-CN'
      },
      features: {
        autoSave: true,
        notifications: true
      }
    };
  }

  private saveConfig(): void {
    try {
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error(`保存配置文件失败: ${(error as Error).message}`);
    }
  }

  /**
   * 获取配置值
   */
  get(key: string, defaultValue?: unknown): unknown {
    const keys = key.split('.');
    let value: unknown = this.config;

    for (const k of keys) {
      if (value && typeof value === 'object' && value !== null && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return defaultValue;
      }
    }

    return value;
  }

  /**
   * 设置配置值
   */
  set(key: string, value: unknown): void {
    const keys = key.split('.');
    let current = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!current[k] || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k] as Record<string, unknown>;
    }

    current[keys[keys.length - 1]] = value;
    this.saveConfig();
  }

  /**
   * 获取所有配置
   */
  getAll(): Record<string, unknown> {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  update(newConfig: Record<string, unknown>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
  }

  /**
   * 重置配置
   */
  reset(): void {
    this.config = this.loadConfig();
  }

  /**
   * 获取配置（兼容原ConfigManager接口）
   */
  getConfig(): Record<string, unknown> {
    return this.getAll();
  }

  /**
   * 更新配置（兼容原ConfigManager接口）
   */
  updateConfig(config: Record<string, unknown>, _isProjectLevel = false): void {
    this.update(config);
  }

  /**
   * 获取默认模型类型
   */
  getDefaultModelType(): ModelType {
    return this.get('models.default', ModelType.DEEPSEEK) as ModelType;
  }
}
