/**
 * Workflow Types Tests
 * TaskFlow AI v4.0
 */

import type {
  WorkflowStatus,
  StepStatus,
  StepType,
  Workflow,
  WorkflowStep,
  StepConfig,
  TaskStepConfig,
  ConditionStepConfig,
  LoopStepConfig,
  ParallelStepConfig,
  RetryPolicy,
  WorkflowExecution,
  ExecutionResult,
  WorkflowError,
  NodeExecutor,
  NodeContext,
  NodeOutput,
  WorkflowLogger,
  WorkflowNodeDefinition
} from '../../../types/workflow';

describe('Workflow Types', () => {
  describe('WorkflowStatus', () => {
    it('should support all workflow statuses', () => {
      const statuses: WorkflowStatus[] = [
        'created', 'running', 'paused', 'completed', 'failed', 'cancelled'
      ];
      
      expect(statuses).toHaveLength(6);
      expect(statuses).toContain('running');
      expect(statuses).toContain('completed');
    });

    it('should support created status', () => {
      const status: WorkflowStatus = 'created';
      expect(status).toBe('created');
    });

    it('should support running status', () => {
      const status: WorkflowStatus = 'running';
      expect(status).toBe('running');
    });
  });

  describe('StepStatus', () => {
    it('should support all step statuses', () => {
      const statuses: StepStatus[] = [
        'pending', 'in_progress', 'completed', 'failed', 'skipped'
      ];
      
      expect(statuses).toHaveLength(5);
      expect(statuses).toContain('pending');
      expect(statuses).toContain('completed');
    });
  });

  describe('StepType', () => {
    it('should support all step types', () => {
      const types: StepType[] = [
        'task', 'condition', 'loop', 'parallel', 'merge'
      ];
      
      expect(types).toHaveLength(5);
      expect(types).toContain('task');
      expect(types).toContain('condition');
    });
  });

  describe('RetryPolicy', () => {
    it('should create retry policy with exponential backoff', () => {
      const policy: RetryPolicy = {
        maxAttempts: 3,
        backoffMs: 1000,
        exponentialBackoff: true
      };

      expect(policy.maxAttempts).toBe(3);
      expect(policy.exponentialBackoff).toBe(true);
    });

    it('should create retry policy with linear backoff', () => {
      const policy: RetryPolicy = {
        maxAttempts: 5,
        backoffMs: 500,
        exponentialBackoff: false
      };

      expect(policy.maxAttempts).toBe(5);
      expect(policy.exponentialBackoff).toBe(false);
    });
  });

  describe('TaskStepConfig', () => {
    it('should create task step config', () => {
      const config: TaskStepConfig = {
        taskId: 'task-123',
        input: {
          parameter1: 'value1',
          parameter2: 42
        }
      };

      expect(config.taskId).toBe('task-123');
      expect(config.input.parameter1).toBe('value1');
    });

    it('should create task step config with empty input', () => {
      const config: TaskStepConfig = {
        taskId: 'task-456',
        input: {}
      };

      expect(config.input).toEqual({});
    });
  });

  describe('ConditionStepConfig', () => {
    it('should create condition step config with both branches', () => {
      const config: ConditionStepConfig = {
        expression: 'result.success === true',
        trueBranch: 'step-on-success',
        falseBranch: 'step-on-failure'
      };

      expect(config.expression).toBe('result.success === true');
      expect(config.trueBranch).toBe('step-on-success');
      expect(config.falseBranch).toBe('step-on-failure');
    });

    it('should create condition step config with only true branch', () => {
      const config: ConditionStepConfig = {
        expression: 'count > 0',
        trueBranch: 'process-step'
      };

      expect(config.falseBranch).toBeUndefined();
    });
  });

  describe('LoopStepConfig', () => {
    it('should create loop step config', () => {
      const steps: WorkflowStep[] = [
        {
          id: 'inner-step-1',
          type: 'task',
          name: 'Process item',
          config: {
            taskId: 'process',
            input: {}
          },
          dependsOn: []
        }
      ];

      const config: LoopStepConfig = {
        iterations: 10,
        itemVariable: 'item',
        steps
      };

      expect(config.iterations).toBe(10);
      expect(config.itemVariable).toBe('item');
      expect(config.steps).toHaveLength(1);
    });
  });

  describe('ParallelStepConfig', () => {
    it('should create parallel step config', () => {
      const steps: WorkflowStep[] = [
        {
          id: 'parallel-1',
          type: 'task',
          name: 'Task A',
          config: {
            taskId: 'task-a',
            input: {}
          },
          dependsOn: []
        },
        {
          id: 'parallel-2',
          type: 'task',
          name: 'Task B',
          config: {
            taskId: 'task-b',
            input: {}
          },
          dependsOn: []
        }
      ];

      const config: ParallelStepConfig = {
        steps,
        mergeStrategy: 'all'
      };

      expect(config.steps).toHaveLength(2);
      expect(config.mergeStrategy).toBe('all');
    });

    it('should create parallel step config with first merge strategy', () => {
      const config: ParallelStepConfig = {
        steps: [],
        mergeStrategy: 'first'
      };

      expect(config.mergeStrategy).toBe('first');
    });
  });

  describe('WorkflowStep', () => {
    it('should create task workflow step', () => {
      const step: WorkflowStep = {
        id: 'step-123',
        type: 'task',
        name: 'Execute task',
        description: 'Execute main task',
        config: {
          taskId: 'main-task',
          input: { param: 'value' }
        },
        dependsOn: ['previous-step'],
        retryPolicy: {
          maxAttempts: 3,
          backoffMs: 1000,
          exponentialBackoff: true
        },
        timeout: 60000
      };

      expect(step.id).toBe('step-123');
      expect(step.type).toBe('task');
      expect(step.dependsOn).toContain('previous-step');
      expect(step.timeout).toBe(60000);
    });

    it('should create condition workflow step', () => {
      const step: WorkflowStep = {
        id: 'condition-step',
        type: 'condition',
        name: 'Check condition',
        config: {
          expression: 'value > 10',
          trueBranch: 'success-step'
        },
        dependsOn: []
      };

      expect(step.type).toBe('condition');
    });

    it('should create loop workflow step', () => {
      const step: WorkflowStep = {
        id: 'loop-step',
        type: 'loop',
        name: 'Process items',
        config: {
          iterations: 5,
          itemVariable: 'item',
          steps: []
        },
        dependsOn: []
      };

      expect(step.type).toBe('loop');
      expect(step.config).toHaveProperty('iterations');
    });

    it('should create parallel workflow step', () => {
      const step: WorkflowStep = {
        id: 'parallel-step',
        type: 'parallel',
        name: 'Execute in parallel',
        config: {
          steps: [],
          mergeStrategy: 'all'
        },
        dependsOn: []
      };

      expect(step.type).toBe('parallel');
    });
  });

  describe('Workflow', () => {
    it('should create complete workflow', () => {
      const steps: WorkflowStep[] = [
        {
          id: 'step-1',
          type: 'task',
          name: 'Initialize',
          config: {
            taskId: 'init',
            input: {}
          },
          dependsOn: []
        },
        {
          id: 'step-2',
          type: 'task',
          name: 'Process',
          config: {
            taskId: 'process',
            input: {}
          },
          dependsOn: ['step-1']
        }
      ];

      const workflow: Workflow = {
        id: 'workflow-123',
        name: 'Data Processing Pipeline',
        description: 'Process data from input to output',
        steps,
        variables: {
          inputPath: '/data/input',
          outputPath: '/data/output',
          batchSize: 100
        },
        status: 'created',
        created: Date.now(),
        updated: Date.now(),
        version: '1.0.0',
        tags: ['processing', 'data']
      };

      expect(workflow.id).toBe('workflow-123');
      expect(workflow.steps).toHaveLength(2);
      expect(workflow.variables.batchSize).toBe(100);
      expect(workflow.tags).toContain('processing');
    });

    it('should create minimal workflow', () => {
      const workflow: Workflow = {
        id: 'workflow-simple',
        name: 'Simple Workflow',
        description: 'A simple workflow',
        steps: [],
        variables: {},
        status: 'created',
        created: Date.now()
      };

      expect(workflow.id).toBe('workflow-simple');
      expect(workflow.version).toBeUndefined();
      expect(workflow.tags).toBeUndefined();
    });
  });

  describe('WorkflowExecution', () => {
    it('should create workflow execution', () => {
      const execution: WorkflowExecution = {
        id: 'exec-123',
        workflowId: 'workflow-123',
        status: 'running',
        startedAt: Date.now(),
        stepStatuses: {},
        variables: {},
        outputs: {}
      };

      expect(execution.id).toBe('exec-123');
      expect(execution.status).toBe('running');
      expect(execution.startedAt).toBeDefined();
    });

    it('should create completed workflow execution', () => {
      const stepStatuses: Record<string, StepStatus> = {
        'step-1': 'completed',
        'step-2': 'completed',
        'step-3': 'completed'
      };

      const execution: WorkflowExecution = {
        id: 'exec-456',
        workflowId: 'workflow-456',
        status: 'completed',
        startedAt: Date.now() - 10000,
        completedAt: Date.now(),
        finishedAt: Date.now(),
        duration: 10000,
        stepStatuses,
        variables: {},
        outputs: {}
      };

      expect(execution.status).toBe('completed');
      expect(execution.completedAt).toBeDefined();
      expect(execution.duration).toBe(10000);
      expect(execution.stepStatuses).toBeDefined();
    });
  });

  describe('WorkflowError', () => {
    it('should create workflow error', () => {
      const error: WorkflowError = {
        stepId: 'failing-step',
        message: 'Step execution failed due to timeout',
        timestamp: Date.now(),
        stack: 'Error: timeout\n    at step.js:42'
      };

      expect(error.stepId).toBe('failing-step');
      expect(error.message).toContain('timeout');
      expect(error.stack).toBeDefined();
    });

    it('should create workflow error without step', () => {
      const error: WorkflowError = {
        message: 'Workflow validation failed',
        timestamp: Date.now()
      };

      expect(error.stepId).toBeUndefined();
      expect(error.message).toBe('Workflow validation failed');
    });
  });

  describe('ExecutionResult', () => {
    it('should create successful execution result', () => {
      const execution: WorkflowExecution = {
        id: 'exec-123',
        workflowId: 'workflow-123',
        status: 'completed',
        startedAt: Date.now() - 5000,
        completedAt: Date.now(),
        stepStatuses: {},
        variables: {},
        outputs: {
          processedItems: 100
        }
      };

      const result: ExecutionResult = {
        success: true,
        workflowId: 'workflow-123',
        executionId: 'exec-123',
        execution,
        outputs: execution.outputs,
        duration: 5000
      };

      expect(result.success).toBe(true);
      expect(result.outputs).toBeDefined();
      expect(result.duration).toBe(5000);
    });

    it('should create failed execution result', () => {
      const error: WorkflowError = {
        stepId: 'step-2',
        message: 'Step validation failed',
        timestamp: Date.now()
      };

      const result: ExecutionResult = {
        success: false,
        workflowId: 'workflow-456',
        executionId: 'exec-456',
        error,
        errors: ['Step validation failed'],
        duration: 2000
      };

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toBe('Step validation failed');
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('WorkflowNodeDefinition', () => {
    it('should create workflow node definition', () => {
      const executor: NodeExecutor = async (input, context) => {
        return {
          success: true,
          output: { processed: true },
          nextSteps: ['next-step']
        };
      };

      const node: WorkflowNodeDefinition = {
        type: 'custom-step',
        name: 'Custom Step',
        description: 'A custom workflow step',
        parallelizable: true,
        inputSchema: {
          data: { type: 'string' }
        },
        outputSchema: {
          result: { type: 'boolean' }
        },
        executor
      };

      expect(node.type).toBe('custom-step');
      expect(node.parallelizable).toBe(true);
      expect(typeof node.executor).toBe('function');
    });
  });
});
