/**
 * Protocol Adapter - 协议适配器
 * TaskFlow AI v4.0
 */

export interface WebSocketMessage {
  type: string;
  id: string;
  payload: unknown;
  timestamp: number;
}

export class ProtocolAdapter {
  private connections: Map<string, WebSocket> = new Map();

  /**
   * 连接到 WebSocket
   */
  async connect(url: string, id?: string): Promise<WebSocket> {
    const connectionId = id || this.generateId();

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        this.connections.set(connectionId, ws);
        resolve(ws);
      };

      ws.onerror = (error) => {
        reject(error);
      };
    });
  }

  /**
   * 发送消息
   */
  send(connectionId: string, message: WebSocketMessage): void {
    const ws = this.connections.get(connectionId);
    if (!ws) {
      throw new Error(`Connection not found: ${connectionId}`);
    }

    ws.send(JSON.stringify(message));
  }

  /**
   * 接收消息
   */
  onMessage(
    connectionId: string,
    handler: (message: WebSocketMessage) => void
  ): void {
    const ws = this.connections.get(connectionId);
    if (!ws) {
      throw new Error(`Connection not found: ${connectionId}`);
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        handler(message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };
  }

  /**
   * 断开连接
   */
  disconnect(connectionId: string): void {
    const ws = this.connections.get(connectionId);
    if (ws) {
      ws.close();
      this.connections.delete(connectionId);
    }
  }

  /**
   * 断开所有连接
   */
  disconnectAll(): void {
    this.connections.forEach((ws, id) => {
      ws.close();
      this.connections.delete(id);
    });
  }

  private generateId(): string {
    return `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
