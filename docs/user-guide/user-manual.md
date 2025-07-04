# TaskFlow AI 用户手册

## 欢迎使用 TaskFlow AI

TaskFlow AI 是一个专为开发团队设计的PRD文档解析与任务管理工具。它不是项目脚手架，而是在现有项目中集成的智能助手，旨在帮助开发团队提高工作效率，自动化任务管理流程。本手册将详细介绍如何在现有项目中使用 TaskFlow AI 的各项功能。

## 目录

1. [快速开始](#快速开始)
2. [基本概念](#基本概念)
3. [核心功能](#核心功能)
4. [命令参考](#命令参考)
5. [工作流程](#工作流程)
6. [最佳实践](#最佳实践)
7. [故障排除](#故障排除)

## 快速开始

### 第一次使用

1. **安装 TaskFlow AI**
   ```bash
   npm install -g taskflow-ai
   ```

2. **验证安装**
   ```bash
   taskflow --version
   ```

3. **初始化配置**
   ```bash
   taskflow config init
   ```

4. **配置AI模型**
   ```bash
   taskflow config set models.deepseek.apiKey "your-api-key"
   ```

5. **验证配置**
   ```bash
   taskflow config validate
   ```

### 在现有项目中集成TaskFlow AI

```bash
# 进入现有项目目录
cd your-existing-project

# 初始化TaskFlow AI配置
taskflow init

# 查看生成的配置文件
ls -la .taskflow/
```

## 基本概念

### PRD (产品需求文档)
PRD是产品需求文档的缩写，包含了产品的功能需求、技术要求、验收标准等信息。TaskFlow AI 能够智能解析PRD文档，提取关键信息。

### 任务 (Task)
任务是开发工作的基本单位，包含以下属性：
- **名称**: 任务的简短描述
- **描述**: 详细的任务说明
- **状态**: 任务的当前状态（未开始、进行中、已完成等）
- **优先级**: 任务的重要程度（低、中、高、紧急）
- **依赖关系**: 任务之间的依赖关系
- **预估工时**: 完成任务所需的时间

### 项目集成
TaskFlow AI 可以集成到任何类型的现有项目中，包括：
- **前端项目**: React、Vue、Angular、原生JavaScript
- **后端项目**: Node.js、Python、Java、Go、PHP
- **移动应用**: React Native、Flutter、原生开发
- **其他项目**: 桌面应用、AI/ML项目、DevOps项目

## 核心功能

### 1. 项目集成

#### 基本集成
```bash
# 在现有项目中初始化TaskFlow AI
cd your-existing-project
taskflow init

# 查看配置
taskflow config list

# 验证集成
taskflow config validate
```

#### 配置选项
```bash
# 设置项目信息
taskflow config set project.name "我的项目"
taskflow config set project.type "web-app"

# 配置团队信息
taskflow config set team.members '["张三", "李四", "王五"]'

# 设置工作目录
taskflow config set project.workDir "./src"
```

### 2. PRD文档解析

#### 解析本地文件
```bash
# 解析Markdown文件
taskflow parse requirements.md

# 解析Word文档
taskflow parse requirements.docx

# 指定输出格式
taskflow parse requirements.md --output json
```

#### 解析选项
```bash
# 使用特定AI模型
taskflow parse requirements.md --model deepseek

# 启用多模型协同
taskflow parse requirements.md --multi-model

# 提取特定部分
taskflow parse requirements.md --extract-sections --extract-features

# 设置优先级
taskflow parse requirements.md --prioritize
```

#### 解析结果
解析完成后，TaskFlow AI 会生成：
- **结构化任务列表**: 自动提取的开发任务
- **依赖关系图**: 任务之间的依赖关系
- **优先级排序**: 基于重要性的任务排序
- **工时估算**: 每个任务的预估工时

### 3. 任务管理

#### 查看任务状态
```bash
# 查看所有任务
taskflow status

# 查看特定状态的任务
taskflow status --filter status=in_progress

# 查看高优先级任务
taskflow status --filter priority=high

# 查看分配给特定人员的任务
taskflow status --filter assignee=john
```

#### 更新任务状态
```bash
# 更新单个任务状态
taskflow status update task-001 completed

# 批量更新任务状态
taskflow status update --batch task-001,task-002 in_progress

# 添加完成备注
taskflow status update task-001 completed --comment "功能已实现并测试通过"
```

#### 查看项目进度
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

#### 获取下一个任务
```bash
# 获取下一个任务
taskflow status next

# 获取多个下一个任务
taskflow status next --count 3

# 按优先级获取任务
taskflow status next --priority high

# 按分配人员获取任务
taskflow status next --assignee current-user
```

### 4. 交互式模式

#### 启动交互式界面
```bash
# 启动交互式模式
taskflow interactive

# 启动计划模式
taskflow plan --interactive
```

#### 交互式功能
- **任务浏览**: 可视化浏览任务列表
- **状态更新**: 快速更新任务状态
- **进度查看**: 实时查看项目进度
- **配置管理**: 交互式配置管理

### 5. 配置管理

#### 查看配置
```bash
# 查看所有配置
taskflow config list

# 查看特定配置
taskflow config get models.deepseek.apiKey

# 查看配置文件路径
taskflow config path
```

#### 设置配置
```bash
# 设置单个配置项
taskflow config set logging.level debug

# 设置嵌套配置
taskflow config set models.deepseek.apiKey "your-api-key"

# 设置数组配置
taskflow config set multiModel.fallback '["zhipu", "qwen"]'
```

#### 验证配置
```bash
# 验证所有配置
taskflow config validate

# 重置配置
taskflow config reset

# 导出配置
taskflow config export config-backup.json

# 导入配置
taskflow config import config-backup.json
```

### 6. AI模型管理

#### 测试模型连接
```bash
# 测试所有模型
taskflow models test

# 测试特定模型
taskflow models test deepseek

# 查看模型状态
taskflow models status
```

#### 模型性能对比
```bash
# 对比模型性能
taskflow models benchmark

# 查看模型使用统计
taskflow models stats

# 优化模型选择
taskflow models optimize
```

## 工作流程

### 典型开发流程

1. **项目集成**
   ```bash
   # 进入现有项目
   cd my-existing-project

   # 初始化TaskFlow AI配置
   taskflow init
   ```

2. **解析PRD文档**
   ```bash
   taskflow parse docs/requirements.md
   ```

3. **查看生成的任务**
   ```bash
   taskflow status list
   ```

4. **开始开发工作**
   ```bash
   # 获取下一个任务
   taskflow status next

   # 更新任务状态为进行中
   taskflow status update task-001 in_progress
   ```

5. **完成任务**
   ```bash
   # 标记任务完成
   taskflow status update task-001 completed --comment "功能实现完成"
   ```

6. **查看项目进度**
   ```bash
   taskflow status progress
   ```

### 团队协作流程

1. **项目负责人**: 初始化项目和解析PRD
2. **开发人员**: 认领任务并更新状态
3. **项目经理**: 监控进度和调整优先级
4. **测试人员**: 验证任务完成质量

## 最佳实践

### 1. PRD文档编写

#### 良好的PRD结构
```markdown
# 项目标题

## 项目概述
简要描述项目的目标和背景

## 功能需求
### 功能1: 用户登录
- 描述: 用户可以通过邮箱和密码登录系统
- 验收标准:
  - 支持邮箱格式验证
  - 支持密码强度检查
  - 登录失败时显示错误信息

### 功能2: 数据展示
- 描述: 在仪表板中展示关键数据
- 验收标准:
  - 数据实时更新
  - 支持图表展示
  - 支持数据导出

## 技术要求
- 前端: React + TypeScript
- 后端: Node.js + Express
- 数据库: PostgreSQL

## 非功能性需求
- 性能: 页面加载时间 < 2秒
- 安全: 支持HTTPS和数据加密
- 兼容性: 支持主流浏览器
```

### 2. 任务管理

#### 任务命名规范
- 使用动词开头: "实现用户登录功能"
- 保持简洁明确: "添加数据验证"
- 避免技术术语: "优化页面性能" 而不是 "优化DOM渲染"

#### 状态更新频率
- 每日更新任务状态
- 及时标记阻塞问题
- 定期同步团队进度

### 3. 配置管理

#### 环境配置
```bash
# 开发环境
taskflow config set environment development
taskflow config set logging.level debug

# 生产环境
taskflow config set environment production
taskflow config set logging.level error
```

#### 安全配置
- 使用环境变量存储敏感信息
- 定期轮换API密钥
- 启用配置文件加密

### 4. 性能优化

#### 缓存配置
```bash
# 启用缓存
taskflow config set performance.enableCache true

# 设置缓存大小
taskflow config set performance.cacheSize 200

# 设置缓存过期时间
taskflow config set performance.cacheTTL 300000
```

#### 并发控制
```bash
# 设置并发请求数
taskflow config set performance.concurrency 5

# 设置请求超时时间
taskflow config set performance.timeout 30000
```

## 故障排除

### 常见问题

#### 1. API密钥无效
**问题**: 提示API密钥无效或过期

**解决方案**:
```bash
# 检查API密钥格式
taskflow config get models.deepseek.apiKey

# 重新设置API密钥
taskflow config set models.deepseek.apiKey "new-api-key"

# 测试连接
taskflow models test deepseek
```

#### 2. 解析失败
**问题**: PRD文档解析失败

**解决方案**:
```bash
# 检查文件格式
file requirements.md

# 尝试不同的模型
taskflow parse requirements.md --model zhipu

# 启用详细日志
taskflow config set logging.level debug
taskflow parse requirements.md
```

#### 3. 任务状态同步问题
**问题**: 任务状态更新不及时

**解决方案**:
```bash
# 强制刷新任务状态
taskflow status refresh

# 检查配置文件
taskflow config validate

# 重新加载配置
taskflow config reload
```

#### 4. 性能问题
**问题**: 命令执行缓慢

**解决方案**:
```bash
# 清理缓存
taskflow cache clear

# 优化配置
taskflow config set performance.cacheSize 100
taskflow config set performance.concurrency 3

# 检查网络连接
taskflow models test --timeout 10000
```

### 获取帮助

#### 命令行帮助
```bash
# 查看总体帮助
taskflow --help

# 查看特定命令帮助
taskflow parse --help
taskflow status --help
```

#### 诊断信息
```bash
# 生成诊断报告
taskflow doctor

# 查看系统信息
taskflow info

# 查看日志
taskflow logs --tail 50
```

#### 联系支持
- **GitHub Issues**: [提交问题](https://github.com/agions/taskflow-ai/issues)
- **讨论区**: [GitHub Discussions](https://github.com/agions/taskflow-ai/discussions)
- **文档**: [在线文档](https://agions.github.io/taskflow-ai)

## 更多资源

- [快速开始教程](./getting-started.md)
- [高级功能指南](./advanced-features.md)
- [CLI命令参考](../cli/commands.md)
- [配置参考](../reference/configuration.md)
- [API文档](../api/README.md)
- [常见问题解答](../faq.md)

---

*本手册持续更新中，如有问题或建议，请通过GitHub Issues反馈。*
