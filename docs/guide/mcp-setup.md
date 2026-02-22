# TaskFlow AI MCP 配置指南

## 概述

TaskFlow AI 支持 **Model Context Protocol (MCP)**，可以与 Trae、Cursor、Claude Desktop、Windsurf 等 AI 编辑器集成。

## 支持的编辑器

- ✅ [Trae](https://trae.ai/)
- ✅ [Cursor](https://cursor.sh/)
- ✅ [Claude Desktop](https://claude.ai/download)
- ✅ [Windsurf](https://codeium.com/windsurf)
- ✅ [VS Code](https://code.visualstudio.com/) (with MCP extension)

## 快速配置

### 1. Trae 编辑器

**方法：通过设置界面**

1. 打开 Trae → Settings → MCP
2. 点击 "Add Server"
3. 填写配置：
   - **Name**: `taskflow-ai`
   - **Type**: `Command`
   - **Command**: `npx -y taskflow-ai@latest mcp start`

**方法：配置文件**

编辑 `~/.config/Trae/mcp.json` (Linux) 或 `~/Library/Application Support/Trae/mcp.json` (macOS)：

```json
{
  "mcpServers": {
    "taskflow-ai": {
      "command": "npx",
      "args": ["-y", "taskflow-ai@latest", "mcp", "start"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### 2. Cursor 编辑器

1. 打开 Cursor → Settings → Features → MCP
2. 点击 "Add New MCP Server"
3. 填写配置：
   - **Name**: `taskflow-ai`
   - **Type**: `Command`
   - **Command**: `npx -y taskflow-ai@latest mcp start`

### 3. Claude Desktop

编辑配置文件：

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

**Linux**: `~/.config/Claude/claude_desktop_config.json`

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

### 4. Windsurf

1. 打开 Windsurf → Settings → Cascade → MCP
2. 添加配置：

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

## 本地开发配置

如果你正在开发 TaskFlow AI，可以使用本地版本：

```json
{
  "mcpServers": {
    "taskflow-ai": {
      "command": "node",
      "args": ["/path/to/taskflow-ai/dist/mcp/stdio-server.js"]
    }
  }
}
```

## 可用工具

MCP 服务器提供以下工具：

| 工具名 | 描述 | 参数 |
|--------|------|------|
| `file_read` | 读取文件内容 | `path`: 文件路径 |
| `file_write` | 写入文件内容 | `path`: 文件路径, `content`: 内容 |
| `shell_exec` | 执行 Shell 命令 | `command`: 命令, `cwd`: 工作目录, `timeout`: 超时时间 |
| `project_analyze` | 分析项目结构 | `path`: 项目路径, `depth`: 扫描深度 |
| `task_create` | 创建新任务 | `title`: 标题, `description`: 描述, `priority`: 优先级 |

## 使用示例

在编辑器中，你可以这样使用 TaskFlow AI：

```
请帮我分析当前项目的结构
```

```
读取 src/index.ts 文件的内容
```

```
创建一个新任务：实现用户登录功能
```

## 故障排除

### 连接失败

1. **检查 Node.js 版本**: 确保 Node.js >= 18.0.0
   ```bash
   node --version
   ```

2. **检查包是否安装**:
   ```bash
   npm list -g taskflow-ai
   ```

3. **查看日志**: 在编辑器中查看 MCP 服务器的输出日志

### 权限问题

如果提示权限错误，尝试：

```bash
# 使用 sudo (macOS/Linux)
sudo npx taskflow-ai@latest mcp start

# 或修改 npm 全局目录权限
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### 命令未找到

确保 `npx` 可用：

```bash
which npx
# 或
where npx
```

如果未找到，重新安装 Node.js 或更新 npm：

```bash
npm install -g npm@latest
```

## 高级配置

### 自定义环境变量

```json
{
  "mcpServers": {
    "taskflow-ai": {
      "command": "npx",
      "args": ["-y", "taskflow-ai@latest", "mcp", "start"],
      "env": {
        "TASKFLOW_LOG_LEVEL": "debug",
        "TASKFLOW_WORKSPACE": "/path/to/workspace"
      }
    }
  }
}
```

### 使用特定版本

```json
{
  "mcpServers": {
    "taskflow-ai": {
      "command": "npx",
      "args": ["-y", "taskflow-ai@2.0.0", "mcp", "start"]
    }
  }
}
```

## 更新日志

### v2.0.0
- ✅ 修复 MCP 连接问题 (Issue #1)
- ✅ 支持 stdio 传输模式
- ✅ 兼容 Trae、Cursor、Claude Desktop、Windsurf
- ✅ 添加安全沙箱机制
- ✅ 优化工具执行性能

## 获取帮助

- GitHub Issues: https://github.com/Agions/taskflow-ai/issues
- 文档: https://agions.github.io/taskflow-ai/
