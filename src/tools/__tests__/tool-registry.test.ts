import { ToolRegistry, ToolDefinition } from '../tool-registry';

describe('ToolRegistry', () => {
  let toolRegistry: ToolRegistry;

  beforeEach(() => {
    toolRegistry = new ToolRegistry();
  });

  it('should register tool', () => {
    const tool: ToolDefinition = {
      id: 'test-tool',
      name: 'Test Tool',
      description: 'A test tool',
      category: 'custom',
      parameters: { type: 'object', properties: {}, required: [] },
      execute: async () => ({ success: true, output: {} })
    };

    toolRegistry.register(tool);
    expect(toolRegistry.has('test-tool')).toBe(true);
  });

  it('should get tool', () => {
    const tool: ToolDefinition = {
      id: 'test-tool',
      name: 'Test Tool',
      description: 'A test tool',
      category: 'custom',
      parameters: { type: 'object', properties: {}, required: [] },
      execute: async () => ({ success: true, output: {} })
    };

    toolRegistry.register(tool);
    const retrieved = toolRegistry.get('test-tool');

    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe('test-tool');
  });

  it('should list tools by category', () => {
    const tool1: ToolDefinition = {
      id: 'file-tool',
      name: 'File Tool',
      description: 'File operations',
      category: 'filesystem',
      parameters: { type: 'object', properties: {}, required: [] },
      execute: async () => ({ success: true, output: {} })
    };

    const tool2: ToolDefinition = {
      id: 'shell-tool',
      name: 'Shell Tool',
      description: 'Shell operations',
      category: 'shell',
      parameters: { type: 'object', properties: {}, required: [] },
      execute: async () => ({ success: true, output: {} })
    };

    toolRegistry.register(tool1);
    toolRegistry.register(tool2);

    const fileTools = toolRegistry.listByCategory('filesystem');
    const shellTools = toolRegistry.listByCategory('shell');

    expect(fileTools.length).toBe(1);
    expect(shellTools.length).toBe(1);
  });

  it('should unregister tool', () => {
    const tool: ToolDefinition = {
      id: 'test-tool',
      name: 'Test Tool',
      description: 'A test tool',
      category: 'custom',
      parameters: { type: 'object', properties: {}, required: [] },
      execute: async () => ({ success: true, output: {} })
    };

    toolRegistry.register(tool);
    toolRegistry.unregister('test-tool');

    expect(toolRegistry.has('test-tool')).toBe(false);
  });
});
