/**
 * 工作流核心类型定义
 */

export type StepType = 
  | 'thought'      // 思维分析
  | 'task'         // 任务执行
  | 'tool'         // 工具调用
  | 'condition'    // 条件分支
  | 'parallel'     // 并行执行
  | 'loop'         // 循环执行
  | 'input'        // 输入
  | 'output';      // 输出

export type StepStatus = 
  | 'pending' 
  | 'running' 
  | 'completed' 
  | 'failed' 
  | 'skipped';

export interface WorkflowStep {
  /** 步骤 ID */
  id: string;
  /** 步骤名称 */
  name: string;
  /** 步骤类型 */
  type: StepType;
  /** 配置 */
  config: StepConfig;
  /** 下一步 (可多条) */
  next?: string[];
  /** 错误处理 */
  errorHandling?: ErrorConfig;
  /** 条件表达式 (仅 condition 类型) */
  condition?: string;
  /** 分支配置 */
  branches?: BranchConfig[];
}

/** 步骤配置 */
export interface StepConfig {
  /** 模型选择 */
  model?: string;
  /** 提示词 */
  prompt?: string;
  /** 工具名称 (tool 类型) */
  tool?: string;
  /** 工具参数 */
  toolInput?: Record<string, unknown>;
  /** 输出键名 */
  outputKey?: string;
  /** 超时时间 (ms) */
  timeout?: number;
  /** 重试次数 */
  retries?: number;
  /** 延迟 (ms) */
  delay?: number;
}

/** 错误处理配置 */
export interface ErrorConfig {
  /** 重试次数 */
  maxRetries?: number;
  /** 重试延迟 */
  retryDelay?: number;
  /** 错误时跳转 */
  onError?: string;
  /** 错误处理步骤 */
  fallback?: string;
}

/** 分支配置 */
export interface BranchConfig {
  /** 分支 ID */
  id: string;
  /** 条件 */
  condition: string;
  /** 步骤 ID */
  stepId: string;
}

/** 工作流定义 */
export interface Workflow {
  /** 工作流 ID */
  id: string;
  /** 工作流名称 */
  name: string;
  /** 版本 */
  version: string;
  /** 描述 */
  description?: string;
  /** 触发器 */
  triggers: Trigger[];
  /** 变量 */
  variables: Record<string, unknown>;
  /** 步骤 */
  steps: WorkflowStep[];
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

/** 触发器 */
export interface Trigger {
  /** 类型 */
  type: 'manual' | 'webhook' | 'schedule' | 'event';
  /** 配置 */
  config?: Record<string, unknown>;
}

/** 工作流执行状态 */
export interface WorkflowExecution {
  /** 执行 ID */
  id: string;
  /** 工作流 ID */
  workflowId: string;
  /** 状态 */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  /** 当前步骤 */
  currentStep?: string;
  /** 步骤状态 */
  stepStatuses: Record<string, StepStatus>;
  /** 变量值 */
  variables: Record<string, unknown>;
  /** 输出 */
  outputs: Record<string, unknown>;
  /** 错误信息 */
  error?: string;
  /** 开始时间 */
  startedAt: number;
  /** 结束时间 */
  finishedAt?: number;
  /** 暂停点 */
  pausedAt?: string;
}

/** 工作流执行结果 */
export interface ExecutionResult {
  success: boolean;
  execution: WorkflowExecution;
  output?: unknown;
  error?: string;
  duration: number;
}

/** 工作流规范 (YAML/JSON) */
export interface WorkflowSpec {
  name: string;
  version?: string;
  description?: string;
  triggers?: Trigger[];
  variables?: Record<string, unknown>;
  steps: StepSpec[];
}

/** 步骤规范 */
export interface StepSpec {
  id: string;
  name?: string;
  type: StepType;
  prompt?: string;
  tool?: string;
  tool_input?: Record<string, unknown>;
  output_key?: string;
  depends_on?: string | string[];
  if?: string;
  on_true?: string[];
  on_false?: string[];
  branches?: Array<{
    condition: string;
    step: string;
  }>;
  retry?: {
    max_attempts?: number;
    delay?: number;
  };
  timeout?: number;
}
