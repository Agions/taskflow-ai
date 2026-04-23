/**
 * EventBus - 事件总线实现
 * TaskFlow AI v4.0
 */

import {
  EventBus as IEventBus,
  Event,
  EventHandler,
  TaskFlowEvent,
  EventListenerConfig
} from '../../types/event';
import { Logger } from '../utils/logger';

/**
 * 事件总线实现
 */
export class EventBus implements IEventBus {
  private logger: Logger;
  private listeners: Map<string, EventListenerConfig[]> = new Map();
  private listenerIdCounter = 0;
  private eventHistory: Event[] = [];
  private historyMaxSize = 100;

  constructor(logger?: Logger) {
    this.logger = logger || Logger.getInstance('EventBus');
  }

  /**
   * 订阅事件
   */
  on<T = unknown>(event: string | TaskFlowEvent, handler: EventHandler<T>): () => void {
    const config: EventListenerConfig = {
      handler,
      once: false,
      priority: 0,
      id: `listener-${this.listenerIdCounter++}`
    };

    this.addListener(event, config);

    return () => this.off(event, handler);
  }

  /**
   * 订阅事件（只触发一次）
   */
  once<T = unknown>(event: string | TaskFlowEvent, handler: EventHandler<T>): () => void {
    const config: EventListenerConfig = {
      handler,
      once: true,
      priority: 0,
      id: `listener-${this.listenerIdCounter++}`
    };

    this.addListener(event, config);

    return () => this.off(event, handler);
  }

  /**
   * 取消订阅
   */
  off(event: string | TaskFlowEvent, handler?: EventHandler): void {
    const listeners = this.listeners.get(event.toString());
    if (!listeners) return;

    if (handler) {
      const index = listeners.findIndex(l => l.handler === handler);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    } else {
      listeners.length = 0;
    }

    if (listeners.length === 0) {
      this.listeners.delete(event.toString());
    }
  }

  /**
   * 发送事件
   */
  emit<T = unknown>(event: Event<T>): void {
    // 记录历史
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.historyMaxSize) {
      this.eventHistory.shift();
    }

    // 获取监听器
    const listeners = this.listeners.get(event.type.toString());
    if (!listeners) return;

    // 按优先级排序
    const sortedListeners = [...listeners].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // 触发监听器
    for (const listener of sortedListeners) {
      try {
        listener.handler(event);

        // 如果是 once，移除监听器
        if (listener.once) {
          this.off(event.type, listener.handler);
        }
      } catch (error) {
        this.logger.error(
          `Error in event handler for ${event.type}:`,
          { error, listenerId: listener.id }
        );
      }
    }
  }

  /**
   * 清空所有监听器
   */
  clear(): void {
    this.listeners.clear();
    this.eventHistory = [];
    this.logger.info('Cleared all event listeners');
  }

  /**
   * 获取监听器数量
   */
  listenerCount(event: string | TaskFlowEvent): number {
    const listeners = this.listeners.get(event.toString());
    return listeners ? listeners.length : 0;
  }

  /**
   * 添加监听器
   */
  private addListener(event: string | TaskFlowEvent, config: EventListenerConfig): void {
    const eventName = event.toString();
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)!.push(config);
  }

  /**
   * 获取事件历史
   */
  getHistory(): Event[] {
    return [...this.eventHistory];
  }
}

/**
 * 单例实例
 */
let eventBusInstance: EventBus | null = null;

export function getEventBus(): EventBus {
  if (!eventBusInstance) {
    eventBusInstance = new EventBus();
  }
  return eventBusInstance;
}

export function resetEventBus(): void {
  eventBusInstance = null;
}
