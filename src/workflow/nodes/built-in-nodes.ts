/**
 * Built-In Workflow Nodes - 内置工作流节点
 * TaskFlow AI v4.0
 */

import { WorkflowNodeDefinition, NodeExecutor } from '../../types/workflow';

export class BuiltInNodes {
  private nodes: Map<string, WorkflowNodeDefinition> = new Map();

  constructor() {
    this.initializeCoreNodes();
    this.initializeDataNodes();
    this.initializeControlNodes();
    this.initializeIntegrationNodes();
  }

  private initializeCoreNodes(): void {
    // task 节点
    this.register({
      type: 'task',
      name: 'Task',
      description: 'Execute a task',
      inputSchema: {
        type: 'object',
        properties: {
          taskId: { type: 'string' },
          input: { type: 'object' }
        },
        required: ['taskId', 'input']
      },
      outputSchema: {
        type: 'object',
        properties: {
          result: {},
          success: { type: 'boolean' }
        }
      },
      executor: async (input, context) => {
        // Implementation would integrate with Task system
        return {
          success: true,
          output: { result: 'Task completed' },
          nextSteps: []
        };
      }
    });

    // parallel 节点
    this.register({
      type: 'parallel',
      name: 'Parallel',
      description: 'Execute steps in parallel',
      parallelizable: true,
      inputSchema: {
        type: 'object',
        properties: {
          steps: { type: 'array', items: { type: 'object' } }
        },
        required: ['steps']
      },
      outputSchema: {
        type: 'object',
        properties: {
          results: { type: 'array' }
        }
      },
      executor: async (input, context) => {
        const steps = input.steps as unknown[];
        const results = await Promise.all(
          steps.map(() => ({ success: true, data: {} }))
        );
        return {
          success: true,
          output: { results },
          nextSteps: []
        };
      }
    });
  }

  private initializeDataNodes(): void {
    // transform 节点
    this.register({
      type: 'transform',
      name: 'Transform',
      description: 'Transform input data',
      parallelizable: true,
      inputSchema: {
        type: 'object',
        properties: {
          data: {},
          transform: { type: 'string' }
        },
        required: ['data', 'transform']
      },
      outputSchema: {
        type: 'object',
        properties: {
          result: {}
        }
      },
      executor: async (input: Record<string, unknown>, context: NodeContext) => {
        // Implementation would apply transformations
        return {
          success: true,
          output: { result: input.data },
          nextSteps: []
        };
      }
    });

    // merge 节点
    this.register({
      type: 'merge',
      name: 'Merge',
      description: 'Merge multiple data sources',
      inputSchema: {
        type: 'object',
        properties: {
          sources: { type: 'array', items: { type: 'object' } },
          strategy: { type: 'string' }
        },
        required: ['sources']
      },
      outputSchema: {
        type: 'object',
        properties: {
          merged: {}
        }
      },
      executor: async (input: Record<string, unknown>, context: NodeContext) => {
        const sources = input.sources as unknown[];
        const merged = sources.reduce((acc, src) => ({ ...acc, ...(src as Record<string, unknown>) }), {});
        return {
          success: true,
          output: { merged },
          nextSteps: []
        };
      }
    });
  }

  private initializeControlNodes(): void {
    // condition 节点
    this.register({
      type: 'condition',
      name: 'Condition',
      description: 'Conditional branch',
      inputSchema: {
        type: 'object',
        properties: {
          condition: { type: 'boolean' },
          trueBranch: { type: 'string' },
          falseBranch: { type: 'string' }
        },
        required: ['condition']
      },
      outputSchema: {
        type: 'object',
        properties: {}
      },
      executor: async (input: Record<string, unknown>, context: NodeContext) => {
        const condition = input.condition as boolean;
        const nextStep = condition ? input.trueBranch : input.falseBranch;
        return {
          success: true,
          output: {},
          nextSteps: nextStep ? [nextStep as string] : []
        };
      }
    });

    // loop 节点
    this.register({
      type: 'loop',
      name: 'Loop',
      description: 'Loop over items',
      inputSchema: {
        type: 'object',
        properties: {
          items: { type: 'array' },
          itemVariable: { type: 'string' },
          body: { type: 'array', items: { type: 'object' } }
        },
        required: ['items', 'itemVariable', 'body']
      },
      outputSchema: {
        type: 'object',
        properties: {
          results: { type: 'array' }
        }
      },
      executor: async (input: Record<string, unknown>, context: NodeContext) => {
        const items = input.items as unknown[];
        const results = items.map((item, index) => ({ index, result: item }));
        return {
          success: true,
          output: { results },
          nextSteps: []
        };
      }
    });
  }

  private initializeIntegrationNodes(): void {
    // api_call 节点
    this.register({
      type: 'api_call',
      name: 'API Call',
      description: 'Make API requests',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'] },
          headers: { type: 'object' },
          body: { type: 'object' }
        },
        required: ['url', 'method']
      },
      outputSchema: {
        type: 'object',
        properties: {
          status: { type: 'number' },
          data: {}
        }
      },
      executor: async (input: Record<string, unknown>, context: NodeContext) => {
        try {
          const response = await fetch(input.url as string, {
            method: input.method as string,
            headers: input.headers as Record<string, string>,
            body: input.body ? JSON.stringify(input.body) : undefined
          });
          const data = await response.json();
          return {
            success: response.ok,
            output: { status: response.status, data },
            nextSteps: []
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            nextSteps: []
          };
        }
      }
    });

    // agent_task 节点
    this.register({
      type: 'agent_task',
      name: 'Agent Task',
      description: 'Run agent task',
      inputSchema: {
        type: 'object',
        properties: {
          agentId: { type: 'string' },
          task: { type: 'string' }
        },
        required: ['agentId', 'task']
      },
      outputSchema: {
        type: 'object',
        properties: {
          result: {}
        }
      },
      executor: async (input: Record<string, unknown>, context: NodeContext) => {
        // Implementation would integrate with Agent system
        return {
          success: true,
          output: { result: 'Agent task completed' },
          nextSteps: []
        };
      }
    });
  }

  private register(definition: WorkflowNodeDefinition): void {
    this.nodes.set(definition.type, definition);
  }

  public get(nodeType: string): WorkflowNodeDefinition | undefined {
    return this.nodes.get(nodeType);
  }

  public getAll(): WorkflowNodeDefinition[] {
    return Array.from(this.nodes.values());
  }

  public registerWithFactory(factory: any): void {
    factory.registerBatch(this.getAll());
  }
}
