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
