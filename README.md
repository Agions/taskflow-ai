<div align="center">

<img src="assets/logo.svg" alt="TaskFlow AI Logo" width="120" />

# TaskFlow AI

**AI 思维流编排引擎**

[![npm version](https://img.shields.io/npm/v/taskflow-ai.svg?color=blue)](https://www.npmjs.com/package/taskflow-ai)
[![npm downloads](https://img.shields.io/npm/dm/taskflow-ai.svg)](https://www.npmjs.com/package/taskflow-ai)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Enabled-purple)](https://modelcontextprotocol.io/)

<p align="center">
  <a href="#-核心特性">核心特性</a> •
  <a href="#-快速开始">快速开始</a> •
  <a href="#-使用指南">使用指南</a> •
  <a href="#️-架构设计">架构设计</a> •
  <a href="#️-开发文档">开发文档</a>
</p>

</div>

---

## 📖 简介

TaskFlow AI 是一款专为开发团队设计的 AI 思维流编排引擎。它将 AI 推理过程可视化，支持多模型智能路由，并通过 MCP 协议与主流 AI 编辑器无缝集成。

**核心能力：**
- 🧠 **思维链可视化** - 展示 AI 推理的每一步
- 🤖 **多模型智能路由** - 统一管理 DeepSeek、OpenAI、Anthropic 等模型
- 📝 **智能 PRD 解析** - 自动解析需求文档生成任务
- ⚡ **工作流引擎** - 声明式编排复杂业务逻辑
- 🔌 **MCP 集成** - 连接 Cursor、Windsurf、Claude Desktop 等编辑器

---

## ✨ 核心特性

### 🧠 思维链可视化

将 AI 推理过程可视化，让思考过程一目了然：

| 特性 | 说明 |
|------|------|
| 多格式渲染 | Text、Markdown、Mermaid 流程图、思维导图 |
| 反思机制 | AI 自我审视，迭代优化结果 |
| 置信度评估 | 每步推理的可靠性评分 |
| 历史追溯 | 完整的思考链路记录 |

### 🤖 多模型智能路由

统一接口管理多厂商 LLM，智能选择最优模型：

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   用户请求   │ ──▶ │   AI Gateway     │ ──▶ │  最优模型   │
└─────────────┘     │  ┌────────────┐  │     └─────────────┘
                    │  │ smart      │  │     ┌─────────────┐
                    │  │ cost       │──┼────▶│  DeepSeek   │
                    │  │ speed      │  │     ├─────────────┤
                    │  └────────────┘  │     │   OpenAI    │
                    └──────────────────┘     ├─────────────┤
                                             │  Anthropic  │
                                             └─────────────┘
```

**支持模型**: DeepSeek, OpenAI, Anthropic, 智谱 GLM, 通义千问

### 🔌 MCP 集成

Model Context Protocol 集成，连接主流编辑器：

| 编辑器 | 状态 | 编辑器 | 状态 |
|--------|:----:|--------|:----:|
| Cursor | ✅ | VSCode | ✅ |
| Windsurf | ✅ | Trae | ✅ |
| Claude Desktop | ✅ | Continue | ✅ |

---

## 🚀 快速开始

### 安装

```bash
# npm
npm install -g taskflow-ai

# pnpm
pnpm add -g taskflow-ai

# yarn
yarn global add taskflow-ai
```

### 初始化

```bash
# 初始化项目
taskflow init

# 配置 AI 模型
taskflow model add \
  --id deepseek-chat \
  --provider deepseek \
  --model deepseek-chat \
  --key YOUR_API_KEY
```

### 快速体验

```bash
# 思维链分析
taskflow think "如何设计一个用户认证系统"

# 解析 PRD 文档
taskflow parse requirements.md

# 运行工作流
taskflow flow run ci-pipeline
```

---

## 📖 使用指南

### 模型管理

```bash
taskflow model list              # 列出所有模型
taskflow model test              # 测试连接
taskflow model route "帮我写个函数"  # 测试路由策略
taskflow model benchmark         # 性能基准测试
```

### 思维分析

```bash
taskflow think "分析这个技术方案"           # 基础分析
taskflow think "设计数据库架构" --visualize  # 可视化输出
taskflow think history                     # 查看历史
```

### 工作流管理

```bash
taskflow flow list              # 列出工作流
taskflow flow run <name>        # 运行工作流
taskflow flow create <name>     # 创建新工作流
taskflow flow history           # 查看执行历史
```

### MCP 操作

```bash
taskflow mcp start              # 启动 MCP 服务器
taskflow mcp tools              # 列出工具
taskflow mcp test <tool-name>   # 测试工具
```

---

## 🏗️ 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                        CLI 层                                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  model  │ │  think  │ │  flow   │ │  agent  │           │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
└───────┼───────────┼───────────┼───────────┼─────────────────┘
        │           │           │           │
┌───────┴───────────┴─────┬─────┴───────────┴───────┐
│                      核心服务层                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  │ AI 网关  │ │  思维链  │ │  工作流  │ │  Agent   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
│       │            │            │            │
│  ┌────▼─────┐ ┌────▼─────┐ ┌────▼─────┐ ┌────▼─────┐
│  │  Parser  │ │  Plugin  │ │ Template │ │   MCP    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘
└─────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      适配器层                                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │DeepSeek │ │ OpenAI  │ │Anthropic│ │  智谱   │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ 开发文档

### 开发环境

```bash
git clone https://github.com/Agions/taskflow-ai.git
cd taskflow-ai
npm install

npm run dev          # 开发模式
npm test             # 运行测试
npm run lint         # 代码检查
```

### 项目结构

```
taskflow-ai/
├── src/
│   ├── cli/           # CLI 入口和命令
│   ├── core/          # 核心模块 (AI/思维链/工作流/Agent)
│   ├── mcp/           # MCP 服务器实现
│   └── types/         # TypeScript 类型定义
├── docs/              # VitePress 文档站点
├── tests/             # 测试文件
└── templates/         # 内置模板
```

---

## 📝 更新日志

### v2.1.10 (2026-03-27)
- 📝 文档优化，添加 npm 链接

### v2.1.9 (2026-03-27)
- 🔒 修复命令注入安全漏洞 (CWE-78)

### v2.1.0 (2026-02-22)
- ✨ 新增 Agent 系统
- 🔌 MCP 集成增强

[查看完整更新日志](CHANGELOG.md)

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

---

## 📄 许可证

[MIT](LICENSE) © 2026 Agions

---

<div align="center">

**Made with ❤️ by [Agions](https://github.com/Agions)**

[GitHub](https://github.com/Agions/taskflow-ai) · [NPM](https://www.npmjs.com/package/taskflow-ai) · [文档](https://agions.github.io/taskflow-ai/)

</div>
