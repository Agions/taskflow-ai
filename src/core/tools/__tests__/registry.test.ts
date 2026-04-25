// @ts-nocheck
import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { ToolRegistry } from '../registry';
import {
  Tool,
  ToolCategory,
  ToolHandler,
  ToolResult,
  ToolContext,
} from '../types';

describe('ToolRegistry', () => {
  let registry: ToolRegistry;
  let mockHandler: jest.Mock;

  beforeEach(() => {
    registry = new ToolRegistry();
    mockHandler = jest.fn()
      .mockResolvedValue({
        success: true,
        output: 'test output',
      });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Tool Registration', () => {
    it('should register a tool', () => {
      const tool: Tool = {
        name: 'test-tool',
        description: 'A test tool',
        category: 'custom',
        parameters: { type: 'object', properties: {}, required: [] },
        handler: mockHandler,
      };

      registry.register(tool);
      const retrievedTool = registry.get('test-tool');
      
      expect(retrievedTool).toBeDefined();
      expect(retrievedTool?.name).toBe('test-tool');
      expect(retrievedTool?.category).toBe('custom');
    });

    it('should get tool by name', () => {
      const tool: Tool = {
        name: 'get-test',
        description: 'Test retrieval',
        category: 'custom',
        parameters: { type: 'object', properties: {}, required: [] },
        handler: mockHandler,
      };

      registry.register(tool);
      const retrievedTool = registry.get('get-test');
      
      expect(retrievedTool).toBeDefined();
      expect(retrievedTool?.name).toBe('get-test');
    });

    it('should return undefined for non-existent tool', () => {
      const retrievedTool = registry.get('non-existent-tool');
      expect(retrievedTool).toBeUndefined();
    });

    it('should list all tools', () => {
      const tool1: Tool = {
        name: 'tool1',
        description: 'First tool',
        category: 'filesystem',
        parameters: { type: 'object', properties: {}, required: [] },
        handler: mockHandler,
      };

      const tool2: Tool = {
        name: 'tool2',
        description: 'Second tool',
        category: 'system',
        parameters: { type: 'object', properties: {}, required: [] },
        handler: mockHandler,
      };

      registry.register(tool1);
      registry.register(tool2);
      
      const allTools = registry.list();
      expect(allTools.length).toBe(2);
      expect(allTools.map(t => t.name)).toContain('tool1');
      expect(allTools.map(t => t.name)).toContain('tool2');
    });

    it('should list tools by category', () => {
      const fsTool: Tool = {
        name: 'file-tool',
        description: 'File operations',
        category: 'filesystem',
        parameters: { type: 'object', properties: {}, required: [] },
        handler: mockHandler,
      };

      const systemTool: Tool = {
        name: 'system-tool',
        description: 'System operations',
        category: 'system',
        parameters: { type: 'object', properties: {}, required: [] },
        handler: mockHandler,
      };

      registry.register(fsTool);
      registry.register(systemTool);
      
      const fsTools = registry.listByCategory('filesystem');
      expect(fsTools.length).toBe(1);
      expect(fsTools[0].name).toBe('file-tool');
    });

    it('should unregister a tool', () => {
      const tool: Tool = {
        name: 'unregister-test',
        description: 'Test unregistration',
        category: 'custom',
        parameters: { type: 'object', properties: {}, required: [] },
        handler: mockHandler,
      };

      registry.register(tool);
      expect(registry.get('unregister-test')).toBeDefined();
      
      registry.unregister('unregister-test');
      expect(registry.get('unregister-test')).toBeUndefined();
    });

    it('should clear all tools', () => {
      const tool1: Tool = {
        name: 'clear1',
        description: 'Tool 1',
        category: 'custom',
        parameters: { type: 'object', properties: {}, required: [] },
        handler: mockHandler,
      };

      const tool2: Tool = {
        name: 'clear2',
        description: 'Tool 2',
        category: 'custom',
        parameters: { type: 'object', properties: {}, required: [] },
        handler: mockHandler,
      };

      registry.register(tool1);
      registry.register(tool2);
      
      expect(registry.list().length).toBe(2);
      
      registry.clear();
      expect(registry.list().length).toBe(0);
    });
  });

  describe('Tool Execution', () => {
    it('should execute a tool successfully', async () => {
      const tool: Tool = {
        name: 'execute-test',
        description: 'Test execution',
        category: 'custom',
        parameters: { type: 'object', properties: {}, required: [] },
        handler: mockHandler,
      };

      registry.register(tool);
      
      const context: ToolContext = {
        cwd: '/test/dir',
        env: { TEST_VAR: 'value' },
      };
      
      const result = await registry.execute('execute-test', {}, context);
      
      expect(result.success).toBe(true);
      expect(result.output).toBe('test output');
      expect(mockHandler).toHaveBeenCalledWith({}, context);
    });

    it('should handle tool execution errors', async () => {
      const errorHandler: jest.Mock<Promise<ToolResult>, [Record<string, unknown>, ToolContext]> =
        jest.fn().mockRejectedValue(new Error('Execution failed'));

      const tool: Tool = {
        name: 'error-tool',
        description: 'Error handling test',
        category: 'custom',
        parameters: { type: 'object', properties: {}, required: [] },
        handler: errorHandler,
      };

      registry.register(tool);
      
      const context: ToolContext = {
        cwd: '/test/dir',
        env: {},
      };
      
      const result = await registry.execute('error-tool', {}, context);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Execution failed');
    });

    it('should retry failed tool execution', async () => {
      let attempts = 0;
      const retryHandler: jest.Mock<Promise<ToolResult>, [Record<string, unknown>, ToolContext]> =
        jest.fn()
          .mockImplementation(async () => {
            attempts++;
            if (attempts < 3) {
              throw new Error(`Attempt ${attempts} failed`);
            }
            return { success: true, output: 'success after retry' };
          });

      const tool: Tool = {
        name: 'retry-tool',
        description: 'Retry test',
        category: 'custom',
        parameters: { type: 'object', properties: {}, required: [] },
        handler: retryHandler,
        retryable: true,
      };

      registry.register(tool);
      
      const context: ToolContext = {
        cwd: '/test/dir',
        env: {},
      };
      
      const result = await registry.execute('retry-tool', {}, context);
      
      expect(result.success).toBe(true);
      expect(attempts).toBe(3);
    });

    it('should respect tool timeout', async () => {
      const timeoutHandler: jest.Mock<Promise<ToolResult>, [Record<string, unknown>, ToolContext]> =
        jest.fn().mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 2000))
        );

      const tool: Tool = {
        name: 'timeout-tool',
        description: 'Timeout test',
        category: 'custom',
        parameters: { type: 'object', properties: {}, required: [] },
        handler: timeoutHandler,
        timeout: 100,
      };

      registry.register(tool);
      
      const context: ToolContext = {
        cwd: '/test/dir',
        env: {},
      };
      
      const result = await registry.execute('timeout-tool', {}, context);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });
  });

  describe('Tool Call History', () => {
    it('should track tool calls', async () => {
      const tool: Tool = {
        name: 'tracked-tool',
        description: 'History tracking test',
        category: 'custom',
        parameters: { type: 'object', properties: {}, required: [] },
        handler: mockHandler,
      };

      registry.register(tool);
      
      const context: ToolContext = {
        cwd: '/test/dir',
        env: {},
      };
      
      await registry.execute('tracked-tool', { param: 'value' }, context);
      
      const history = registry.getCallHistory('tracked-tool');
      expect(history.length).toBe(1);
      expect(history[0].params).toEqual({ param: 'value' });
    });

    it('should limit call history size', async () => {
      registry.setMaxHistorySize(2);

      const tool: Tool = {
        name: 'history-limit-tool',
        description: 'History limit test',
        category: 'custom',
        parameters: { type: 'object', properties: {}, required: [] },
        handler: mockHandler,
      };

      registry.register(tool);
      
      const context: ToolContext = {
        cwd: '/test/dir',
        env: {},
      };
      
      // Execute 3 times
      await registry.execute('history-limit-tool', {}, context);
      await registry.execute('history-limit-tool', {}, context);
      await registry.execute('history-limit-tool', {}, context);
      
      const history = registry.getCallHistory('history-limit-tool');
      expect(history.length).toBe(2);
    });

    it('should clear call history for a tool', async () => {
      const tool: Tool = {
        name: 'clear-history-tool',
        description: 'Clear history test',
        category: 'custom',
        parameters: { type: 'object', properties: {}, required: [] },
        handler: mockHandler,
      };

      registry.register(tool);
      
      const context: ToolContext = {
        cwd: '/test/dir',
        env: {},
      };
      
      await registry.execute('clear-history-tool', {}, context);
      expect(registry.getCallHistory('clear-history-tool').length).toBe(1);
      
      registry.clearCallHistory('clear-history-tool');
      expect(registry.getCallHistory('clear-history-tool').length).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should track execution statistics', async () => {
      const successTool: Tool = {
        name: 'success-tool',
        description: 'Success stats test',
        category: 'custom',
        parameters: { type: 'object', properties: {}, required: [] },
        handler: mockHandler,
      };

      const errorTool: Tool = {
        name: 'error-tool',
        description: 'Error stats test',
        category: 'custom',
        parameters: { type: 'object', properties: {}, required: [] },
        handler: jest.fn().mockRejectedValue(new Error('failed')),
        retryable: false,
      };

      registry.register(successTool);
      registry.register(errorTool);
      
      const context: ToolContext = {
        cwd: '/test/dir',
        env: {},
      };
      
      await registry.execute('success-tool', {}, context);
      await registry.execute('success-tool', {}, context);
      await registry.execute('error-tool', {}, context);
      
      const stats = registry.getStatistics();
      
      expect(stats.totalExecutions).toBe(3);
      expect(stats.successfulExecutions).toBe(2);
      expect(stats.failedExecutions).toBe(1);
    });

    it('should reset statistics', async () => {
      const tool: Tool = {
        name: 'reset-stats-tool',
        description: 'Reset stats test',
        category: 'custom',
        parameters: { type: 'object', properties: {}, required: [] },
        handler: mockHandler,
      };

      registry.register(tool);
      
      const context: ToolContext = {
        cwd: '/test/dir',
        env: {},
      };
      
      await registry.execute('reset-stats-tool', {}, context);
      
      expect(registry.getStatistics().totalExecutions).toBe(1);
      
      registry.resetStatistics();
      
      expect(registry.getStatistics().totalExecutions).toBe(0);
    });
  });

  describe('Built-in Tools', () => {
    it('should know about built-in tools', () => {
      const builtInTools = registry.listBuiltIn();
      
      expect(builtInTools.length).toBeGreaterThan(0);
      expect(builtInTools.some(t => t.name === 'bash')).toBe(true);
    });

    it('should provide built-in tool categories', () => {
      const categories = registry.getBuiltInCategories();
      
      expect(categories).toContain('filesystem');
      expect(categories).toContain('system');
      expect(categories).toContain('network');
    });
  });
});
