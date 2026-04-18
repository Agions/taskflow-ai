/**
 * Multi-Agent System - Type Definitions
 */

import { ChatMessage } from '../ai/adapter';

/**
 * 协调模式
 */
export type CoordinationMode = 'sequential' | 'hierarchical' | 'parallel';

/**
 * 上下文共享策略
 */
export type SharingStrategy = 'full' | 'minimal' | 'contextual';

/**
 * Agent 角色定义
 */
export interface AgentRole {
  /** 唯一标识 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 角色描述 */
  description: string;
  /** 使用的模型 */
  model: string;
  /** 可用工具列表 */
  tools: string[];
  /** 系统指令/提示词 */
  instructions: string;
  /** 输出 schema (可选) */
  outputSchema?: Record<string, unknown>;
  /** 优先级 (用于 hierarchical 模式) */
  priority?: number;
}

/**
 * Agent 状态
 */
export type AgentStatus = 'idle' | 'thinking' | 'executing' | 'waiting' | 'completed' | 'error';

/**
 * 单个 Agent 实例
 */
export interface Agent {
  id: string;
  role: AgentRole;
  status: AgentStatus;
  messages: AgentMessage[];
  context: Record<string, unknown>;
  createdAt: number;
  lastActiveAt: number;
}

/**
 * 团队配置
 */
export interface CrewConfig {
  /** 角色列表 */
  roles: AgentRole[];
  /** 协调模式 */
  coordination: CoordinationMode;
  /** 上下文共享策略 */
  sharingStrategy?: SharingStrategy;
  /** 最大迭代次数 */
  maxIterations?: number;
  /** 是否详细输出 */
  verbose?: boolean;
  /** 超时时间 (ms) */
  timeout?: number;
}

/**
 * 团队状态
 */
export type CrewStatus = 'created' | 'running' | 'paused' | 'completed' | 'failed' | 'stopped';

/**
 * 团队信息
 */
export interface Crew {
  id: string;
  name: string;
  config: CrewConfig;
  agents: Map<string, Agent>;
  status: CrewStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  sharedContext: Record<string, unknown>;
}

/**
 * 团队执行结果
 */
export interface CrewResult {
  crewId: string;
  success: boolean;
  finalMessage?: AgentMessage;
  allMessages: AgentMessage[];
  iterations: number;
  duration: number;
  errors: string[];
}

/**
 * Agent 消息
 */
export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'agent' | 'system';
  agentId?: string;
  agentName?: string;
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  reasoning?: ReasoningStep[];
  metadata?: Record<string, unknown>;
}

/**
 * 附件
 */
export interface Attachment {
  type: 'text' | 'file' | 'image' | 'code';
  content: string;
  name?: string;
  mimeType?: string;
}

/**
 * 推理步骤 (Chain of Thought)
 */
export interface ReasoningStep {
  step: number;
  thought: string;
  action?: string;
  observation?: string;
}

/**
 * 任务分配
 */
export interface TaskAssignment {
  taskId: string;
  taskDescription: string;
  assignedAgentId?: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed';
  result?: AgentMessage;
  dependencies: string[];
}

/**
 * 协调器事件
 */
export interface CoordinatorEvent {
  type: 'task_assigned' | 'task_completed' | 'agent_status_changed' | 'context_shared' | 'iteration_complete';
  crewId: string;
  data: Record<string, unknown>;
  timestamp: number;
}

/**
 * 流式事件
 */
export interface StreamEvent {
  type: 'message' | 'status' | 'error' | 'complete';
  agentId?: string;
  agentName?: string;
  content?: string;
  status?: AgentStatus;
  role?: 'user' | 'assistant' | 'agent' | 'system';
  error?: string;
  timestamp: number;
}
