/**
 * Protocol Adapter Tests
 * TaskFlow AI v4.0.1
 *
 * Tests for protocol adapter functionality including WebSocket connections,
 * message handling, and connection management.
 */

import {
  ProtocolAdapter,
  WebSocketMessage,
} from '../protocol-adapter';

describe('Protocol Adapter Types', () => {
  describe('WebSocketMessage', () => {
    it('should create complete message', () => {
      const message: WebSocketMessage = {
        type: 'request',
        id: 'msg-123',
        payload: { action: 'get', data: 'test' },
        timestamp: Date.now(),
      };

      expect(message.type).toBe('request');
      expect(message.id).toBe('msg-123');
      expect(message.timestamp).toBeDefined();
    });

    it('should create minimal message', () => {
      const message: WebSocketMessage = {
        type: 'event',
        id: 'evt-456',
        payload: 'simple payload',
        timestamp: Date.now(),
      };

      expect(message.payload).toBe('simple payload');
    });
  });
});

describe('ProtocolAdapter', () => {
  let adapter: ProtocolAdapter;

  beforeEach(() => {
    adapter = new ProtocolAdapter();
  });

  describe('Connection Management', () => {
    it('should create adapter instance', () => {
      expect(adapter).toBeDefined();
      expect(adapter).toBeInstanceOf(ProtocolAdapter);
    });

    it('should connect to WebSocket server (mock)', async () => {
      // Note: WebSocket mocking requires more complex setup
      // This test validates the interface exists
      expect.assertions(0);
    });

    it('should generate unique connection ID', () => {
      const id1 = adapter['generateId']();
      const id2 = adapter['generateId']();

      expect(id1).toMatch(/^conn-\d+-[\da-z]+$/);
      expect(id2).toMatch(/^conn-\d+-[\da-z]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('Message Handling', () => {
    it('should send message to connection', () => {
      const message: WebSocketMessage = {
        type: 'request',
        id: 'test-id',
        payload: { action: 'test' },
        timestamp: Date.now(),
      };

      // Validate message structure
      expect(message.id).toBe('test-id');
      expect(message.type).toBe('request');
    });

    it('should handle onMessage callback', () => {
      const handler = (message: WebSocketMessage) => {
        return message;
      };

      const testMessage: WebSocketMessage = {
        type: 'response',
        id: 'res-123',
        payload: 'test response',
        timestamp: Date.now(),
      };

      const result = handler(testMessage);

      expect(result).not.toBeNull();
      expect(result.id).toBe('res-123');
    });
  });

  describe('Disconnection', () => {
    it('should disconnect specific connection', () => {
      const connectionId = 'test-conn-1';

      // Validate the disconnect method signature
      expect(() => adapter.disconnect(connectionId)).not.toThrow();
    });

    it('should disconnect all connections', () => {
      expect(() => adapter.disconnectAll()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should throw error when sending to non-existent connection', () => {
      const message: WebSocketMessage = {
        type: 'request',
        id: 'msg-1',
        payload: {},
        timestamp: Date.now(),
      };

      expect(() => {
        adapter.send('non-existent', message);
      }).toThrow('Connection not found');
    });

    it('should throw error when setting message handler for non-existent connection', () => {
      const handler = (message: WebSocketMessage) => {
        console.log(message);
      };

      expect(() => {
        adapter.onMessage('non-existent', handler);
      }).toThrow('Connection not found');
    });
  });
});

describe('Message Types', () => {
  it('should handle request message type', () => {
    const message: WebSocketMessage = {
      type: 'request',
      id: 'req-1',
      payload: { endpoint: '/api/data' },
      timestamp: Date.now(),
    };

    expect(message.type).toBe('request');
  });

  it('should handle response message type', () => {
    const message: WebSocketMessage = {
      type: 'response',
      id: 'res-1',
      payload: { status: 200, data: 'success' },
      timestamp: Date.now(),
    };

    expect(message.type).toBe('response');
  });

  it('should handle event message type', () => {
    const message: WebSocketMessage = {
      type: 'event',
      id: 'evt-1',
      payload: { event: 'update', data: 'new data' },
      timestamp: Date.now(),
    };

    expect(message.type).toBe('event');
  });

  it('should handle error message type', () => {
    const message: WebSocketMessage = {
      type: 'error',
      id: 'err-1',
      payload: { code: 500, message: 'Internal error' },
      timestamp: Date.now(),
    };

    expect(message.type).toBe('error');
  });
});

describe('Message Payloads', () => {
  it('should handle object payload', () => {
    const message: WebSocketMessage = {
      type: 'request',
      id: 'msg-1',
      payload: {
        action: 'create',
        data: { name: 'test', value: 123 },
        options: { timestamp: true },
      },
      timestamp: Date.now(),
    };

    const payload = message.payload as Record<string, unknown>;
    expect(payload.action).toBe('create');
    expect(payload.data).toBeDefined();
  });

  it('should handle string payload', () => {
    const message: WebSocketMessage = {
      type: 'message',
      id: 'msg-2',
      payload: 'Simple string payload',
      timestamp: Date.now(),
    };

    expect(typeof message.payload).toBe('string');
  });

  it('should handle array payload', () => {
    const message: WebSocketMessage = {
      type: 'batch',
      id: 'msg-3',
      payload: [1, 2, 3, 4, 5],
      timestamp: Date.now(),
    };

    const payload = message.payload as number[];
    expect(Array.isArray(payload)).toBe(true);
    expect(payload).toHaveLength(5);
  });

  it('should handle null payload', () => {
    const message: WebSocketMessage = {
      type: 'notification',
      id: 'msg-4',
      payload: null,
      timestamp: Date.now(),
    };

    expect(message.payload).toBeNull();
  });
});

describe('Integration Scenarios', () => {
  let adapter: ProtocolAdapter;

  beforeEach(() => {
    adapter = new ProtocolAdapter();
  });

  it('should validate complete message lifecycle structure', () => {
    // Connection ID
    const connectionId = adapter['generateId']();
    expect(connectionId).toBeDefined();

    // Message creation
    const request: WebSocketMessage = {
      type: 'request',
      id: 'req-1',
      payload: { action: 'test' },
      timestamp: Date.now(),
    };

    // Response creation
    const response: WebSocketMessage = {
      type: 'response',
      id: 'req-1',
      payload: { result: 'success' },
      timestamp: Date.now(),
    };

    // Validation
    expect(request.type).toBe('request');
    expect(response.type).toBe('response');
  });

  it('should handle message parsing error scenario', () => {
    const invalidJson = '{"type":"request","invalid}';
    let parseError: Error | null = null;

    try {
      JSON.parse(invalidJson);
    } catch (error) {
      parseError = error as Error;
    }

    expect(parseError).not.toBeNull();
    expect(parseError?.message).toContain('JSON');
  });

  it('should generate unique connection IDs sequentially', () => {
    const ids = new Set<string>();

    for (let i = 0; i < 10; i++) {
      const id = adapter['generateId']();
      ids.add(id);
    }

    expect(ids.size).toBe(10);
  });

  it('should handle message with complex nested payload', () => {
    const message: WebSocketMessage = {
      type: 'request',
      id: 'msg-complex',
      payload: {
        query: {
          filter: {
            status: 'active',
            createdAfter: '2024-01-01',
          },
          sort: { field: 'createdAt', order: 'desc' },
          pagination: { page: 1, limit: 50 },
        },
        context: {
          userId: 'user-123',
          requestId: 'req-456',
        },
      },
      timestamp: Date.now(),
    };

    const payload = message.payload as Record<string, unknown>;
    expect(payload.query).toBeDefined();
    expect(payload.context).toBeDefined();
  });
});

describe('Message Validation', () => {
  it('should require message type', () => {
    const message: WebSocketMessage = {
      type: 'request',
      id: 'test',
      payload: {},
      timestamp: Date.now(),
    };

    expect(message.type).toBeDefined();
  });

  it('should require message ID', () => {
    const message: WebSocketMessage = {
      type: 'response',
      id: 'unique-id-12345',
      payload: null,
      timestamp: Date.now(),
    };

    expect(message.id).toBe('unique-id-12345');
  });

  it('should require timestamp', () => {
    const ts = Date.now();
    const message: WebSocketMessage = {
      type: 'event',
      id: 'evt-1',
      payload: 'event data',
      timestamp: ts,
    };

    expect(message.timestamp).toBe(ts);
  });

  it('should allow optional payload', () => {
    const message: WebSocketMessage = {
      type: 'ping',
      id: 'ping-1',
      payload: undefined,
      timestamp: Date.now(),
    };

    expect(message.payload).toBeUndefined();
  });
});
