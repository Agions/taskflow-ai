import {
  Workflow,
  WorkflowExecution,
  ExecutionResult,
  WorkflowStep,
  TaskStepConfig,
  WorkflowStatus
} from '../../../types/workflow';
import { WorkflowEngine } from '../workflow-engine';

describe('WorkflowEngine', () => {
  let workflowEngine: WorkflowEngine;

  beforeEach(() => {
    workflowEngine = new WorkflowEngine();
  });

  it('should create workflow execution', async () => {
    const workflow: Workflow = {
      id: 'test-workflow',
      name: 'Test Workflow',
      description: 'A test workflow',
      steps: [],
      variables: {},
      status: 'created',
      created: Date.now()
    };

    const execution = await workflowEngine.execute(workflow);

    expect(execution).toBeDefined();
    expect(execution.execution?.id).toBeDefined();
  });

  it('should execute workflow with steps', async () => {
    const workflow: Workflow = {
      id: 'test-workflow',
      name: 'Test Workflow',
      description: 'A test workflow',
      steps: [
        {
          id: 'step-1',
          type: 'task',
          name: 'Test Step',
          dependsOn: [],
          config: {
            taskId: 'task-1',
            input: { data: 'test' }
          }
        }
      ],
      variables: {},
      status: 'created',
      created: Date.now()
    };

    const result = await workflowEngine.execute(workflow, { testVar: 'value' });

    expect(result).toBeDefined();
  });

  it('should get execution by id', async () => {
    const workflow: Workflow = {
      id: 'test-workflow',
      name: 'Test Workflow',
      description: 'A test workflow',
      steps: [],
      variables: {},
      status: 'created',
      created: Date.now()
    };

    const result = await workflowEngine.execute(workflow);
    const execution = workflowEngine.getExecution(result.execution?.id || '');

    expect(execution).toBeDefined();
    expect(execution?.workflowId).toBe('test-workflow');
  });

  it('should cancel execution', async () => {
    const workflow: Workflow = {
      id: 'test-workflow',
      name: 'Test Workflow',
      description: 'A test workflow',
      steps: [],
      variables: {},
      status: 'created',
      created: Date.now()
    };

    const result = await workflowEngine.execute(workflow);
    workflowEngine.cancel(result.execution?.id || '');

    const execution = workflowEngine.getExecution(result.execution?.id || '');
    expect(execution?.status).toBe('cancelled');
  });
});
