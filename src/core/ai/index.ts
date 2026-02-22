/**
 * AI 核心模块导出
 */

export * from './types';
export * from './adapter';
export * from './gateway';
export * from './router';

import { ModelGateway, ModelGatewayOptions } from './gateway';

// 便捷创建函数
export function createModelGateway(options: ModelGatewayOptions): ModelGateway {
  return new ModelGateway(options);
}

// 默认配置
export const DEFAULT_MODELS = [
  {
    id: 'deepseek-chat',
    provider: 'deepseek' as const,
    modelName: 'deepseek-chat',
    apiKey: '',
    enabled: true,
    priority: 1,
    capabilities: ['chat', 'reasoning'] as const[],
    costPer1MInput: 0.5,
    costPer1MOutput: 2,
  },
  {
    id: 'gpt-4o-mini',
    provider: 'openai' as const,
    modelName: 'gpt-4o-mini',
    apiKey: '',
    enabled: true,
    priority: 2,
    capabilities: ['chat'] as const[],
    costPer1MInput: 0.15,
    costPer1MOutput: 0.6,
  },
  {
    id: 'claude-3-5-sonnet',
    provider: 'anthropic' as const,
    modelName: 'claude-3-5-sonnet-20241022',
    apiKey: '',
    enabled: true,
    priority: 3,
    capabilities: ['chat', 'vision', 'function_calling'] as const[],
    costPer1MInput: 3,
    costPer1MOutput: 15,
  },
];
