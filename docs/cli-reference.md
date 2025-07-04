# CLI命令参考

TaskFlow AI提供了强大的命令行界面，专注于PRD解析和任务管理功能。

## 📋 命令概览

| 命令 | 描述 | 版本 |
|------|------|------|
| [`init`](#init) | 在现有项目中初始化TaskFlow AI配置 | v1.2.0+ |
| [`parse`](#parse) | 解析PRD文档并提取任务信息 | v1.0.0+ |
| [`status`](#status) | 查看项目状态和进度 | v1.0.0+ |
| [`config`](#config) | 管理系统配置 | v1.1.0+ |
| [`models`](#models) | 管理AI模型配置 | v1.2.0+ |
| [`mcp`](#mcp) | MCP配置管理 | v1.2.0+ |

## 🚀 init - 项目集成

在现有项目中初始化TaskFlow AI配置。

### 语法
```bash
taskflow init [选项]
```

### 选项

| 选项 | 简写 | 类型 | 默认值 | 描述 |
|------|------|------|--------|------|
| `--force` | `-f` | boolean | `false` | 强制覆盖现有配置 |
| `--verbose` | `-v` | boolean | `false` | 显示详细输出 |
| `--config-dir` | | string | `.taskflow` | 配置目录名称 |

### 功能说明

`taskflow init` 命令会在当前目录中创建TaskFlow AI的配置结构：

- `.taskflow/config.json` - TaskFlow AI配置文件
- `.taskflow/tasks.json` - 任务数据存储
- `.taskflow/cache/` - 缓存目录

**重要**: 此命令不会创建新项目，而是在现有项目中集成TaskFlow AI功能。

### 示例

```bash
# 在当前项目中初始化TaskFlow AI
cd your-existing-project
taskflow init

# 强制重新初始化（覆盖现有配置）
taskflow init --force

# 显示详细的初始化过程
taskflow init --verbose

# 使用自定义配置目录
taskflow init --config-dir .tf-config
```

## 📄 parse - PRD解析

解析产品需求文档，提取任务和需求信息。

### 语法
```bash
taskflow parse <文件路径> [选项]
```

### 选项

| 选项 | 简写 | 类型 | 默认值 | 描述 |
|------|------|------|--------|------|
| `--output` | `-o` | string | `tasks.json` | 输出文件路径 |
| `--format` | `-f` | string | `json` | 输出格式 |
| `--model` | `-m` | string | `qwen` | 使用的AI模型 |
| `--language` | `-l` | string | `zh` | 文档语言 |
| `--detail` | `-d` | string | `normal` | 解析详细程度 |
| `--template` | `-t` | string | | 自定义解析模板 |

### 输出格式

| 格式 | 扩展名 | 描述 |
|------|--------|------|
| `json` | `.json` | 结构化JSON数据 |
| `markdown` | `.md` | Markdown格式文档 |
| `yaml` | `.yml` | YAML配置文件 |
| `csv` | `.csv` | CSV表格数据 |

### 解析详细程度

| 级别 | 描述 | 包含内容 |
|------|------|----------|
| `basic` | 基础信息 | 标题、描述、优先级 |
| `normal` | 标准信息 | 基础信息 + 依赖关系 |
| `detailed` | 详细信息 | 标准信息 + 验收标准 |
| `comprehensive` | 全面信息 | 详细信息 + 风险评估 |

### 示例

```bash
# 基础PRD解析
taskflow parse requirements.md

# 指定输出格式和模型
taskflow parse prd.docx \
  --output tasks.json \
  --format json \
  --model qwen \
  --detail comprehensive

# 解析英文文档
taskflow parse requirements-en.md \
  --language en \
  --model gpt-4 \
  --output tasks-en.json

# 使用自定义模板
taskflow parse prd.md \
  --template custom-parse-template.json \
  --detail detailed
```

## 📊 plan - 任务规划

基于解析的任务信息生成项目计划。

### 语法
```bash
taskflow plan [选项]
```

### 选项

| 选项 | 简写 | 类型 | 默认值 | 描述 |
|------|------|------|--------|------|
| `--input` | `-i` | string | `tasks.json` | 输入任务文件 |
| `--output` | `-o` | string | `plan.md` | 输出计划文件 |
| `--format` | `-f` | string | `markdown` | 输出格式 |
| `--timeline` | `-t` | string | | 项目时间线 |
| `--assignee` | `-a` | string | | 默认负责人 |
| `--priority` | `-p` | string | `normal` | 优先级策略 |
| `--template` | | string | | 计划模板 |

### 优先级策略

| 策略 | 描述 |
|------|------|
| `urgent` | 紧急优先，关注关键路径 |
| `balanced` | 平衡优先，考虑资源分配 |
| `sequential` | 顺序优先，按依赖关系排序 |
| `parallel` | 并行优先，最大化并发执行 |

### 示例

```bash
# 基础计划生成
taskflow plan --input tasks.json

# 指定时间线和负责人
taskflow plan \
  --input parsed-tasks.json \
  --output project-plan.md \
  --timeline "2024-Q1" \
  --assignee "开发团队" \
  --priority balanced

# 生成甘特图格式
taskflow plan \
  --input tasks.json \
  --format gantt \
  --output timeline.html
```

## 📈 status - 项目状态

查看项目当前状态和进度信息。

### 语法
```bash
taskflow status [选项]
```

### 选项

| 选项 | 简写 | 类型 | 默认值 | 描述 |
|------|------|------|--------|------|
| `--project` | `-p` | string | `.` | 项目路径 |
| `--format` | `-f` | string | `table` | 显示格式 |
| `--filter` | | string | | 状态过滤器 |
| `--sort` | `-s` | string | `priority` | 排序方式 |
| `--export` | `-e` | string | | 导出文件路径 |

### 显示格式

| 格式 | 描述 |
|------|------|
| `table` | 表格形式显示 |
| `json` | JSON格式输出 |
| `summary` | 摘要信息 |
| `detailed` | 详细信息 |

### 示例

```bash
# 查看当前项目状态
taskflow status

# 查看特定项目状态
taskflow status --project /path/to/project

# 过滤进行中的任务
taskflow status --filter "status:in-progress"

# 导出状态报告
taskflow status \
  --format detailed \
  --export status-report.json
```

## 🔧 全局选项

所有命令都支持以下全局选项：

| 选项 | 简写 | 描述 |
|------|------|------|
| `--help` | `-h` | 显示帮助信息 |
| `--version` | `-V` | 显示版本信息 |
| `--config` | `-c` | 指定配置文件路径 |
| `--verbose` | `-v` | 启用详细日志 |
| `--quiet` | `-q` | 静默模式 |
| `--no-color` | | 禁用颜色输出 |

## 🔧 mcp - MCP配置管理

管理 MCP (Model Context Protocol) 配置文件的生成、验证和测试。

### 语法
```bash
taskflow mcp <子命令> [选项]
```

### 子命令

#### validate - 验证配置
```bash
taskflow mcp validate [选项]
```

**选项**:
| 选项 | 描述 |
|------|------|
| `--editor <editor>` | 验证特定编辑器配置 |
| `--all` | 验证所有编辑器配置 |

#### test - 测试配置
```bash
taskflow mcp test [选项]
```

**选项**:
| 选项 | 描述 |
|------|------|
| `--editor <editor>` | 测试特定编辑器配置 |
| `--all-editors` | 测试所有编辑器配置 |
| `--all-models` | 测试所有AI模型连接 |

#### regenerate - 重新生成配置
```bash
taskflow mcp regenerate [选项]
```

**选项**:
| 选项 | 描述 |
|------|------|
| `--editor <editor>` | 重新生成特定编辑器配置 |
| `--force` | 覆盖现有配置 |

#### info - 显示服务信息
```bash
taskflow mcp info
```

### 示例

```bash
# 验证所有编辑器配置
taskflow mcp validate --all

# 测试Cursor编辑器配置
taskflow mcp test --editor cursor

# 重新生成所有配置文件
taskflow mcp regenerate --force

# 显示MCP服务信息
taskflow mcp info
```

## 📚 相关文档

- [快速开始指南](quick-start.md)
- [AI编辑器配置](editor-config/overview.md)
- [项目模板系统](templates/overview.md)
- [配置指南](configuration.md)

---

**提示**: 使用`taskflow <command> --help`查看特定命令的详细帮助信息。
