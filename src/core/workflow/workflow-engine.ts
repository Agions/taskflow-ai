/**
 * 性能优化的 WorkflowEngine
 * TaskFlow AI v4.0
 */

import {
  Workflow,
  WorkflowExecution,
  ExecutionResult,
  WorkflowStep,
  WorkflowStatus,
} from '../../types/workflow';
import { Logger } from '../../utils/logger';
import { CacheManager, CacheKeys } from '../cache';
import { getEventBus } from '../events';

// 性能监控统计数据
interface PerformanceMetrics {
  totalExecutions: number;
  cacheHits: number;
  cacheMisses: number;
  averageExecutionTime: number;
  memoryUsage: number;
}

export class WorkflowEngine {
  private logger: Logger;
  private executions: Map<string, WorkflowExecution> = new Map();
  private executionTimestamps: Map<string, number> = new Map(); // 新增：执行时间戳
  private cacheManager: CacheManager;
  private eventBus = getEventBus();
  private stepExecutors: Map<string, Function> = new Map();

  // 性能配置
  private readonly MAX_EXECUTIONS = 1000; // 最大执行实例数
  private readonly EXECUTION_TTL = 3600000; // 1小时TTL
  private readonly CLEANUP_INTERVAL = 300000; // 5分钟清理间隔

  // 性能指标
  private metrics: PerformanceMetrics = {
    totalExecutions: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageExecutionTime: 0,
    memoryUsage: 0
  };

  private cleanupTimer?: NodeJS.Timeout;

  constructor() {
    this.logger = Logger.getInstance('WorkflowEngine');
    this.cacheManager = new CacheManager({
      enabled: true,
      l1: {
        enabled: true,
        maxSize: 200, // 增加缓存大小
        ttl: 900 // 增加TTL
      },
      l2: {
        enabled: true,
        ttl: 86400
      }
    });

    // 启动自动清理
    this.startAutoCleanup();
  }

  /**
   * 执行工作流（性能优化版）
   */
  async execute(workflow: Workflow, input?: Record<string, unknown>): Promise<ExecutionResult> {
    const startTime = Date.now();
    this.metrics.totalExecutions++;

    // 优化：使用工作流ID和输入参数的哈希作为缓存键
    const cacheKey = this.createCacheKey(workflow, input);

    // 尝试从缓存获取
    const cachedResult = this.cacheManager.get<ExecutionResult>(cacheKey);
    if (cachedResult && cachedResult.success) {
      this.metrics.cacheHits++;
      this.logger.debug(`Workflow cache hit: ${workflow.name}`);
      this.emitWorkflowComplete(workflow, cachedResult.execution?.id || '', Date.now() - startTime);
      return { ...cachedResult, duration: Date.now() - startTime };
    }

    this.metrics.cacheMisses++;

    // 优化：使用更高效的ID生成
    const executionId = this.generateExecutionId();
    const execution = this.createExecution(executionId, workflow, input);

    // 优化：立即设置时间戳，避免后续查找
    this.executions.set(executionId, execution);
    this.executionTimestamps.set(executionId, Date.now());

    this.logger.info(`Starting workflow: ${workflow.name} (${executionId})`);

    try {
      // 验证工作流
      const validation = this.validateWorkflow(workflow);
      if (!validation.valid) {
        throw new Error(`Workflow validation failed: ${validation.errors.join(', ')}`);
      }

      // 异步发送启动事件（避免阻塞）
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

      // 更新性能指标
      this.updateMetrics(duration);

      // 异步发送完成事件
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
    this.executionTimestamps.delete(executionId); // 清理时间戳
    this.logger.info(`Cancelled workflow execution: ${executionId}`);
    return true;
  }

  /**
   * 获取执行实例
   */
  getExecution(executionId: string): WorkflowExecution | undefined {
    const timestamp = this.executionTimestamps.get(executionId);
    if (timestamp && Date.now() - timestamp > this.EXECUTION_TTL) {
      // 过期的执行，自动清理
      this.executions.delete(executionId);
      this.executionTimestamps.delete(executionId);
      return undefined;
    }
    return this.executions.get(executionId);
  }

  /**
   * 优化：创建基于输入的缓存键
   */
  private createCacheKey(workflow: Workflow, input?: Record<string, unknown>): string {
    if (!input || Object.keys(input).length === 0) {
      return CacheKeys.workflow(workflow.id);
    }

    // 简化键生成，避免昂贵的序列化
    const inputKey = Object.keys(input).sort().map(key =>
      `${key}:${String(input[key]).slice(0, 50)}`
    ).join('|');
    return `workflow:${workflow.id}:${inputKey}`;
  }

  /**
   * 优化：高效的ID生成
   */
  private generateExecutionId(): string {
    // 使用时间戳和随机数的组合，比单纯时间戳性能更好
    return `exec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * 自动清理机制
   */
  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * 清理已完成的执行
   */
  cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    // 按时间戳清理过期执行
    for (const [id, timestamp] of this.executionTimestamps.entries()) {
      if (now - timestamp > this.EXECUTION_TTL) {
        this.executions.delete(id);
        this.executionTimestamps.delete(id);
        cleanedCount++;
      }
    }

    // 超出限制时清理最旧的
    if (this.executions.size > this.MAX_EXECUTIONS) {
      const entries = Array.from(this.executionTimestamps.entries())
        .sort((a, b) => a[1] - b[1]);

      const toRemove = entries.slice(0, entries.length - this.MAX_EXECUTIONS);
      for (const [id] of toRemove) {
        this.executions.delete(id);
        this.executionTimestamps.delete(id);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.info(`Cleaned up ${cleanedCount} workflow executions`);
    }

    // 更新内存使用统计
    this.updateMemoryMetrics();
  }

  /**
   * 更新性能指标
   */
  private updateMetrics(duration: number): void {
    // 使用移动平均计算平均时间
    this.metrics.averageExecutionTime =
      this.metrics.averageExecutionTime * 0.9 + duration * 0.1;
  }

  /**
   * 更新内存指标
   */
  private updateMemoryMetrics(): void {
    if (global.gc) {
      global.gc();
    }
    this.metrics.memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
  }

  /**
   * 获取性能指标
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 获取缓存命中率
   */
  getCacheHitRate(): number {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    return total === 0 ? 0 : this.metrics.cacheHits / total;
  }

  /**
   * 销毁引擎
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.executions.clear();
    this.executionTimestamps.clear();
    this.logger.info('WorkflowEngine destroyed');
  }

  // 以下方法保持原有实现...
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

    const stepIds = new Set(workflow.steps.map(s => s.id));
    for (const step of workflow.steps) {
      for (const dep of step.dependsOn) {
        if (!stepIds.has(dep)) {
          errors.push(`Step ${step.id} depends on non-existent step: ${dep}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private async executeSteps(workflow: Workflow, execution: WorkflowExecution): Promise<void> {
    const stepMap = new Map(workflow.steps.map(s => [s.id, s]));
    const processed = new Set<string>();

    while (processed.size < workflow.steps.length) {
      let progress = false;

      for (const step of workflow.steps) {
        if (processed.has(step.id)) continue;

        const dependenciesMet = step.dependsOn.every(
          depId =>
            processed.has(depId) &&
            execution.stepStatuses[depId] === 'completed'
        );

        if (!dependenciesMet) continue;

        const result = await this.executeStep(step, execution);
        execution.stepStatuses[step.id] = result.success ? 'completed' : 'failed';

        if (!result.success) {
          throw new Error(`Step ${step.id} failed`);
        }

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

  // 优化：异步事件发送
  private emitWorkflowStart(workflow: Workflow, executionId: string): void {
    setImmediate(() => {
      this.eventBus.emit({
        type: 'workflow.started' as any,
        payload: { workflowId: workflow.id, executionId },
        timestamp: Date.now(),
        source: 'WorkflowEngine',
        id: `event-${Date.now()}`
      });
    });
  }

  private emitWorkflowComplete(workflow: Workflow, executionId: string, duration: number): void {
    setImmediate(() => {
      this.eventBus.emit({
        type: 'workflow.completed' as any,
        payload: { workflowId: workflow.id, executionId, duration },
        timestamp: Date.now(),
        source: 'WorkflowEngine',
        id: `event-${Date.now()}`
      });
    });
  }

  private emitWorkflowError(workflow: Workflow, executionId: string, result: ExecutionResult): void {
    setImmediate(() => {
      this.eventBus.emit({
        type: 'workflow.error' as any,
        payload: { workflowId: workflow.id, executionId, errors: result.errors || [] },
        timestamp: Date.now(),
        source: 'WorkflowEngine',
        id: `event-${Date.now()}`
      });
    });
  }

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

  registerStepExecutor(stepType: string, executor: Function): void {
    this.stepExecutors.set(stepType, executor);
  }

  listExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values());
  }
}
