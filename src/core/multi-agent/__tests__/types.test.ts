/**
 * Multi-Agent Types Tests
 * TaskFlow AI v4.0
 */

import type {
  CoordinationMode,
  SharingStrategy,
  AgentRole,
  AgentStatus,
  Agent,
  CrewConfig,
  CrewStatus,
  Crew,
  CrewResult,
  AgentMessage,
  Attachment,
  ReasoningStep,
  TaskAssignment,
  CoordinatorEvent,
  StreamEvent,
} from '../types';

describe('Multi-Agent Types', () => {
  describe('CoordinationMode', () => {
    it('should have 3 coordination modes', () => {
      const modes: CoordinationMode[] = ['sequential', 'hierarchical', 'parallel'];
      expect(modes).toHaveLength(3);
    });
  });

  describe('SharingStrategy', () => {
    it('should have 3 sharing strategies', () => {
      const strategies: SharingStrategy[] = ['full', 'minimal', 'contextual'];
      expect(strategies).toHaveLength(3);
    });
  });

  describe('AgentRole', () => {
    it('should create a valid role', () => {
      const role: AgentRole = {
        id: 'role-1',
        name: 'Researcher',
        description: 'Researches topics',
        model: 'gpt-4',
        tools: ['search', 'file_read'],
        instructions: 'You are a researcher',
      };
      expect(role.id).toBe('role-1');
      expect(role.tools).toHaveLength(2);
    });

    it('should support optional fields', () => {
      const role: AgentRole = {
        id: 'role-2',
        name: 'Planner',
        description: 'Plans tasks',
        model: 'claude',
        tools: [],
        instructions: 'Plan everything',
        outputSchema: { type: 'object' },
        priority: 1,
      };
      expect(role.priority).toBe(1);
      expect(role.outputSchema).toBeDefined();
    });
  });

  describe('AgentStatus', () => {
    it('should have 6 statuses', () => {
      const statuses: AgentStatus[] = ['idle', 'thinking', 'executing', 'waiting', 'completed', 'error'];
      expect(statuses).toHaveLength(6);
    });
  });

  describe('Agent', () => {
    it('should create a valid agent', () => {
      const agent: Agent = {
        id: 'agent-1',
        role: {
          id: 'r1', name: 'R', description: 'D', model: 'm',
          tools: [], instructions: 'I',
        },
        status: 'idle',
        messages: [],
        context: {},
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      };
      expect(agent.status).toBe('idle');
      expect(agent.messages).toHaveLength(0);
    });
  });

  describe('CrewConfig', () => {
    it('should create a valid config', () => {
      const config: CrewConfig = {
        roles: [],
        coordination: 'sequential',
      };
      expect(config.coordination).toBe('sequential');
      expect(config.maxIterations).toBeUndefined();
    });

    it('should support all options', () => {
      const config: CrewConfig = {
        roles: [{
          id: 'r1', name: 'R', description: 'D', model: 'm',
          tools: [], instructions: 'I',
        }],
        coordination: 'parallel',
        sharingStrategy: 'full',
        maxIterations: 10,
        verbose: true,
        timeout: 60000,
      };
      expect(config.sharingStrategy).toBe('full');
      expect(config.maxIterations).toBe(10);
    });
  });

  describe('CrewStatus', () => {
    it('should have 6 statuses', () => {
      const statuses: CrewStatus[] = ['created', 'running', 'paused', 'completed', 'failed', 'stopped'];
      expect(statuses).toHaveLength(6);
    });
  });

  describe('Crew', () => {
    it('should create a valid crew', () => {
      const crew: Crew = {
        id: 'crew-1',
        name: 'Dev Team',
        config: { roles: [], coordination: 'sequential' },
        agents: new Map(),
        status: 'created',
        createdAt: Date.now(),
        sharedContext: {},
      };
      expect(crew.agents.size).toBe(0);
      expect(crew.sharedContext).toEqual({});
    });
  });

  describe('AgentMessage', () => {
    it('should create a valid message', () => {
      const msg: AgentMessage = {
        id: 'msg-1',
        role: 'assistant',
        content: 'Analysis complete',
        timestamp: Date.now(),
      };
      expect(msg.role).toBe('assistant');
      expect(msg.agentId).toBeUndefined();
    });

    it('should support attachments and reasoning', () => {
      const msg: AgentMessage = {
        id: 'msg-2',
        role: 'agent',
        agentId: 'agent-1',
        agentName: 'Coder',
        content: 'Code generated',
        timestamp: Date.now(),
        attachments: [{
          type: 'code', content: 'console.log("hi")', name: 'index.ts',
        }],
        reasoning: [{ step: 1, thought: 'Need to write code', action: 'write' }],
      };
      expect(msg.attachments).toHaveLength(1);
      expect(msg.reasoning).toHaveLength(1);
    });
  });

  describe('Attachment', () => {
    it('should support all attachment types', () => {
      const types: Attachment['type'][] = ['text', 'file', 'image', 'code'];
      expect(types).toHaveLength(4);
    });
  });

  describe('TaskAssignment', () => {
    it('should create a valid assignment', () => {
      const task: TaskAssignment = {
        taskId: 't-1',
        taskDescription: 'Build feature',
        status: 'pending',
        dependencies: [],
      };
      expect(task.status).toBe('pending');
      expect(task.assignedAgentId).toBeUndefined();
    });
  });

  describe('CoordinatorEvent', () => {
    it('should create valid events', () => {
      const event: CoordinatorEvent = {
        type: 'task_assigned',
        crewId: 'crew-1',
        data: { taskId: 't-1' },
        timestamp: Date.now(),
      };
      expect(event.type).toBe('task_assigned');
    });

    it('should support all event types', () => {
      const types: CoordinatorEvent['type'][] = [
        'task_assigned', 'task_completed', 'agent_status_changed',
        'context_shared', 'iteration_complete',
      ];
      expect(types).toHaveLength(5);
    });
  });

  describe('StreamEvent', () => {
    it('should create a valid stream event', () => {
      const event: StreamEvent = {
        type: 'message',
        content: 'Processing...',
        timestamp: Date.now(),
      };
      expect(event.type).toBe('message');
    });

    it('should support all event types', () => {
      const types: StreamEvent['type'][] = ['message', 'status', 'error', 'complete'];
      expect(types).toHaveLength(4);
    });
  });
});
