/**
 * 状态机类型测试
 * 测试 src/agent/state-machine/ 下所有导出的类型
 */

import {
  MachineContext,
  MachineEvent,
  AgentState,
} from '../types';

import {
  AgentConfig,
  AgentContext,
  TaskPlan,
  ExecutionResult,
  VerificationResult,
  VerificationCheck,
  PRDDocument,
  Task,
  Tool,
  Requirement,
} from '../../types';

// ─── Helper Factories ──────────────────────────────────────────

function createMockPRD(): PRDDocument {
  return {
    id: 'prd-1',
    title: 'Test PRD',
    description: 'Test Description',
    content: 'Test Content',
    requirements: [],
    acceptanceCriteria: [],
    metadata: {
      author: 'test',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0.0',
      tags: [],
    },
  };
}

function createMockAgentContext(): AgentContext {
  return {
    prd: createMockPRD(),
    projectConfig: {
      version: '1.0.0',
      workspace: '/test',
      environment: 'development',
      models: [],
      cache: {} as any,
      logging: {} as any,
      plugins: {} as any,
      extensions: {} as any,
      security: {} as any,
    },
    availableTools: [],
    constraints: [],
  };
}

function createMockConfig(): AgentConfig {
  return {
    mode: 'autonomous',
    maxIterations: 10,
    autoFix: true,
    approvalRequired: [],
    continueOnError: false,
    timeout: 60000,
  };
}

// ─── AgentState Type ────────────────────────────────────────────

describe('AgentState type', () => {
  it('should accept all valid AgentState values', () => {
    const states: AgentState[] = [
      'idle',
      'planning',
      'executing',
      'verifying',
      'awaitingApproval',
      'completed',
      'failed',
    ];
    expect(states).toHaveLength(7);
  });

  it('should have "idle" as the initial state', () => {
    const initialState: AgentState = 'idle';
    expect(initialState).toBe('idle');
  });

  it('should distinguish between terminal and non-terminal states', () => {
    const terminalStates: AgentState[] = ['completed', 'failed'];
    const nonTerminalStates: AgentState[] = ['idle', 'planning', 'executing', 'verifying', 'awaitingApproval'];
    expect(terminalStates).toHaveLength(2);
    expect(nonTerminalStates).toHaveLength(5);
  });
});

// ─── MachineContext ─────────────────────────────────────────────

describe('MachineContext', () => {
  it('should create a valid MachineContext extending AgentContext', () => {
    const ctx: MachineContext = {
      ...createMockAgentContext(),
      config: createMockConfig(),
    };
    expect(ctx.config.mode).toBe('autonomous');
    expect(ctx.prd.id).toBe('prd-1');
    expect(ctx.availableTools).toEqual([]);
  });

  it('should support optional error field in MachineContext', () => {
    const ctxWithNoError: MachineContext = {
      ...createMockAgentContext(),
      config: createMockConfig(),
    };
    expect(ctxWithNoError.error).toBeUndefined();

    const ctxWithError: MachineContext = {
      ...createMockAgentContext(),
      config: createMockConfig(),
      error: new Error('Something went wrong'),
    };
    expect(ctxWithError.error?.message).toBe('Something went wrong');
  });

  it('should support requirements in MachineContext', () => {
    const requirements: Requirement[] = [
      { id: 'req-1', title: 'Auth', description: 'Authentication', priority: 'high', type: 'functional' },
    ];
    const ctx: MachineContext = {
      ...createMockAgentContext(),
      config: createMockConfig(),
      requirements,
    };
    expect(ctx.requirements).toHaveLength(1);
    expect(ctx.requirements![0].title).toBe('Auth');
  });

  it('should support currentPlan in MachineContext', () => {
    const plan: TaskPlan = {
      tasks: [],
      dependencies: [],
      totalEstimate: 0,
      criticalPath: [],
    };
    const ctx: MachineContext = {
      ...createMockAgentContext(),
      config: createMockConfig(),
      currentPlan: plan,
    };
    expect(ctx.currentPlan).toBeDefined();
    expect(ctx.currentPlan!.totalEstimate).toBe(0);
  });

  it('should support retryCount in MachineContext', () => {
    const ctx: MachineContext = {
      ...createMockAgentContext(),
      config: createMockConfig(),
      retryCount: 2,
    };
    expect(ctx.retryCount).toBe(2);
  });

  it('should create MachineContext with all optional fields populated', () => {
    const ctx: MachineContext = {
      ...createMockAgentContext(),
      config: createMockConfig(),
      error: new Error('test'),
      requirements: [{ id: 'r1', title: 'R1', description: '', priority: 'low', type: 'functional' }],
      currentPlan: { tasks: [], dependencies: [], totalEstimate: 0, criticalPath: [] },
      retryCount: 1,
    };
    expect(ctx.error).toBeInstanceOf(Error);
    expect(ctx.requirements).toHaveLength(1);
    expect(ctx.currentPlan).toBeDefined();
    expect(ctx.retryCount).toBe(1);
  });
});

// ─── MachineEvent ──────────────────────────────────────────────

describe('MachineEvent type', () => {
  it('should create a START event', () => {
    const event: MachineEvent = { type: 'START' };
    expect(event.type).toBe('START');
  });

  it('should create a PLAN_COMPLETE event with TaskPlan data', () => {
    const plan: TaskPlan = {
      tasks: [],
      dependencies: [],
      totalEstimate: 0,
      criticalPath: [],
    };
    const event: MachineEvent = { type: 'PLAN_COMPLETE', data: plan };
    expect(event.type).toBe('PLAN_COMPLETE');
    if (event.type === 'PLAN_COMPLETE') {
      expect(event.data).toBe(plan);
    }
  });

  it('should create a PLAN_FAILED event with Error', () => {
    const error = new Error('Planning failed');
    const event: MachineEvent = { type: 'PLAN_FAILED', error };
    expect(event.type).toBe('PLAN_FAILED');
    if (event.type === 'PLAN_FAILED') {
      expect(event.error.message).toBe('Planning failed');
    }
  });

  it('should create an EXECUTION_COMPLETE event', () => {
    const executionResult: ExecutionResult = {
      results: [],
      summary: { totalTasks: 0, completedTasks: 0, failedTasks: 0, skippedTasks: 0, totalDuration: 0 },
      startTime: new Date(),
      endTime: new Date(),
    };
    const event: MachineEvent = { type: 'EXECUTION_COMPLETE', data: executionResult };
    expect(event.type).toBe('EXECUTION_COMPLETE');
  });

  it('should create an EXECUTION_FAILED event', () => {
    const event: MachineEvent = { type: 'EXECUTION_FAILED', error: new Error('Execution error') };
    expect(event.type).toBe('EXECUTION_FAILED');
  });

  it('should create VERIFICATION_PASS and VERIFICATION_FAIL events', () => {
    const verificationResult: VerificationResult = {
      checks: [{ name: 'test', passed: true, message: 'OK', severity: 'info' }],
      allPassed: true,
    };
    const passEvent: MachineEvent = { type: 'VERIFICATION_PASS', data: verificationResult };
    const failEvent: MachineEvent = {
      type: 'VERIFICATION_FAIL',
      data: { ...verificationResult, allPassed: false },
      fixTasks: { tasks: [], dependencies: [], totalEstimate: 0, criticalPath: [] },
    };
    expect(passEvent.type).toBe('VERIFICATION_PASS');
    expect(failEvent.type).toBe('VERIFICATION_FAIL');
  });

  it('should create APPROVED and REJECTED events', () => {
    const approved: MachineEvent = { type: 'APPROVED' };
    const rejected: MachineEvent = { type: 'REJECTED' };
    expect(approved.type).toBe('APPROVED');
    expect(rejected.type).toBe('REJECTED');
  });

  it('should enumerate all MachineEvent type values', () => {
    const eventTypes = [
      'START',
      'PLAN_COMPLETE',
      'PLAN_FAILED',
      'EXECUTION_COMPLETE',
      'EXECUTION_FAILED',
      'VERIFICATION_PASS',
      'VERIFICATION_FAIL',
      'APPROVED',
      'REJECTED',
    ] as const;
    expect(eventTypes).toHaveLength(9);
  });
});
