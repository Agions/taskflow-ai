# MCP 工具

TaskFlow AI 内置强大的 MCP (Model Context Protocol) 工具集，支持主流代码编辑器的无缝集成。

## 特性

- 🚀 **40+ MCP 工具** - 覆盖文件、网络、数据库、代码执行等场景
- 🎯 **一键集成** - 支持 Cursor、VSCode、Windsurf、Trae、Claude Desktop、Zed
- 🔒 **安全沙箱** - 代码执行隔离，权限控制
- ⚡ **高性能** - 基于原生 Node.js 实现

## 工具分类

| 分类 | 工具数 | 描述 |
|------|--------|------|
| filesystem | 10+ | 文件系统操作 |
| http | 4 | HTTP 请求 |
| database | 4 | SQLite 数据库 |
| shell | 4 | Shell 命令执行 |
| git | 7 | Git 版本控制 |
| memory | 6 | 短期记忆 |
| code | 4 | 代码执行 |
| notification | 4 | 消息通知 |

## 快速开始

### 1. 安装

```bash
npm install -g taskflow-ai
# 或
pnpm add -g taskflow-ai
```

### 2. 生成编辑器配置

```bash
# 生成所有编辑器配置
taskflow mcp init

# 只生成 Cursor 配置
taskflow mcp init -e cursor

# 指定输出目录
taskflow mcp init -e all -o ~/.cursor
```

### 3. 查看可用工具

```bash
# 列出所有工具
taskflow mcp tools

# 按分类筛选
taskflow mcp tools -c filesystem
taskflow mcp tools -c http
taskflow mcp tools -c shell
```

## 编辑器配置

### Cursor

```bash
taskflow mcp init -e cursor
```

配置内容:
```json
{
  "mcpServers": {
    "taskflow-ai": {
      "command": "npx",
      "args": ["-y", "taskflow-ai@latest", "mcp", "start"],
      "env": {
        "TASKFLOW_API_KEY": "{{TASKFLOW_API_KEY}}"
      }
    }
  }
}
```

### Claude Desktop

```bash
taskflow mcp init -e claude-desktop
```

配置文件位置:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%/Claude/claude_desktop_config.json`

### VSCode

使用 VSCode MCP 扩展，然后添加配置:
```json
{
  "mcpServers": {
    "taskflow-ai": {
      "command": "npx",
      "args": ["-y", "taskflow-ai@latest", "mcp", "start"]
    }
  }
}
```

### Windsurf

```bash
taskflow mcp init -e windsurf
```

### Trae

```bash
taskflow mcp init -e trae
```

## 工具详情

### 文件系统工具

| 工具名 | 描述 | 参数 |
|--------|------|------|
| `fs_readDir` | 读取目录内容 | path, options |
| `fs_mkdir` | 创建目录 | path, options |
| `fs_remove` | 删除文件/目录 | path, options |
| `fs_copy` | 复制文件/目录 | src, dest |
| `fs_move` | 移动/重命名 | src, dest |
| `fs_stat` | 获取文件状态 | path |
| `fs_exists` | 检查是否存在 | path |
| `fs_readJson` | 读取 JSON 文件 | path |
| `fs_writeJson` | 写入 JSON 文件 | path, data |
| `fs_glob` | Glob 模式匹配 | pattern, options |

### HTTP 工具

| 工具名 | 描述 | 参数 |
|--------|------|------|
| `http_request` | 通用 HTTP 请求 | url, method, headers, body |
| `http_get` | GET 请求 | url, query, headers |
| `http_post` | POST 请求 | url, body, query |
| `http_download` | 下载文件 | url, path |

### 数据库工具

| 工具名 | 描述 | 参数 |
|--------|------|------|
| `db_query` | 执行 SQL 查询 | dbPath, sql, params |
| `db_init` | 初始化数据库 | dbPath, tables |
| `db_list` | 列出所有表 | dbPath |
| `db_schema` | 获取表结构 | dbPath, table |

### Shell 工具

| 工具名 | 描述 | 参数 |
|--------|------|------|
| `shell_exec` | 执行命令 | command, cwd, timeout |
| `shell_exec_async` | 异步执行 | command, cwd |
| `shell_test` | 测试命令可用性 | command |
| `shell_kill` | 终止进程 | pid, signal |

### Git 工具

| 工具名 | 描述 | 参数 |
|--------|------|------|
| `git_status` | 获取状态 | cwd |
| `git_log` | 提交历史 | cwd, maxCount |
| `git_branch` | 分支列表 | cwd, all |
| `git_commit` | 创建提交 | cwd, message |
| `git_push` | 推送 | cwd, remote, branch |
| `git_pull` | 拉取 | cwd, remote, branch |
| `git_diff` | 查看差异 | cwd, file, staged |

### Memory 工具

| 工具名 | 描述 | 参数 |
|--------|------|------|
| `memory_set` | 存储数据 | key, value, ttl |
| `memory_get` | 获取数据 | key |
| `memory_delete` | 删除数据 | key |
| `memory_list` | 列出所有键 | - |
| `memory_clear` | 清空内存 | - |
| `memory_stats` | 内存统计 | - |

### 代码执行工具

| 工具名 | 描述 | 参数 |
|--------|------|------|
| `code_execute` | 执行代码 | code, language, timeout |
| `code_eval_js` | 执行 JS (沙箱) | code, timeout |
| `code_eval_python` | 执行 Python | code, timeout |
| `code_test` | 测试语言可用性 | code, language |

### 通知工具

| 工具名 | 描述 | 参数 |
|--------|------|------|
| `notify_slack` | 发送 Slack | webhookUrl, message |
| `notify_discord` | 发送 Discord | webhookUrl, message |
| `notify_email` | 发送邮件 | from, to, subject, body |
| `notify_webhook` | 通用 Webhook | url, method, body |

## 本地开发测试

```bash
# 构建项目
npm run build

# 启动 MCP 服务器 (stdio 模式)
npm run mcp:start

# 或使用 CLI
taskflow mcp start
```

## 环境变量

| 变量名 | 描述 |
|--------|------|
| `TASKFLOW_API_KEY` | API 密钥 |
| `TASKFLOW_CONFIG_PATH` | 配置文件路径 |
| `TASKFLOW_LOG_LEVEL` | 日志级别 |

## 安全说明

- Shell 执行需要明确授权
- 代码执行在沙箱环境中运行
- 所有操作都有审计日志
- 敏感操作需要 API 密钥

## 常见问题

### Q: MCP 服务器启动失败？

```bash
# 检查 Node.js 版本
node --version  # 需要 >= 18

# 重新安装
npm install -g taskflow-ai
```

### Q: 工具调用超时？

增加超时时间:
```json
{
  "shell_exec": {
    "timeout": 60
  }
}
```

### Q: 如何添加更多工具？

使用 `ToolRegistry` 注册自定义工具:
```typescript
import { toolRegistry } from 'taskflow-ai';

toolRegistry.register({
  name: 'custom_tool',
  description: '自定义工具',
  inputSchema: { ... },
  handler: async (input) => { ... }
});
```
