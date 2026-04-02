import { getLogger } from '../../utils/logger';
/**
 * 高级流程控制执行器
 * 包含条件分支、并行执行、循环执行
 */

import { WorkflowStep, StepStatus } from './types';
import { ExecutionContext, createExecutor } from './executor';
import { Logger } from '../../utils/logger';
const logger = getLogger('core/workflow/flow-control');

export interface ParallelResult {
  success: boolean;
  results: Record<string, StepResult>;
  duration: number;
}

export interface StepResult {
  success: boolean;
  output?: unknown;
  error?: string;
  duration?: number;
}

/**
 * 条件分支执行器
 */
export class ConditionExecutor {
  private logger = Logger.getInstance('ConditionExecutor');

  async execute(step: WorkflowStep, context: ExecutionContext): Promise<StepResult> {
    const startTime = Date.now();

    if (!step.condition || !step.branches || step.branches.length === 0) {
      return {
        success: false,
        error: '条件分支配置错误',
      };
    }

    const conditionValue = this.evaluateCondition(step.condition, context);

    this.logger.info(`评估条件: ${step.condition} = ${conditionValue}`);

    let selectedBranch =
      step.branches.find(b => b.id === 'true' && conditionValue) ||
      step.branches.find(b => b.id === 'false' && !conditionValue);

    if (!selectedBranch) {
      selectedBranch = step.branches[0];
    }

    return {
      success: true,
      output: { condition: conditionValue, branch: selectedBranch?.id },
    };
  }

  /**
   * 评估条件表达式
   */
  private evaluateCondition(condition: string, context: ExecutionContext): boolean {
    try {
      let expr = condition;
      expr = expr.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        const value = context.variables[key] ?? context.outputs[key];
        return JSON.stringify(value);
      });

      if (expr.startsWith('!')) {
        return !this.evaluateCondition(expr.slice(1), context);
      }

      const comparisons = [
        { op: '===', fn: (a: any, b: any) => a === b },
        { op: '==', fn: (a: any, b: any) => a == b },
        { op: '!==', fn: (a: any, b: any) => a !== b },
        { op: '!=', fn: (a: any, b: any) => a != b },
        { op: '>=', fn: (a: any, b: any) => a >= b },
        { op: '<=', fn: (a: any, b: any) => a <= b },
        { op: '>', fn: (a: any, b: any) => a > b },
        { op: '<', fn: (a: any, b: any) => a < b },
      ] as const;

      for (const { op, fn } of comparisons) {
        const index = expr.indexOf(op);
        if (index > -1) {
          const left = this.evaluateCondition(expr.slice(0, index).trim(), context);
          const right = this.evaluateCondition(expr.slice(index + op.length).trim(), context);
          return fn(left, right);
        }
      }

      if (expr === 'true') return true;
      if (expr === 'false') return false;

      return !!expr;
    } catch (e) {
      this.logger.error('条件评估错误:', e);
      return false;
    }
  }
}

/**
 * 并行执行器
 */
export class ParallelFlowExecutor {
  private logger = Logger.getInstance('ParallelFlowExecutor');
  private maxConcurrency = 5;

  async execute(
    steps: WorkflowStep[],
    context: ExecutionContext,
    concurrency?: number
  ): Promise<ParallelResult> {
    const startTime = Date.now();
    const results: Record<string, StepResult> = {};
    const max = concurrency || this.maxConcurrency;

    this.logger.info(`并行执行 ${steps.length} 个步骤 (最大并发: ${max})`);

    for (let i = 0; i < steps.length; i += max) {
      const batch = steps.slice(i, i + max);

      const promises = batch.map(async step => {
        const executor = createExecutor(step, context);
        const result = await executor.execute();
        return { stepId: step.id, result };
      });

      const batchResults = await Promise.all(promises);

      for (const { stepId, result } of batchResults) {
        results[stepId] = result;
      }
    }

    const hasFailed = Object.values(results).some(r => !r.success);

    return {
      success: !hasFailed,
      results,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * 循环执行器
 */
export class LoopExecutor {
  private logger = Logger.getInstance('LoopExecutor');

  async execute(step: WorkflowStep, context: ExecutionContext): Promise<StepResult> {
    const startTime = Date.now();

    const maxIterations = (step.config as any).maxIterations || 10;
    const condition = (step.config as any).loopCondition;
    const delay = (step.config as any).delay || 0;

    this.logger.info(`开始循环执行 (最大 ${maxIterations} 次)`);

    const results: unknown[] = [];

    for (let i = 0; i < maxIterations; i++) {
      if (condition && !this.evaluateCondition(condition, context, i)) {
        this.logger.info(`循环条件不满足，退出 (第 ${i + 1} 次)`);
        break;
      }

      const executor = createExecutor(step, context);
      const result = await executor.execute();

      results.push(result);

      if (!result.success) {
        this.logger.warn(`循环执行失败 (第 ${i + 1} 次)`);
        return {
          success: false,
          output: { iterations: i + 1, results },
          error: result.error,
        };
      }

      if (delay > 0 && i < maxIterations - 1) {
        await new Promise(r => setTimeout(r, delay));
      }
    }

    this.logger.info(`循环完成，共 ${results.length} 次`);

    return {
      success: true,
      output: { iterations: results.length, results },
    };
  }

  private evaluateCondition(
    condition: string,
    context: ExecutionContext,
    iteration: number
  ): boolean {
    if (condition === '{{done}}') {
      return false;
    }
    return true;
  }
}

/**
 * 错误处理执行器
 */
export class ErrorHandlerExecutor {
  private logger = Logger.getInstance('ErrorHandlerExecutor');

  async executeWithRetry(
    step: WorkflowStep,
    context: ExecutionContext,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<StepResult> {
    let lastError: string | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const executor = createExecutor(step, context);
        const result = await executor.execute();

        if (result.success) {
          return result;
        }

        lastError = result.error;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }

      if (attempt < maxRetries) {
        this.logger.info(`重试 (${attempt + 1}/${maxRetries})...`);
        await new Promise(r => setTimeout(r, retryDelay * (attempt + 1)));
      }
    }

    return {
      success: false,
      error: `重试 ${maxRetries} 次后仍然失败: ${lastError}`,
      duration: 0,
    };
  }

  /**
   * 执行降级步骤
   */
  async executeFallback(
    step: WorkflowStep,
    fallbackStep: WorkflowStep,
    context: ExecutionContext
  ): Promise<StepResult> {
    this.logger.info(`执行降级步骤: ${fallbackStep.id}`);

    const executor = createExecutor(fallbackStep, context);
    return executor.execute();
  }
}
