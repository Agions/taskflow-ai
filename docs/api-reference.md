# TaskFlow AI API 参考文档

## 概述

TaskFlow AI 提供了完整的 JavaScript/TypeScript API，支持在 Node.js 环境中集成使用。

## 安装

```bash
npm install taskflow-ai
```

## 基本用法

```typescript
import { TaskFlowService } from 'taskflow-ai';

const service = new TaskFlowService();
```

## 核心 API

### TaskFlowService

主要的服务类，提供所有核心功能。

#### 构造函数

```typescript
constructor()
```

创建 TaskFlowService 实例。

#### PRD 解析

##### parsePRD()

```typescript
async parsePRD(
  content: string, 
  fileType: FileType = FileType.MARKDOWN, 
  options?: ParseOptions
): Promise<ServiceResponse<PRDParseResult>>
```

解析 PRD 内容。

**参数:**
- `content`: PRD 文档内容
- `fileType`: 文件类型 (`MARKDOWN` | `JSON` | `TEXT`)
- `options`: 解析选项

**返回值:**
```typescript
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface PRDParseResult {
  title: string;
  sections: Section[];
  features: Feature[];
  requirements: Requirement[];
  metadata: {
    version: string;
    createdAt: string;
    updatedAt: string;
  };
}
```

**示例:**
```typescript
const prdContent = `
# 用户管理系统
## 功能需求
### 用户注册
- 邮箱注册
- 密码验证
`;

const result = await service.parsePRD(prdContent, FileType.MARKDOWN);
if (result.success) {
  console.log('解析成功:', result.data);
} else {
  console.error('解析失败:', result.error);
}
```

##### parsePRDFromFile()

```typescript
async parsePRDFromFile(
  filePath: string, 
  options?: ParseOptions
): Promise<ServiceResponse<PRDParseResult>>
```

从文件解析 PRD。

**参数:**
- `filePath`: PRD 文件路径
- `options`: 解析选项

**示例:**
```typescript
const result = await service.parsePRDFromFile('./docs/prd.md');
```

#### 任务管理

##### generateTaskPlan()

```typescript
async generateTaskPlan(
  prdResult: PRDParseResult, 
  options?: PlanningOptions
): Promise<ServiceResponse<TaskPlan>>
```

生成任务计划。

**参数:**
- `prdResult`: PRD 解析结果
- `options`: 规划选项

**返回值:**
```typescript
interface TaskPlan {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
  milestones: Milestone[];
  estimatedDuration: number;
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  estimatedHours: number;
  dependencies: string[];
  assignee?: string;
  tags: string[];
}
```

**示例:**
```typescript
const taskPlan = await service.generateTaskPlan(prdResult, {
  includeTests: true,
  includeDocs: true,
  teamSize: 5
});
```

##### getAllTasks()

```typescript
getAllTasks(): ServiceResponse<Task[]>
```

获取所有任务。

**示例:**
```typescript
const tasks = service.getAllTasks();
if (tasks.success) {
  console.log('任务列表:', tasks.data);
}
```

##### getTaskById()

```typescript
getTaskById(id: string): ServiceResponse<Task>
```

根据ID获取任务。

##### updateTask()

```typescript
updateTask(id: string, data: TaskUpdateData): ServiceResponse<Task>
```

更新任务信息。

**参数:**
```typescript
interface TaskUpdateData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
  estimatedHours?: number;
}
```

##### filterTasks()

```typescript
filterTasks(filter: TaskFilter): ServiceResponse<Task[]>
```

筛选任务。

**参数:**
```typescript
interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  assignee?: string;
  tags?: string[];
}
```

#### 模型管理

##### chat()

```typescript
async chat(
  messages: ChatMessage[], 
  modelType?: ModelType, 
  options?: ChatOptions
): Promise<ServiceResponse<string>>
```

与AI模型对话。

**参数:**
```typescript
interface ChatMessage {
  role: MessageRole;
  content: string;
}

enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}
```

**示例:**
```typescript
const messages = [
  { role: MessageRole.USER, content: '帮我分析这个需求的复杂度' }
];

const response = await service.chat(messages, ModelType.DEEPSEEK);
```

##### getAvailableModelTypes()

```typescript
getAvailableModelTypes(): ServiceResponse<ModelType[]>
```

获取可用的模型类型。

##### validateModelApiKey()

```typescript
async validateModelApiKey(modelType: ModelType): Promise<ServiceResponse<boolean>>
```

验证模型API密钥。

#### 配置管理

##### getConfig()

```typescript
getConfig(): ServiceResponse<AppConfig>
```

获取当前配置。

##### updateConfig()

```typescript
updateConfig(config: Partial<AppConfig>, isProjectLevel = false): ServiceResponse<void>
```

更新配置。

**参数:**
```typescript
interface AppConfig {
  models: {
    default: ModelType;
    apiKeys: Record<string, string>;
    endpoints: Record<string, string>;
  };
  ui: {
    theme: 'light' | 'dark';
    language: string;
  };
  features: {
    autoSave: boolean;
    notifications: boolean;
  };
}
```

#### 项目管理

##### createProject()

```typescript
async createProject(projectData: ProjectCreateData): Promise<ServiceResponse<Project>>
```

创建项目。

##### getProjects()

```typescript
async getProjects(options?: ProjectListOptions): Promise<ServiceResponse<Project[]>>
```

获取项目列表。

##### getProject()

```typescript
async getProject(id: string): Promise<ServiceResponse<Project>>
```

获取项目详情。

##### updateProject()

```typescript
async updateProject(id: string, updateData: ProjectUpdateData): Promise<ServiceResponse<Project>>
```

更新项目。

##### deleteProject()

```typescript
async deleteProject(id: string): Promise<ServiceResponse<void>>
```

删除项目。

## 类型定义

### 枚举类型

```typescript
enum FileType {
  MARKDOWN = 'markdown',
  JSON = 'json',
  TEXT = 'text'
}

enum TaskType {
  DEVELOPMENT = 'development',
  DESIGN = 'design',
  TEST = 'test',
  DOCUMENT = 'document',
  DEPLOYMENT = 'deployment',
  REVIEW = 'review'
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

enum ModelType {
  DEEPSEEK = 'deepseek',
  ZHIPU_GLM = 'zhipu',
  QWEN = 'qwen',
  BAICHUAN = 'baichuan'
}
```

### 接口定义

```typescript
interface ParseOptions {
  modelType?: ModelType;
  extractSections?: boolean;
  extractFeatures?: boolean;
  prioritize?: boolean;
  outputPath?: string;
}

interface PlanningOptions {
  includeTests?: boolean;
  includeDocs?: boolean;
  teamSize?: number;
  sprintDuration?: number;
  complexity?: 'low' | 'medium' | 'high';
}

interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}
```

## 错误处理

所有异步方法都返回 `ServiceResponse<T>` 类型，包含成功状态和错误信息：

```typescript
const result = await service.parsePRD(content);

if (result.success) {
  // 处理成功结果
  console.log(result.data);
} else {
  // 处理错误
  console.error('操作失败:', result.error);
}
```

## 事件监听

TaskFlowService 支持事件监听：

```typescript
// 监听任务状态变化
service.on('taskStatusChanged', (task: Task) => {
  console.log(`任务 ${task.title} 状态变更为 ${task.status}`);
});

// 监听解析完成
service.on('parseCompleted', (result: PRDParseResult) => {
  console.log('PRD解析完成:', result.title);
});
```

## 最佳实践

### 1. 错误处理

```typescript
try {
  const result = await service.parsePRD(content);
  if (!result.success) {
    throw new Error(result.error);
  }
  // 处理成功结果
} catch (error) {
  console.error('解析失败:', error.message);
}
```

### 2. 配置管理

```typescript
// 在应用启动时配置API密钥
const config = {
  models: {
    apiKeys: {
      deepseek: process.env.DEEPSEEK_API_KEY,
      zhipu: process.env.ZHIPU_API_KEY
    }
  }
};

service.updateConfig(config);
```

### 3. 批量操作

```typescript
// 批量更新任务状态
const tasks = service.getAllTasks();
if (tasks.success) {
  for (const task of tasks.data) {
    if (task.status === TaskStatus.NOT_STARTED) {
      service.updateTask(task.id, { status: TaskStatus.IN_PROGRESS });
    }
  }
}
```

## 示例应用

完整的示例应用可以在 [examples](../examples) 目录中找到。
