# TaskFlow AI CLI 命令参考

## 概述

TaskFlow AI 提供了一套完整的命令行工具，用于智能PRD文档解析、任务管理和项目规划。本文档详细介绍了所有可用的CLI命令和选项。

## 全局选项

所有命令都支持以下全局选项：

```bash
--config <path>     # 指定配置文件路径
--verbose, -v       # 详细输出模式
--quiet, -q         # 静默模式
--help, -h          # 显示帮助信息
--version           # 显示版本信息
```

## 核心命令

### `taskflow-ai init`

初始化新项目并生成AI编辑器配置。

```bash
taskflow-ai init [project-name] [options]
```

**选项：**
- `--template <name>` - 使用指定模板 (default, minimal, enterprise)
- `--editor <editor>` - 配置编辑器 (cursor, vscode, vim)
- `--git` - 初始化Git仓库
- `--install-deps` - 自动安装依赖

**示例：**
```bash
# 创建基础项目
taskflow-ai init my-project

# 使用企业模板并配置Cursor
taskflow-ai init my-enterprise-app --template enterprise --editor cursor

# 创建项目并初始化Git
taskflow-ai init my-app --git --install-deps
```

### `taskflow-ai parse`

解析PRD文档并提取任务信息。

```bash
taskflow-ai parse <file> [options]
```

**选项：**
- `--output, -o <path>` - 输出文件路径
- `--format <format>` - 输出格式 (json, yaml, markdown)
- `--model <model>` - 指定AI模型
- `--multi-model` - 启用多模型协作
- `--primary <model>` - 主要模型
- `--fallback <model>` - 备用模型
- `--language <lang>` - 文档语言 (zh, en, auto)

**示例：**
```bash
# 基础解析
taskflow-ai parse ./docs/prd.md

# 使用多模型协作
taskflow-ai parse ./docs/complex-prd.md --multi-model --primary deepseek --fallback zhipu

# 指定输出格式和路径
taskflow-ai parse ./docs/prd.md --output ./tasks/plan.json --format json
```

### `taskflow-ai plan`

生成详细的任务计划和时间安排。

```bash
taskflow-ai plan <file> [options]
```

**选项：**
- `--output, -o <path>` - 输出文件路径
- `--include-tests` - 包含测试任务
- `--include-docs` - 包含文档任务
- `--team-size <number>` - 团队规模
- `--sprint-duration <days>` - 迭代周期（天）
- `--priority <level>` - 优先级过滤 (high, medium, low)
- `--template <name>` - 使用计划模板

**示例：**
```bash
# 生成基础计划
taskflow-ai plan ./docs/prd.md

# 生成包含测试和文档的完整计划
taskflow-ai plan ./docs/prd.md --include-tests --include-docs --team-size 5

# 只生成高优先级任务计划
taskflow-ai plan ./docs/prd.md --priority high --output ./tasks/high-priority.json
```

### `taskflow-ai config`

管理配置设置。

```bash
taskflow-ai config <action> [key] [value]
```

**操作：**
- `get <key>` - 获取配置值
- `set <key> <value>` - 设置配置值
- `list` - 列出所有配置
- `reset` - 重置配置
- `validate` - 验证配置

**示例：**
```bash
# 设置API密钥
taskflow-ai config set models.apiKeys.deepseek "your-api-key"

# 设置默认模型
taskflow-ai config set models.default "deepseek"

# 查看所有配置
taskflow-ai config list

# 验证配置
taskflow-ai config validate
```

## 任务管理命令

### `taskflow-ai tasks`

管理和查看任务。

```bash
taskflow-ai tasks <action> [options]
```

**操作：**
- `list` - 列出任务
- `show <id>` - 显示任务详情
- `update <id>` - 更新任务状态
- `filter` - 筛选任务
- `export` - 导出任务

**选项：**
- `--format <format>` - 输出格式 (table, json, csv)
- `--status <status>` - 按状态筛选
- `--priority <priority>` - 按优先级筛选
- `--assignee <name>` - 按负责人筛选
- `--due-date <date>` - 按截止日期筛选

**示例：**
```bash
# 列出所有任务
taskflow-ai tasks list

# 以表格形式显示高优先级任务
taskflow-ai tasks list --priority high --format table

# 筛选特定负责人的任务
taskflow-ai tasks filter --assignee "张三" --status in_progress

# 导出任务到CSV
taskflow-ai tasks export --format csv --output ./reports/tasks.csv
```

### `taskflow-ai status`

查看项目状态和进度。

```bash
taskflow-ai status [options]
```

**选项：**
- `--detailed` - 显示详细信息
- `--format <format>` - 输出格式 (summary, detailed, json)
- `--include-metrics` - 包含性能指标
- `--team-view` - 团队视图

**示例：**
```bash
# 查看项目概览
taskflow-ai status

# 查看详细状态
taskflow-ai status --detailed --include-metrics

# 生成团队报告
taskflow-ai status --team-view --format json
```

## 可视化命令

### `taskflow-ai visualize`

生成任务流程图和依赖关系图。

```bash
taskflow-ai visualize <input> [options]
```

**选项：**
- `--format <format>` - 输出格式 (mermaid, dot, svg, png)
- `--output, -o <path>` - 输出文件路径
- `--theme <theme>` - 图表主题 (default, dark, minimal)
- `--layout <layout>` - 布局方式 (horizontal, vertical, circular)

**示例：**
```bash
# 生成Mermaid流程图
taskflow-ai visualize ./tasks/plan.json --format mermaid --output ./docs/flow.md

# 生成SVG依赖图
taskflow-ai visualize ./tasks/plan.json --format svg --theme dark --output ./assets/dependencies.svg
```

### `taskflow-ai docs`

生成项目文档。

```bash
taskflow-ai docs <action> [options]
```

**操作：**
- `generate` - 生成文档
- `update` - 更新现有文档
- `validate` - 验证文档完整性

**选项：**
- `--template <name>` - 文档模板 (basic, detailed, api)
- `--output, -o <path>` - 输出目录
- `--format <format>` - 文档格式 (markdown, html, pdf)
- `--include-api` - 包含API文档
- `--include-examples` - 包含示例代码

**示例：**
```bash
# 生成基础文档
taskflow-ai docs generate

# 生成详细文档包含示例
taskflow-ai docs generate --template detailed --include-examples

# 更新现有文档
taskflow-ai docs update --output ./docs
```

## 模型管理命令

### `taskflow-ai models`

管理AI模型配置。

```bash
taskflow-ai models <action> [options]
```

**操作：**
- `list` - 列出可用模型
- `test <model>` - 测试模型连接
- `benchmark` - 性能基准测试
- `switch <model>` - 切换默认模型

**示例：**
```bash
# 列出所有可用模型
taskflow-ai models list

# 测试DeepSeek连接
taskflow-ai models test deepseek

# 运行性能基准测试
taskflow-ai models benchmark --models deepseek,zhipu,qwen

# 切换默认模型
taskflow-ai models switch zhipu
```

## 实用工具命令

### `taskflow-ai doctor`

诊断系统环境和配置问题。

```bash
taskflow-ai doctor [options]
```

**选项：**
- `--fix` - 自动修复发现的问题
- `--verbose` - 显示详细诊断信息

**示例：**
```bash
# 运行系统诊断
taskflow-ai doctor

# 诊断并自动修复问题
taskflow-ai doctor --fix
```

### `taskflow-ai update`

检查和更新TaskFlow AI。

```bash
taskflow-ai update [options]
```

**选项：**
- `--check` - 仅检查更新
- `--beta` - 包含测试版本
- `--force` - 强制更新

**示例：**
```bash
# 检查更新
taskflow-ai update --check

# 更新到最新版本
taskflow-ai update

# 更新到最新测试版
taskflow-ai update --beta
```

## 配置文件

### 全局配置

位置：`~/.taskflow/config.json`

```json
{
  "models": {
    "default": "deepseek",
    "apiKeys": {
      "deepseek": "your-api-key",
      "zhipu": "your-zhipu-key",
      "qwen": "your-qwen-key"
    },
    "timeout": 30000,
    "retries": 3
  },
  "output": {
    "format": "json",
    "verbose": false
  },
  "features": {
    "multiModel": true,
    "autoFallback": true,
    "caching": true
  }
}
```

### 项目配置

位置：`./taskflow.config.json`

```json
{
  "project": {
    "name": "My Project",
    "version": "1.0.0",
    "description": "Project description"
  },
  "parsing": {
    "language": "zh",
    "includeTests": true,
    "includeDocs": true
  },
  "planning": {
    "teamSize": 5,
    "sprintDuration": 14,
    "workingHours": 8
  }
}
```

## 环境变量

TaskFlow AI 支持以下环境变量：

```bash
# API密钥
DEEPSEEK_API_KEY=your-deepseek-key
ZHIPU_API_KEY=your-zhipu-key
QWEN_API_KEY=your-qwen-key

# 配置
TASKFLOW_CONFIG_PATH=/path/to/config.json
TASKFLOW_LOG_LEVEL=info
TASKFLOW_CACHE_DIR=/path/to/cache

# 代理设置
HTTP_PROXY=http://proxy.example.com:8080
HTTPS_PROXY=https://proxy.example.com:8080
```

## 退出代码

- `0` - 成功
- `1` - 一般错误
- `2` - 配置错误
- `3` - 网络错误
- `4` - API错误
- `5` - 文件错误

---

更多信息请参考：
- [用户指南](user-guide.md)
- [配置指南](configuration.md)
- [故障排除](troubleshooting.md)
