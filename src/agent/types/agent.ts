/**
 * Agent 核心类型
 */

import { TaskFlowConfig } from '../../types';

/**
 * Agent 配置
 */
export interface AgentConfig {
  mode: 'assisted' | 'autonomous' | 'supervised';
  maxIterations: number;
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

/**
 * 执行上下文
 */
export interface ExecutionContext {
  config: AgentConfig;
  projectPath: string;
  workspacePath: string;
}
