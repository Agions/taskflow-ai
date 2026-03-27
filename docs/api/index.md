# TaskFlow AI API 文档

## 概述

TaskFlow AI 提供了完整的 TypeScript API，专注于PRD文档解析和任务管理功能。本文档详细介绍了所有可用的 API 接口、类型定义和使用示例。

## 核心模块

### 1. PRD 解析器 (PRD Parser)

#### `PRDParser` 类

智能PRD文档解析器，支持多种格式的文档解析。

```typescript
import { PRDParser, ParseOptions } from 'taskflow-ai';

const parser = new PRDParser();

// 解析Markdown文档
const result = await parser.parseFromFile('requirements.md', {
  modelType: 'deepseek',
  extractSections: true,
  extractFeatures: true
});

// 解析文本内容
const textResult = await parser.parseFromText(content, {
  format: 'markdown',
  language: 'zh-CN'
});
```

#### 接口定义

```typescript
interface ParseOptions {
  modelType?: string;
  extractSections?: boolean;
  extractFeatures?: boolean;
  prioritize?: boolean;
  multiModel?: MultiModelOptions;
}

interface ParseResult {
  success: boolean;
  data?: ParsedPRD;
  error?: string;
  metadata: {
    processingTime: number;
    modelUsed: string;
    confidence: number;
  };
}

interface ParsedPRD {
  title: string;
  description: string;
  requirements: Requirement[];
  features: Feature[];
  tasks: Task[];
  dependencies: Dependency[];
}
```

#### 方法

| 方法 | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `parseFromFile(filePath, options?)` | 从文件解析PRD | `string, ParseOptions?` | `Promise<ParseResult>` |
| `parseFromText(content, options?)` | 从文本解析PRD | `string, ParseOptions?` | `Promise<ParseResult>` |
| `parseFromUrl(url, options?)` | 从URL解析PRD | `string, ParseOptions?` | `Promise<ParseResult>` |
| `validatePRD(prd)` | 验证PRD结构 | `ParsedPRD` | `ValidationResult` |

### 2. 任务管理器 (Task Manager)

#### `TaskManager` 类

完整的任务生命周期管理系统。

```typescript
import { TaskManager, Task, TaskStatus } from 'taskflow-ai';

const taskManager = new TaskManager();

// 创建任务
const task = await taskManager.createTask({
  name: '实现用户登录功能',
  description: '开发用户登录页面和认证逻辑',
  priority: 'high',
  estimatedHours: 8,
  dependencies: ['task-001']
});

// 更新任务状态
await taskManager.updateTaskStatus(task.id, TaskStatus.IN_PROGRESS);

// 获取任务列表
const tasks = await taskManager.getTasks({
  status: TaskStatus.NOT_STARTED,
  priority: 'high'
});
```

#### 接口定义

```typescript
interface Task {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  type?: TaskType;
  dependencies: string[];
  estimatedHours?: number;
  actualHours?: number;
  assignee?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  dueDate?: Date;
  acceptance?: string[];
  notes?: string;
  progress?: number;
  subtasks?: Task[];
}

enum TaskStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
  CANCELLED = 'cancelled'
}

enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}
```

#### 方法

| 方法 | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `createTask(taskData)` | 创建新任务 | `Partial<Task>` | `Promise<Task>` |
| `updateTask(id, updates)` | 更新任务 | `string, Partial<Task>` | `Promise<Task>` |
| `deleteTask(id)` | 删除任务 | `string` | `Promise<boolean>` |
| `getTask(id)` | 获取单个任务 | `string` | `Promise<Task \| null>` |
| `getTasks(filter?)` | 获取任务列表 | `TaskFilter?` | `Promise<Task[]>` |
| `updateTaskStatus(id, status)` | 更新任务状态 | `string, TaskStatus` | `Promise<Task>` |
| `getTaskDependencies(id)` | 获取任务依赖 | `string` | `Promise<Task[]>` |
| `getTaskProgress(id)` | 获取任务进度 | `string` | `Promise<number>` |

### 3. AI 编排器 (AI Orchestrator)

#### `AIOrchestrator` 类

多模型AI智能编排系统。

```typescript
import { AIOrchestrator, ModelType } from 'taskflow-ai';

const orchestrator = new AIOrchestrator({
  models: {
    primary: ModelType.DEEPSEEK,
    fallback: [ModelType.ZHIPU, ModelType.QWEN],
    loadBalancing: true
  }
});

// 智能文本处理
const result = await orchestrator.processText(
  '请分析这个需求的技术难点',
  {
    task: 'analysis',
    context: 'technical',
    preferredModel: ModelType.DEEPSEEK
  }
);

// 多模型协同
const comparison = await orchestrator.compareModels(
  '设计用户界面的最佳实践',
  [ModelType.DEEPSEEK, ModelType.ZHIPU]
);
```

#### 接口定义

```typescript
interface AIOrchestrationOptions {
  models: {
    primary: ModelType;
    fallback: ModelType[];
    loadBalancing?: boolean;
    costOptimization?: boolean;
  };
  timeout?: number;
  retryAttempts?: number;
}

interface ProcessingOptions {
  task: 'analysis' | 'generation' | 'translation' | 'summarization';
  context?: string;
  preferredModel?: ModelType;
  temperature?: number;
  maxTokens?: number;
}

interface ProcessingResult {
  content: string;
  model: ModelType;
  confidence: number;
  processingTime: number;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
}
```

### 4. 项目配置管理器 (Project Config Manager)

#### `ProjectConfigManager` 类

项目配置和集成管理系统。

```typescript
import { ProjectConfigManager } from 'taskflow-ai';

const configManager = new ProjectConfigManager();

// 初始化项目配置
const config = await configManager.initializeProject({
  name: 'my-existing-project',
  type: 'web-app',
  workDir: './src',
  team: ['张三', '李四']
});

// 获取项目信息
const projectInfo = await configManager.getProjectInfo();

// 更新项目配置
await configManager.updateConfig({
  team: ['张三', '李四', '王五'],
  workDir: './app'
});
```

#### 接口定义

```typescript
interface ProjectConfig {
  name: string;
  type: string;
  workDir: string;
  team: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectInfo {
  config: ProjectConfig;
  taskCount: number;
  completedTasks: number;
  progress: number;
}
```

### 5. 配置管理器 (Configuration Manager)

#### `ConfigManager` 类

统一的配置管理系统。

```typescript
import { ConfigManager } from 'taskflow-ai';

const config = ConfigManager.getInstance();

// 设置配置
config.set('models.deepseek.apiKey', 'your-api-key');
config.set('logging.level', 'debug');

// 获取配置
const apiKey = config.get('models.deepseek.apiKey');
const logLevel = config.get('logging.level', 'info'); // 默认值

// 验证配置
const validation = config.validate();
if (!validation.isValid) {
  console.error('配置错误:', validation.errors);
}

// 保存配置到文件
config.saveToFile('./taskflow.config.json');

// 从文件加载配置
config.loadFromFile('./taskflow.config.json');
```

#### 配置模式

```typescript
interface TaskFlowConfig {
  version: string;
  models: {
    deepseek?: {
      apiKey: string;
      baseUrl?: string;
    };
    zhipu?: {
      apiKey: string;
    };
    qwen?: {
      apiKey: string;
    };
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    output: 'console' | 'file' | 'both';
    file?: string;
  };
  performance: {
    enableMonitoring: boolean;
    cacheSize: number;
  };
}
```

## 错误处理

### 统一错误类型

```typescript
import { TaskFlowError, ErrorType } from 'taskflow-ai';

try {
  const result = await parser.parseFromFile('invalid-file.md');
} catch (error) {
  if (error instanceof TaskFlowError) {
    console.error(`错误类型: ${error.code}`);
    console.error(`错误消息: ${error.message}`);
    console.error(`错误上下文:`, error.context);
    
    // 获取恢复建议
    const suggestions = error.getRecoveryActions();
    console.log('建议:', suggestions);
  }
}
```

### 错误类型枚举

```typescript
enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  FILESYSTEM_ERROR = 'FILESYSTEM_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}
```

## 事件系统

### 事件监听

```typescript
import { EventEmitter } from 'taskflow-ai';

const events = EventEmitter.getInstance();

// 监听任务状态变化
events.on('task:status:changed', (data) => {
  console.log(`任务 ${data.taskId} 状态变更为 ${data.newStatus}`);
});

// 监听解析完成事件
events.on('parse:completed', (data) => {
  console.log(`PRD解析完成，生成了 ${data.taskCount} 个任务`);
});

// 监听错误事件
events.on('error', (error) => {
  console.error('系统错误:', error);
});
```

## 性能监控

### 性能指标

```typescript
import { PerformanceMonitor } from 'taskflow-ai';

const monitor = PerformanceMonitor.getInstance();

// 获取性能统计
const stats = monitor.getStats('parse-operation');
console.log('平均执行时间:', stats.avgExecutionTime);
console.log('成功率:', stats.successRate);

// 生成性能报告
const report = monitor.generateReport();
console.log(report);
```

## 类型定义

完整的TypeScript类型定义可以在以下文件中找到：

- `src/types/task.ts` - 任务相关类型
- `src/types/config.ts` - 配置相关类型
- `src/types/model.ts` - AI模型相关类型
- `src/types/strict-types.ts` - 严格类型定义
- `src/types/enhanced-types.ts` - 增强类型定义

## 示例项目

查看 `examples/` 目录获取完整的使用示例：

- `examples/basic-usage/` - 基本使用示例
- `examples/advanced-features/` - 高级功能示例
- `examples/custom-templates/` - 自定义模板示例
- `examples/ai-integration/` - AI集成示例

## 更多资源

- [CLI 命令参考](../cli/commands.md)
- [配置参考](../reference/configuration.md)
- [故障排除](../troubleshooting/common-issues.md)
- [贡献指南](../../CONTRIBUTING.md)
