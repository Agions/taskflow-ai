/**
 * 路由器实现
 */

import { ModelConfig } from './types';
import {
  BaseRouter,
  RoutingResult,
  RouterStrategy,
  RoutingRule,
  RoutingContext,
} from './router-types';
import { DEFAULT_ROUTING_RULES } from './router-rules';

/**
 * 智能路由器
 */
export class SmartRouter extends BaseRouter {
  private rules = DEFAULT_ROUTING_RULES;

  async select(
    messages: unknown[],
    availableModels: ModelConfig[],
    preferredModel?: string
  ): Promise<RoutingResult> {
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

    for (const rule of this.rules) {
      if (rule.match(context, messages)) {
        for (const preferId of rule.prefer) {
          const current = scoredModels.get(preferId) || 0;
          scoredModels.set(preferId, current + rule.weight);
        }
      }
    }

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

  /**
   * 诊断路由决策 — 解释每个模型为什么被选中或落选
   * 用于调试和可视化路由优先级
   */
  explain(
    messages: unknown[],
    availableModels: ModelConfig[],
    preferredModel?: string
  ): RoutingExplanation {
    const context = this.extractContext(messages);
    const scoredModels = new Map<string, ScoredModel>();

    // 初始化所有模型分数
    for (const model of availableModels) {
      scoredModels.set(model.id, {
        model,
        score: 0,
        matchedRules: [],
      });
    }

    // 按规则打分
    const matchedRuleDetails: Array<{ rule: RoutingRule; matchedModelIds: string[] }> = [];
    for (const rule of this.rules) {
      const matches = rule.match(context, messages);
      if (matches) {
        for (const preferId of rule.prefer) {
          const entry = scoredModels.get(preferId);
          if (entry) {
            entry.score += rule.weight;
            entry.matchedRules.push(rule);
          }
        }
        matchedRuleDetails.push({
          rule,
          matchedModelIds: rule.prefer.filter(id => scoredModels.has(id)),
        });
      }
    }

    // 排序
    const ranked = Array.from(scoredModels.values()).sort((a, b) => b.score - a.score);
    const selectedId = preferredModel ?? ranked[0]?.model.id;

    return {
      context,
      ranked,
      matchedRuleDetails,
      selectedId,
      strategy: 'smart',
    };
  }
}

export interface ScoredModel {
  model: ModelConfig;
  score: number;
  matchedRules: RoutingRule[];
}

export interface RoutingExplanation {
  context: RoutingContext;
  ranked: ScoredModel[];
  matchedRuleDetails: Array<{ rule: RoutingRule; matchedModelIds: string[] }>;
  selectedId: string;
  strategy: RouterStrategy;
}

/**
 * 成本优化路由器
 */
export class CostRouter extends BaseRouter {
  async select(messages: unknown[], availableModels: ModelConfig[]): Promise<RoutingResult> {
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
export class SpeedRouter extends BaseRouter {
  private estimatedLatency: Record<string, number> = {
    'gpt-4o-mini': 500,
    'glm-4-flash': 600,
    'qwen-turbo': 700,
    'deepseek-chat': 800,
    'claude-3-5-sonnet': 1000,
    'gpt-4o': 1200,
    o1: 5000,
  };

  async select(messages: unknown[], availableModels: ModelConfig[]): Promise<RoutingResult> {
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
 * 优先级路由器
 */
export class PriorityRouter extends BaseRouter {
  async select(messages: unknown[], availableModels: ModelConfig[]): Promise<RoutingResult> {
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
 * 随机路由器
 */
export class RandomRouter extends BaseRouter {
  async select(messages: unknown[], availableModels: ModelConfig[]): Promise<RoutingResult> {
    const index = Math.floor(Math.random() * availableModels.length);

    return {
      model: availableModels[index],
      reason: 'Random selection',
      candidates: availableModels,
      strategy: 'random',
    };
  }
}
