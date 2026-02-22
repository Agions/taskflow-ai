/**
 * 步骤执行器
 * 负责执行工作流中的单个步骤
 */

import { WorkflowStep, StepConfig, StepStatus } from './types';
import { Logger } from '../../utils/logger';
import { toolRegistry } from '../../mcp/tools/registry';

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

  constructor(protected step: WorkflowStep, protected context: ExecutionContext) {
    this.logger = Logger.getInstance(`Executor:${step.id}`);
  }

  /** 执行步骤 */
  abstract execute(): Promise<StepResult>;

  /** 准备输入 */
  protected prepareInput(input: Record<string, unknown>): Record<string, unknown> {
    // 替换变量占位符
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
      // 尝试从变量获取
      const value = this.getByPath(this.context.variables, path);
      if (value !== undefined) return String(value);
      
      // 尝试从输出获取
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
      const toolInput = this.prepareInput(
        this.step.config.toolInput || {}
      );

      this.logger.info(`执行工具: ${toolName}`);
      
      const result = await toolRegistry.execute(toolName, toolInput);

      // 保存输出
      if (this.step.config.outputKey) {
        this.context.outputs[this.step.config.outputKey] = result;
      }

      return {
        success: true,
        output: result,
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
    
    // TODO: 集成 ModelGateway 进行实际分析
    const prompt = this.replaceVariables(
      this.step.config.prompt || ''
    );

    this.logger.info(`执行思维分析: ${this.step.id}`);

    // 模拟执行
    await this.sleep(100);

    const result = {
      thought: prompt,
      timestamp: Date.now(),
    };

    // 保存输出
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

    // 模拟任务执行
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
 */
export function createExecutor(
  step: WorkflowStep,
  context: ExecutionContext
): BaseExecutor {
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
}
