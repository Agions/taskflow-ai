# CLI 参考手册

## 概述

TaskFlow AI 命令行界面完整参考手册，包含所有命令、选项、参数的详细说明。

## 📋 命令索引

### 核心命令
- [`taskflow init`](#taskflow-init) - 项目集成初始化
- [`taskflow parse`](#taskflow-parse) - PRD文档解析
- [`taskflow status`](#taskflow-status) - 任务状态管理

### 配置命令
- [`taskflow config`](#taskflow-config) - 配置管理
- [`taskflow models`](#taskflow-models) - AI模型管理

### 工具命令
- [`taskflow cache`](#taskflow-cache) - 缓存管理
- [`taskflow logs`](#taskflow-logs) - 日志管理
- [`taskflow doctor`](#taskflow-doctor) - 系统诊断

## 🚀 taskflow init

在现有项目中初始化TaskFlow AI配置。

### 语法
```bash
taskflow init [选项]
```

### 选项
| 选项 | 简写 | 类型 | 默认值 | 描述 |
|------|------|------|--------|------|
| `--force` | `-f` | boolean | false | 强制覆盖现有配置 |
| `--verbose` | `-v` | boolean | false | 显示详细输出 |
| `--config-dir` | | string | .taskflow | 配置目录名称 |
| `--help` | `-h` | boolean | false | 显示帮助信息 |

### 示例
```bash
# 基本初始化
taskflow init

# 强制重新初始化
taskflow init --force

# 详细输出
taskflow init --verbose

# 自定义配置目录
taskflow init --config-dir .tf-config
```

### 退出代码
- `0` - 成功
- `1` - 一般错误
- `2` - 配置目录已存在（未使用 --force）
- `3` - 权限错误

## 📄 taskflow parse

解析PRD文档并生成任务。

### 语法
```bash
taskflow parse <文件路径> [选项]
```

### 参数
- `<文件路径>` - PRD文档文件路径（必需）

### 选项
| 选项 | 简写 | 类型 | 默认值 | 描述 |
|------|------|------|--------|------|
| `--model` | `-m` | string | auto | 指定AI模型 |
| `--multi-model` | | boolean | false | 启用多模型协同 |
| `--output` | `-o` | string | console | 输出格式 |
| `--save` | `-s` | boolean | true | 保存解析结果 |
| `--extract-sections` | | boolean | true | 提取文档章节 |
| `--extract-features` | | boolean | true | 提取功能特性 |
| `--prioritize` | | boolean | true | 智能优先级排序 |
| `--verbose` | `-v` | boolean | false | 详细输出 |
| `--help` | `-h` | boolean | false | 显示帮助信息 |

### 支持的模型
- `auto` - 自动选择最优模型
- `deepseek` - DeepSeek模型
- `zhipu` - 智谱AI模型
- `qwen` - 通义千问模型
- `baidu` - 文心一言模型

### 输出格式
- `console` - 控制台表格输出
- `json` - JSON格式
- `csv` - CSV格式
- `markdown` - Markdown格式

### 示例
```bash
# 基本解析
taskflow parse docs/requirements.md

# 指定模型
taskflow parse docs/requirements.md --model deepseek

# 多模型协同
taskflow parse docs/requirements.md --multi-model

# JSON输出
taskflow parse docs/requirements.md --output json

# 完整选项
taskflow parse docs/requirements.md \
  --model deepseek \
  --extract-sections \
  --extract-features \
  --prioritize \
  --verbose
```

## 📊 taskflow status

任务状态管理命令。

### 子命令

#### taskflow status list
显示任务列表。

```bash
taskflow status list [选项]
```

**选项**:
| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `--filter` | string | | 过滤条件 |
| `--sort` | string | created_at | 排序字段 |
| `--format` | string | table | 输出格式 |
| `--limit` | number | 50 | 显示数量限制 |

**过滤条件**:
- `status=<状态>` - 按状态过滤
- `priority=<优先级>` - 按优先级过滤
- `assignee=<分配人>` - 按分配人过滤
- `tag=<标签>` - 按标签过滤

**示例**:
```bash
# 显示所有任务
taskflow status list

# 显示进行中的任务
taskflow status list --filter status=in_progress

# 显示高优先级任务
taskflow status list --filter priority=high

# 按优先级排序
taskflow status list --sort priority

# JSON格式输出
taskflow status list --format json
```

#### taskflow status update
更新任务状态。

```bash
taskflow status update <任务ID> <新状态> [选项]
```

**参数**:
- `<任务ID>` - 任务标识符
- `<新状态>` - 新的任务状态

**状态值**:
- `not_started` - 未开始
- `in_progress` - 进行中
- `completed` - 已完成
- `blocked` - 阻塞
- `cancelled` - 已取消

**选项**:
| 选项 | 类型 | 描述 |
|------|------|------|
| `--comment` | string | 添加备注 |
| `--assignee` | string | 分配给指定人员 |
| `--batch` | boolean | 批量更新模式 |

**示例**:
```bash
# 更新任务状态
taskflow status update task-001 in_progress

# 添加备注
taskflow status update task-001 completed --comment "功能实现完成"

# 分配任务
taskflow status update task-002 in_progress --assignee "张三"

# 批量更新
taskflow status update --batch task-001,task-002 in_progress
```

#### taskflow status progress
查看项目进度。

```bash
taskflow status progress [选项]
```

**选项**:
| 选项 | 类型 | 描述 |
|------|------|------|
| `--detailed` | boolean | 详细进度报告 |
| `--chart` | boolean | 生成进度图表 |
| `--export` | string | 导出报告文件 |

**示例**:
```bash
# 基本进度
taskflow status progress

# 详细报告
taskflow status progress --detailed

# 导出PDF
taskflow status progress --export progress.pdf
```

#### taskflow status next
获取下一个推荐任务。

```bash
taskflow status next [选项]
```

**选项**:
| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `--count` | number | 1 | 获取任务数量 |
| `--priority` | string | | 指定优先级 |
| `--assignee` | string | | 指定分配人员 |

**示例**:
```bash
# 获取下一个任务
taskflow status next

# 获取3个高优先级任务
taskflow status next --count 3 --priority high
```

## ⚙️ taskflow config

配置管理命令。

### 子命令

#### taskflow config list
显示配置列表。

```bash
taskflow config list [选项]
```

#### taskflow config get
获取配置值。

```bash
taskflow config get <配置键>
```

#### taskflow config set
设置配置值。

```bash
taskflow config set <配置键> <配置值>
```

#### taskflow config validate
验证配置。

```bash
taskflow config validate [选项]
```

### 示例
```bash
# 查看所有配置
taskflow config list

# 获取API密钥
taskflow config get models.deepseek.apiKey

# 设置API密钥
taskflow config set models.deepseek.apiKey "your-api-key"

# 验证配置
taskflow config validate
```

## 🤖 taskflow models

AI模型管理命令。

### 子命令

#### taskflow models test
测试模型连接。

```bash
taskflow models test [模型名称] [选项]
```

#### taskflow models status
查看模型状态。

```bash
taskflow models status [选项]
```

#### taskflow models stats
查看使用统计。

```bash
taskflow models stats [选项]
```

### 示例
```bash
# 测试所有模型
taskflow models test

# 测试特定模型
taskflow models test deepseek

# 查看模型状态
taskflow models status

# 查看使用统计
taskflow models stats
```

## 💾 taskflow cache

缓存管理命令。

### 子命令
```bash
# 查看缓存状态
taskflow cache status

# 清理缓存
taskflow cache clear

# 清理过期缓存
taskflow cache clean

# 预热缓存
taskflow cache warm
```

## 📝 taskflow logs

日志管理命令。

### 选项
| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `--tail` | number | 20 | 显示最后N行 |
| `--level` | string | all | 日志级别 |
| `--follow` | boolean | false | 实时监控 |
| `--clean` | boolean | false | 清理日志 |

### 示例
```bash
# 查看最新日志
taskflow logs

# 查看最后50行
taskflow logs --tail 50

# 只看错误日志
taskflow logs --level error

# 实时监控
taskflow logs --follow
```

## 🌐 taskflow mcp

MCP (Model Context Protocol) 配置管理命令。

> **重要**: TaskFlow AI 遵循标准 MCP 协议，服务由编辑器自动启动和管理，无需手动启动服务。

### 子命令

#### taskflow mcp validate
验证MCP配置文件。

```bash
taskflow mcp validate [选项]
```

**选项**:
| 选项 | 类型 | 描述 |
|------|------|------|
| `--editor` | string | 指定编辑器 (windsurf/trae/cursor/vscode) |
| `--all` | boolean | 验证所有编辑器配置 |

#### taskflow mcp test
测试MCP配置有效性。

```bash
taskflow mcp test [选项]
```

**选项**:
| 选项 | 类型 | 描述 |
|------|------|------|
| `--editor` | string | 指定编辑器 |
| `--all-editors` | boolean | 测试所有编辑器配置 |
| `--all-models` | boolean | 测试所有AI模型连接 |

#### taskflow mcp regenerate
重新生成MCP配置文件。

```bash
taskflow mcp regenerate [选项]
```

**选项**:
| 选项 | 类型 | 描述 |
|------|------|------|
| `--editor` | string | 指定编辑器 |
| `--force` | boolean | 覆盖现有配置 |

### 示例
```bash
# 验证所有MCP配置
taskflow mcp validate

# 验证Cursor配置
taskflow mcp validate --editor cursor

# 测试配置有效性
taskflow mcp test --editor cursor

# 测试所有AI模型连接
taskflow mcp test --all-models

# 重新生成配置
taskflow mcp regenerate --editor cursor --force
```

### 配置文件位置

| 编辑器 | 配置文件路径 |
|--------|--------------|
| Cursor | `.cursor/mcp.json` |
| Windsurf | `.windsurf/mcp.json` |
| Trae | `.trae/mcp-config.json` |
| VSCode | `.vscode/settings.json` |

## 🔍 taskflow doctor

系统诊断命令。

### 子命令
```bash
# 完整系统检查
taskflow doctor

# 配置验证
taskflow doctor config

# 依赖检查
taskflow doctor dependencies

# 性能基准测试
taskflow doctor benchmark
```

## 🌐 全局选项

所有命令都支持以下全局选项：

| 选项 | 简写 | 描述 |
|------|------|------|
| `--help` | `-h` | 显示帮助信息 |
| `--version` | `-V` | 显示版本信息 |
| `--config` | `-c` | 指定配置文件路径 |
| `--verbose` | `-v` | 详细输出模式 |
| `--quiet` | `-q` | 静默模式 |
| `--no-color` | | 禁用彩色输出 |

## 📊 退出代码

| 代码 | 含义 |
|------|------|
| 0 | 成功 |
| 1 | 一般错误 |
| 2 | 配置错误 |
| 3 | 权限错误 |
| 4 | 网络错误 |
| 5 | 文件不存在 |
| 6 | 解析错误 |

## 🔧 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `TASKFLOW_CONFIG_DIR` | 配置目录路径 | .taskflow |
| `TASKFLOW_LOG_LEVEL` | 日志级别 | info |
| `TASKFLOW_CACHE_SIZE` | 缓存大小 | 100 |
| `TASKFLOW_TIMEOUT` | 请求超时时间 | 30000 |

## 📚 相关文档

- [用户指南](../user-guide/) - 详细使用指南
- [配置参考](./configuration.md) - 配置选项说明
- [环境变量](./environment.md) - 环境变量说明
