# TaskFlow AI v4.0 架构总览

本文档详细说明 TaskFlow AI v4.0 的系统架构、核心组件及其交互关系。

## 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户交互层                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │   CLI    │  │  MCP     │  │   API    │  │   Web    │        │
│  │ Commands │  │ Protocol │  │ Endpoint │  │  UI      │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
└───────┼─────────────┼─────────────┼─────────────┼──────────────┘
        │             │             │             │
┌───────┼─────────────┼─────────────┼─────────────┼──────────────┐
│  ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐      │
│  │          │  │          │  │          │  │          │      │
│  │ Agent    │  │ Workflow │  │ Parser   │  │ MCP      │      │
│  │ Runtime  │  │ Engine   │  │ Engine   │  │ Server   │      │
│  │          │  │          │  │          │  │          │      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
└───────┼─────────────┼─────────────┼─────────────┼──────────────┘
        │             │             │             │
┌───────┼─────────────┼─────────────┼─────────────┼──────────────┐
│  ┌────▼─────────────▼─────────────▼─────────────▼─────┐        │
│  │              核心服务层 (Core Services)             │        │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │        │
│  │  │  State  │ │  Task   │ │ Tool    │ │ Config  │ │        │
│  │  │ Manager │ │ Manager │ │ Registry│ │ Manager │ │        │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ │        │
│  └───────────────────────────────────────────────────┘        │
└───────┼──────────────────────────────────────────────────────┘
        │
┌───────┼──────────────────────────────────────────────────────┐
│  ┌────▼──────────────────────────────────────────────────┐   │
│  │              适配器层 (Adapters)                       │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     │   │
│  │  │   AI    │ │Storage  │ │Protocol │ │  Code   │     │   │
│  │  │Provider │ │Adapter  │ │Adapter  │ │ Generator│    │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
└───────┼──────────────────────────────────────────────────────┘
        │
┌───────┼──────────────────────────────────────────────────────┐
│  ┌────▼──────────────────────────────────────────────────┐   │
│  │              存储与缓存层                            │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     │   │
│  │  │   File  │ │ Vector  │ │  Cache  │ │  Queue  │     │   │
│  │  │ Storage │ │ Store   │ │ (Redis) │ │ System  │     │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
└───────┼──────────────────────────────────────────────────────┘
        │
┌───────▼───────────────────────────────────────────────────────┐
│                    外部资源                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ OpenAI  │ │ GitHub  │ │  GitLab │ │  NPM    │           │
│  │  /Anth  │ │ Actions │ │ CI/CD   │ │ Registry│           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└──────────────────────────────────────────────────────────────┘
```

## 核心组件详解

### 1. Agent Runtime（智能体运行时）

Agent Runtime 是 TaskFlow AI 的核心智能执行单元。

**主要功能**：
- PRD 文档解析与理解
- 任务规划与分解
- 代码生成与优化
- 自动测试与验证
- 状态管理与追踪

**状态机模型**：

```
Idle → Planning → Executing → Verifying → Completed
   ↓         ↓          ↓          ↓
  Failed   ←—————    Failed      ←————─
```

**核心类**：
```typescript
class AgentRuntime {
  private state: AgentState;
  private config: AgentConfig;
  private planner: PlanningEngine;
  private executor: ExecutionEngine;
  private verifier: VerificationEngine;

  async start(prd: PRDDocument): Promise<void>;
  async executeStep(step: TaskPlanStep): Promise<TaskResult>;
  async verify(result: ExecutionResult): Promise<VerificationResult>;
}
```

### 2. Workflow Engine（工作流引擎）

Workflow Engine 负责管理复杂的多步骤工作流。

**特性**：
- DAG（有向无环图）任务依赖管理
- 并行任务执行
- 条件分支
- 重试与补偿机制
- 实时进度追踪

**配置示例**：
```yaml
workflow:
  name: build-and-deploy
  stages:
    - name: build
      jobs:
        - name: compile
          steps: [run-tsc, run-build]
    - name: test
      needs: [build]
      jobs:
        - name: unit-test
        - name: integration-test
    - name: deploy
      needs: [test]
      when: success
      jobs:
        - name: deploy-production
```

### 3. MCP Server（模型上下文协议服务器）

MCP Server 实现 Model Context Protocol，与编辑器深度集成。

**支持的工具**：
- 文件操作：`file_read`, `file_write`, `file_search`
- Shell 执行：`shell_exec`, `shell_install`
- Git 操作：`git_clone`, `git_commit`, `git_push`
- 数据库：`db_query`, `db_migrate`
- 代码分析：`code_analyze`, `code_refactor`

**传输协议**：
- **stdio**: 标准 I/O（推荐 VS Code、Cursor）
- **http**: WebSocket（支持远程协作）

### 4. Parser Engine（解析引擎）

解析多格式 PRD 文档。

**支持格式**：
- Markdown (.md)
- AsciiDoc (.adoc)
- Markdown with Tables
- JSON/YAML 结构化输入

**解析流程**：
```
Raw File → Lexer → AST → Semantic Analyzer → PRD Object
```

### 5. Tool Registry（工具注册器）

统一管理所有可用工具。

**工具类别**：
- `file`: 文件系统操作
- `shell`: Shell 命令执行
- `git`: Git 操作
- `database`: 数据库操作
- `api`: HTTP 请求
- `ai`: AI 能力调用

## 数据流

### PRD → 代码 完整流程

```
┌──────────────┐
│  PRD Input   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Parser     │ → AST
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Analyzer   │ → Semantic Model
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Planner    │ → Task Graph
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Executor   │ → Generated Code
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Verifier   │ → Test Results
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Deployer   │ → Production
└──────────────┘
```

### AI 调用流程

```
User Request
    │
    ├── Context Extraction (从知识库检索)
    │   └── KnowledgeRetrievalEngine
    │
    ├── Tool Selection (选择合适的工具)
    │   └── ToolRegistry + ToolCategory
    │
    ├── AI Inference (调用模型)
    │   └── AIAdapter (OpenAI/Anthropic)
    │
    ├── Result Processing (处理返回)
    │   └── Response Parser
    │
    └── Tool Execution (执行工具)
        └── TaskExecutor
```

## 性能优化架构

### 缓存层次

```
Level 1: Memory Cache (进程内)
  ├─ AI Response Cache (TTL: 1h)
  ├─ File Content Cache (TTL: 30m)
  └─ Tool Result Cache (TTL: 10m)

Level 2: Redis Cache (分布式)
  ├─ Session Cache
  ├─ Shared Cache
  └─ Rate Limit

Level 3: Disk Cache (持久化)
  ├─ AST Cache
  └─ Generated Code Cache
```

### 并发控制

```
Worker Pool (固定大小: CPU 核数)
  ├─ Task Queue (优先级队列)
  ├─ Rate Limiter (令牌桶)
  └─ Circuit Breaker (熔断器)

Concurrency Strategies:
  - Parallel: 无依赖任务并行执行
  - Sequential: 串行执行（默认）
  - Batch: 批量处理（优化 I/O）
```

## 安全架构

### 沙箱执行

```
User Command
    │
    ▼
┌─────────────┐
│  Validator  │ → 检查危险命令
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Sanitizer  │ → 路径清理/参数转义
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Sandbox    │ → 资源限制 (512MB, 30s)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Executor   │ → 实际执行
└─────────────┘
```

### 认证与授权

```
┌──────────────┐
│   Auth       │  JWT / API Key
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Permission  │  Role-Based ACL
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Rate Limit  │  100 req/min
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Audit Log  │  记录所有操作
└──────────────┘
```

## 扩展点

### 自定义 AI Provider

```typescript
interface AIProvider {
  name: string;
  chat(messages: Message[]): Promise<Completion>;
  stream(messages: Message[]): AsyncGenerator<Chunk>;
  countTokens(text: string): number;
}

// 实现
class CustomAIProvider implements AIProvider { ... }

// 注册
aiAdapter.register(new CustomAIProvider());
```

### 自定义工具

```typescript
interface Tool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  handler: ToolHandler;
}

// 定义
const customTool: Tool = {
  name: "deploy_k8s",
  description: "Deploy to Kubernetes",
  inputSchema: { ... },
  handler: async (input) => { ... }
};

// 注册
toolRegistry.register(customTool);
```

## 技术栈总览

| 层级 | 技术 |
|------|------|
| 语言 | TypeScript 5.3+ |
| 运行时 | Node.js 18+ |
| AI SDK | OpenAI SDK / Anthropic SDK |
| 协议 | Model Context Protocol (MCP) |
| 向量库 | LanceDB / Chroma |
| 缓存 | Redis / 内存缓存 |
| 测试 | Jest |
| 构建 | esbuild |
| 文档 | TypeScript JSDoc |

---

相关文档：
- [Agent 系统详解](./concepts/agent.md)
- [工作流引擎详解](./concepts/workflow.md)
- [MCP 集成指南](./concepts/mcp.md)
- [API 参考](./api/README.md)
