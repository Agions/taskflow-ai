/**
 * 路由器类型定义
 */

import { ModelConfig } from './types';

/**
 * 路由策略
 */
export type RouterStrategy = 'smart' | 'cost' | 'speed' | 'random' | 'priority';

/**
 * 路由上下文
 */
export interface RoutingContext {
  taskType?: 'chat' | 'code' | 'reasoning' | 'vision' | 'function';
  complexity?: 'low' | 'medium' | 'high';
  budget?: number;
  urgent?: boolean;
  contextLength?: number;
}

/**
 * 路由结果
 */
export interface RoutingResult {
  model: ModelConfig;
  reason: string;
  candidates: ModelConfig[];
  strategy: RouterStrategy;
}

/**
 * 路由规则
 */
export interface RoutingRule {
  match: (context: RoutingContext, messages: unknown[]) => boolean;
  prefer: string[];
  weight: number;
}

/**
 * 路由器基类
 */
export abstract class BaseRouter {
  abstract select(
    messages: unknown[],
    availableModels: ModelConfig[],
    preferredModel?: string
  ): Promise<RoutingResult>;

  protected extractContext(messages: unknown[]): RoutingContext {
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';

    let taskType: RoutingContext['taskType'];
    let complexity: RoutingContext['complexity'] = 'medium';

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

    const totalLength = messages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
    if (totalLength < 200) {
      complexity = 'low';
    } else if (totalLength > 2000) {
      complexity = 'high';
    }

    return { taskType, complexity };
  }
}
