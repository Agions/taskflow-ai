# TaskFlow AI CLI 命令参考

## 概述

TaskFlow AI 提供了强大的命令行界面，专注于PRD解析、任务管理和AI编辑器集成。本文档详细介绍所有可用命令及其使用方法。

## 🚀 快速开始

```bash
# 在现有项目中初始化
taskflow init

# 解析PRD文档
taskflow parse docs/requirements.md

# 查看任务状态
taskflow status list

# 获取下一个任务
taskflow status next
```

## 📋 命令列表

### 核心命令

| 命令                | 描述                          | 示例                    |
| ------------------- | ----------------------------- | ----------------------- |
| [`init`](#init)     | 在现有项目中初始化TaskFlow AI | `taskflow init`         |
| [`parse`](#parse)   | 解析PRD文档并生成任务计划     | `taskflow parse prd.md` |
| [`status`](#status) | 任务状态管理                  | `taskflow status list`  |

### 配置命令

| 命令                | 描述        | 示例                            |
| ------------------- | ----------- | ------------------------------- |
| [`config`](#config) | 配置管理    | `taskflow config set key value` |
| [`models`](#models) | AI模型管理  | `taskflow models test`          |
| [`mcp`](#mcp)       | MCP配置管理 | `taskflow mcp info`             |

### 工具命令

| 命令                          | 描述           | 示例                       |
| ----------------------------- | -------------- | -------------------------- |
| [`visualize`](#visualize)     | 生成可视化图表 | `taskflow visualize gantt` |
| [`interactive`](#interactive) | 交互式模式     | `taskflow interactive`     |

## 📖 详细命令说明

### init

在现有项目中初始化TaskFlow AI配置和MCP集成。

**语法**:

```bash
taskflow init [选项]
```

**选项**:

- `--force, -f` - 强制覆盖现有配置
- `--verbose, -v` - 显示详细输出
- `--editor <editor>` - 指定编辑器类型 (windsurf, trae, cursor, vscode)

**示例**:

```bash
# 基本初始化
taskflow init

# 强制重新初始化
taskflow init --force

# 为特定编辑器初始化
taskflow init --editor cursor
```

**生成的文件**:

- `.taskflow/config.json` - 主配置文件
- `.cursor/mcp.json` - Cursor MCP配置
- `.cursor-rules` - Cursor AI规则
- `.env.example` - 环境变量模板

### parse

解析PRD文档并生成结构化的任务计划。

**语法**:

```bash
taskflow parse <文件路径> [选项]
```

**选项**:

- `--model, -m <model>` - 指定AI模型 (deepseek, zhipu, qwen, baidu, moonshot, spark)
- `--output, -o <path>` - 输出文件路径
- `--format <format>` - 输出格式 (json, yaml, markdown)
- `--verbose, -v` - 显示详细解析过程

**支持的文件格式**:

- Markdown (`.md`, `.markdown`)
- 纯文本 (`.txt`)
- Word文档 (`.docx`)

**示例**:

```bash
# 基本解析
taskflow parse docs/requirements.md

# 指定模型和输出
taskflow parse prd.md --model deepseek --output tasks.json

# 详细模式
taskflow parse prd.md --verbose
```

### status

任务状态管理和项目进度跟踪。

**子命令**:

#### status list

查看任务列表。

```bash
taskflow status list [选项]
```

**选项**:

- `--input, -i <path>` - 任务文件路径
- `--filter <filter>` - 过滤条件
- `--format <format>` - 输出格式

#### status update

更新任务状态。

```bash
taskflow status update <taskId> <status> [选项]
```

**状态值**:

- `not_started` - 未开始
- `in_progress` - 进行中
- `completed` - 已完成
- `blocked` - 阻塞
- `cancelled` - 已取消

#### status progress

显示项目进度统计。

```bash
taskflow status progress [选项]
```

#### status next

获取推荐的下一个任务。

```bash
taskflow status next [选项]
```

**示例**:

```bash
# 查看所有任务
taskflow status list

# 更新任务状态
taskflow status update task-001 in_progress

# 查看进度
taskflow status progress

# 获取下一个任务
taskflow status next
```

### config

配置管理命令。

**子命令**:

- `list` - 查看所有配置
- `get <key>` - 获取配置值
- `set <key> <value>` - 设置配置值
- `reset` - 重置配置

**示例**:

```bash
# 查看配置
taskflow config list

# 设置API密钥
taskflow config set models.deepseek.apiKey "your-key"

# 获取配置值
taskflow config get models.default
```

### models

AI模型管理和测试。

**子命令**:

- `test [model]` - 测试模型连接
- `status` - 查看模型状态
- `benchmark` - 性能基准测试

**示例**:

```bash
# 测试所有模型
taskflow models test

# 测试特定模型
taskflow models test deepseek

# 查看模型状态
taskflow models status
```

### mcp

MCP (Model Context Protocol) 配置管理。

**子命令**:

- `info` - 显示MCP服务信息
- `validate` - 验证MCP配置
- `test` - 测试MCP配置
- `regenerate` - 重新生成MCP配置

**示例**:

```bash
# 查看MCP信息
taskflow mcp info

# 验证配置
taskflow mcp validate

# 重新生成配置
taskflow mcp regenerate
```

### visualize

生成任务计划可视化图表。

**子命令**:

- `gantt` - 甘特图
- `timeline` - 时间线图
- `dependency` - 依赖关系图

**选项**:

- `--input, -i <path>` - 任务文件路径
- `--output, -o <path>` - 输出文件路径
- `--format <format>` - 输出格式 (svg, png, html)

**示例**:

```bash
# 生成甘特图
taskflow visualize gantt -i tasks.json

# 生成依赖关系图
taskflow visualize dependency -i tasks.json -o deps.svg
```

### interactive

启动交互式模式，提供友好的用户界面。

```bash
taskflow interactive
```

## 🔧 全局选项

所有命令都支持以下全局选项：

| 选项         | 简写 | 描述         |
| ------------ | ---- | ------------ |
| `--help`     | `-h` | 显示帮助信息 |
| `--version`  | `-V` | 显示版本信息 |
| `--verbose`  | `-v` | 详细输出模式 |
| `--quiet`    | `-q` | 静默模式     |
| `--no-color` |      | 禁用彩色输出 |

## 📊 输出格式

### 表格格式 (默认)

```
┌─────────────┬──────────────────────────┬──────────┐
│ ID          │ 任务名称                 │ 状态     │
├─────────────┼──────────────────────────┼──────────┤
│ task-001    │ 实现用户登录功能         │ 进行中   │
└─────────────┴──────────────────────────┴──────────┘
```

### JSON格式

```json
{
  "tasks": [
    {
      "id": "task-001",
      "name": "实现用户登录功能",
      "status": "in_progress"
    }
  ]
}
```

## 🔄 典型工作流

```bash
# 1. 项目初始化
cd your-existing-project
taskflow init

# 2. 配置AI模型
taskflow config set models.deepseek.apiKey "your-key"

# 3. 解析PRD文档
taskflow parse docs/requirements.md

# 4. 查看生成的任务
taskflow status list

# 5. 开始工作
taskflow status next
taskflow status update task-001 in_progress

# 6. 查看进度
taskflow status progress

# 7. 生成可视化报告
taskflow visualize gantt
```

## 🆘 获取帮助

```bash
# 查看总体帮助
taskflow --help

# 查看特定命令帮助
taskflow parse --help
taskflow status --help

# 查看子命令帮助
taskflow status update --help
```

## 📚 相关文档

- [快速开始](../getting-started.md)
- [配置参考](../reference/configuration.md)
- [API文档](../api/)
- [故障排除](../troubleshooting/)
