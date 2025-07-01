import { ModelAdapter } from './adapter/base';
import { BaiduModelAdapter } from './adapter/baidu';
import { DeepseekModelAdapter } from './adapter/deepseek';
import { ZhipuModelAdapter } from './adapter/zhipu';
import { ConfigManager } from '../../infra/config';
import { ModelType } from '../../types/config';

/**
 * 模型工厂类
 * 负责创建各种模型适配器
 */
export class ModelFactory {
  private configManager: ConfigManager;
  private modelCache: Map<ModelType, ModelAdapter> = new Map();

  /**
   * 创建模型工厂实例
   * @param configManager 配置管理器实例
   */
  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  /**
   * 创建模型适配器
   * @param modelType 模型类型，不传时使用默认模型类型
   */
  public createModelAdapter(modelType?: ModelType): ModelAdapter {
    // 获取要使用的模型类型
    const type = modelType || this.configManager.getDefaultModelType();

    // 如果缓存中有这个模型的适配器实例，直接返回
    const cached = this.modelCache.get(type);
    if (cached) {
      return cached;
    }

    // 创建新的适配器实例
    let adapter: ModelAdapter;

    switch (type) {
      case ModelType.BAIDU:
        adapter = new BaiduModelAdapter(this.configManager);
        break;
      case ModelType.DEEPSEEK:
        adapter = new DeepseekModelAdapter(this.configManager);
        break;
      case ModelType.ZHIPU:
        adapter = new ZhipuModelAdapter(this.configManager);
        break;
      // TODO: 添加其他模型适配器
      // case ModelType.XUNFEI:
      //   adapter = new XunfeiModelAdapter(this.configManager);
      //   break;
      default:
        throw new Error(`不支持的模型类型: ${type}`);
    }

    // 将新创建的适配器存入缓存
    this.modelCache.set(type, adapter);

    return adapter;
  }

  /**
   * 清除模型适配器缓存
   * @param modelType 模型类型，不传时清除所有
   */
  public clearCache(modelType?: ModelType): void {
    if (modelType) {
      this.modelCache.delete(modelType);
    } else {
      this.modelCache.clear();
    }
  }

  /**
   * 获取所有可用的模型类型
   */
  public getAvailableModelTypes(): ModelType[] {
    // 更新为已实现的模型适配器
    return [ModelType.BAIDU, ModelType.DEEPSEEK, ModelType.ZHIPU];
    // 后续添加其他模型后更新为:
    // return [ModelType.BAIDU, ModelType.DEEPSEEK, ModelType.ZHIPU, ModelType.XUNFEI];
  }

  /**
   * 验证指定类型模型的API密钥
   * @param modelType 模型类型
   */
  public async validateModelApiKey(modelType: ModelType): Promise<boolean> {
    try {
      const adapter = this.createModelAdapter(modelType);
      return await adapter.validateApiKey();
    } catch (error) {
      return false;
    }
  }
} 