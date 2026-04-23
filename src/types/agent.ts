/**
 * Agent 核心类型定义
 * TaskFlow AI v4.0 - Unified Agent Types
 * 合并了原有的 src/agent/types/ 和 src/core/agent/types.ts
 */

/**
 * Agent 状态
 */
export type AgentStatus =
  | 'idle'
  | 'thinking'
  | 'executing'
  | 'waiting'
  | 'reflecting'
  | 'completed'
  | 'failed';

/**
 * Agent 能力
 */
export type AgentCapability =
  | 'reasoning'
  | 'code'
  | 'search'
  | 'tool_use'
  | 'collaboration'
  | 'planning'
  | 'verification';

/**
 * Agent 记忆配置
 */
export interface AgentMemoryConfig {
  maxShortTerm: number;
  maxLongTerm: number;
  importanceThreshold?: number;
}

/**
 * Agent 配置
 */
export interface AgentConfig {
  id: string;
  name: string;
  description?: string;
  capabilities: AgentCapability[];
  model?: string;
  tools: string[];
  memory: AgentMemoryConfig;
  goalParser?: GoalParser;
  reflectionEnabled?: boolean;
  maxStepsPerGoal?: number;
  customSettings?: Record<string, unknown>;
}

/**
 * Goal Parser 接口
 */
export interface GoalParser {
  parse(goal: string): Goal[];
  validate(goal: string): ValidationResult;
}

/**
 * Goal 定义
 */
export interface Goal {
  id: string;
  description: string;
  priority: number;
  subgoals: Subgoal[];
}

/**
 * Subgoal 定义
 */
export interface Subgoal {
  id: string;
  description: string;
  type: 'action' | 'observation' | 'thought';
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

/**
 * Agent 任务
 */
export interface AgentTask {
  id: string;
  description: string;
  goal?: string;
  constraints?: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: unknown;
  error?: string;
  createdAt: number;
  finishedAt?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Agent 状态
 */
export interface AgentState {
  status: AgentStatus;
  currentGoal?: Goal;
  currentTask?: AgentTask;
  messages: AgentMessage[];
  memory: AgentMemory;
  metrics: AgentMetrics;
}

/**
 * Agent 消息
 */
export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Agent 记忆
 */
export interface AgentMemory {
  shortTerm: MemoryItem[];
  longTerm: MemoryItem[];
  maxShortTerm: number;
  maxLongTerm: number;
}

/**
 * 记忆项
 */
export interface MemoryItem {
  id: string;
  type: 'observation' | 'thought' | 'action' | 'result' | 'reflection';
  content: string;
  timestamp: number;
  importance: number;
}

/**
 * Agent 指标
 */
export interface AgentMetrics {
  tasksCompleted: number;
  tasksFailed: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
}

/**
 * Task 结果
 */
export interface TaskResult {
  taskId: string;
  success: boolean;
  output?: string;
  error?: string;
  duration: number;
  artifacts?: string[];
  steps: AgentStep[];
}

/**
 * Agent 步骤
 */
export interface AgentStep {
  step: number;
  type: 'thought' | 'action' | 'observation' | 'reflection';
  content: string;
  timestamp: number;
  result?: unknown;
}

/**
 * Agent Runtime 接口
 * 统一的 Agent 运行时接口，替代原有的 AgentCore
 */
export interface AgentRuntime {
  /** Agent ID */
  id: string;

  /** 执行任务 */
  execute(task: AgentTask): Promise<TaskResult>;

  /** 获取当前状态 */
  getState(): AgentState;

  /** 获取配置 */
  getConfig(): AgentConfig;

  /** 更新配置 */
  updateConfig(config: Partial<AgentConfig>): Promise<void>;

  /** 重置 Agent 状态 */
  reset(): Promise<void>;

  /** 销毁 Agent */
  destroy(): Promise<void>;

  /** 添加消息到上下文 */
  addMessage(message: AgentMessage): void;

  /** 获取消息历史 */
  getMessages(limit?: number): AgentMessage[];
}

/**
 * Agent 工厂接口
 */
export type AgentFactory = (config: AgentConfig) => Promise<AgentRuntime>;

/**
 * Agent 定义（用于注册自定义 Agent）
 */
export interface AgentDefinition {
  type: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  defaultConfig: Partial<AgentConfig>;
  factory: AgentFactory;
  validator?: AgentValidator;
}

/**
 * Agent 验证器
 */
export type AgentValidator = (config: AgentConfig) => ValidationResult;
