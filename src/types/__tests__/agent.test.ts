import {
  AgentStatus,
  AgentCapability,
  AgentConfig,
  AgentRuntime,
  AgentTask,
  AgentState
} from '../agent';

describe('Agent Types', () => {
  describe('AgentStatus', () => {
    it('should have all expected status values', () => {
      const statuses: AgentStatus[] = [
        'idle',
        'thinking',
        'executing',
        'waiting',
        'reflecting',
        'completed',
        'failed'
      ];
      expect(statuses).toContain('idle');
    });
  });

  describe('AgentConfig', () => {
    it('should define required fields', () => {
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

      expect(config.id).toBe('test-agent');
      expect(config.capabilities).toContain('reasoning');
    });
  });

  describe('AgentRuntime', () => {
    it('should define required methods', () => {
      const runtime: AgentRuntime = {
        id: 'test-runtime',
        execute: jest.fn(),
        getState: jest.fn(),
        reset: jest.fn(),
        destroy: jest.fn()
      };

      expect(typeof runtime.execute).toBe('function');
      expect(typeof runtime.getState).toBe('function');
    });
  });
});
