/**
 * Agent Types Comprehensive Tests - TaskFlow AI v4.0
 * All types match actual source definitions exactly.
 */

import type { AgentConfig, AgentStatus, AgentState, AgentContext, AgentSession } from '../agent';
import type { PRDDocument, PRDSection, Requirement, PRDMetadata, RequirementAnalysis, Feature, Risk } from '../prd';
import type { Task, TaskType, TaskStatus, TaskPriority, TaskMetadata, TaskPlan, Dependency } from '../task';
import type { Tool, ToolHandler, ToolResult } from '../tool';
import type { ActionHistory, ActionType } from '../history';
import type { VerificationResult, VerificationCheck, CodeQualityReport, CodeIssue, CodeMetrics } from '../verification';
import type { ExecutionContext, TaskResult, ExecutionResult, ExecutionSummary } from '../execution';

// ============================================================
// Agent Core
// ============================================================
describe('Agent Types', () => {
  describe('AgentConfig', () => {
    it('should create valid config', () => {
      const config: AgentConfig = {
        mode: 'assisted',
        maxIterations: 10,
        autoFix: true,
        approvalRequired: ['deploy'],
        continueOnError: false,
        timeout: 60000,
      };
      expect(config.mode).toBe('assisted');
      expect(config.maxIterations).toBe(10);
    });

    it('should support all 3 modes', () => {
      const modes: AgentConfig['mode'][] = ['assisted', 'autonomous', 'supervised'];
      expect(modes).toHaveLength(3);
    });

    it('should support optional maxRetries', () => {
      const config: AgentConfig = {
        mode: 'autonomous', maxIterations: 20, autoFix: false,
        approvalRequired: [], continueOnError: true, timeout: 30000, maxRetries: 5,
      };
      expect(config.maxRetries).toBe(5);
    });
  });

  describe('AgentStatus', () => {
    it('should cover all 7 statuses', () => {
      const s: AgentStatus[] = ['idle','planning','executing','verifying','awaitingApproval','completed','failed'];
      expect(s).toHaveLength(7);
    });
  });

  describe('AgentState', () => {
    it('should create valid state', () => {
      const state: AgentState = {
        status: 'idle', currentTask: null, iteration: 0,
        context: {} as AgentContext, history: [], startTime: new Date(),
      };
      expect(state.status).toBe('idle');
      expect(state.history).toHaveLength(0);
    });

    it('should support optional fields', () => {
      const state: AgentState = {
        status: 'failed', currentTask: null, iteration: 3,
        context: {} as AgentContext, history: [],
        startTime: new Date(), endTime: new Date(), error: new Error('boom'),
      };
      expect(state.error?.message).toBe('boom');
    });
  });

  describe('AgentContext', () => {
    it('should create valid context', () => {
      const ctx: AgentContext = {
        prd: { id: 'p1', title: 'Test', description: 'desc', content: 'c', requirements: [], acceptanceCriteria: [], metadata: { author: 'Agions', createdAt: new Date(), updatedAt: new Date(), version: '1.0', tags: [] } } as PRDDocument,
        projectConfig: {} as any,
        availableTools: [],
        constraints: ['no-delete'],
      };
      expect(ctx.constraints).toHaveLength(1);
    });

    it('should support optional result fields', () => {
      const ctx: AgentContext = {
        prd: {} as PRDDocument, projectConfig: {} as any, availableTools: [], constraints: [],
        taskPlan: { tasks: [], dependencies: [], totalEstimate: 0, criticalPath: [] },
        executionResult: { results: [], summary: { totalTasks:0, completedTasks:0, failedTasks:0, skippedTasks:0, totalDuration:0 }, startTime: new Date(), endTime: new Date() },
        verificationResult: { allPassed: true, checks: [] },
      };
      expect(ctx.taskPlan).toBeDefined();
      expect(ctx.executionResult).toBeDefined();
      expect(ctx.verificationResult).toBeDefined();
    });
  });

  describe('AgentSession', () => {
    it('should create valid session', () => {
      const session: AgentSession = {
        id: 's-1', state: {} as AgentState, config: {} as AgentConfig,
        createdAt: new Date(), updatedAt: new Date(),
      };
      expect(session.id).toBe('s-1');
    });
  });
});

// ============================================================
// PRD Types
// ============================================================
describe('PRD Types', () => {
  const baseMeta: PRDMetadata = { author: 'Agions', createdAt: new Date(), updatedAt: new Date(), version: '1.0', tags: [] };

  describe('PRDDocument', () => {
    it('should create valid document', () => {
      const doc: PRDDocument = {
        id: 'prd-1', title: 'Test PRD', description: 'A test', content: 'raw content',
        requirements: [], acceptanceCriteria: ['AC1'], metadata: baseMeta,
      };
      expect(doc.id).toBe('prd-1');
      expect(doc.acceptanceCriteria).toHaveLength(1);
    });

    it('should support optional fields', () => {
      const doc: PRDDocument = {
        id: 'prd-2', title: 'Test', description: '', content: '',
        requirements: [], acceptanceCriteria: [], metadata: baseMeta,
        version: '2.0', filePath: '/docs/prd.md',
        sections: [{ title: 'Overview', content: 'text', order: 1, level: 'h2' }],
        createdAt: new Date(), updatedAt: new Date(),
      };
      expect(doc.sections).toHaveLength(1);
    });
  });

  describe('Requirement', () => {
    it('should create with type field', () => {
      const req: Requirement = { id: 'r1', title: 'Login', description: 'User auth', priority: 'high', type: 'functional' };
      expect(req.type).toBe('functional');
    });

    it('should cover all priorities and types', () => {
      const p: Requirement['priority'][] = ['high', 'medium', 'low'];
      const t: Requirement['type'][] = ['functional', 'non-functional'];
      expect(p).toHaveLength(3);
      expect(t).toHaveLength(2);
    });
  });

  describe('Feature', () => {
    it('should create valid feature', () => {
      const f: Feature = { name: 'Auth', description: 'Auth system', complexity: 'high', priority: 'critical', dependencies: ['r1'] };
      expect(f.complexity).toBe('high');
    });
  });

  describe('Risk', () => {
    it('should create valid risk', () => {
      const r: Risk = { description: 'Security', probability: 'medium', impact: 'high', mitigation: 'Tokens' };
      expect(r.probability).toBe('medium');
    });
  });
});

// ============================================================
// Task Types
// ============================================================
describe('Task Types', () => {
  describe('Task', () => {
    it('should create valid task with all required fields', () => {
      const task: Task = {
        id: 'task-1', title: 'Build API', description: 'Create REST',
        type: 'code', status: 'pending', priority: 'high',
        estimate: 4, dependencies: [], metadata: { tags: [] },
        createdAt: new Date(), updatedAt: new Date(),
      };
      expect(task.estimate).toBe(4);
      expect(task.metadata.tags).toHaveLength(0);
    });

    it('should support optional fields', () => {
      const task: Task = {
        id: 't2', title: 'Test', description: 'Write tests',
        type: 'test', status: 'in-progress', priority: 'medium',
        estimate: 2, dependencies: ['task-1'], metadata: { tags: ['unit'], framework: 'jest' },
        createdAt: new Date(), updatedAt: new Date(),
        assignee: 'agent-1', outputPath: 'src/test.ts',
      };
      expect(task.assignee).toBe('agent-1');
      expect(task.metadata.framework).toBe('jest');
    });
  });

  describe('TaskPlan', () => {
    it('should require totalEstimate and criticalPath', () => {
      const plan: TaskPlan = {
        tasks: [], dependencies: [], totalEstimate: 10, criticalPath: ['t1', 't2'],
      };
      expect(plan.totalEstimate).toBe(10);
      expect(plan.criticalPath).toHaveLength(2);
    });
  });

  describe('Dependency', () => {
    it('should use from/to/type', () => {
      const dep: Dependency = { from: 't1', to: 't2', type: 'blocks' };
      expect(dep.from).toBe('t1');
    });

    it('should support depends-on type', () => {
      const dep: Dependency = { from: 't2', to: 't1', type: 'depends-on' };
      expect(dep.type).toBe('depends-on');
    });
  });

  describe('Type unions', () => {
    it('TaskType has 6 values', () => {
      const t: TaskType[] = ['code','file','shell','analysis','design','test'];
      expect(t).toHaveLength(6);
    });
    it('TaskStatus has 5 values', () => {
      const s: TaskStatus[] = ['pending','in-progress','completed','failed','blocked'];
      expect(s).toHaveLength(5);
    });
    it('TaskPriority has 4 values', () => {
      const p: TaskPriority[] = ['critical','high','medium','low'];
      expect(p).toHaveLength(4);
    });
  });
});

// ============================================================
// Tool Types
// ============================================================
describe('Tool Types', () => {
  it('should create tool with handler', () => {
    const tool: Tool = {
      name: 'file_read', description: 'Read', parameters: { type: 'object' },
      handler: async () => ({ success: true }),
    };
    expect(tool.name).toBe('file_read');
  });

  it('should create tool results', () => {
    const ok: ToolResult = { success: true, data: 'content' };
    const err: ToolResult = { success: false, error: 'Not found' };
    expect(ok.success).toBe(true);
    expect(err.error).toBe('Not found');
  });
});

// ============================================================
// History Types
// ============================================================
describe('History Types', () => {
  it('should create action history', () => {
    const h: ActionHistory = { id: 'h1', type: 'execute', timestamp: new Date(), data: {}, result: 'success', message: 'done' };
    expect(h.type).toBe('execute');
    expect(h.result).toBe('success');
  });

  it('should cover all ActionTypes', () => {
    const types: ActionType[] = ['plan','execute','verify','fix','approve','reject'];
    expect(types).toHaveLength(6);
  });
});

// ============================================================
// Verification Types
// ============================================================
describe('Verification Types', () => {
  it('VerificationResult uses allPassed', () => {
    const r: VerificationResult = { allPassed: true, checks: [] };
    expect(r.allPassed).toBe(true);
  });

  it('VerificationCheck has severity', () => {
    const c: VerificationCheck = { name: 'type-check', passed: true, message: 'OK', severity: 'info' };
    expect(c.severity).toBe('info');
  });

  it('CodeIssue has rule field', () => {
    const i: CodeIssue = { file: 'a.ts', line: 1, message: 'err', severity: 'error', rule: 'no-any' };
    expect(i.rule).toBe('no-any');
  });

  it('CodeMetrics has maintainability', () => {
    const m: CodeMetrics = { linesOfCode: 100, complexity: 5, maintainability: 80 };
    expect(m.maintainability).toBe(80);
  });
});

// ============================================================
// Execution Types
// ============================================================
describe('Execution Types', () => {
  it('ExecutionContext uses projectPath', () => {
    const ctx: ExecutionContext = { projectPath: '/proj', config: {} };
    expect(ctx.projectPath).toBe('/proj');
  });

  it('TaskResult has duration', () => {
    const r: TaskResult = { taskId: 't1', success: true, duration: 500 };
    expect(r.duration).toBe(500);
  });

  it('ExecutionResult requires results and summary', () => {
    const r: ExecutionResult = {
      results: [], summary: { totalTasks:0, completedTasks:0, failedTasks:0, skippedTasks:0, totalDuration:0 },
      startTime: new Date(), endTime: new Date(),
    };
    expect(r.results).toHaveLength(0);
  });

  it('ExecutionSummary has skippedTasks', () => {
    const s: ExecutionSummary = { totalTasks:10, completedTasks:8, failedTasks:1, skippedTasks:1, totalDuration:60000 };
    expect(s.skippedTasks).toBe(1);
  });
});
