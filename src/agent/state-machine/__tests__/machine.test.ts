/**
 * Agent State Machine Tests - TaskFlow AI v4.0
 */

import type { MachineContext, MachineEvent, AgentState } from '../types';
import type { AgentConfig, TaskPlan, PRDDocument, Requirement } from '../../types';

const baseMeta = { author: 'Agions', createdAt: new Date(), updatedAt: new Date(), version: '1.0', tags: [] };
const basePrd: PRDDocument = { id: 'p1', title: '', description: '', content: '', requirements: [], acceptanceCriteria: [], metadata: baseMeta as any };
const emptyPlan: TaskPlan = { tasks: [], dependencies: [], totalEstimate: 0, criticalPath: [] };

describe('AgentStateMachine', () => {
  it('should export AgentStateMachine class', async () => {
    const mod = await import('../index');
    expect(mod.AgentStateMachine).toBeDefined();
    expect(typeof mod.AgentStateMachine).toBe('function');
  });

  it('should export createAgentMachine', async () => {
    const mod = await import('../machine');
    expect(mod.createAgentMachine).toBeDefined();
    expect(typeof mod.createAgentMachine).toBe('function');
  });

  describe('MachineContext', () => {
    it('should create valid context', () => {
      const ctx: MachineContext = {
        prd: basePrd,
        projectConfig: {} as any,
        availableTools: [],
        constraints: [],
        config: { mode: 'assisted', maxIterations: 10, autoFix: true, approvalRequired: [], continueOnError: false, timeout: 60000 },
      };
      expect(ctx.config.mode).toBe('assisted');
    });

    it('should support optional fields', () => {
      const ctx: MachineContext = {
        prd: basePrd,
        projectConfig: {} as any,
        availableTools: [],
        constraints: [],
        config: {} as AgentConfig,
        requirements: [{ id: 'r1', title: 'Req', description: 'D', priority: 'high', type: 'functional' }],
        currentPlan: emptyPlan,
        retryCount: 2,
        error: new Error('test'),
      };
      expect(ctx.retryCount).toBe(2);
    });
  });

  describe('MachineEvent', () => {
    it('should have correct event types', () => {
      const events: MachineEvent[] = [
        { type: 'START' },
        { type: 'PLAN_COMPLETE', data: emptyPlan },
        { type: 'PLAN_FAILED', error: new Error('Plan failed') },
        { type: 'EXECUTION_COMPLETE', data: {
          results: [], summary: { totalTasks:0, completedTasks:0, failedTasks:0, skippedTasks:0, totalDuration:0 },
          startTime: new Date(), endTime: new Date(),
        }},
        { type: 'EXECUTION_FAILED', error: new Error('Exec failed') },
        { type: 'VERIFICATION_PASS', data: { allPassed: true, checks: [] } },
        { type: 'VERIFICATION_FAIL', data: { allPassed: false, checks: [] } },
        { type: 'APPROVED' },
        { type: 'REJECTED' },
      ];
      expect(events).toHaveLength(9);
    });
  });

  describe('AgentState values', () => {
    it('should include all 7 states', () => {
      const states: AgentState[] = ['idle','planning','executing','verifying','awaitingApproval','completed','failed'];
      expect(states).toHaveLength(7);
    });
  });
});
