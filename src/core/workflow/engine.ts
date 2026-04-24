import { getLogger } from '../../utils/logger';
import { CacheManager, CacheKeys } from '../cache';
import { getEventBus } from '../events';
import { TaskFlowEvent, WorkflowEventPayload } from '../../types/event';

/**
 * 工作流引擎控制器
 * 负责管理工作流的执行流程
 */

import { Workflow, WorkflowExecution, WorkflowStep, StepStatus, ExecutionResult } from './types';
import { createExecutor, ExecutionContext } from './executor';
import { Logger } from '../../utils/logger';
const logger = getLogger('core/workflow/engine');

export type ExecutionMode = 'sequential' | 'parallel';

/**
 * 工作流引擎
 */
export class WorkflowEngine {
  private logger: Logger;
  private executions: Map<string, WorkflowExecution> = new Map();
  private cacheManager: CacheManager;
  private eventBus = getEventBus();

  constructor() {
    this.logger = Logger.getInstance('WorkflowEngine');
    this.cacheManager = new CacheManager({
      enabled: true,
      l1: { enabled: true, maxSize: 100, ttl: 600 },
      l2: { enabled: true, ttl: 86400 },
    });
    logger.info('WorkflowEngine 缓存已启用');
  }

  /**
   * 创建工作流执行
   */
  async execute(workflow: Workflow, input?: Record<string, unknown>): Promise<ExecutionResult> {
    const startTime = Date.now();

    // 生成缓存键
    const cacheKey = CacheKeys.workflow(workflow.id);

    // 尝试从缓存获取已完成的工作流结果
    const cachedResult = this.cacheManager.get<ExecutionResult>(cacheKey);
    if (cachedResult && cachedResult.success) {
      this.logger.info(`工作流缓存命中: ${workflow.name}`);

      // 发送工作流完成事件 (缓存)
      const payload: WorkflowEventPayload = {
        workflowId: workflow.id,
        executionId: cachedResult.execution.id,
        status: 'completed',
        timestamp: Date.now(),
      };
      this.eventBus.emit({
        type: TaskFlowEvent.WORKFLOW_COMPLETED,
        payload,
        timestamp: Date.now(),
        source: 'WorkflowEngine',
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      });

      // 返回缓存结果的副本
      return {
        ...cachedResult,
        duration: Date.now() - startTime,
      };
    }

    const context: ExecutionContext = {
      variables: { ...workflow.variables, ...input },
      outputs: {},
      stepStatuses: {},
    };

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

    // 发送工作流开始事件
    const startPayload: WorkflowEventPayload = {
      workflowId: workflow.id,
      executionId: execution.id,
      status: 'started',
      timestamp: Date.now(),
    };
    this.eventBus.emit({
      type: TaskFlowEvent.WORKFLOW_STARTED,
      payload: startPayload,
      timestamp: Date.now(),
      source: 'WorkflowEngine',
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    });

    try {
      const validation = this.validateWorkflow(workflow);
      if (!validation.valid) {
        throw new Error(`工作流验证失败: ${validation.errors.join(', ')}`);
      }

      const stepMap = new Map(workflow.steps.map(s => [s.id, s]));

      const startSteps = this.findStartSteps(workflow);

      await this.executeSteps(stepMap, startSteps, context, execution);

      execution.status = 'completed';
      execution.finishedAt = Date.now();

      this.logger.info(`工作流执行完成: ${execution.id}`);

      const result: ExecutionResult = {
        success: true,
        execution,
        output: context.outputs,
        duration: Date.now() - startTime,
      };

      // 缓存成功的执行结果
      this.cacheManager.set(cacheKey, result, 600); // 10 分钟 TTL

      // 发送工作流完成事件
      const completePayload: WorkflowEventPayload = {
        workflowId: workflow.id,
        executionId: execution.id,
        status: 'completed',
        timestamp: Date.now(),
      };
      this.eventBus.emit({
        type: TaskFlowEvent.WORKFLOW_COMPLETED,
        payload: completePayload,
        timestamp: Date.now(),
        source: 'WorkflowEngine',
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      });

      return result;
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : String(error);
      execution.finishedAt = Date.now();

      this.logger.error(`工作流执行失败: ${execution.id}`, error);

      // 发送工作流错误事件
      const errorPayload: WorkflowEventPayload = {
        workflowId: workflow.id,
        executionId: execution.id,
        status: 'failed',
        timestamp: Date.now(),
      };
      this.eventBus.emit({
        type: TaskFlowEvent.WORKFLOW_FAILED,
        payload: errorPayload,
        timestamp: Date.now(),
        source: 'WorkflowEngine',
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      });

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
      if (execution.stepStatuses[step.id] === 'skipped') {
        continue;
      }

      execution.currentStep = step.id;
      execution.stepStatuses[step.id] = 'running';
      context.stepStatuses[step.id] = 'running';

      const executor = createExecutor(step, context);

      const result = await executor.execute();

      if (result.success) {
        execution.stepStatuses[step.id] = 'completed';
        context.stepStatuses[step.id] = 'completed';
      } else {
        if (step.errorHandling?.onError) {
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
    const dependentSteps = new Set<string>();

    for (const step of workflow.steps) {
      const config = step.config as any;
      if (config?.dependsOn) {
        const deps = Array.isArray(config.dependsOn) ? config.dependsOn : [config.dependsOn];
        deps.forEach((d: string) => dependentSteps.add(d));
      }
    }

    return workflow.steps.filter(s => !dependentSteps.has(s.id));
  }

  /**
   * 验证工作流
   */
  private validateWorkflow(workflow: Workflow): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (workflow.steps.length === 0) {
      errors.push('工作流没有步骤');
    }

    const ids = new Set(workflow.steps.map(s => s.id));
    if (ids.size !== workflow.steps.length) {
      errors.push('步骤 ID 重复');
    }

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

    for (let i = 0; i < steps.length; i += maxConcurrency) {
      const batch = steps.slice(i, i + maxConcurrency);

      const promises = batch.map(async step => {
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
