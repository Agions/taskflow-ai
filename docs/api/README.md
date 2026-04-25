# API 参考

TaskFlow AI 提供完整的编程接口，支持 TypeScript/JavaScript、Python、Go 等多种语言。

## 目录

- [Node.js SDK](#nodejs-sdk)
- [REST API](#rest-api)
- [Webhook Events](#webhook-events)
- [Error Codes](#error-codes)

---

## Node.js SDK

### 安装

```bash
npm install @taskflow-ai/sdk
```

### 初始化

```typescript
import TaskFlow from '@taskflow-ai/sdk';

const client = new TaskFlow({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.taskflow-ai.com',
  timeout: 30000
});
```

### Agent API

#### 启动 Agent

```typescript
const agent = client.agent({
  mode: 'assisted',
  model: 'gpt-4',
  maxTokens: 4096
});

// 启动执行
const session = await agent.start(prdDocument);

// 监听事件
session.on('task:start', (task) => {
  console.log('开始任务:', task.title);
});

session.on('task:complete', (result) => {
  console.log('任务完成:', result);
});

await session.waitForCompletion();
```

#### 执行单个任务

```typescript
const result = await agent.executeTask({
  id: 'task-1',
  title: 'Create API endpoint',
  type: 'code',
  priority: 'high',
  description: 'Implement GET /api/users'
});

console.log('生成文件:', result.artifacts);
```

### Parser API

#### 解析 PRD

```typescript
const prd = await client.parser.parse('./docs/prd.md');

console.log('需求:', prd.requirements);
console.log('功能:', prd.features);
```

#### 生成任务计划

```typescript
const plan = await client.parser.createPlan(prd);

console.log('任务数量:', plan.tasks.length);
console.log('依赖关系:', plan.dependencies);
```

### MCP Server API

#### 启动服务器

```typescript
import { MCPServer } from '@taskflow-ai/sdk/mcp';

const server = new MCPServer({
  serverName: 'taskflow-ai',
  version: '1.0.0'
});

await server.start({
  transport: 'stdio' // or 'http'
});
```

#### 注册自定义工具

```typescript
server.registerTool({
  name: 'my_custom_tool',
  description: 'My custom tool',
  inputSchema: {
    type: 'object',
    properties: {
      input: { type: 'string' }
    }
  },
  handler: async (input, context) => {
    return {
      success: true,
      data: `Result: ${input.input}`
    };
  }
});
```

### Knowledge Base API

#### 索引文档

```typescript
const knowledge = client.knowledge;

await knowledge.index({
  path: './docs',
  chunkSize: 1000,
  chunkOverlap: 200
});
```

#### 搜索

```typescript
const results = await knowledge.search({
  query: '用户认证实现',
  topK: 5,
  threshold: 0.7
});

results.forEach(doc => {
  console.log(`${doc.title} (${doc.score})`);
  console.log(doc.content);
});
```

### Workflow API

#### 创建工作流

```typescript
const workflow = client.workflow.create({
  name: 'build-and-deploy',
  stages: [
    {
      name: 'build',
      jobs: [
        {
          name: 'compile',
          steps: [
            { name: 'install', command: 'npm install' },
            { name: 'build', command: 'npm run build' }
          ]
        }
      ]
    },
    {
      name: 'test',
      needs: ['build'],
      jobs: [{
        name: 'unit-test',
        steps: [{ name: 'test', command: 'npm test' }]
      }]
    }
  ]
});
```

#### 执行工作流

```typescript
const execution = await workflow.run();

execution.on('stage:start', (stage) => {
  console.log('阶段开始:', stage.name);
});

execution.on('job:complete', (job) => {
  console.log('任务完成:', job.name);
});

await execution.waitForCompletion();
```

## REST API

### 基础信息

- **Base URL**: `https://api.taskflow-ai.com/v1`
- **认证方式**: Bearer Token
- **Content-Type**: `application/json`

### 认证

```bash
curl https://api.taskflow-ai.com/v1/agent/start \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prd": "content of PRD document...",
    "mode": "assisted",
    "model": "gpt-4"
  }'
```

### 端点列表

#### Agent

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/agent/start` | 启动 Agent 会话 |
| GET | `/agent/status/{id}` | 获取会话状态 |
| POST | `/agent/stop/{id}` | 停止会话 |
| GET | `/agent/tasks/{id}` | 获取任务列表 |

#### Parser

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/parser/parse` | 解析 PRD |
| POST | `/parser/plan` | 生成任务计划 |
| GET | `/parser/validate` | 验证 PRD 格式 |

#### Knowledge Base

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/knowledge/index` | 索引文档 |
| POST | `/knowledge/search` | 搜索知识库 |
| DELETE | `/knowledge/clear` | 清空索引 |

#### Workflow

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/workflow/create` | 创建工作流 |
| POST | `/workflow/run/{id}` | 执行工作流 |
| GET | `/workflow/status/{id}` | 获取执行状态 |

#### MCP

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/mcp/tools` | 列出可用工具 |
| POST | `/mcp/execute` | 执行工具 |
| POST | `/mcp/register` | 注册自定义工具 |

### 响应格式

所有 API 响应遵循统一格式：

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "metadata": {
    "requestId": "req_abc123",
    "timestamp": "2024-04-25T12:00:00Z",
    "duration": 1250
  }
}
```

### 错误格式

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_API_KEY",
    "message": "API key is invalid or expired",
    "details": {
      "field": "apiKey",
      "rejectedKey": "sk-invalid..."
    }
  },
  "metadata": { ... }
}
```

---

## 类型定义

### Agent

```typescript
interface AgentConfig {
  mode: 'assisted' | 'autonomous' | 'supervised';
  model: string;
  maxTokens: number;
  temperature?: number;
  maxIterations?: number;
  autoFix?: boolean;
  approvalRequired?: string[];
}

interface AgentSession {
  id: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  tasks: Task[];
  iteration: number;
  startTime: Date;
}

interface Task {
  id: string;
  title: string;
  type: 'code' | 'file' | 'shell' | 'test';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  dependencies: string[];
}
```

### PRD

```typescript
interface PRDDocument {
  id: string;
  title: string;
  description: string;
  content: string;
  requirements: Requirement[];
  features: Feature[];
  risks: Risk[];
}

interface Requirement {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  type: 'functional' | 'non-functional';
}
```

### Execution

```typescript
interface ExecutionResult {
  success: boolean;
  results: TaskResult[];
  summary: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    totalDuration: number;
  };
  startTime: Date;
  endTime: Date;
}

interface TaskResult {
  taskId: string;
  success: boolean;
  output?: string;
  error?: string;
  duration: number;
  artifacts?: string[];
}
```

## SDK 事件

### Agent 事件

```typescript
agent.on('session:start', (session) => { ... });
agent.on('session:complete', (result) => { ... });
agent.on('session:error', (error) => { ... });

agent.on('task:start', (task) => { ... });
agent.on('task:progress', (progress) => { ... });
agent.on('task:complete', (result) => { ... });
agent.on('task:failed', (error) => { ... });

agent.on('approval:requested', (task) => { ... });
agent.on('approval:granted', (task) => { ... });
agent.on('approval:denied', (task) => { ... });
```

### Workflow 事件

```typescript
workflow.on('stage:start', (stage) => { ... });
workflow.on('stage:complete', (stage) => { ... });

workflow.on('job:start', (job) => { ... });
workflow.on('job:complete', (result) => { ... });

workflow.on('step:start', (step) => { ... });
workflow.on('step:complete', (result) => { ... });
```

---

## 错误代码

| 代码 | 说明 | HTTP 状态 |
|------|------|-----------|
| `INVALID_API_KEY` | API 密钥无效 | 401 |
| `QUOTA_EXCEEDED` | 配额超限 | 429 |
| `INVALID_REQUEST` | 请求参数无效 | 400 |
| `NOT_FOUND` | 资源不存在 | 404 |
| `SESSION_EXPIRED` | 会话已过期 | 401 |
| `TASK_FAILED` | 任务执行失败 | 500 |
| `VALIDATION_ERROR` | 验证错误 | 400 |
| `TIMEOUT` | 请求超时 | 504 |

---

## 示例项目

### 完整示例：自动生成 REST API

```typescript
import TaskFlow from '@taskflow-ai/sdk';

const client = new TaskFlow({ apiKey: process.env.API_KEY! });

async function generateAPI() {
  // 解析 PRD
  const prd = await client.parser.parse('./api-prd.md');
  
  // 启动 Agent
  const agent = client.agent({
    mode: 'autonomous',
    model: 'gpt-4'
  });
  
  // 执行
  const session = await agent.start(prd);
  
  // 监听进度
  session.on('task:complete', (result) => {
    console.log(`✅ ${result.task.title}`);
    result.artifacts?.forEach(file => {
      console.log(`   ${file}`);
    });
  });
  
  // 等待完成
  const finalResult = await session.waitForCompletion();
  
  console.log('生成完成！');
  console.log('总文件数:', finalResult.artifacts?.length);
}

generateAPI().catch(console.error);
```

---

## 性能优化建议

### 1. 批处理请求

```typescript
// ❌ 不推荐：串行
for (const prd of prds) {
  await parser.parse(prd);
}

// ✅ 推荐：并行
const results = await Promise.all(
  prds.map(prd => parser.parse(prd))
);
```

### 2. 使用缓存

```typescript
const agent = client.agent({ ... });

// 启用缓存
agent.setCache({
  enabled: true,
  ttl: 3600000
});
```

### 3. 流式响应

```typescript
// 大量数据使用流
const stream = await agent.streamExecute(prd);

for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

---

相关文档：
- [Agent 系统](../concepts/agent.md)
- [CLI 命令](../cli/README.md)
- [Webhook Events](#webhook-events)
