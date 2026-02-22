/**
 * Anthropic (Claude) 适配器
 */

import { BaseAdapter, ChatMessage } from '../adapter';
import { ModelConfig, PROVIDER_ENDPOINTS } from '../types';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; source?: { type: string; media_type: string; data: string } }>;
}

interface ClaudeRequest {
  model: string;
  messages: ClaudeMessage[];
  max_tokens: number;
  temperature?: number;
  top_p?: number;
  system?: string;
  stream?: boolean;
}

interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text?: string;
  }>;
  model: string;
  stop_reason: string;
  stop_sequence?: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class AnthropicAdapter extends BaseAdapter {
  constructor(config: ModelConfig) {
    super(config);
  }

  protected getDefaultEndpoint(): string {
    return PROVIDER_ENDPOINTS.anthropic;
  }

  private convertMessages(messages: ChatMessage[]): ClaudeMessage[] {
    const converted: ClaudeMessage[] = [];
    let systemMessage = '';

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemMessage = msg.content;
      } else {
        converted.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    // 将 system 消息放入单独的字段
    if (systemMessage) {
      // @ts-ignore - 临时处理
      converted[0]?.system ? (converted[0].system = systemMessage) : null;
    }

    return converted;
  }

  async complete(options: { messages: ChatMessage[]; temperature?: number; max_tokens?: number; top_p?: number }): Promise<{
    id: string;
    model: string;
    choices: Array<{
      index: number;
      message: ChatMessage;
      finish_reason: 'stop' | 'length' | 'tool_calls' | null;
    }>;
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    created: number;
  }> {
    const systemMessages = options.messages.filter(m => m.role === 'system');
    const otherMessages = options.messages.filter(m => m.role !== 'system');

    const requestBody: ClaudeRequest = {
      model: this.config.modelName,
      messages: this.convertMessages(otherMessages) as ClaudeMessage[],
      max_tokens: options.max_tokens || 4096,
      temperature: options.temperature,
      top_p: options.top_p,
    };

    if (systemMessages.length > 0) {
      requestBody.system = systemMessages[0].content;
    }

    const response = await this.request<ClaudeResponse>('/messages', requestBody);

    const content = response.content
      .map(c => c.text || '')
      .join('');

    return {
      id: response.id,
      model: response.model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content,
        },
        finish_reason: response.stop_reason === 'end_turn' ? 'stop' : 
                       response.stop_reason === 'max_tokens' ? 'length' : null,
      }],
      usage: {
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      created: Date.now(),
    };
  }

  async *stream(
    options: { messages: ChatMessage[]; temperature?: number; max_tokens?: number } & { stream: true }
  ): AsyncGenerator<{
    id: string;
    choices: Array<{
      index: number;
      delta: { role?: string; content?: string };
      finish_reason?: string;
    }>;
  }> {
    const systemMessages = options.messages.filter(m => m.role === 'system');
    const otherMessages = options.messages.filter(m => m.role !== 'system');

    const requestBody: ClaudeRequest = {
      model: this.config.modelName,
      messages: this.convertMessages(otherMessages) as ClaudeMessage[],
      max_tokens: options.max_tokens || 4096,
      temperature: options.temperature,
      stream: true,
    };

    if (systemMessages.length > 0) {
      requestBody.system = systemMessages[0].content;
    }

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        ...this.buildHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Stream error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let finalId = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        if (line === 'data: [DONE]') return;

        try {
          const data = JSON.parse(line.slice(6));
          finalId = data.id;
          
          if (data.type === 'content_block_delta') {
            yield {
              id: data.id,
              choices: [{
                index: 0,
                delta: {
                  content: data.delta?.text || '',
                },
              }],
            };
          } else if (data.type === 'message_delta') {
            yield {
              id: data.id,
              choices: [{
                index: 0,
                delta: {},
                finish_reason: data.delta?.stop_reason || 'stop',
              }],
            };
          }
        } catch {
          // 跳过无效数据
        }
      }
    }
  }
}
