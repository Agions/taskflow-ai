// @ts-nocheck
import { WorkflowNodeFactory, WorkflowNodeDefinition, NodeExecutor } from '../workflow-node-factory';

describe('WorkflowNodeFactory', () => {
  let factory: WorkflowNodeFactory;

  beforeEach(() => {
    factory = new WorkflowNodeFactory();
  });

  it('should register workflow node', () => {
    const node: WorkflowNodeDefinition = {
      type: 'custom-node',
      name: 'Custom Node',
      description: 'A custom workflow node',
      inputSchema: { type: 'object', properties: {} },
      outputSchema: { type: 'object', properties: {} },
      executor: async () => ({ success: true, output: {}, nextSteps: [] })
    };

    factory.register(node);
    expect(factory.has('custom-node')).toBe(true);
  });

  it('should get workflow node', () => {
    const node: WorkflowNodeDefinition = {
      type: 'custom-node',
      name: 'Custom Node',
      description: 'A custom workflow node',
      inputSchema: { type: 'object', properties: {} },
      outputSchema: { type: 'object', properties: {} },
      executor: async () => ({ success: true, output: {}, nextSteps: [] })
    };

    factory.register(node);
    const retrieved = factory.get('custom-node');

    expect(retrieved).toBeDefined();
    expect(retrieved?.type).toBe('custom-node');
  });

  it('should execute workflow node', async () => {
    const node: WorkflowNodeDefinition = {
      type: 'test-node',
      name: 'Test Node',
      description: 'A test node',
      inputSchema: {
        type: 'object',
        properties: {
          value: { type: 'number' }
        },
        required: ['value']
      },
      outputSchema: {
        type: 'object',
        properties: {
          result: { type: 'number' }
        }
      },
      executor: async (input, context) => {
        return {
          success: true,
          output: { result: input.value! * 2 },
          nextSteps: []
        };
      }
    };

    factory.register(node);
    const result = await factory.execute('test-node', { value: 5 }, {} as any);

    expect(result.output?.result).toBe(10);
  });
});
