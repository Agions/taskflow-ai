import {
  ModelCallOptions,
  ModelRequestParams,
  ModelResponse
} from '../../../types/model';
import { ModelType } from '../../../types/config';

/**
 * 模型适配器接口
 * 为不同的大模型API提供统一的调用接口
 */
export interface ModelAdapter {
  /**
   * 获取模型类型
   */
  getModelType(): ModelType;

  /**
   * 执行聊天请求
   * @param params 请求参数
   * @param options 调用选项
   */
  chat(params: ModelRequestParams, options?: ModelCallOptions): Promise<ModelResponse>;

  /**
   * 流式聊天请求
   * @param params 请求参数 
   * @param onData 数据回调函数
   * @param options 调用选项
   */
  chatStream(
    params: ModelRequestParams,
    onData: (content: string, done: boolean) => void,
    options?: ModelCallOptions
  ): Promise<void>;

  /**
   * 验证API密钥
   */
  validateApiKey(): Promise<boolean>;
}

/**
 * 基础模型适配器抽象类
 * 提供模型适配器的通用实现
 */
export abstract class BaseModelAdapter implements ModelAdapter {
  protected modelType: ModelType;

  constructor(modelType: ModelType) {
    this.modelType = modelType;
  }

  /**
   * 获取模型类型
   */
  public getModelType(): ModelType {
    return this.modelType;
  }

  /**
   * 执行聊天请求
   * @param params 请求参数
   * @param options 调用选项
   */
  public abstract chat(params: ModelRequestParams, options?: ModelCallOptions): Promise<ModelResponse>;

  /**
   * 流式聊天请求
   * @param params 请求参数 
   * @param onData 数据回调函数
   * @param options 调用选项
   */
  public abstract chatStream(
    params: ModelRequestParams,
    onData: (content: string, done: boolean) => void,
    options?: ModelCallOptions
  ): Promise<void>;

  /**
   * 验证API密钥
   */
  public abstract validateApiKey(): Promise<boolean>;

  /**
   * 处理HTTP请求错误
   * @param error 错误对象
   */
  protected handleRequestError(error: any): never {
    if (error.response) {
      // 服务器响应了请求，但状态码不是2xx
      const statusCode = error.response.status;
      const data = error.response.data;
      let message = `HTTP Error ${statusCode}`;

      if (data && typeof data === 'object') {
        message += `: ${JSON.stringify(data)}`;
      }

      if (statusCode === 401 || statusCode === 403) {
        throw new Error(`认证失败：${message}，请检查API密钥是否正确`);
      } else if (statusCode === 429) {
        throw new Error(`请求速率限制：${message}，请稍后重试`);
      } else {
        throw new Error(`API调用失败：${message}`);
      }
    } else if (error.request) {
      // 请求已经发出，但没有收到响应
      throw new Error(`请求超时或网络错误：${error.message}`);
    } else {
      // 设置请求时发生了错误
      throw new Error(`请求配置错误：${error.message}`);
    }
  }
} 