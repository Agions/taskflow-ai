# TaskFlow AI v4.0 API Reference

**[中文版 🇨🇳](./api-reference.md)**

## Core Modules

### @taskflow-ai/types

Type definitions for TaskFlow AI.

#### Agent Types

```typescript
interface IAgent {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  capabilities: AgentCapability[];
  config: AgentConfig;
  execute(task: ITask, context: ExecutionContext): Promise<TaskResult>;
}

enum AgentType {
  Assistant = 'assistant',
  Coder = 'coder',
  Researcher = 'researcher',
  Orchestrator = 'orchestrator',
  Custom = 'custom',
}

enum AgentCapability {
  CodeGeneration = 'code_generation',
  DataAnalysis = 'data_analysis',
  DocumentProcessing = 'document_processing',
  WorkflowExecution = 'workflow_execution',
  ToolCalling = 'tool_calling',
  MemoryManagement = 'memory_management',
  MultiAgentCoordination = 'multi_agent_coordination',
}

interface AgentConfig {
  aiProvider: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  retryPolicy?: RetryPolicy;
  memoryConfig?: MemoryConfig;
}
```

#### Task Types

```typescript
interface ITask {
  id: string;
  type: TaskType;
  description: string;
  input: any;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: TaskResult;
}

enum TaskType {
  CodeGeneration = 'code_generation',
  DataAnalysis = 'data_analysis',
  DocumentProcessing = 'document_processing',
  ToolExecution = 'tool_execution',
  Custom = 'custom',
}

enum TaskStatus {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

enum TaskPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

interface TaskResult {
  success: boolean;
  output?: any;
  error?: Error;
  metadata?: TaskMetadata;
}
```

#### Workflow Types

```typescript
interface IWorkflow {
  id: string;
  name: string;
  version: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  config?: WorkflowConfig;
  execute(input: any, context: ExecutionContext): Promise<WorkflowResult>;
}

interface WorkflowNode {
  id: string;
  type: string;
  config: any;
  metadata?: NodeMetadata;
}

interface WorkflowEdge {
  from: string;
  to: string;
  condition?: EdgeCondition;
  metadata?: EdgeMetadata;
}

interface WorkflowResult {
  success: boolean;
  output: any;
  executionTime: number;
  nodeResults: Map<string, NodeResult>;
}
```

#### Tool Types

```typescript
interface ITool {
  id: string;
  name: string;
  version: string;
  description: string;
  category: ToolCategory;
  tags: string[];
  schema: ToolSchema;
  execute(input: ToolInput, context: ExecutionContext): Promise<ToolOutput>;
  validate(input: ToolInput): Promise<boolean>;
}

enum ToolCategory {
  FileSystem = 'filesystem',
  Network = 'network',
  Database = 'database',
  CodeAnalysis = 'code_analysis',
  Infrastructure = 'infrastructure',
  Custom = 'custom',
}

interface ToolInput {
  [key: string]: any;
}

interface ToolOutput {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    executionTime: number;
    memoryUsage?: number;
  };
}

interface ToolSchema {
  type: 'object';
  properties: { [key: string]: PropertySchema };
  required?: string[];
}
```

#### Plugin Types

```typescript
interface IPlugin<T = any> {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  metadata: PluginMetadata;

  onLoad(registry: ExtensionRegistry, config?: T): Promise<void>;
  onUnload(): Promise<void>;

  // Optional hooks
  onActivate?(): Promise<void>;
  onDeactivate?(): Promise<void>;
}

interface PluginMetadata {
  minVersion: string;
  maxVersion?: string;
  dependencies?: string[];
}
```

#### Extension Types

```typescript
interface IExtension<T = any> {
  id: string;
  type: ExtensionType;
  metadata: ExtensionMetadata;
  implementation: T;

  // Lifecycle
  load(): Promise<void>;
  activate(): Promise<void>;
  deactivate(): Promise<void>;
  unload(): Promise<void>;
}

enum ExtensionType {
  Plugin = 'plugin',
  Agent = 'agent',
  Tool = 'tool',
  Workflow = 'workflow',
}

interface ExtensionMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  [key: string]: any;
}
```

---

### @taskflow-ai/core/agent

Agent runtime and management.

#### AgentRuntimeImpl

Main agent runtime implementation.

```typescript
class AgentRuntimeImpl implements IAgentRuntime {
  constructor(config: RuntimeConfig);

  // Agent management
  registerAgent(agent: IAgent): Promise<void>;
  unregisterAgent(agentId: string): Promise<void>;
  getAgent(agentId: string): Promise<IAgent>;
  listAgents(): Promise<IAgent[]>;

  // Task execution
  execute(task: ITask, agentId: string): Promise<TaskResult>;
  executeBatch(tasks: ITask[], agentId: string): Promise<TaskResult[]>;

  // Lifecycle
  start(): Promise<void>;
  stop(): Promise<void>;
}
```

---

### @taskflow-ai/core/extensions

Extension system core.

#### ExtensionRegistry

Central registry for all extensions.

```typescript
class ExtensionRegistry {
  private static instance: ExtensionRegistry;

  static getInstance(): ExtensionRegistry;

  // Registration
  register<T>(type: ExtensionType, extension: IExtension<T>): Promise<void>;
  unregister(type: ExtensionType, id: string): Promise<void>;

  // Retrieval
  get<T>(type: ExtensionType, id: string): Promise<IExtension<T>>;
  list(type: ExtensionType): Promise<IExtension[]>;
  has(type: ExtensionType, id: string): Promise<boolean>;

  // Lifecycle
  activate(type: ExtensionType, id: string): Promise<void>;
  deactivate(type: ExtensionType, id: string): Promise<void>;
}
```

#### ExtensionLoader

Dynamic extension loader.

```typescript
class ExtensionLoader {
  // Load from file
  loadFromFile<T>(
    type: ExtensionType,
    filePath: string,
    config?: any
  ): Promise<IExtension<T>>;

  // Load from npm package
  loadFromPackage<T>(
    type: ExtensionType,
    packageName: string,
    config?: any
  ): Promise<IExtension<T>>;

  // Load from directory
  loadFromDirectory<T>(
    type: ExtensionType,
    directory: string,
    config?: any
  ): Promise<IExtension<T>[]>;
}
```

#### ExtensionLifecycleManager

Manages extension lifecycle.

```typescript
class ExtensionLifecycleManager {
  // Lifecycle hooks
  onLoad(extension: IExtension): Promise<void>;
  onActivate(extension: IExtension): Promise<void>;
  onDeactivate(extension: IExtension): Promise<void>;
  onUnload(extension: IExtension): Promise<void>;

  // Status
  getStatus(extensionId: string): Promise<ExtensionStatus>;
}
```

---

### @taskflow-ai/core/events

Event-driven architecture.

#### EventBus

Main event bus implementation.

```typescript
class EventBus {
  private static instance: EventBus;

  static getInstance(): EventBus;

  // Publishing
  publish<T>(event: string, payload: T): Promise<void>;

  // Subscribing
  subscribe<T>(
    event: string,
    handler: EventHandler<T>
  ): { unsubscribe: () => void };

  // Unsubscribing
  unsubscribe(event: string, handler: EventHandler): void;

  // Event history
  getHistory(event?: string, limit?: number): EventRecord[];
}

type EventHandler<T> = (payload: T) => void | Promise<void>;

interface EventRecord {
  id: string;
  event: string;
  payload: any;
  timestamp: Date;
}
```

---

### @taskflow-ai/core/cache

Dual-layer caching system.

#### CacheManager

Cache manager with L1 and L2 caching.

```typescript
class CacheManager {
  private static instance: CacheManager;

  static getInstance(): CacheManager;

  // Cache operations
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;

  // Cache stats
  getStats(): Promise<CacheStats>;
  getHitRate(): Promise<number>;

  // Cache warming
  warm(key: string, value: any): Promise<void>;
  warmBatch(entries: Array<{ key: string; value: any }>): Promise<void>;
}

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  priority?: CachePriority;
}

enum CachePriority {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  l1Size: number;
  l2Size: number;
}
```

---

### @taskflow-ai/core/errors

Error handling system.

#### ErrorHandler

Structured error handling.

```typescript
class ErrorHandler {
  private static instance: ErrorHandler;

  static getInstance(): ErrorHandler;

  // Error handling
  handle(error: Error, context?: ErrorContext): HandledError;
  report(error: Error, context?: ErrorContext): Promise<void>;

  // Error history
  getHistory(filters?: ErrorFilters): ErrorRecord[];
}

enum ErrorSeverity {
  Info = 'info',
  Warning = 'warning',
  Error = 'error',
  Critical = 'critical',
}

interface HandledError {
  error: Error;
  severity: ErrorSeverity;
  message: string;
  suggestions: string[];
  context: ErrorContext;
}

interface ErrorContext {
  component: string;
  operation: string;
  input?: any;
  metadata?: { [key: string]: any };
}
```

---

### @taskflow-ai/core/workflow

Workflow execution engine.

#### WorkflowEngine

Main workflow execution engine.

```typescript
class WorkflowEngine {
  constructor(config: EngineConfig);

  // Registration
  registerWorkflow(workflow: IWorkflow): Promise<void>;
  unregisterWorkflow(workflowId: string): Promise<void>;
  getWorkflow(workflowId: string): Promise<IWorkflow>;

  // Execution
  execute(
    workflowId: string,
    input: any,
    options?: ExecutionOptions
  ): Promise<WorkflowResult>;

  executeBatch(
    workflowId: string,
    inputs: any[],
    options?: ExecutionOptions
  ): Promise<WorkflowResult[]>;

  // Lifecycle
  start(): Promise<void>;
  stop(): Promise<void>;
}

interface ExecutionOptions {
  timeout?: number;
  maxConcurrency?: number;
  enableCache?: boolean;
  enableLogging?: boolean;
}
```

---

### @taskflow-ai/workflow/nodes

Workflow node implementations.

#### WorkflowNodeFactory

Factory for creating workflow nodes.

```typescript
class WorkflowNodeFactory {
  private static instance: WorkflowNodeFactory;

  static getInstance(): WorkflowNodeFactory;

  // Node registration
  registerNode(type: string, nodeFactory: NodeFactoryDefinition): void;
  unregisterNode(type: string): void;
  hasNode(type: string): boolean;

  // Node creation
  createNode(nodeConfig: WorkflowNode): IWorkflowNode;

  // Built-in nodes
  getBuiltInNodeTypes(): string[];
}

interface IWorkflowNode {
  execute(context: NodeExecutionContext): Promise<NodeResult>;
  validate(config: any): ValidationResult;
}
```

#### Built-in Nodes

##### Core Nodes
- `task`: Execute a task with a tool
- `parallel`: Execute multiple branches in parallel

##### Data Nodes
- `transform`: Transform data using a function
- `merge`: Merge outputs from multiple nodes

##### Control Nodes
- `condition`: Conditional branching
- `loop`: Iterative execution

##### Integration Nodes
- `api_call`: Make API calls
- `agent_task`: Execute agent tasks

---

### @taskflow-ai/tools

Tool management system.

#### ToolRegistry

Central tool registry.

```typescript
class ToolRegistry {
  private static instance: ToolRegistry;

  static getInstance(): ToolRegistry;

  // Registration
  register(tool: ITool): Promise<void>;
  unregister(toolId: string): Promise<void>;

  // Retrieval
  get(toolId: string): Promise<ITool>;
  list(category?: ToolCategory): Promise<ITool[]>;
  has(toolId: string): Promise<boolean>;

  // Execution
  execute(toolId: string, input: ToolInput): Promise<ToolOutput>;
  executeBatch(tasks: ToolExecutionTask[]): Promise<ToolOutput[]>;
}
```

#### Built-in Tools

##### FileSystem Tools
- `fs_read`: Read file contents
- `fs_write`: Write data to file
- `fs_list`: List directory contents
- `fs_exists`: Check if file/directory exists
- `fs_delete`: Delete file/directory

##### Shell Tools
- `shell_exec`: Execute shell command

##### Network Tools
- `http_get`: HTTP GET request
- `http_post`: HTTP POST request

##### Git Tools
- `git_status`: Get git status
- `git_commit`: Commit changes
- `git_log`: Get commit log

##### Code Analysis Tools
- `code_search`: Search code
- `code_analyze`: Analyze code

---

### @taskflow-ai/adapters

External system adapters.

#### AIAdapter

AI provider adapter.

```typescript
class AIAdapter {
  constructor(config: AIAdapterConfig);

  // Generation
  generate(options: GenerateOptions): Promise<AIResponse>;
  generateStream(options: GenerateOptions): AsyncIterable<AIResponse>;

  // Models
  listModels(): Promise<AIModel[]>;
  getModel(modelId: string): Promise<AIModel>;

  // Provider info
  getProvider(): AIProvider;
}

interface AIAdapterConfig {
  provider: 'openai' | 'anthropic' | 'deepseek' | 'zhipu';
  apiKey: string;
  model?: string;
  baseUrl?: string;
  options?: { [key: string]: any };
}
```

#### StorageAdapter

Storage provider adapter.

```typescript
class StorageAdapter {
  constructor(config: StorageAdapterConfig);

  // CRUD operations
  save(key: string, value: any, options?: SaveOptions): Promise<void>;
  get(key: string): Promise<any>;
  delete(key: string): Promise<void>;

  // Queries
  query(criteria: QueryCriteria): Promise<any[]>;

  // Batch operations
  saveBatch(entries: Array<{ key: string; value: any }>): Promise<void>;
  getBatch(keys: string[]): Promise<any[]>;
}
```

#### ProtocolAdapter

Communication protocol adapter.

```typescript
class ProtocolAdapter {
  constructor(config: ProtocolAdapterConfig);

  // Connection
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // Messaging
  send(message: any): Promise<void>;
  on(event: string, handler: Handler): void;
  off(event: string, handler: Handler): void;
}
```

---

### @taskflow-ai/utils

Utility functions.

#### Logger

Structured logging.

```typescript
class Logger {
  static getInstance(options?: LoggerOptions): Logger;

  // Logging methods
  info(message: string, context?: any): void;
  warn(message: string, context?: any): void;
  error(message: string, context?: any): void;
  debug(message: string, context?: any): void;

  // Level management
  setLevel(level: LogLevel): void;
  getLevel(): LogLevel;
}

enum LogLevel {
  Debug = 'debug',
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
}
```

#### ValidationUtils

Validation utilities.

```typescript
class ValidationUtils {
  static validateInput(schema: ToolSchema, input: any): ValidationResult;
  static isValidEmail(email: string): boolean;
  static isValidUrl(url: string): boolean;
  static sanitize(input: string): string;
}
```

#### StringUtils

String utilities.

```typescript
class StringUtils {
  static capitalize(str: string): string;
  static camelize(str: string): string;
  static slugify(str: string): string;
  static truncate(str: string, length: number): string;
  static isAlphaNumeric(str: string): boolean;
}
```

---

### @taskflow-ai/config

Configuration management.

#### ConfigManager

Configuration manager.

```typescript
class ConfigManager {
  private static instance: ConfigManager;

  static getInstance(): ConfigManager;

  // Config loading
  load(path: string): Promise<Config>;
  loadFromString(content: string): Config;

  // Config access
  get(path: string): any;
  set(path: string, value: any): void;
  has(path: string): boolean;

  // Validation
  validate(schema: ConfigSchema): ValidationResult;
}

interface Config {
  [key: string]: string | number | boolean | object | Config;
}
```

---

## Event API

### Events

The EventBus publishes these events:

| Event | Payload | Description |
|-------|---------|-------------|
| `extension:loaded` | `{ id, type }` | Extension loaded |
| `extension:activated` | `{ id, type }` | Extension activated |
| `extension:deactivated` | `{ id, type }` | Extension deactivated |
| `extension:error` | `{ id, type, error }` | Extension error |
| `task:started` | `{ taskId, agentId }` | Task started |
| `task:completed` | `{ taskId, result }` | Task completed |
| `task:failed` | `{ taskId, error }` | Task failed |
| `workflow:started` | `{ workflowId, input }` | Workflow started |
| `workflow:completed` | `{ workflowId, result }` | Workflow completed |
| `workflow:failed` | `{ workflowId, error }` | Workflow failed |
| `tool:executed` | `{ toolId, result }` | Tool executed |
| `agent:registered` | `{ agentId }` | Agent registered |

### Example

```typescript
import { EventBus } from 'taskflow-ai/core/events/event-bus';

const bus = EventBus.getInstance();

// Subscribe to events
bus.subscribe('task:completed', (payload) => {
  console.log('Task completed:', payload.taskId);
});

// Publish events
await bus.publish('extension:loaded', { id: 'my-tool', type: 'tool' });
```

---

## Type Guards

### Extension Type Guards

```typescript
import { isPlugin, isAgent, isTool, isWorkflow } from 'taskflow-ai/types/extensions';

if (isPlugin(ext)) {
  // ext is IPlugin
} else if (isAgent(ext)) {
  // ext is IAgent
} else if (isTool(ext)) {
  // ext is ITool
} else if (isWorkflow(ext)) {
  // ext is IWorkflow
}
```

### Status Type Guards

```typescript
import { isSuccess, isFailed, isPending } from 'taskflow-ai/types/status';

if (isSuccess(status)) {
  // Handle success
} else if (isFailed(status)) {
  // Handle failure
} else if (isPending(status)) {
  // Handle pending
}
```

---

## Constants

### Agent Defaults

```typescript
const AGENT_DEFAULTS = {
  temperature: 0.7,
  maxTokens: 4096,
  timeout: 30000,
  retryAttempts: 3,
} as const;
```

### Cache Defaults

```typescript
const CACHE_DEFAULTS = {
  ttl: 3600, // 1 hour
  maxSize: 1000,
} as const;
```

### Workflow Defaults

```typescript
const WORKFLOW_DEFAULTS = {
  maxConcurrency: 10,
  timeout: 300000, // 5 minutes
} as const;
```

---

## Error Classes

### ExtensionError

```typescript
class ExtensionError extends Error {
  constructor(message: string, public extensionId: string);
}
```

### ValidationError

```typescript
class ValidationError extends Error {
  constructor(message: string, public field: string);
}
```

### ExecutionError

```typescript
class ExecutionError extends Error {
  constructor(message: string, public operation: string);
}
```

### TimeoutError

```typescript
class TimeoutError extends Error {
  constructor(message: string, public timeout: number);
}
```

---

## License

MIT License - see [LICENSE](../LICENSE) for details.
