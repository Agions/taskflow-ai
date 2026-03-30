import { getLogger } from '../../../utils/logger';
/**
 * 任务完成状态检查
 */

import { ExecutionResult, VerificationCheck } from '../../types';
const logger = getLogger('agent/verification/checks/task-completion');

export async function verifyTaskCompletion(result: ExecutionResult): Promise<VerificationCheck> {
  const failedTasks = result.results.filter(r => !r.success);

  if (failedTasks.length === 0) {
    return {
      name: 'Task Completion',
      passed: true,
      message: `All ${result.results.length} tasks completed successfully`,
      severity: 'info',
    };
  }

  return {
    name: 'Task Completion',
    passed: false,
    message: `${failedTasks.length} tasks failed: ${failedTasks.map(t => t.taskId).join(', ')}`,
    severity: 'error',
  };
}
