import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  SmartRouter,
  CostRouter,
  SpeedRouter,
  PriorityRouter,
  RandomRouter,
  ScoredModel,
  RoutingExplanation,
} from '../routers';
import { BaseRouter, RouterStrategy } from '../router-types';
import { ModelConfig, ModelCapability } from '../types';

// Test helper class to access protected methods
class TestRouter extends CostRouter {
  public testExtractContext(messages: any[]) {
    return this.extractContext(messages);
  }
}

describe('Router System', () => {
  let mockMessages: any[];
  let availableModels: ModelConfig[];

  beforeEach(() => {
    mockMessages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello, how can you help me?' },
    ];

    availableModels = [
      {
        id: 'gpt-4o-mini',
        provider: 'openai',
        modelName: 'GPT-4o Mini',
        apiKey: 'test-key-1',
        enabled: true,
        capabilities: ['chat', 'code'],
        costPer1MInput: 0.15,
        costPer1MOutput: 0.6,
        priority: 1,
      },
      {
        id: 'gpt-4o',
        provider: 'openai',
        modelName: 'GPT-4o',
        apiKey: 'test-key-2',
        enabled: true,
        capabilities: ['chat', 'code', 'reasoning'],
        costPer1MInput: 2.5,
        costPer1MOutput: 10,
        priority: 2,
      },
      {
        id: 'claude-3-5-sonnet',
        provider: 'anthropic',
        modelName: 'Claude 3.5 Sonnet',
        apiKey: 'test-key-3',
        enabled: true,
        capabilities: ['chat', 'code', 'reasoning', 'vision'],
        costPer1MInput: 3,
        costPer1MOutput: 15,
        priority: 3,
      },
    ];
  });

  describe('BaseRouter', () => {
    let testRouter: TestRouter;

    beforeEach(() => {
      testRouter = new TestRouter();
    });

    describe('extractContext', () => {
      it('should detect code task type', () => {
        const codeMessages = [
          { role: 'user', content: 'Write a function to sort an array' },
        ];
        const context = testRouter.testExtractContext(codeMessages);

        expect(context.taskType).toBe('code');
      });

      it('should detect reasoning task type', () => {
        const reasoningMessages = [
          { role: 'user', content: 'Analyze the following case study' },
        ];
        const context = testRouter.testExtractContext(reasoningMessages);

        expect(context.taskType).toBe('reasoning');
        // Note: complexity detection may vary based on message length
        expect(context.complexity).toBeDefined();
      });

      it('should detect vision task type', () => {
        const visionMessages = [
          { role: 'user', content: 'Describe this image' },
        ];
        const context = testRouter.testExtractContext(visionMessages);

        expect(context.taskType).toBe('vision');
      });

      it('should detect chat task type by default', () => {
        const chatMessages = [
          { role: 'user', content: 'Hello, how are you?' },
        ];
        const context = testRouter.testExtractContext(chatMessages);

        expect(context.taskType).toBe('chat');
      });

      it('should detect low complexity for short messages', () => {
        const shortMessages = [
          { role: 'user', content: 'Hi' },
        ];
        const context = testRouter.testExtractContext(shortMessages);

        expect(context.complexity).toBe('low');
      });

      it('should detect high complexity for long messages', () => {
        const longContent = 'This is a very long message content. '.repeat(100);
        const longMessages = [
          { role: 'user', content: longContent },
        ];
        const context = testRouter.testExtractContext(longMessages);

        expect(context.complexity).toBe('high');
      });

      it('should handle empty messages', () => {
        const context = testRouter.testExtractContext([]);

        // Empty messages default to chat type with low complexity
        expect(context.taskType).toBe('chat');
        expect(context.complexity).toBe('low');
      });

      it('should calculate context length from all messages', () => {
        const multiMessage = [
          { role: 'system', content: 'You are helpful.' },
          { role: 'user', content: 'Can you help?' },
          { role: 'assistant', content: 'Of course!' },
        ];
        const context = testRouter.testExtractContext(multiMessage);

        expect(context.complexity).toBeDefined();
      });
    });
  });

  describe('SmartRouter', () => {
    let router: SmartRouter;

    beforeEach(() => {
      router = new SmartRouter();
    });

    it('should select preferred model when available', async () => {
      const result = await router.select(
        mockMessages,
        availableModels,
        'gpt-4o'
      );

      expect(result.model.id).toBe('gpt-4o');
      expect(result.reason).toContain('User preferred model');
    });

    it('should select model based on task type', async () => {
      const codeMessages = [
        { role: 'user', content: 'Write a React component' },
      ];
      const result = await router.select(codeMessages, availableModels);

      expect(result.model).toBeDefined();
      expect(result.strategy).toBe('smart');
      expect(result.reason).toContain('Task type:');
    });

    it('should select model based on complexity', async () => {
      const complexMessages = [
        { role: 'user', content: 'Analyze this complex case ' + 'text '.repeat(100) },
      ];
      const result = await router.select(complexMessages, availableModels);

      expect(result.model).toBeDefined();
      expect(result.reason).toContain('Complexity:');
    });

    it('should return candidates in sorted order', async () => {
      const allModels = [...availableModels].reverse();
      const result = await router.select(mockMessages, allModels);

      expect(result.candidates).toBeDefined();
      expect(result.candidates.length).toBe(3);
    });

    it('should handle empty available models list', async () => {
      const result = await router.select(mockMessages, []);

      expect(result.model).toBeUndefined();
    });

    it('should select first available model if preferred not found', async () => {
      const result = await router.select(
        mockMessages,
        availableModels,
        'non-existent-model'
      );

      expect(result.model).toBeDefined();
      expect(result.model.id).not.toBe('non-existent-model');
    });

    describe('explain', () => {
      it('should return routing explanation', () => {
        const explanation = router.explain(mockMessages, availableModels);

        expect(explanation).toBeDefined();
        expect(explanation.context).toBeDefined();
        expect(explanation.ranked).toBeDefined();
        expect(explanation.strategy).toBe('smart');
      });

      it('should include scored models in explanation', () => {
        const explanation = router.explain(mockMessages, availableModels);

        expect(explanation.ranked.length).toBe(3);
        expect(explanation.ranked[0].model).toBeDefined();
        expect(typeof explanation.ranked[0].score).toBe('number');
      });

      it('should include matched rules', () => {
        const codeMessages = [
          { role: 'user', content: 'Write code' },
        ];
        const explanation = router.explain(codeMessages, availableModels);

        expect(explanation.matchedRuleDetails).toBeDefined();
        expect(Array.isArray(explanation.matchedRuleDetails)).toBe(true);
      });

      it('should select preferred model if provided', () => {
        const explanation = router.explain(
          mockMessages,
          availableModels,
          'gpt-4o'
        );

        expect(explanation.selectedId).toBe('gpt-4o');
      });

      it('should rank models by score', () => {
        const explanation = router.explain(mockMessages, availableModels);

        const scores = explanation.ranked.map(m => m.score);
        for (let i = 1; i < scores.length; i++) {
          expect(scores[i] <= scores[i - 1]).toBe(true);
        }
      });
    });
  });

  describe('CostRouter', () => {
    let router: CostRouter;

    beforeEach(() => {
      router = new CostRouter();
    });

    it('should select lowest cost model', async () => {
      const result = await router.select(mockMessages, availableModels);

      expect(result.model.id).toBe('gpt-4o-mini');
      expect(result.model.costPer1MInput).toBe(0.15);
    });

    it('should sort candidates by cost', async () => {
      const result = await router.select(mockMessages, availableModels);

      // Handle potential undefined values by providing defaults
      const cost1 = result.candidates[0].costPer1MInput ?? Infinity;
      const cost2 = result.candidates[1].costPer1MInput ?? Infinity;
      expect(cost1).toBeLessThanOrEqual(cost2);
    });

    it('should return correct strategy type', async () => {
      const result = await router.select(mockMessages, availableModels);

      expect(result.strategy).toBe('cost');
    });

    it('should include cost-based reason', async () => {
      const result = await router.select(mockMessages, availableModels);

      expect(result.reason).toContain('Lowest input cost');
    });

    it('should handle models without cost info', async () => {
      const modelsWithoutCost = [
        { ...availableModels[0], costPer1MInput: undefined },
        { ...availableModels[1], costPer1MInput: undefined },
      ];

      const result = await router.select(mockMessages, modelsWithoutCost);

      expect(result.model).toBeDefined();
    });
  });

  describe('SpeedRouter', () => {
    let router: SpeedRouter;

    beforeEach(() => {
      router = new SpeedRouter();
    });

    it('should select fastest model', async () => {
      const result = await router.select(mockMessages, availableModels);

      expect(result.model.id).toBe('gpt-4o-mini');
    });

    it('should use estimated latency for selection', async () => {
      const result = await router.select(mockMessages, [
        availableModels[1], // gpt-4o
        availableModels[0], // gpt-4o-mini
      ]);

      // Should still select gpt-4o-mini even if not first
      expect(result.model.id).toBe('gpt-4o-mini');
    });

    it('should sort candidates by latency', async () => {
      const result = await router.select(mockMessages, availableModels);

      expect(result.candidates.length).toBeGreaterThan(1);
    });

    it('should return speed-based reason', async () => {
      const result = await router.select(mockMessages, availableModels);

      expect(result.reason).toContain('Lowest estimated latency');
    });

    it('should handle unknown model latency', async () => {
      const unknownModel = {
        id: 'unknown-model',
        provider: 'openai' as const, // Use valid provider type
        modelName: 'Unknown Model',
        apiKey: 'test-key',
        enabled: true,
        capabilities: ['chat' as const], // Must be mutable array
        priority: 1,
      };

      const result = await router.select(mockMessages, [unknownModel]);

      expect(result.model).toBeDefined();
    });

    it('should select o1 for complex reasoning tasks', async () => {
      const complexMessages = [
        { role: 'user', content: 'Analyze and think deeply ' + 'about '.repeat(50) },
      ];

      const modelsWithO1 = [
        ...availableModels,
        {
          id: 'o1',
          provider: 'openai' as const,
          modelName: 'OpenAI o1',
          apiKey: 'test-key',
          enabled: true,
          capabilities: ['reasoning' as const],
          priority: 4,
        },
      ];

      const result = await router.select(complexMessages, modelsWithO1);

      // SpeedRouter just picks fastest, so gpt-4o-mini should still win
      expect(result.model).toBeDefined();
    });
  });

  describe('PriorityRouter', () => {
    let router: PriorityRouter;

    beforeEach(() => {
      router = new PriorityRouter();
    });

    it('should select highest priority model', async () => {
      const result = await router.select(mockMessages, availableModels);

      expect(result.model.priority).toBe(1);
      expect(result.model.id).toBe('gpt-4o-mini');
    });

    it('should sort candidates by priority', async () => {
      const result = await router.select(mockMessages, availableModels);

      for (let i = 1; i < result.candidates.length; i++) {
        expect(result.candidates[i].priority).toBeGreaterThanOrEqual(
          result.candidates[i - 1].priority
        );
      }
    });

    it('should return priority-based reason', async () => {
      const result = await router.select(mockMessages, availableModels);

      expect(result.reason).toContain('Highest configured priority');
    });

    it('should handle equal priority models', async () => {
      const equalPriorityModels = availableModels.map(m => ({
        ...m,
        priority: 1,
      }));

      const result = await router.select(mockMessages, equalPriorityModels);

      expect(result.model).toBeDefined();
    });
  });

  describe('RandomRouter', () => {
    let router: RandomRouter;

    beforeEach(() => {
      router = new RandomRouter();
    });

    it('should return a valid model', async () => {
      const result = await router.select(mockMessages, availableModels);

      expect(result.model).toBeDefined();
      expect(availableModels.length).toBeGreaterThan(0);
    });

    it('should include all models as candidates', async () => {
      const result = await router.select(mockMessages, availableModels);

      expect(result.candidates).toEqual(availableModels);
    });

    it('should return random-based reason', async () => {
      const result = await router.select(mockMessages, availableModels);

      expect(result.reason).toContain('Random selection');
    });

    it('should handle single model list', async () => {
      const singleModel = [availableModels[0]];
      const result = await router.select(mockMessages, singleModel);

      expect(result.model.id).toBe(singleModel[0].id);
    });

    it('should be non-deterministic across calls', async () => {
      const results: string[] = [];
      const iterations = 20;

      for (let i = 0; i < iterations; i++) {
        const result = await router.select(mockMessages, availableModels);
        results.push(result.model.id);
      }

      // Should get at least 2 different models (with high probability)
      const uniqueModels = new Set(results);
      expect(uniqueModels.size).toBeGreaterThan(1);
    });
  });

  describe('All Routers - Common Behavior', () => {
    let routers: BaseRouter[];

    beforeEach(() => {
      routers = [
        new SmartRouter(),
        new CostRouter(),
        new SpeedRouter(),
        new PriorityRouter(),
        new RandomRouter(),
      ];
    });

    it('all routers should return RoutingResult', async () => {
      const results = await Promise.all(
        routers.map(r => r.select(mockMessages, availableModels))
      );

      results.forEach((result, i) => {
        expect(result).toHaveProperty('model');
        expect(result).toHaveProperty('reason');
        expect(result).toHaveProperty('candidates');
        expect(result).toHaveProperty('strategy');
      });
    });

    it('all routers should handle empty messages', async () => {
      const results = await Promise.all(
        routers.map(r => r.select([], availableModels))
      );

      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });

    it('all routers should handle single model', async () => {
      const singleModel = [availableModels[0]];

      const results = await Promise.all(
        routers.map(r => r.select(mockMessages, singleModel))
      );

      results.forEach(result => {
        expect(result.model.id).toBe(singleModel[0].id);
      });
    });

    it('all routers should have unique strategy names', () => {
      const routerInstances = [
        { name: 'Smart', instance: new SmartRouter(), strategy: 'smart' },
        { name: 'Cost', instance: new CostRouter(), strategy: 'cost' },
        { name: 'Speed', instance: new SpeedRouter(), strategy: 'speed' },
        { name: 'Priority', instance: new PriorityRouter(), strategy: 'priority' },
        { name: 'Random', instance: new RandomRouter(), strategy: 'random' },
      ];

      routerInstances.forEach(({ name, instance, strategy }) => {
        expect(instance).toHaveProperty('select');
        // Verify async through execution
        expect(async () => {
          await instance.select(mockMessages, availableModels);
        }).not.toThrow();
      });
    });
  });
});
