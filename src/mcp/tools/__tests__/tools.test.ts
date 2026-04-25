/**
 * MCP Tools Module Tests - TaskFlow AI v4.0
 */

import type {
  ToolDefinition, ToolContext, ToolExample, ToolRegistration,
  ToolCategory, AuthConfig, RateLimitConfig,
  ToolResponse, ToolResult, ToolCallRequest, ToolCallResponse,
  MCPTool, MCPToolsListResponse,
} from '../types';
import { PermissionLevel, toolError, toolOk } from '../types';

describe('Tool Types', () => {
  describe('ToolDefinition', () => {
    it('should create valid tool', () => {
      const t: ToolDefinition = {
        name: 'fs_read',
        description: 'Read file',
        inputSchema: { type: 'object' },
        handler: async () => ({ success: true }),
      };
      expect(t.name).toBe('fs_read');
    });

    it('should support enhanced fields', () => {
      const t: ToolDefinition = {
        name: 'shell',
        description: 'Run shell',
        inputSchema: {},
        handler: async () => ({}),
        category: 'execution',
        tags: ['shell', 'system'],
        version: '2.0',
        auth: { type: 'bearer', required: true },
        rateLimit: { maxCalls: 10, windowMs: 60000 },
        permissions: [PermissionLevel.EXECUTE],
        examples: [{ input: { cmd: 'ls' }, description: 'List files' }],
      };
      expect(t.permissions).toContain(PermissionLevel.EXECUTE);
    });
  });

  describe('PermissionLevel enum', () => {
    it('should have 5 levels with bitfield values', () => {
      expect(PermissionLevel.NONE).toBe(0);
      expect(PermissionLevel.READ).toBe(1);
      expect(PermissionLevel.WRITE).toBe(2);
      expect(PermissionLevel.EXECUTE).toBe(4);
      expect(PermissionLevel.ADMIN).toBe(8);
    });
  });

  describe('AuthConfig', () => {
    it('should support 4 auth types', () => {
      const types: AuthConfig['type'][] = ['none','bearer','basic','apiKey'];
      expect(types).toHaveLength(4);
    });
  });

  describe('toolError helper', () => {
    it('should create error response', () => {
      const r = toolError('ENOENT', 'File not found', { recoverable: true, tool: 'fs', duration: 5 });
      expect(r.success).toBe(false);
      expect(r.error?.code).toBe('ENOENT');
      expect(r.error?.recoverable).toBe(true);
      expect(r.metadata.tool).toBe('fs');
    });
  });

  describe('toolOk helper', () => {
    it('should create success response', () => {
      const r = toolOk({ content: 'hello' }, { tool: 'fs', duration: 10, tokens: 50 });
      expect(r.success).toBe(true);
      expect(r.data?.content).toBe('hello');
      expect(r.metadata.tokens).toBe(50);
    });
  });

  describe('ToolResponse', () => {
    it('should create full response', () => {
      const r: ToolResponse<string> = {
        success: true,
        data: 'result',
        metadata: { tool: 'test', duration: 100, timestamp: Date.now(), cacheHit: true },
      };
      expect(r.metadata.cacheHit).toBe(true);
    });
  });

  describe('ToolRegistration', () => {
    it('should create valid registration', () => {
      const reg: ToolRegistration = {
        tool: {} as ToolDefinition,
        registeredAt: Date.now(),
        callCount: 0,
      };
      expect(reg.callCount).toBe(0);
    });
  });

  describe('MCPTool', () => {
    it('should create valid MCP tool', () => {
      const t: MCPTool = {
        name: 'read',
        description: 'Read',
        inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
      };
      expect(t.inputSchema.type).toBe('object');
    });
  });

  describe('ToolCallRequest/Response', () => {
    it('should create request', () => {
      const req: ToolCallRequest = { name: 'read', arguments: { path: '/tmp' }, id: 'c1' };
      expect(req.id).toBe('c1');
    });

    it('should create response', () => {
      const res: ToolCallResponse = { id: 'c1', result: 'data' };
      expect(res.result).toBe('data');
    });
  });
});

describe('Tool Modules', () => {
  it('ToolRegistry should be importable', async () => {
    const mod = await import('../registry');
    expect(mod.ToolRegistry).toBeDefined();
  });

  it('built-in tools should be importable', async () => {
    const mod = await import('../built-in');
    expect(mod).toBeDefined();
  });

  it('categories should be importable', async () => {
    const mod = await import('../categories');
    expect(mod).toBeDefined();
  });
});
