import { ToolDefinition, ToolExecutor, ToolContext, ToolResult as ToolResultType } from '../tool';

describe('Tool Types', () => {
  it('should create a valid tool definition', () => {
    const tool: ToolDefinition = {
      id: 'test-tool',
      name: 'Test Tool',
      description: 'A test tool',
      category: 'custom',
      parameters: {
        type: 'object',
        properties: {
          input: { type: 'string' }
        },
        required: ['input']
      },
      execute: async (params, context) => {
        return {
          success: true,
          output: params.input
        };
      }
    };

    expect(tool.id).toBe('test-tool');
  });

  it('should execute tool', async () => {
    const executor: ToolExecutor = async (params, context) => {
      return {
        success: true,
        output: { result: 'done' }
      };
    };

    const result = await executor({ input: 'test' }, {} as ToolContext);
    expect(result.success).toBe(true);
  });
});
