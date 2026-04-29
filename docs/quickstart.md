# 快速开始

## 5 分钟快速上手

### 1. 安装

```bash
# npm
npm install -g taskflow-ai

# pnpm
pnpm add -g taskflow-ai

# yarn
yarn global add taskflow-ai
```

### 2. 验证安装

```bash
taskflow --version
# 输出: 4.1.0

taskflow doctor
# 检查系统环境和依赖
```

### 3. 快速配置

```bash
# 初始化配置
taskflow init

# 配置 Claude Desktop
taskflow mcp init -e claude-desktop

# 配置 Cursor
taskflow mcp init -e cursor
```

### 4. 启动 MCP Server

```bash
taskflow mcp start
```

### 5. 在 AI 编辑器中使用

重启你的 AI 编辑器（Claude Desktop、Cursor 等），然后就可以使用 38 个内置工具了！

---

## 系统要求

- **Node.js**: >= 18.0.0
- **操作系统**: Linux / macOS / Windows (WSL)
- **内存**: >= 512MB
- **磁盘空间**: >= 100MB

---

## 安装方式

### 使用 npm (推荐)

```bash
npm install -g taskflow-ai
```

### 使用 pnpm

```bash
pnpm add -g taskflow-ai
```

### 使用 yarn

```bash
yarn global add taskflow-ai
```

### 使用 Homebrew (macOS)

```bash
brew tap agions/tap
brew install taskflow-ai
```

### 从源码安装

```bash
git clone https://github.com/Agions/taskflow-ai.git
cd taskflow-ai
npm install
npm run build
npm link
```

---

## 配置 MCP Server

### Claude Desktop

1. **自动配置**

```bash
taskflow mcp init -e claude-desktop
```

2. **手动配置**

编辑 `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

3. **重启 Claude Desktop**

### Cursor

1. **自动配置**

```bash
taskflow mcp init -e cursor
```

2. **手动配置**

编辑 `~/.cursor/mcp.json`:

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

3. **重启 Cursor**

### Windsurf

1. **自动配置**

```bash
taskflow mcp init -e windsurf
```

2. **手动配置**

编辑 `~/.config/Windsurf/mcp.json`:

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

3. **重启 Windsurf**

---

## 常用命令

### MCP 管理

```bash
# 启动 MCP Server
taskflow mcp start

# 停止 MCP Server
taskflow mcp stop

# 重启 MCP Server
taskflow mcp restart

# 查看 MCP Server 状态
taskflow mcp status

# 查看日志
taskflow mcp logs

# 查看统计信息
taskflow mcp stats
```

### 配置管理

```bash
# 初始化配置
taskflow init

# 查看配置
taskflow config list

# 设置配置
taskflow config set security.strictMode true

# 删除配置
taskflow config unset security.strictMode
```

### 工具管理

```bash
# 列出所有工具
taskflow tools list

# 查看工具详情
taskflow tools info fs_read

# 启用工具
taskflow mcp enable fs_read fs_write

# 禁用工具
taskflow mcp disable shell_exec
```

### 安全管理

```bash
# 查看安全状态
taskflow security status

# 运行安全测试
taskflow security test

# 查看安全日志
taskflow security logs

# 查看统计信息
taskflow security stats
```

---

## 快速示例

### 示例 1: 读取文件

在 Claude Desktop 中：

```
用户：帮我读取 README.md 的内容

Claude: （自动调用 fs_read 工具）

# README.md
TaskFlow AI - 精品 MCP Server
...
```

### 示例 2: 发送 HTTP 请求

在 Cursor 中：

```
用户：帮我获取 GitHub API 的仓库信息

Cursor: （自动调用 http_get 工具）

GET https://api.github.com/repos/Agions/taskflow-ai

返回：
{
  "id": ...,
  "name": "taskflow-ai",
  "full_name": "Agions/taskflow-ai",
  ...
}
```

### 示例 3: 执行 Git 命令

在 Windsurf 中：

```
用户：帮我查看 Git 状态

Windsurf: （自动调用 git_status 工具）

返回：
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  modified:   README.md
  ...
```

---

## 故障排除

### 问题 1: MCP Server 未启动

**解决方案**:

```bash
# 检查 Node.js 版本
node --version

# 重新安装
npm install -g taskflow-ai

# 手动启动
taskflow mcp start

# 查看日志
taskflow mcp logs
```

### 问题 2: 工具执行失败

**解决方案**:

```bash
# 检查工具是否启用
taskflow tools list

# 查看错误日志
taskflow mcp logs --level error
```

### 问题 3: 配置不生效

**解决方案**:

```bash
# 验证配置
taskflow doctor

# 重新初始化
taskflow init --force

# 重启编辑器
```

### 问题 4: 权限问题

**解决方案**:

```bash
# 添加执行权限
chmod +x /usr/local/bin/taskflow

# 使用 sudo 安装
sudo npm install -g taskflow-ai
```

---

## 下一步

- [MCP 使用指南](./mcp/index.md) - 详细了解 MCP 工具
- [安全防护](./security.md) - 安全最佳实践
- [架构设计](./architecture.md) - 系统架构
- [API 参考](./api/README.md) - API 文档

---

## 需要帮助？

- 📖 [在线文档](https://agions.github.io/taskflow-ai/)
- 🐛 [问题反馈](https://github.com/Agions/taskflow-ai/issues)
- 💬 [讨论区](https://github.com/Agions/taskflow-ai/discussions)
- 📧 [邮件支持](mailto:1051736049@qq.com)
