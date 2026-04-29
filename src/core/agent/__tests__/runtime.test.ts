import { AgentRuntime, AgentConfig } from '../../../types/agent';
import { AgentRuntimeImpl } from '../runtime';

describe('Agent Runtime', () => {
  it('should create agent runtime', async () => {
    const config: AgentConfig = {
      id: 'test-agent',
      name: 'Test Agent',
      capabilities: ['reasoning'],
      tools: [],
      memory: {
        maxShortTerm: 10,
        maxLongTerm: 100
      }
    };

    const runtime = new AgentRuntimeImpl(config);
    expect(runtime.id).toBe('test-agent');
    expect(typeof runtime.execute).toBe('function');
    expect(typeof runtime.getState).toBe('function');
  });

  it('should execute task', async () => {
    const config: AgentConfig = {
      id: 'test-agent',
      name: 'Test Agent',
      capabilities: ['reasoning'],
      tools: [],
      memory: {
        maxShortTerm: 10,
        maxLongTerm: 100
      }
    };

    const runtime = new AgentRuntimeImpl(config);
    const task = {
      id: 'task-1',
      description: 'Test task',
      status: 'pending' as const,
      createdAt: Date.now()
    };

    const result = await runtime.execute(task);

    expect(result.success).toBe(true);
    expect(result.taskId).toBe('task-1');
    expect(result.duration).toBeGreaterThan(0);
    expect(result.steps.length).toBe(3);
  });

  it('should get state', async () => {
    const config: AgentConfig = {
      id: 'test-agent',
      name: 'Test Agent',
      capabilities: ['reasoning'],
      tools: [],
      memory: {
        maxShortTerm: 10,
        maxLongTerm: 100
      }
    };

    const runtime = new AgentRuntimeImpl(config);
    const state = runtime.getState();

    expect(state.status).toBe('idle');
    expect(state.metrics.tasksCompleted).toBe(0);
  });

  it('should update config', async () => {
    const config: AgentConfig = {
      id: 'test-agent',
      name: 'Test Agent',
      capabilities: ['reasoning'],
      tools: [],
      memory: {
        maxShortTerm: 10,
        maxLongTerm: 100
      }
    };

    const runtime = new AgentRuntimeImpl(config);
    await runtime.updateConfig({ name: 'Updated Agent' });

    const updatedConfig = runtime.getConfig();
    expect(updatedConfig.name).toBe('Updated Agent');
  });

  it('should reset agent', async () => {
    const config: AgentConfig = {
      id: 'test-agent',
      name: 'Test Agent',
      capabilities: ['reasoning'],
      tools: [],
      memory: {
        maxShortTerm: 10,
        maxLongTerm: 100
      }
    };

    const runtime = new AgentRuntimeImpl(config);
    await runtime.reset();

    const state = runtime.getState();
    expect(state.status).toBe('idle');
    expect(state.currentTask).toBeUndefined();
  });

  it('should support messages', async () => {
    const config: AgentConfig = {
      id: 'test-agent',
      name: 'Test Agent',
      capabilities: ['reasoning'],
      tools: [],
      memory: {
        maxShortTerm: 10,
        maxLongTerm: 100
      }
    };

    const runtime = new AgentRuntimeImpl(config);
    const message = {
      id: 'msg-1',
      role: 'user' as const,
      content: 'Hello',
      timestamp: Date.now()
    };

    runtime.addMessage(message);
    const messages = runtime.getMessages();

    expect(messages.length).toBe(1);
    expect(messages[0].content).toBe('Hello');
  });
});
