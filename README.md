# TaskFlow AI

![版本](https://img.shields.io/npm/v/taskflow-ai.svg)
![下载量](https://img.shields.io/npm/dt/taskflow-ai.svg)
![协议](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)

<p align="center">
  <img src="https://raw.githubusercontent.com/agions/taskflow-ai/main/assets/logo.png" alt="TaskFlow AI" width="200">
</p>

<h2 align="center">🚀 智能PRD解析与任务管理AI助手</h2>

<p align="center">
  <strong>TaskFlow AI</strong> 是专为开发团队设计的AI驱动任务编排工具<br>
  基于MCP协议在AI编辑器中运行，将产品需求文档智能转换为结构化任务流程<br>
  实现从PRD到代码的全流程AI自动编排
</p>

<p align="center">
  <a href="#快速开始">快速开始</a> •
  <a href="#功能特性">功能特性</a> •
  <a href="#安装指南">安装指南</a> •
  <a href="#使用文档">使用文档</a> •
  <a href="#示例项目">示例项目</a>
</p>

---

## ✨ 功能特性

### 🎯 核心能力
- 📄 **智能PRD解析** - 自动解析产品需求文档，提取关键需求点和依赖关系
- 🤖 **AI任务编排** - 智能分析任务优先级，自动生成最优开发路径
- 🔄 **任务流程管理** - 完整的任务生命周期管理，支持状态跟踪和进度监控
- 📊 **可视化规划** - 甘特图、依赖关系图等多种可视化展示

### 🛠️ 技术特性
- 🔧 **MCP服务支持** - 作为MCP服务在AI编辑器中无缝运行
- 🤖 **国产大模型集成** - 深度集成DeepSeek、智谱GLM、通义千问等国产大模型
- 🎨 **AI编辑器优化** - 专为Cursor、VSCode等AI编辑器优化的配置生成
- 🌐 **本土化体验** - 完全中文界面，符合中国开发者使用习惯

### 🚀 开发效率
- ⚡ **项目初始化** - 一键生成AI编辑器配置和开发环境
- 📝 **智能代码生成** - 基于PRD自动生成代码结构和开发规范
- 🔍 **质量保证** - 集成ESLint、Prettier、TypeScript等代码质量工具
- 📈 **进度跟踪** - 实时任务进度监控和团队协作支持

## 📦 安装指南

### 系统要求
- Node.js 18.0.0 或更高版本
- npm、yarn 或 pnpm 包管理器
- 支持 Windows、macOS、Linux

### 全局安装（推荐）

```bash
# npm
npm install -g taskflow-ai

# yarn
yarn global add taskflow-ai

# pnpm
pnpm add -g taskflow-ai

# 验证安装
taskflow-ai --version
```

### 项目内安装

```bash
# npm
npm install --save-dev taskflow-ai

# yarn
yarn add --dev taskflow-ai

# pnpm
pnpm add --save-dev taskflow-ai
```

## 🚀 快速开始

### 第一步：初始化项目

```bash
# 创建新项目并生成AI编辑器配置
taskflow-ai init my-awesome-project

# 进入项目目录
cd my-awesome-project

# 查看生成的文件结构
ls -la
```

生成的项目结构：
```
my-awesome-project/
├── .cursor/              # Cursor AI 配置
├── .vscode/              # VSCode 配置
├── docs/                 # 文档目录
├── tasks/                # 任务文件目录
├── .eslintrc.json        # ESLint配置
├── .prettierrc.json      # Prettier配置
├── README.md             # 项目说明
└── taskflow.config.json  # TaskFlow配置
```

### 第二步：配置AI模型

```bash
# 配置DeepSeek API密钥（推荐，性价比高）
taskflow-ai config set models.apiKeys.deepseek "your-deepseek-api-key"

# 设置默认模型
taskflow-ai config set models.default "deepseek"

# 验证配置
taskflow-ai config list
```

### 第三步：解析PRD文档

```bash
# 解析示例PRD文档
taskflow-ai parse docs/example.md

# 生成详细的任务计划
taskflow-ai plan docs/example.md --output tasks/project-plan.json

# 查看生成的任务
taskflow-ai tasks list
```

### 第四步：启动Web界面（可选）

```bash
# 启动本地Web服务
taskflow-ai serve --port 3000

# 在浏览器中打开 http://localhost:3000
```

## 🔧 AI编辑器集成

### Cursor AI 配置

TaskFlow AI 专为 Cursor AI 编辑器优化，提供无缝的AI助手体验：

```bash
# 初始化时自动生成Cursor配置
taskflow-ai init my-project --editor cursor

# 手动配置MCP服务
# 在 ~/.cursor/mcp.json 中添加：
{
  "mcpServers": {
    "taskflow-ai": {
      "command": "npx",
      "args": ["-y", "--package=taskflow-ai", "taskflow-mcp"],
      "env": {
        "DEEPSEEK_API_KEY": "your-api-key"
      }
    }
  }
}
```

### VSCode 配置

```bash
# 生成VSCode配置
taskflow-ai init my-project --editor vscode

# 安装推荐扩展
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-eslint
```

## 💡 核心功能

### 🎯 智能PRD解析
自动解析产品需求文档，提取关键需求点、优先级和依赖关系

```bash
# 解析PRD文档
taskflow-ai parse ./docs/prd.md --output ./tasks/plan.json

# 支持多种格式
taskflow-ai parse ./docs/requirements.json --format json
taskflow-ai parse ./docs/spec.txt --format text
```

### 🤖 AI任务编排
基于AI算法分析任务依赖关系，自动生成最优的开发路径

```bash
# 生成智能任务计划
taskflow-ai plan ./docs/prd.md --team-size 5 --sprint-duration 14

# 优化任务顺序
taskflow-ai plan --optimize --complexity high
```

### 📊 任务管理
完整的任务生命周期管理，支持状态跟踪和进度监控

```bash
# 查看所有任务
taskflow-ai tasks list

# 更新任务状态
taskflow-ai tasks update task-001 --status completed

# 筛选任务
taskflow-ai tasks list --status in_progress --priority high
```

### 📈 可视化展示
生成甘特图、依赖关系图等多种可视化图表

```bash
# 生成甘特图
taskflow-ai visualize --type gantt --output gantt.html

# 生成依赖关系图
taskflow-ai visualize --type dependency --output deps.svg
```

## 📚 使用文档

| 文档 | 描述 | 链接 |
|------|------|------|
| 📖 快速开始指南 | 5分钟快速上手教程 | [getting-started.md](docs/getting-started.md) |
| 📋 用户使用指南 | 详细的功能说明和使用方法 | [user-guide.md](docs/user-guide.md) |
| 🔧 API参考文档 | 完整的API接口文档 | [api-reference.md](docs/api-reference.md) |
| 💡 使用示例 | 各种场景的使用示例 | [examples.md](docs/examples.md) |
| 🚨 故障排除 | 常见问题和解决方案 | [troubleshooting.md](docs/troubleshooting.md) |
| 📄 产品需求文档 | TaskFlow AI的完整PRD | [TaskFlow-AI-PRD.md](docs/TaskFlow-AI-PRD.md) |

## 🤖 AI模型支持

### 国产大模型集成

| 模型 | 状态 | 特点 | 推荐场景 |
|-----|------|-----|----------|
| 🚀 DeepSeek | ✅ 完全支持 | 强大的代码生成和理解能力 | 代码项目、技术文档 |
| 🧠 智谱GLM | ✅ 完全支持 | 优秀的推理和分析能力 | 复杂逻辑、业务分析 |
| 💬 通义千问 | ✅ 完全支持 | 创新的逻辑推理能力 | 产品规划、需求分析 |
| 🔥 文心一言 | 🚧 开发中 | 全面的知识图谱和语义理解 | 知识密集型项目 |
| ⭐ 讯飞星火 | 🚧 开发中 | 强大的中文理解和生成 | 中文内容处理 |

### 模型配置示例

```bash
# 配置DeepSeek（推荐，性价比高）
taskflow-ai config set models.apiKeys.deepseek "sk-your-api-key"
taskflow-ai config set models.default "deepseek"

# 配置智谱GLM
taskflow-ai config set models.apiKeys.zhipu "your-zhipu-key"

# 配置通义千问
taskflow-ai config set models.apiKeys.qwen "your-qwen-key"
```

## 🧩 示例项目

### 基础用法

```javascript
// 使用TaskFlow AI API
const { TaskFlowService } = require('taskflow-ai');

const service = new TaskFlowService();

// 解析PRD文档
const prdContent = `
# 电商平台
## 功能需求
### 用户管理
- 用户注册和登录
- 个人信息管理
### 商品管理
- 商品展示和搜索
- 购物车功能
`;

const result = await service.parsePRD(prdContent, 'markdown');
if (result.success) {
  console.log('解析成功:', result.data);

  // 生成任务计划
  const taskPlan = await service.generateTaskPlan(result.data);
  console.log('任务计划:', taskPlan.data);
}
```

### 高级用法

```javascript
// 自定义配置
const service = new TaskFlowService();

// 配置AI模型
await service.updateConfig({
  models: {
    default: 'deepseek',
    apiKeys: {
      deepseek: process.env.DEEPSEEK_API_KEY
    }
  }
});

// 解析PRD并生成任务
const result = await service.parsePRDFromFile('./docs/prd.md');
const tasks = await service.generateTaskPlan(result.data, {
  includeTests: true,
  includeDocs: true,
  teamSize: 5,
  sprintDuration: 14
});

// 任务管理
const allTasks = service.getAllTasks();
const highPriorityTasks = service.filterTasks({
  priority: 'high',
  status: 'not_started'
});
```

## 🎯 使用场景

### 适用项目类型
- 🌐 **Web应用开发** - React、Vue、Angular等前端项目
- 📱 **移动应用开发** - React Native、Flutter等跨平台应用
- 🔧 **API服务开发** - RESTful API、GraphQL、微服务架构
- 🤖 **AI/ML项目** - 机器学习、深度学习、推荐系统
- 🏢 **企业级应用** - ERP、CRM、数据分析平台

### 团队规模
- 👤 **个人开发者** - 提高个人开发效率和项目管理能力
- 👥 **小团队** (2-5人) - 协调团队任务，优化开发流程
- 🏢 **中大型团队** (5-20人) - 复杂项目管理，多模块协作
- 🏭 **企业级团队** (20+人) - 大型项目规划，跨部门协作

## 🤝 参与贡献

我们欢迎所有形式的贡献！无论是代码、文档、问题反馈还是功能建议。

### 贡献方式

```bash
# 1. Fork 项目
git clone https://github.com/agions/taskflow-ai.git

# 2. 创建功能分支
git checkout -b feature/amazing-feature

# 3. 提交更改
git commit -m 'Add some amazing feature'

# 4. 推送到分支
git push origin feature/amazing-feature

# 5. 创建 Pull Request
```

### 开发指南
- 📋 [贡献指南](CONTRIBUTING.md)
- 🐛 [问题反馈](https://github.com/agions/taskflow-ai/issues)
- 💡 [功能建议](https://github.com/agions/taskflow-ai/discussions)
- 📖 [开发文档](docs/development.md)

## 📞 支持与社区

### 获取帮助
- 🐛 **问题反馈**: [GitHub Issues](https://github.com/agions/taskflow-ai/issues)
- 💬 **社区讨论**: [GitHub Discussions](https://github.com/agions/taskflow-ai/discussions)
- 📧 **邮件支持**: 1051736049@qq.com


## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

```
MIT License

Copyright (c) 2025 Agions

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

## 🔗 相关链接

- 📦 **NPM包**: [https://www.npmjs.com/package/taskflow-ai](https://www.npmjs.com/package/taskflow-ai)
- 🐙 **GitHub仓库**: [https://github.com/agions/taskflow-ai](https://github.com/agions/taskflow-ai)

---

<p align="center">
  <strong>⭐ 如果这个项目对你有帮助，请给我们一个星标！</strong><br>
  <sub>让更多开发者发现TaskFlow AI，一起构建更智能的开发流程</sub>
</p>

<p align="center">
  Made with ❤️ by <a href="https://github.com/agions">TaskFlow AI Team</a>
</p>
