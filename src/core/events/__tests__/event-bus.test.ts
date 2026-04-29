import { EventBus, Event, EventHandler, TaskFlowEvent } from '../event-bus';
import { Logger } from '../../../utils/logger';

describe('EventBus', () => {
  let eventBus: EventBus;
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  } as unknown as Logger;

  beforeEach(() => {
    eventBus = new EventBus(mockLogger);
  });

  it('should subscribe to an event', () => {
    const handler: EventHandler = jest.fn();
    const unsubscribe = eventBus.on(TaskFlowEvent.AGENT_CREATED, handler);

    expect(typeof unsubscribe).toBe('function');
  });

  it('should emit and receive events', () => {
    const handler: EventHandler = jest.fn();
    eventBus.on(TaskFlowEvent.WORKFLOW_STARTED, handler);

    const event: Event = {
      type: TaskFlowEvent.WORKFLOW_STARTED,
      timestamp: Date.now(),
      source: 'test',
      id: 'event-1'
    };

    eventBus.emit(event);

    expect(handler).toHaveBeenCalledWith(event);
  });

  it('should support once subscription', () => {
    const handler: EventHandler = jest.fn();
    eventBus.once(TaskFlowEvent.TASK_COMPLETED, handler);

    const event1: Event = {
      type: TaskFlowEvent.TASK_COMPLETED,
      timestamp: Date.now(),
      source: 'test',
      id: 'event-1'
    };

    const event2: Event = {
      type: TaskFlowEvent.TASK_COMPLETED,
      timestamp: Date.now(),
      source: 'test',
      id: 'event-2'
    };

    eventBus.emit(event1);
    eventBus.emit(event2);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should unsubscribe handler', () => {
    const handler: EventHandler = jest.fn();
    const unsubscribe = eventBus.on(TaskFlowEvent.PLUGIN_LOADED, handler);

    unsubscribe();

    const event: Event = {
      type: TaskFlowEvent.PLUGIN_LOADED,
      timestamp: Date.now(),
      source: 'test',
      id: 'event-1'
    };

    eventBus.emit(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should count listeners', () => {
    eventBus.on(TaskFlowEvent.AGENT_CREATED, jest.fn());
    eventBus.on(TaskFlowEvent.AGENT_CREATED, jest.fn());
    eventBus.on(TaskFlowEvent.WORKFLOW_STARTED, jest.fn());

    expect(eventBus.listenerCount(TaskFlowEvent.AGENT_CREATED)).toBe(2);
    expect(eventBus.listenerCount(TaskFlowEvent.WORKFLOW_STARTED)).toBe(1);
  });

  it('should clear all listeners', () => {
    eventBus.on(TaskFlowEvent.AGENT_CREATED, jest.fn());
    eventBus.on(TaskFlowEvent.WORKFLOW_STARTED, jest.fn());

    eventBus.clear();

    expect(eventBus.listenerCount(TaskFlowEvent.AGENT_CREATED)).toBe(0);
    expect(eventBus.listenerCount(TaskFlowEvent.WORKFLOW_STARTED)).toBe(0);
  });
});
