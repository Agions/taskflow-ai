---
layout: home

hero:
  name: "TaskFlow AI"
  text: "AI 思维流编排引擎"
  tagline: "从"任务执行"升级为"思维编排" - 专为开发团队设计的下一代 AI 开发工具"
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

## v2.0 新特性

### 🧠 思维链可视化

```bash
taskflow think "帮我分析用户登录功能需求"
# 输出思维链分析，包含推理步骤、置信度
```

### 🤖 模型网关

```bash
taskflow model add -i deepseek-chat -p deepseek -k YOUR_KEY
taskflow model route "帮我写个排序算法"
# 智能选择最适合的模型
```

### ⚡ 工作流引擎

```bash
taskflow flow run prd-to-code
# 执行完整的 PRD → 代码工作流
```

### 🤖 Agent 系统

```bash
taskflow agent create executor
taskflow agent run executor "帮我创建一个 API"
# Agent 自主完成复杂任务
```

## 安装

```bash
git clone https://github.com/Agions/taskflow-ai.git
cd taskflow-ai
npm install
npm run build
```

## 快速开始

```bash
# 1. 配置模型
taskflow model add -i deepseek-chat -p deepseek -k YOUR_KEY

# 2. 思维分析
taskflow think "分析电商系统需求"

# 3. 运行工作流
taskflow flow run prd-to-code
```

## 文档

- [安装指南](./guide/installation.md)
- [快速开始](./guide/getting-started.md)
- [CLI 命令参考](./reference/cli-commands.md)
- [API 文档](./api/)
- [MCP 集成](./mcp-integration.md)

## 相关链接

- [GitHub](https://github.com/Agions/taskflow-ai)
- [问题反馈](https://github.com/Agions/taskflow-ai/issues)
- [版本历史](./changelog.md)
