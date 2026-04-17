# 基本使用指南

## 概述

本指南将详细介绍TaskFlow AI的基本使用方法，帮助你快速掌握PRD解析和任务管理的核心功能。TaskFlow AI是一个专为现有项目设计的智能任务管理工具，不是项目脚手架。

## 🚀 基本工作流程

### 1. 项目集成

首先在你的现有项目中集成TaskFlow AI：

```bash
# 进入现有项目目录
cd your-existing-project

# 初始化TaskFlow AI配置
taskflow init

# 验证初始化结果
ls -la .taskflow/
```

初始化后，TaskFlow AI会创建以下结构：

```
your-project/
├── .taskflow/
│   ├── config.json      # TaskFlow AI配置
│   ├── tasks.json       # 任务数据存储
│   └── cache/           # 缓存目录
└── ... (你的原有文件)
```

### 2. 配置AI模型

配置至少一个AI模型来进行PRD解析：

```bash
# 配置DeepSeek模型（推荐）
taskflow config set models.deepseek.apiKey "your-deepseek-api-key"

# 或配置智谱AI
taskflow config set models.zhipu.apiKey "your-zhipu-api-key"

# 验证配置
taskflow config validate
```

### 3. 准备PRD文档

确保你的项目中有PRD文档。支持的格式：

- **Markdown** (推荐): `.md` 文件
- **纯文本**: `.txt` 文件
- **Word文档**: `.docx` 文件 (实验性支持)

PRD文档建议结构：

```markdown
# 项目/功能名称

## 项目概述

简要描述项目目标和背景

## 功能需求

### 功能1: 功能名称

- 描述: 详细功能描述
- 验收标准:
  - 标准1
  - 标准2

## 技术要求

- 技术栈要求
- 性能要求
- 兼容性要求

## 优先级

1. 高优先级功能
2. 中优先级功能
3. 低优先级功能
```

### 4. 解析PRD文档

使用TaskFlow AI解析PRD文档：

```bash
# 解析PRD文档
taskflow parse docs/requirements.md

# 使用特定模型解析
taskflow parse docs/requirements.md --model deepseek

# 启用多模型协同
taskflow parse docs/requirements.md --multi-model

# 查看解析结果
taskflow status list
```

## 📋 任务管理

### 查看任务

```bash
# 查看所有任务
taskflow status

# 查看任务列表（表格格式）
taskflow status list

# 查看特定状态的任务
taskflow status --filter status=not_started
taskflow status --filter status=in_progress
taskflow status --filter status=completed

# 查看高优先级任务
taskflow status --filter priority=high
```

### 更新任务状态

```bash
# 开始一个任务
taskflow status update task-001 in_progress

# 完成一个任务
taskflow status update task-001 completed

# 添加完成备注
taskflow status update task-001 completed --comment "功能已实现并测试通过"

# 批量更新任务状态
taskflow status update --batch task-001,task-002 in_progress
```

### 查看项目进度

```bash
# 查看整体进度
taskflow status progress

# 查看详细进度报告
taskflow status progress --detailed

# 生成进度图表
taskflow status progress --chart

# 导出进度报告
taskflow status progress --export progress-report.pdf
```

### 获取下一个任务

```bash
# 获取下一个推荐任务
taskflow status next

# 获取多个下一个任务
taskflow status next --count 3

# 按优先级获取任务
taskflow status next --priority high

# 按分配人员获取任务
taskflow status next --assignee current-user
```

## 🔧 配置管理

### 查看和修改配置

```bash
# 查看所有配置
taskflow config list

# 查看特定配置
taskflow config get models.deepseek.apiKey

# 设置配置项
taskflow config set logging.level debug

# 删除配置项
taskflow config unset models.zhipu.apiKey
```

### 项目特定配置

```bash
# 设置项目信息
taskflow config set project.name "我的项目"
taskflow config set project.type "web-app"

# 配置团队信息
taskflow config set team.members '["张三", "李四", "王五"]'

# 设置工作目录
taskflow config set project.workDir "./src"
```

### 多模型配置

```bash
# 启用多模型支持
taskflow config set multiModel.enabled true

# 设置主要模型
taskflow config set multiModel.primary "deepseek"

# 设置备用模型
taskflow config set multiModel.fallback '["zhipu", "qwen"]'

# 启用负载均衡
taskflow config set multiModel.loadBalancing true
```

## 🤖 AI模型管理

### 测试模型连接

```bash
# 测试所有配置的模型
taskflow models test

# 测试特定模型
taskflow models test deepseek

# 查看模型状态
taskflow models status
```

### 模型性能优化

```bash
# 查看模型使用统计
taskflow models stats

# 对比模型性能
taskflow models benchmark

# 优化模型选择
taskflow models optimize
```

## 📊 实际使用示例

### React项目示例

```bash
# 在React项目中使用
cd my-react-app

# 初始化TaskFlow AI
taskflow init

# 解析React项目的PRD
taskflow parse docs/feature-requirements.md

# 查看生成的任务
taskflow status list
# 输出示例：
# ┌─────────────┬──────────────────────────┬──────────┬──────────┐
# │ ID          │ 任务名称                 │ 状态     │ 优先级   │
# ├─────────────┼──────────────────────────┼──────────┼──────────┤
# │ task-001    │ 实现用户登录组件         │ 未开始   │ 高       │
# │ task-002    │ 创建数据可视化图表       │ 未开始   │ 中       │
# │ task-003    │ 添加响应式布局           │ 未开始   │ 低       │
# └─────────────┴──────────────────────────┴──────────┴──────────┘

# 开始第一个任务
taskflow status update task-001 in_progress
```

### Python API项目示例

```bash
# 在Python API项目中使用
cd my-python-api

# 初始化TaskFlow AI
taskflow init

# 解析API需求文档
taskflow parse api-requirements.md

# 查看项目进度
taskflow status progress
# 输出示例：
# 📊 项目进度概览
# ├── 总任务数: 8
# ├── 已完成: 3 (37.5%)
# ├── 进行中: 2 (25.0%)
# ├── 未开始: 3 (37.5%)
# └── 预计完成时间: 2024-02-15
```

## 💡 最佳实践

### PRD文档编写

1. **结构清晰**: 使用标准的Markdown格式
2. **描述详细**: 包含完整的功能描述和验收标准
3. **优先级明确**: 明确标注功能优先级
4. **技术要求具体**: 详细说明技术栈和架构要求

### 任务管理

1. **及时更新**: 每日更新任务状态
2. **详细备注**: 为任务完成添加详细备注
3. **合理分配**: 根据团队成员技能分配任务
4. **定期回顾**: 定期查看项目进度和调整计划

### 团队协作

1. **统一配置**: 团队使用相同的配置模板
2. **标准流程**: 制定统一的PRD编写和任务管理流程
3. **定期同步**: 定期同步任务状态和项目进度
4. **知识共享**: 分享最佳实践和经验教训

## 🔍 故障排除

### 常见问题

1. **解析失败**: 检查PRD文档格式和AI模型配置
2. **任务状态不同步**: 使用 `taskflow status refresh` 刷新状态
3. **配置错误**: 使用 `taskflow config validate` 验证配置
4. **性能问题**: 使用 `taskflow cache clear` 清理缓存

### 获取帮助

```bash
# 查看命令帮助
taskflow --help
taskflow parse --help

# 生成诊断报告
taskflow doctor

# 查看日志
taskflow logs --tail 20
```

## 📚 下一步

- [高级功能](./advanced-features.md) - 探索更多高级功能
- [开发者指南](./developer-guide.md) - 了解开发和扩展
- [API文档](../api/) - 程序化接口使用
- [故障排除](../troubleshooting/common-issues.md) - 解决常见问题
