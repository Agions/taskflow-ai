---
layout: home

hero:
  name: "TaskFlow AI"
  text: "AI 思维流编排引擎"
  tagline: "从任务执行升级为思维编排 - 专为开发团队设计的下一代 AI 开发工具"
  image:
    src: /assets/logo.svg
    alt: TaskFlow AI Logo
  actions:
    - theme: brand
      text: 快速开始 →
      link: /guide/getting-started
    - theme: alt
      text: 安装指南
      link: /guide/installation
    - theme: alt
      text: GitHub
      link: https://github.com/agions/taskflow-ai

features:
  - icon: 🧠
    title: 思维链可视化
    details: 展示 AI 推理的每一步，支持 Mermaid 流程图、思维导图等多种渲染格式，AI 自我审视优化结果

  - icon: 🤖
    title: 多模型智能路由
    details: 统一管理 DeepSeek、OpenAI、Anthropic 等多模型，smart/cost/speed 路由策略，级联降级，成本估算

  - icon: ⚡
    title: 工作流引擎
    details: YAML/JSON 声明式工作流，顺序/并行/条件分支/循环执行，SQLite 状态持久化，完整错误处理

  - icon: 🧩
    title: 插件系统
    details: 动态加载/卸载插件，钩子系统 (onInit, onTaskCreate 等)，内置 PRD/工作流/任务模板

  - icon: 🤝
    title: 多 Agent 协作
    details: 自主目标执行，AI 反思机制，多 Agent 消息传递和任务分发，短期/长期记忆系统

  - icon: 🔌
    title: MCP 集成
    details: 支持 Cursor、Windsurf、Trae、Claude Desktop，动态工具注册，企业级安全策略
---

## ⚡ 快速开始

### 安装

::: code-group
```bash [npm]
npm install -g taskflow-ai
```

```bash [源码安装]
git clone https://github.com/Agions/taskflow-ai.git
cd taskflow-ai
npm install && npm run build
```
:::

### 基础使用

```bash
# 1. 初始化项目
taskflow init

# 2. 配置 AI 模型
taskflow model add -i deepseek-chat -p deepseek -k YOUR_KEY

# 3. 解析 PRD 文档
taskflow parse requirements.md

# 4. 查看项目状态
taskflow status
```

### 核心功能演示

::: code-group
```bash [思维链分析]
taskflow think "帮我分析用户登录功能需求"
# 输出思维链分析，包含推理步骤、置信度
```

```bash [模型路由]
taskflow model route "帮我写个排序算法"
# 智能选择最适合的模型
```

```bash [工作流执行]
taskflow flow run prd-to-code
# 执行完整的 PRD → 代码工作流
```

```bash [Agent 自主执行]
taskflow agent run executor "帮我创建一个 API"
# Agent 自主完成复杂任务
```
:::

## 📚 文档导航

<div class="doc-grid">

### 🚀 入门指南
快速上手 TaskFlow AI

- [安装指南](./guide/installation.md) - 安装和环境配置
- [快速开始](./guide/getting-started.md) - 5 分钟快速上手
- [基础使用](./guide/basic-usage.md) - 核心功能介绍
- [项目需求](./guide/project-requirements.md) - 系统要求

### 📖 用户手册
深入了解功能特性

- [高级特性](./guide/advanced-features.md) - 高级功能详解
- [工作流指南](./user-guide/workflows.md) - 工作流配置
- [最佳实践](./user-guide/best-practices.md) - 使用建议
- [使用示例](./guide/examples.md) - 实战案例

### 🔌 编辑器集成
与 AI 编辑器无缝集成

- [MCP 配置指南](./guide/mcp-setup.md) - MCP 服务器配置
- [Cursor 集成](./editor-config/cursor.md) - Cursor 编辑器
- [Windsurf/Trae](./editor-config/windsurf-trae-integration.md) - 其他编辑器
- [编辑器概览](./editor-config/overview.md) - 支持的编辑器

### 🛠️ API 参考
完整的 API 文档

- [API 概览](./api/index.md) - API 总览
- [CLI 命令](./reference/cli.md) - 命令行工具
- [配置选项](./reference/configuration.md) - 配置文件
- [完整 API](./api-reference.md) - 详细 API 文档

### 💻 开发者
参与项目开发

- [开发者指南](./development/developer-guide.md) - 开发环境搭建
- [贡献指南](./development/contributing.md) - 如何贡献代码
- [架构设计](./guide/architecture.md) - 系统架构
- [测试指南](./testing/index.md) - 测试规范

### 🔧 故障排除
解决常见问题

- [常见问题](./faq.md) - FAQ
- [安装问题](./troubleshooting/installation.md) - 安装故障
- [配置问题](./troubleshooting/configuration.md) - 配置故障
- [性能优化](./troubleshooting/performance.md) - 性能问题

</div>

## 相关链接

<div class="link-grid">

### 📦 资源
- [GitHub 仓库](https://github.com/Agions/taskflow-ai)
- [NPM 包](https://www.npmjs.com/package/taskflow-ai)
- [更新日志](./changelog.md)
- [安全策略](./security.md)

### 💬 社区
- [问题反馈](https://github.com/Agions/taskflow-ai/issues)
- [讨论区](https://github.com/Agions/taskflow-ai/discussions)
- [贡献指南](./development/contributing.md)

### 📚 学习资源
- [示例项目](./examples/example-prd.md)
- [视频教程](#) (即将推出)
- [博客文章](#) (即将推出)

</div>

<style>
.doc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}

.doc-grid h3 {
  margin-top: 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--vp-c-brand);
}

.link-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
}

.link-grid h3 {
  margin-top: 0;
  color: var(--vp-c-brand);
}
</style>
