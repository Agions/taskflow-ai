/**
 * MCP Prompts Module Tests - TaskFlow AI v4.0
 */

import type { MCPPrompt, PromptArgument, PromptMetadata, PromptExample, PromptArguments, PromptRenderOptions, MCPPromptManagerConfig } from '../types';

describe('Prompt Types', () => {
  describe('MCPPrompt', () => {
    it('should create valid prompt', () => {
      const p: MCPPrompt = {
        name: 'code-review',
        description: 'Review code quality',
        template: 'Review: {{code}}',
        arguments: [{ name: 'code', description: 'Code', type: 'string', required: true }],
        category: 'code',
        version: '1.0',
      };
      expect(p.arguments).toHaveLength(1);
    });

    it('should support optional metadata', () => {
      const p: MCPPrompt = {
        name: 'test', description: '', template: '', arguments: [], category: 'test', version: '1.0',
        metadata: { author: 'Agions', tags: ['code'], examples: [{ title: 'Ex', description: 'Example', arguments: { x: 'val' } }] },
      };
      expect(p.metadata?.author).toBe('Agions');
    });
  });

  describe('PromptArgument', () => {
    it('should support 5 types', () => {
      const types: PromptArgument['type'][] = ['string','number','boolean','array','object'];
      expect(types).toHaveLength(5);
    });

    it('should support default value', () => {
      const arg: PromptArgument = { name: 'limit', description: 'Max', type: 'number', required: false, default: 10 };
      expect(arg.default).toBe(10);
    });
  });

  describe('PromptRenderOptions', () => {
    it('should create options', () => {
      const o: PromptRenderOptions = { strict: true, fallback: 'default' };
      expect(o.strict).toBe(true);
    });
  });

  describe('MCPPromptManagerConfig', () => {
    it('should create config', () => {
      const c: MCPPromptManagerConfig = { promptsDir: '/prompts', enableCache: true, cacheSize: 100 };
      expect(c.cacheSize).toBe(100);
    });
  });
});

describe('Prompt Modules', () => {
  it('MCPPromptManager should be importable', async () => {
    const mod = await import('../manager');
    expect(mod.MCPPromptManager).toBeDefined();
  });

  it('PromptRenderer should be importable', async () => {
    const mod = await import('../renderer');
    expect(mod.PromptRenderer).toBeDefined();
  });

  it('PromptLoader should be importable', async () => {
    const mod = await import('../loader');
    expect(mod.PromptLoader).toBeDefined();
  });
});
