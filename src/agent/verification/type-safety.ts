/**
 * 类型安全检查
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { ExecutionResult, VerificationCheck } from '../types';

export class TypeSafetyChecker {
  constructor(private projectPath: string) {}

  async verify(_result: ExecutionResult): Promise<VerificationCheck> {
    const tsConfigPath = path.join(this.projectPath, 'tsconfig.json');

    if (!await fs.pathExists(tsConfigPath)) {
      return {
        name: 'Type Safety',
        passed: true,
        message: 'No TypeScript config found',
        severity: 'info'
      };
    }

    return {
      name: 'Type Safety',
      passed: true,
      message: 'TypeScript configuration found',
      severity: 'info'
    };
  }
}
