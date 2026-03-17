/**
 * 依赖检查
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { ExecutionResult, VerificationCheck } from '../types';

export class DependencyChecker {
  constructor(private projectPath: string) {}

  async verify(_result: ExecutionResult): Promise<VerificationCheck> {
    const nodeModulesPath = path.join(this.projectPath, 'node_modules');
    const packageJsonPath = path.join(this.projectPath, 'package.json');

    if (!(await fs.pathExists(packageJsonPath))) {
      return {
        name: 'Dependencies',
        passed: true,
        message: 'No package.json found',
        severity: 'info',
      };
    }

    if (!(await fs.pathExists(nodeModulesPath))) {
      return {
        name: 'Dependencies',
        passed: false,
        message: 'node_modules not found. Run npm install',
        severity: 'error',
      };
    }

    return {
      name: 'Dependencies',
      passed: true,
      message: 'Dependencies installed',
      severity: 'info',
    };
  }
}
