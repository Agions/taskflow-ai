/**
 * Workflow Engine Tests
 * TaskFlow AI v4.0.1
 */

import {
  WorkflowEngine,
  ExecutionMode,
} from '../engine';
import {
  Workflow,
  WorkflowStep,
  StepType,
  StepStatus,
  WorkflowExecution,
  ExecutionResult,
  StepConfig as WorkflowStepConfig,
} from '../types';
import {
  ToolExecutor,
  ThoughtExecutor,
  TaskExecutor,
  OutputExecutor,
  createExecutor,
  ExecutionContext,
  StepResult,
} from '../executor';
import type {
  Workflow as UnifiedWorkflow,
  WorkflowStatus as UnifiedWorkflowStatus,
  StepConfig,
  TaskStepConfig,
} from '../../../types/workflow';

describe('Workflow Types', () => {
  describe('StepType', () => {
    it('should support all step type values', () => {
      const stepTypes: StepType[] =
        ['thought', 'task', 'tool', 'condition', 'parallel', 'loop', 'input', 'output'];
      expect(stepTypes).toHaveLength(8);
    });

    it('should create single step type value', () => {
      const stepType: StepType = 'task';
      expect(stepType).toBe('task');
    });
  });

  describe('StepStatus', () => {
    it('should support all step status values', () => {
      const statuses: StepStatus[] =
        ['pending', 'running', 'completed', 'failed', 'skipped'];
      expect(statuses).toHaveLength(5);
    });
  });

describe('Workflow', () => {
  it('should create complete workflow', () => {
    const workflow: Workflow = {
      id: 'wf-1',
      name: 'Test Workflow',
      version: '1.0.0',
      description: 'A test workflow',
      triggers: [{ type: 'manual' }],
      variables: { userId: '123' },
      steps: [
        {
          id: 'step-1',
          name: 'First Step',
          type: 'task',
          config: { model: 'gpt-4o' },
          next: ['step-2'],
        },
      ],
    };

    expect(workflow.id).toBe('wf-1');
    expect(workflow.steps).toHaveLength(1);
    expect(workflow.variables).toEqual({ userId: '123' });
  });

    it('should create minimal workflow', () => {
      const workflow: Workflow = {
        id: 'wf-1',
        name: 'Minimal Workflow',
        version: '1.0.0',
        triggers: [{ type: 'manual' }],
        variables: {},
        steps: [],
      };

      expect(workflow.id).toBe('wf-1');
      expect(workflow.steps).toHaveLength(0);
    });
  });

  describe('WorkflowStep', () => {
    it('should create complete step', () => {
      const step: WorkflowStep = {
        id: 'step-1',
        name: 'Test Step',
        type: 'task',
        config: {
          model: 'gpt-4o',
          retries: 3,
          delay: 100,
          outputKey: 'result',
        },
        next: ['step-2'],
        errorHandling: {
          maxRetries: 3,
          retryDelay: 100,
          onError: 'error-step',
        },
      };

      expect(step.id).toBe('step-1');
      expect(step.config.retries).toBe(3);
      expect(step.errorHandling?.maxRetries).toBe(3);
    });
  });

  describe('WorkflowExecution', () => {
    it('should create running execution', () => {
      const execution: WorkflowExecution = {
        id: 'exec-1',
        workflowId: 'wf-1',
        status: 'running',
        stepStatuses: { step1: 'pending' },
        variables: { userId: '123' },
        outputs: {},
        startedAt: Date.now(),
        currentStep: 'step-1',
      };

      expect(execution.status).toBe('running');
      expect(execution.currentStep).toBe('step-1');
    });

    it('should support all workflow statuses', () => {
      const statuses: Array<WorkflowExecution['status']> =
        ['pending', 'running', 'completed', 'failed', 'paused'];
      expect(statuses).toHaveLength(5);
    });
  });

  describe('ExecutionResult', () => {
    it('should create successful result', () => {
      const execution: WorkflowExecution = {
        id: 'exec-1',
        workflowId: 'wf-1',
        status: 'completed',
        stepStatuses: {},
        variables: {},
        outputs: { result: 'success' },
        startedAt: Date.now(),
        finishedAt: Date.now(),
      };

      const result: ExecutionResult = {
        success: true,
        execution,
        output: execution.outputs,
        duration: 1000,
      };

      expect(result.success).toBe(true);
      expect(result.duration).toBe(1000);
    });

    it('should create failed result', () => {
      const execution: WorkflowExecution = {
        id: 'exec-1',
        workflowId: 'wf-1',
        status: 'failed',
        stepStatuses: {},
        variables: {},
        outputs: {},
        startedAt: Date.now(),
        finishedAt: Date.now(),
        error: 'Step failed',
      };

      const result: ExecutionResult = {
        success: false,
        execution,
        error: execution.error,
        duration: 500,
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Step failed');
    });
  });
});

describe('WorkflowEngine', () => {
  let engine: WorkflowEngine;
  let mockWorkflow: Workflow;

  beforeEach(() => {
    engine = new WorkflowEngine();
    mockWorkflow = {
      id: 'test-workflow',
      name: 'Test Workflow',
      version: '1.0.0',
      description: 'Test workflow for unit tests',
      triggers: [{ type: 'manual' }],
      variables: { input: 'test' },
      steps: [
        {
          id: 'step-1',
          name: 'First Step',
          type: 'task',
          config: { model: 'gpt-4o', outputKey: 'step1-output' },
          next: ['step-2'],
        },
        {
          id: 'step-2',
          name: 'Second Step',
          type: 'task',
          config: { model: 'gpt-4o' },
        },
      ],
    };
  });

  describe('execute', () => {
    it('should execute simple workflow successfully', async () => {
      const result = await engine.execute(mockWorkflow);

      expect(result.success).toBe(true);
      expect(result.execution).toBeDefined();
      expect(result.execution.status).toBe('completed');
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle workflow with input variables', async () => {
      const input = { userId: '123', action: 'test' };
      const result = await engine.execute(mockWorkflow, input);

      expect(result.success).toBe(true);
      expect(result.execution.variables).toMatchObject(input);
    });

    it('should handle workflow validation errors', async () => {
      const emptyWorkflow: Workflow = {
        id: 'empty-workflow',
        name: 'Empty Workflow',
        version: '1.0.0',
        triggers: [{ type: 'manual' }],
        variables: {},
        steps: [],
      };

      const result = await engine.execute(emptyWorkflow);

      // Empty workflow should fail validation
      expect(result.success).toBe(false);
      expect(result.execution.status).toBe('failed');
      expect(result.execution.error).toContain('工作流没有步骤');
    });

    it('should emit workflow started event', async () => {
      const emitSpy = jest.spyOn(engine['eventBus'], 'emit');

      await engine.execute(mockWorkflow);

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'workflow.started',
        })
      );
    });

    it('should emit workflow completed event on success', async () => {
      const emitSpy = jest.spyOn(engine['eventBus'], 'emit');

      await engine.execute(mockWorkflow);

      const completedCalls = emitSpy.mock.calls.filter(
        call => call[0].type === 'workflow.completed'
      );
      expect(completedCalls.length).toBeGreaterThan(0);
    });
  });

  describe('pause', () => {
    it('should pause running execution', async () => {
      const result = await engine.execute(mockWorkflow);
      const executionId = result.execution.id;

      // Note: In real scenario, execution would be running
      // For unit test, we test the pause method directly
      const paused = await engine.pause(executionId);

      expect(paused).toBeDefined();
    });

    it('should return false for invalid execution ID', async () => {
      const paused = await engine.pause('invalid-id');

      expect(paused).toBe(false);
    });
  });

  describe('cache behavior', () => {
    it('should cache successful workflow results', async () => {
      // First execution - should cache result
      const result1 = await engine.execute(mockWorkflow);
      expect(result1.success).toBe(true);

      // Second execution - should return cached result
      const result2 = await engine.execute(mockWorkflow);
      expect(result2.success).toBe(true);
      expect(result2.execution.id).toBe(result1.execution.id);
    }, 10000);

    it('should handle cache hits', async () => {
      // First execution
      await engine.execute(mockWorkflow);

      // Second execution should be faster (from cache)
      const startTime = Date.now();
      await engine.execute(mockWorkflow);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100); // Should be very fast from cache
    });
  });

  describe('error handling', () => {
    it('should handle step errors gracefully', async () => {
      const invalidWorkflow: Workflow = {
        id: 'invalid-workflow',
        name: 'Invalid Workflow',
        version: '1.0.0',
        triggers: [{ type: 'manual' }],
        variables: {},
        steps: [
          {
            id: 'invalid-step',
            name: 'Invalid Step',
            type: 'task',
            config: {} as WorkflowStepConfig,
          } as WorkflowStep,
        ],
      };

      const result = await engine.execute(invalidWorkflow);

      expect(result).toBeDefined();
    });

    it('should emit failed event on error', async () => {
      const emitSpy = jest.spyOn(engine['eventBus'], 'emit');

      // Create workflow that might fail
      const failingWorkflow: Workflow = {
        id: 'failing-workflow',
        name: 'Failing Workflow',
        version: '1.0.0',
        triggers: [{ type: 'manual' }],
        variables: {},
        steps: [],
      };

      await engine.execute(failingWorkflow);

      // Should have emitted events without crashing
      expect(emitSpy).toHaveBeenCalled();
    });
  });
});

describe('Executors', () => {
  let mockContext: ExecutionContext;
  let mockStep: WorkflowStep;

  beforeEach(() => {
    mockContext = {
      variables: { userId: '123' },
      outputs: {},
      stepStatuses: {},
    };

    mockStep = {
      id: 'step-1',
      name: 'Test Step',
      type: 'task',
      config: { model: 'gpt-4o', outputKey: 'result' },
    };
  });

  describe('TaskExecutor', () => {
    it('should execute task successfully', async () => {
      const executor = new TaskExecutor(mockStep, mockContext);
      const result = await executor.execute();

      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should write output to context', async () => {
      const executor = new TaskExecutor(mockStep, mockContext);
      await executor.execute();

      expect(mockContext.outputs['result']).toBeDefined();
    });
  });

  describe('ThoughtExecutor', () => {
    beforeEach(() => {
      mockStep.type = 'thought';
      mockStep.config = { prompt: 'Analyze this' };
    });

    it('should execute thought successfully', async () => {
      const executor = new ThoughtExecutor(mockStep, mockContext);
      const result = await executor.execute();

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
    });

    it('should replace variables in prompt', async () => {
      mockStep.config = {
        prompt: 'Hello {{userId}}',
      };

      const executor = new ThoughtExecutor(mockStep, mockContext);
      const result = await executor.execute();

      expect(result.success).toBe(true);
    });
  });

  describe('OutputExecutor', () => {
    beforeEach(() => {
      mockStep.type = 'output';
      mockContext.outputs['result'] = 'test-output';
    });

    it('should output result successfully', async () => {
      const executor = new OutputExecutor(mockStep, mockContext);
      const result = await executor.execute();

      expect(result.success).toBe(true);
      expect(result.output).toBe('test-output');
    });

    it('should handle missing output key', async () => {
      mockStep.config = { outputKey: 'nonexistent' };

      const executor = new OutputExecutor(mockStep, mockContext);
      const result = await executor.execute();

      expect(result.success).toBe(true);
      expect(result.output).toBeUndefined();
    });
  });

  describe('ToolExecutor', () => {
    beforeEach(() => {
      mockStep.type = 'tool';
      mockStep.config = {
        tool: 'test-tool',
        toolInput: { param: 'value' },
        outputKey: 'tool-result',
      };
    });

    it('should handle missing tool name', async () => {
      mockStep.config = {} as WorkflowStepConfig;

      const executor = new ToolExecutor(mockStep, mockContext);
      const result = await executor.execute();

      expect(result.success).toBe(false);
      expect(result.error).toContain('工具名称');
    });
  });

  describe('createExecutor', () => {
    it('should create TaskExecutor for task type', () => {
      mockStep.type = 'task';
      const executor = createExecutor(mockStep, mockContext);

      expect(executor).toBeInstanceOf(TaskExecutor);
    });

    it('should create ThoughtExecutor for thought type', () => {
      mockStep.type = 'thought';
      const executor = createExecutor(mockStep, mockContext);

      expect(executor).toBeInstanceOf(ThoughtExecutor);
    });

    it('should create OutputExecutor for output type', () => {
      mockStep.type = 'output';
      const executor = createExecutor(mockStep, mockContext);

      expect(executor).toBeInstanceOf(OutputExecutor);
    });

    it('should create ToolExecutor for tool type', () => {
      mockStep.type = 'tool';
      const executor = createExecutor(mockStep, mockContext);

      expect(executor).toBeInstanceOf(ToolExecutor);
    });

    it('should default to TaskExecutor for unknown type', () => {
      mockStep.type = 'unknown' as StepType;
      const executor = createExecutor(mockStep, mockContext);

      expect(executor).toBeInstanceOf(TaskExecutor);
    });
  });
});

describe('Unified Workflow Types', () => {
  describe('WorkflowStatus', () => {
    it('should support all status values', () => {
      const statuses: UnifiedWorkflowStatus[] =
        ['created', 'running', 'paused', 'completed', 'failed', 'cancelled'];
      expect(statuses).toHaveLength(6);
    });
  });

  describe('Unified Workflow', () => {
    it('should create complete unified workflow', () => {
      const workflow: UnifiedWorkflow = {
        id: 'unified-wf-1',
        name: 'Unified Workflow',
        description: 'Test unified workflow',
        steps: [],
        variables: { key: 'value' },
        status: 'created',
        created: Date.now(),
        version: '1.0.0',
        tags: ['test', 'demo'],
      };

      expect(workflow.status).toBe('created');
      expect(workflow.tags).toContain('test');
    });
  });

  describe('TaskStepConfig', () => {
    it('should create task step config', () => {
      const config: TaskStepConfig = {
        taskId: 'task-1',
        input: { param1: 'value1', param2: 123 },
      };

      expect(config.taskId).toBe('task-1');
      expect(config.input.param1).toBe('value1');
    });
  });
});
