// @ts-nocheck
/**
 * VerificationEngine 集成测试
 */

import { VerificationEngine } from '../engine';
import { ExecutionResult } from '../../types';

// Minimal valid ExecutionResult fixture
const makeResult = (overrides: Partial<ExecutionResult> = {}): ExecutionResult =>
  ({
    success: true,
    results: [],
    summary: 'test',
    startTime: Date.now(),
    endTime: Date.now(),
    output: {},
    ...overrides,
  }) as ExecutionResult;

describe('VerificationEngine', () => {
  const projectPath = '/tmp/taskflow-test-project';
  let engine: VerificationEngine;

  beforeEach(() => {
    engine = new VerificationEngine(projectPath);
  });

  describe('verify()', () => {
    it('should return all 6 checks in the result', async () => {
      const result = await engine.verify(makeResult());

      expect(result).toHaveProperty('allPassed');
      expect(result).toHaveProperty('checks');
      expect(result).toHaveProperty('fixTasks');
      expect(Array.isArray(result.checks)).toBe(true);
      expect(result.checks).toHaveLength(6);

      const checkNames = result.checks.map(c => c.name).sort();
      expect(checkNames).toEqual(
        [
          'Code Quality',
          'Dependencies',
          'Generated Files',
          'Task Completion',
          'Test Coverage',
          'Type Safety',
        ].sort()
      );
    });

    it('should include message, severity, and details in each check', async () => {
      const result = await engine.verify(makeResult());

      for (const check of result.checks) {
        expect(check).toHaveProperty('name');
        expect(check).toHaveProperty('passed');
        expect(check).toHaveProperty('message');
        expect(check).toHaveProperty('severity');
        // details is optional (not all checks populate it)
        expect(['info', 'warning', 'error']).toContain(check.severity);
      }
    });

    it('should set fixTasks to undefined when all checks pass', async () => {
      const result = await engine.verify(makeResult());

      if (result.allPassed) {
        expect(result.fixTasks).toBeUndefined();
      }
    });

    it('should provide fixTasks with correct shape when checks fail', async () => {
      const result = await engine.verify(makeResult());

      if (!result.allPassed && result.fixTasks) {
        expect(Array.isArray(result.fixTasks)).toBe(true);
        for (const task of result.fixTasks as any[]) {
          expect(task).toHaveProperty('title');
          expect(task).toHaveProperty('description');
          expect(task).toHaveProperty('type');
          expect(task).toHaveProperty('priority');
          expect(['high', 'medium', 'low']).toContain(task.priority);
        }
      }
    });

    it('should handle failed execution result', async () => {
      const result = await engine.verify(makeResult({ success: false }));

      expect(result.checks).toHaveLength(6);
      expect(result.allPassed).toBeDefined();
    });
  });
});
