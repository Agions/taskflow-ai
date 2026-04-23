/**
 * Message 类型定义
 * TaskFlow AI v4.0 - Unified Message Types
 */

/**
 * 消息类型
 */
export type MessageType =
  | 'request'
  | 'response'
  | 'notification'
  | 'broadcast'
  | 'error';

/**
 * 消息优先级
 */
export type MessagePriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * 消息
 */
export interface Message<T = unknown> {
  id: string;
  type: MessageType;
  from: string;
  to: string;
  content: string;
  payload?: T;
  timestamp: number;
  priority: MessagePriority;
  ttl?: number;
  replyTo?: string;
  metadata?: Record<string, unknown>;
}

/**
 * 消息队列
 */
export interface MessageQueue {
  enqueue(message: Message): void;
  dequeue(): Message | undefined;
  peek(): Message | undefined;
  clear(): void;
  size(): number;
}

/**
 * 消息总线
 */
export interface MessageBus {
  send(message: Message): void;
  subscribe(pattern: string, handler: MessageHandler): () => void;
  unsubscribe(pattern: string, handler?: MessageHandler): void;
  clear(): void;
}

/**
 * 消息处理器
 */
export type MessageHandler = (message: Message) => void | Promise<void>;
