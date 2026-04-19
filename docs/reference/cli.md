# CLI 参考手册

## 概述

TaskFlow AI 命令行界面完整参考手册，包含所有命令、选项、参数的详细说明。

## 📋 命令索引

### 核心命令

- [`taskflow init`](#taskflow-init) - 项目集成初始化
- [`taskflow parse`](#taskflow-parse) - PRD文档解析
- [`taskflow orchestrate`](#taskflow-orchestrate) - 智能任务编排
- [`taskflow status`](#taskflow-status) - 任务状态管理

### 配置命令

- [`taskflow config`](#taskflow-config) - 配置管理
- [`taskflow model`](#taskflow-model) - AI模型管理

### 工具命令

- [`taskflow doctor`](#taskflow-doctor) - 系统诊断

## 🚀 taskflow init

在现有项目中初始化TaskFlow AI配置。

### 语法

```bash
taskflow init [选项]
```

### 选项

| 选项           | 简写 | 类型    | 默认值    | 描述             |
| -------------- | ---- | ------- | --------- | ---------------- |
| `--force`      | `-f` | boolean | false     | 强制覆盖现有配置 |
| `--verbose`    | `-v` | boolean | false     | 显示详细输出     |
| `--config-dir` |      | string  | .taskflow | 配置目录名称     |
| `--help`       | `-h` | boolean | false     | 显示帮助信息     |

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

| 选项                 | 简写 | 类型    | 默认值  | 描述           |
| -------------------- | ---- | ------- | ------- | -------------- |
| `--model`            | `-m` | string  | auto    | 指定AI模型     |
| `--multi-model`      |      | boolean | false   | 启用多模型协同 |
| `--output`           | `-o` | string  | console | 输出格式       |
| `--save`             | `-s` | boolean | true    | 保存解析结果   |
| `--extract-sections` |      | boolean | true    | 提取文档章节   |
| `--extract-features` |      | boolean | true    | 提取功能特性   |
| `--prioritize`       |      | boolean | true    | 智能优先级排序 |
| `--verbose`          | `-v` | boolean | false   | 详细输出       |
| `--help`             | `-h` | boolean | false   | 显示帮助信息   |

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

## 🤖 taskflow model

AI模型管理命令。

### 子命令

#### taskflow model list

列出所有配置的模型。

```bash
taskflow model list
```

#### taskflow model add

添加新模型。

```bash
taskflow model add -i <id> -p <provider> -m <model-name> -k <api-key> [选项]
```

**选项**:
| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `-i, --id` | string | | 模型ID (必需) |
| `-p, --provider` | string | | 提供商 (必需) |
| `-m, --model-name` | string | | 模型名称 (必需) |
| `-k, --api-key` | string | | API密钥 (必需) |
| `-u, --base-url` | string | | API基础URL |
| `--priority` | string | 10 | 优先级 |
| `--enabled` | boolean | true | 是否启用 |

#### taskflow model remove

移除模型。

```bash
taskflow model remove -i <id>
```

#### taskflow model enable

启用模型。

```bash
taskflow model enable -i <id>
```

#### taskflow model disable

禁用模型。

```bash
taskflow model disable -i <id>
```

#### taskflow model test

测试模型连接。

```bash
taskflow model test [选项]
```

**选项**:
| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `-i, --id` | string | | 只测试指定模型 |

### 示例

```bash
# 列出所有模型
taskflow model list

# 添加模型
taskflow model add -i my-model -p deepseek -m deepseek-chat -k $API_KEY

# 移除模型
taskflow model remove -i my-model

# 测试所有模型
taskflow model test

# 测试指定模型
taskflow model test -i deepseek
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
| `--force` | boolean | 强制覆盖 |

#### taskflow mcp list

列出所有可用的MCP服务器。

```bash
taskflow mcp list
```

### 编辑器配置位置

| 编辑器 | 配置文件位置 |
| -------- | ----------------------- |
| Cursor   | `.cursor/mcp.json`      |
| Windsurf | `.windsurf/mcp.json`    |
| Trae     | `.trae/mcp-config.json` |
| VSCode   | `.vscode/settings.json` |

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

| 选项         | 简写 | 描述             |
| ------------ | ---- | ---------------- |
| `--help`     | `-h` | 显示帮助信息     |
| `--version`  | `-V` | 显示版本信息     |
| `--config`   | `-c` | 指定配置文件路径 |
| `--verbose`  | `-v` | 详细输出模式     |
| `--quiet`    | `-q` | 静默模式         |
| `--no-color` |      | 禁用彩色输出     |

## 📊 退出代码

| 代码 | 含义       |
| ---- | ---------- |
| 0    | 成功       |
| 1    | 一般错误   |
| 2    | 配置错误   |
| 3    | 权限错误   |
| 4    | 网络错误   |
| 5    | 文件不存在 |
| 6    | 解析错误   |

## 🔧 环境变量

| 变量名                | 描述         | 默认值    |
| --------------------- | ------------ | --------- |
| `TASKFLOW_CONFIG_DIR` | 配置目录路径 | .taskflow |
| `TASKFLOW_LOG_LEVEL`  | 日志级别     | info      |
| `TASKFLOW_CACHE_SIZE` | 缓存大小     | 100       |
| `TASKFLOW_TIMEOUT`    | 请求超时时间 | 30000     |

## 🎯 taskflow orchestrate

智能任务编排和优化命令，提供基于依赖关系的任务排序、关键路径分析和并行优化功能。

### 语法

```bash
taskflow orchestrate [选项]
```

### 选项

| 选项                         | 简写 | 类型    | 默认值            | 描述                        |
| ---------------------------- | ---- | ------- | ----------------- | --------------------------- |
| `--preset`                   | `-p` | string  | -                 | 使用预设编排策略            |
| `--strategy`                 | `-s` | string  | critical_path     | 调度策略                    |
| `--goal`                     | `-g` | string  | minimize_duration | 优化目标                    |
| `--max-parallel`             |      | number  | 10                | 最大并行任务数              |
| `--buffer`                   |      | number  | 0.1               | 缓冲时间百分比              |
| `--critical-path`            |      | boolean | true              | 启用关键路径分析            |
| `--no-critical-path`         |      | boolean | false             | 禁用关键路径分析            |
| `--parallel-optimization`    |      | boolean | true              | 启用并行优化                |
| `--no-parallel-optimization` |      | boolean | false             | 禁用并行优化                |
| `--resource-leveling`        |      | boolean | false             | 启用资源平衡                |
| `--risk-analysis`            |      | boolean | true              | 启用风险分析                |
| `--output`                   | `-o` | string  | table             | 输出格式 (table/json/gantt) |
| `--save`                     |      | boolean | false             | 保存编排结果到项目          |
| `--dry-run`                  |      | boolean | false             | 仅显示结果，不保存          |

### 预设策略

| 预设              | 描述     | 适用场景             |
| ----------------- | -------- | -------------------- |
| `agile_sprint`    | 敏捷冲刺 | 敏捷开发、迭代项目   |
| `waterfall`       | 瀑布模型 | 传统项目、需求明确   |
| `critical_chain`  | 关键链   | 资源约束、多项目管理 |
| `lean_startup`    | 精益创业 | 创业项目、快速验证   |
| `rapid_prototype` | 快速原型 | 原型开发、概念验证   |
| `enterprise`      | 企业级   | 大型项目、多团队协作 |
| `research`        | 研究项目 | 科研项目、技术探索   |
| `maintenance`     | 维护项目 | 系统维护、运营支持   |

### 调度策略

| 策略                | 描述         |
| ------------------- | ------------ |
| `critical_path`     | 关键路径优先 |
| `priority_first`    | 优先级优先   |
| `shortest_first`    | 最短任务优先 |
| `longest_first`     | 最长任务优先 |
| `resource_leveling` | 资源平衡     |
| `early_start`       | 最早开始     |

### 优化目标

| 目标                | 描述               |
| ------------------- | ------------------ |
| `minimize_duration` | 最小化项目持续时间 |
| `minimize_cost`     | 最小化项目成本     |
| `maximize_quality`  | 最大化项目质量     |
| `balance_resources` | 平衡资源使用       |
| `minimize_risk`     | 最小化项目风险     |

### 子命令

#### taskflow orchestrate presets

查看可用的编排预设。

```bash
taskflow orchestrate presets
```

#### taskflow orchestrate analyze

分析当前任务结构。

```bash
taskflow orchestrate analyze
```

#### taskflow orchestrate recommend

推荐编排策略。

```bash
taskflow orchestrate recommend [选项]
```

**选项**:
| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `--team-size` | number | 5 | 团队规模 |
| `--duration` | number | 30 | 项目持续时间（天） |
| `--uncertainty` | number | 5 | 不确定性等级 (1-10) |
| `--quality` | number | 7 | 质量要求 (1-10) |
| `--time-constraint` | number | 5 | 时间约束 (1-10) |
| `--budget-constraint` | number | 5 | 预算约束 (1-10) |
| `--agile` | boolean | false | 敏捷项目 |
| `--research` | boolean | false | 研究项目 |
| `--enterprise` | boolean | false | 企业级项目 |

### 示例

```bash
# 基本编排
taskflow orchestrate

# 使用敏捷冲刺预设
taskflow orchestrate --preset agile_sprint

# 自定义编排配置
taskflow orchestrate --strategy priority_first --goal minimize_duration --max-parallel 15

# 生成甘特图
taskflow orchestrate --output gantt

# 保存编排结果
taskflow orchestrate --save

# 仅预览，不保存
taskflow orchestrate --dry-run

# 查看可用预设
taskflow orchestrate presets

# 分析任务结构
taskflow orchestrate analyze

# 获取策略推荐
taskflow orchestrate recommend --team-size 8 --agile --duration 60
```

### 输出格式

#### 表格格式 (默认)

```
📊 任务编排结果
═══════════════════════════════════════════════════════════
✅ 总任务数: 15
⏱️  项目持续时间: 240 小时
🎯 关键路径任务: 8
🔄 并行任务组: 3
⚠️  整体风险等级: 6.2/10
```

#### JSON格式

```json
{
  "tasks": [...],
  "criticalPath": ["task-1", "task-3", "task-5"],
  "totalDuration": 240,
  "parallelGroups": [["task-2", "task-4"], ["task-6", "task-7"]],
  "riskAssessment": {...},
  "recommendations": [...]
}
```

#### 甘特图格式

```
任务甘特图
═══════════════════════════════════════════════════════════
需求分析    ████████
系统设计            ████████████
前端开发                    ████████████████
后端开发                    ████████████████
测试                                        ████████
部署                                                ████
```

## 📚 相关文档

- [用户指南](../user-guide/) - 详细使用指南
- [配置参考](./configuration.md) - 配置选项说明
- [环境变量](./environment.md) - 环境变量说明
- [任务编排API](../api/task-orchestration.md) - 编排引擎API文档
