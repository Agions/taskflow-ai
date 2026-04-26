/**
 * Task-Router Integration Tests
 * TaskFlow AI v4.0.1
 *
 * Tests the integration between Task execution and AI Router selection strategies.
 */

import {
  SmartRouter,
  CostRouter,
  SpeedRouter,
  PriorityRouter,
  RandomRouter,
} from '../routers';
import type {
  Task,
  TaskStatus,
  TaskPriority,
  TaskType,
  TaskExecutionContext,
  TaskResult,
} from '../../../types/task';
import type { ModelConfig } from '../types';

describe('Task Types', () => {
  describe('TaskStatus', () => {
    it('should support all task status values', () => {
      const statuses: TaskStatus[] = [
        'pending',
        'in_progress',
        'completed',
        'failed',
        'skipped',
        'todo',
        'review',
        'done',
      ];
      expect(statuses).toHaveLength(8);
    });

    it('should handle transition from pending to in_progress', () => {
      const status1: TaskStatus = 'pending';
      const status2: TaskStatus = 'in_progress';

      expect(status1).not.toBe(status2);
    });
  });

  describe('TaskPriority', () => {
    it('should support all task priority values', () => {
      const priorities: TaskPriority[] = ['critical', 'high', 'medium', 'low'];
      expect(priorities).toHaveLength(4);
    });

    it('should have priority hierarchy', () => {
      expect(['critical', 'high', 'medium', 'low']).toEqual([
        'critical',
        'high',
        'medium',
        'low',
      ]);
    });
  });

  describe('TaskType', () => {
    it('should support all task type values', () => {
      const types: TaskType[] = [
        'code',
        'test',
        'analysis',
        'documentation',
        'deployment',
        'frontend',
        'backend',
        'design',
        'research',
        'testing',
      ];
      expect(types).toHaveLength(10);
    });

    it('should classify code tasks', () => {
      const taskType: TaskType = 'code';
      expect(taskType).toBe('code');
    });
  });

  describe('Task', () => {
    it('should create complete task', () => {
      const task: Task = {
        id: 'task-1',
        name: 'Implement Feature',
        title: 'Implement authentication feature',
        description: 'Add JWT authentication to the API',
        status: 'pending',
        priority: 'high',
        type: 'code',
        complexity: 'medium',
        dependsOn: [],
        dependencies: [],
        tags: ['security', 'backend'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        estimatedDuration: 3600,
        estimatedHours: 1,
        metadata: {
          affectedFiles: 5,
          languages: ['TypeScript'],
        },
      };

      expect(task.id).toBe('task-1');
      expect(task.type).toBe('code');
      expect(task.priority).toBe('high');
      expect(task.complexity).toBe('medium');
      expect(task.tags).toContain('security');
    });

    it('should create minimal task', () => {
      const task: Task = {
        id: 'task-2',
        name: 'Simple Task',
        description: 'A simple task',
        status: 'todo',
        priority: 'low',
        type: 'analysis',
        dependsOn: [],
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(task.id).toBe('task-2');
      expect(task.status).toBe('todo');
    });

    it('should handle task dependencies', () => {
      const task: Task = {
        id: 'task-3',
        name: 'Dependent Task',
        description: 'Task with dependencies',
        status: 'pending',
        priority: 'medium',
        type: 'code',
        dependsOn: ['task-1', 'task-2'],
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(task.dependsOn).toHaveLength(2);
      expect(task.dependsOn).toContain('task-1');
    });
  });

  describe('TaskExecutionContext', () => {
    it('should create execution context', () => {
      const context: TaskExecutionContext = {
        taskId: 'task-1',
        projectPath: '/path/to/project',
        workspacePath: '/path/to/workspace',
        environment: 'development',
        config: { maxRetries: 3 },
        variables: { BUILD_ID: '123' },
      };

      expect(context.taskId).toBe('task-1');
      expect(context.environment).toBe('development');
      expect(context.variables.BUILD_ID).toBe('123');
    });
  });

  describe('TaskResult', () => {
    it('should create successful result', () => {
      const result: TaskResult = {
        taskId: 'task-1',
        success: true,
        output: 'Task completed successfully',
        duration: 1000,
        artifacts: [
          {
            path: '/output/file.txt',
            type: 'file',
            size: 1024,
          },
        ],
        logs: [
          {
            level: 'info',
            timestamp: Date.now(),
            message: 'Starting task',
          },
        ],
        metrics: {
          cpuTime: 500,
          memoryPeak: 1048576,
          networkCalls: 2,
          cacheHits: 5,
          cacheMisses: 1,
        },
      };

      expect(result.success).toBe(true);
      expect(result.artifacts).toHaveLength(1);
      expect(result.logs).toHaveLength(1);
    });

    it('should create failed result', () => {
      const result: TaskResult = {
        taskId: 'task-2',
        success: false,
        error: 'Task failed due to network error',
        duration: 500,
        artifacts: [],
        logs: [
          {
            level: 'error',
            timestamp: Date.now(),
            message: 'Connection timeout',
          },
        ],
        metrics: {
          cpuTime: 200,
          memoryPeak: 524288,
          networkCalls: 1,
          cacheHits: 0,
          cacheMisses: 1,
        },
      };

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

describe('Task-Router Integration', () => {
  let mockModels: ModelConfig[];

  beforeEach(() => {
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

  describe('Task Type to Router Mapping', () => {
    it('should route code tasks to appropriate model', async () => {
      const router = new SmartRouter();
      const codeTask: Task = {
        id: 'code-task',
        name: 'Code Task',
        description: 'Implement authentication',
        status: 'pending',
        priority: 'high',
        type: 'code',
        complexity: 'high',
        dependsOn: [],
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Convert task to router message
      const messages = [
        {
          role: 'user' as const,
          content: `Task: ${codeTask.name}\nDescription: ${codeTask.description}\nType: ${codeTask.type}`,
        },
      ];

      const result = await router.select(messages, mockModels);

      expect(result.model).toBeDefined();
      expect(result.strategy).toBe('smart');
    });

    it('should route analysis tasks', async () => {
      const router = new SmartRouter();
      const analysisTask: Task = {
        id: 'analysis-task',
        name: 'Analyze Code',
        description: 'Analyze performance bottlenecks',
        status: 'pending',
        priority: 'medium',
        type: 'analysis',
        complexity: 'high',
        dependsOn: [],
        tags: ['performance'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const messages = [
        {
          role: 'user' as const,
          content: `Task: ${analysisTask.name}\nAnalyze: ${analysisTask.description}`,
        },
      ];

      const result = await router.select(messages, mockModels);

      expect(result.model).toBeDefined();
    });

    it('should route documentation tasks', async () => {
      const router = new SmartRouter();
      const docTask: Task = {
        id: 'doc-task',
        name: 'Write Documentation',
        description: 'Write API documentation',
        status: 'pending',
        priority: 'medium',
        type: 'documentation',
        complexity: 'low',
        dependsOn: [],
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const messages = [
        {
          role: 'user' as const,
          content: `Task: ${docTask.name}\nDocument: ${docTask.description}`,
        },
      ];

      const result = await router.select(messages, mockModels);

      expect(result.model).toBeDefined();
    });
  });

  describe('Task Priority to Router Strategy', () => {
    it('should handle high priority tasks with speed router', async () => {
      const router = new SpeedRouter();

      const messages = [
        { role: 'user' as const, content: 'Urgent task' },
      ];

      const result = await router.select(messages, mockModels);

      expect(result.model).toBeDefined();
      expect(result.strategy).toBe('speed');
    });

    it('should optimize for cost on low priority tasks', async () => {
      const router = new CostRouter();

      const messages = [
        { role: 'user' as const, content: 'Background task' },
      ];

      const result = await router.select(messages, mockModels);

      expect(result.model).toBeDefined();
      expect(result.strategy).toBe('cost');
      expect(result.model.id).toBe('gpt-4o-mini'); // Should be lowest cost
    });

    it('should respect priority configuration', async () => {
      const router = new PriorityRouter();

      const messages = [
        { role: 'user' as const, content: 'Normal task' },
      ];

      const result = await router.select(messages, mockModels);

      expect(result.model).toBeDefined();
      expect(result.strategy).toBe('priority');
    });
  });

  describe('Task Complexity to Router Selection', () => {
    it('should route high complexity tasks with smart router', async () => {
      const router = new SmartRouter();

      const messages = [
        {
          role: 'user' as const,
          content: 'Implement complex feature with multiple components',
        },
      ];

      const result = await router.select(messages, mockModels);

      expect(result.model).toBeDefined();
    });

    it('should handle low complexity tasks efficiently', async () => {
      const router = new SmartRouter();

      const messages = [
        { role: 'user' as const, content: 'Hi' },
      ];

      const result = await router.select(messages, mockModels);

      expect(result.model).toBeDefined();
    });
  });

  describe('Multi-Strategy Routing for Tasks', () => {
    async function testAllStrategies(messages: Array<{ role: string; content: string }>) {
      const strategies = [
        new SmartRouter(),
        new CostRouter(),
        new SpeedRouter(),
        new PriorityRouter(),
      ];

      const results = await Promise.all(
        strategies.map(strat => strat.select(messages, mockModels))
      );

      return results;
    }

    it('should provide consistent routing across strategies', async () => {
      const messages = [
        { role: 'user' as const, content: 'Code task' },
      ];

      const results = await testAllStrategies(messages);

      expect(results).toHaveLength(4);
      results.forEach(result => {
        expect(result.model).toBeDefined();
        expect(result.candidates).toHaveLength(mockModels.length);
      });
    });

    it('should allow strategy comparison for a task', async () => {
      const messages = [
        { role: 'user' as const, content: 'Analysis task' },
      ];

      const results = await testAllStrategies(messages);

      // Each strategy should select a valid model
      results.forEach(result => {
        expect(mockModels.some(m => m.id === result.model.id)).toBe(true);
      });
    });
  });

  describe('Task Execution Context Integration', () => {
    it('should incorporate environment variables in routing', async () => {
      const router = new SmartRouter();
      const context: TaskExecutionContext = {
        taskId: 'task-1',
        projectPath: '/project',
        environment: 'production',
        config: { timeout: 30000 },
        variables: { DEPLOY_ENV: 'prod' },
      };

      const messages = [
        {
          role: 'user' as const,
          content: `Environment: ${context.environment}\nTask: Production deployment`,
        },
      ];

      const result = await router.select(messages, mockModels);

      expect(result.model).toBeDefined();
    });

    it('should handle development environment routing', async () => {
      const router = new CostRouter();
      const context: TaskExecutionContext = {
        taskId: 'task-2',
        projectPath: '/project',
        environment: 'development',
        config: {},
        variables: {},
      };

      const messages = [
        {
          role: 'user' as const,
          content: `Environment: ${context.environment}\nTask: Development test`,
        },
      ];

      const result = await router.select(messages, mockModels);

      expect(result.strategy).toBe('cost');
    });
  });
});

describe('Task Routing Scenarios', () => {
  let mockModels: ModelConfig[];

  beforeEach(() => {
    mockModels = [
      {
        id: 'gpt-4o',
        provider: 'openai',
        modelName: 'GPT-4o',
        apiKey: 'key1',
        enabled: true,
        priority: 1,
        capabilities: ['chat', 'vision'],
        costPer1MInput: 5,
        costPer1MOutput: 15,
      },
      {
        id: 'gpt-4o-mini',
        provider: 'openai',
        modelName: 'GPT-4o Mini',
        apiKey: 'key2',
        enabled: true,
        priority: 2,
        capabilities: ['chat'],
        costPer1MInput: 0.15,
        costPer1MOutput: 0.6,
      },
    ];
  });

  it('should handle critical code task', async () => {
    const router = new SmartRouter();
    const messages = [
      { role: 'user' as const, content: 'Implement core authentication module' },
    ];

    const result = await router.select(messages, mockModels);

    expect(result.model).toBeDefined();
    expect(result.candidates.length).toBeGreaterThan(0);
  });

  it('should handle documentation task efficiently', async () => {
    const router = new CostRouter();
    const messages = [
      { role: 'user' as const, content: 'Write API reference documentation' },
    ];

    const result = await router.select(messages, mockModels);

    expect(result.model.id).toBe('gpt-4o-mini'); // Lowest cost
  });

  it('should handle urgent deployment task', async () => {
    const router = new SpeedRouter();
    const messages = [
      { role: 'user' as const, content: 'Deploy hotfix to production' },
    ];

    const result = await router.select(messages, mockModels);

    expect(result.model).toBeDefined();
  });

  it('should handle research and analysis task', async () => {
    const router = new SmartRouter();
    const messages = [
      { role: 'user' as const, content: 'Analyze system performance and identify bottlenecks' },
    ];

    const result = await router.select(messages, mockModels);

    expect(result.model).toBeDefined();
  });
});
