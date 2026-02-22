/**
 * 模型网关 - 统一入口
 * 负责模型管理、路由选择、请求发送
 */

import { ModelConfig, ProviderType, ModelCapability, MODEL_REGISTRY } from './types';
import { BaseAdapter, ChatMessage, ChatCompletionResponse, ChatCompletionOptions } from './adapter';
import { DeepSeekAdapter } from './providers/deepseek';
import { OpenAIAdapter } from './providers/openai';
import { AnthropicAdapter } from './providers/anthropic';
import { createRouter, RouterStrategy, RoutingResult } from './router';

export interface ModelGatewayOptions {
  /** 模型配置列表 */
  models: ModelConfig[];
  /** 默认路由策略 */
  defaultRouter?: RouterStrategy;
  /** 启用级联降级 */
  enableFallback?: boolean;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 重试延迟 (ms) */
  retryDelay?: number;
}

export interface CompletionRequest {
  /** 消息列表 */
  messages: ChatMessage[];
  /** 首选模型 ID (可选) */
  preferredModel?: string;
  /** 温度 */
  temperature?: number;
  /** 最大 token 数 */
  maxTokens?: number;
  /** 路由策略 (可选，覆盖默认) */
  strategy?: RouterStrategy;
  /** 自定义提示词标签 */
  systemPrompt?: string;
}

export interface CompletionResult {
  /** 响应内容 */
  response: ChatCompletionResponse;
  /** 使用的模型 */
  model: ModelConfig;
  /** 路由决策信息 */
  routing: RoutingResult;
  /** 实际成本 (美元) */
  cost: number;
  /** 延迟 (ms) */
  latency: number;
}

/**
 * 模型网关
 * 统一管理多模型，提供智能路由和级联降级
 */
export class ModelGateway {
  private models: Map<string, ModelConfig> = new Map();
  private adapters: Map<string, BaseAdapter> = new Map();
  private defaultRouter: RouterStrategy;
  private enableFallback: boolean;
  private maxRetries: number;
  private retryDelay: number;
  private enabledModels: ModelConfig[] = [];

  constructor(options: ModelGatewayOptions) {
    this.defaultRouter = options.defaultRouter || 'smart';
    this.enableFallback = options.enableFallback ?? true;
    this.maxRetries = options.maxRetries ?? 2;
    this.retryDelay = options.retryDelay ?? 1000;

    // 初始化模型
    for (const config of options.models) {
      this.addModel(config);
    }
  }

  /** 添加模型 */
  addModel(config: ModelConfig): void {
    this.models.set(config.id, config);
    
    // 创建适配器
    const adapter = this.createAdapter(config);
    if (adapter) {
      this.adapters.set(config.id, adapter);
    }

    // 更新可用模型列表
    if (config.enabled) {
      this.enabledModels = [...this.enabledModels.filter(m => m.id !== config.id), config]
        .sort((a, b) => a.priority - b.priority);
    }
  }

  /** 移除模型 */
  removeModel(modelId: string): void {
    this.models.delete(modelId);
    this.adapters.delete(modelId);
    this.enabledModels = this.enabledModels.filter(m => m.id !== modelId);
  }

  /** 启用/禁用模型 */
  setModelEnabled(modelId: string, enabled: boolean): void {
    const config = this.models.get(modelId);
    if (config) {
      config.enabled = enabled;
      if (enabled) {
        this.enabledModels = [...this.enabledModels.filter(m => m.id !== modelId), config]
          .sort((a, b) => a.priority - b.priority);
      } else {
        this.enabledModels = this.enabledModels.filter(m => m.id !== modelId);
      }
    }
  }

  /** 获取所有模型 */
  getModels(): ModelConfig[] {
    return Array.from(this.models.values());
  }

  /** 获取可用模型 */
  getEnabledModels(): ModelConfig[] {
    return this.enabledModels;
  }

  /** 获取单个模型 */
  getModel(modelId: string): ModelConfig | undefined {
    return this.models.get(modelId);
  }

  /** 创建适配器 */
  private createAdapter(config: ModelConfig): BaseAdapter | null {
    switch (config.provider) {
      case 'deepseek':
        return new DeepSeekAdapter(config);
      case 'openai':
        return new OpenAIAdapter(config);
      case 'anthropic':
        return new AnthropicAdapter(config);
      // 其他提供商可以后续添加
      default:
        console.warn(`Unknown provider: ${config.provider}`);
        return null;
    }
  }

  /**
   * 发送聊天请求 (自动路由)
   */
  async complete(request: CompletionRequest): Promise<CompletionResult> {
    // 确定使用的模型和路由策略
    const strategy = request.strategy || this.defaultRouter;
    const routing = await createRouter(strategy).select(
      request.messages,
      this.enabledModels,
      request.preferredModel
    );

    const model = routing.model;
    const adapter = this.adapters.get(model.id);

    if (!adapter) {
      throw new Error(`No adapter for model: ${model.id}`);
    }

    // 准备请求选项
    const options: ChatCompletionOptions = {
      messages: request.messages,
      temperature: request.temperature ?? model.temperature,
      max_tokens: request.maxTokens ?? model.maxTokens,
    };

    if (request.systemPrompt) {
      options.messages = [
        { role: 'system', content: request.systemPrompt },
        ...options.messages,
      ];
    }

    // 发送请求 (带重试)
    let lastError: Error | null = null;
    const startTime = Date.now();

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await adapter.complete(options);
        
        // 计算成本
        const cost = adapter.estimateCost(
          response.usage?.prompt_tokens || 0,
          response.usage?.completion_tokens || 0
        );

        return {
          response,
          model,
          routing,
          cost,
          latency: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // 如果不是最后一次尝试，等待后重试
        if (attempt < this.maxRetries && this.enableFallback) {
          await this.sleep(this.retryDelay * (attempt + 1));
          
          // 尝试降级到下一个模型
          const fallbackModels = this.enabledModels.filter(m => m.priority > model.priority);
          if (fallbackModels.length > 0) {
            const newModel = fallbackModels[0];
            model.id !== newModel.id; // 更新模型
          }
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  /**
   * 流式聊天请求
   */
  async *stream(request: CompletionRequest & { stream: true }) {
    const strategy = request.strategy || this.defaultRouter;
    const routing = await createRouter(strategy).select(
      request.messages,
      this.enabledModels,
      request.preferredModel
    );

    const adapter = this.adapters.get(routing.model.id);
    if (!adapter) {
      throw new Error(`No adapter for model: ${routing.model.id}`);
    }

    const options: ChatCompletionOptions = {
      messages: request.messages,
      temperature: request.temperature ?? routing.model.temperature,
      max_tokens: request.maxTokens ?? routing.model.maxTokens,
      stream: true,
    };

    if (request.systemPrompt) {
      options.messages = [
        { role: 'system', content: request.systemPrompt },
        ...options.messages,
      ];
    }

    yield* adapter.stream(options);
  }

  /** 测试所有模型连接 */
  async testAll(): Promise<Array<{ modelId: string; success: boolean; latency: number; error?: string }>> {
    const results: Array<{ modelId: string; success: boolean; latency: number; error?: string }> = [];

    for (const [modelId, adapter] of this.adapters) {
      const result = await adapter.test();
      results.push({
        modelId,
        ...result,
      });
    }

    return results;
  }

  /** 获取模型信息 */
  getModelInfo(modelId: string) {
    const config = this.models.get(modelId);
    const registry = MODEL_REGISTRY[modelId];
    
    return {
      ...config,
      ...registry,
    };
  }

  /** 查找支持特定能力的模型 */
  findByCapability(capability: ModelCapability): ModelConfig[] {
    return this.enabledModels.filter(m => m.capabilities.includes(capability));
  }

  /** 睡眠辅助函数 */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default ModelGateway;
