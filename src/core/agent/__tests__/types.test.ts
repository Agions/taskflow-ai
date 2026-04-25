/**
 * Agent Types Tests
 * TaskFlow AI v4.0
 */

import type {
  AgentStatus,
  AgentCapability,
  AgentMemoryConfig,
  AgentConfig,
  GoalParser,
  Goal,
  Subgoal,
  ValidationResult,
  AgentTask,
  TaskResult,
  AgentState,
  AgentMemory,
  AgentMessage,
  AgentMetrics,
  AgentDefinition,
  MemoryItem,
  AgentRuntime,
  AgentStep
} from '../../../types/agent';

describe('Agent Types', () => {
  describe('AgentStatus', () => {
    it('should support all agent statuses', () => {
      const statuses: AgentStatus[] = [
        'idle', 'thinking', 'executing', 'waiting', 
        'reflecting', 'completed', 'failed'
      ];
      
      expect(statuses).toHaveLength(7);
      expect(statuses).toContain('idle');
      expect(statuses).toContain('executing');
      expect(statuses).toContain('completed');
    });

    it('should support idle status for inactive agent', () => {
      const status: AgentStatus = 'idle';
      expect(status).toBe('idle');
    });

    it('should support executing status for active agent', () => {
      const status: AgentStatus = 'executing';
      expect(status).toBe('executing');
    });
  });

  describe('AgentCapability', () => {
    it('should support all agent capabilities', () => {
      const capabilities: AgentCapability[] = [
        'reasoning', 'code', 'search', 'tool_use',
        'collaboration', 'planning', 'verification'
      ];
      
      expect(capabilities).toHaveLength(7);
      expect(capabilities).toContain('reasoning');
      expect(capabilities).toContain('tool_use');
    });

    it('should support single capability', () => {
      const capability: AgentCapability = 'search';
      expect(capability).toBe('search');
    });

    it('should support multiple capabilities', () => {
      const capabilities: AgentCapability[] = ['reasoning', 'code', 'tool_use'];
      expect(capabilities).toHaveLength(3);
    });
  });

  describe('AgentMemoryConfig', () => {
    it('should create complete memory config', () => {
      const config: AgentMemoryConfig = {
        maxShortTerm: 50,
        maxLongTerm: 1000,
        importanceThreshold: 0.7
      };

      expect(config.maxShortTerm).toBe(50);
      expect(config.maxLongTerm).toBe(1000);
      expect(config.importanceThreshold).toBe(0.7);
    });

    it('should create minimal memory config', () => {
      const config: AgentMemoryConfig = {
        maxShortTerm: 20,
        maxLongTerm: 500
      };

      expect(config.maxShortTerm).toBe(20);
      expect(config.importanceThreshold).toBeUndefined();
    });
  });

  describe('AgentConfig', () => {
    it('should create complete agent configuration', () => {
      const config: AgentConfig = {
        id: 'agent-123',
        name: 'Research Agent',
        description: 'An agent for research tasks',
        capabilities: ['reasoning', 'search', 'tool_use'],
        model: 'gpt-4',
        tools: ['web-search', 'file-read', 'calculator'],
        memory: {
          maxShortTerm: 50,
          maxLongTerm: 1000,
          importanceThreshold: 0.7
        },
        reflectionEnabled: true,
        maxStepsPerGoal: 20,
        customSettings: {
          temperature: 0.7,
          maxTokens: 2000
        }
      };

      expect(config.id).toBe('agent-123');
      expect(config.name).toBe('Research Agent');
      expect(config.capabilities).toContain('search');
      expect(config.tools).toContain('web-search');
      expect(config.reflectionEnabled).toBe(true);
    });

    it('should create minimal agent configuration', () => {
      const config: AgentConfig = {
        id: 'agent-456',
        name: 'Simple Agent',
        capabilities: ['reasoning'],
        tools: [],
        memory: {
          maxShortTerm: 20,
          maxLongTerm: 500
        }
      };

      expect(config.id).toBe('agent-456');
      expect(config.description).toBeUndefined();
      expect(config.model).toBeUndefined();
      expect(config.reflectionEnabled).toBeUndefined();
    });
  });

  describe('Goal and Subgoal', () => {
    it('should create goal with subgoals', () => {
      const subgoals: Subgoal[] = [
        {
          id: 'subgoal-1',
          description: 'Analyze requirements',
          type: 'thought'
        },
        {
          id: 'subgoal-2',
          description: 'Write code',
          type: 'action'
        },
        {
          id: 'subgoal-3',
          description: 'Verify implementation',
          type: 'observation'
        }
      ];

      const goal: Goal = {
        id: 'goal-123',
        description: 'Implement feature X',
        priority: 1,
        subgoals
      };

      expect(goal.id).toBe('goal-123');
      expect(goal.priority).toBe(1);
      expect(goal.subgoals).toHaveLength(3);
      expect(goal.subgoals[0].type).toBe('thought');
      expect(goal.subgoals[1].type).toBe('action');
    });

    it('should create goal without subgoals', () => {
      const goal: Goal = {
        id: 'goal-456',
        description: 'Simple task',
        priority: 2,
        subgoals: []
      };

      expect(goal.subgoals).toHaveLength(0);
    });
  });

  describe('ValidationResult', () => {
    it('should create successful validation result', () => {
      const result: ValidationResult = {
        valid: true
      };

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should create failed validation result with errors', () => {
      const result: ValidationResult = {
        valid: false,
        errors: [
          'Goal is too vague',
          'Missing required constraints'
        ]
      };

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('Goal is too vague');
    });
  });

  describe('AgentTask', () => {
    it('should create pending task', () => {
      const task: AgentTask = {
        id: 'task-123',
        description: 'Analyze performance issue',
        status: 'pending',
        goal: 'Improve system performance',
        constraints: ['Stay within budget', 'Keep backwards compatible'],
        createdAt: Date.now()
      };

      expect(task.id).toBe('task-123');
      expect(task.status).toBe('pending');
      expect(task.goal).toBe('Improve system performance');
      expect(task.constraints).toHaveLength(2);
      expect(task.createdAt).toBeDefined();
    });

    it('should create completed task', () => {
      const task: AgentTask = {
        id: 'task-456',
        description: 'Write documentation',
        status: 'completed',
        createdAt: Date.now(),
        finishedAt: Date.now()
      };

      expect(task.status).toBe('completed');
      expect(task.finishedAt).toBeDefined();
    });
  });

  describe('TaskResult', () => {
    it('should create successful task result', () => {
      const steps: AgentStep[] = [
        {
          step: 1,
          type: 'thought',
          content: 'Analyze requirements',
          timestamp: Date.now(),
          duration: 300
        },
        {
          step: 2,
          type: 'action',
          content: 'Write implementation',
          timestamp: Date.now(),
          duration: 900
        }
      ];

      const result: TaskResult = {
        taskId: 'task-123',
        success: true,
        output: 'Analysis complete',
        duration: 1200,
        steps
      };

      expect(result.success).toBe(true);
      expect(result.duration).toBe(1200);
      expect(result.steps).toHaveLength(2);
      expect(result.steps[0].type).toBe('thought');
    });

    it('should create failed task result', () => {
      const result: TaskResult = {
        taskId: 'task-456',
        success: false,
        error: 'Insufficient resources',
        duration: 50,
        steps: []
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient resources');
    });
  });

  describe('AgentState', () => {
    it('should create idle agent state', () => {
      const state: AgentState = {
        status: 'idle',
        messages: [],
        memory: {
          shortTerm: [],
          longTerm: [],
          maxShortTerm: 50,
          maxLongTerm: 1000
        },
        metrics: {
          tasksCompleted: 10,
          tasksFailed: 2,
          totalExecutionTime: 15000,
          averageExecutionTime: 1250
        }
      };

      expect(state.status).toBe('idle');
      expect(state.metrics.tasksCompleted).toBe(10);
      expect(state.metrics.tasksFailed).toBe(2);
      expect(state.metrics.averageExecutionTime).toBe(1250);
    });
  });

  describe('AgentMessage', () => {
    it('should create user message', () => {
      const message: AgentMessage = {
        id: 'msg-123',
        role: 'user',
        content: 'Please help me with this task',
        timestamp: Date.now()
      };

      expect(message.role).toBe('user');
      expect(message.content).toBe('Please help me with this task');
    });

    it('should create assistant message', () => {
      const message: AgentMessage = {
        id: 'msg-456',
        role: 'assistant',
        content: 'I can help with that',
        timestamp: Date.now(),
        metadata: {
          toolCalls: ['web-search']
        }
      };

      expect(message.role).toBe('assistant');
      expect(message.metadata).toBeDefined();
    });
  });

  describe('MemoryItem', () => {
    it('should create memory item', () => {
      const item: MemoryItem = {
        id: 'mem-123',
        type: 'thought',
        content: 'Need to analyze data',
        timestamp: Date.now(),
        importance: 0.8
      };

      expect(item.type).toBe('thought');
      expect(item.importance).toBe(0.8);
    });

    it('should create action memory item', () => {
      const item: MemoryItem = {
        id: 'mem-456',
        type: 'action',
        content: 'Executed web-search tool',
        timestamp: Date.now(),
        importance: 0.9
      };

      expect(item.type).toBe('action');
      expect(item.importance).toBe(0.9);
    });
  });

  describe('AgentMetrics', () => {
    it('should create metrics with all fields', () => {
      const metrics: AgentMetrics = {
        tasksCompleted: 100,
        tasksFailed: 5,
        totalExecutionTime: 150000,
        averageExecutionTime: 1500
      };

      expect(metrics.tasksCompleted).toBe(100);
      expect(metrics.tasksFailed).toBe(5);
      expect(metrics.totalExecutionTime).toBe(150000);
      expect(metrics.averageExecutionTime).toBe(1500);
    });
  });

  describe('AgentDefinition', () => {
    it('should create agent definition', () => {
      const definition: AgentDefinition = {
        type: 'research',
        name: 'Research Agent',
        description: 'Agent for research tasks',
        capabilities: ['reasoning', 'search', 'tool_use'],
        defaultConfig: {
          capabilities: ['reasoning', 'search'],
          tools: ['web-search'],
          memory: {
            maxShortTerm: 50,
            maxLongTerm: 1000
          }
        },
        factory: async (config) => {
          // Factory implementation would go here
          const runtime: AgentRuntime = {
            id: config.id,
            getState: () => {
              const state: AgentState = {
                status: 'idle',
                messages: [],
                memory: {
                  shortTerm: [],
                  longTerm: [],
                  maxShortTerm: config.memory.maxShortTerm,
                  maxLongTerm: config.memory.maxLongTerm
                },
                metrics: {
                  tasksCompleted: 0,
                  tasksFailed: 0,
                  totalExecutionTime: 0,
                  averageExecutionTime: 0
                }
              };
              return state;
            },
            getConfig: () => config,
            execute: async (task) => ({
              taskId: task.id,
              success: true,
              output: 'Task completed',
              duration: 100,
              steps: []
            }),
            updateConfig: async () => {},
            reset: async () => {},
            destroy: async () => {},
            addMessage: () => {},
            getMessages: () => []
          };
          return runtime;
        }
      };

      expect(definition.type).toBe('research');
      expect(definition.capabilities).toContain('search');
      expect(definition.defaultConfig).toBeDefined();
    });
  });
});
