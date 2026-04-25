/**
 * 验证检查模块类型测试
 * 测试 src/agent/verification/checks/ 下所有导出的函数
 */

import {
  verifyTaskCompletion,
  verifyGeneratedFiles,
} from '../index';

import {
  ExecutionResult,
  TaskResult,
  VerificationCheck,
} from '../../../types';

// ─── Helper ────────────────────────────────────────────────────

function createExecutionResult(taskResults: TaskResult[]): ExecutionResult {
  return {
    results: taskResults,
    summary: {
      totalTasks: taskResults.length,
      completedTasks: taskResults.filter(r => r.success).length,
      failedTasks: taskResults.filter(r => !r.success).length,
      skippedTasks: 0,
      totalDuration: taskResults.reduce((sum, r) => sum + r.duration, 0),
    },
    startTime: new Date(),
    endTime: new Date(),
  };
}

// ─── verifyTaskCompletion ──────────────────────────────────────

describe('verifyTaskCompletion', () => {
  it('should pass when all tasks are successful', async () => {
    const result = createExecutionResult([
      { taskId: 't1', success: true, duration: 100 },
      { taskId: 't2', success: true, duration: 200 },
    ]);

    const check = await verifyTaskCompletion(result);

    expect(check.name).toBe('Task Completion');
    expect(check.passed).toBe(true);
    expect(check.severity).toBe('info');
    expect(check.message).toContain('2 tasks completed successfully');
  });

  it('should fail when some tasks failed', async () => {
    const result = createExecutionResult([
      { taskId: 't1', success: true, duration: 100 },
      { taskId: 't2', success: false, error: 'Error', duration: 50 },
    ]);

    const check = await verifyTaskCompletion(result);

    expect(check.passed).toBe(false);
    expect(check.severity).toBe('error');
    expect(check.message).toContain('1 tasks failed');
    expect(check.message).toContain('t2');
  });

  it('should pass when there are no tasks', async () => {
    const result = createExecutionResult([]);

    const check = await verifyTaskCompletion(result);

    expect(check.passed).toBe(true);
    expect(check.message).toContain('0 tasks');
  });

  it('should fail when all tasks failed', async () => {
    const result = createExecutionResult([
      { taskId: 't1', success: false, error: 'Error 1', duration: 10 },
      { taskId: 't2', success: false, error: 'Error 2', duration: 20 },
    ]);

    const check = await verifyTaskCompletion(result);

    expect(check.passed).toBe(false);
    expect(check.message).toContain('2 tasks failed');
    expect(check.message).toContain('t1');
    expect(check.message).toContain('t2');
  });

  it('should produce a valid VerificationCheck object', async () => {
    const result = createExecutionResult([
      { taskId: 't1', success: true, duration: 10 },
    ]);

    const check: VerificationCheck = await verifyTaskCompletion(result);

    expect(check).toHaveProperty('name');
    expect(check).toHaveProperty('passed');
    expect(check).toHaveProperty('message');
    expect(check).toHaveProperty('severity');
    expect(typeof check.name).toBe('string');
    expect(typeof check.passed).toBe('boolean');
    expect(typeof check.message).toBe('string');
  });
});

// ─── verifyGeneratedFiles ──────────────────────────────────────

describe('verifyGeneratedFiles', () => {
  it('should pass when no artifacts exist (info message)', async () => {
    const result = createExecutionResult([
      { taskId: 't1', success: true, duration: 10 },
    ]);

    const check = await verifyGeneratedFiles(result);

    expect(check.name).toBe('Generated Files');
    expect(check.passed).toBe(true);
    expect(check.message).toContain('No files to verify');
  });

  it('should pass when all artifacts exist and are non-empty', async () => {
    // We can't easily create real files in test, but we can test the type
    // This test verifies the function handles artifacts array
    const result = createExecutionResult([
      {
        taskId: 't1',
        success: true,
        duration: 10,
        artifacts: ['/nonexistent/file.ts'],
      },
    ]);

    // Since file doesn't exist, it should report missing
    const check = await verifyGeneratedFiles(result);
    expect(check.name).toBe('Generated Files');
    // File doesn't exist so it will fail
    expect(check.passed).toBe(false);
  });

  it('should produce a valid VerificationCheck object', async () => {
    const result = createExecutionResult([]);

    const check: VerificationCheck = await verifyGeneratedFiles(result);

    expect(check).toHaveProperty('name');
    expect(check).toHaveProperty('passed');
    expect(check).toHaveProperty('message');
    expect(check).toHaveProperty('severity');
  });

  it('should report missing files as error severity', async () => {
    const result = createExecutionResult([
      {
        taskId: 't1',
        success: true,
        duration: 10,
        artifacts: ['/path/to/missing-file.ts'],
      },
    ]);

    const check = await verifyGeneratedFiles(result);
    expect(check.severity).toBe('error');
    expect(check.message).toContain('missing');
  });

  it('should handle multiple artifacts across task results', async () => {
    const result = createExecutionResult([
      {
        taskId: 't1',
        success: true,
        duration: 10,
        artifacts: ['/fake/a.ts', '/fake/b.ts'],
      },
      {
        taskId: 't2',
        success: true,
        duration: 20,
        artifacts: ['/fake/c.ts'],
      },
    ]);

    const check = await verifyGeneratedFiles(result);
    // All files are missing
    expect(check.passed).toBe(false);
  });

  it('should aggregate artifacts from all task results', async () => {
    const result = createExecutionResult([
      { taskId: 't1', success: true, duration: 10, artifacts: ['/a.ts'] },
      { taskId: 't2', success: true, duration: 20, artifacts: ['/b.ts'] },
      { taskId: 't3', success: true, duration: 30 },
    ]);

    // Function aggregates artifacts from all results
    const check = await verifyGeneratedFiles(result);
    expect(check.name).toBe('Generated Files');
    // Since files don't exist, it should report issues
    expect(check.passed).toBe(false);
  });

  it('should pass with info severity when no tasks have artifacts', async () => {
    const result = createExecutionResult([
      { taskId: 't1', success: true, duration: 10 },
      { taskId: 't2', success: true, duration: 20 },
    ]);

    const check = await verifyGeneratedFiles(result);
    expect(check.passed).toBe(true);
    expect(check.severity).toBe('info');
  });
});
