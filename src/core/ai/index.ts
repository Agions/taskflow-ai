/**
 * AI 服务管理模块
 * 提供多模型 AI 协同能力
 */

import { TaskFlowConfig, AIProvider, AIModelConfig, Task, PRDDocument } from '../../types';
import { Logger } from '../../utils/logger';

// AI 服务接口
export interface AIService {
  readonly provider: AIProvider;
  readonly modelName: string;
  
  /**
   * 生成任务列表
   */
  generateTasks(prdDocument: PRDDocument): Promise<GeneratedTask[]>;
  
  /**
   * 估算任务工时
   */
  estimateHours(taskDescription: string): Promise<number>;
  
  /**
   * 分析任务依赖关系
   */
  analyzeDependencies(tasks: Task[]): Promise<DependencyAnalysis[]>;
  
  /**
   * 分析 PRD 文档结构
   */
  analyzePRDStructure(content: string): Promise<PRDAnalysis>;
  
  /**
   * 检查服务可用性
   */
  healthCheck(): Promise<boolean>;
}

// 生成的任务
export interface GeneratedTask {
  title: string;
  description: string;
  type: string;
  priority: string;
  complexity: string;
  estimatedHours: number;
  dependencies: string[];
  tags: string[];
}

// 依赖分析
export interface DependencyAnalysis {
  taskId: string;
  dependsOn: string[];
  reason: string;
}

// PRD 分析结果
export interface PRDAnalysis {
  title: string;
  sections: Array<{
    title: string;
    type: string;
    requirements: string[];
  }>;
  complexity: 'simple' | 'medium' | 'complex' | 'epic';
  estimatedTotalHours: number;
}

// AI 请求
export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

// AI 响应
export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: AIProvider;
}

/**
 * AI 模型管理器
 * 负责多模型路由和故障转移
 */
export class AIModelManager {
  private services: Map<AIProvider, AIService> = new Map();
  private config: TaskFlowConfig;
  private logger: Logger;
  private cache: Map<string, AIResponse> = new Map();

  constructor(config: TaskFlowConfig) {
    this.config = config;
    this.logger = Logger.getInstance('AIModelManager');
    this.initializeServices();
  }

  /**
   * 初始化 AI 服务
   */
  private initializeServices(): void {
    const enabledModels = this.config.aiModels
      .filter(m => m.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const model of enabledModels) {
      try {
        const service = this.createService(model);
        if (service) {
          this.services.set(model.provider, service);
          this.logger.info(`AI 服务已注册: ${model.provider} (${model.modelName})`);
        }
      } catch (error) {
        this.logger.warn(`初始化 ${model.provider} 失败:`, error);
      }
    }
  }

  /**
   * 创建 AI 服务实例
   */
  private createService(config: AIModelConfig): AIService | null {
    // 懒加载，避免循环依赖
    switch (config.provider) {
      case 'deepseek':
        const { DeepSeekService } = require('./providers/deepseek');
        return new DeepSeekService(config);
      
      case 'zhipu':
        const { ZhipuService } = require('./providers/zhipu');
        return new ZhipuService(config);
      
      case 'qwen':
        const { QwenService } = require('./providers/qwen');
        return new QwenService(config);
      
      case 'moonshot':
        const { MoonshotService } = require('./providers/moonshot');
        return new MoonshotService(config);
      
      default:
        this.logger.warn(`不支持的 AI 提供商: ${config.provider}`);
        return null;
    }
  }

  /**
   * 获取可用的 AI 服务
   */
  getAvailableServices(): AIService[] {
    return Array.from(this.services.values());
  }

  /**
   * 获取首选服务
   */
  getPrimaryService(): AIService | null {
    const services = this.getAvailableServices();
    return services.length > 0 ? services[0] : null;
  }

  /**
   * 生成任务（带故障转移）
   */
  async generateTasks(prdDocument: PRDDocument): Promise<GeneratedTask[]> {
    const services = this.getAvailableServices();
    
    for (const service of services) {
      try {
        this.logger.info(`尝试使用 ${service.provider} 生成任务...`);
        const tasks = await service.generateTasks(prdDocument);
        this.logger.info(`成功生成 ${tasks.length} 个任务`);
        return tasks;
      } catch (error) {
        this.logger.warn(`${service.provider} 生成任务失败:`, error);
        continue;
      }
    }
    
    throw new Error('所有 AI 服务均不可用');
  }

  /**
   * 估算工时
   */
  async estimateHours(taskDescription: string): Promise<number> {
    const service = this.getPrimaryService();
    if (!service) {
      throw new Error('没有可用的 AI 服务');
    }
    
    return service.estimateHours(taskDescription);
  }

  /**
   * 分析 PRD 结构
   */
  async analyzePRDStructure(content: string): Promise<PRDAnalysis> {
    const service = this.getPrimaryService();
    if (!service) {
      throw new Error('没有可用的 AI 服务');
    }
    
    return service.analyzePRDStructure(content);
  }

  /**
   * 健康检查所有服务
   */
  async healthCheck(): Promise<Map<AIProvider, boolean>> {
    const results = new Map<AIProvider, boolean>();
    
    for (const [provider, service] of this.services) {
      try {
        const healthy = await service.healthCheck();
        results.set(provider, healthy);
      } catch (error) {
        results.set(provider, false);
      }
    }
    
    return results;
  }

  /**
   * 添加缓存
   */
  private getCacheKey(request: AIRequest): string {
    return `${request.prompt}_${request.systemPrompt || ''}_${request.temperature || 0.7}`;
  }

  /**
   * 获取缓存响应
   */
  getCachedResponse(request: AIRequest): AIResponse | undefined {
    const key = this.getCacheKey(request);
    return this.cache.get(key);
  }

  /**
   * 设置缓存响应
   */
  setCachedResponse(request: AIRequest, response: AIResponse): void {
    const key = this.getCacheKey(request);
    this.cache.set(key, response);
    
    // 限制缓存大小
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value as string | undefined;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.info('AI 响应缓存已清除');
  }
}

// 导出 DeepSeek 服务
export * from './providers/deepseek';

// 其他提供商将在后续实现
// export * from './providers/zhipu';
// export * from './providers/qwen';
// export * from './providers/moonshot';
