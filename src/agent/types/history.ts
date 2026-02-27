/**
 * 历史记录相关类型
 */

/**
 * 操作历史
 */
export interface ActionHistory {
  id: string;
  type: ActionType;
  timestamp: Date;
  data: unknown;
  result: 'success' | 'failure';
  message: string;
}

/**
 * 操作类型
 */
export type ActionType =
  | 'plan'
  | 'execute'
  | 'verify'
  | 'fix'
  | 'approve'
  | 'reject';

/**
 * Agent 事件
 */
export type AgentEvent =
  | { type: 'START' }
  | { type: 'PLAN_COMPLETE'; data: any }
  | { type: 'PLAN_FAILED'; error: Error }
  | { type: 'EXECUTION_COMPLETE'; data: any }
  | { type: 'EXECUTION_FAILED'; error: Error }
  | { type: 'VERIFICATION_PASS'; data: any }
  | { type: 'VERIFICATION_FAIL'; data: any }
  | { type: 'APPROVED' }
  | { type: 'REJECTED' };
