/**
 * 执行摘要计算器
 */

import { TaskResult, ExecutionSummary } from '../types';

export class SummaryCalculator {
  calculate(results: TaskResult[]): ExecutionSummary {
    const total = results.length;
    const completed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);

    return {
      totalTasks: total,
      completedTasks: completed,
      failedTasks: failed,
      totalDuration,
      averageDuration: total > 0 ? totalDuration / total : 0
    };
  }
}
