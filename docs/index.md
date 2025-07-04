---
layout: home

hero:
  name: "TaskFlow AI"
  text: "智能PRD文档解析与任务管理助手"
  tagline: "在现有项目中集成AI驱动的PRD解析和任务管理，提升开发团队效率"
  image:
    src: /assets/logo.svg
    alt: TaskFlow AI Logo
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看文档
      link: /guide/installation
    - theme: alt
      text: GitHub
      link: https://github.com/agions/taskflow-ai

features:
  - icon: 📄
    title: 智能PRD解析
    details: 集成6大国产大模型（DeepSeek、智谱AI、通义千问、文心一言、月之暗面、讯飞星火），智能解析PRD文档，自动提取需求、功能点和验收标准

  - icon: 📋
    title: 任务自动生成
    details: 基于PRD内容自动生成结构化开发任务，智能分析任务优先级和依赖关系，提供精确的工时估算

  - icon: 📊
    title: 项目进度跟踪
    details: 实时跟踪任务状态，生成甘特图和依赖关系图，支持团队协作和多人同步，提供详细的进度报告

  - icon: 🤖
    title: 多模型协同
    details: 智能多模型编排，自动选择最适合的模型，支持负载均衡、故障转移和成本优化

  - icon: 🔧
    title: MCP编辑器集成
    details: 支持Cursor、Windsurf、Trae、VSCode四大编辑器，自动生成MCP配置和AI规则，无缝集成开发流程

  - icon: ⚡
    title: 企业级可靠性
    details: TypeScript严格类型安全，零容忍错误策略，完善的错误处理，实时性能监控，支持大规模团队协作
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, #00D2FF 30%, #3A7BD5);

  --vp-home-hero-image-background-image: linear-gradient(-45deg, #00D2FF 50%, #3A7BD5 50%);
  --vp-home-hero-image-filter: blur(44px);
}

@media (min-width: 640px) {
  :root {
    --vp-home-hero-image-filter: blur(56px);
  }
}

@media (min-width: 960px) {
  :root {
    --vp-home-hero-image-filter: blur(68px);
  }
}
</style>

## 🎯 什么是 TaskFlow AI？

TaskFlow AI 是一个专为开发团队设计的**PRD文档解析与任务管理工具**。它不是项目脚手架，而是在你现有项目中集成的智能助手，帮助你：

- 📄 **智能解析PRD文档**：自动提取需求、功能点、验收标准
- 📋 **自动生成任务**：基于PRD内容生成结构化开发任务
- 📊 **跟踪项目进度**：实时管理任务状态，监控项目进展
- 🤖 **AI智能辅助**：多模型协同，提供最佳的解析效果

## 🚀 快速开始

### 在现有项目中使用

```bash
# 1. 安装 TaskFlow AI
npm install -g taskflow-ai

# 2. 进入你的现有项目
cd your-existing-project

# 3. 初始化 TaskFlow AI 配置
taskflow init

# 4. 配置 AI 模型
taskflow config set models.deepseek.apiKey "your-api-key"

# 5. 解析 PRD 文档
taskflow parse docs/requirements.md

# 6. 查看生成的任务
taskflow status list

# 7. 开始管理任务
taskflow status update task-001 in_progress
```

### 支持的项目类型

TaskFlow AI 可以在任何类型的现有项目中使用：

- **前端项目**：React、Vue、Angular、原生JavaScript
- **后端项目**：Node.js、Python、Java、Go、PHP
- **移动应用**：React Native、Flutter、原生开发
- **其他项目**：桌面应用、AI/ML项目、DevOps项目

## 📋 核心工作流程

### 1. 项目集成
```bash
# 在现有项目中初始化
cd my-react-app
taskflow init
```

### 2. PRD解析
```bash
# 解析产品需求文档
taskflow parse product-requirements.md
```

### 3. 任务管理
```bash
# 查看任务列表
taskflow status list

# 更新任务状态
taskflow status update task-001 completed

# 查看项目进度
taskflow status progress
```

### 4. 团队协作
```bash
# 获取下一个任务
taskflow status next

# 查看团队进度
taskflow status progress --team
```

## 🤖 AI模型支持

TaskFlow AI 集成了多个优秀的国产大模型：

| 模型 | 特点 | 适用场景 |
|------|------|----------|
| **DeepSeek** | 强大的代码理解能力 | 技术文档解析 |
| **智谱AI** | 优秀的中文理解 | 业务需求分析 |
| **通义千问** | 综合性能均衡 | 通用PRD解析 |
| **文心一言** | 创意和文案生成 | 需求描述优化 |

## 📊 使用场景

### 🏢 企业开发团队
- **现有项目管理**：在已有项目中快速集成任务管理
- **PRD标准化**：统一PRD解析和任务生成流程
- **团队协作**：多人协作的任务状态同步

### 👨‍💻 个人开发者
- **项目规划**：快速将PRD转换为可执行任务
- **进度跟踪**：清晰的任务状态和进度管理
- **效率提升**：自动化重复性的项目管理工作

### 🎓 开发团队
- **项目管理**：标准化的项目管理流程
- **需求跟踪**：从PRD到任务的完整追溯
- **质量控制**：确保需求完整实现

## 💡 实际使用示例

### React项目中的使用

```bash
# 现有React项目
cd my-react-dashboard

# 初始化TaskFlow AI
taskflow init

# 解析产品需求
taskflow parse docs/dashboard-requirements.md

# 查看生成的任务
taskflow status list
# 输出：
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

### Python API项目中的使用

```bash
# 现有Python API项目
cd my-python-api

# 初始化TaskFlow AI
taskflow init

# 解析API需求文档
taskflow parse api-requirements.md

# 查看项目进度
taskflow status progress
# 输出：
# 📊 项目进度概览
# ├── 总任务数: 8
# ├── 已完成: 3 (37.5%)
# ├── 进行中: 2 (25.0%)
# ├── 未开始: 3 (37.5%)
# └── 预计完成时间: 2024-02-15
```

## 🔧 配置和定制

### AI模型配置
```bash
# 配置主要模型
taskflow config set multiModel.primary "deepseek"

# 配置备用模型
taskflow config set multiModel.fallback '["zhipu", "qwen"]'

# 启用负载均衡
taskflow config set multiModel.loadBalancing true
```

### 项目特定配置
```bash
# 设置项目信息
taskflow config set project.name "我的项目"
taskflow config set project.type "web-app"

# 配置团队信息
taskflow config set team.members '["张三", "李四", "王五"]'
```

## 📚 学习资源

<div class="resource-grid">

### 📖 文档指南
- [安装指南](/guide/installation) - 详细的安装和配置步骤
- [快速开始](/guide/getting-started) - 5分钟上手教程
- [用户手册](/user-guide/user-manual) - 完整的功能说明

### 🔧 技术参考
- [CLI命令参考](/reference/cli) - 所有命令的详细说明
- [配置参考](/reference/configuration) - 完整的配置选项
- [API文档](/api/) - 程序化接口文档

### 💬 社区支持
- [GitHub Issues](https://github.com/agions/taskflow-ai/issues) - 问题报告和功能建议
- [讨论区](https://github.com/agions/taskflow-ai/discussions) - 社区交流
- [常见问题](/faq) - 常见问题解答

</div>

## 🎉 立即开始

TaskFlow AI 让PRD解析和任务管理变得简单高效。在你的现有项目中试试吧！

<div class="cta-section">

[🚀 快速开始](/guide/getting-started){ .cta-button }
[📖 查看文档](/guide/installation){ .cta-button-secondary }

</div>

<style>
.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
}

.cta-section {
  text-align: center;
  padding: 2rem 0;
  margin: 3rem 0;
}

.cta-button {
  display: inline-block;
  padding: 12px 24px;
  margin: 0 8px;
  background: var(--vp-c-brand-1);
  color: white!important;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  transition: background 0.3s;
}

.cta-button:hover {
  background: var(--vp-c-brand-2);
}

.cta-button-secondary {
  display: inline-block;
  padding: 12px 24px;
  margin: 0 8px;
  background: transparent;
  color: var(--vp-c-brand-1);
  text-decoration: none;
  border: 2px solid var(--vp-c-brand-1);
  border-radius: 6px;
  font-weight: 600;
  transition: all 0.3s;
}

.cta-button-secondary:hover {
  background: var(--vp-c-brand-1);
  color: white;
}
</style>
