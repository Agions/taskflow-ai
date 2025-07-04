/**
 * 国产大模型提供商 - 统一接口支持多种国产大语言模型
 * 支持百度文心、阿里通义千问、腾讯混元、智谱GLM、讯飞星火等
 */

import { Logger } from '../../infra/logger';
import { ConfigManager } from '../../infra/config';

/**
 * 国产大模型类型枚举
 */
export enum ChineseLLMType {
  BAIDU_WENXIN = 'baidu_wenxin',           // 百度文心一言
  ALIBABA_QWEN = 'alibaba_qwen',           // 阿里通义千问
  TENCENT_HUNYUAN = 'tencent_hunyuan',     // 腾讯混元
  ZHIPU_GLM = 'zhipu_glm',                 // 智谱GLM
  XUNFEI_SPARK = 'xunfei_spark',           // 讯飞星火
  DEEPSEEK = 'deepseek',                   // DeepSeek
  MOONSHOT = 'moonshot',                   // 月之暗面Kimi
  MINIMAX = 'minimax',                     // MiniMax
  SENSETIME_NOVA = 'sensetime_nova',       // 商汤日日新
  BAICHUAN = 'baichuan'                    // 百川智能
}

/**
 * 模型配置接口
 */
export interface ModelConfig {
  apiKey: string;
  secretKey?: string;                      // 某些模型需要
  baseUrl?: string;                        // 自定义API地址
  model: string;                           // 具体模型名称
  maxTokens?: number;                      // 最大token数
  temperature?: number;                    // 温度参数
  topP?: number;                          // top_p参数
  timeout?: number;                        // 超时时间(ms)
  retryCount?: number;                     // 重试次数
}

/**
 * 聊天消息接口
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;                           // 消息发送者名称
}

/**
 * 聊天请求接口
 */
export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;                          // 覆盖默认模型
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stream?: boolean;                        // 是否流式输出
  functions?: ((data: unknown) => unknown)[];  // 函数调用
  userId?: string;                         // 用户ID
}

/**
 * 聊天响应接口
 */
export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatChoice[];
  usage: TokenUsage;
  error?: string;
}

/**
 * 聊天选择接口
 */
export interface ChatChoice {
  index: number;
  message: ChatMessage;
  finishReason: string;
}

/**
 * Token使用统计
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * 流式响应接口
 */
export interface StreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: StreamChoice[];
}

/**
 * 流式选择接口
 */
export interface StreamChoice {
  index: number;
  delta: {
    role?: string;
    content?: string;
  };
  finishReason?: string;
}

/**
 * 国产大模型提供商基类
 */
export abstract class ChineseLLMProvider {
  protected logger: Logger;
  protected config: ModelConfig;
  protected type: ChineseLLMType;

  constructor(type: ChineseLLMType, config: ModelConfig, logger: Logger) {
    this.type = type;
    this.config = config;
    this.logger = logger;
  }

  /**
   * 聊天补全
   * @param request 聊天请求
   */
  abstract chat(request: ChatRequest): Promise<ChatResponse>;

  /**
   * 流式聊天补全
   * @param request 聊天请求
   * @param onChunk 流式数据回调
   */
  abstract chatStream(
    request: ChatRequest, 
    onChunk: (chunk: StreamResponse) => void
  ): Promise<void>;

  /**
   * 验证API密钥
   */
  abstract validateApiKey(): Promise<boolean>;

  /**
   * 获取模型信息
   */
  abstract getModelInfo(): Promise<any>;

  /**
   * 获取支持的模型列表
   */
  abstract getSupportedModels(): string[];

  /**
   * 计算token数量（估算）
   * @param text 文本内容
   */
  protected estimateTokens(text: string): number {
    // 简化的中文token估算：中文字符约1.5个token，英文单词约1个token
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    const otherChars = text.length - chineseChars - englishWords;
    
    return Math.ceil(chineseChars * 1.5 + englishWords + otherChars * 0.5);
  }

  /**
   * 处理API错误
   * @param error 错误对象
   */
  protected handleApiError(error: any): string {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 401:
          return 'API密钥无效或已过期';
        case 403:
          return '访问被拒绝，请检查权限设置';
        case 429:
          return 'API调用频率超限，请稍后重试';
        case 500:
          return '服务器内部错误';
        default:
          return data?.error?.message || `API错误: ${status}`;
      }
    }
    
    if (error.code === 'ECONNREFUSED') {
      return '无法连接到API服务器';
    }
    
    if (error.code === 'ETIMEDOUT') {
      return 'API请求超时';
    }
    
    return error.message || '未知错误';
  }

  /**
   * 重试机制
   * @param fn 要重试的函数
   * @param maxRetries 最大重试次数
   */
  protected async withRetry<T>(
    fn: () => Promise<T>, 
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (i === maxRetries) {
          break;
        }
        
        // 指数退避
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        this.logger.warn(`API调用失败，${delay}ms后重试 (${i + 1}/${maxRetries}): ${lastError.message}`);
      }
    }
    
    throw lastError!;
  }

  /**
   * 格式化消息
   * @param messages 原始消息
   */
  protected formatMessages(messages: ChatMessage[]): any[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      ...(msg.name && { name: msg.name })
    }));
  }

  /**
   * 生成请求ID
   */
  protected generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取当前时间戳
   */
  protected getCurrentTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }
}

/**
 * 国产大模型管理器
 */
export class ChineseLLMManager {
  private providers: Map<ChineseLLMType, ChineseLLMProvider> = new Map();
  private logger: Logger;
  private configManager: ConfigManager;
  private defaultProvider?: ChineseLLMType;

  constructor(logger: Logger, configManager: ConfigManager) {
    this.logger = logger;
    this.configManager = configManager;
  }

  /**
   * 注册模型提供商
   * @param type 模型类型
   * @param provider 提供商实例
   */
  public registerProvider(type: ChineseLLMType, provider: ChineseLLMProvider): void {
    this.providers.set(type, provider);
    this.logger.info(`已注册模型提供商: ${type}`);
  }

  /**
   * 设置默认提供商
   * @param type 模型类型
   */
  public setDefaultProvider(type: ChineseLLMType): void {
    if (!this.providers.has(type)) {
      throw new Error(`未注册的模型提供商: ${type}`);
    }
    this.defaultProvider = type;
    this.logger.info(`设置默认模型提供商: ${type}`);
  }

  /**
   * 获取提供商
   * @param type 模型类型，不指定则使用默认
   */
  public getProvider(type?: ChineseLLMType): ChineseLLMProvider {
    const targetType = type || this.defaultProvider;
    
    if (!targetType) {
      throw new Error('未指定模型类型且无默认提供商');
    }
    
    const provider = this.providers.get(targetType);
    if (!provider) {
      throw new Error(`未注册的模型提供商: ${targetType}`);
    }
    
    return provider;
  }

  /**
   * 聊天补全（使用默认或指定提供商）
   * @param request 聊天请求
   * @param providerType 指定提供商类型
   */
  public async chat(request: ChatRequest, providerType?: ChineseLLMType): Promise<ChatResponse> {
    const provider = this.getProvider(providerType);
    return await provider.chat(request);
  }

  /**
   * 流式聊天补全
   * @param request 聊天请求
   * @param onChunk 流式数据回调
   * @param providerType 指定提供商类型
   */
  public async chatStream(
    request: ChatRequest,
    onChunk: (chunk: StreamResponse) => void,
    providerType?: ChineseLLMType
  ): Promise<void> {
    const provider = this.getProvider(providerType);
    return await provider.chatStream(request, onChunk);
  }

  /**
   * 获取所有已注册的提供商
   */
  public getRegisteredProviders(): ChineseLLMType[] {
    return Array.from(this.providers.keys());
  }

  /**
   * 验证所有提供商的API密钥
   */
  public async validateAllProviders(): Promise<Map<ChineseLLMType, boolean>> {
    const results = new Map<ChineseLLMType, boolean>();
    
    for (const [type, provider] of this.providers) {
      try {
        const isValid = await provider.validateApiKey();
        results.set(type, isValid);
        this.logger.info(`${type} API密钥验证: ${isValid ? '成功' : '失败'}`);
      } catch (error) {
        results.set(type, false);
        this.logger.error(`${type} API密钥验证失败: ${(error as Error).message}`);
      }
    }
    
    return results;
  }

  /**
   * 获取模型能力对比
   */
  public async getModelCapabilities(): Promise<Map<ChineseLLMType, any>> {
    const capabilities = new Map<ChineseLLMType, any>();
    
    for (const [type, provider] of this.providers) {
      try {
        const info = await provider.getModelInfo();
        capabilities.set(type, {
          models: provider.getSupportedModels(),
          info,
          features: this.getProviderFeatures(type)
        });
      } catch (error) {
        this.logger.error(`获取${type}模型信息失败: ${(error as Error).message}`);
      }
    }
    
    return capabilities;
  }

  /**
   * 获取提供商特性
   * @param type 模型类型
   */
  private getProviderFeatures(type: ChineseLLMType): string[] {
    const features: Record<ChineseLLMType, string[]> = {
      [ChineseLLMType.BAIDU_WENXIN]: ['中文优化', '函数调用', '插件系统'],
      [ChineseLLMType.ALIBABA_QWEN]: ['多模态', '长文本', '代码生成'],
      [ChineseLLMType.TENCENT_HUNYUAN]: ['企业级', '安全合规', '定制化'],
      [ChineseLLMType.ZHIPU_GLM]: ['代码理解', '数学推理', '多语言'],
      [ChineseLLMType.XUNFEI_SPARK]: ['语音交互', '实时对话', '教育场景'],
      [ChineseLLMType.DEEPSEEK]: ['代码生成', '数学推理', '开源友好'],
      [ChineseLLMType.MOONSHOT]: ['长上下文', '文档理解', '知识问答'],
      [ChineseLLMType.MINIMAX]: ['角色扮演', '创意写作', '多模态'],
      [ChineseLLMType.SENSETIME_NOVA]: ['视觉理解', '多模态', '行业应用'],
      [ChineseLLMType.BAICHUAN]: ['中文优化', '知识问答', '推理能力']
    };
    
    return features[type] || [];
  }

  /**
   * 智能选择最佳提供商
   * @param task 任务类型
   * @param requirements 需求描述
   */
  public selectBestProvider(task: string, _requirements?: string): ChineseLLMType {
    // 基于任务类型的简单选择逻辑
    const taskLower = task.toLowerCase();
    
    if (taskLower.includes('代码') || taskLower.includes('code')) {
      return ChineseLLMType.DEEPSEEK;
    }
    
    if (taskLower.includes('文档') || taskLower.includes('长文本')) {
      return ChineseLLMType.MOONSHOT;
    }
    
    if (taskLower.includes('数学') || taskLower.includes('推理')) {
      return ChineseLLMType.ZHIPU_GLM;
    }
    
    if (taskLower.includes('创意') || taskLower.includes('写作')) {
      return ChineseLLMType.MINIMAX;
    }
    
    // 默认使用通义千问（综合能力较强）
    return this.defaultProvider || ChineseLLMType.ALIBABA_QWEN;
  }

  /**
   * 批量处理请求（负载均衡）
   * @param requests 请求列表
   * @param options 处理选项
   */
  public async batchProcess(
    requests: ChatRequest[],
    options: {
      maxConcurrency?: number;
      loadBalance?: boolean;
      preferredProvider?: ChineseLLMType;
    } = {}
  ): Promise<ChatResponse[]> {
    const { maxConcurrency = 5, loadBalance = true, preferredProvider } = options;
    const results: ChatResponse[] = [];
    const providers = loadBalance ? Array.from(this.providers.keys()) : [preferredProvider || this.defaultProvider!];
    
    // 分批处理
    for (let i = 0; i < requests.length; i += maxConcurrency) {
      const batch = requests.slice(i, i + maxConcurrency);
      const batchPromises = batch.map(async (request, index) => {
        const providerType = loadBalance ? providers[index % providers.length] : providers[0];
        return await this.chat(request, providerType);
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          this.logger.error(`批量处理第${i + index + 1}个请求失败: ${result.reason}`);
          // 添加错误响应
          results.push({
            id: `error_${i + index}`,
            object: 'chat.completion',
            created: Date.now(),
            model: 'error',
            choices: [],
            usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            error: result.reason.message
          });
        }
      });
    }
    
    return results;
  }
}
