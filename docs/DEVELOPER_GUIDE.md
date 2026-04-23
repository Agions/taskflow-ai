# TaskFlow AI v4.0 Developer Guide

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Extension Development](#extension-development)
4. [Plugin Development](#plugin-development)
5. [Custom Agent Development](#custom-agent-development)
6. [Custom Tool Development](#custom-tool-development)
7. [Workflow Development](#workflow-development)
8. [Adapters](#adapters)
9. [Testing](#testing)
10. [Best Practices](#best-practices)

---

## Quick Start

### Installation

```bash
npm install taskflow-ai@4.0.0
```

### Basic Usage

```typescript
import { ExtensionRegistry } from 'taskflow-ai';
import { AIProviderAdapter } from 'taskflow-ai/adapters/ai';

// Initialize extension registry
const registry = ExtensionRegistry.getInstance();

// Register a tool
await registry.register('tool', {
  id: 'hello-world',
  name: 'Hello World Tool',
  version: '1.0.0',
  execute: async (input) => {
    return { message: `Hello, ${input.name}!` };
  },
});

// Execute workflow
const workflow = await registry.getWorkflow('my-workflow');
await workflow.execute({ /* input */ });
```

---

## Architecture Overview

### Core Components

```
src/
├── types/              # Unified type system
│   ├── agent.ts       # Agent type definitions
│   ├── task.ts        # Task type definitions
│   ├── workflow.ts    # Workflow type definitions
│   ├── tool.ts        # Tool type definitions
│   ├── plugin.ts      # Plugin type definitions
│   ├── event.ts       # Event type definitions
│   └── ...
├── core/              # Core infrastructure
│   ├── agent/        # Agent runtime
│   ├── extensions/   # Extension system
│   ├── events/       # Event bus
│   ├── cache/        # Cache manager
│   ├── errors/       # Error handler
│   └── workflow/     # Workflow engine
├── adapters/         # External integrations
│   ├── ai/          # AI provider adapters
│   ├── storage/     # Storage adapters
│   └── protocol/    # Protocol adapters
├── tools/            # Built-in tools
├── workflow/         # Workflow nodes and factory
├── utils/            # Utilities
└── config/           # Configuration management
```

### Type System

The type system is the foundation of TaskFlow AI v4.0:

```typescript
// Agent Types
import { IAgent, AgentConfig, AgentStatus } from 'taskflow-ai/types/agent';

// Task Types
import { ITask, TaskStatus, TaskPriority } from 'taskflow-ai/types/task';

// Workflow Types
import { IWorkflow, WorkflowNode, WorkflowEdge } from 'taskflow-ai/types/workflow';

// Tool Types
import { ITool, ToolInput, ToolOutput } from 'taskflow-ai/types/tool';

// Plugin Types
import { IPlugin, PluginMetadata } from 'taskflow-ai/types/plugin';
```

---

## Extension Development

### Extension Registry

The `ExtensionRegistry` is the central point for registering all extensions:

```typescript
import { ExtensionRegistry, ExtensionType } from 'taskflow-ai/core/extensions/registry';

const registry = ExtensionRegistry.getInstance();

// Check if extension is registered
const exists = await registry.has('tool', 'my-tool');

// Get extension
const tool = await registry.get('tool', 'my-tool');

// List all extensions by type
const tools = await registry.list('tool');

// Unregister extension
await registry.unregister('tool', 'my-tool');
```

### Extension Lifecycle

Extensions go through a lifecycle:

```
load -> validate -> install -> activate -> running -> deactivate -> uninstall
```

Each phase emits events:

```typescript
import { EventBus } from 'taskflow-ai/core/events/event-bus';

const bus = EventBus.getInstance();

bus.on('extension:loaded', (ext) => console.log('Loaded:', ext.id));
bus.on('extension:activated', (ext) => console.log('Activated:', ext.id));
bus.on('extension:error', (err) => console.error('Error:', err));
```

---

## Plugin Development

### Creating a Plugin

A plugin is a package that can contain multiple extensions:

```typescript
import { IPlugin } from 'taskflow-ai/types/plugin';

const myPlugin: IPlugin = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  description: 'My awesome plugin',
  author: 'Your Name',
  metadata: {
    minVersion: '4.0.0',
    maxVersion: '5.0.0',
  },
  async onLoad(registry) {
    // Register tools
    await registry.register('tool', myTool);

    // Register agents
    await registry.register('agent', myAgent);
  },
  async onUnload() {
    // Cleanup
  },
};

export default myPlugin;
```

### Plugin Configuration

Plugins can accept configuration:

```typescript
interface MyPluginConfig {
  apiKey: string;
  maxRetries: number;
}

const myPlugin: IPlugin<MyPluginConfig> = {
  // ... other properties
  async onLoad(registry, config) {
    // Use config.apiKey, config.maxRetries
  },
};
```

---

## Custom Agent Development

### Agent Definition

```typescript
import { IAgent, AgentType, AgentCapability } from 'taskflow-ai/types/agent';

const myAgent: IAgent = {
  id: 'my-agent',
  name: 'My Agent',
  type: AgentType.Custom,
  description: 'My custom agent',

  // Capabilities
  capabilities: [
    AgentCapability.CodeGeneration,
    AgentCapability.DataAnalysis,
  ],

  // Configuration
  config: {
    aiProvider: 'openai',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 4096,
  },

  // Execution logic
  async execute(task, context) {
    // Implement agent logic
    return {
      status: 'success',
      result: 'Task completed',
    };
  },
};

// Register agent
await registry.register('agent', myAgent);
```

### Agent State Management

Agents can maintain state:

```typescript
class StatefulAgent implements IAgent {
  private state: Map<string, any> = new Map();

  setState(key: string, value: any): void {
    this.state.set(key, value);
  }

  getState(key: string): any {
    return this.state.get(key);
  }

  clearState(): void {
    this.state.clear();
  }
}
```

---

## Custom Tool Development

### Tool Definition

```typescript
import { ITool, ToolSchema } from 'taskflow-ai/types/tool';

const myTool: ITool = {
  id: 'my-tool',
  name: 'My Tool',
  version: '1.0.0',
  description: 'My custom tool',

  // Input schema
  schema: {
    type: 'object',
    properties: {
      input: { type: 'string' },
      options: { type: 'object' },
    },
    required: ['input'],
  },

  // Execute function
  async execute(input, context) {
    // Process input
    const result = process(input);

    // Return output
    return {
      success: true,
      data: result,
      metadata: {
        executionTime: performance.now(),
      },
    };
  },

  // Validation
  async validate(input) {
    if (!input.input) {
      throw new Error('Input is required');
    }
    return true;
  },
};

// Register tool
await registry.register('tool', myTool);
```

### Tool Categories

Tools can be categorized:

```typescript
import { ToolCategory } from 'taskflow-ai/types/tool';

const myTool: ITool = {
  // ... other properties
  category: ToolCategory.FileSystem,
  tags: ['file', 'io', 'storage'],
};
```

Available categories:
- `FileSystem`: File system operations
- `Network`: HTTP/REST operations
- `Database`: Database operations
- `CodeAnalysis`: Code analysis
- `Infrastructure`: Infrastructure as code
- `Custom`: Custom tools

---

## Workflow Development

### Workflow Definition

```typescript
import { IWorkflow, WorkflowNode, WorkflowEdge } from 'taskflow-ai/types/workflow';

const myWorkflow: IWorkflow = {
  id: 'my-workflow',
  name: 'My Workflow',
  version: '1.0.0',
  description: 'My custom workflow',

  // Define nodes
  nodes: [
    {
      id: 'node1',
      type: 'task',
      config: {
        toolId: 'my-tool',
        input: { /* ... */ },
      },
    },
    {
      id: 'node2',
      type: 'parallel',
      config: {
        branches: [
          { /* branch 1 */ },
          { /* branch 2 */ },
        ],
      },
    },
  ],

  // Define edges (connections)
  edges: [
    {
      from: 'node1',
      to: 'node2',
      condition: (output) => output.success,
    },
  ],

  // Execute
  async execute(input, context) {
    // Workflow execution logic
    // This is handled by WorkflowEngine
  },
};
```

### Workflow Node Types

Built-in node types:

#### 1. Task Node
```typescript
{
  id: 'task1',
  type: 'task',
  config: {
    toolId: 'my-tool',
    input: { /* tool input */ },
    timeout: 30000, // 30 seconds
  },
}
```

#### 2. Parallel Node
```typescript
{
  id: 'parallel1',
  type: 'parallel',
  config: {
    branches: [
      { /* branch configuration */ },
      { /* branch configuration */ },
    ],
    maxConcurrency: 5,
  },
}
```

#### 3. Condition Node
```typescript
{
  id: 'condition1',
  type: 'condition',
  config: {
    expression: 'output.success && output.status === "ok"',
    trueBranch: 'nextNode1',
    falseBranch: 'nextNode2',
  },
}
```

#### 4. Loop Node
```typescript
{
  id: 'loop1',
  type: 'loop',
  config: {
    loopCondition: 'output.hasMore',
    maxIterations: 100,
    body: { /* loop body node */ },
  },
}
```

#### 5. Transform Node
```typescript
{
  id: 'transform1',
  type: 'transform',
  config: {
    transform: (input) => ({
      processed: input.data.toUpperCase(),
      timestamp: Date.now(),
    }),
  },
}
```

#### 6. Merge Node
```typescript
{
  id: 'merge1',
  type: 'merge',
  config: {
    mergeStrategy: 'all', // or 'any', 'first'
  },
}
```

#### 7. API Call Node
```typescript
{
  id: 'api1',
  type: 'api_call',
  config: {
    url: 'https://api.example.com/endpoint',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: { /* ... */ },
  },
}
```

#### 8. Agent Task Node
```typescript
{
  id: 'agent1',
  type: 'agent_task',
  config: {
    agentId: 'my-agent',
    task: {
      description: 'Analyze this data',
      payload: { /* ... */ },
    },
  },
}
```

### Custom Workflow Nodes

You can register custom node types:

```typescript
import { WorkflowNodeFactory } from 'taskflow-ai/workflow/nodes/factory';

const factory = WorkflowNodeFactory.getInstance();

factory.registerNode('custom_node', {
  execute: async (config, context) => {
    // Custom node logic
    return { /* output */ };
  },
  validate: (config) => {
    // Validation logic
  },
});
```

---

## Adapters

### AI Adapter

AI adapters provide a unified interface for different AI providers:

```typescript
import { AIProviderAdapter } from 'taskflow-ai/adapters/ai/adapter';

const adapter = new AIProviderAdapter({
  provider: 'openai',
  apiKey: 'your-api-key',
  model: 'gpt-4',
});

const response = await adapter.generate({
  messages: [{ role: 'user', content: 'Hello!' }],
  options: {
    temperature: 0.7,
    maxTokens: 1000,
  },
});
```

Supported providers:
- `openai`: OpenAI GPT models
- `anthropic`: Anthropic Claude models
- `deepseek`: DeepSeek models
- `zhipu`: Zhipu AI models

### Storage Adapter

Storage adapters provide a unified interface for different storage backends:

```typescript
import { StorageAdapter } from 'taskflow-ai/adapters/storage/adapter';

const storage = new StorageAdapter({
  provider: 's3',
  config: {
    accessKeyId: '...',
    secretAccessKey: '...',
    bucket: 'my-bucket',
  },
});

// Save data
await storage.save('key', { data: 'value' });

// Retrieve data
const data = await storage.get('key');

// Delete data
await storage.delete('key');
```

Supported providers:
- `local`: File system storage
- `s3`: AWS S3
- `postgresql`: PostgreSQL database

### Protocol Adapter

Protocol adapters handle communication protocols:

```typescript
import { ProtocolAdapter } from 'taskflow-ai/adapters/protocol/adapter';

const protocol = new ProtocolAdapter({
  provider: 'websocket',
  url: 'ws://localhost:8080',
});

// Connect
await protocol.connect();

// Send message
await protocol.send({ type: 'message', data: { /* ... */ } });

// Receive messages
protocol.on('message', (msg) => console.log(msg));
```

Supported protocols:
- `http`: REST API
- `websocket`: WebSocket

---

## Testing

### Unit Tests

```typescript
import { describe, it, expect } from '@jest/globals';
import { myTool } from './my-tool';

describe('MyTool', () => {
  it('should process input correctly', async () => {
    const result = await myTool.execute({ input: 'test' });
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should validate input', async () => {
    await expect(myTool.validate({})).rejects.toThrow();
  });
});
```

### Integration Tests

```typescript
import { ExtensionRegistry } from 'taskflow-ai/core/extensions/registry';

describe('Extension Integration', () => {
  it('should register and execute tool', async () => {
    const registry = ExtensionRegistry.getInstance();
    await registry.register('tool', myTool);

    const tool = await registry.get('tool', 'my-tool');
    const result = await tool.execute({ input: 'test' });

    expect(result.success).toBe(true);
  });
});
```

### Test Coverage

Run tests with coverage:

```bash
npm run test:coverage
```

Target: 95% coverage

---

## Best Practices

### 1. Type Safety

Always use TypeScript types:

```typescript
// Good
import { ITool } from 'taskflow-ai/types/tool';

const tool: ITool = { /* ... */ };

// Bad (avoid `any`)
const tool: any = { /* ... */ }; // ❌
```

### 2. Error Handling

Always handle errors properly:

```typescript
try {
  const result = await tool.execute(input);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation error:', error.message);
  } else if (error instanceof ExecutionError) {
    console.error('Execution error:', error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

### 3. Resource Management

Clean up resources:

```typescript
class MyTool implements ITool {
  private connection: Connection;

  async initialize() {
    this.connection = await Connection.create();
  }

  async cleanup() {
    if (this.connection) {
      await this.connection.close();
    }
  }
}
```

### 4. Logging

Use structured logging:

```typescript
import { Logger } from 'taskflow-ai/utils/logger';

const logger = Logger.getInstance({ context: 'MyTool' });

logger.info('Tool execution started', { input });
logger.error('Tool execution failed', { error });
```

### 5. Caching

Use caching for expensive operations:

```typescript
import { CacheManager } from 'taskflow-ai/core/cache/manager';

const cache = CacheManager.getInstance();

const cached = await cache.get('my-key');
if (cached) {
  return cached;
}

const result = await expensiveOperation();
await cache.set('my-key', result, { ttl: 3600 }); // 1 hour TTL
```

### 6. Event-Driven Architecture

Use events for loose coupling:

```typescript
import { EventBus } from 'taskflow-ai/core/events/event-bus';

const bus = EventBus.getInstance();

// Publish event
bus.publish('tool:executed', { toolId, result });

// Subscribe to event
bus.subscribe('tool:executed', (event) => {
  console.log('Tool executed:', event.toolId);
});
```

### 7. Async/Await

Always use async/await for async operations:

```typescript
// Good
async function myFunction() {
  const result = await doSomething();
  return result;
}

// Bad (avoid callbacks)
function myFunction(callback) {
  doSomething().then(result => callback(result)); // ❌
}
```

---

## Performance Tips

1. **Use caching** for expensive operations
2. **Batch requests** when possible
3. **Use streaming** for large datasets
4. **Limit concurrency** to avoid resource exhaustion
5. **Profile your code** with performance tools

---

## Troubleshooting

### Extension Not Loading

```typescript
// Check if extension is registered
const exists = await registry.has('tool', 'my-tool');
console.log('Extension exists:', exists);

// Check if extension is activated
const ext = await registry.get('tool', 'my-tool');
console.log('Extension status:', ext.status);
```

### Workflow Execution Failed

```typescript
// Enable debug logging
Logger.getInstance().setLevel('debug');

// Check workflow definition
console.log('Workflow nodes:', workflow.nodes);
console.log('Workflow edges:', workflow.edges);
```

### Tool Execution Timeout

```typescript
// Increase timeout
const tool: ITool = {
  // ... other properties
  config: {
    timeout: 60000, // 60 seconds
  },
};
```

---

## Resources

- **API Reference**: [docs/api-reference.md](./api-reference.md)
- **Examples**: [examples/](../examples/)
- **Migration Guide**: [docs/migration-guide.md](./migration-guide.md)
- **Community**: [GitHub Discussions](https://github.com/Agions/taskflow-ai/discussions)

---

## License

MIT License - see [LICENSE](../LICENSE) for details.
