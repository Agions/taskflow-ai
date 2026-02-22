/**
 * Agent 核心类型定义
 */

export type AgentStatus = 
  | 'idle' 
  | 'thinking' 
  | 'executing' 
  | 'waiting' 
  | 'reflecting'
  | 'completed' 
  | 'failed';

export type AgentCapability = 
  | 'reasoning' 
  | 'code' 
  | 'search' 
  | 'tool_use' 
  | 'collaboration';

export interface Agent {
  /** Agent ID */
  id: string;
  /** 名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 能力 */
  capabilities: AgentCapability[];
  /** 状态 */
  status: AgentStatus;
  /** 模型配置 */
  model?: string;
  /** 工具列表 */
  tools: string[];
  /** 内存 */
  memory: AgentMemory;
}

export interface AgentMemory {
  /** 短期记忆 */
  shortTerm: MemoryItem[];
  /** 长期记忆 */
  longTerm: MemoryItem[];
  /** 最大短期记忆数 */
  maxShortTerm: number;
}

export interface MemoryItem {
  id: string;
  type: 'observation' | 'thought' | 'action' | 'result' | 'reflection';
  content: string;
  timestamp: number;
  importance: number; // 0-1
}

export interface AgentTask {
  /** 任务 ID */
  id: string;
  /** 任务描述 */
  description: string;
  /** 目标 */
  goal?: string;
  /** 约束条件 */
  constraints?: string[];
  /** 状态 */
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  /** 结果 */
  result?: unknown;
  /** 错误 */
  error?: string;
  /** 创建时间 */
  createdAt: number;
  /** 完成时间 */
  finishedAt?: number;
}

export interface AgentExecution {
  id: string;
  agentId: string;
  task: AgentTask;
  steps: AgentStep[];
  currentStep: number;
  status: AgentStatus;
  startedAt: number;
  finishedAt?: number;
}

export interface AgentStep {
  step: number;
  type: 'thought' | 'action' | 'observation' | 'reflection';
  content: string;
  reasoning?: string;
  tool?: string;
  toolInput?: Record<string, unknown>;
  toolResult?: unknown;
  timestamp: number;
  duration?: number;
}

export interface GoalParserResult {
  goal: string;
  subgoals: string[];
  constraints: string[];
  successCriteria: string[];
  estimatedSteps: number;
}

export interface ReflectionResult {
  success: boolean;
  issues: string[];
  improvements: string[];
  learnedLessons: string[];
  shouldRetry: boolean;
}
