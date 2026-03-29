/**
 * 修复任务生成器
 */

import { VerificationCheck } from '../types';

/**
 * 根据失败的检查生成修复任务
 */
export function generateFixTasks(failedChecks: VerificationCheck[]): unknown[] {
  const fixTasks: unknown[] = [];

  for (const check of failedChecks) {
    switch (check.name) {
      case 'Code Quality':
        fixTasks.push({
          title: 'Fix Code Quality Issues',
          description: 'Address code quality issues identified in the report',
          type: 'code',
          priority: 'medium',
        });
        break;
      case 'Test Coverage':
        fixTasks.push({
          title: 'Add Unit Tests',
          description: 'Increase test coverage to at least 70%',
          type: 'test',
          priority: 'medium',
        });
        break;
      case 'Dependencies':
        fixTasks.push({
          title: 'Install Dependencies',
          description: 'Run npm install to install missing dependencies',
          type: 'shell',
          priority: 'high',
        });
        break;
    }
  }

  return fixTasks;
}
