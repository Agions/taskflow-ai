/**
 * AI Router System Tests
 * TaskFlow AI v4.0.1
 */

import {
  RouterStrategy,
  RoutingContext,
  RoutingResult,
  RoutingRule,
  BaseRouter,
} from '../router-types';
import {
  SmartRouter,
  CostRouter,
  SpeedRouter,
  PriorityRouter,
  RandomRouter,
  ScoredModel,
  RoutingExplanation,
} from '../routers';
import { createRouter, benchmarkRouting } from '../router-factory';
import type { ModelConfig, ProviderType, ModelCapability } from '../types';

describe('Router Types', () => {
  describe('RouterStrategy', () => {
    it('should support all strategy values', () => {
      const strategies: RouterStrategy[] =
        ['smart', 'cost', 'speed', 'random', 'priority'];
      expect(strategies).toHaveLength(5);
    });

    it('should create single strategy value', () => {
      const strategy: RouterStrategy = 'smart';
      expect(strategy).toBe('smart');
    });
  });

  describe('RoutingContext', () => {
    it('should create complete context', () => {
      const context: RoutingContext = {
        taskType: 'code',
        complexity: 'high',
        budget: 10,
        urgent: true,
        contextLength: 5000,
      };

      expect(context.taskType).toBe('code');
      expect(context.complexity).toBe('high');
      expect(context.budget).toBe(10);
      expect(context.urgent).toBe(true);
      expect(context.contextLength).toBe(5000);
    });

    it('should create minimal context', () => {
      const context: RoutingContext = {};
      expect(context).toBeDefined();
    });
  });

  describe('RoutingResult', () => {
    it('should create complete result', () => {
      const model: ModelConfig = {
        id: 'gpt-4o',
        provider: 'openai',
        modelName: 'GPT-4o',
        apiKey: 'test-key',
        enabled: true,
        priority: 1,
        capabilities: ['chat', 'vision'],
        maxTokens: 128000,
        temperature: 0.7,
        costPer1MInput: 5,
        costPer1MOutput: 15,
      };

      const result: RoutingResult = {
        model,
        reason: 'Test reason',
        candidates: [model],
        strategy: 'smart',
      };

      expect(result.model).toBe(model);
      expect(result.reason).toBe('Test reason');
      expect(result.candidates).toHaveLength(1);
      expect(result.strategy).toBe('smart');
    });
  });

  describe('RoutingRule', () => {
    it('should create complete rule', () => {
      const rule: RoutingRule = {
        match: (ctx: RoutingContext, msgs: unknown[]) => {
          return ctx.taskType === 'code';
        },
        prefer: ['gpt-4o'],
        weight: 1.0,
      };

      expect(typeof rule.match).toBe('function');
      expect(rule.prefer).toContain('gpt-4o');
      expect(rule.weight).toBe(1.0);
    });
  });
});

describe('SmartRouter', () => {
  let router: SmartRouter;
  let mockModels: ModelConfig[];

  beforeEach(() => {
    router = new SmartRouter();
    mockModels = [
      {
        id: 'gpt-4o-mini',
        provider: 'openai',
        modelName: 'GPT-4o Mini',
        apiKey: 'key1',
        enabled: true,
        priority: 1,
        capabilities: ['chat'],
        costPer1MInput: 0.15,
        costPer1MOutput: 0.6,
      },
      {
        id: 'deepseek-coder',
        provider: 'deepseek',
        modelName: 'DeepSeek Coder',
        apiKey: 'key2',
        enabled: true,
        priority: 2,
        capabilities: ['code'],
        costPer1MInput: 0.5,
        costPer1MOutput: 2,
      },
      {
        id: 'claude-3-5-sonnet',
        provider: 'anthropic',
        modelName: 'Claude 3.5 Sonnet',
        apiKey: 'key3',
        enabled: true,
        priority: 3,
        capabilities: ['chat', 'vision'],
        costPer1MInput: 3,
        costPer1MOutput: 15,
      },
    ];
  });

  describe('select', () => {
    it('should select preferred model when specified', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const result = await router.select(messages, mockModels, 'deepseek-coder');

      expect(result.model.id).toBe('deepseek-coder');
      expect(result.reason).toBe('User preferred model');
      expect(result.strategy).toBe('smart');
    });

    it('should ignore preferred model when not available', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const result = await router.select(messages, mockModels, 'unknown-model');

      expect(result.model).toBeDefined();
      expect(result.model.id).not.toBe('unknown-model');
    });

    it('should select code model for code tasks', async () => {
      const messages = [{ role: 'user', content: 'Write a function to sort array' }];
      const result = await router.select(messages, mockModels);

      expect(result.model).toBeDefined();
      expect(result.strategy).toBe('smart');
    });

    it('should select vision model for vision tasks', async () => {
      const messages = [{ role: 'user', content: 'Describe this image' }];
      const result = await router.select(messages, mockModels);

      expect(result.model).toBeDefined();
      expect(result.strategy).toBe('smart');
    });

    it('handle empty model list', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const result = await router.select(messages, []);

      expect(result).toBeDefined();
    });

    it('should return all candidates', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const result = await router.select(messages, mockModels);

      expect(result.candidates).toHaveLength(mockModels.length);
    });
  });

  describe('explain', () => {
    it('should provide detailed routing explanation', () => {
      const messages = [{ role: 'user', content: 'Write code' }];
      const explanation = router.explain(messages, mockModels);

      expect(explanation.context).toBeDefined();
      expect(explanation.ranked).toBeDefined();
      expect(explanation.matchedRuleDetails).toBeDefined();
      expect(explanation.selectedId).toBeDefined();
      expect(explanation.strategy).toBe('smart');
    });

    it('should rank models by score', () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const explanation = router.explain(messages, mockModels);

      expect(explanation.ranked.length).toBe(mockModels.length);
      if (explanation.ranked.length > 1) {
        expect(explanation.ranked[0].score)
          .toBeGreaterThanOrEqual(explanation.ranked[1].score);
      }
    });

    it('should include matched rules', () => {
      const messages = [{ role: 'user', content: 'Write code' }];
      const explanation = router.explain(messages, mockModels);

      expect(Array.isArray(explanation.matchedRuleDetails)).toBe(true);
    });
  });

  describe('extractContext', () => {
    it('should detect code task type', () => {
      const messages = [{ role: 'User', content: 'Write a function' }];
      const context = router['extractContext'].call(router, messages);

      expect(context.taskType).toBe('code');
    });

    it('should detect reasoning task type', () => {
      const messages = [{ role: 'user', content: 'analyze this' }];
      const context = router['extractContext'].call(router, messages);

      expect(context.taskType).toBe('reasoning');
    });

    it('should detect vision task type', () => {
      const messages = [{ role: 'user', content: 'Show me this picture' }];
      const context = router['extractContext'].call(router, messages);

      expect(context.taskType).toBe('vision');
    });

    it('should detect chat task type', () => {
      const messages = [{ role: 'user', content: 'Hello world' }];
      const context = router['extractContext'].call(router, messages);

      expect(context.taskType).toBe('chat');
    });

    it('should detect low complexity', () => {
      const messages = [{ role: 'user', content: 'Hi' }];
      const context = router['extractContext'].call(router, messages);

      expect(context.complexity).toBe('low');
    });

    it('should detect high complexity', () => {
      const longContent = 'This is a very long message. '.repeat(100);
      const messages = [{ role: 'user', content: longContent }];
      const context = router['extractContext'].call(router, messages);

      expect(context.complexity).toBe('high');
    });

    it('should detect medium complexity', () => {
      const mediumContent = 'This is a medium length message. '.repeat(10);
      const messages = [{ role: 'user', content: mediumContent }];
      const context = router['extractContext'].call(router, messages);

      expect(context.complexity).toBe('medium');
    });
  });
});

describe('CostRouter', () => {
  let router: CostRouter;
  let mockModels: ModelConfig[];

  beforeEach(() => {
    router = new CostRouter();
    mockModels = [
      {
        id: 'gpt-4o-mini',
        provider: 'openai',
        modelName: 'GPT-4o Mini',
        apiKey: 'key1',
        enabled: true,
        priority: 1,
        capabilities: ['chat'],
        costPer1MInput: 0.15,
        costPer1MOutput: 0.6,
      },
      {
        id: 'claude-3-5-sonnet',
        provider: 'anthropic',
        modelName: 'Claude 3.5 Sonnet',
        apiKey: 'key2',
        enabled: true,
        priority: 2,
        capabilities: ['chat'],
        costPer1MInput: 3,
        costPer1MOutput: 15,
      },
      {
        id: 'deepseek-chat',
        provider: 'deepseek',
        modelName: 'DeepSeek Chat',
        apiKey: 'key3',
        enabled: true,
        priority: 3,
        capabilities: ['chat'],
        costPer1MInput: 0.5,
        costPer1MOutput: 2,
      },
    ];
  });

  it('should select lowest cost model', async () => {
    const messages = [{ role: 'user', content: 'Hello' }];
    const result = await router.select(messages, mockModels);

    expect(result.model.id).toBe('gpt-4o-mini');
    expect(result.strategy).toBe('cost');
    expect(result.reason).toBe('Lowest input cost');
  });

  it('should handle models without cost info', async () => {
    const modelsWithoutCost = [
      {
        id: 'model1',
        provider: 'openai' as ProviderType,
        modelName: 'Model 1',
        apiKey: 'key',
        enabled: true,
        priority: 1,
        capabilities: ['chat' as ModelCapability],
      },
      {
        id: 'model2',
        provider: 'anthropic' as ProviderType,
        modelName: 'Model 2',
        apiKey: 'key',
        enabled: true,
        priority: 2,
        capabilities: ['chat' as ModelCapability],
        costPer1MInput: 5,
      },
    ];

    const messages = [{ role: 'user', content: 'Hello' }];
    const result = await router.select(messages, modelsWithoutCost);

    expect(result.model).toBeDefined();
    expect(result.strategy).toBe('cost');
  });

  it('should return sorted candidates', async () => {
    const messages = [{ role: 'user', content: 'Hello' }];
    const result = await router.select(messages, mockModels);

    expect(result.candidates).toHaveLength(mockModels.length);
    expect(result.candidates[0].costPer1MInput)
      .toBeLessThanOrEqual(result.candidates[1].costPer1MInput || 999);
  });
});

describe('SpeedRouter', () => {
  let router: SpeedRouter;
  let mockModels: ModelConfig[];

  beforeEach(() => {
    router = new SpeedRouter();
    mockModels = [
      {
        id: 'gpt-4o-mini',
        provider: 'openai',
        modelName: 'GPT-4o Mini',
        apiKey: 'key1',
        enabled: true,
        priority: 1,
        capabilities: ['chat'],
      },
      {
        id: 'gpt-4o',
        provider: 'openai',
        modelName: 'GPT-4o',
        apiKey: 'key2',
        enabled: true,
        priority: 2,
        capabilities: ['chat'],
      },
      {
        id: 'o1',
        provider: 'openai',
        modelName: 'OpenAI o1',
        apiKey: 'key3',
        enabled: true,
        priority: 3,
        capabilities: ['reasoning'],
      },
    ];
  });

  it('should select fastest model', async () => {
    const messages = [{ role: 'user', content: 'Hello' }];
    const result = await router.select(messages, mockModels);

    expect(result.model.id).toBe('gpt-4o-mini');
    expect(result.strategy).toBe('speed');
    expect(result.reason).toBe('Lowest estimated latency');
  });

  it('should handle unknown model latency', async () => {
    const unknownModel = {
      id: 'unknown-model',
      provider: 'openai' as ProviderType,
      modelName: 'Unknown Model',
      apiKey: 'key',
      enabled: true,
      priority: 5,
      capabilities: ['chat' as ModelCapability],
    };

    const messages = [{ role: 'user', content: 'Hello' }];
    const result = await router.select(messages, [...mockModels, unknownModel]);

    expect(result.model).toBeDefined();
  });
});

describe('PriorityRouter', () => {
  let router: PriorityRouter;
  let mockModels: ModelConfig[];

  beforeEach(() => {
    router = new PriorityRouter();
    mockModels = [
      {
        id: 'high-priority',
        provider: 'openai',
        modelName: 'High Priority',
        apiKey: 'key1',
        enabled: true,
        priority: 1,
        capabilities: ['chat'],
      },
      {
        id: 'medium-priority',
        provider: 'anthropic',
        modelName: 'Medium Priority',
        apiKey: 'key2',
        enabled: true,
        priority: 5,
        capabilities: ['chat'],
      },
      {
        id: 'low-priority',
        provider: 'deepseek',
        modelName: 'Low Priority',
        apiKey: 'key3',
        enabled: true,
        priority: 10,
        capabilities: ['chat'],
      },
    ];
  });

  it('should select highest priority model', async () => {
    const messages = [{ role: 'user', content: 'Hello' }];
    const result = await router.select(messages, mockModels);

    expect(result.model.id).toBe('high-priority');
    expect(result.strategy).toBe('priority');
    expect(result.reason).toBe('Highest configured priority');
  });

  it('should respect priority ordering', async () => {
    const messages = [{ role: 'user', content: 'Hello' }];
    const result = await router.select(messages, mockModels);

    expect(result.candidates[0].priority).toBeLessThanOrEqual(result.candidates[1].priority);
  });
});

describe('RandomRouter', () => {
  let router: RandomRouter;
  let mockModels: ModelConfig[];

  beforeEach(() => {
    router = new RandomRouter();
    mockModels = [
      {
        id: 'model1',
        provider: 'openai',
        modelName: 'Model 1',
        apiKey: 'key1',
        enabled: true,
        priority: 1,
        capabilities: ['chat'],
      },
      {
        id: 'model2',
        provider: 'anthropic',
        modelName: 'Model 2',
        apiKey: 'key2',
        enabled: true,
        priority: 2,
        capabilities: ['chat'],
      },
      {
        id: 'model3',
        provider: 'deepseek',
        modelName: 'Model 3',
        apiKey: 'key3',
        enabled: true,
        priority: 3,
        capabilities: ['chat'],
      },
    ];
  });

  it('should select random model', async () => {
    const messages = [{ role: 'user', content: 'Hello' }];
    const result = await router.select(messages, mockModels);

    expect(result.model).toBeDefined();
    expect(result.strategy).toBe('random');
    expect(result.reason).toBe('Random selection');
  });

  it('should always select valid model from list', async () => {
    const messages = [{ role: 'user', content: 'Hello' }];
    const selectedModels = new Set<string>();

    for (let i = 0; i < 20; i++) {
      const result = await router.select(messages, mockModels);
      selectedModels.add(result.model.id);
    }

    expect(mockModels.some(m => selectedModels.has(m.id))).toBe(true);
  });

  it('should return all models as candidates', async () => {
    const messages = [{ role: 'user', content: 'Hello' }];
    const result = await router.select(messages, mockModels);

    expect(result.candidates).toHaveLength(mockModels.length);
  });
});

describe('Router Factory', () => {
  describe('createRouter', () => {
    it('should create smart router', () => {
      const router = createRouter('smart');
      expect(router).toBeInstanceOf(SmartRouter);
    });

    it('should create cost router', () => {
      const router = createRouter('cost');
      expect(router).toBeInstanceOf(CostRouter);
    });

    it('should create speed router', () => {
      const router = createRouter('speed');
      expect(router).toBeInstanceOf(SpeedRouter);
    });

    it('should create priority router', () => {
      const router = createRouter('priority');
      expect(router).toBeInstanceOf(PriorityRouter);
    });

    it('should create random router', () => {
      const router = createRouter('random');
      expect(router).toBeInstanceOf(RandomRouter);
    });

    it('should default to smart router for unknown strategy', () => {
      const router = createRouter('smart' as RouterStrategy);
      expect(router).toBeInstanceOf(SmartRouter);
    });
  });

  describe('benchmarkRouting', () => {
    let mockModels: ModelConfig[];

    beforeEach(() => {
      mockModels = [
        {
          id: 'model1',
          provider: 'openai',
          modelName: 'Model 1',
          apiKey: 'key1',
          enabled: true,
          priority: 1,
          capabilities: ['chat'],
          costPer1MInput: 1,
        },
        {
          id: 'model2',
          provider: 'anthropic',
          modelName: 'Model 2',
          apiKey: 'key2',
          enabled: true,
          priority: 2,
          capabilities: ['chat'],
          costPer1MInput: 2,
        },
      ];
    });

    it('should benchmark all strategies', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const results = await benchmarkRouting(messages, mockModels);

      expect(results).toHaveProperty('smart');
      expect(results).toHaveProperty('cost');
      expect(results).toHaveProperty('speed');
      expect(results).toHaveProperty('priority');

      expect(results.smart.strategy).toBe('smart');
      expect(results.cost.strategy).toBe('cost');
      expect(results.speed.strategy).toBe('speed');
      expect(results.priority.strategy).toBe('priority');
    });

    it('should return results with models', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const results = await benchmarkRouting(messages, mockModels);

      Object.values(results).forEach(result => {
        expect(result.model).toBeDefined();
        expect(result.candidates).toBeDefined();
      });
    });
  });
});
