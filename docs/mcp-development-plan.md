# TaskFlow AI - MCP 工具开发计划

> 版本: v1.0  
> 日期: 2026-03-17  
> 状态: 规划中

---

## 🎯 目标

**打造最丰富的 MCP 工作流工具集，实现一键集成到所有主流编程编辑器**

| 目标编辑器 | 集成方式 |
|------------|----------|
| Cursor | ✅ stdio / SSE |
| VSCode | ✅ stdio |
| Windsurf | ✅ stdio |
| Trae | ✅ stdio |
| Claude Desktop | ✅ stdio |
| Zed | ✅ stdio |

---

## 📦 工具矩阵

### P0 - 核心工具 (必须实现)

| 工具名称 | 功能描述 | 预估工时 |
|----------|----------|----------|
| `filesystem` | 文件系统操作 (读/写/编辑/删除/搜索) | 3d |
| `http-request` | HTTP 请求 (GET/POST/PUT/DELETE) | 2d |
| `shell` | Shell 命令执行 | 2d |
| `database` | SQLite 数据库操作 | 3d |
| `search-replace` | 批量搜索替换 | 2d |

### P1 - 重要工具

| 工具名称 | 功能描述 | 预估工时 |
|----------|----------|----------|
| `code-executor` | 代码执行器 (JS/Python/Shell) | 3d |
| `vector` | 向量存储 & 语义搜索 | 3d |
| `memory` | 短期记忆 / 上下文管理 | 2d |
| `git` | Git 操作 (commit/status/branch) | 2d |

### P2 - 扩展工具

| 工具名称 | 功能描述 | 预估工时 |
|----------|----------|----------|
| `browser-automation` | 浏览器自动化 | 5d |
| `slack-webhook` | Slack 消息通知 | 1d |
| `discord-webhook` | Discord 消息通知 | 1d |
| `email` | 邮件发送 | 2d |
| `calendar` | 日历事件管理 | 2d |

---

## 🏗️ 架构设计

### 1. 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      MCP Client                             │
│  (Cursor / VSCode / Claude Desktop / Trae / Windsurf)     │
└─────────────────────┬───────────────────────────────────────┘
                      │ stdio / SSE / HTTP
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    TaskFlow MCP Server                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Tools     │  │  Resources  │  │   Prompts  │        │
│  │  Registry   │  │   Handler   │  │   Handler  │        │
│  └──────┬──────┘  └─────────────┘  └─────────────┘        │
│         │                                                   │
│  ┌──────▼──────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Tool        │  │   Config    │  │    Auth     │        │
│  │  Executor   │  │   Manager   │  │   Manager   │        │
│  └──────┬──────┘  └─────────────┘  └─────────────┘        │
└─────────┼───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Tool Implementations                     │
├──────────┬──────────┬──────────┬──────────┬───────────────┤
│filesystem │   http   │ database │  vector  │     ...       │
└──────────┴──────────┴──────────┴──────────┴───────────────┘
```

### 2. 目录结构

```
src/mcp/
├── tools/
│   ├── index.ts              # 工具导出入口
│   ├── types.ts              # 类型定义
│   ├── categories.ts         # 工具分类
│   ├── registry.ts            # 工具注册表
│   ├── built-in.ts            # 内置工具
│   ├── filesystem.ts          # 文件系统工具 ⭐
│   ├── http.ts                # HTTP 请求工具 ⭐
│   ├── database.ts           # 数据库工具 ⭐
│   ├── shell.ts               # Shell 执行工具
│   ├── vector.ts              # 向量存储工具
│   ├── memory.ts              # 记忆工具
│   ├── git.ts                 # Git 工具
│   └── executor.ts            # 工具执行器
├── server/
│   ├── index.ts               # 服务器入口
│   ├── handlers.ts            # MCP 协议处理器
│   ├── executor.ts            # 工具执行器
│   └── transport.ts           # 传输层 (stdio/sse)
├── prompts/
│   └── *.ts                   # 预定义提示词
├── resources/
│   └── *.ts                   # 资源处理器
└── config/
    └── schemas.ts             # 配置 Schema
```

### 3. 工具接口规范

```typescript
// src/mcp/tools/types.ts
interface ToolDefinition {
  name: string;                    // 工具唯一名称
  description: string;              // 工具描述
  inputSchema: JSONSchema;          // 输入参数 Schema
  category: ToolCategory;           // 工具分类
  tags: string[];                   // 工具标签
  auth?: AuthConfig;                // 认证配置
  rateLimit?: RateLimitConfig;      // 速率限制
  handler: ToolHandler;             // 实际处理函数
}

type ToolHandler = (
  input: Record<string, any>,
  context: ToolContext
) => Promise<ToolResult>;

interface ToolResult {
  content?: string;                 // 文本内容
  data?: any;                       // 结构化数据
  error?: string;                  // 错误信息
  isError?: boolean;                // 是否为错误
}
```

---

## 🔧 传输层设计

### 支持的传输方式

| 传输方式 | 协议 | 适用场景 | 状态 |
|----------|------|----------|------|
| `stdio` | 标准输入输出 | 本地编辑器集成 | ✅ 已实现 |
| `SSE` | Server-Sent Events | Web 应用 | ✅ 待实现 |
| `HTTP` | HTTP + SSE | 远程服务 | ✅ 待实现 |

### 自动发现配置

每个编辑器都有特定的配置位置，生成 `mcp.json` 配置文件：

```json
// Cursor / Claude Desktop
{
  "mcpServers": {
    "taskflow-ai": {
      "command": "npx",
      "args": ["-y", "@taskflow-ai/mcp-server"],
      "env": {
        "TASKFLOW_API_KEY": "${TASKFLOW_API_KEY}"
      }
    }
  }
}
```

---

## 📋 实施计划

### 第一阶段：核心工具 (Week 1-2)

```
Week 1:
├── Day 1-2: 工具注册表重构
│   ├── 统一工具接口
│   ├── 分类系统
│   └── 动态加载机制
├── Day 3-4: filesystem 工具完善
│   ├── 递归搜索
│   ├── 大文件分片读取
│   └── 批量操作
├── Day 5: http-request 工具
│   ├── RESTful 支持
│   └── 认证 (Bearer/Basic)
└── Day 7: 单元测试 & 文档

Week 2:
├── Day 1-2: shell 执行器增强
│   ├── 超时控制
│   ├── 环境变量
│   └── 工作目录
├── Day 3-4: database 工具
│   ├── SQLite 原生支持
│   ├── 连接池
│   └── 事务支持
└── Day 5-7: 集成测试 & 调试
```

### 第二阶段：高级工具 (Week 3-4)

```
Week 3:
├── Day 1-2: code-executor
│   ├── JavaScript 沙箱
│   └── Python 执行 (通过子进程)
├── Day 3-4: vector 存储
│   ├── 内存向量库
│   └── 相似度搜索
└── Day 5: memory 工具
    └── 上下文管理

Week 4:
├── Day 1-2: git 工具
│   ├── 基本操作
│   └── 分支管理
├── Day 3-5: 性能优化 & 缓存
└── Day 6-7: 文档 & 示例
```

### 第三阶段：生态集成 (Week 5-6)

```
Week 5:
├── Day 1-2: 配置文件生成器
│   ├── Cursor
│   ├── VSCode
│   └── Claude Desktop
├── Day 3-4: npm 包发布
│   ├── @taskflow-ai/mcp-server
│   └── TypeScript 类型
└── Day 5-7: 测试 & 调试

Week 6:
├── Day 1-2: 官方集成测试
├── Day 3-4: 性能压测
├── Day 5: 文档完善
└── Day 6-7: 发布准备
```

---

## 🔐 安全性设计

### 1. 工具权限控制

```typescript
// 权限级别
enum PermissionLevel {
  NONE = 0,      // 无权限
  READ = 1,      // 只读
  WRITE = 2,     // 写入
  EXECUTE = 4,   // 执行
  ADMIN = 8,     // 管理
}

// 每个工具定义所需权限
const toolPermissions = {
  'filesystem:read': PermissionLevel.READ,
  'filesystem:write': PermissionLevel.WHITE,
  'shell:exec': PermissionLevel.EXECUTE,
  'database:query': PermissionLevel.READ,
  'database:write': PermissionLevel.WHITE,
};
```

### 2. 沙箱执行

```typescript
// 代码执行器沙箱
class SandboxExecutor {
  private vm: VM2 | Bun;  // 使用 VM2 或 Bun sandbox
  
  async execute(code: string, timeout: number): Promise<Result> {
    return this.vm.run(code, { timeout });
  }
}
```

### 3. 操作审计

```typescript
interface AuditLog {
  timestamp: Date;
  tool: string;
  user: string;
  input: any;
  output: any;
  duration: number;
  success: boolean;
}
```

---

## 📊 成功指标

| 指标 | MVP | v1.0 | v2.0 |
|------|-----|------|------|
| 工具数量 | 5 | 10 | 20+ |
| 支持编辑器 | 3 | 5 | 6 |
| 集成难度 | 手动 | 一键配置 | 自动发现 |
| 文档完整性 | 基础 | 完整 | 优秀 |

---

## 🚀 快速开始

### 1. 本地运行

```bash
# 克隆项目
git clone https://github.com/agions/taskflow-ai.git
cd taskflow-ai

# 安装依赖
pnpm install

# 启动 MCP 服务器
pnpm run mcp:start
```

### 2. Cursor 集成

```bash
# 生成配置文件
pnpm run mcp:config cursor > ~/.cursor/mcp.json
```

### 3. VSCode 集成

```bash
# 生成配置文件
pnpm run mcp:config vscode > ~/.vscode/extensions/your-extension/mcp.json
```

---

## 📚 相关资源

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- [MCP Spec](https://spec.modelcontextprotocol.io/)

---

*生成时间: 2026-03-17*
