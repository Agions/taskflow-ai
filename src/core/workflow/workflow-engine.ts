/**
 * Workflow Engine - 工作流引擎
 * TaskFlow AI v4.0
 */

import {
  Workflow,
  WorkflowExecution,
  ExecutionResult,
  WorkflowStep,
  NodeOutput,
  WorkflowStatus,
  StepStatus
} from '../../types/workflow';
import { Logger } from '../../utils/logger';
import { CacheManager, CacheKeys } from '../cache';
import { getEventBus } from '../events';
import { EventHandler } from '../../types/event';

export class WorkflowEngine {
  private logger: Logger;
  private executions: Map<string, WorkflowExecution> = new Map();
  private cacheManager: CacheManager;
  private eventBus = getEventBus();
  private stepExecutors: Map<string, Function> = new Map();

  constructor() {
    this.logger = Logger.getInstance('WorkflowEngine');
    this.cacheManager = new CacheManager({
      enabled: true,
      l1: {
        enabled: true,
        maxSize: 100,
        ttl: 600
      },
      l2: {
        enabled: true,
        ttl: 86400
      }
    });
  }

  /**
   * 执行工作流
   */
  async execute(workflow: Workflow, input?: Record<string, unknown>): Promise<ExecutionResult> {
    const startTime = Date.now();
    const cacheKey = CacheKeys.workflow(workflow.id);

    // 尝试从缓存获取
    const cachedResult = this.cacheManager.get<ExecutionResult>(cacheKey);
    if (cachedResult && cachedResult.success && cachedResult.execution?.id) {
      this.logger.info(`Workflow cache hit: ${workflow.name}`);
      this.emitWorkflowComplete(workflow, cachedResult.execution.id, Date.now() - startTime);
      return { ...cachedResult, duration: Date.now() - startTime };
    }

    // 创建执行实例
    const executionId = `exec-${Date.now()}`;
    const execution = this.createExecution(executionId, workflow, input);

    this.executions.set(executionId, execution);
    this.logger.info(`Starting workflow: ${workflow.name} (${executionId})`);

    try {
      // 验证工作流
      const validation = this.validateWorkflow(workflow);
      if (!validation.valid) {
        throw new Error(`Workflow validation failed: ${validation.errors.join(', ')}`);
      }

      // 发送启动事件
      this.emitWorkflowStart(workflow, executionId);

      // 执行步骤
      await this.executeSteps(workflow, execution);

      const duration = Date.now() - startTime;
      const result: ExecutionResult = {
        success: true,
        workflowId: workflow.id,
        executionId,
        execution,
        duration,
        outputs: execution.outputs,
        errors: []
      };

      // 缓存结果
      if (result.success) {
        this.cacheManager.set(cacheKey, result);
      }

      this.emitWorkflowComplete(workflow, executionId, duration);
      return result;
    } catch (error) {
      execution.status = 'failed';
      execution.error = {
        message: error instanceof Error ? error.message : String(error),
        timestamp: Date.now()
      };

      const duration = Date.now() - startTime;
      const result: ExecutionResult = {
        success: false,
        workflowId: workflow.id,
        executionId,
        execution,
        duration,
        outputs: {},
        errors: [error instanceof Error ? error.message : String(error)]
      };

      this.emitWorkflowError(workflow, executionId, result);
      return result;
    }
  }

  /**
   * 取消执行
   */
  cancel(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (!execution) return false;

    execution.status = 'cancelled';
    this.logger.info(`Cancelled workflow execution: ${executionId}`);
    return true;
  }

  /**
   * 获取执行实例
   */
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * 注册步骤执行器
   */
  registerStepExecutor(stepType: string, executor: Function): void {
    this.stepExecutors.set(stepType, executor);
  }

  /**
   * 清理已完成的执行
   */
  cleanup(): void {
    const now = Date.now();
    const oneHour = 3600000;
    const executions = Array.from(this.executions.entries());

    for (const [id, execution] of executions) {
      if (execution.completedAt && (now - execution.completedAt) > oneHour) {
        this.executions.delete(id);
      }
    }

    this.logger.info(`Cleaned up old workflow executions`);
  }

  private createExecution(
    executionId: string,
    workflow: Workflow,
    input?: Record<string, unknown>
  ): WorkflowExecution {
    return {
      id: executionId,
      workflowId: workflow.id,
      status: 'running',
      stepStatuses: {},
      variables: { ...workflow.variables, ...input },
      outputs: {},
      startedAt: Date.now()
    };
  }

  private validateWorkflow(workflow: Workflow): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!workflow.id || workflow.id.trim() === '') {
      errors.push('Workflow ID is required');
    }

    if (!workflow.steps || workflow.steps.length === 0) {
      errors.push('Workflow must have at least one step');
    }

    // 验证步骤依赖
    const stepIds = new Set(workflow.steps.map(s => s.id));
    for (const step of workflow.steps) {
      for (const dep of step.dependsOn) {
        if (!stepIds.has(dep)) {
          errors.push(`Step ${step.id} depends on non-existent step: ${dep}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private async executeSteps(workflow: Workflow, execution: WorkflowExecution): Promise<void> {
    const stepMap = new Map(workflow.steps.map(s => [s.id, s]));
    const processed = new Set<string>();

    while (processed.size < workflow.steps.length) {
      let progress = false;

      for (const step of workflow.steps) {
        if (processed.has(step.id)) continue;

        // 检查依赖是否都已完成
        const dependenciesMet = step.dependsOn.every(
          depId =>
            processed.has(depId) &&
            execution.stepStatuses[depId] === 'completed'
        );

        if (!dependenciesMet) continue;

        // 执行步骤
        const result = await this.executeStep(step, execution);
        execution.stepStatuses[step.id] = result.success ? 'completed' : 'failed';

        if (!result.success) {
          throw new Error(`Step ${step.id} failed`);
        }

        // 合并输出
        if (result.output) {
          Object.assign(execution.outputs, result.output);
        }

        processed.add(step.id);
        progress = true;
      }

      if (!progress) {
        throw new Error('Circular dependency or deadlock detected');
      }
    }

    execution.status = 'completed';
    execution.completedAt = Date.now();
  }

  private async executeStep(
    step: WorkflowStep,
    execution: WorkflowExecution
  ): Promise<{ success: boolean; output?: Record<string, unknown> }> {
    this.logger.info(`Executing step: ${step.id} (${step.type})`);

    execution.stepStatuses[step.id] = 'in_progress';
    execution.currentStep = step.id;

    try {
      const executor = this.stepExecutors.get(step.type);
      if (!executor) {
        throw new Error(`No executor registered for step type: ${step.type}`);
      }

      const output = await executor(step.config, execution);

      execution.stepStatuses[step.id] = 'completed';
      return { success: true, output: output as Record<string, unknown> };
    } catch (error) {
      execution.stepStatuses[step.id] = 'failed';
      throw error;
    }
  }

  private emitWorkflowStart(workflow: Workflow, executionId: string): void {
    this.eventBus.emit({
      type: 'workflow.started' as any,
      payload: { workflowId: workflow.id, executionId },
      timestamp: Date.now(),
      source: 'WorkflowEngine',
      id: `event-${Date.now()}`
    });
  }

  private emitWorkflowComplete(workflow: Workflow, executionId: string, duration: number): void {
    this.eventBus.emit({
      type: 'workflow.completed' as any,
      payload: { workflowId: workflow.id, executionId, duration },
      timestamp: Date.now(),
      source: 'WorkflowEngine',
      id: `event-${Date.now()}`
    });
  }

  private emitWorkflowError(workflow: Workflow, executionId: string, result: ExecutionResult): void {
    this.eventBus.emit({
      type: 'workflow.error' as any,
      payload: { workflowId: workflow.id, executionId, errors: result.errors || [] },
      timestamp: Date.now(),
      source: 'WorkflowEngine',
      id: `event-${Date.now()}`
    });
  }

  /**
   * 暂停工作流执行
   */
  pause(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (!execution) {
      this.logger.warn(`Execution not found: ${executionId}`);
      return false;
    }
    if (execution.status === 'running') {
      execution.status = 'paused';
      this.logger.info(`Paused workflow execution: ${executionId}`);
      return true;
    }
    return false;
  }

  /**
   * 恢复工作流执行
   */
  resume(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (!execution) {
      this.logger.warn(`Execution not found: ${executionId}`);
      return false;
    }
    if (execution.status === 'paused') {
      execution.status = 'running';
      this.logger.info(`Resumed workflow execution: ${executionId}`);
      return true;
    }
    return false;
  }

  /**
   * 列出所有执行
   */
  listExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values());
  }
}
