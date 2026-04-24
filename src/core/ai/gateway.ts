import { getLogger } from '../../utils/logger';
import { CacheManager, CacheKeys } from '../cache';
import { getEventBus } from '../events';
import { TaskFlowEvent, AIRequestPayload, AIResponsePayload } from '../../types/event';
import { RateLimiter, DEFAULT_LIMITS } from '../network/rate-limiter';

const logger = getLogger('module');
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
import { createHash } from 'crypto';

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
  /** 启用缓存 */
  enableCache?: boolean;
  /** 启用限流 */
  enableRateLimit?: boolean;
  /** 限流配置 */
  rateLimits?: Record<string, { rpm: number; rps: number }>;
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
  private cacheManager: CacheManager | null = null;
  private enableCache: boolean;
  private eventBus = getEventBus();
  private rateLimiter: RateLimiter | null = null;
  private enableRateLimit: boolean;

  constructor(options: ModelGatewayOptions) {
    this.defaultRouter = options.defaultRouter || 'smart';
    this.enableFallback = options.enableFallback ?? true;
    this.maxRetries = options.maxRetries ?? 2;
    this.retryDelay = options.retryDelay ?? 1000;
    this.enableCache = options.enableCache ?? true;

    // 初始化限流器
    this.enableRateLimit = options.enableRateLimit ?? true;
    if (this.enableRateLimit) {
      const limits: Record<string, { rpm: number; rps: number }> = {};

      // 合并默认配置和自定义配置
      for (const [provider, config] of Object.entries(DEFAULT_LIMITS)) {
        limits[provider] = { rpm: config.rpm, rps: config.rps };
      }
      if (options.rateLimits) {
        for (const [provider, config] of Object.entries(options.rateLimits)) {
          limits[provider] = config;
        }
      }

      this.rateLimiter = new RateLimiter({
        enableQueue: true,
        queueTimeout: 30000,
        maxQueueSize: 100,
        limits,
      });
      logger.info('ModelGateway 限流已启用');
    }

    // 初始化缓存管理器
    if (this.enableCache) {
      this.cacheManager = new CacheManager({
        enabled: true,
        l1: {
          enabled: true,
          maxSize: 200,
          ttl: 300, // 5 分钟
        },
        l2: {
          enabled: true,
          ttl: 86400, // 24 小时
        },
      });
      logger.info('ModelGateway 缓存已启用');
    }

    for (const config of options.models) {
      this.addModel(config);
    }
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(messages: ChatMessage[], model: string): string {
    const content = messages.map(m => `${m.role}:${m.content}`).join('|');
    const hash = createHash('sha256')
      .update(content + model)
      .digest('hex')
      .slice(0, 32);
    return CacheKeys.aiResponse(hash, model);
  }

  /** 添加模型 */
  addModel(config: ModelConfig): void {
    this.models.set(config.id, config);

    const adapter = this.createAdapter(config);
    if (adapter) {
      this.adapters.set(config.id, adapter);
    }

    if (config.enabled) {
      this.enabledModels = [...this.enabledModels.filter(m => m.id !== config.id), config].sort(
        (a, b) => a.priority - b.priority
      );
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
        this.enabledModels = [...this.enabledModels.filter(m => m.id !== modelId), config].sort(
          (a, b) => a.priority - b.priority
        );
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
      default:
        logger.warn(`Unknown provider: ${config.provider}`);
        return null;
    }
  }

  /**
   * 发送聊天请求 (自动路由)
   */
  async complete(request: CompletionRequest): Promise<CompletionResult> {
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

    const options: ChatCompletionOptions = {
      model: model.modelName,
      messages: request.messages,
      temperature: request.temperature ?? model.temperature,
      max_tokens: request.maxTokens ?? model.maxTokens,
    };

    if (request.systemPrompt) {
      options.messages = [{ role: 'system', content: request.systemPrompt }, ...options.messages];
    }

    // 生成缓存键
    const cacheKey = this.generateCacheKey(options.messages, model.modelName);
    const cached = this.cacheManager?.get<ChatCompletionResponse>(cacheKey);
    if (cached) {
      logger.debug(`缓存命中: ${cacheKey}`);

      // 发送缓存命中事件
      this.eventBus.emit({
        type: TaskFlowEvent.CACHE_HIT,
        payload: { cacheType: 'l1', key: cacheKey },
        timestamp: Date.now(),
        source: 'ModelGateway',
        id: `event-${Date.now()}`,
      });

      // 发送 AI 响应事件 (缓存)
      const responsePayload: AIResponsePayload = {
        modelId: model.id,
        modelName: model.modelName,
        responseLength: cached.choices?.[0]?.message?.content?.length ?? 0,
        duration: 0,
        cached: true,
        tokens: cached.usage
          ? {
              prompt: cached.usage.prompt_tokens,
              completion: cached.usage.completion_tokens,
              total: cached.usage.total_tokens,
            }
          : undefined,
        cacheHit: true,
        cost: 0,
      };
      this.eventBus.emit({
        type: TaskFlowEvent.AI_RESPONSE,
        payload: responsePayload,
        timestamp: Date.now(),
        source: 'ModelGateway',
        id: `event-${Date.now()}`,
      });

      return {
        response: cached,
        model,
        routing,
        cost: 0,
        latency: 0,
      };
    }

    let lastError: Error | null = null;
    const startTime = Date.now();

    // 发送 AI 请求事件
    this.eventBus.emit({
      type: TaskFlowEvent.AI_REQUEST,
      payload: {
        modelId: model.id,
        modelName: model.modelName,
        promptLength: options.messages.reduce((sum, m) => sum + (m.content?.length ?? 0), 0),
        cacheKey,
      },
      timestamp: Date.now(),
      source: 'ModelGateway',
        id: `event-${Date.now()}`,
    });

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // 等待限流令牌
        if (this.rateLimiter) {
          await this.rateLimiter.acquire(model.provider);
        }

        const response = await adapter.complete(options);

        const cost = adapter.estimateCost(
          response.usage?.prompt_tokens || 0,
          response.usage?.completion_tokens || 0
        );

        // 缓存结果
        if (this.cacheManager && response.choices && response.choices.length > 0) {
          this.cacheManager.set(cacheKey, response, 300); // 5分钟 TTL
        }

        // 发送 AI 响应事件
        const responsePayload: AIResponsePayload = {
          modelId: model.id,
          modelName: model.modelName,
          responseLength: response.choices?.[0]?.message?.content?.length ?? 0,
          duration: Date.now() - startTime,
          cached: false,
          tokens: response.usage
            ? {
                prompt: response.usage.prompt_tokens,
                completion: response.usage.completion_tokens,
                total: response.usage.total_tokens,
              }
            : undefined,
          cacheHit: false,
          cost,
        };
        this.eventBus.emit({
          type: TaskFlowEvent.AI_RESPONSE,
          payload: responsePayload,
          timestamp: Date.now(),
          source: 'ModelGateway',
        id: `event-${Date.now()}`,
        });

        return {
          response,
          model,
          routing,
          cost,
          latency: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.maxRetries && this.enableFallback) {
          await this.sleep(this.retryDelay * (attempt + 1));

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
      model: routing.model.modelName,
      messages: request.messages,
      temperature: request.temperature ?? routing.model.temperature,
      max_tokens: request.maxTokens ?? routing.model.maxTokens,
      stream: true,
    };

    if (request.systemPrompt) {
      options.messages = [{ role: 'system', content: request.systemPrompt }, ...options.messages];
    }

    yield* adapter.stream(options as Omit<ChatCompletionOptions, 'model'> & { stream: true });
  }

  /** 测试所有模型连接 */
  async testAll(): Promise<
    Array<{ modelId: string; success: boolean; latency: number; error?: string }>
  > {
    const results: Array<{ modelId: string; success: boolean; latency: number; error?: string }> =
      [];

    for (const [modelId, adapter] of Array.from(this.adapters.entries())) {
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

  /** 获取缓存统计 */
  getCacheStats() {
    return this.cacheManager?.getStats() ?? null;
  }

  /** 获取限流统计 */
  getRateLimitStats() {
    return this.rateLimiter?.getStats() ?? null;
  }

  /** 清空缓存 */
  clearCache(): void {
    this.cacheManager?.clear();
  }

  /** 睡眠辅助函数 */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default ModelGateway;
