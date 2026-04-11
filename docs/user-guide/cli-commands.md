# CLI命令详解

## 概述

TaskFlow AI 提供了完整的命令行界面，专注于PRD解析和任务管理功能。本文档详细介绍每个命令的使用方法、选项和实际示例。

## 📋 命令分类

### 核心命令

- [`init`](#init) - 在现有项目中初始化TaskFlow AI
- [`parse`](#parse) - 解析PRD文档
- [`status`](#status) - 任务状态管理

### 配置命令

- [`config`](#config) - 配置管理
- [`models`](#models) - AI模型管理

### 工具命令

- [`cache`](#cache) - 缓存管理
- [`logs`](#logs) - 日志查看
- [`doctor`](#doctor) - 系统诊断

## 🚀 init - 项目集成

在现有项目中初始化TaskFlow AI配置。

### 语法

```bash
taskflow init [选项]
```

### 选项

| 选项           | 简写 | 类型    | 默认值      | 描述             |
| -------------- | ---- | ------- | ----------- | ---------------- |
| `--force`      | `-f` | boolean | `false`     | 强制覆盖现有配置 |
| `--verbose`    | `-v` | boolean | `false`     | 显示详细输出     |
| `--config-dir` |      | string  | `.taskflow` | 配置目录名称     |

### 示例

```bash
# 基本初始化
cd your-existing-project
taskflow init

# 强制重新初始化
taskflow init --force

# 详细输出模式
taskflow init --verbose

# 自定义配置目录
taskflow init --config-dir .tf-config
```

### 输出示例

```
✅ TaskFlow AI 初始化成功
📁 配置目录: .taskflow/
📄 配置文件: .taskflow/config.json
📋 任务文件: .taskflow/tasks.json
💾 缓存目录: .taskflow/cache/

下一步:
1. 配置AI模型: taskflow config set models.deepseek.apiKey "your-key"
2. 解析PRD文档: taskflow parse docs/requirements.md
```

## 📄 parse - PRD解析

解析PRD文档并生成任务列表。

### 语法

```bash
taskflow parse <文件路径> [选项]
```

### 选项

| 选项                 | 简写 | 类型    | 默认值    | 描述           |
| -------------------- | ---- | ------- | --------- | -------------- |
| `--model`            | `-m` | string  | `auto`    | 指定AI模型     |
| `--multi-model`      |      | boolean | `false`   | 启用多模型协同 |
| `--output`           | `-o` | string  | `console` | 输出格式       |
| `--extract-sections` |      | boolean | `true`    | 提取文档章节   |
| `--extract-features` |      | boolean | `true`    | 提取功能特性   |
| `--prioritize`       |      | boolean | `true`    | 智能优先级排序 |
| `--save`             | `-s` | boolean | `true`    | 保存解析结果   |

### 支持的文件格式

- **Markdown**: `.md`, `.markdown`
- **纯文本**: `.txt`
- **Word文档**: `.docx` (实验性)

### 示例

```bash
# 基本解析
taskflow parse docs/requirements.md

# 指定模型解析
taskflow parse docs/requirements.md --model deepseek

# 多模型协同解析
taskflow parse docs/requirements.md --multi-model

# 输出为JSON格式
taskflow parse docs/requirements.md --output json

# 详细解析选项
taskflow parse docs/requirements.md \
  --extract-sections \
  --extract-features \
  --prioritize
```

### 输出示例

```
📄 正在解析: docs/requirements.md
🤖 使用模型: DeepSeek
📊 解析进度: [████████████████████] 100%

✅ 解析完成!
📋 生成任务: 8个
🔗 依赖关系: 3个
⏱️ 预估工时: 42小时

任务概览:
┌─────────────┬──────────────────────────┬──────────┬──────────┐
│ ID          │ 任务名称                 │ 优先级   │ 预估工时 │
├─────────────┼──────────────────────────┼──────────┼──────────┤
│ task-001    │ 实现用户登录功能         │ 高       │ 8小时    │
│ task-002    │ 创建数据可视化图表       │ 中       │ 12小时   │
│ task-003    │ 添加响应式布局           │ 低       │ 6小时    │
└─────────────┴──────────────────────────┴──────────┴──────────┘
```

## 📊 status - 任务状态管理

管理任务状态和查看项目进度。

### 子命令

#### status list - 查看任务列表

```bash
taskflow status list [选项]
```

**选项**:
| 选项 | 类型 | 描述 |
|------|------|------|
| `--filter` | string | 过滤条件 |
| `--sort` | string | 排序方式 |
| `--format` | string | 输出格式 |

**示例**:

```bash
# 查看所有任务
taskflow status list

# 查看进行中的任务
taskflow status list --filter status=in_progress

# 查看高优先级任务
taskflow status list --filter priority=high

# 按创建时间排序
taskflow status list --sort created_at

# JSON格式输出
taskflow status list --format json
```

#### status update - 更新任务状态

```bash
taskflow status update <任务ID> <新状态> [选项]
```

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
| `--batch` | boolean | 批量更新 |

**示例**:

```bash
# 更新单个任务状态
taskflow status update task-001 in_progress

# 添加完成备注
taskflow status update task-001 completed --comment "功能已实现并测试通过"

# 分配任务
taskflow status update task-002 in_progress --assignee "张三"

# 批量更新
taskflow status update --batch task-001,task-002 in_progress
```

#### status progress - 查看项目进度

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
# 查看基本进度
taskflow status progress

# 详细进度报告
taskflow status progress --detailed

# 生成图表
taskflow status progress --chart

# 导出PDF报告
taskflow status progress --export progress-report.pdf
```

#### status next - 获取下一个任务

```bash
taskflow status next [选项]
```

**选项**:
| 选项 | 类型 | 描述 |
|------|------|------|
| `--count` | number | 获取任务数量 |
| `--priority` | string | 指定优先级 |
| `--assignee` | string | 指定分配人员 |

**示例**:

```bash
# 获取下一个任务
taskflow status next

# 获取3个高优先级任务
taskflow status next --count 3 --priority high

# 获取分配给当前用户的任务
taskflow status next --assignee current-user
```

## ⚙️ config - 配置管理

管理TaskFlow AI的配置设置。

### 子命令

#### config list - 查看配置

```bash
taskflow config list [选项]
```

#### config get - 获取配置值

```bash
taskflow config get <配置键>
```

#### config set - 设置配置值

```bash
taskflow config set <配置键> <配置值>
```

#### config validate - 验证配置

```bash
taskflow config validate [选项]
```

### 示例

```bash
# 查看所有配置
taskflow config list

# 获取特定配置
taskflow config get models.deepseek.apiKey

# 设置配置
taskflow config set models.deepseek.apiKey "your-api-key"
taskflow config set logging.level debug

# 验证配置
taskflow config validate

# 重置配置
taskflow config reset
```

## 🤖 models - AI模型管理

管理和测试AI模型配置。

### 子命令

#### models test - 测试模型连接

```bash
taskflow models test [模型名称] [选项]
```

#### models status - 查看模型状态

```bash
taskflow models status [选项]
```

#### models stats - 查看使用统计

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

# 性能基准测试
taskflow models benchmark
```

## 💾 cache - 缓存管理

管理系统缓存。

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

## 📝 logs - 日志管理

查看和管理系统日志。

### 子命令

```bash
# 查看最新日志
taskflow logs

# 查看指定行数
taskflow logs --tail 50

# 查看错误日志
taskflow logs --level error

# 实时监控日志
taskflow logs --follow

# 清理旧日志
taskflow logs --clean --older-than 7d
```

## 🔍 doctor - 系统诊断

系统健康检查和诊断。

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

# 网络连接测试
taskflow doctor network
```

## 🔧 全局选项

所有命令都支持以下全局选项：

| 选项         | 简写 | 描述             |
| ------------ | ---- | ---------------- |
| `--help`     | `-h` | 显示帮助信息     |
| `--version`  | `-V` | 显示版本信息     |
| `--config`   | `-c` | 指定配置文件路径 |
| `--verbose`  | `-v` | 详细输出模式     |
| `--quiet`    | `-q` | 静默模式         |
| `--no-color` |      | 禁用彩色输出     |

## 📊 输出格式

支持多种输出格式：

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

### CSV格式

```csv
ID,名称,状态
task-001,实现用户登录功能,进行中
```

## 🔄 命令组合使用

### 典型工作流

```bash
# 1. 项目初始化
cd existing-project
taskflow init

# 2. 配置AI模型
taskflow config set models.deepseek.apiKey "your-key"

# 3. 解析PRD
taskflow parse docs/requirements.md

# 4. 查看任务
taskflow status list

# 5. 开始工作
taskflow status next
taskflow status update task-001 in_progress

# 6. 查看进度
taskflow status progress
```

### 批量操作

```bash
# 批量更新任务状态
taskflow status update --batch task-001,task-002,task-003 completed

# 批量导出数据
taskflow status list --format json > tasks.json
taskflow status progress --export progress.pdf
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
taskflow config set --help
```

## 📚 相关文档

- [基本使用指南](./basic-usage.md) - 基础功能使用
- [配置参考](../reference/configuration.md) - 完整配置选项
- [API文档](../api/) - 程序化接口
- [故障排除](../troubleshooting/common-issues.md) - 常见问题解决
