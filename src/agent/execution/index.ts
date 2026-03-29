import { getLogger } from '../../utils/logger';
const logger = getLogger('module');
/**
 * 执行引擎
 * 执行任务计划中的各项任务
 */

import {
  TaskPlan,
  Task,
  ExecutionResult,
  TaskResult,
  ExecutionContext,
  ExecutionSummary,
} from '../types';
import { MCPServer } from '../../mcp/server';
import { TaskExecutor } from './task-executor';
import { TaskSorter } from './sorter';
import { SummaryCalculator } from './summary';

export * from './task-executor';
export * from './sorter';
export * from './summary';

export class ExecutionEngine {
  private taskExecutor: TaskExecutor;
  private taskSorter: TaskSorter;
  private summaryCalculator: SummaryCalculator;
  private abortController: AbortController;

  constructor(mcpServer: MCPServer, context: ExecutionContext) {
    this.taskExecutor = new TaskExecutor(mcpServer, context);
    this.taskSorter = new TaskSorter();
    this.summaryCalculator = new SummaryCalculator();
    this.abortController = new AbortController();
  }

  async execute(plan: TaskPlan): Promise<ExecutionResult> {
    logger.info(`🚀 Starting execution of ${plan.tasks.length} tasks...`);

    const results: TaskResult[] = [];
    const startTime = Date.now();

    const sortedTasks = this.taskSorter.topologicalSort(plan.tasks, plan.dependencies);

    for (const task of sortedTasks) {
      if (this.abortController.signal.aborted) {
        logger.info('⏹️  Execution aborted');
        break;
      }

      logger.info(`\n📝 Task: ${task.title}`);

      try {
        const result = await this.taskExecutor.execute(task, this.abortController.signal);
        results.push(result);

        if (!result.success) {
          logger.error(`   ❌ Failed: ${result.error}`);
          if (!plan.continueOnError) break;
        } else {
          logger.info(`   ✅ Completed in ${result.duration}ms`);
        }
      } catch (error) {
        results.push({
          taskId: task.id,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          duration: 0,
        });
        if (!plan.continueOnError) break;
      }
    }

    const summary = this.summaryCalculator.calculate(results);

    logger.info(`\n📊 Execution Summary:`);
    logger.info(
      `   Total: ${summary.totalTasks} | Completed: ${summary.completedTasks} | Failed: ${summary.failedTasks}`
    );
    logger.info(`   Duration: ${(Date.now() - startTime) / 1000}s`);

    const endTime = Date.now();
    return {
      results,
      completedAt: new Date(),
      success: summary.failedTasks === 0,
      summary,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    };
  }

  abort(): void {
    this.abortController.abort();
  }
}

export default ExecutionEngine;
