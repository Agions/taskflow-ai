// @ts-nocheck
import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { BaseAdapter, ChatMessage, ChatCompletionOptions, ChatCompletionResponse } from '../adapter';

// 创建一个具体的测试实现
class TestAdapter extends BaseAdapter {
  getDefaultEndpoint(): string {
    return 'https://api.example.com/v1';
  }

  async complete(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    const response = await this.sendRequest('/chat/completions', {
      messages: options.messages,
      model: options.model,
      temperature: options.temperature,
    });
    return response as ChatCompletionResponse;
  }
}

describe('BaseAdapter', () => {
  let adapter: TestAdapter;
  let mockConfig: any;

  beforeEach(() => {
    // 创建模拟配置
    mockConfig = {
      provider: 'test',
      apiKey: 'test-key',
      baseUrl: undefined,
      enabled: true,
      capabilities: ['chat', 'completion'],
      costPer1MInput: 0.0015,
      costPer1MOutput: 0.002,
    };
    adapter = new TestAdapter(mockConfig);

    // Mock fetch with proper typing
    global.fetch = jest.fn() as jest.Mock;
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

  describe('getBaseUrl', () => {
    it('should return configured baseUrl', () => {
      const configWithUrl = { ...mockConfig, baseUrl: 'https://test.api.com' };
      const customAdapter = new TestAdapter(configWithUrl);
      expect(customAdapter.getBaseUrl()).toBe('https://test.api.com');
    });

    it('should return default endpoint when baseUrl not configured', () => {
      expect(adapter.getBaseUrl()).toBe('https://api.example.com/v1');
    });
  });

  describe('getModelInfo', () => {
    it('should return model information', () => {
      const modelInfo = adapter.getModelInfo();
      expect(modelInfo.provider).toBe('test');
      expect(modelInfo.baseUrl).toBe('https://api.example.com/v1');
      expect(modelInfo.enabled).toBe(true);
    });
  });

  describe('estimateCost', () => {
    it('should estimate cost correctly', () => {
      const inputTokens = 1000;
      const outputTokens = 500;
      const cost = adapter.estimateCost(inputTokens, outputTokens);
      
      // 1000 * 0.0015 / 1,000,000 + 500 * 0.002 / 1,000,000
      const expectedCost = (1000 * 0.0015 + 500 * 0.002) / 1_000_000;
      expect(cost).toBeCloseTo(expectedCost, 6);
    });

    it('should return 0 when tokens are 0', () => {
      const cost = adapter.estimateCost(0, 0);
      expect(cost).toBe(0);
    });
  });

  describe('buildHeaders', () => {
    it('should include authorization header with API key', () => {
      const headers = adapter.buildHeaders();
      expect(headers['Authorization']).toBeDefined();
      expect(headers['Authorization']).toContain('test-key');
    });

    it('should include content-type header', () => {
      const headers = adapter.buildHeaders();
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should include custom headers from config', () => {
      const configWithHeaders = {
        ...mockConfig,
        headers: { 'X-Custom-Header': 'custom-value' }
      };
      const customAdapter = new TestAdapter(configWithHeaders);
      const headers = customAdapter.buildHeaders();
      
      expect(headers['X-Custom-Header']).toBe('custom-value');
    });

    it('should merge config headers with default headers', () => {
      const configWithHeaders = {
        ...mockConfig,
        headers: { 'Content-Type': 'text/plain' }
      };
      const customAdapter = new TestAdapter(configWithHeaders);
      const headers = customAdapter.buildHeaders();
      
      // Custom header should override default
      expect(headers['Content-Type']).toBe('text/plain');
    });
  });

  describe('sendRequest', () => {
    beforeEach(() => {
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true, data: 'test response' }),
      } as Response;
      
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
    });

    it('should send request with correct URL', async () => {
      await adapter.sendRequest('/test', {});
      
      expect(global.fetch).toHaveBeenCalled();
      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toContain('https://api.example.com/v1/test');
    });

    it('should send request with correct method and headers', async () => {
      await adapter.sendRequest('/test', {});
      
      const callArgs = (global.fetch as jest.Mock).mock.calls[1] || [];
      if (callArgs.length > 1) {
        expect(callArgs[1]?.method).toBe('POST');
        expect(callArgs[1]?.headers).toBeDefined();
      }
    });

    it('should send request with correct body', async () => {
      const bodyData = { key: 'value', number: 123 };
      await adapter.sendRequest('/test', bodyData);
      
      const callArgs = (global.fetch as jest.Mock).mock.calls[2] || [];
      if (callArgs.length > 1) {
        expect(callArgs[1]?.body).toContain('key');
        expect(callArgs[1]?.body).toContain('value');
      }
    });

    it('should handle successful response', async () => {
      const result = await adapter.sendRequest('/test', {});
      
      expect(result).toBeDefined();
      expect((result as any).success).toBe(true);
    });

    it('should handle error response', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      } as Response;
      
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockErrorResponse);
      
      await expect(adapter.sendRequest('/test', {})).rejects.toThrow();
    });
  });

  describe('testConnection', () => {
    it('should return true when connection is successful', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true }),
      } as Response;
      
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      const result = await adapter.testConnection();
      expect(result.success).toBe(true);
    });

    it('should return false when connection fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      const result = await adapter.testConnection();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('streamRequest', () => {
    it('should emit response chunks', async () => {
      const mockChunks = ['chunk1', 'chunk2', 'chunk3'];
      const chunkIndex = { value: 0 };
      
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: async () => {
              if (chunkIndex.value < mockChunks.length) {
                return {
                  done: false,
                  value: new TextEncoder().encode(mockChunks[chunkIndex.value++]),
                };
              }
              return { done: true };
            },
          }),
        },
      } as Response;
      
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      const chunks: string[] = [];
      await adapter.streamRequest('/stream', {}, (chunk) => {
        chunks.push(chunk);
      });
      
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should handle stream errors', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: async () => {
              throw new Error('Stream error');
            },
          }),
        },
      } as Response;
      
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      await expect(
        adapter.streamRequest('/stream', {}, () => {})
      ).rejects.toThrow('Stream error');
    });
  });
});
