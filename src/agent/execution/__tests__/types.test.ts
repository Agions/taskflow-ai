/**
 * 执行模块类型测试
 * 测试 src/agent/execution/ 下所有导出的类型和类
 */

import {
  TaskSorter,
  SummaryCalculator,
} from '../index';

import {
  Task,
  Dependency,
  TaskResult,
  ExecutionSummary,
  ExecutionContext,
} from '../../types';

// ─── TaskSorter ─────────────────────────────────────────────────

describe('TaskSorter', () => {
  function createTask(id: string, deps: string[] = [], title = `Task ${id}`): Task {
    return {
      id,
      title,
      description: `Description for ${id}`,
      type: 'code',
      status: 'pending',
      priority: 'medium',
      estimate: 1,
      dependencies: deps,
      metadata: { tags: [] },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  it('should be constructable', () => {
    const sorter = new TaskSorter();
    expect(sorter).toBeInstanceOf(TaskSorter);
  });

  it('should sort tasks with linear dependencies', () => {
    const sorter = new TaskSorter();
    const taskA = createTask('A');
    const taskB = createTask('B', ['A']);
    const taskC = createTask('C', ['B']);
    const deps: Dependency[] = [
      { from: 'A', to: 'B', type: 'blocks' },
      { from: 'B', to: 'C', type: 'blocks' },
    ];

    const sorted = sorter.topologicalSort([taskC, taskB, taskA], deps);
    const ids = sorted.map(t => t.id);
    expect(ids.indexOf('A')).toBeLessThan(ids.indexOf('B'));
    expect(ids.indexOf('B')).toBeLessThan(ids.indexOf('C'));
  });

  it('should sort tasks with diamond dependencies', () => {
    const sorter = new TaskSorter();
    const taskA = createTask('A');
    const taskB = createTask('B', ['A']);
    const taskC = createTask('C', ['A']);
    const taskD = createTask('D', ['B', 'C']);
    const deps: Dependency[] = [
      { from: 'A', to: 'B', type: 'blocks' },
      { from: 'A', to: 'C', type: 'blocks' },
      { from: 'B', to: 'D', type: 'blocks' },
      { from: 'C', to: 'D', type: 'blocks' },
    ];

    const sorted = sorter.topologicalSort([taskD, taskC, taskB, taskA], deps);
    const ids = sorted.map(t => t.id);
    expect(ids.indexOf('A')).toBeLessThan(ids.indexOf('B'));
    expect(ids.indexOf('A')).toBeLessThan(ids.indexOf('C'));
    expect(ids.indexOf('B')).toBeLessThan(ids.indexOf('D'));
    expect(ids.indexOf('C')).toBeLessThan(ids.indexOf('D'));
  });

  it('should handle tasks with no dependencies (any order is fine)', () => {
    const sorter = new TaskSorter();
    const task1 = createTask('1');
    const task2 = createTask('2');
    const task3 = createTask('3');

    const sorted = sorter.topologicalSort([task1, task2, task3], []);
    expect(sorted).toHaveLength(3);
    expect(sorted.map(t => t.id).sort()).toEqual(['1', '2', '3']);
  });

  it('should throw on circular dependencies', () => {
    const sorter = new TaskSorter();
    const taskA = createTask('A', ['B']);
    const taskB = createTask('B', ['A']);
    const deps: Dependency[] = [
      { from: 'B', to: 'A', type: 'blocks' },
      { from: 'A', to: 'B', type: 'blocks' },
    ];

    expect(() => sorter.topologicalSort([taskA, taskB], deps)).toThrow('Circular dependency');
  });

  it('should handle single task', () => {
    const sorter = new TaskSorter();
    const task = createTask('only');
    const sorted = sorter.topologicalSort([task], []);
    expect(sorted).toHaveLength(1);
    expect(sorted[0].id).toBe('only');
  });
});

// ─── SummaryCalculator ──────────────────────────────────────────

describe('SummaryCalculator', () => {
  it('should be constructable', () => {
    const calc = new SummaryCalculator();
    expect(calc).toBeInstanceOf(SummaryCalculator);
  });

  it('should calculate summary for all successful tasks', () => {
    const calc = new SummaryCalculator();
    const results: TaskResult[] = [
      { taskId: 't1', success: true, duration: 100 },
      { taskId: 't2', success: true, duration: 200 },
      { taskId: 't3', success: true, duration: 300 },
    ];
    const summary = calc.calculate(results);

    expect(summary.totalTasks).toBe(3);
    expect(summary.completedTasks).toBe(3);
    expect(summary.failedTasks).toBe(0);
    expect(summary.skippedTasks).toBe(0);
    expect(summary.totalDuration).toBe(600);
    expect(summary.averageDuration).toBe(200);
  });

  it('should calculate summary for mixed success/failure tasks', () => {
    const calc = new SummaryCalculator();
    const results: TaskResult[] = [
      { taskId: 't1', success: true, duration: 100 },
      { taskId: 't2', success: false, error: 'Error', duration: 50 },
      { taskId: 't3', success: true, duration: 150 },
    ];
    const summary = calc.calculate(results);

    expect(summary.totalTasks).toBe(3);
    expect(summary.completedTasks).toBe(2);
    expect(summary.failedTasks).toBe(1);
  });

  it('should calculate summary for empty results', () => {
    const calc = new SummaryCalculator();
    const summary = calc.calculate([]);

    expect(summary.totalTasks).toBe(0);
    expect(summary.completedTasks).toBe(0);
    expect(summary.failedTasks).toBe(0);
    expect(summary.averageDuration).toBe(0);
  });

  it('should correctly compute totalDuration', () => {
    const calc = new SummaryCalculator();
    const results: TaskResult[] = [
      { taskId: 't1', success: true, duration: 1000 },
      { taskId: 't2', success: true, duration: 2000 },
    ];
    const summary = calc.calculate(results);

    expect(summary.totalDuration).toBe(3000);
    expect(summary.averageDuration).toBe(1500);
  });

  it('should produce a valid ExecutionSummary object structure', () => {
    const calc = new SummaryCalculator();
    const results: TaskResult[] = [
      { taskId: 't1', success: false, error: 'fail', duration: 10 },
    ];
    const summary: ExecutionSummary = calc.calculate(results);

    expect(summary).toHaveProperty('totalTasks');
    expect(summary).toHaveProperty('completedTasks');
    expect(summary).toHaveProperty('failedTasks');
    expect(summary).toHaveProperty('skippedTasks');
    expect(summary).toHaveProperty('totalDuration');
    expect(summary).toHaveProperty('averageDuration');
  });
});

// ─── Execution Types (re-exported) ─────────────────────────────

describe('Execution Types', () => {
  it('should create a valid ExecutionContext with optional workspacePath', () => {
    const ctx1: ExecutionContext = {
      projectPath: '/project',
      config: {},
    };
    expect(ctx1.workspacePath).toBeUndefined();

    const ctx2: ExecutionContext = {
      projectPath: '/project',
      workspacePath: '/workspace',
      config: { verbose: true },
    };
    expect(ctx2.workspacePath).toBe('/workspace');
  });

  it('should create TaskResult with and without optional fields', () => {
    const minimal: TaskResult = {
      taskId: 't1',
      success: true,
      duration: 50,
    };
    expect(minimal.output).toBeUndefined();
    expect(minimal.error).toBeUndefined();

    const full: TaskResult = {
      taskId: 't1',
      success: false,
      output: undefined,
      error: 'Task failed',
      duration: 100,
      artifacts: ['/output/file.ts'],
    };
    expect(full.error).toBe('Task failed');
    expect(full.artifacts).toHaveLength(1);
  });
});
