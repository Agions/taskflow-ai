/**
 * Event 类型定义
 * TaskFlow AI v4.0 - Unified Event Types
 */

/**
 * 事件类型枚举
 */
export enum TaskFlowEvent {
  // Agent 事件
  AGENT_CREATED = 'agent.created',
  AGENT_STARTED = 'agent.started',
  AGENT_COMPLETED = 'agent.completed',
  AGENT_FAILED = 'agent.failed',
  AGENT_DESTROYED = 'agent.destroyed',

  // Task 事件
  TASK_CREATED = 'task.created',
  TASK_STARTED = 'task.started',
  TASK_COMPLETED = 'task.completed',
  TASK_FAILED = 'task.failed',

  // Workflow 事件
  WORKFLOW_STARTED = 'workflow.started',
  WORKFLOW_COMPLETED = 'workflow.completed',
  WORKFLOW_FAILED = 'workflow.failed',
  WORKFLOW_PAUSED = 'workflow.paused',
  WORKFLOW_RESUMED = 'workflow.resumed',

  // Plugin 事件
  PLUGIN_LOADED = 'plugin.loaded',
  PLUGIN_UNLOADED = 'plugin.unloaded',
  PLUGIN_ERROR = 'plugin.error',

  // 系统事件
  SYSTEM_INIT = 'system.init',
  SYSTEM_SHUTDOWN = 'system.shutdown',

  // 缓存事件
  CACHE_HIT = 'cache.hit',
  CACHE_MISS = 'cache.miss',

  // AI 事件
  AI_REQUEST = 'ai.request',
  AI_RESPONSE = 'ai.response',
  AI_ERROR = 'ai.error',
}

/**
 * 事件
 */
export interface Event<T = unknown> {
  type: string | TaskFlowEvent;
  payload?: T;
  timestamp: number;
  source: string;
  id: string;
  correlationId?: string;
}

/**
 * 事件处理器
 */
export type EventHandler<T = unknown> = (event: Event<T>) => void | Promise<void>;

/**
 * 事件监听器配置
 */
export interface EventListenerConfig {
  id: string;
  handler: EventHandler;
  once?: boolean;
  priority?: number;
}

/**
 * 事件总线
 */
export interface EventBus {
  on<T = unknown>(event: string | TaskFlowEvent, handler: EventHandler<T>): () => void;
  once<T = unknown>(event: string | TaskFlowEvent, handler: EventHandler<T>): () => void;
  off(event: string | TaskFlowEvent, handler?: EventHandler): void;
  emit<T = unknown>(event: Event<T>): void;
  clear(): void;
  listenerCount(event: string | TaskFlowEvent): number;
}

/**
 * 事件订阅
 */
export interface EventSubscription {
  id: string;
  event: string;
  handler: EventHandler;
  once: boolean;
}

/**
 * AI 请求载荷
 */
export interface AIRequestPayload {
  modelId: string;
  modelName: string;
  promptLength: number;
  cacheKey: string;
}

/**
 * AI 响应载荷
 */
export interface AIResponsePayload {
  modelId: string;
  modelName: string;
  responseLength: number;
  duration: number;
  cached: boolean;
  tokens?: number | { prompt: number; completion: number; total: number };
  cacheHit?: boolean;
  cost?: number;
}

/**
 * Workflow 事件载荷
 */
export interface WorkflowEventPayload {
  workflowId: string;
  executionId: string;
  status: string;
  timestamp: number;
}
