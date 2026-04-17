/**
 * TaskFlow AI - Stage 执行器
 * 差异化设计：与 Workflow 深度绑定，支持条件执行和错误恢复
 */

import {
  Stage,
  StageExecutionResult,
  StageStatus,
  OutputSchema,
  CrewAgentConfig,
} from './types';
import { WorkflowContext } from './context';
import { Logger } from '../../utils/logger';
import { AgentCore } from '../agent/core';
import { AgentConfig } from '../agent/types';

/**
 * Stage 执行器
 * 负责单个 Stage 的执行逻辑
 */
export class StageExecutor {
  private logger: Logger;

  constructor() {
    this.logger = Logger.getInstance('StageExecutor');
  }

  /**
   * 执行 Stage
   */
  async execute(
    stage: Stage,
    context: WorkflowContext,
    options?: {
      signal?: AbortSignal;
      onThought?: (thought: string) => void;
    }
  ): Promise<StageExecutionResult> {
    const startTime = Date.now();
    const result: StageExecutionResult = {
      stageId: stage.id,
      stageName: stage.name,
      status: 'running',
      input: undefined,
      startTime,
    };

    this.logger.info(`[${stage.name}] Stage 开始执行`);

    try {
      // 1. 解析输入
      const input = this.resolveInput(stage, context);
      result.input = input;

      // 2. 检查条件
      if (stage.condition && !this.evaluateCondition(stage.condition, context)) {
        result.status = 'skipped';
        result.output = { skipped: true, reason: 'condition_not_met' };
        this.logger.info(`[${stage.name}] Stage 因条件不满足而跳过`);
        return this.finalizeResult(result, startTime);
      }

      // 3. 构建 Agent 并执行
      const agent = this.buildAgent(stage.agent);
      const agentConfig = this.convertToAgentConfig(stage.agent);

      this.logger.debug(`[${stage.name}] 使用 Agent: ${stage.agent.name} (${stage.agent.specialty})`);

      // 4. 执行（带超时）
      const timeout = stage.timeout || 300000; // 默认 5 分钟
      const output = await this.executeWithTimeout(
        agent,
        agentConfig,
        input,
        stage.output,
        timeout,
        options
      );

      result.output = output;
      result.status = 'completed';

      // 5. 验证输出
      if (stage.output) {
        this.validateOutput(output, stage.output);
      }

      // 6. 更新上下文
      this.updateContext(stage, output, context);

      this.logger.info(`[${stage.name}] Stage 执行完成`);
    } catch (error) {
      result.status = stage.required === false ? 'skipped' : 'failed';
      result.error = error instanceof Error ? error.message : String(error);
      this.logger.error(`[${stage.name}] Stage 执行失败: ${result.error}`);
    }

    return this.finalizeResult(result, startTime);
  }

  /**
   * 解析 Stage 输入
   */
  private resolveInput(stage: Stage, context: WorkflowContext): string {
    // 如果有模板，先渲染模板
    if (stage.input.template) {
      return context.renderTemplate(stage.input.template);
    }

    // 如果指定了从上下文获取
    if (stage.input.fromContext) {
      const value = context.get(stage.input.fromContext);
      if (value !== undefined) {
        if (typeof value === 'string') return value;
        return JSON.stringify(value);
      }
      return stage.input.defaultValue || '';
    }

    return stage.input.defaultValue || '';
  }

  /**
   * 检查条件是否满足
   */
  private evaluateCondition(condition: string, context: WorkflowContext): boolean {
    try {
      // 支持简单的上下文键检查
      // 例如: context.prd exists, context.code exists
      if (condition.includes('exists')) {
        const key = condition.replace('context.', '').replace(' exists', '').trim();
        return context.has(key);
      }
      if (condition.includes('not exists')) {
        const key = condition.replace('context.', '').replace(' not exists', '').trim();
        return !context.has(key);
      }
      return true;
    } catch {
      this.logger.warn(`条件评估失败: ${condition}`);
      return false;
    }
  }

  /**
   * 构建 Agent
   */
  private buildAgent(agentConfig: CrewAgentConfig): AgentCore {
    const config: AgentConfig = {
      id: agentConfig.id,
      name: agentConfig.name,
      description: agentConfig.description,
      capabilities: agentConfig.capabilities,
      model: agentConfig.model,
      tools: agentConfig.tools,
      memory: {
        maxShortTerm: 100,
        maxLongTerm: 50,
      },
      maxStepsPerGoal: agentConfig.maxSteps,
      reflectionEnabled: agentConfig.reflectionEnabled,
    };

    return new AgentCore(config);
  }

  /**
   * 转换 Agent 配置
   */
  private convertToAgentConfig(crewConfig: CrewAgentConfig): AgentConfig {
    return {
      id: crewConfig.id,
      name: crewConfig.name,
      capabilities: crewConfig.capabilities,
      model: crewConfig.model,
      tools: crewConfig.tools,
      memory: {
        maxShortTerm: 100,
        maxLongTerm: 50,
      },
      maxStepsPerGoal: crewConfig.maxSteps,
      reflectionEnabled: crewConfig.reflectionEnabled,
    };
  }

  /**
   * 带超时的执行
   */
  private async executeWithTimeout(
    agent: AgentCore,
    config: AgentConfig,
    input: string,
    outputSchema: OutputSchema | undefined,
    timeout: number,
    options?: { signal?: AbortSignal; onThought?: (thought: string) => void }
  ): Promise<unknown> {
    return new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Stage 执行超时 (${timeout}ms)`));
      }, timeout);

      try {
        // 构造 Agent 任务
        const task = {
          id: `task-${Date.now()}`,
          description: input,
          status: 'in_progress' as const,
          createdAt: Date.now(),
        };

        // 执行 Agent
        const execution = await agent.execute(task);

        clearTimeout(timer);

        if (execution.status === 'failed') {
          reject(new Error(execution.task.error || 'Agent 执行失败'));
        } else {
          // 提取结果
          const result = this.extractResult(execution, outputSchema);
          resolve(result);
        }
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  /**
   * 从 Agent 执行结果提取输出
   */
  private extractResult(
    execution: { steps: { content: string; tool?: string; toolResult?: unknown }[]; task: { result?: unknown } },
    schema?: OutputSchema
  ): unknown {
    // 如果有结构化结果，直接使用
    if (execution.task.result) {
      return execution.task.result;
    }

    // 从步骤中提取结果
    const lastStep = execution.steps[execution.steps.length - 1];
    if (lastStep?.toolResult) {
      return lastStep.toolResult;
    }

    // 否则返回最后一步的内容
    return { content: lastStep?.content || '' };
  }

  /**
   * 验证输出是否符合 Schema
   */
  private validateOutput(output: unknown, schema: OutputSchema): void {
    if (!output || typeof output !== 'object') {
      throw new Error('输出必须是对象');
    }

    const outputObj = output as Record<string, unknown>;

    for (const field of schema.fields) {
      const value = outputObj[field.name];

      if (field.required && value === undefined) {
        throw new Error(`必需字段缺失: ${field.name}`);
      }

      if (value !== undefined) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== field.type) {
          this.logger.warn(
            `字段类型不匹配: ${field.name}, 期望: ${field.type}, 实际: ${actualType}`
          );
        }
      }
    }
  }

  /**
   * 更新上下文
   */
  private updateContext(stage: Stage, output: unknown, context: WorkflowContext): void {
    // 根据 Stage 类型自动更新对应的上下文
    const stageToContextMap: Record<string, string> = {
      'parse-prd': 'prd',
      'plan-tasks': 'plan',
      'implement': 'code',
      'review-code': 'review',
    };

    // 使用 stage id 或 name 匹配
    const contextKey = stageToContextMap[stage.id] || stageToContextMap[stage.name];

    if (contextKey) {
      context.set(contextKey, output);
    } else {
      // 默认使用 stage id 作为 key
      context.set(stage.id, output);
    }
  }

  /**
   * 完成结果计算
   */
  private finalizeResult(result: StageExecutionResult, startTime: number): StageExecutionResult {
    result.endTime = Date.now();
    result.duration = result.endTime - startTime;
    return result;
  }
}
