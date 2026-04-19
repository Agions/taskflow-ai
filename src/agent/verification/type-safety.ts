import { getLogger } from '../../utils/logger';
/**
 * 类型安全检查 — 实际运行 tsc --noEmit 验证类型正确性
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ExecutionResult, VerificationCheck } from '../types';
const execAsync = promisify(exec);
const logger = getLogger('agent/verification/type-safety');

export class TypeSafetyChecker {
  constructor(
    private projectPath: string,
    private tscPath: string = 'npx tsc'
  ) {}

  async verify(_result: ExecutionResult): Promise<VerificationCheck> {
    const tsConfigPath = path.join(this.projectPath, 'tsconfig.json');

    if (!(await fs.pathExists(tsConfigPath))) {
      return {
        name: 'Type Safety',
        passed: true,
        message: 'No TypeScript config found, skipping type check',
        severity: 'info',
      };
    }

    try {
      const { stdout, stderr } = await execAsync(
        `${this.tscPath} --noEmit --project "${this.projectPath}"`,
        {
          cwd: this.projectPath,
          timeout: 120_000,
        }
      );

      if (stderr && stderr.includes('error TS')) {
        const errors = stderr.split('\n').filter(l => l.trim());
        return {
          name: 'Type Safety',
          passed: false,
          message: `TypeScript errors found: ${errors.length} error(s)`,
          severity: 'error',
          details: { errors: stderr.slice(0, 1000) },
        };
      }

      return {
        name: 'Type Safety',
        passed: true,
        message: 'TypeScript type check passed (tsc --noEmit)',
        severity: 'info',
      };
    } catch (error: unknown) {
      const err = error as { stderr?: string; message?: string; code?: number };
      const stderr = err.stderr || err.message || '';

      if (stderr.includes('error TS')) {
        const errorLines = stderr.split('\n').filter(l => l.includes('error TS'));
        return {
          name: 'Type Safety',
          passed: false,
          message: `TypeScript errors: ${errorLines.length} error(s)`,
          severity: 'error',
          details: { errors: stderr.slice(0, 1000) },
        };
      }

      if (err.code === 2) {
        // tsc exits with 2 for type errors
        return {
          name: 'Type Safety',
          passed: false,
          message: 'TypeScript type check failed',
          severity: 'error',
          details: { errors: stderr.slice(0, 1000) },
        };
      }

      return {
        name: 'Type Safety',
        passed: false,
        message: `TypeScript check error: ${err.message || 'unknown'}`,
        severity: 'error',
        details: { errors: stderr.slice(0, 500) },
      };
    }
  }
}
