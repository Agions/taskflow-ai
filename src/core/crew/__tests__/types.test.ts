/**
 * Crew Types Tests
 * TaskFlow AI v4.0
 */

import type {
  AgentSpecialty,
  CrewAgentConfig,
  StageInput,
  OutputSchema,
  StageStatus,
  Stage,
  WorkflowStatus,
  WorkflowHistoryEntry,
  Workflow,
  PRDDocument,
  TaskPlan,
  CodeArtifact,
  ReviewResult,
  SharedContext,
  StageExecutionResult,
  WorkflowExecutionResult,
  CrewCreateOptions,
  WorkflowTemplate,
} from '../types';

import { WORKFLOW_TEMPLATES } from '../types';

describe('Crew Types', () => {
  describe('AgentSpecialty', () => {
    const specialties: AgentSpecialty[] = [
      'researcher', 'planner', 'coder', 'reviewer', 'documenter',
    ];

    it('should have exactly 5 specialties', () => {
      expect(specialties).toHaveLength(5);
    });

    it.each(specialties)('should accept valid specialty: %s', (s) => {
      expect(typeof s).toBe('string');
    });
  });

  describe('CrewAgentConfig', () => {
    it('should create a valid agent config', () => {
      const config: CrewAgentConfig = {
        id: 'agent-1',
        name: 'Research Agent',
        specialty: 'researcher',
        tools: ['file_read', 'search'],
        capabilities: ['reasoning'],
      };
      expect(config.id).toBe('agent-1');
      expect(config.specialty).toBe('researcher');
      expect(config.tools).toHaveLength(2);
    });

    it('should support optional fields', () => {
      const config: CrewAgentConfig = {
        id: 'agent-2',
        name: 'Code Agent',
        specialty: 'coder',
        description: 'Writes code',
        model: 'gpt-4',
        tools: ['file_write'],
        capabilities: ['code', 'tool_use'],
        maxSteps: 10,
        reflectionEnabled: true,
      };
      expect(config.model).toBe('gpt-4');
      expect(config.maxSteps).toBe(10);
      expect(config.reflectionEnabled).toBe(true);
    });
  });

  describe('StageInput', () => {
    it('should create template input', () => {
      const input: StageInput = { template: 'Analyze this: {{content}}' };
      expect(input.template).toBeDefined();
    });

    it('should create context input with default', () => {
      const input: StageInput = {
        fromContext: 'prd.raw',
        defaultValue: '',
      };
      expect(input.fromContext).toBe('prd.raw');
    });
  });

  describe('OutputSchema', () => {
    it('should create a valid schema', () => {
      const schema: OutputSchema = {
        fields: [
          { name: 'title', type: 'string', required: true },
          { name: 'items', type: 'array', description: 'List of items' },
        ],
        example: { title: 'Test', items: [] },
      };
      expect(schema.fields).toHaveLength(2);
      expect(schema.fields[0].required).toBe(true);
    });
  });

  describe('StageStatus', () => {
    it('should cover all statuses', () => {
      const statuses: StageStatus[] = ['pending', 'running', 'completed', 'failed', 'skipped'];
      expect(statuses).toHaveLength(5);
    });
  });

  describe('Stage', () => {
    it('should create a valid stage', () => {
      const stage: Stage = {
        id: 'stage-1',
        name: 'Parse PRD',
        agent: {
          id: 'a1', name: 'Researcher', specialty: 'researcher',
          tools: ['file_read'], capabilities: ['reasoning'],
        },
        input: { fromContext: 'prd' },
      };
      expect(stage.id).toBe('stage-1');
      expect(stage.required).toBeUndefined();
    });

    it('should support conditional stages', () => {
      const stage: Stage = {
        id: 'stage-2',
        name: 'Review',
        agent: {
          id: 'a2', name: 'Reviewer', specialty: 'reviewer',
          tools: ['file_read'], capabilities: ['reasoning'],
        },
        input: {},
        required: false,
        onSuccess: 'stage-3',
        onFailure: 'stage-fallback',
        condition: 'reviewEnabled',
        timeout: 60000,
      };
      expect(stage.required).toBe(false);
      expect(stage.onSuccess).toBe('stage-3');
      expect(stage.condition).toBe('reviewEnabled');
    });
  });

  describe('WorkflowStatus', () => {
    it('should cover all statuses', () => {
      const statuses: WorkflowStatus[] = ['created', 'running', 'completed', 'failed', 'cancelled'];
      expect(statuses).toHaveLength(5);
    });
  });

  describe('Workflow', () => {
    it('should create a valid workflow', () => {
      const wf: Workflow = {
        id: 'wf-1',
        name: 'PRD to Code',
        description: 'Convert PRD to working code',
        stages: [],
        entryStage: 'stage-1',
        metadata: { author: 'test' },
      };
      expect(wf.entryStage).toBe('stage-1');
      expect(wf.metadata).toEqual({ author: 'test' });
    });
  });

  describe('PRDDocument', () => {
    it('should create a valid PRD document', () => {
      const prd: PRDDocument = {
        title: 'Test PRD',
        overview: 'A test document',
        requirements: ['Req 1', 'Req 2'],
        constraints: ['Must be fast'],
        acceptanceCriteria: ['Passes all tests'],
        raw: '# Test PRD\nContent here',
      };
      expect(prd.requirements).toHaveLength(2);
      expect(prd.raw).toContain('Test PRD');
    });
  });

  describe('SharedContext', () => {
    it('should create context with custom data', () => {
      const ctx: SharedContext = {
        prd: { requirements: [], raw: '' },
        customData: { key: 'value' },
      };
      expect(ctx.prd).toBeDefined();
      expect(ctx.customData).toEqual({ key: 'value' });
    });
  });

  describe('WorkflowExecutionResult', () => {
    it('should create a valid result', () => {
      const result: WorkflowExecutionResult = {
        workflowId: 'wf-1',
        workflowName: 'Test',
        status: 'completed',
        context: {},
        stageResults: [],
        startTime: Date.now(),
        endTime: Date.now(),
        duration: 5000,
      };
      expect(result.status).toBe('completed');
      expect(result.duration).toBe(5000);
    });
  });

  describe('WORKFLOW_TEMPLATES', () => {
    it('should export built-in templates', () => {
      expect(WORKFLOW_TEMPLATES).toBeDefined();
      expect(Array.isArray(WORKFLOW_TEMPLATES)).toBe(true);
      expect(WORKFLOW_TEMPLATES.length).toBeGreaterThan(0);
    });

    it('should have prd-to-code template', () => {
      const tpl = WORKFLOW_TEMPLATES.find(t => t.name === 'prd-to-code');
      expect(tpl).toBeDefined();
      expect(tpl!.category).toBe('prd-to-code');
      expect(tpl!.stages.length).toBeGreaterThan(0);
    });

    it('should have code-review template', () => {
      const tpl = WORKFLOW_TEMPLATES.find(t => t.name === 'code-review');
      expect(tpl).toBeDefined();
      expect(tpl!.category).toBe('code-review');
    });

    it('each template should have valid entryStage', () => {
      for (const tpl of WORKFLOW_TEMPLATES) {
        expect(tpl.entryStage ?? tpl.stages[0]?.id).toBeDefined();
      }
    });
  });
});
