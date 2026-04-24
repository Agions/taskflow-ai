import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ToolRegistry, Tool, ToolCategory, ToolResult, ToolContext } from '../registry';

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry(100);
  });

  afterEach(() => {
    registry.clear();
  });

  describe('constructor', () => {
    it('should initialize with default maxCallHistory', () => {
      const defaultRegistry = new ToolRegistry();
      expect(defaultRegistry).toBeDefined();
    });

    it('should initialize with custom maxCallHistory', () => {
      const customRegistry = new ToolRegistry(50);
      expect(customRegistry).toBeDefined();
    });
  });

  describe('tool registration', () => {
    const mockTool: Tool = {
      name: 'test-tool',
      description: 'Test tool description',
      category: 'filesystem' as ToolCategory,
      handler: jest.fn().mockResolvedValue({
        success: true,
        data: 'test result',
      }),
    };

    it('should register a tool', () => {
      registry.register(mockTool);
      const retrieved = registry.get('test-tool');
      expect(retrieved).toBe(mockTool);
    });

    it('should overwrite existing tool', () => {
      registry.register(mockTool);
      const updatedTool = { ...mockTool, description: 'Updated description' };
      registry.register(updatedTool);

      const retrieved = registry.get('test-tool');
      expect(retrieved?.description).toBe('Updated description');
    });

    it('should register multiple tools', () => {
      const tools: Tool[] = [
        { ...mockTool, name: 'tool1', category: 'filesystem' },
        { ...mockTool, name: 'tool2', category: 'network' },
        { ...mockTool, name: 'tool3', category: 'code' },
      ];

      registry.registerMany(tools);

      expect(registry.getAll()).toHaveLength(3);
      expect(registry.get('tool1')).toBeDefined();
      expect(registry.get('tool2')).toBeDefined();
      expect(registry.get('tool3')).toBeDefined();
    });

    it('should unregister a tool', () => {
      registry.register(mockTool);
      const removed = registry.unregister('test-tool');
      expect(removed).toBe(true);
      expect(registry.get('test-tool')).toBeUndefined();
    });

    it('should return false when unregistering non-existent tool', () => {
      const removed = registry.unregister('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('tool retrieval', () => {
    beforeEach(() => {
      const tools: Tool[] = [
        {
          name: 'file-read',
          description: 'Read file',
          category: 'filesystem',
          tags: ['file', 'read'],
          handler: jest.fn(),
        },
        {
          name: 'file-write',
          description: 'Write file',
          category: 'filesystem',
          tags: ['file', 'write'],
          handler: jest.fn(),
        },
        {
          name: 'http-get',
          description: 'HTTP GET request',
          category: 'network',
          tags: ['http', 'network'],
          handler: jest.fn(),
        },
      ];
      registry.registerMany(tools);
    });

    it('should get tool by name', () => {
      const tool = registry.get('file-read');
      expect(tool?.name).toBe('file-read');
    });

    it('should return undefined for non-existent tool', () => {
      const tool = registry.get('non-existent');
      expect(tool).toBeUndefined();
    });

    it('should get all tools', () => {
      const allTools = registry.getAll();
      expect(allTools).toHaveLength(3);
    });

    it('should get tools by category', () => {
      const filesystemTools = registry.getByCategory('filesystem');
      expect(filesystemTools).toHaveLength(2);
      expect(filesystemTools.every(t => t.category === 'filesystem')).toBe(true);

      const networkTools = registry.getByCategory('network');
      expect(networkTools).toHaveLength(1);
    });

    it('should search tools by name', () => {
      const results = registry.search('file');
      expect(results).toHaveLength(2);
      expect(results.every(t => t.name.includes('file'))).toBe(true);
    });

    it('should search tools by description', () => {
      const results = registry.search('http');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('http-get');
    });

    it('should search tools by tags', () => {
      const results = registry.search('network');
      expect(results).toHaveLength(1);
      expect(results[0].tags).toContain('network');
    });

    it('should be case-insensitive in search', () => {
      const results = registry.search('FILE');
      expect(results).toHaveLength(2);
    });
  });

  describe('tool execution', () => {
    let mockHandler: jest.Mock;
    const mockTool: Tool = {
      name: 'async-tool',
      description: 'Async tool',
      category: 'filesystem',
      handler: (params, context) => mockHandler(params, context),
    };

    const mockContext: ToolContext = {
      sessionId: 'test-session',
      userId: 'test-user',
    };

    beforeEach(() => {
      mockHandler = jest.fn().mockResolvedValue({
        success: true,
        data: 'executed',
      });
      registry.register(mockTool);
    });

    it('should execute a tool successfully', async () => {
      const result = await registry.execute('async-tool', { test: 'param' }, mockContext);

      expect(result.success).toBe(true);
      expect(result.data).toBe('executed');
      expect(mockHandler).toHaveBeenCalledWith(
        { test: 'param' },
        mockContext
      );
    });

    it('should handle non-existent tool', async () => {
      const result = await registry.execute('non-existent', {}, mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('不存在');
    });

    it('should handle tool execution error', async () => {
      mockHandler.mockRejectedValue(new Error('Execution failed'));
      const result = await registry.execute('async-tool', {}, mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Execution failed');
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should retry on failure if tool is retryable', async () => {
      retryMockHandler = jest.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce({ success: true, data: 'success' });

      const retryableTool: Tool = {
        ...mockTool,
        name: 'retryable-tool',
        retryable: true,
        handler: retryMockHandler,
      };
      registry.register(retryableTool);

      const result = await registry.execute('retryable-tool', {}, mockContext);

      expect(result.success).toBe(true);
      expect(retryMockHandler).toHaveBeenCalledTimes(3);
    }, 10000);

    it('should return timeout error', async () => {
      mockHandler.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 5000))
      );

      const result = await registry.execute('async-tool', {}, mockContext, {
        timeout: 100,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('超时');
    }, 6000);
  });

  describe('call history', () => {
    it('should track tool calls', async () => {
      const mockTool: Tool = {
        name: 'tracked-tool',
        description: 'Tracked tool',
        category: 'filesystem',
        handler: jest.fn().mockResolvedValue({ success: true }),
      };
      registry.register(mockTool);

      await registry.execute('tracked-tool', {}, {});
      await registry.execute('tracked-tool', {}, {});

      const calls = registry.getCallHistory();
      expect(calls).toHaveLength(2);
      expect(calls[0].toolName).toBe('tracked-tool');
    });

    it('should limit call history by maxCallHistory', async () => {
      const registryWithLimit = new ToolRegistry(3);
      const mockTool: Tool = {
        name: 'test-tool',
        description: 'Test',
        category: 'filesystem',
        handler: jest.fn().mockResolvedValue({ success: true }),
      };
      registryWithLimit.register(mockTool);

      for (let i = 0; i < 5; i++) {
        await registryWithLimit.execute('test-tool', {}, {});
      }

      const calls = registryWithLimit.getCallHistory();
      expect(calls.length).toBeLessThanOrEqual(3);
    });

    it('should limit returned call history by limit parameter', async () => {
      const mockTool: Tool = {
        name: 'test-tool',
        description: 'Test',
        category: 'filesystem',
        handler: jest.fn().mockResolvedValue({ success: true }),
      };
      registry.register(mockTool);

      for (let i = 0; i < 5; i++) {
        await registry.execute('test-tool', {}, {});
      }

      const calls = registry.getCallHistory(2);
      expect(calls).toHaveLength(2);
    });
  });

  describe('statistics', () => {
    it('should return correct statistics', async () => {
      const tools: Tool[] = [
        {
          name: 'tool1',
          description: 'Tool 1',
          category: 'filesystem',
          handler: jest.fn().mockResolvedValue({ success: true }),
        },
        {
          name: 'tool2',
          description: 'Tool 2',
          category: 'network',
          handler: jest.fn().mockResolvedValue({ success: false, error: 'failed' }),
        },
        {
          name: 'tool3',
          description: 'Tool 3',
          category: 'filesystem',
          handler: jest.fn().mockResolvedValue({ success: true }),
        },
      ];
      registry.registerMany(tools);

      await registry.execute('tool1', {}, {});
      await registry.execute('tool2', {}, {});
      await registry.execute('tool3', {}, {});

      const stats = registry.getStats();

      expect(stats.totalTools).toBe(3);
      expect(stats.totalCalls).toBe(3);
      expect(stats.successRate).toBeCloseTo(0.6667, 2);
      expect(stats.byCategory.filesystem).toBe(2);
      expect(stats.byCategory.network).toBe(1);
    });

    it('should return 0% success rate for no calls', () => {
      const stats = registry.getStats();
      expect(stats.totalTools).toBe(0);
      expect(stats.totalCalls).toBe(0);
      expect(stats.successRate).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all tools and call history', async () => {
      const mockTool: Tool = {
        name: 'test-tool',
        description: 'Test',
        category: 'filesystem',
        handler: jest.fn().mockResolvedValue({ success: true }),
      };
      registry.register(mockTool);
      await registry.execute('test-tool', {}, {});

      registry.clear();

      expect(registry.getAll()).toHaveLength(0);
      expect(registry.getCallHistory()).toHaveLength(0);
    });
  });
});
