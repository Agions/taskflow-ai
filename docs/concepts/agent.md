# Agent 系统

Agent 是 TaskFlow AI 的核心智能执行单元，负责理解需求、规划任务、执行代码生成和验证结果。

## Agent 架构

### Agent 状态机

Agent 使用有限状态机管理执行流程：

```
┌─────────────────────────────────────────────────────────┐
│                    State Machine                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐            │
│   │  Idle   │───►│Planning │───►│Executing│           │
│   └────┬────┘    └────┬────┘    └────┬────┘            │
│        │              │              │                   │
│        │              │              ├──► Verifying       │
│        │              │              │     │             │
│        │              │              │     ├──► Completed│
│        │              │              │     │             │
│        │              │              │     │             │
│        │              │    ←─────────┘     │             │
│        │              │    等待批准          │             │
│        │   ┌──────────┴──────────┐         │             │
│        │   │                     │         │             │
│        └───┴─► AwaitingApproval  ◄─────────┘             │
│                │                     │                     │
│                │       Approved      │ Rejected           │
│                │                     │                     │
│                ▼                     ▼                     │
│            Executing              Pending                  │
│                                                         │
│  所有状态 ─────► Failed (任意错误时)                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Agent 组件图

```
┌────────────────────────────────────────────────────┐
│                   Agent Runtime                     │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │              Core Engine                      │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐        │ │
│  │  │ State   │ │ Planner │ │Executor │        │ │
│  │  │ Machine │ │   Engine│ │   Engine│        │ │
│  │  └─────────┘ └─────────┘ └─────────┘        │ │
│  │      │             │             │           │ │
│  │      └──────┬──────┘───┬─────────┘           │ │
│  │             │          │                     │ │
│  │             ▼          ▼                     │ │
│  │      ┌──────────────┐                      │ │
│  │      │   Verifier   │                      │ │
│  │      │    Engine    │                      │ │
│  │      └──────────────┘                      │ │
│  └──────────────────────────────────────────────┘ │
│                         │                           │
│  ┌──────────────────────┼──────────────────────┐   │
│  │                      │                      │   │
│  ▼                      ▼                      ▼   │
│  ┌─────────┐      ┌─────────┐          ┌─────────┐│
│  │  PRD    │      │  Task   │          │  Tool   ││
│  │Analyzer │      │ Manager │          │Registry ││
│  └─────────┘      └─────────┘          └─────────┘│
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │              Context Layer                   │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐        │ │
│  │  │Project  │ │ Runtime │ │ Session │        │ │
│  │  │ Config  │ │ Context │ │   Store │        │ │
│  │  └─────────┘ └─────────┘ └─────────┘        │ │
│  └──────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```

## Agent 类型

### 1. Assisted Agent（辅助模式）

适用于需要人工干预的复杂场景。

**特点**：
- 每个关键步骤需要人类确认
- 自动修复小问题
- 大改动需要批准

**配置**：
```yaml
agent:
  mode: assisted
  maxIterations: 10
  autoFix: true
  approvalRequired:
    - deploy
    - delete
    - schema-change
  continueOnError: false
```

**工作流程**：
```
1. Planner 分析需求 ──► 生成任务计划
     │
     ▼
2. 人类确认 ───► Executor 执行任务
     │
     ▼
3. Verifier 验证结果 ──► 人类审核
     │
     ▼
4. 批准 → 完成任务
     │
拒绝 → 重新规划
```

### 2. Autonomous Agent（自主模式）

适用于高度自动化的场景。

**特点**：
- 完全自主执行
- 自动纠正错误
- 仅在严重失败时暂停

**配置**：
```yaml
agent:
  mode: autonomous
  maxIterations: 20
  autoFix: true
  approvalRequired: []
  continueOnError: true
  maxRetries: 3
```

**使用场景**：
- 单元测试补全
- 文档生成
- 代码重构
- 性能优化

### 3. Supervised Agent（监督模式）

适用于需要人工监督的敏感操作。

**特点**：
- 所有操作可审阅
- 实时进度通知
- 可随时中断

**配置**：
```yaml
agent:
  mode: supervised
  maxIterations: 5
  autoFix: false
  approvalRequired: ['*']
  continueOnError: false
```

## 核心引擎

### Planning Engine（规划引擎）

负责将 PRD 分解为可执行的任务。

**规划策略**：
1. **Requirement Analysis**: 需求分析
2. **Feature Extraction**: 功能提取
3. **Task Decomposition**: 任务分解
4. **Dependency Analysis**: 依赖分析
5. **Priority Assignment**: 优先级分配

**任务类型**：
```typescript
enum TaskType {
  CODE = 'code',           // 代码生成
  FILE = 'file',           // 文件操作
  SHELL = 'shell',         // Shell 命令
  ANALYSIS = 'analysis',   // 代码分析
  DESIGN = 'design',       // 设计文档
  TEST = 'test',           // 测试编写
}
```

**任务优先级**：
```typescript
enum TaskPriority {
  CRITICAL = 'critical',   // 关键任务
  HIGH = 'high',           // 高优先级
  MEDIUM = 'medium',       // 中优先级
  LOW = 'low',            // 低优先级
}
```

### Execution Engine（执行引擎）

执行任务计划中的每个步骤。

**执行策略**：
- **Topological Sort**: 拓扑排序确保依赖顺序
- **Parallel Execution**: 并行执行无依赖任务
- **Retry Mechanism**: 失败重试机制
- **Error Propagation**: 错误传播与处理

**Worker 池**：
```typescript
class WorkerPool {
  private workers: Worker[];
  private queue: TaskQueue;
  
  constructor(concurrency: number = cpuCount()) {
    this.workers = new Array(concurrency).map(() => new Worker());
    this.queue = new TaskQueue();
  }
  
  async execute(plan: TaskPlan): Promise<ExecutionResult> {
    // 并行执行策略
  }
}
```

### Verification Engine（验证引擎）

确保生成的代码符合质量标准。

**验证检查项**：
```typescript
interface VerificationCheck {
  name: 'type-checking' | 'linting' | 'testing' | 'security';
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}
```

**验证流程**：
```
Generated Code
    │
    ▼
┌─────────────────┐
│  Type Checking  │ → TypeScript 编译器
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Linting       │ → ESLint
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Unit Tests    │ → Jest
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Security Scan   │ → security checker
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Report         │ → 综合评分
└─────────────────┘
```

## Agent Context

### PRD Context

```typescript
interface PRDContext {
  document: PRDDocument;
  requirements: Requirement[];
  features: Feature[];
  risks: Risk[];
}
```

### Runtime Context

```typescript
interface RuntimeContext {
  project: ProjectConfig;
  workingDirectory: string;
  environment: Record<string, string>;
  availableTools: Tool[];
  constraints: Constraint[];
}
```

### Session Context

```typescript
interface SessionContext {
  sessionId: string;
  state: AgentState;
  history: ActionHistory[];
  iteration: number;
  startTime: Date;
}
```

## Agent API

### 启动 Agent

```typescript
import { AgentRuntime } from '@taskflow-ai/sdk';

const agent = new AgentRuntime({
  mode: 'assisted',
  model: 'gpt-4',
  maxTokens: 4096
});

// 启动
await agent.start(prdDocument);

// 获取状态
const state = agent.getState();
console.log('Current status:', state.status);
```

### 执行单个任务

```typescript
const task: Task = {
  id: 'task-1',
  title: 'Create login component',
  type: TaskType.CODE,
  priority: TaskPriority.HIGH,
  dependencies: []
};

const result = await agent.executeTask(task);

if (result.success) {
  console.log('Generated files:', result.artifacts);
}
```

### 挂起/恢复

```typescript
// 挂起
await agent.suspend();

// 保存会话
await agent.saveSession('./session.json');

// 恢复
await agent.loadSession('./session.json');
await agent.resume();
```

## 最佳实践

### 1. PRD 编写

有效的 PRD 应该：
- 📝 需求明确且可执行
- 🎯 优先级明确
- 🧪 包含验收标准
- 🚫 避免模糊需求

**好示例**：
```markdown
## 功能：用户登录

**需求**：
- 用户可以通过邮箱和密码登录
- 密码必须至少 8 位，包含大小写字母和数字
- 登录失败 5 次后锁定账户 15 分钟

**验收标准**：
- 测试覆盖率 > 90%
- API 响应时间 < 100ms
- 通过 SQL 注入测试
```

### 2. 任务规划优化

- 使用合理的任务粒度
- 明确任务依赖关系
- 优先处理关键路径任务
- 预留修复时间

### 3. 验证策略

- 类型检查：每次生成后立即验证
- 单元测试：覆盖率目标 > 80%
- 安全扫描：生产部署前必做
- 性能测试：关键路径性能基准

### 4. 错误处理

```typescript
try {
  const result = await agent.executeTask(task);
  
  if (!result.success) {
    // 自动修复策略
    if (result.error?.code === 'TYPE_ERROR') {
      await agent.autoFix(result);
    } else {
      // 人工干预
      await agent.requestHumanReview(result);
    }
  }
} catch (error) {
  logger.error('Agent execution failed:', error);
  
  // 根据配置决定继续还是停止
  if (agent.config.continueOnError) {
    await agent.skipCurrentTask();
  } else {
    await agent.halt();
  }
}
```

## 调试 Agent

### 启用详细日志

```bash
LOG_LEVEL=debug taskflow agent
```

### 查看执行历史

```typescript
const history = agent.getExecutionHistory();

history.forEach((action) => {
  console.log(`[${action.type}] ${action.timestamp}`);
  console.log(`  Details: ${JSON.stringify(action.details)}`);
  console.log(`  Result: ${action.result}`);
});
```

### 检查状态

```bash
taskflow agent status

# 输出示例
Current State: executing
Current Task: Implement auth service
Progress: ████████░░░░░░░ 40%
Iteration: 2/10
```

## 性能优化

### 1. 缓存 AI 响应

```yaml
cache:
  enabled: true
  aiResponse:
    ttl: 3600000  # 1小时
```

### 2. 并行任务执行

```yaml
execution:
  concurrency: 4
  batchSize: 10
```

### 3. 增量验证

```yaml
verification:
  strategy: incremental
  checkpoints:
    - type-checking
    - unit-test
```

---

相关文档：
- [Workflow Engine](./workflow.md)
- [MCP Integration](./mcp.md)
- [API Reference](../api/README.md)
