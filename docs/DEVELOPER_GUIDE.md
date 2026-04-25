# TaskFlow AI v4.0 - Developer Guide

## Getting Started

### Installation

```bash
npm install @taskflow/ai
# or
pnpm add @taskflow/ai
```

### Quick Start

```typescript
import { TaskFlowAI } from '@taskflow/ai';

// Initialize TaskFlow AI
const taskflow = new TaskFlowAI({
  workspace: './workspace',
  models: [
    {
      id: 'gpt-4',
      provider: 'openai',
      modelName: 'gpt-4',
      enabled: true,
      priority: 1,
      capabilities: ['chat', 'function_calling']
    }
  ]
});

// Execute a task
const result = await taskflow.execute({
  description: 'Research modern web frameworks'
});

console.log(result.output);
```

## Architecture Overview

### Core Components

1. **Agent Runtime** - Manages AI agent lifecycle
2. **Workflow Engine** - Executes complex workflows
3. **Tool Registry** - Manages available tools
4. **Event System** - Handles event-driven communication
5. **Cache Layer** - L1/L2 caching for performance
6. **Extension System** - Plugin/Agent/Tool/Workflow extensions

### Module Structure

```
src/
├── core/           # Core functionality
│   ├── agent/      # Agent runtime and coordination
│   ├── workflow/   # Workflow execution engine
│   ├── tools/      # Tool registry and management
│   ├── events/     # Event bus and handlers
│   ├── cache/      # Caching layer
│   ├── ai/         # AI adapter integration
│   └── extensions/ # Extension system
├── types/          # Unified type definitions
├── tools/          # Built-in tools
├── adapters/       # External service adapters
├── cli/            # Command-line interface
├── mcp/            # MCP integration
└── utils/          # Utility functions
```

## Extension Development

### 1. Plugin Development

**Create a Plugin Manifest**
```typescript
// plugins/my-plugin/package.json
{
  "name": "@taskflow/my-plugin",
  "version": "1.0.0",
  "main": "dist/index.js",
  "taskflow": {
    "name": "My Plugin",
    "description": "A sample plugin",
    "hooks": ["beforeWorkflowExecute", "afterTaskComplete"],
    "permissions": ["read:workspace"]
  }
}
```

**Implement Plugin Interface**
```typescript
// plugins/my-plugin/src/index.ts
import type { TaskFlowPlugin } from '@taskflow/core';

export const plugin: TaskFlowPlugin = {
  manifest: {
    name: 'my-plugin',
    version: '1.0.0',
    description: 'My Custom Plugin',
    author: 'Your Name',
    main: 'dist/index.js'
  },
  
  async onLoad(context) {
    console.log('Plugin loaded');
  },
  
  async onEnable() {
    console.log('Plugin enabled');
  },
  
  async onDisable() {
    console.log('Plugin disabled');
  },
  
  async onUnload() {
    console.log('Plugin unloaded');
  },
  
  hooks: {
    beforeWorkflowExecute: async (context) => {
      console.log('Workflow about to execute');
      return { continue: true, data: {} };
    }
  }
};
```

### 2. Custom Agent Development

**Create Agent Definition**
```typescript
// src/extensions/agents/research-agent.ts
import type { AgentDefinition, AgentConfig } from '../../types/agent';

const researchAgent: AgentDefinition = {
  type: 'research',
  name: 'Research Agent',
  description: 'Specializes in research tasks',
  capabilities: ['reasoning', 'search', 'tool_use'],
  defaultConfig: {
    capabilities: ['reasoning', 'search', 'tool_use'],
    tools: ['web-search', 'document-analyzer'],
    memory: {
      maxShortTerm: 100,
      maxLongTerm: 2000
    },
    reflectionEnabled: true,
    maxStepsPerGoal: 25
  },
  
  factory: async (config: AgentConfig) => {
    const runtime = new AgentRuntimeImpl(config);
    
    // Add custom research logic
    runtime.addMessage({
      id: 'init',
      role: 'system',
      content: 'You are a research assistant specialized in finding and analyzing information.',
      timestamp: Date.now()
    });
    
    return runtime;
  }
};

export { researchAgent };
```

**Register Custom Agent**
```typescript
import { getExtensionRegistry } from './core/extensions';

const registry = getExtensionRegistry();
registry.registerAgent('research', researchAgent);
```

### 3. Custom Tool Development

**Create Tool Definition**
```typescript
// src/extensions/tools/date-calculator.ts
import type { ToolDefinition, ToolContext } from '../../types/tool';

export const dateCalculator: ToolDefinition = {
  id: 'date-calculator',
  name: 'Date Calculator',
  description: 'Calculate dates and time intervals',
  category: 'code',
  parameters: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['add', 'subtract', 'difference']
      },
      startDate: { type: 'string', format: 'date' },
      days: { type: 'number' }
    },
    required: ['operation', 'startDate']
  },
  permissions: [],
  
  execute: async (params, context: ToolContext) => {
    const { operation, startDate, days = 0 } = params as any;
    const start = new Date(startDate);
    let result;
    
    switch (operation) {
      case 'add':
        result = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
        break;
      case 'subtract':
        result = new Date(start.getTime() - days * 24 * 60 * 60 * 1000);
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
    
    return {
      success: true,
      output: { result: result.toISOString() }
    };
  }
};
```

**Register Tool**
```typescript
import { getToolRegistry } from './tools/tool-registry';

const registry = getToolRegistry();
registry.register(dateCalculator);
```

### 4. Custom Workflow Development

**Create Workflow Definition**
```typescript
// src/extensions/workflows/data-pipeline.ts
import type { Workflow } from '../../types/workflow';

export const dataPipelineWorkflow: Workflow = {
  id: 'data-pipeline',
  name: 'Data Pipeline Workflow',
  description: 'Process data from input to output with validation',
  steps: [
    {
      id: 'input',
      type: 'task',
      name: 'Load Input Data',
      config: {
        taskId: 'file-read',
        input: { path: '${inputPath}' }
      },
      dependsOn: []
    },
    {
      id: 'validate',
      type: 'task',
      name: 'Validate Data',
      config: {
        taskId: 'data-validator',
        input: { schema: '${validationSchema}' }
      },
      dependsOn: ['input']
    },
    {
      id: 'process',
      type: 'task',
      name: 'Process Data',
      config: {
        taskId: 'data-processor',
        input: { processor: '${processorType}' }
      },
      dependsOn: ['validate']
    },
    {
      id: 'check-success',
      type: 'condition',
      name: 'Check Processing Result',
      config: {
        expression: '${processResult.success} === true',
        trueBranch: 'output',
        falseBranch: 'error-handler'
      },
      dependsOn: ['process']
    }
  ],
  variables: {
    inputPath: '/data/input.json',
    validationSchema: 'data-schema',
    processorType: 'transform'
  },
  status: 'created',
  created: Date.now(),
  version: '1.0.0',
  tags: ['pipeline', 'data-processing']
};
```

**Register Workflow**
```typescript
import { getWorkflowRegistry } from './core/workflow';

const registry = getWorkflowRegistry();
registry.register('data-pipeline', dataPipelineWorkflow);
```

## Testing Guide

### Unit Testing

```typescript
// src/core/agent/__tests__/runtime.test.ts
import { AgentRuntimeImpl } from '../runtime';

describe('AgentRuntime', () => {
  let runtime: AgentRuntimeImpl;
  
  beforeEach(() => {
    runtime = new AgentRuntimeImpl({
      id: 'test-agent',
      name: 'Test Agent',
      capabilities: ['reasoning'],
      tools: [],
      memory: { maxShortTerm: 50, maxLongTerm: 1000 }
    });
  });
  
  afterEach(async () => {
    await runtime.destroy();
  });
  
  it('should execute task successfully', async () => {
    const result = await runtime.execute({
      id: 'task-1',
      description: 'Test task',
      status: 'pending',
      createdAt: Date.now()
    });
    
    expect(result.success).toBe(true);
  });
});
```

### Integration Testing

```typescript
// __tests__/integration/workflow.test.ts
import { WorkflowEngine } from '../src/core/workflow';
import { getToolRegistry } from '../src/tools/tool-registry';

describe('Workflow Integration', () => {
  it('should execute complete workflow', async () => {
    const engine = new WorkflowEngine();
    const workflow = createTestWorkflow();
    
    const result = await engine.execute(workflow);
    
    expect(result.success).toBe(true);
    expect(result.execution.finishedAt).toBeDefined();
  });
});
```

### Performance Testing

```typescript
// __tests__/performance/cache.test.ts
describe('Cache Performance', () => {
  it('should handle 10,000 cache operations in under 100ms', () => {
    const cache = new L1Cache(10000, 600);
    const startTime = Date.now();
    
    for (let i = 0; i < 10000; i++) {
      cache.set(`key-${i}`, { value: `value-${i}` });
    }
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(100);
  });
});
```

## Configuration Management

### Environment Variables

```bash
# .env
TASKFLOW_ENVIRONMENT=development
TASKFLOW_LOG_LEVEL=info
TASKFLOW_CACHE_ENABLED=true
TASKFLOW_API_KEY=your-api-key
```

### Configuration Loading

```typescript
import { ConfigManager } from './config/config-manager';

const configManager = ConfigManager.getInstance();

// Load from file
await configManager.load('./config/taskflow.config.json');

// Update configuration
configManager.updateConfig({
  cache: {
    enabled: true,
    l1: { enabled: true, maxSize: 100, ttl: 600 },
    l2: { enabled: false, ttl: 3600 }
  }
});

// Get model configuration
const model = configManager.getModel('gpt-4');
```

## Best Practices

### 1. Error Handling

```typescript
try {
  const result = await runtime.execute(task);
  if (!result.success) {
    throw new Error(`Task execution failed: ${result.error}`);
  }
} catch (error) {
  logger.error('Task execution error', { error, taskId: task.id });
  // Handle error appropriately
}
```

### 2. Resource Management

```typescript
class AgentManager {
  private agents: Map<string, AgentRuntime> = new Map();
  
  async createAgent(config: AgentConfig): Promise<string> {
    const runtime = new AgentRuntimeImpl(config);
    this.agents.set(config.id, runtime);
    return config.id;
  }
  
  async destroyAgent(agentId: string): Promise<void> {
    const runtime = this.agents.get(agentId);
    if (runtime) {
      await runtime.destroy();
      this.agents.delete(agentId);
    }
  }
  
  async cleanupAll(): Promise<void> {
    const destroyPromises = Array.from(this.agents.entries())
      .map(([id, runtime]) => runtime.destroy());
    
    await Promise.all(destroyPromises);
    this.agents.clear();
  }
}
```

### 3. Caching Strategy

```typescript
// Use cache for expensive operations
async function fetchWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  // Check L1 cache
  const cached = l1Cache.get<T>(key);
  if (cached) return cached;
  
  // Fetch data
  const data = await fetcher();
  
  // Store in L1 cache
  l1Cache.set(key, data);
  
  return data;
}

// Promote hot data to L1
async function getFrequentlyUsedData(key: string): Promise<Data> {
  let data = l1Cache.get<Data>(key);
  
  if (!data) {
    // Check L2 cache
    data = await l2Cache.get<Data>(key);
    
    if (data && isHotKey(key)) {
      // Promote to L1
      l1Cache.set(key, data);
    }
  }
  
  return data;
}
```

### 4. Concurrency Control

```typescript
class ConcurrencyManager {
  private runningTasks = new Set<string>();
  private maxConcurrent = 10;
  
  async execute<T>(taskId: string, task: () => Promise<T>): Promise<T> {
    while (this.runningTasks.size >= this.maxConcurrent) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.runningTasks.add(taskId);
    
    try {
      return await task();
    } finally {
      this.runningTasks.delete(taskId);
    }
  }
}
```

## Troubleshooting

### Common Issues

**Issue: Agent not responding**
- Check agent status using `runtime.getState()`
- Verify task configuration
- Check logs for error messages

**Issue: Workflow execution timeout**
- Increase timeout in workflow configuration
- Check for inefficient steps
- Enable performance monitoring

**Issue: Cache not working**
- Verify cache is enabled in configuration
- Check TTL settings
- Monitor cache hit rate

### Debug Mode

```typescript
// Enable debug logging
import { Logger } from './utils/logger';

Logger.setLevel('debug');

// Run with debug environment
TASKFLOW_ENVIRONMENT=development TASKFLOW_LOG_LEVEL=debug npm start
```

## Performance Tips

1. **Enable caching** for frequently accessed data
2. **Use parallel execution** for independent tasks
3. **Optimize database queries** with proper indexing
4. **Implement rate limiting** for external APIs
5. **Monitor memory usage** and clean up resources
6. **Use async/await** properly to avoid blocking
7. **Batch operations** when possible
8. **Cache expensive computations**

## Resources

- [API Reference](./API_REFERENCE.md)
- [Performance Guide](./PERFORMANCE_GUIDE.md)
- [Examples](./examples/)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## Get Help

- GitHub Issues: [github.com/taskflow/ai/issues](https://github.com/taskflow/ai/issues)
- Discord Community: [discord.gg/taskflow](https://discord.gg/taskflow)
- Email: [support@taskflow.ai](mailto:support@taskflow.ai)

---

**Version**: 4.0.0  
**Last Updated**: 2025-04-25  
**License**: MIT
