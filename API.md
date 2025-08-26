# TaskFlow AI API 文档

## 概述

TaskFlow AI 提供了丰富的API接口，包括CLI命令行接口和MCP服务器接口。本文档详细描述了所有可用的API和配置选项。

## CLI API

### 全局选项

所有CLI命令都支持以下全局选项：

| 选项 | 简写 | 描述 | 默认值 |
|------|------|------|--------|
| `--help` | `-h` | 显示帮助信息 | - |
| `--version` | `-V` | 显示版本信息 | - |
| `--verbose` | `-v` | 详细输出模式 | false |
| `--config <path>` | `-c` | 指定配置文件路径 | `.taskflow/config.json` |

### 命令详细说明

#### `taskflow init`

初始化TaskFlow项目配置。

**语法:**
```bash
taskflow init [options]
```

**选项:**

| 选项 | 简写 | 类型 | 描述 | 默认值 |
|------|------|------|------|--------|
| `--force` | `-f` | boolean | 强制覆盖现有配置 | false |
| `--skip-ai` | | boolean | 跳过AI模型配置 | false |
| `--template <name>` | `-t` | string | 使用预定义模板 | 'default' |
| `--project-name <name>` | `-n` | string | 设置项目名称 | 当前目录名 |

**模板选项:**
- `default` - 默认配置
- `agile` - 敏捷开发配置
- `waterfall` - 瀑布模型配置
- `lean` - 精益开发配置

**示例:**
```bash
# 基本初始化
taskflow init

# 强制覆盖现有配置
taskflow init --force

# 使用敏捷模板
taskflow init --template agile --project-name "My Project"

# 跳过AI配置
taskflow init --skip-ai
```

**交互式提示:**
1. 项目名称输入
2. AI模型选择（除非使用--skip-ai）
3. MCP配置选择
4. 其他项目设置

#### `taskflow parse <file>`

解析PRD文档并生成任务。

**语法:**
```bash
taskflow parse <file> [options]
```

**参数:**

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `<file>` | string | 是 | PRD文档路径 |

**选项:**

| 选项 | 简写 | 类型 | 描述 | 默认值 |
|------|------|------|------|--------|
| `--output <path>` | `-o` | string | 输出目录 | `./output` |
| `--format <format>` | `-f` | string | 输出格式 | `json` |
| `--no-tasks` | | boolean | 只解析文档，不生成任务 | false |
| `--interactive` | `-i` | boolean | 交互式模式 | false |
| `--model <model>` | `-m` | string | 指定AI模型 | 配置的默认模型 |

**支持的格式:**
- `json` - JSON格式输出
- `markdown` - Markdown格式输出
- `yaml` - YAML格式输出

**示例:**
```bash
# 基本解析
taskflow parse requirements.md

# 指定输出格式和目录
taskflow parse prd.md --format markdown --output ./docs

# 交互式模式
taskflow parse prd.md --interactive

# 只解析文档结构
taskflow parse prd.md --no-tasks
```

**输出结构:**
```json
{
  "document": {
    "title": "项目名称",
    "version": "1.0.0",
    "sections": [...],
    "metadata": {...}
  },
  "tasks": [...],
  "statistics": {
    "totalTasks": 29,
    "estimatedHours": 350,
    "complexity": "medium"
  }
}
```

#### `taskflow status`

查看项目状态和统计信息。

**语法:**
```bash
taskflow status [options]
```

**选项:**

| 选项 | 简写 | 类型 | 描述 | 默认值 |
|------|------|------|------|--------|
| `--json` | | boolean | JSON格式输出 | false |
| `--detailed` | `-d` | boolean | 显示详细信息 | false |
| `--tasks` | `-t` | boolean | 显示任务列表 | false |
| `--stats` | `-s` | boolean | 显示统计信息 | false |

**示例:**
```bash
# 基本状态显示
taskflow status

# 详细信息
taskflow status --detailed

# JSON格式输出
taskflow status --json

# 显示任务和统计
taskflow status --tasks --stats
```

#### `taskflow visualize`

生成项目可视化报告。

**语法:**
```bash
taskflow visualize [options]
```

**选项:**

| 选项 | 简写 | 类型 | 描述 | 默认值 |
|------|------|------|------|--------|
| `--type <type>` | `-t` | string | 图表类型 | `gantt` |
| `--output <path>` | `-o` | string | 输出路径 | `./reports` |
| `--format <format>` | `-f` | string | 输出格式 | `html` |
| `--theme <theme>` | | string | 图表主题 | `default` |
| `--interactive` | `-i` | boolean | 交互式配置 | false |
| `--open` | | boolean | 生成后自动打开 | false |

**图表类型:**
- `gantt` - 甘特图
- `pie` - 饼图
- `bar` - 柱状图
- `timeline` - 时间线
- `kanban` - 看板视图

**输出格式:**
- `html` - HTML交互式报告
- `svg` - SVG矢量图
- `png` - PNG图片
- `pdf` - PDF文档

**主题选项:**
- `default` - 默认主题
- `dark` - 深色主题
- `light` - 浅色主题
- `colorful` - 多彩主题

**示例:**
```bash
# 生成甘特图
taskflow visualize --type gantt

# 生成深色主题的HTML报告
taskflow visualize --theme dark --format html --open

# 交互式配置
taskflow visualize --interactive
```

#### `taskflow mcp`

MCP服务器管理命令。

**语法:**
```bash
taskflow mcp <command> [options]
```

**子命令:**

##### `taskflow mcp start`

启动MCP服务器。

**选项:**

| 选项 | 简写 | 类型 | 描述 | 默认值 |
|------|------|------|------|--------|
| `--port <port>` | `-p` | number | 服务器端口 | 3000 |
| `--host <host>` | `-h` | string | 服务器主机 | localhost |
| `--verbose` | `-v` | boolean | 详细日志 | false |
| `--daemon` | `-d` | boolean | 后台运行 | false |

**示例:**
```bash
# 启动服务器
taskflow mcp start

# 指定端口和主机
taskflow mcp start --port 8080 --host 0.0.0.0

# 后台运行
taskflow mcp start --daemon
```

##### `taskflow mcp stop`

停止MCP服务器。

**示例:**
```bash
taskflow mcp stop
```

##### `taskflow mcp status`

查看MCP服务器状态。

**示例:**
```bash
taskflow mcp status
```

##### `taskflow mcp tools`

管理MCP工具。

**选项:**

| 选项 | 简写 | 类型 | 描述 | 默认值 |
|------|------|------|------|--------|
| `--list` | `-l` | boolean | 列出所有工具 | false |
| `--register <tool>` | `-r` | string | 注册新工具 | - |
| `--unregister <tool>` | `-u` | string | 注销工具 | - |

**示例:**
```bash
# 列出所有工具
taskflow mcp tools --list

# 注册新工具
taskflow mcp tools --register my-tool
```

#### `taskflow config`

配置管理命令。

**语法:**
```bash
taskflow config <command> [options]
```

**子命令:**

##### `taskflow config get <key>`

获取配置值。

**示例:**
```bash
taskflow config get aiModels.0.provider
```

##### `taskflow config set <key> <value>`

设置配置值。

**示例:**
```bash
taskflow config set projectName "New Project Name"
```

##### `taskflow config list`

列出所有配置。

**示例:**
```bash
taskflow config list
```

## MCP API

### 服务器端点

MCP服务器提供以下HTTP端点：

#### 基础端点

| 端点 | 方法 | 描述 | 认证 |
|------|------|------|------|
| `/health` | GET | 健康检查 | 否 |
| `/version` | GET | 版本信息 | 否 |
| `/status` | GET | 服务器状态 | 否 |

#### 工具端点

| 端点 | 方法 | 描述 | 认证 |
|------|------|------|------|
| `/tools` | GET | 获取所有工具 | 是 |
| `/tools/:name` | GET | 获取特定工具 | 是 |
| `/tools/:name/call` | POST | 调用工具 | 是 |

#### 资源端点

| 端点 | 方法 | 描述 | 认证 |
|------|------|------|------|
| `/resources` | GET | 获取所有资源 | 是 |
| `/resources/tasks` | GET | 获取任务列表 | 是 |
| `/resources/projects` | GET | 获取项目信息 | 是 |
| `/resources/config` | GET | 获取配置信息 | 是 |

### 工具API

#### file_read

读取文件内容。

**参数:**
```json
{
  "path": "string",
  "encoding": "utf8|base64"
}
```

**返回:**
```json
{
  "content": "string",
  "size": "number",
  "mtime": "string"
}
```

#### file_write

写入文件内容。

**参数:**
```json
{
  "path": "string",
  "content": "string",
  "encoding": "utf8|base64"
}
```

**返回:**
```json
{
  "success": "boolean",
  "size": "number"
}
```

#### shell_exec

执行Shell命令。

**参数:**
```json
{
  "command": "string",
  "cwd": "string",
  "timeout": "number"
}
```

**返回:**
```json
{
  "stdout": "string",
  "stderr": "string",
  "exitCode": "number"
}
```

#### project_analyze

分析项目结构。

**参数:**
```json
{
  "path": "string",
  "includeHidden": "boolean"
}
```

**返回:**
```json
{
  "files": "number",
  "directories": "number",
  "size": "number",
  "structure": "object"
}
```

#### task_create

创建新任务。

**参数:**
```json
{
  "title": "string",
  "description": "string",
  "type": "string",
  "priority": "string",
  "estimatedHours": "number"
}
```

**返回:**
```json
{
  "id": "string",
  "created": "boolean",
  "task": "object"
}
```

## 配置API

### 配置文件结构

配置文件位于 `.taskflow/config.json`：

```json
{
  "projectName": "string",
  "version": "string",
  "aiModels": [
    {
      "provider": "string",
      "modelName": "string",
      "apiKey": "string",
      "baseUrl": "string",
      "enabled": "boolean",
      "priority": "number",
      "maxTokens": "number",
      "temperature": "number"
    }
  ],
  "mcpSettings": {
    "enabled": "boolean",
    "port": "number",
    "host": "string",
    "security": {
      "authRequired": "boolean",
      "apiKey": "string",
      "rateLimit": {
        "enabled": "boolean",
        "maxRequests": "number",
        "windowMs": "number"
      }
    }
  },
  "outputSettings": {
    "defaultFormat": "string",
    "defaultOutput": "string",
    "autoOpen": "boolean"
  },
  "visualizationSettings": {
    "defaultTheme": "string",
    "defaultType": "string",
    "interactive": "boolean"
  }
}
```

### 环境变量

TaskFlow AI 支持以下环境变量：

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `TASKFLOW_CONFIG_PATH` | 配置文件路径 | `.taskflow/config.json` |
| `TASKFLOW_LOG_LEVEL` | 日志级别 | `info` |
| `TASKFLOW_MCP_PORT` | MCP服务器端口 | `3000` |
| `TASKFLOW_MCP_HOST` | MCP服务器主机 | `localhost` |
| `TASKFLOW_API_KEY` | API密钥 | - |

## 错误处理

### 错误码

| 错误码 | 描述 | 解决方案 |
|--------|------|----------|
| `CONFIG_NOT_FOUND` | 配置文件不存在 | 运行 `taskflow init` |
| `INVALID_CONFIG` | 配置文件格式错误 | 检查配置文件语法 |
| `AI_MODEL_ERROR` | AI模型调用失败 | 检查API密钥和网络 |
| `FILE_NOT_FOUND` | 文件不存在 | 检查文件路径 |
| `PERMISSION_DENIED` | 权限不足 | 检查文件权限 |
| `MCP_SERVER_ERROR` | MCP服务器错误 | 检查服务器状态 |

### 错误响应格式

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "object"
  }
}
```

## 性能优化

### 最佳实践

1. **配置优化**
   - 使用本地AI模型减少网络延迟
   - 合理设置并发限制
   - 启用缓存机制

2. **内存管理**
   - 大文件分块处理
   - 及时释放资源
   - 使用流式处理

3. **网络优化**
   - 使用连接池
   - 启用压缩
   - 设置合理的超时时间

### 监控指标

- **响应时间** - API调用响应时间
- **吞吐量** - 每秒处理请求数
- **错误率** - 错误请求占比
- **内存使用** - 内存占用情况
- **CPU使用** - CPU占用情况

## 安全考虑

### 认证和授权

- API密钥认证
- 基于角色的访问控制
- 请求签名验证

### 数据保护

- 敏感信息加密
- 安全的密钥存储
- 数据传输加密

### 安全最佳实践

- 定期更新密钥
- 启用日志记录
- 监控异常访问
- 使用HTTPS传输

---

## 版本兼容性

本API文档适用于TaskFlow AI v2.0.0及以上版本。

如有问题或建议，请访问 [GitHub Issues](https://github.com/Agions/taskflow-ai/issues)。