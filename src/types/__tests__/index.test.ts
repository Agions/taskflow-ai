import { AgentStatus, AgentCapability } from '../index';

describe('Unified Types Index', () => {
  it('should export AgentStatus type', () => {
    const status: AgentStatus = 'idle';
    expect(status).toBe('idle');
  });

  it('should export AgentCapability type', () => {
    const capability: AgentCapability = 'reasoning';
    expect(capability).toBe('reasoning');
  });
});
