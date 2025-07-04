# 开发者指南

## 概述

本指南面向希望为 TaskFlow AI 项目做出贡献或基于 TaskFlow AI 进行二次开发的开发者。我们将详细介绍项目架构、开发环境设置、代码规范和最佳实践。

## 项目架构

### 整体架构

TaskFlow AI 采用模块化的架构设计，主要分为以下几个层次：

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ CLI Interface│  │ Web Interface│  │ AI Editor Extension │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Commands  │  │  Handlers   │  │    Controllers      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     Business Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ PRD Parser  │  │Task Manager │  │  AI Orchestrator    │  │
│  │             │  │             │  │                     │  │
│  │ Template    │  │ Performance │  │  Security Manager   │  │
│  │ Engine      │  │ Monitor     │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Storage   │  │   Network   │  │      Utilities      │  │
│  │   Manager   │  │   Client    │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 核心模块

#### 1. 命令层 (Commands)
- **位置**: `src/commands/`
- **职责**: 处理CLI命令，参数解析和验证
- **主要文件**:
  - `init.ts` - 项目初始化命令
  - `parse.ts` - PRD解析命令
  - `status.ts` - 任务状态管理命令
  - `interactive.ts` - 交互式模式命令

#### 2. 核心业务层 (Core)
- **位置**: `src/core/`
- **职责**: 核心业务逻辑实现
- **子模块**:
  - `ai/` - AI模型集成和编排
  - `parser/` - PRD文档解析引擎
  - `task/` - 任务管理系统
  - `templates/` - 项目模板引擎
  - `security/` - 安全模块
  - `performance/` - 性能监控

#### 3. 类型定义 (Types)
- **位置**: `src/types/`
- **职责**: TypeScript类型定义
- **主要文件**:
  - `task.ts` - 任务相关类型
  - `config.ts` - 配置相关类型
  - `model.ts` - AI模型相关类型
  - `strict-types.ts` - 严格类型定义

#### 4. 基础设施 (Infrastructure)
- **位置**: `src/infra/`
- **职责**: 基础设施服务
- **子模块**:
  - `config/` - 配置管理
  - `logger/` - 日志系统
  - `storage/` - 存储管理

## 开发环境设置

### 1. 克隆项目

```bash
git clone https://github.com/agions/taskflow-ai.git
cd taskflow-ai
```

### 2. 安装依赖

```bash
# 安装项目依赖
npm install

# 安装开发工具依赖
npm install --save-dev
```

### 3. 环境配置

创建开发环境配置文件：

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑配置文件
vim .env.local
```

`.env.local` 示例：

```bash
# 开发环境配置
NODE_ENV=development
LOG_LEVEL=debug

# AI模型API密钥（开发用）
TASKFLOW_DEEPSEEK_API_KEY=your-dev-api-key
TASKFLOW_ZHIPU_API_KEY=your-dev-api-key

# 开发服务器配置
DEV_SERVER_PORT=3000
DEV_SERVER_HOST=localhost
```

### 4. 开发脚本

```bash
# 启动开发模式（监听文件变化）
npm run dev

# 运行测试
npm test

# 运行测试并监听变化
npm run test:watch

# 运行测试覆盖率
npm run test:coverage

# 类型检查
npm run type-check

# 代码格式化
npm run format

# 代码检查
npm run lint

# 修复代码问题
npm run lint:fix

# 构建项目
npm run build

# 清理构建文件
npm run clean
```

## 代码规范

### TypeScript 规范

#### 1. 严格类型检查

```typescript
// ✅ 好的做法
interface UserConfig {
  name: string;
  age: number;
  email?: string;
}

function processUser(config: UserConfig): void {
  // 实现逻辑
}

// ❌ 避免使用 any
function processData(data: any): any {
  return data;
}
```

#### 2. 类型定义

```typescript
// ✅ 使用明确的类型定义
export interface TaskCreateOptions {
  readonly name: string;
  readonly description: string;
  readonly priority: TaskPriority;
  readonly estimatedHours?: number;
}

// ✅ 使用枚举
export enum TaskStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

// ✅ 使用泛型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

#### 3. 错误处理

```typescript
// ✅ 使用自定义错误类
import { TaskFlowError, ErrorType } from '../core/error-handling/typed-errors';

export class TaskManager {
  public async createTask(options: TaskCreateOptions): Promise<Task> {
    try {
      // 业务逻辑
      return task;
    } catch (error) {
      throw new TaskFlowError(
        'Failed to create task',
        ErrorType.VALIDATION_ERROR,
        {
          timestamp: new Date().toISOString(),
          source: 'TaskManager.createTask',
          details: { options }
        }
      );
    }
  }
}
```

### 代码组织规范

#### 1. 文件命名

```bash
# 文件命名使用 kebab-case
task-manager.ts
ai-orchestrator.ts
config-validator.ts

# 类名使用 PascalCase
class TaskManager {}
class AIOrchestrator {}

# 接口名使用 PascalCase
interface TaskConfig {}
interface ParseResult {}

# 常量使用 SCREAMING_SNAKE_CASE
const DEFAULT_TIMEOUT = 30000;
const MAX_RETRY_ATTEMPTS = 3;
```

#### 2. 导入顺序

```typescript
// 1. Node.js 内置模块
import * as fs from 'fs';
import * as path from 'path';

// 2. 第三方库
import chalk from 'chalk';
import inquirer from 'inquirer';

// 3. 项目内部模块（按层级顺序）
import { TaskManager } from '../core/task/task-manager';
import { ConfigManager } from '../infra/config/config-manager';
import { Logger } from '../infra/logger';

// 4. 类型导入
import type { Task, TaskStatus } from '../types/task';
import type { JSONObject } from '../types/strict-types';
```

#### 3. 类结构

```typescript
export class TaskManager {
  // 1. 静态属性
  private static instance: TaskManager;

  // 2. 实例属性
  private readonly logger: Logger;
  private readonly storage: StorageManager;

  // 3. 构造函数
  constructor(config: TaskManagerConfig) {
    this.logger = new Logger('TaskManager');
    this.storage = new StorageManager(config.storage);
  }

  // 4. 静态方法
  public static getInstance(): TaskManager {
    if (!TaskManager.instance) {
      TaskManager.instance = new TaskManager();
    }
    return TaskManager.instance;
  }

  // 5. 公共方法
  public async createTask(options: TaskCreateOptions): Promise<Task> {
    // 实现
  }

  // 6. 私有方法
  private validateTaskOptions(options: TaskCreateOptions): void {
    // 实现
  }
}
```

### 测试规范

#### 1. 测试文件组织

```bash
tests/
├── unit/                 # 单元测试
│   ├── core/
│   │   ├── task/
│   │   │   └── task-manager.test.ts
│   │   └── parser/
│   │       └── prd-parser.test.ts
│   └── commands/
│       └── init.test.ts
├── integration/          # 集成测试
│   ├── api/
│   └── cli/
└── e2e/                 # 端到端测试
    └── workflows/
```

#### 2. 测试编写规范

```typescript
// task-manager.test.ts
import { TaskManager } from '../../../src/core/task/task-manager';
import { TaskStatus, TaskPriority } from '../../../src/types/task';

describe('TaskManager', () => {
  let taskManager: TaskManager;

  beforeEach(() => {
    taskManager = new TaskManager();
  });

  afterEach(() => {
    // 清理资源
  });

  describe('createTask', () => {
    it('should create a task with valid options', async () => {
      // Arrange
      const options = {
        name: 'Test Task',
        description: 'Test Description',
        priority: TaskPriority.MEDIUM
      };

      // Act
      const task = await taskManager.createTask(options);

      // Assert
      expect(task).toBeDefined();
      expect(task.name).toBe(options.name);
      expect(task.status).toBe(TaskStatus.NOT_STARTED);
    });

    it('should throw error with invalid options', async () => {
      // Arrange
      const invalidOptions = {
        name: '', // 无效的空名称
        description: 'Test',
        priority: TaskPriority.MEDIUM
      };

      // Act & Assert
      await expect(taskManager.createTask(invalidOptions))
        .rejects
        .toThrow('Task name cannot be empty');
    });
  });

  describe('edge cases', () => {
    it('should handle concurrent task creation', async () => {
      // 测试并发场景
    });

    it('should handle memory constraints', async () => {
      // 测试内存限制场景
    });
  });
});
```

#### 3. Mock 和 Stub

```typescript
// 使用 Jest mocks
jest.mock('../../../src/infra/logger');
jest.mock('../../../src/core/ai/ai-client');

// 创建 mock 实例
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

const mockAIClient = {
  processText: jest.fn().mockResolvedValue({
    content: 'mocked response',
    confidence: 0.95
  })
};
```

## 性能优化

### 1. 内存管理

```typescript
// ✅ 使用对象池
class TaskPool {
  private pool: Task[] = [];

  public acquire(): Task {
    return this.pool.pop() || new Task();
  }

  public release(task: Task): void {
    task.reset();
    this.pool.push(task);
  }
}

// ✅ 及时清理资源
export class ResourceManager {
  private resources: Map<string, Resource> = new Map();

  public cleanup(): void {
    for (const [key, resource] of this.resources) {
      resource.dispose();
      this.resources.delete(key);
    }
  }
}
```

### 2. 异步处理

```typescript
// ✅ 使用 Promise.all 并行处理
export class BatchProcessor {
  public async processBatch<T>(
    items: T[],
    processor: (item: T) => Promise<void>,
    concurrency = 5
  ): Promise<void> {
    const chunks = this.chunk(items, concurrency);
    
    for (const chunk of chunks) {
      await Promise.all(chunk.map(processor));
    }
  }

  private chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
```

### 3. 缓存策略

```typescript
// ✅ 实现智能缓存
export class CacheManager {
  private cache = new Map<string, CacheEntry>();

  public async get<T>(
    key: string,
    factory: () => Promise<T>,
    ttl = 300000 // 5分钟
  ): Promise<T> {
    const entry = this.cache.get(key);
    
    if (entry && Date.now() < entry.expiry) {
      return entry.value as T;
    }

    const value = await factory();
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    });

    return value;
  }
}
```

## 调试和诊断

### 1. 日志系统

```typescript
// 使用结构化日志
import { Logger } from '../infra/logger';

export class TaskManager {
  private readonly logger = new Logger('TaskManager');

  public async createTask(options: TaskCreateOptions): Promise<Task> {
    this.logger.info('Creating task', {
      taskName: options.name,
      priority: options.priority,
      estimatedHours: options.estimatedHours
    });

    try {
      const task = await this.doCreateTask(options);
      
      this.logger.info('Task created successfully', {
        taskId: task.id,
        taskName: task.name
      });

      return task;
    } catch (error) {
      this.logger.error('Failed to create task', {
        error: error.message,
        stack: error.stack,
        options
      });
      throw error;
    }
  }
}
```

### 2. 性能监控

```typescript
// 使用性能监控装饰器
import { performanceMonitor } from '../core/performance/performance-monitor';

export class PRDParser {
  @performanceMonitor('prd-parsing')
  public async parseFromFile(filePath: string): Promise<ParseResult> {
    // 解析逻辑
  }
}
```

### 3. 错误追踪

```typescript
// 实现错误追踪
export class ErrorTracker {
  public static trackError(error: Error, context: Record<string, any>): void {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context,
      userAgent: process.version,
      platform: process.platform
    };

    // 发送到错误追踪服务
    this.sendToTrackingService(errorInfo);
  }
}
```

## 贡献流程

### 1. 开发流程

```bash
# 1. 创建功能分支
git checkout -b feature/new-feature

# 2. 开发和测试
npm run dev
npm test

# 3. 提交代码
git add .
git commit -m "feat: add new feature"

# 4. 推送分支
git push origin feature/new-feature

# 5. 创建 Pull Request
```

### 2. 提交消息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
# 功能添加
git commit -m "feat: add task dependency analysis"

# Bug 修复
git commit -m "fix: resolve memory leak in parser"

# 文档更新
git commit -m "docs: update API documentation"

# 代码重构
git commit -m "refactor: improve error handling"

# 性能优化
git commit -m "perf: optimize task loading performance"

# 测试添加
git commit -m "test: add unit tests for task manager"
```

### 3. 代码审查

在提交 Pull Request 前，请确保：

- [ ] 所有测试通过
- [ ] 代码覆盖率不降低
- [ ] TypeScript 编译无错误
- [ ] ESLint 检查通过
- [ ] 文档已更新
- [ ] 变更日志已更新

## 发布流程

### 1. 版本管理

```bash
# 更新版本号
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# 生成变更日志
npm run changelog

# 构建发布版本
npm run build

# 发布到 npm
npm publish
```

### 2. 发布检查清单

- [ ] 所有测试通过
- [ ] 文档已更新
- [ ] 变更日志已更新
- [ ] 版本号已更新
- [ ] 构建成功
- [ ] 安全扫描通过

## 更多资源

- [API 文档](../api/index.md)
- [架构设计文档](./architecture.md)
- [测试指南](../testing/index.md)
- [部署指南](../deployment/index.md)
- [贡献指南](../../CONTRIBUTING.md)
