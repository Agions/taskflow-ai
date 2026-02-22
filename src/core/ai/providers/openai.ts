/**
 * OpenAI 适配器
 */

import { BaseAdapter, ChatCompletionOptions, ChatCompletionResponse } from '../adapter';
import { ModelConfig, PROVIDER_ENDPOINTS } from '../types';

export class OpenAIAdapter extends BaseAdapter {
  constructor(config: ModelConfig) {
    super(config);
  }

  protected getDefaultEndpoint(): string {
    return PROVIDER_ENDPOINTS.openai;
  }

  async complete(options: Omit<ChatCompletionOptions, 'model'>): Promise<ChatCompletionResponse> {
    const requestBody = {
      model: this.config.modelName,
      ...options,
    };

    const response = await this.request<{
      id: string;
      object: string;
      created: number;
      model: string;
      choices: Array<{
        index: number;
        message: {
          role: string;
          content: string | null;
          tool_calls?: Array<{
            id: string;
            type: string;
            function: {
              name: string;
              arguments: string;
            };
          }>;
        };
        finish_reason: string;
      }>;
      usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    }>('/chat/completions', requestBody);

    return {
      id: response.id,
      model: response.model,
      choices: response.choices.map((choice) => ({
        index: choice.index,
        message: {
          role: choice.message.role as 'assistant',
          content: choice.message.content || '',
          ...(choice.message.tool_calls && { tool_calls: choice.message.tool_calls }),
        },
        finish_reason: choice.finish_reason as ChatCompletionResponse['choices'][0]['finish_reason'],
      })),
      usage: response.usage,
      created: response.created,
    };
  }

  async *stream(
    options: Omit<ChatCompletionOptions, 'model'> & { stream: true }
  ): AsyncGenerator<{
    id: string;
    choices: Array<{
      index: number;
      delta: { role?: string; content?: string };
      finish_reason?: string;
    }>;
  }> {
    const requestBody = {
      model: this.config.modelName,
      ...options,
      stream: true,
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Stream error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        if (trimmed === 'data: [DONE]') return;

        try {
          const data = JSON.parse(trimmed.slice(6));
          yield {
            id: data.id,
            choices: data.choices.map((choice: any) => ({
              index: choice.index,
              delta: choice.delta,
              finish_reason: choice.finish_reason,
            })),
          };
        } catch {
          // 跳过无效 JSON
        }
      }
    }
  }
}
