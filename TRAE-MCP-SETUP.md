# Trae 编辑器 MCP 配置指南

## 问题描述
Issue #1: 在 Trae 中接入 MCP 时提示无法连接

## 解决方案

### 1. 确保 MCP 服务器已启动

```bash
# 在项目目录中
cd taskflow-ai

# 构建项目
npm run build

# 启动 MCP 服务器
taskflow mcp start
# 或
npm run mcp
```

服务器启动后会显示：
```
✅ MCP服务器启动成功！
🚀 MCP服务器信息:
  服务器地址: http://localhost:3000
  服务器名称: taskflow-ai
  版本: 1.0.0
```

### 2. Trae 编辑器配置

#### 方法一：通过 Trae 设置界面配置

1. 打开 Trae 编辑器
2. 进入设置（Settings）
3. 搜索 "MCP" 或 "Model Context Protocol"
4. 添加新的 MCP 服务器：

```json
{
  "mcpServers": {
    "taskflow-ai": {
      "url": "http://localhost:3000",
      "name": "TaskFlow AI",
      "description": "智能PRD文档解析与任务管理"
    }
  }
}
```

#### 方法二：直接编辑配置文件

在 Trae 的配置文件中添加（路径因系统而异）：

**macOS:**
```bash
~/Library/Application Support/Trae/mcp.json
```

**Windows:**
```bash
%APPDATA%\Trae\mcp.json
```

**Linux:**
```bash
~/.config/Trae/mcp.json
```

配置内容：
```json
{
  "mcpServers": {
    "taskflow-ai": {
      "url": "http://localhost:3000/mcp",
      "name": "TaskFlow AI",
      "description": "智能PRD文档解析与任务管理助手",
      "enabled": true
    }
  }
}
```

### 3. 验证连接

#### 测试 MCP 端点

```bash
# 测试健康检查
curl http://localhost:3000/health

# 测试 MCP 协议端点
curl http://localhost:3000/mcp

# 测试工具列表
curl http://localhost:3000/mcp/tools
```

#### 在 Trae 中测试

1. 打开一个新的对话
2. 尝试使用 TaskFlow AI 的功能：
   - "帮我分析这个项目"
   - "创建一个任务"
   - "读取文件内容"

### 4. 常见问题排查

#### 问题 1: 连接被拒绝

**症状**: `Connection refused` 或 `ECONNREFUSED`

**解决方案**:
```bash
# 检查 MCP 服务器是否运行
ps aux | grep taskflow

# 如果未运行，重新启动
taskflow mcp start

# 或使用指定端口
taskflow mcp start --port 3000
```

#### 问题 2: CORS 错误

**症状**: `CORS policy` 错误

**解决方案**:
确保使用的是最新版本的 TaskFlow AI（v2.0.1+），已添加 CORS 支持。

#### 问题 3: 端口被占用

**症状**: `EADDRINUSE` 错误

**解决方案**:
```bash
# 查找占用 3000 端口的进程
lsof -i :3000

# 杀死占用端口的进程
kill -9 <PID>

# 或使用其他端口启动
taskflow mcp start --port 3001
```

#### 问题 4: Trae 无法识别 MCP 服务器

**解决方案**:
1. 重启 Trae 编辑器
2. 检查 MCP 配置格式是否正确
3. 确保 URL 格式正确：`http://localhost:3000/mcp`

### 5. 高级配置

#### 自定义端口和主机

```bash
# 使用自定义端口
taskflow mcp start --port 8080 --host 0.0.0.0
```

对应的 Trae 配置：
```json
{
  "mcpServers": {
    "taskflow-ai": {
      "url": "http://localhost:8080/mcp",
      "name": "TaskFlow AI",
      "description": "智能PRD文档解析与任务管理助手"
    }
  }
}
```

#### 远程访问配置

如果需要在其他机器上访问 MCP 服务器：

```bash
# 绑定到所有网络接口
taskflow mcp start --host 0.0.0.0 --port 3000
```

**注意**: 远程访问时请确保网络安全，建议添加身份验证。

### 6. 可用工具列表

MCP 服务器提供以下工具：

| 工具名称 | 描述 | 参数 |
|---------|------|------|
| `file_read` | 读取文件内容 | `path`: 文件路径 |
| `file_write` | 写入文件内容 | `path`: 文件路径, `content`: 内容 |
| `project_analyze` | 分析项目结构 | `path`: 项目路径 |
| `task_create` | 创建新任务 | `title`: 标题, `description`: 描述, `priority`: 优先级 |

### 7. 调试模式

启动 MCP 服务器时添加 `--verbose` 参数查看详细日志：

```bash
taskflow mcp start --verbose
```

### 8. 获取帮助

如果问题仍然存在：

1. 查看 GitHub Issues: https://github.com/Agions/taskflow-ai/issues
2. 提交新的 Issue，包含：
   - 操作系统版本
   - Node.js 版本 (`node --version`)
   - TaskFlow AI 版本
   - 错误截图或日志

---

**修复版本**: v2.0.1
**修复内容**: 添加 CORS 支持，完善 MCP 协议实现
