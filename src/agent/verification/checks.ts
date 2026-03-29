/**
 * 验证检查函数
 */

import { ExecutionResult, VerificationCheck } from '../types';

/**
 * 验证任务完成
 */
export async function verifyTaskCompletion(result: ExecutionResult): Promise<VerificationCheck> {
  const tasks = result.tasks || result.results || [];
  const completed = tasks.filter((t: unknown) => t.success).length;
  const total = tasks.length;

  if (total === 0) {
    return {
      name: 'Task Completion',
      passed: true,
      message: 'No tasks to verify',
      severity: 'info',
    };
  }

  const passed = completed === total;

  return {
    name: 'Task Completion',
    passed,
    message: passed ? `All ${total} tasks completed` : `${completed}/${total} tasks completed`,
    severity: passed ? 'info' : 'error',
  };
}

/**
 * 验证生成的文件
 */
export async function verifyGeneratedFiles(result: ExecutionResult): Promise<VerificationCheck> {
  const files = result.files || [];

  if (files.length === 0) {
    return {
      name: 'Generated Files',
      passed: true,
      message: 'No files generated',
      severity: 'info',
    };
  }

  const validFiles = files.filter((f: unknown) => typeof f === 'string' || (f.path && f.content));
  const passed = validFiles.length === files.length;

  return {
    name: 'Generated Files',
    passed,
    message: `${validFiles.length}/${files.length} files valid`,
    severity: passed ? 'info' : 'warning',
  };
}
