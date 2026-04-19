/**
 * TaskFlow 事件类型定义
 */

/**
 * TaskFlow 事件枚举
 */
export enum TaskFlowEvent {
  // 工作流事件
  WORKFLOW_START = 'workflow:start',
  WORKFLOW_COMPLETE = 'workflow:complete',
  WORKFLOW_ERROR = 'workflow:error',
  WORKFLOW_PAUSE = 'workflow:pause',
  WORKFLOW_RESUME = 'workflow:resume',

  // 步骤事件
  STEP_START = 'step:start',
  STEP_PROGRESS = 'step:progress',
  STEP_COMPLETE = 'step:complete',
  STEP_ERROR = 'step:error',
  STEP_SKIP = 'step:skip',

  // Agent 事件
  AGENT_THINKING = 'agent:thinking',
  AGENT_TOOL_CALL = 'agent:tool-call',
  AGENT_RESPONSE = 'agent:response',

  // AI 事件
  AI_REQUEST = 'ai:request',
  AI_RESPONSE = 'ai:response',
  AI_STREAM_CHUNK = 'ai:stream-chunk',
  AI_ERROR = 'ai:error',

  // 缓存事件
  CACHE_HIT = 'cache:hit',
  CACHE_MISS = 'cache:miss',

  // 系统事件
  SYSTEM_ERROR = 'system:error',
}

/**
 * 事件接口
 */
export interface Event<T = unknown> {
  type: TaskFlowEvent;
  payload: T;
  timestamp: number;
  source: string;
  correlationId?: string;
}

/**
 * 事件处理器类型
 */
export type EventHandler<T = unknown> = (event: Event<T>) => void | Promise<void>;

/**
 * 订阅接口
 */
export interface Subscription {
  unsubscribe(): void;
  readonly event: TaskFlowEvent;
  readonly handler: EventHandler;
}

/**
 * 工作流事件载荷
 */
export interface WorkflowEventPayload {
  workflowId: string;
  workflowName: string;
  executionId: string;
  duration?: number;
  error?: string;
}

/**
 * 步骤事件载荷
 */
export interface StepEventPayload {
  workflowId: string;
  executionId: string;
  stepId: string;
  stepName: string;
  progress?: number; // 0-100
  duration?: number;
  error?: string;
}

/**
 * AI 请求事件载荷
 */
export interface AIRequestPayload {
  modelId: string;
  modelName: string;
  promptLength: number;
  cacheKey?: string;
  cacheHit?: boolean;
}

/**
 * AI 响应事件载荷
 */
export interface AIResponsePayload {
  modelId: string;
  modelName: string;
  responseLength: number;
  duration: number;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  cacheHit: boolean;
  cost: number;
}

/**
 * 缓存事件载荷
 */
export interface CacheEventPayload {
  cacheType: 'l1' | 'l2';
  key: string;
  ttl?: number;
  size?: number;
}
