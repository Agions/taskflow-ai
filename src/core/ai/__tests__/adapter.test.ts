import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { BaseAdapter, ChatMessage, ChatCompletionOptions, ChatCompletionResponse } from '../adapter';

// 创建一个具体的测试实现
class TestAdapter extends BaseAdapter {
  protected getDefaultEndpoint(): string {
    return 'https://api.example.com/v1';
  }

  async complete(options: Omit<ChatCompletionOptions, 'model'>): Promise<ChatCompletionResponse> {
    return {
      id: 'test-response-1',
      model: this.config.modelName,
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: 'Test response' },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15,
      },
      created: Date.now(),
    };
  }

  // 添加测试工具方法
  setConfig(config: any) {
    this.config = config as any;
  }

  getBaseUrl() {
    return this.baseUrl;
  }
}

describe('BaseAdapter', () => {
  let adapter: TestAdapter;
  let mockConfig: any;

  beforeEach(() => {
    mockConfig = {
      id: 'test-model-1',
      provider: 'openai' as const,
      modelName: 'gpt-4',
      apiKey: 'test-api-key',
      enabled: true,
      capabilities: ['chat', 'completion'],
      costPer1MInput: 0.0015,
      costPer1MOutput: 0.002,
    };
    adapter = new TestAdapter(mockConfig);

    // Mock fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with config', () => {
      expect((adapter as any).config).toBe(mockConfig);
    });

    it('should set baseUrl from config if provided', () => {
      const configWithUrl = { ...mockConfig, baseUrl: 'https://custom.api.com' };
      const customAdapter = new TestAdapter(configWithUrl);
      expect(customAdapter.getBaseUrl()).toBe('https://custom.api.com');
    });

    it('should use default endpoint if baseUrl not provided', () => {
      expect(adapter.getBaseUrl()).toBe('https://api.example.com/v1');
    });
  });

  describe('getDefaultEndpoint', () => {
    it('should return default endpoint', () => {
      expect(adapter['getDefaultEndpoint']()).toBe('https://api.example.com/v1');
    });
  });

  describe('getModelInfo', () => {
    it('should return model information', () => {
      const info = adapter.getModelInfo();
      expect(info).toEqual({
        id: 'test-model-1',
        provider: 'openai',
        modelName: 'gpt-4',
        enabled: true,
        capabilities: ['chat', 'completion'],
      });
    });
  });

  describe('estimateCost', () => {
    it('should estimate cost correctly', () => {
      const cost = adapter.estimateCost(1000, 500);
      const inputCost = (1000 / 1_000_000) * 0.0015; // 0.0000015
      const outputCost = (500 / 1_000_000) * 0.002; // 0.000001
      expect(cost).toBeCloseTo(0.0000025, 9);
    });

    it('should handle zero cost configuration', () => {
      const zeroCostConfig = { ...mockConfig, costPer1MInput: undefined, costPer1MOutput: undefined };
      adapter.setConfig(zeroCostConfig);
      const cost = adapter.estimateCost(1000, 500);
      expect(cost).toBe(0);
    });
  });

  describe('buildHeaders', () => {
    it('should build headers for OpenAI', () => {
      expect((global.fetch as jest.Mock).mockClear());
      const headers = (adapter as any).buildHeaders();
      expect(headers).toHaveProperty('Content-Type', 'application/json');
      expect(headers).toHaveProperty('Authorization', 'Bearer test-api-key');
    });

    it('should build headers for Anthropic', () => {
      const anthropicConfig = { ...mockConfig, provider: 'anthropic' as const };
      adapter.setConfig(anthropicConfig);
      const headers = (adapter as any).buildHeaders();
      expect(headers).toHaveProperty('Authorization', 'Bearer test-api-key');
      expect(headers).toHaveProperty('anthropic-version', '2023-06-01');
    });

    it('should build headers for DeepSeek', () => {
      const deepseekConfig = { ...mockConfig, provider: 'deepseek' as const };
      adapter.setConfig(deepseekConfig);
      const headers = (adapter as any).buildHeaders();
      expect(headers).toHaveProperty('Authorization', 'Bearer test-api-key');
    });
  });

  describe('test', () => {
    it('should test connection successfully', async () => {
      const result = await adapter.test();
      expect(result.success).toBe(true);
      expect(result.latency).toBeGreaterThanOrEqual(0);
      expect(result.error).toBeUndefined();
    });

    it('should handle connection failure', async () => {
      // Override complete to throw error
      jest.spyOn(adapter, 'complete').mockRejectedValue(new Error('Network error'));
      const result = await adapter.test();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.latency).toBeGreaterThanOrEqual(0);
    });
  });

  describe('request', () => {
    it('should send successful request', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true }),
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await (adapter as any).request('test-endpoint', { test: 'data' });
      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/v1test-endpoint',
        expect.objectContaining({
          method: 'POST',
          headers: expect.any(Object),
          body: JSON.stringify({ test: 'data' }),
        })
      );
    });

    it('should handle API error response', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      await expect(
        (adapter as any).request('test-endpoint', {})
      ).rejects.toThrow('API Error (500): Internal Server Error');
    });
  });

  describe('stream', () => {
    it('should stream complete responses', async () => {
      const chunks: any[] = [];
      for await (const chunk of adapter.stream({
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 100,
        stream: true,
      })) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toHaveProperty('id');
      expect(chunks[0]).toHaveProperty('choices');
    });
  });

  describe('complete', () => {
    it('should complete chat request', async () => {
      const response = await adapter.complete({
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 100,
      });

      expect(response).toHaveProperty('id');
      expect(response).toHaveProperty('model');
      expect(response.choices).toHaveLength(1);
      expect(response.choices[0].message.role).toBe('assistant');
    });
  });
});
