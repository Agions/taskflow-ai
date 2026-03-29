/**
 * 路由器工厂
 */

import { ModelConfig } from './types';
import { BaseRouter, RouterStrategy, RoutingResult } from './router-types';
import { SmartRouter, CostRouter, SpeedRouter, PriorityRouter, RandomRouter } from './routers';

/**
 * 创建路由器
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
  messages: unknown[],
  models: ModelConfig[]
): Promise<Record<RouterStrategy, RoutingResult>> {
  const strategies: RouterStrategy[] = ['smart', 'cost', 'speed', 'priority'];
  const results: Record<string, RoutingResult> = {};

  for (const strategy of strategies) {
    results[strategy] = await createRouter(strategy).select(messages, models);
  }

  return results as Record<RouterStrategy, RoutingResult>;
}
