/**
 * MCP Resources Module Tests - TaskFlow AI v4.0
 */

import type { MCPResource } from '../types';

describe('Resource Types', () => {
  describe('MCPResource', () => {
    it('should create valid resource', () => {
      const r: MCPResource = {
        uri: 'file:///src/index.ts',
        name: 'index.ts',
        description: 'Main entry file',
        mimeType: 'text/typescript',
      };
      expect(r.uri).toBe('file:///src/index.ts');
    });

    it('should support optional metadata', () => {
      const r: MCPResource = {
        uri: 'file:///docs/api.md',
        name: 'api.md',
        description: 'API docs',
        mimeType: 'text/markdown',
        metadata: { size: 4096, lastModified: '2024-01-01', version: '1.0', tags: ['docs'] },
      };
      expect(r.metadata?.tags).toHaveLength(1);
    });
  });
});

describe('Resource Modules', () => {
  it('MCPResourceManager should be importable', async () => {
    const mod = await import('../manager');
    expect(mod.MCPResourceManager).toBeDefined();
  });

  it('ResourceScanner should be importable', async () => {
    const mod = await import('../scanner');
    expect(mod.ResourceScanner).toBeDefined();
  });

  it('DataProviders should be importable', async () => {
    const mod = await import('../data-providers');
    expect(mod).toBeDefined();
  });

  it('defaults should be importable', async () => {
    const mod = await import('../defaults');
    expect(mod).toBeDefined();
  });
});
