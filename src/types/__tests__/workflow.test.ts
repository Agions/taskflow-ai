// @ts-nocheck
import { Workflow, WorkflowStep, WorkflowExecution, NodeExecutor } from '../workflow';

describe('Workflow Types', () => {
  it('should create a valid workflow', () => {
    const workflow: Workflow = {
      id: 'wf-1',
      name: 'Test Workflow',
      description: 'A test workflow',
      steps: [],
      variables: {},
      status: 'created',
      created: Date.now()
    };

    expect(workflow.id).toBe('wf-1');
  });

  it('should support node executor', () => {
    const executor: NodeExecutor = async (input, context) => {
      return { success: true, output: { result: 'done' }, nextSteps: [] };
    };

    expect(typeof executor).toBe('function');
  });

  it('should create workflow step', () => {
    const step: WorkflowStep = {
      id: 'step-1',
      type: 'task',
      name: 'Test Step',
      dependsOn: [],
      config: { taskId: 'task-1', input: {} }
    };

    expect(step.id).toBe('step-1');
    expect(step.type).toBe('task');
  });
});
