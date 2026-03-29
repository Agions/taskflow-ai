import { getLogger } from '../../utils/logger';
/**
 * 状态机类型定义
 */

import {
  AgentContext,
  AgentConfig,
  TaskPlan,
  ExecutionResult,
  VerificationResult,
  Requirement,
} from '../types';
const logger = getLogger('agent/state-machine/types');


export interface MachineContext extends AgentContext {
  error?: Error;
  config: AgentConfig;
  requirements?: Requirement[];
  currentPlan?: TaskPlan;
}

export type MachineEvent =
  | { type: 'START' }
  | { type: 'PLAN_COMPLETE'; data: TaskPlan }
  | { type: 'PLAN_FAILED'; error: Error }
  | { type: 'EXECUTION_COMPLETE'; data: ExecutionResult }
  | { type: 'EXECUTION_FAILED'; error: Error }
  | { type: 'VERIFICATION_PASS'; data: VerificationResult }
  | { type: 'VERIFICATION_FAIL'; data: VerificationResult; fixTasks?: TaskPlan }
  | { type: 'APPROVED' }
  | { type: 'REJECTED' };

export type AgentState =
  | 'idle'
  | 'planning'
  | 'executing'
  | 'verifying'
  | 'awaitingApproval'
  | 'completed'
  | 'failed';
