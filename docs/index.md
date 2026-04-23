---
layout: home

hero:
  name: 'TaskFlow AI'
  text: 'AI 思维流编排引擎'
  tagline: '从任务执行升级为思维编排 — 专为开发团队打造的下一代 AI 开发工具'
  image:
    src: /assets/logo.svg
    alt: TaskFlow AI Logo
  actions:
    - theme: brand
      text: '🚀 快速开始'
      link: /guide/getting-started
    - theme: alt
      text: '📖 开发者指南'
      link: /DEVELOPER_GUIDE
    - theme: alt
      text: '💻 GitHub'
      link: https://github.com/agions/taskflow-ai

features:
  - icon: 🧠
    title: 思维链可视化
    details: 展示 AI 推理的每一步，支持 Mermaid 流程图、思维导图等多种渲染格式，AI 自我审视优化结果
    link: /guide/advanced-features

  - icon: 🤖
    title: 多模型智能路由
    details: 统一管理 DeepSeek、OpenAI、Anthropic 等多模型，smart/cost/speed 路由策略，级联降级，成本估算
    link: /guide/advanced-features

  - icon: ⚡
    title: 工作流引擎
    details: YAML/JSON 声明式工作流，顺序/并行/条件分支/循环执行，SQLite 状态持久化，完整错误处理
    link: /user-guide/workflows

  - icon: 🧩
    title: 插件系统
    details: 动态加载/卸载插件，钩子系统 (onInit, onTaskCreate 等)，内置 PRD/工作流/任务模板
    link: /guide/advanced-features

  - icon: 🤝
    title: 多 Agent 协作
    details: 自主目标执行，AI 反思机制，多 Agent 消息传递和任务分发，短期/长期记忆系统
    link: /guide/advanced-features

  - icon: 🔌
    title: MCP 集成
    details: 支持 Cursor、Windsurf、Trae、Claude Desktop，动态工具注册，企业级安全策略
    link: /guide/mcp-setup
---

<script setup>
import HomeContent from './.vitepress/components/HomeContent.vue'
</script>

<HomeContent />
