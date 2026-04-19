/**
 * EventBus - 事件总线实现
 * 支持同步/异步发布、订阅、主题通配符、中间件
 */

import { getLogger } from '../../utils/logger';
import { Event, EventHandler, Subscription, TaskFlowEvent } from './event-types';

const logger = getLogger('core/events/bus');

interface HandlerEntry {
  handler: EventHandler;
  once: boolean;
  pattern?: string;
}

/**
 * 事件总线
 */
export class EventBus {
  private handlers: Map<TaskFlowEvent | string, Set<HandlerEntry>> = new Map();
  private globalHandlers: Set<HandlerEntry> = new Set();
  private middleware: Array<(event: Event) => Event | Promise<Event>> = [];
  private eventHistory: Event[] = [];
  private maxHistorySize: number;
  private enableLogging: boolean;

  constructor(
    options: {
      maxHistorySize?: number;
      enableLogging?: boolean;
    } = {}
  ) {
    this.maxHistorySize = options.maxHistorySize ?? 1000;
    this.enableLogging = options.enableLogging ?? false;
  }

  /**
   * 添加中间件
   */
  use(middleware: (event: Event) => Event | Promise<Event>): void {
    this.middleware.push(middleware);
  }

  /**
   * 同步发布事件
   */
  emit<T>(event: Event<T>): void {
    this.publish(event, false);
  }

  /**
   * 异步发布事件
   */
  async emitAsync<T>(event: Event<T>): Promise<void> {
    this.publish(event, true);
  }

  /**
   * 发布事件
   */
  private async publish<T>(event: Event<T>, async: boolean): Promise<void> {
    // 应用中间件
    let processedEvent: Event = event;
    for (const mw of this.middleware) {
      try {
        processedEvent = await mw(processedEvent);
      } catch (error) {
        logger.error('中间件处理错误', error);
      }
    }

    // 记录历史
    this.recordHistory(processedEvent);

    // 记录日志
    if (this.enableLogging) {
      logger.debug(`事件发布: ${processedEvent.type}`, processedEvent);
    }

    // 获取对应的事件处理器
    const handlers = this.getHandlers(processedEvent.type);

    // 调用处理器
    for (const entry of Array.from(handlers)) {
      try {
        if (async) {
          await entry.handler(processedEvent);
        } else {
          entry.handler(processedEvent);
        }
      } catch (error) {
        logger.error(`事件处理器错误: ${processedEvent.type}`, error);
      }

      // 如果是 once 处理器，移除
      if (entry.once) {
        handlers.delete(entry);
      }
    }
  }

  /**
   * 订阅事件
   */
  on<T>(event: TaskFlowEvent | string, handler: EventHandler<T>): Subscription {
    return this.addSubscription(event, handler as EventHandler, false);
  }

  /**
   * 订阅一次性事件
   */
  once<T>(event: TaskFlowEvent | string, handler: EventHandler<T>): Subscription {
    return this.addSubscription(event, handler as EventHandler, true);
  }

  /**
   * 添加订阅
   */
  private addSubscription(
    event: TaskFlowEvent | string,
    handler: EventHandler,
    once: boolean
  ): Subscription {
    let handlers = this.handlers.get(event);
    if (!handlers) {
      handlers = new Set();
      this.handlers.set(event, handlers);
    }

    const entry: HandlerEntry = { handler, once };
    handlers.add(entry);

    return {
      unsubscribe: () => {
        handlers?.delete(entry);
      },
      event,
      handler,
    } as Subscription;
  }

  /**
   * 订阅所有事件
   */
  onAny(handler: EventHandler): Subscription {
    const entry: HandlerEntry = { handler, once: false };
    this.globalHandlers.add(entry);

    return {
      unsubscribe: () => {
        this.globalHandlers.delete(entry);
      },
      event: '*' as any,
      handler,
    } as Subscription;
  }

  /**
   * 获取事件处理器
   */
  private getHandlers(eventType: string): Set<HandlerEntry> {
    const handlers = new Set<HandlerEntry>();

    // 添加全局处理器
    for (const entry of this.globalHandlers) {
      handlers.add(entry);
    }

    // 添加精确匹配的处理器
    const exact = this.handlers.get(eventType);
    if (exact) {
      for (const entry of exact) {
        handlers.add(entry);
      }
    }

    // 添加通配符匹配的处理器
    const wildcard = this.handlers.get('*');
    if (wildcard) {
      for (const entry of wildcard) {
        handlers.add(entry);
      }
    }

    // 添加前缀匹配的处理器
    for (const [pattern, entries] of this.handlers.entries()) {
      if (pattern !== '*' && pattern.endsWith('*')) {
        const prefix = pattern.slice(0, -1);
        if (eventType.startsWith(prefix)) {
          for (const entry of entries) {
            handlers.add(entry);
          }
        }
      }
    }

    return handlers;
  }

  /**
   * 取消订阅
   */
  off(event?: TaskFlowEvent | string): void {
    if (event) {
      this.handlers.delete(event);
    } else {
      this.handlers.clear();
      this.globalHandlers.clear();
    }
  }

  /**
   * 获取事件历史
   */
  getHistory(eventType?: TaskFlowEvent | string): Event[] {
    if (eventType) {
      return this.eventHistory.filter(e => e.type === eventType);
    }
    return [...this.eventHistory];
  }

  /**
   * 清除事件历史
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * 获取订阅统计
   */
  getStats(): {
    totalHandlers: number;
    eventTypes: number;
    historySize: number;
  } {
    let totalHandlers = 0;
    for (const entries of this.handlers.values()) {
      totalHandlers += entries.size;
    }
    totalHandlers += this.globalHandlers.size;

    return {
      totalHandlers,
      eventTypes: this.handlers.size,
      historySize: this.eventHistory.length,
    };
  }

  /**
   * 记录历史
   */
  private recordHistory(event: Event): void {
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }
}

// 全局事件总线实例
let globalEventBus: EventBus | null = null;

/**
 * 获取全局事件总线
 */
export function getEventBus(): EventBus {
  if (!globalEventBus) {
    globalEventBus = new EventBus({
      maxHistorySize: 1000,
      enableLogging: process.env.DEBUG?.includes('events') ?? false,
    });
  }
  return globalEventBus;
}

/**
 * 创建新事件总线
 */
export function createEventBus(options?: {
  maxHistorySize?: number;
  enableLogging?: boolean;
}): EventBus {
  return new EventBus(options);
}
