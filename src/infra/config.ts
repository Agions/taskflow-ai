/* eslint-disable @typescript-eslint/no-explicit-any */
import Conf from 'conf';
import fs from 'fs-extra';
import path from 'path';
import { DEFAULT_CONFIG, AppConfig, ModelType } from '../types/config';

/**
 * 配置管理器，负责管理应用的配置信息
 */
export class ConfigManager {
  private conf: Conf<any>;
  private projectConf: Conf<any> | null = null;

  /**
   * 创建配置管理器实例
   * @param configName 配置名称
   */
  constructor(configName = 'mcp') {
    // 全局配置
    this.conf = new Conf({
      configName,
      defaults: DEFAULT_CONFIG as any,
    });

    // 尝试加载项目级配置
    const projectConfigPath = path.join(process.cwd(), 'mcp.config.json');
    if (fs.existsSync(projectConfigPath)) {
      try {
        this.projectConf = new Conf({
          configName: 'mcp.config',
          cwd: process.cwd(),
          defaults: DEFAULT_CONFIG as any,
        });
      } catch (error) {
        console.error('Failed to load project configuration:', error);
      }
    }
  }

  /**
   * 获取完整配置
   */
  public getConfig(): AppConfig {
    // 如果存在项目配置，合并全局和项目配置
    if (this.projectConf) {
      return {
        ...this.conf.store,
        ...this.projectConf.store,
        models: {
          ...this.conf.store.models,
          ...this.projectConf.store.models,
        },
      } as AppConfig;
    }

    return this.conf.store as AppConfig;
  }

  /**
   * 更新配置
   * @param config 配置对象
   * @param isProjectLevel 是否为项目级配置
   */
  public updateConfig(config: Partial<AppConfig>, isProjectLevel = false): void {
    const targetConf = isProjectLevel && this.projectConf ? this.projectConf : this.conf;

    // 递归合并对象
    const mergeDeep = (target: any, source: any) => {
      for (const key in source) {
        if (source[key] instanceof Object && key in target) {
          mergeDeep(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
      return target;
    };

    targetConf.store = mergeDeep({ ...targetConf.store }, config);
  }

  /**
   * 设置配置项
   * @param key 配置键路径（点分隔，如 'models.baidu.apiKey'）
   * @param value 配置值
   * @param isProjectLevel 是否为项目级配置
   */
  public set(key: string, value: any, isProjectLevel = false): void {
    const targetConf = isProjectLevel && this.projectConf ? this.projectConf : this.conf;
    targetConf.set(key, value);
  }

  /**
   * 获取配置项
   * @param key 配置键路径
   * @param defaultValue 默认值
   */
  public get<T>(key: string, defaultValue?: T): T {
    // 先尝试从项目配置中获取
    if (this.projectConf && this.projectConf.has(key as any)) {
      return this.projectConf.get(key as any) as T;
    }

    // 再从全局配置中获取
    return this.conf.get(key as any, defaultValue as any) as T;
  }

  /**
   * 检查配置项是否存在
   * @param key 配置键路径
   */
  public has(key: string): boolean {
    return this.projectConf?.has(key as any) || this.conf.has(key as any);
  }

  /**
   * 删除配置项
   * @param key 配置键路径
   * @param isProjectLevel 是否为项目级配置
   */
  public delete(key: string, isProjectLevel = false): void {
    const targetConf = isProjectLevel && this.projectConf ? this.projectConf : this.conf;
    targetConf.delete(key as keyof AppConfig);
  }

  /**
   * 重置配置
   * @param isProjectLevel 是否为项目级配置
   */
  public reset(isProjectLevel = false): void {
    const targetConf = isProjectLevel && this.projectConf ? this.projectConf : this.conf;
    targetConf.store = DEFAULT_CONFIG as any;
  }

  /**
   * 初始化项目配置文件
   * @param directory 项目目录
   */
  public initProjectConfig(directory: string): void {
    const configPath = path.join(directory, 'mcp.config.json');
    fs.writeJsonSync(configPath, DEFAULT_CONFIG, { spaces: 2 });

    // 重新加载项目配置
    this.projectConf = new Conf({
      configName: 'mcp.config',
      cwd: directory,
      defaults: DEFAULT_CONFIG as any,
    });
  }

  /**
   * 获取当前默认模型类型
   */
  public getDefaultModelType(): ModelType {
    return this.get<ModelType>('models.default', ModelType.BAIDU);
  }

  /**
   * 设置默认模型类型
   * @param modelType 模型类型
   * @param isProjectLevel 是否为项目级配置
   */
  public setDefaultModelType(modelType: ModelType, isProjectLevel = false): void {
    this.set('models.default', modelType, isProjectLevel);
  }

  /**
   * 获取配置路径
   * @param isProjectLevel 是否为项目级配置
   */
  public getConfigPath(isProjectLevel = false): string {
    const targetConf = isProjectLevel && this.projectConf ? this.projectConf : this.conf;
    return targetConf.path;
  }
} 