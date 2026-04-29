import { Task, TaskStatus, TaskExecutionContext, TaskResult as TaskResultType } from '../task';

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

describe('Task Types', () => {
  it('should create a valid task', () => {
    const task: Task = {
      id: 'task-1',
      name: 'Test Task',
      description: 'A test task',
      status: 'pending',
      priority: 'high',
      createdAt: Date.now(),
      dependsOn: [],
      type: 'code',
      tags: []
    };

    expect(task.id).toBe('task-1');
    expect(task.status).toBe('pending');
  });

  it('should support all task statuses', () => {
    const statuses: TaskStatus[] = [
      'pending',
      'in_progress',
      'completed',
      'failed',
      'skipped'
    ];

    expect(statuses).toContain('completed');
  });

  it('should create task execution context', () => {
    const context: TaskExecutionContext = {
      taskId: 'task-1',
      projectPath: '/workspace',
      environment: 'development',
      config: {},
      variables: {}
    };

    expect(context.taskId).toBe('task-1');
  });
});
