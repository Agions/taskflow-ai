import { MessageType, Message, MessageBus } from '../message';

describe('Message Types', () => {
  it('should create a valid message', () => {
    const message: Message = {
      id: 'msg-1',
      type: 'request',
      from: 'agent-1',
      to: 'agent-2',
      content: 'Hello',
      timestamp: Date.now(),
      priority: 'normal'
    };

    expect(message.type).toBe('request');
  });

  it('should support all message types', () => {
    const types: MessageType[] = [
      'request',
      'response',
      'notification',
      'broadcast',
      'error'
    ];

    expect(types).toContain('broadcast');
  });

  it('should create message with payload', () => {
    const message: Message<{ data: string }> = {
      id: 'msg-2',
      type: 'response',
      from: 'agent-2',
      to: 'agent-1',
      content: 'Success',
      timestamp: Date.now(),
      priority: 'high',
      payload: { data: 'test' }
    };

    expect(message.payload?.data).toBe('test');
  });
});
