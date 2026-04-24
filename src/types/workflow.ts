/**
 * Workflow 类型定义
 * TaskFlow AI v4.0 - Unified Workflow Types
 */

/**
 * Workflow 状态
 */
export type WorkflowStatus = 'created' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

/**
 * Step 状态
 */
export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';

/**
 * Step 类型
 */
export type StepType = 'task' | 'condition' | 'loop' | 'parallel' | 'merge';

/**
 * Workflow
 */
export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  variables: Record<string, unknown>;
  status: WorkflowStatus;
  created: number;
  updated?: number;
  version?: string;
  tags?: string[];
}

/**
 * Workflow Step
 */
export interface WorkflowStep {
  id: string;
  type: StepType;
  name: string;
  description?: string;
  config: StepConfig;
  dependsOn: string[];
  retryPolicy?: RetryPolicy;
  timeout?: number;
}

/**
 * Step 配置
 */
export type StepConfig = TaskStepConfig | ConditionStepConfig | LoopStepConfig | ParallelStepConfig;

/**
 * Task Step 配置
 */
export interface TaskStepConfig {
  taskId: string;
  input: Record<string, unknown>;
}

/**
 * Condition Step 配置
 */
export interface ConditionStepConfig {
  expression: string;
  trueBranch: string;
  falseBranch?: string;
}

/**
 * Loop Step 配置
 */
export interface LoopStepConfig {
  iterations: number;
  itemVariable: string;
  steps: WorkflowStep[];
}

/**
 * Parallel Step 配置
 */
export interface ParallelStepConfig {
  steps: WorkflowStep[];
  mergeStrategy?: 'first' | 'last' | 'all' | 'any';
}

/**
 * 重试策略
 */
export interface RetryPolicy {
  maxAttempts: number;
  backoffMs: number;
  exponentialBackoff: boolean;
}

/**
 * Workflow 执行
 */
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: WorkflowStatus;
  currentStep?: string;
  stepStatuses: Record<string, StepStatus>;
  variables: Record<string, unknown>;
  outputs: Record<string, unknown>;
  startedAt: number;
  completedAt?: number;
  finishedAt?: number;
  duration?: number;
  error?: WorkflowError;
}

/**
 * Workflow 错误
 */
export interface WorkflowError {
  stepId?: string;
  message: string;
  stack?: string;
  timestamp: number;
}

/**
 * 执行结果 (兼容旧代码)
 * @deprecated 使用 WorkflowExecution 替代
 */
export interface ExecutionResult {
  success: boolean;
  workflowId: string;
  executionId: string;
  execution?: WorkflowExecution;
  outputs?: Record<string, unknown>;
  errors?: string[];
  error?: WorkflowError;
  duration?: number;
}

/**
 * Workflow 节点执行器
 * 用于注册自定义工作流节点
 */
export type NodeExecutor = (
  input: Record<string, unknown>,
  context: NodeContext
) => Promise<NodeOutput>;

/**
 * 节点上下文
 */
export interface NodeContext {
  nodeId: string;
  workflowId: string;
  executionId: string;
  variables: Record<string, unknown>;
  metadata: Record<string, unknown>;
  logger: WorkflowLogger;
}

/**
 * 节点输出
 */
export interface NodeOutput {
  success: boolean;
  output?: Record<string, unknown>;
  error?: string;
  nextSteps?: string[];
}

/**
 * Workflow 日志器
 */
export interface WorkflowLogger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
}

/**
 * Workflow 节点定义
 * 用于注册自定义工作流节点
 */
export interface WorkflowNodeDefinition {
  type: string;
  name: string;
  description: string;
  parallelizable?: boolean;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  executor: NodeExecutor;
}
