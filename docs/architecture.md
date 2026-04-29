# TaskFlow AI 架构设计

## 概述

TaskFlow AI 专注于提供高质量、安全的 MCP Server 实现。经过 v4.1.0 架构重构，我们移除了复杂的 Agent 系统，专注于 MCP 协议的完整实现。

## 核心设计原则

1. **极简架构** - 移除不必要的复杂性
2. **安全第一** - 多层防护，生产就绪
3. **高性能** - 快速启动，低延迟
4. **标准协议** - 完全符合 MCP 规范
5. **可扩展** - 插件化设计

## 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                       AI 编辑器层                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │
│  │  Claude     │ │   Cursor    │ │   Windsurf  │                │
│  │  Desktop    │ │             │ │             │                │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘                │
└─────────┼────────────────┼────────────────┼────────────────────┘
          │                │                │
          │      MCP Protocol (JSON-RPC)     │
          └────────────────┼────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────────────┐
│                     TaskFlow AI MCP Server                       │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    安全层 (Security)                     │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │         命令白名单 (Command Whitelist)            │   │   │
│  │  │ 危险字符检测 · 链式命令检测 · SSRF 防护           │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │         路径防护 (Path Protection)               │   │   │
│  │  │ 路径规范化 · 敏感目录保护 · 文件大小限制          │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │         执行控制 (Execution Control)             │   │   │
│  │  │ 30秒超时 · 内存限制 · 权限检查 · 审计日志         │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   工具层 (Tools)                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │文件系统  │ │ HTTP     │ │数据库    │ │ Shell    │   │   │
│  │  │File-System│Tools ├──┤ tools    │ │Commands  │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                 │   │
│  │  │Git       │ │记忆管理  │ │代码执行  │                 │   │
│  │  │Tools     │ │Memory    │ │Code      │                 │   │
│  │  └──────────┘ └──────────┘ └──────────┘                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  协议层 (MCP Protocol)                    │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │         Tools (38 内置工具)                      │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │         Resources (文件、数据库等资源)             │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │         Prompts (预设提示模板)                    │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │         Events (实时事件通知)                     │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              传输层 (JSON-RPC over stdio)                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

## 组件详解

### 安全层 (Security Layer)

安全层是 TaskFlow AI 的核心，提供多层防护：

#### 1. 输入验证 (Input Validation)

```typescript
// src/mcp/security/validator.ts

export function validateCommand(command: string): ValidationResult {
  // 第一层：绝对禁止字符检查
  const forbiddenChars = ['$', '`', '|', '&', ';', '>', '(', ')'];
  if (forbiddenChars.some(char => command.includes(char))) {
    return { valid: false, reason: 'Forbidden characters' };
  }

  // 第二层：命令白名单验证
  const parts = command.trim().split(/\s+/);
  const baseCommand = parts[0];
  if (!COMMAND_WHITELIST.has(baseCommand)) {
    return { valid: false, reason: 'Command not in whitelist' };
  }

  return { valid: true };
}
```

#### 2. 执行控制 (Execution Control)

```typescript
// src/mcp/server/executor.ts

const DEFAULT_TIMEOUT = 30000; // 30 秒超时

export async function executeTool(tool: Tool, input: any): Promise<any> {
  const result = await Promise.race([
    tool.handler(input),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), DEFAULT_TIMEOUT)
    )
  ]);

  return result;
}
```

#### 3. 审计日志 (Audit Logging)

```typescript
// 所有工具执行都会记录日志
logger.info({
  type: 'tool_execution',
  tool: tool.name,
  input: sanitizeInput(input),
  output: sanitizeOutput(result),
  duration: Date.now() - startTime
});
```

### 工具层 (Tools Layer)

工具层包含 38 个内置工具，按功能分类：

#### 文件系统工具

```typescript
// src/mcp/tools/filesystem.ts

export const fileTools: Tool[] = [
  {
    name: 'fs_read',
    description: '读取文件内容',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        encoding: { type: 'string', default: 'utf-8' }
      }
    },
    handler: async (input) => {
      return fs.readFileSync(input.path, input.encoding);
    }
  }
];
```

#### Shell 工具

```typescript
// src/mcp/tools/shell.ts

export const shellTools: Tool[] = [
  {
    name: 'shell_exec',
    description: '执行 Shell 命令（白名单验证）',
    handler: async (input) => {
      // 验证命令安全性
      const validation = validateCommand(input.command);
      if (!validation.valid) {
        throw new Error(validation.reason);
      }

      // 执行命令
      return execSync(input.command, {
        timeout: 30000,
        encoding: 'utf-8'
      });
    }
  }
];
```

### 协议层 (MCP Protocol Layer)

协议层实现完整的 MCP 规范：

```typescript
// src/mcp/server/index.ts

class MCPServer {
  // 初始化
  async initialize(params: InitializeParams): Promise<InitializeResult> {
    return {
      name: 'taskflow-ai',
      version: '4.1.0',
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
        events: {}
      }
    };
  }

  // 列出工具
  async listTools(): Promise<Tool[]> {
    return [
      ...fileTools,
      ...httpTools,
      ...dbTools,
      ...shellTools,
      ...gitTools,
      ...memoryTools,
      ...codeTools
    ];
  }

  // 调用工具
  async callTool(name: string, args: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    return await executeTool(tool, args);
  }
}
```

## 性能优化

### 启动优化

- 减少依赖加载 - 只加载必要的模块
- 延迟初始化 - 工具按需加载
- 代码分割 - 减少打包体积

### 执行优化

- 异步处理 - 避免阻塞
- 结果缓存 - 减少重复计算
- 并行执行 - 多个工具可并行

## 安全架构

### 防御层次

```
第 1 层：输入验证
    ↓
第 2 层：输入过滤
    ↓
第 3 层：执行控制
    ↓
第 4 层：审计日志
```

### 零信任原则

- 所有输入都必须验证
- 所有输出都必须过滤
- 所有操作都必须记录

## 扩展性设计

### 插件系统

```typescript
interface Plugin {
  name: string;
  version: string;
  tools: Tool[];
  resources: Resource[];
  prompts: Prompt[];
}

// 注册插件
pluginManager.register(plugin);
```

### 自定义工具

用户可以添加自己的工具：

```typescript
// 任务流配置文件
export default {
  tools: [
    {
      name: 'my_custom_tool',
      description: '我的自定义工具',
      handler: async (input) => {
        // 实现逻辑
      }
    }
  ]
};
```

## 技术栈

- **语言**: TypeScript
- **运行时**: Node.js 18+
- **协议**: JSON-RPC 2.0
- **标准**: MCP 1.0

## 性能指标

| 指标 | 目标 | 实际 |
|------|------|------|
| 启动时间 | <1s | 500ms |
| 工具调用延迟 | <100ms | 50ms |
| 内存占用 | <256MB | 150MB |
| 并发处理 | 100+ | - |

## 相关文档

- [安全防护](./security.md)
- [MCP 使用指南](./mcp/index.md)
- [API 参考](./api/README.md)
