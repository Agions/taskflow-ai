/**
 * 智能路由系统
 * 根据任务特征选择最优模型
 */

import { ModelConfig, ModelCapability } from './types';

export type RouterStrategy = 'smart' | 'cost' | 'speed' | 'random' | 'priority';

export interface RoutingContext {
  /** 任务类型 */
  taskType?: 'chat' | 'code' | 'reasoning' | 'vision' | 'function';
  /** 复杂度 */
  complexity?: 'low' | 'medium' | 'high';
  /** 预算限制 (美元) */
  budget?: number;
  /** 是否紧急 */
  urgent?: boolean;
  /** 需要的上下文长度 */
  contextLength?: number;
}

export interface RoutingResult {
  /** 选择的模型 */
  model: ModelConfig;
  /** 决策原因 */
  reason: string;
  /** 候选模型列表 (按优先级) */
  candidates: ModelConfig[];
  /** 使用的策略 */
  strategy: RouterStrategy;
}

/** 路由规则配置 */
interface RoutingRule {
  /** 匹配条件 */
  match: (context: RoutingContext, messages: any[]) => boolean;
  /** 偏好模型 */
  prefer: string[];
  /** 权重 */
  weight: number;
}

/** 路由规则 */
const DEFAULT_ROUTING_RULES: RoutingRule[] = [
  // 代码生成任务
  {
    match: (ctx, msgs) => {
      const lastMsg = msgs[msgs.length - 1]?.content?.toLowerCase() || '';
      return ctx.taskType === 'code' || 
        lastMsg.includes('code') || 
        lastMsg.includes('function') ||
        lastMsg.includes('implement');
    },
    prefer: ['deepseek-coder', 'gpt-4o', 'claude-3-5-sonnet'],
    weight: 1.0,
  },
  // 复杂推理任务
  {
    match: (ctx) => ctx.complexity === 'high' || ctx.taskType === 'reasoning',
    prefer: ['o1', 'claude-3-opus', 'qwen-plus'],
    weight: 0.9,
  },
  // 视觉任务
  {
    match: (ctx) => ctx.taskType === 'vision',
    prefer: ['gpt-4o', 'claude-3-5-sonnet'],
    weight: 1.0,
  },
  // 函数调用
  {
    match: (ctx) => ctx.taskType === 'function',
    prefer: ['gpt-4o', 'claude-3-5-sonnet'],
    weight: 1.0,
  },
  // 简单对话 - 成本优先
  {
    match: (ctx) => ctx.complexity === 'low' && !ctx.budget,
    prefer: ['glm-4-flash', 'qwen-turbo', 'gpt-4o-mini'],
    weight: 0.7,
  },
  // 紧急任务 - 速度优先
  {
    match: (ctx) => ctx.urgent,
    prefer: ['gpt-4o-mini', 'glm-4-flash', 'qwen-turbo'],
    weight: 0.8,
  },
];

/**
 * 路由器基类
 */
abstract class BaseRouter {
  abstract select(
    messages: any[],
    availableModels: ModelConfig[],
    preferredModel?: string
  ): Promise<RoutingResult>;

  protected extractContext(messages: any[]): RoutingContext {
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
    
    let taskType: RoutingContext['taskType'];
    let complexity: RoutingContext['complexity'] = 'medium';

    // 简单启发式判断
    if (lastMessage.includes('code') || lastMessage.includes('function')) {
      taskType = 'code';
    } else if (lastMessage.includes('analyze') || lastMessage.includes('think')) {
      taskType = 'reasoning';
      complexity = 'high';
    } else if (lastMessage.includes('image') || lastMessage.includes('picture')) {
      taskType = 'vision';
    } else {
      taskType = 'chat';
    }

    // 根据消息长度估计复杂度
    const totalLength = messages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
    if (totalLength < 200) {
      complexity = 'low';
    } else if (totalLength > 2000) {
      complexity = 'high';
    }

    return { taskType, complexity };
  }
}

/**
 * 智能路由器 - 根据任务特征自动选择
 */
class SmartRouter extends BaseRouter {
  private rules: RoutingRule[] = DEFAULT_ROUTING_RULES;

  async select(
    messages: any[],
    availableModels: ModelConfig[],
    preferredModel?: string
  ): Promise<RoutingResult> {
    // 如果指定了首选模型，优先使用
    if (preferredModel) {
      const model = availableModels.find(m => m.id === preferredModel);
      if (model) {
        return {
          model,
          reason: 'User preferred model',
          candidates: availableModels,
          strategy: 'smart',
        };
      }
    }

    const context = this.extractContext(messages);
    const scoredModels = new Map<string, number>();

    // 应用所有规则
    for (const rule of this.rules) {
      if (rule.match(context, messages)) {
        for (const preferId of rule.prefer) {
          const current = scoredModels.get(preferId) || 0;
          scoredModels.set(preferId, current + rule.weight);
        }
      }
    }

    // 按分数排序
    const sortedModels = [...availableModels].sort((a, b) => {
      const scoreA = scoredModels.get(a.id) || 0;
      const scoreB = scoredModels.get(b.id) || 0;
      if (scoreA !== scoreB) return scoreB - scoreA;
      return a.priority - b.priority;
    });

    const selected = sortedModels[0] || availableModels[0];

    return {
      model: selected,
      reason: `Task type: ${context.taskType}, Complexity: ${context.complexity}`,
      candidates: sortedModels,
      strategy: 'smart',
    };
  }
}

/**
 * 成本优化路由器
 */
class CostRouter extends BaseRouter {
  async select(
    messages: any[],
    availableModels: ModelConfig[]
  ): Promise<RoutingResult> {
    // 按输入成本排序
    const sortedModels = [...availableModels].sort((a, b) => {
      const costA = a.costPer1MInput || 999;
      const costB = b.costPer1MInput || 999;
      return costA - costB;
    });

    return {
      model: sortedModels[0],
      reason: 'Lowest input cost',
      candidates: sortedModels,
      strategy: 'cost',
    };
  }
}

/**
 * 速度优化路由器
 */
class SpeedRouter extends BaseRouter {
  // 模拟延迟 (实际应该基于历史数据)
  private estimatedLatency: Record<string, number> = {
    'gpt-4o-mini': 500,
    'glm-4-flash': 600,
    'qwen-turbo': 700,
    'deepseek-chat': 800,
    'claude-3-5-sonnet': 1000,
    'gpt-4o': 1200,
    'o1': 5000,
  };

  async select(
    messages: any[],
    availableModels: ModelConfig[]
  ): Promise<RoutingResult> {
    const sortedModels = [...availableModels].sort((a, b) => {
      const latencyA = this.estimatedLatency[a.id] || 1000;
      const latencyB = this.estimatedLatency[b.id] || 1000;
      return latencyA - latencyB;
    });

    return {
      model: sortedModels[0],
      reason: 'Lowest estimated latency',
      candidates: sortedModels,
      strategy: 'speed',
    };
  }
}

/**
 * 优先级路由器 - 按配置优先级
 */
class PriorityRouter extends BaseRouter {
  async select(
    messages: any[],
    availableModels: ModelConfig[]
  ): Promise<RoutingResult> {
    const sortedModels = [...availableModels].sort((a, b) => a.priority - b.priority);

    return {
      model: sortedModels[0],
      reason: 'Highest configured priority',
      candidates: sortedModels,
      strategy: 'priority',
    };
  }
}

/**
 * 随机路由器 (用于测试)
 */
class RandomRouter extends BaseRouter {
  async select(
    messages: any[],
    availableModels: ModelConfig[]
  ): Promise<RoutingResult> {
    const index = Math.floor(Math.random() * availableModels.length);

    return {
      model: availableModels[index],
      reason: 'Random selection',
      candidates: availableModels,
      strategy: 'random',
    };
  }
}

/**
 * 创建路由器工厂
 */
export function createRouter(strategy: RouterStrategy): BaseRouter {
  switch (strategy) {
    case 'smart':
      return new SmartRouter();
    case 'cost':
      return new CostRouter();
    case 'speed':
      return new SpeedRouter();
    case 'priority':
      return new PriorityRouter();
    case 'random':
      return new RandomRouter();
    default:
      return new SmartRouter();
  }
}

/**
 * 批量路由测试
 */
export async function benchmarkRouting(
  messages: any[],
  models: ModelConfig[]
): Promise<Record<RouterStrategy, RoutingResult>> {
  const strategies: RouterStrategy[] = ['smart', 'cost', 'speed', 'priority'];
  const results: Record<string, RoutingResult> = {};

  for (const strategy of strategies) {
    results[strategy] = await createRouter(strategy).select(messages, models);
  }

  return results as Record<RouterStrategy, RoutingResult>;
}
