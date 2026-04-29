# MCP Server 使用指南

TaskFlow AI 提供完整的 MCP (Model Context Protocol) Server 实现，为 Claude、Cursor、Windsurf 等 AI 编辑器提供 38 个强大的工具能力。

## 什么是 MCP？

MCP (Model Context Protocol) 是一个开放标准，允许 AI 模型与外部工具和服务进行交互。TaskFlow AI 的 MCP Server 实现了以下 MCP 标准：

- ✅ **Tools** - 可执行的函数/命令集合
- ✅ **Resources** - 文件、数据库等外部资源访问
- ✅ **Prompts** - 预设的提示模板
- ✅ **Events** - 实时事件通知系统

## 快速配置

### Claude Desktop

1. **安装 TaskFlow AI**

```bash
npm install -g taskflow-ai
```

2. **自动配置**

```bash
taskflow mcp init -e claude-desktop
```

3. **重启 Claude Desktop**

配置文件：`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)

```json
{
  "mcpServers": {
    "taskflow": {
      "command": "/usr/local/bin/taskflow",
      "args": ["mcp", "start"]
    }
  }
}
```

### Cursor

1. **安装 TaskFlow AI**

```bash
npm install -g taskflow-ai
```

2. **自动配置**

```bash
taskflow mcp init -e cursor
```

3. **重启 Cursor**

配置文件：`~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "taskflow": {
      "command": "taskflow",
      "args": ["mcp", "start"]
    }
  }
}
```

### Windsurf

1. **安装 TaskFlow AI**

```bash
npm install -g taskflow-ai
```

2. **自动配置**

```bash
taskflow mcp init -e windsurf
```

3. **重启 Windsurf**

配置文件：`~/.config/Windsurf/mcp.json`

```json
{
  "mcpServers": {
    "taskflow": {
      "command": "taskflow",
      "args": ["mcp", "start"]
    }
  }
}
```

## 工具列表

TaskFlow AI 提供 38 个内置工具，分为以下类别：

### 文件系统 (8)

| 工具 | 功能 | 安全级别 |
|------|------|----------|
| `fs_read` | 读取文件内容 | High |
| `fs_write` | 写入文件内容 | High |
| `fs_append` | 追加内容到文件 | High |
| `fs_delete` | 删除文件 | High |
| `fs_list` | 列出目录内容 | Low |
| `fs_search` | 搜索文件 | Low |
| `fs_copy` | 复制文件 | High |
| `fs_move` | 移动/重命名文件 | High |

**安全特性**：
- ✅ 路径遍历防护
- ✅ 敏感目录保护
- ✅ 文件大小限制 (10MB)

### HTTP 请求 (7)

| 工具 | 功能 | 安全级别 |
|------|------|----------|
| `http_get` | GET 请求 | Medium |
| `http_post` | POST 请求 | Medium |
| `http_put` | PUT 请求 | Medium |
| `http_delete` | DELETE 请求 | Medium |
| `http_download` | 下载文件 | Medium |
| `http_head` | HEAD 请求 | Low |
| `http_options` | OPTIONS 请求 | Low |

**安全特性**：
- ✅ SSRF 防护（禁止访问私有 IP）
- ✅ URL 协议验证
- ✅ 响应大小限制 (5MB)
- ✅ 30 秒超时

### 数据库 (5)

| 工具 | 功能 | 安全级别 |
|------|------|----------|
| `db_query` | 执行 SQL 查询 | Medium |
| `db_init` | 初始化数据库 | Medium |
| `db_schema` | 获取数据库 Schema | Low |
| `db_tables` | 列出所有表 | Low |
| `db_backup` | 备份数据库 | Medium |

**安全特性**：
- ✅ SQL 注入防护
- ✅ 只读模式支持
- ✅ 查询结果限制

### Shell 命令 (3)

| 工具 | 功能 | 安全级别 |
|------|------|----------|
| `shell_exec` | 执行 Shell 命令（同步） | High |
| `shell_exec_async` | 异步执行 Shell 命令 | High |
| `shell_test` | 测试命令是否可用 | Low |

**安全特性**：
- ✅ 命令白名单（只允许安全命令）
- ✅ 危险字符过滤 (`&&`, `||`, `;`, `|`, `$()`, `` ` ``)
- ✅ 30 秒超时保护
- ✅ 禁止命令链和管道

**白名单命令**：
- `ls`, `cd`, `pwd`, `cat`, `head`, `tail`, `grep`, `find`
- `git`, `npm`, `yarn`, `pnpm`, `node`, `python`, `python3`
- `cp`, `mv`, `rm`, `mkdir`, `touch`
- `echo`, `printf`, `sed`, `awk`

### Git 操作 (8)

| 工具 | 功能 | 安全级别 |
|------|------|----------|
| `git_status` | 查看 Git 状态 | Low |
| `git_log` | 查看提交历史 | Low |
| `git_commit` | 提交更改 | Medium |
| `git_push` | 推送更改 | Medium |
| `git_pull` | 拉取更改 | Medium |
| `git_branch` | 分支管理 | Medium |
| `git_checkout` | 切换分支 | Medium |
| `git_diff` | 查看差异 | Low |

**安全特性**：
- ✅ Credential 安全管理
- ✅ 只操作当前仓库
- ✅ 敏感信息自动脱敏

### 记忆管理 (4)

| 工具 | 功能 | 安全级别 |
|------|------|----------|
| `memory_set` | 设置记忆 | Low |
| `memory_get` | 获取记忆 | Low |
| `memory_clear` | 清除记忆 | Medium |
| `memory_list` | 列出所有记忆 | Low |

**安全特性**：
- ✅ 本地存储
- ✅ 自动过期机制
- ✅ 大小限制 (1GB)

### 代码执行 (3)

| 工具 | 功能 | 安全级别 |
|------|------|----------|
| `code_execute` | 执行代码 | High |
| `code_eval_js` | 评估 JavaScript | Medium |
| `code_eval_python` | 评估 Python | Medium |

**安全特性**：
- ✅ 执行超时限制 (30 秒)
- ✅ 内存限制 (512MB)
- ✅ 沙箱环境

## 使用示例

### 示例 1: 读取文件

```bash
# Claude Desktop 中的对话
用户：帮我读取 README.md 的内容

Claude: （自动调用 fs_read 工具）
文件内容：...
```

### 示例 2: 发送 HTTP 请求

```bash
# Cursor 中的对话
用户：帮我获取 GitHub API 的仓库信息

Cursor: （自动调用 http_get 工具）
GET https://api.github.com/repos/Agions/taskflow-ai

返回：...
```

### 示例 3: 执行 Shell 命令

```bash
# Windsurf 中的对话
用户：帮我查看当前目录的文件

Windsurf: （自动调用 shell_exec 工具）
执行：ls -la

返回：...
```

## 安全最佳实践

1. **启用所有安全层** - 不要禁用任何安全检查
2. **定期更新** - 保持 TaskFlow AI 最新版本
3. **审查日志** - 定期检查 MCP Server 日志
4. **最小权限** - 只启用必要的工具
5. **环境隔离** - 生产环境使用专用配置

## 故障排除

### MCP Server 未启动

```bash
# 检查 MCP Server 状态
taskflow mcp status

# 手动启动
taskflow mcp start

# 查看日志
taskflow mcp logs
```

### 工具执行失败

1. 检查命令白名单
2. 查看安全日志
3. 验证权限设置

### 性能问题

```bash
# 查看性能统计
taskflow mcp stats

# 清理缓存
taskflow mcp clean
```

## 配置文件

### 全局配置

位置：`~/.taskflow/config.yaml`

```yaml
mcp:
  server:
    port: 3000
    host: "127.0.0.1"
    timeout: 30000

  security:
    enabled: true
    strictMode: true

  tools:
    enabled:
      - fs_read
      - fs_write
      - http_get
      - git_commit
```

## 相关文档

- [架构设计](../architecture.md)
- [安全防护](../security.md)
- [CLI 命令](../cli/commands.md)
