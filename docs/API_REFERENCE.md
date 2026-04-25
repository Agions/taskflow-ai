# TaskFlow AI v4.0 - API Reference

## Overview

TaskFlow AI v4.0 provides a comprehensive TypeScript API for building intelligent workflow automation systems.

## Core Types

### Agent Types

**AgentStatus**
```typescript
type AgentStatus = 'idle' | 'thinking' | 'executing' | 'waiting' | 'reflecting' | 'completed' | 'failed';
```

**AgentCapability**
```typescript
type AgentCapability = 'reasoning' | 'code' | 'search' | 'tool_use' | 'collaboration' | 'planning' | 'verification';
```

**AgentConfig**
```typescript
interface AgentConfig {
  id: string;
  name: string;
  description?: string;
  capabilities: AgentCapability[];
  model?: string;
  tools: string[];
  memory: AgentMemoryConfig;
  goalParser?: GoalParser;
  reflectionEnabled?: boolean;
  maxStepsPerGoal?: number;
  customSettings?: Record<string, unknown>;
}
```

**AgentRuntime**
```typescript
interface AgentRuntime {
  id: string;
  execute(task: AgentTask): Promise<TaskResult>;
  getState(): AgentState;
  getConfig(): AgentConfig;
  updateConfig(config: Partial<AgentConfig>): Promise<void>;
  reset(): Promise<void>;
  destroy(): Promise<void>;
  addMessage(message: AgentMessage): void;
  getMessages(limit?: number): AgentMessage[];
}
```

### Workflow Types

**WorkflowStatus**
```typescript
type WorkflowStatus = 'created' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
```

**Workflow**
```typescript
interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  variables: Record<string, unknown>;
  status: WorkflowStatus;
  created: number;
  updated?: number;
  version?: string;
  tags?: string[];
}
```

**WorkflowExecution**
```typescript
interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: WorkflowStatus;
  currentStep?: string;
  stepStatuses: Record<string, StepStatus>;
  variables: Record<string, unknown>;
  outputs: Record<string, unknown>;
  startedAt: number;
  completedAt?: number;
  finishedAt?: number;
  duration?: number;
  error?: WorkflowError;
}
```

### Tool Types

**ToolCategory**
```typescript
type ToolCategory = 'filesystem' | 'shell' | 'http' | 'git' | 'database' | 'code' | 'ai' | 'custom';
```

**ToolRegistry**
```typescript
class ToolRegistry {
  register(definition: ToolDefinition): void;
  get(toolId: string): ToolDefinition | undefined;
  has(toolId: string): boolean;
  listAll(): ToolDefinition[];
  listByCategory(category: ToolCategory): ToolDefinition[];
  unregister(toolId: string): boolean;
  recordUsage(toolId: string): void;
  getStats(toolId: string): object;
  clear(): void;
}
```

### Configuration Types

**TaskFlowConfig**
```typescript
interface TaskFlowConfig {
  version: string;
  workspace: string;
  environment: 'development' | 'staging' | 'production';
  projectName?: string;
  models: ModelConfig[];
  models?: AIModelConfig[];
  cache: CacheConfig;
  logging: LoggingConfig;
  plugins: PluginsConfig;
  extensions: ExtensionsConfig;
  security: SecurityConfig;
  mcpSettings?: MCPSettings;
}
```

**CacheConfig**
```typescript
interface CacheConfig {
  enabled: boolean;
  l1: {
    enabled: boolean;
    maxSize: number;
    ttl: number;
  };
  l2: {
    enabled: boolean;
    ttl: number;
  };
}
```

## Core Modules

### Agent Runtime

**Usage Example:**
```typescript
import { AgentConfig, AgentTask, AgentRuntimeImpl } from './core/agent';

const config: AgentConfig = {
  id: 'agent-1',
  name: 'Research Agent',
  capabilities: ['reasoning', 'search', 'tool_use'],
  tools: ['web-search', 'file-read'],
  memory: {
    maxShortTerm: 50,
    maxLongTerm: 1000
  }
};

const runtime = new AgentRuntimeImpl(config);
const result = await runtime.execute({
  id: 'task-1',
  description: 'Analyze data',
  status: 'pending',
  createdAt: Date.now()
});
```

### Workflow Engine

**Usage Example:**
```typescript
import { Workflow, WorkflowEngine } from './core/workflow';

const workflow: Workflow = {
  id: 'workflow-1',
  name: 'Data Pipeline',
  description: 'Process data from input to output',
  steps: [
    {
      id: 'step-1',
      type: 'task',
      name: 'Input',
      config: {
        taskId: 'input-task',
        input: { source: '/data/input' }
      },
      dependsOn: []
    }
  ],
  variables: {},
  status: 'created',
  created: Date.now()
};

const engine = new WorkflowEngine();
const execution = await engine.execute(workflow);
```

### Tool Registration

**Usage Example:**
```typescript
import { ToolRegistry, ToolDefinition } from './tools/tool-registry';

const registry = new ToolRegistry();

const customTool: ToolDefinition = {
  id: 'custom-tool',
  name: 'Custom Tool',
  description: 'A custom tool',
  category: 'custom',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async (params, context) => {
    return { success: true, output: { result: 'custom' } };
  }
};

registry.register(customTool);
```

## Event System

**Event Bus**
```typescript
import { getEventBus } from './core/events';

const eventBus = getEventBus();

eventBus.emit({
  type: 'task.completed',
  payload: { taskId: 'task-1', result: 'success' },
  timestamp: Date.now(),
  source: 'workflow-engine',
  id: 'event-1'
});

eventBus.on('task.completed', (event) => {
  console.log('Task completed:', event.payload);
});
```

## Extensions

### Plugin System

**Plugin Manifest**
```typescript
interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  main: string;
  dependencies?: Record<string, string>;
  hooks?: string[];
  permissions?: string[];
  tags?: string[];
}
```

**Plugin Hooks**
```typescript
type HookHandler = (context: HookContext) => Promise<HookResult> | HookResult;

interface HookResult {
  continue: boolean;
  data?: Record<string, unknown>;
  error?: string;
}
```

## Performance Optimization

### Caching

**L1 Cache** - Fast in-memory cache with TTL
```typescript
const l1Cache = new L1Cache(100, 600); // max 100 items, 10min TTL
l1Cache.set('key', { data: 'value' });
const value = l1Cache.get('key');
```

**L2 Cache** - Slower but larger cache
```typescript
const l2Cache = new L2Cache(3600); // 1 hour TTL
l2Cache.set('key', { data: 'value' });
const value = l2Cache.get('key');
```

### Concurrency

**Async Task Execution**
```typescript
const tasks = Array.from({ length: 10 }, (_, i) => 
  executeTask(i)
);

const results = await Promise.allSettled(tasks);
```

**Rate Limiting**
```typescript
import { RateLimiter } from './utils/rate-limiter';

const limiter = new RateLimiter(10, 1000); // 10 requests per second

await limiter.acquire();
// Execute your request
```

## Error Handling

**Custom Errors**
```typescript
class TaskFlowError extends Error {
  code: number;
  constructor(message: string, code: number) {
    super(message);
    this.name = 'TaskFlowError';
    this.code = code;
  }
}

throw new TaskFlowError('Invalid configuration', 400);
```

## Type Guards

**Agent Status Guard**
```typescript
function isActiveStatus(status: AgentStatus): status is 'thinking' | 'executing' {
  return status === 'thinking' || status === 'executing';
}

if (isActiveStatus(state.status)) {
  // Handle active states
}
```

## Constants and Utilities

**Built-in Plugin Names**
```typescript
import { BUILTIN_PLUGINS } from './plugins/types';

BUILTIN_PLUGINS.CACHE; // '@taskflow/cache'
BUILTIN_PLUGINS.TELEMETRY; // '@taskflow/telemetry'
```

**Tool Categories**
```typescript
import { ToolCategories } from './types/tool';

ToolCategories.FILESYSTEM; // 'filesystem'
ToolCategories.SHELL; // 'shell'
```

## Best Practices

1. **Always validate configuration** using the ConfigManager
2. **Use proper error handling** with try-catch blocks
3. **Implement proper cleanup** in destroy/reset methods
4. **Use caching** for frequently accessed data
5. **Set appropriate timeouts** for long-running operations
6. **Use event listeners** for monitoring system state
7. **Follow TDD principles** - write tests before implementation
8. **Type-safe API calls** using TypeScript interfaces

## Migration Guide

**From v3.x to v4.0**

1. **Updated imports** - Use unified types from `src/types/`
2. **Agent Runtime** - New AgentRuntime interface replacing AgentCore
3. **Workflow Engine** - Updated WorkflowExecution API
4. **Cache System** - New L1/L2 caching with TTL support
5. **Plugin Hooks** - Updated HookContext and HookResult interfaces

## Version Information

- **Current Version**: 4.0.0
- **TypeScript Version**: 5.9+
- **Node.js Version**: 18+
- **Test Framework**: Jest 29.7.0+

## Support

For detailed usage examples and troubleshooting, see the [Developer Guide](./DEVELOPER_GUIDE.md).
