/**
 * 路由规则定义
 */

import { RoutingRule } from './router-types';

/**
 * 默认路由规则
 */
export const DEFAULT_ROUTING_RULES: RoutingRule[] = [
  {
    match: (ctx: any, msgs: any[]) => {
      const lastMsg = msgs[msgs.length - 1]?.content?.toLowerCase() || '';
      return (
        ctx.taskType === 'code' ||
        lastMsg.includes('code') ||
        lastMsg.includes('function') ||
        lastMsg.includes('implement')
      );
    },
    prefer: ['deepseek-coder', 'gpt-4o', 'claude-3-5-sonnet'],
    weight: 1.0,
  },
  {
    match: ctx => ctx.complexity === 'high' || ctx.taskType === 'reasoning',
    prefer: ['o1', 'claude-3-opus', 'qwen-plus'],
    weight: 0.9,
  },
  {
    match: ctx => ctx.taskType === 'vision',
    prefer: ['gpt-4o', 'claude-3-5-sonnet'],
    weight: 1.0,
  },
  {
    match: ctx => ctx.taskType === 'function',
    prefer: ['gpt-4o', 'claude-3-5-sonnet'],
    weight: 1.0,
  },
  {
    match: ctx => ctx.complexity === 'low' && !ctx.budget,
    prefer: ['glm-4-flash', 'qwen-turbo', 'gpt-4o-mini'],
    weight: 0.7,
  },
  {
    match: (ctx: any) => ctx.urgent,
    prefer: ['gpt-4o-mini', 'glm-4-flash', 'qwen-turbo'],
    weight: 0.8,
  },
];
