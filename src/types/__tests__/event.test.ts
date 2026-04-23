import { Event, EventHandler, TaskFlowEvent } from '../event';

describe('Event Types', () => {
  it('should create a valid event', () => {
    const event: Event = {
      type: 'test-event',
      payload: { data: 'test' },
      timestamp: Date.now(),
      source: 'test',
      id: 'event-1'
    };

    expect(event.type).toBe('test-event');
  });

  it('should support task flow events', () => {
    expect(TaskFlowEvent.AGENT_CREATED).toBe('agent.created');
    expect(TaskFlowEvent.WORKFLOW_STARTED).toBe('workflow.started');
  });

  it('should create event handler', () => {
    const handler: EventHandler = (event) => {
      console.log('Event:', event.type);
    };

    expect(typeof handler).toBe('function');
  });
});
