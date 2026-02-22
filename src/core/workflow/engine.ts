/**
 * 工作流引擎控制器
 * 负责管理工作流的执行流程
 */

import { 
  Workflow, 
  WorkflowExecution, 
  WorkflowStep, 
  StepStatus,
  ExecutionResult 
} from './types';
import { createExecutor, ExecutionContext } from './executor';
import { Logger } from '../../utils/logger';

export type ExecutionMode = 'sequential' | 'parallel';

/**
 * 工作流引擎
 */
export class WorkflowEngine {
  private logger: Logger;
  private executions: Map<string, WorkflowExecution> = new Map();

  constructor() {
    this.logger = Logger.getInstance('WorkflowEngine');
  }

  /**
   * 创建工作流执行
   */
  async execute(workflow: Workflow, input?: Record<string, unknown>): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    // 创建执行上下文
    const context: ExecutionContext = {
      variables: { ...workflow.variables, ...input },
      outputs: {},
      stepStatuses: {},
    };

    // 创建执行记录
    const execution: WorkflowExecution = {
      id: `exec-${Date.now()}`,
      workflowId: workflow.id,
      status: 'running',
      currentStep: undefined,
      stepStatuses: {},
      variables: context.variables,
      outputs: {},
      startedAt: Date.now(),
    };

    this.executions.set(execution.id, execution);
    this.logger.info(`开始执行工作流: ${workflow.name} (${execution.id})`);

    try {
      // 验证工作流
      const validation = this.validateWorkflow(workflow);
      if (!validation.valid) {
        throw new Error(`工作流验证失败: ${validation.errors.join(', ')}`);
      }

      // 构建步骤映射
      const stepMap = new Map(workflow.steps.map(s => [s.id, s]));

      // 找到起始步骤
      const startSteps = this.findStartSteps(workflow);
      
      // 执行工作流
      await this.executeSteps(stepMap, startSteps, context, execution);

      // 完成
      execution.status = 'completed';
      execution.finishedAt = Date.now();

      this.logger.info(`工作流执行完成: ${execution.id}`);

      return {
        success: true,
        execution,
        output: context.outputs,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : String(error);
      execution.finishedAt = Date.now();

      this.logger.error(`工作流执行失败: ${execution.id}`, error);

      return {
        success: false,
        execution,
        error: execution.error,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * 暂停执行
   */
  async pause(executionId: string): Promise<boolean> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      return false;
    }

    if (execution.status !== 'running') {
      return false;
    }

    execution.status = 'paused';
    execution.pausedAt = execution.currentStep;
    
    this.logger.info(`工作流已暂停: ${executionId}`);
    return true;
  }

  /**
   * 恢复执行
   */
  async resume(executionId: string): Promise<ExecutionResult> {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== 'paused') {
      throw new Error('无法恢复执行');
    }

    // TODO: 实现恢复逻辑
    this.logger.info(`恢复工作流: ${executionId}`);
    
    return {
      success: false,
      execution,
      error: 'Resume not implemented',
      duration: 0,
    };
  }

  /**
   * 获取执行状态
   */
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * 列出执行历史
   */
  listExecutions(workflowId?: string): WorkflowExecution[] {
    const all = Array.from(this.executions.values());
    if (workflowId) {
      return all.filter(e => e.workflowId === workflowId);
    }
    return all;
  }

  /**
   * 执行步骤
   */
  private async executeSteps(
    stepMap: Map<string, WorkflowStep>,
    steps: WorkflowStep[],
    context: ExecutionContext,
    execution: WorkflowExecution
  ): Promise<void> {
    for (const step of steps) {
      // 检查是否应该跳过
      if (execution.stepStatuses[step.id] === 'skipped') {
        continue;
      }

      // 更新当前步骤
      execution.currentStep = step.id;
      execution.stepStatuses[step.id] = 'running';
      context.stepStatuses[step.id] = 'running';

      // 创建执行器
      const executor = createExecutor(step, context);

      // 执行步骤
      const result = await executor.execute();

      // 更新状态
      if (result.success) {
        execution.stepStatuses[step.id] = 'completed';
        context.stepStatuses[step.id] = 'completed';
      } else {
        // 检查错误处理
        if (step.errorHandling?.onError) {
          // 跳转到错误处理步骤
          const errorStep = stepMap.get(step.errorHandling.onError);
          if (errorStep) {
            await this.executeSteps(stepMap, [errorStep], context, execution);
          }
        } else {
          execution.stepStatuses[step.id] = 'failed';
          context.stepStatuses[step.id] = 'failed';
          throw new Error(`步骤 ${step.id} 执行失败: ${result.error}`);
        }
      }

      // 执行下一步
      if (step.next && step.next.length > 0) {
        const nextSteps = step.next
          .map(id => stepMap.get(id))
          .filter((s): s is WorkflowStep => s !== undefined);
        
        await this.executeSteps(stepMap, nextSteps, context, execution);
      }
    }
  }

  /**
   * 查找起始步骤
   */
  private findStartSteps(workflow: Workflow): WorkflowStep[] {
    // 没有依赖的步骤就是起始步骤
    const dependentSteps = new Set<string>();
    
    for (const step of workflow.steps) {
      const config = step.config as any;
      if (config?.dependsOn) {
        const deps = Array.isArray(config.dependsOn) 
          ? config.dependsOn 
          : [config.dependsOn];
        deps.forEach(d => dependentSteps.add(d));
      }
    }

    return workflow.steps.filter(s => !dependentSteps.has(s.id));
  }

  /**
   * 验证工作流
   */
  private validateWorkflow(workflow: Workflow): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 检查是否有步骤
    if (workflow.steps.length === 0) {
      errors.push('工作流没有步骤');
    }

    // 检查步骤 ID 唯一性
    const ids = new Set(workflow.steps.map(s => s.id));
    if (ids.size !== workflow.steps.length) {
      errors.push('步骤 ID 重复');
    }

    // 检查引用完整性
    const stepIds = new Set(workflow.steps.map(s => s.id));
    for (const step of workflow.steps) {
      if (step.next) {
        for (const nextId of step.next) {
          if (!stepIds.has(nextId)) {
            errors.push(`步骤 ${step.id} 引用了不存在的下一步: ${nextId}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * 并行执行器
 */
export class ParallelExecutor {
  private logger = Logger.getInstance('ParallelExecutor');

  /**
   * 并行执行多个步骤
   */
  async execute(
    steps: WorkflowStep[],
    context: ExecutionContext
  ): Promise<Map<string, { success: boolean; output?: unknown; error?: string }>> {
    const results = new Map<string, { success: boolean; output?: unknown; error?: string }>();
    const maxConcurrency = 5; // 限制并发数

    // 分批执行
    for (let i = 0; i < steps.length; i += maxConcurrency) {
      const batch = steps.slice(i, i + maxConcurrency);
      
      const promises = batch.map(async (step) => {
        const executor = createExecutor(step, context);
        const result = await executor.execute();
        return { stepId: step.id, result };
      });

      const batchResults = await Promise.all(promises);
      
      for (const { stepId, result } of batchResults) {
        results.set(stepId, {
          success: result.success,
          output: result.output,
          error: result.error,
        });
      }
    }

    return results;
  }
}

export default WorkflowEngine;
