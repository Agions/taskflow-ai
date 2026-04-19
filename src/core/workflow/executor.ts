import { getLogger } from '../../utils/logger';
/**
 * 步骤执行器
 * 负责执行工作流中的单个步骤
 */

import { WorkflowStep, StepConfig, StepStatus } from './types';
import { Logger } from '../../utils/logger';
import { toolRegistry } from '../../mcp/tools/registry';
const logger = getLogger('core/workflow/executor');

export interface ExecutionContext {
  /** 工作流变量 */
  variables: Record<string, unknown>;
  /** 步骤输出 */
  outputs: Record<string, unknown>;
  /** 步骤状态 */
  stepStatuses: Record<string, StepStatus>;
}

export interface StepResult {
  success: boolean;
  output?: unknown;
  error?: string;
  duration: number;
}

/**
 * 基础步骤执行器
 */
export abstract class BaseExecutor {
  protected logger: Logger;

  constructor(
    protected step: WorkflowStep,
    protected context: ExecutionContext
  ) {
    this.logger = Logger.getInstance(`Executor:${step.id}`);
  }

  /** 执行步骤 */
  abstract execute(): Promise<StepResult>;

  /** 准备输入 */
  protected prepareInput(input: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(input)) {
      if (typeof value === 'string') {
        result[key] = this.replaceVariables(value);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /** 替换变量 */
  protected replaceVariables(text: string): string {
    return text.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const value = this.getByPath(this.context.variables, path);
      if (value !== undefined) return String(value);

      const outputValue = this.getByPath(this.context.outputs, path);
      if (outputValue !== undefined) return String(outputValue);

      return match;
    });
  }

  /** 按路径获取值 */
  private getByPath(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current && typeof current === 'object') {
        current = (current as any)[part];
      } else {
        return undefined;
      }
    }

    return current;
  }
}

/**
 * 工具执行器
 */
export class ToolExecutor extends BaseExecutor {
  async execute(): Promise<StepResult> {
    const startTime = Date.now();
    const toolName = this.step.config.tool;

    if (!toolName) {
      return {
        success: false,
        error: '未指定工具名称',
        duration: Date.now() - startTime,
      };
    }

    try {
      const toolInput = this.prepareInput(this.step.config.toolInput || {});

      this.logger.info(`执行工具: ${toolName}`);

      const response = await toolRegistry.execute(toolName, toolInput);

      if (this.step.config.outputKey) {
        this.context.outputs[this.step.config.outputKey] = response.data;
      }

      if (!response.success) {
        return {
          success: false,
          error: response.error
            ? `${response.error.code}: ${response.error.message}`
            : 'Unknown tool error',
          duration: Date.now() - startTime,
        };
      }

      return {
        success: true,
        output: response.data,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error(`工具执行失败: ${toolName}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
    }
  }
}

/**
 * 思维分析执行器
 */
export class ThoughtExecutor extends BaseExecutor {
  async execute(): Promise<StepResult> {
    const startTime = Date.now();

    const prompt = this.replaceVariables(this.step.config.prompt || '');

    this.logger.info(`执行思维分析: ${this.step.id}`);

    await this.sleep(100);

    const result = {
      thought: prompt,
      timestamp: Date.now(),
    };

    if (this.step.config.outputKey) {
      this.context.outputs[this.step.config.outputKey] = result;
    }

    return {
      success: true,
      output: result,
      duration: Date.now() - startTime,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 任务执行器
 */
export class TaskExecutor extends BaseExecutor {
  async execute(): Promise<StepResult> {
    const startTime = Date.now();
    this.logger.info(`执行任务: ${this.step.id}`);

    await this.sleep(50);

    const result = {
      taskId: this.step.id,
      status: 'completed',
    };

    if (this.step.config.outputKey) {
      this.context.outputs[this.step.config.outputKey] = result;
    }

    return {
      success: true,
      output: result,
      duration: Date.now() - startTime,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 输出执行器
 */
export class OutputExecutor extends BaseExecutor {
  async execute(): Promise<StepResult> {
    const startTime = Date.now();

    const outputKey = this.step.config.outputKey || 'result';
    const output = this.context.outputs[outputKey];

    this.logger.info(`输出结果: ${outputKey}`);

    return {
      success: true,
      output,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * 执行器工厂
 * 支持 StepConfig.retries 重试机制
 */
export function createExecutor(step: WorkflowStep, context: ExecutionContext): BaseExecutor {
  const baseExecutor: BaseExecutor = (() => {
    switch (step.type) {
      case 'tool':
        return new ToolExecutor(step, context);
      case 'thought':
        return new ThoughtExecutor(step, context);
      case 'task':
        return new TaskExecutor(step, context);
      case 'output':
        return new OutputExecutor(step, context);
      default:
        return new TaskExecutor(step, context);
    }
  })();

  // 有重试配置时用 RetryableExecutor 包装
  const retries = step.config.retries ?? 0;
  if (retries > 0) {
    return new RetryableExecutor(baseExecutor, retries, step.config.delay ?? 0, step.id);
  }

  return baseExecutor;
}

/**
 * 重试包装执行器
 * 将 step.config.retries 连接到实际的指数退避重试
 */
class RetryableExecutor extends BaseExecutor {
  constructor(
    private inner: BaseExecutor,
    private maxRetries: number,
    private retryDelay: number,
    private stepId: string
  ) {
    super(
      { id: stepId, name: stepId, type: 'task', config: {} } as WorkflowStep,
      {} as ExecutionContext
    );
  }

  async execute(): Promise<StepResult> {
    let lastError: string | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.inner.execute();
        if (result.success) return result;
        lastError = result.error;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }

      if (attempt < this.maxRetries) {
        // 指数退避: delay * 2^attempt, 最大 30s
        const backoff = Math.min(this.retryDelay * Math.pow(2, attempt), 30_000);
        this.logger.info(
          `[${this.stepId}] retry ${attempt + 1}/${this.maxRetries}, waiting ${backoff}ms`
        );
        await new Promise(resolve => setTimeout(resolve, backoff));
      }
    }

    return {
      success: false,
      error: `Retried ${this.maxRetries} times failed: ${lastError}`,
      duration: 0,
    };
  }
}
