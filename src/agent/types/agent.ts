import { getLogger } from '../../utils/logger';
/**
 * Agent 核心类型
 */

import { TaskFlowConfig } from '../../types';
import { Task, TaskPlan, TaskPriority, TaskType } from './task';
import { PRDDocument, Feature } from './prd';
import { Tool } from './tool';
import { ExecutionResult, ExecutionSummary } from './execution';
import { VerificationResult, VerificationCheck } from './verification';
import { ActionHistory } from './history';
const logger = getLogger('agent/types/agent');


/**
 * Agent 配置
 */
export interface AgentConfig {
  mode: 'assisted' | 'autonomous' | 'supervised';
  maxIterations: number;
  maxRetries?: number;
  autoFix: boolean;
  approvalRequired: string[];
  continueOnError: boolean;
  timeout: number;
}

/**
 * Agent 状态
 */
export type AgentStatus =
  | 'idle'
  | 'planning'
  | 'executing'
  | 'verifying'
  | 'awaitingApproval'
  | 'completed'
  | 'failed';

/**
 * Agent 状态对象
 */
export interface AgentState {
  status: AgentStatus;
  currentTask: Task | null;
  iteration: number;
  context: AgentContext;
  history: ActionHistory[];
  error?: Error;
  startTime: Date;
  endTime?: Date;
}

/**
 * Agent 上下文
 */
export interface AgentContext {
  prd: PRDDocument;
  projectConfig: TaskFlowConfig;
  availableTools: Tool[];
  constraints: string[];
  taskPlan?: TaskPlan;
  executionResult?: ExecutionResult;
  verificationResult?: VerificationResult;
}

/**
 * Agent 会话
 */
export interface AgentSession {
  id: string;
  state: AgentState;
  config: AgentConfig;
  createdAt: Date;
  updatedAt: Date;
}

// ExecutionContext 定义在 execution.ts 中
