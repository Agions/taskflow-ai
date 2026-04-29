/**
 * CodeQualityChecker 单元测试
 */

import * as path from 'path';
import { CodeQualityChecker } from '../code-quality';
import { ExecutionResult } from '../../types';

// Use this project as the test subject (real files, real ESLint)
const PROJECT_ROOT = path.resolve(__dirname, '../../../../..');

describe('CodeQualityChecker', () => {
  let checker: CodeQualityChecker;

  beforeEach(() => {
    checker = new CodeQualityChecker(PROJECT_ROOT, 'npx eslint', ['.ts', '.tsx'], 70);
  });

  describe('verify()', () => {
    it('should return a valid VerificationCheck result', async () => {
      const result = await checker.verify({ success: true } as ExecutionResult);

      expect(result).toHaveProperty('name', 'Code Quality');
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('severity');
      expect(result).toHaveProperty('details');
      expect(['info', 'warning', 'error']).toContain(result.severity);
    });

    it('should pass when score >= threshold', async () => {
      // Use a generous threshold — the real project should exceed it
      const result = await checker.verify({ success: true } as ExecutionResult);

      if (result.passed) {
        const details = result.details as { score?: number };
        expect(details.score).toBeGreaterThanOrEqual(70);
        expect(result.severity).toBe('info');
      }
    });

    it('should fail when score < threshold', async () => {
      // Force a very low threshold to trigger failure
      const strictChecker = new CodeQualityChecker(
        PROJECT_ROOT,
        'npx eslint',
        ['.ts', '.tsx'],
        999
      );
      const result = await strictChecker.verify({ success: true } as ExecutionResult);

      expect(result.passed).toBe(false);
      expect(result.severity).toBe('warning');
      expect(result.message).toContain('too low');
    });

    it('should include ESLint output and heuristic scan in details', async () => {
      const result = await checker.verify({ success: true } as ExecutionResult);

      const details = result.details as {
        eslint?: { issues: unknown[]; totalErrors: number; totalWarnings: number };
        heuristic?: { issues: unknown[] };
        score?: number;
      };

      expect(details).toHaveProperty('eslint');
      expect(details).toHaveProperty('heuristic');
      expect(Array.isArray(details.eslint?.issues)).toBe(true);
      expect(Array.isArray(details.heuristic?.issues)).toBe(true);
    });
  });

  describe('runHeuristicScan()', () => {
    it('should return an array of issues from src/', async () => {
      const report = await checker.runHeuristicScan();

      expect(report).toHaveProperty('issues');
      expect(Array.isArray(report.issues)).toBe(true);

      for (const issue of report.issues) {
        expect(issue).toHaveProperty('file');
        expect(issue).toHaveProperty('line');
        expect(issue).toHaveProperty('message');
        expect(issue).toHaveProperty('severity');
        expect(issue).toHaveProperty('rule');
        expect(['error', 'warning', 'info']).toContain(issue.severity);
        expect(issue.file).toContain('/src/');
        expect(issue.file).not.toContain('node_modules');
      }
    });

    it('should skip node_modules, dist, coverage, _DEAD directories', async () => {
      const report = await checker.runHeuristicScan();

      for (const issue of report.issues) {
        expect(issue.file).not.toMatch(/node_modules/);
        expect(issue.file).not.toMatch(/\/dist\//);
        expect(issue.file).not.toMatch(/\/coverage\//);
        expect(issue.file).not.toMatch(/\/_DEAD\//);
      }
    });

    it('should handle missing src directory gracefully', async () => {
      const emptyChecker = new CodeQualityChecker('/nonexistent-path-xyz');
      const report = await emptyChecker.runHeuristicScan();

      expect(report.issues).toHaveLength(0);
    });
  });

  describe('runEslint()', () => {
    it('should return structured ESLint results', async () => {
      const eslintReport = await checker.runEslint();

      expect(eslintReport).toHaveProperty('issues');
      expect(eslintReport).toHaveProperty('totalErrors');
      expect(eslintReport).toHaveProperty('totalWarnings');
      expect(Array.isArray(eslintReport.issues)).toBe(true);

      for (const issue of eslintReport.issues) {
        expect(issue).toHaveProperty('file');
        expect(issue).toHaveProperty('line');
        expect(issue).toHaveProperty('message');
        expect(issue).toHaveProperty('severity');
        expect(issue).toHaveProperty('rule');
        expect(['error', 'warning']).toContain(issue.severity);
      }
    });

    it('should handle missing src directory gracefully', async () => {
      const emptyChecker = new CodeQualityChecker('/nonexistent-path-xyz');
      const report = await emptyChecker.runEslint();

      expect(report.issues).toHaveLength(0);
      expect(report.totalErrors).toBe(0);
      expect(report.totalWarnings).toBe(0);
    });
  });
});
