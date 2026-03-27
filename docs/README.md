# 📚 TaskFlow AI 文档中心

> 专业的 AI 思维流编排引擎文档

## 🎯 文档导航

### 🚀 快速入门
从零开始，快速掌握 TaskFlow AI

| 文档 | 描述 | 难度 |
|------|------|------|
| [安装指南](guide/installation.md) | 系统要求、安装步骤、环境配置 | ⭐ |
| [快速开始](guide/getting-started.md) | 5 快速上手教程 | ⭐ |
| [基础使用](guide/basic-usage.md) | 核心功能和基本操作 | ⭐⭐ |
| [项目需求](guide/project-requirements.md) | 系统要求和依赖说明 | ⭐ |

### 📖 用户指南
深入了解功能特性

| 文档 | 描述 | 难度 |
|------|------|------|
| [高级特性](guide/advanced-features.md) | 高级功能详解 | ⭐⭐⭐ |
| [工作流指南](user-guide/workflows.md) | 工作流配置和使用 | ⭐⭐⭐ |
| [最佳实践](user-guide/best-practices.md) | 使用建议和技巧 | ⭐⭐ |
| [使用示例](guide/examples.md) | 实战案例和场景 | ⭐⭐ |
| [用户手册](user-guide/user-manual.md) | 完整用户手册 | ⭐⭐ |

### 🔌 编辑器集成
与 AI 编辑器无缝集成

| 文档 | 描述 | 支持状态 |
|------|------|----------|
| [MCP 配置指南](guide/mcp-setup.md) | MCP 服务器配置详解 | ✅ 完整支持 |
| [MCP 集成说明](guide/mcp-integration.md) 议集成 | ✅ 完整支持 |
| [Cursor 集成](editor-config/cursor.md) | Cursor 编辑器配置 | ✅ 完整支持 |
| [Windsurf/Trae](editor-config/windsurf-trae-integration.md) | 其他编辑器集成 | ✅ 完整支持 |
| [编辑器概览](editor-conf持的编辑器列表 | ✅ 完整支持 |

### 🛠️ API 参考
完整的 API 文档

| 文档 | 描述 | 类型 |
|------|------|------|
| [API 概览](api/index.md) | API 总览和快速索引 | 📘 概览 |
| [完整 API](api-reference.md) | 详细 API 文档 | 📗 详细 |
| [CLI 命令](reference/cli.md) | 命令行工具参考 | 📙 参考 |
| [配置选项](reference/configuration.md) | 配置文件详解 | 📙 参考 |
| [环境变量](reference/environment.md) | 环境变量说明 | 📙 参考 |
| [错误代码](reference/error-codes.md) | 错误代码对照表 | 📙 参考 |

#### API 模块文档

| 模块 | 描述 |
|------|------|
| [AI 编排器](api/ai-orchestrator.md) | AI 模型编排和路由 |
| [配置管理](api/config-manager.md) | 配置管理器 API |
|PRD 解析器](api/prd-parser.md) | PRD 文档解析 |
| [项目配置](api/project-config.md) | 项目配置 API |
| [任务管理](api/task-manager.md) | 任务管理器 API |
| [任务编排](api/task-orchestration.md) | 任务编排引擎 |

#### 类型定义

| 类型 | 描述 |
|------|------|
| [配置类型](api/types/config.md) | 配置相关类型 |
| [核心类型](api/types/core.md) | 核心数据类型 |
| [模型类型](api/types/model.md) | AI 模型类型 |
| [任务类型](api/types/task.md) | 任务相关类型 |

### 💻 开发者文档
参与项目开发

| 文档 | 描述 | 适合人群 |
|------|------|----------|
| [开发者指南](development/developer-guide.md) | 开发环境搭建和规范 | 👨‍💻 开发者 |
| [贡献指南](development/contributing.md) | 如何贡献代码 | 👥 贡献者 |
| [架构设计](guide/architecture.md) | 系统架构和设计 | 🏗️ 架构师 |
| [测试指南](testing/index.md) | 测试规范和方法 | 🧪 测试工程师 |
| [部署指南](deployment/index.md) | 部署和运维 | 🚀 运维工程师 |

### 🔧 故障排除
解决常见问题

| 文档 | 描述 | 优先级 |
|------|------|--------|
| [常见问题](faq.md) | FAQ 和快速解答 | 🔴 高 |
hooting/installation.md) | 安装故障排查 | 🔴 高 |
| [配置问题](troubleshooting/configuration.md) | 配置故障排查 | 🟡 中 |
| [性能优化](troubleshooting/performance.md) | 性能问题诊断 | 🟡 中 |
| [通用问题](troubleshooting/common-issues.md) | 其他常见问题 | 🟢 低 |

### 📦 其他资源

| 资源 | 描述 |
|------|------|
| [更新日志](changelog.md) | 版本更新记录 |
| [安全策略](security.md) | 安全相关信息 |
| [示例项目](examples/example-prd.md) | PRD 文档示例 |

---

## 📁 文档结构

```
docs/
├── 📄 index.md                    # 文档首页
├── 📄 README.md                   # 本文件
├── 📄 api-reference.md            # 完整 API 参考
├── 📄 changelog.md                # 更新日志
├── 📄 faq.md                      # 常见问题
├── 📄 security.md                 # 安全策略
│
├── 📁 guide/                      # 用户指南
│   ├── getting-started.md         # 快速开始
│   ├── installation.md       # 安装指南
│   ├── basic-usage.md             # 基础使用
│   ├── advanced-features.md       # 高级特性
│   ├── architecture.md            # 架构设计
│   ├── mcp-setup.md               # MCP 配置
│   ├── mcp-integration.md         # MCP 集成
started.md) · [查看示例](examples/example-prd.md) · [加入社区](https://github.com/Agions/taskflow-ai/discussions)

</div>
推出)
- 📝 [博客文章](#) (即将推出)
- 🎓 [在线课程](#) (即将推出)

---

## 📝 贡献文档

发现文档问题或想要改进文档？

### 快速贡献

1. **报告问题**: 在 [GitHub Issues](https://github.com/Agions/taskflow-ai/issues) 提交
2. **修改文档**: Fork 仓库，修改后提交 PR
3. **参与讨论**: 在 [Discussions](https://github.com/Agions/taskflow-ai/discussions) 参与

### 文档改进建议

- 📖 修正错别字和语法错误
- 💡 添加更多示例和用例
- 🎨 改进文档结构和排版
- 🌐 翻译文档到其他语言
- 📹 创建视频教程

---

## 📄 许可证

文档采用 [MIT License](../LICENSE) 许可。

---

<div align="center">

**TaskFlow AI** - 让 AI 开发工作流从"被动执行"变为"主动思考"

[开始使用](guide/getting-taskflow-ai/issues)
- 📧 [邮件列表](#) (即将推出)

### 学习资源
- 📺 [视频教程](#) (即将odelName: 'deepseek-chat',
      apiKey: process.env.DEEPSEEK_API_KEY
    }
  ]
});

await taskflow.init();
```

```typescript
// ❌ 避免：不完整、缺少上下文
const taskflow = new TaskFlow();
taskflow.init();
```

---

## 🔗 外部资源

### 官方资源
- 🏠 [官方网站](https://agions.github.io/taskflow-ai/)
- 📦 [GitHub 仓库](https://github.com/Agions/taskflow-ai)
- 📦 [NPM 包](https://www.npmjs.com/package/taskflow-ai)

### 社区资源
- 💬 [GitHub Discussions](https://github.com/Agions/taskflow-ai/discussions)
- 🐛 [问题反馈](https://github.com/Agions/askflow-ai';

const taskflow = new TaskFlow({
  projectName: 'My Project',
  aiModels: [
    {
      provider: 'deepseek',
      mtesting/                    # 测试文档
│   └── index.md                   # 测试指南
│
├── 📁 deployment/                 # 部署文档
│   └── index.md                   # 部署指南
│
└── 📁 .vitepress/                 # VitePress 配置
    └── config.ts                  # 站点配置
```

---

## 🎨 文档规范

### 文档编写规范

1. **标题层级**: 使用 `#` 到 `####`，不超过 4 级
2. **代码块**: 使用 ` ```语言 ` 标记代码块
3. **链接**: 使用相对路径链接其他文档
4. **图片**: 放在 `assets/` 目录下
5. **表格**: 使用 Markdown 表格语法

### 代码示例规范

```typescript
// ✅ 好的示例：清晰、完整、可运行
import { TaskFlow } from 't├── 📁 examples/                   # 示例文档
│   └── example-prd.md             # PRD 示例
│
├── 📁 
│   ├── developer-guide.md         # 开发者指南
│   └── contributing.md            # 贡献指南
│
├── 📁 user-guide/                 # 用户手册
│   ├── best-practices.md          # 最佳实践
│   ├── cli-commands.md            # CLI 命令
│   ├── user-manual.md             # 用户手册
│   └── workflows.md               # 工作流
│
├── 📁 troubleshooting/            # 故障排除
│   ├── common-issues.md           # 常见问题
│   ├── configuration.md           # 配置问题
│   ├── installation.md            # 安装问题
│   └── performance.md             # 性能问题
│
       # Cursor
│   └── windsurf-trae-integration.md
│
├── 📁 development/                # 开发文档           # 任务管理
│   ├── task-orchestration.md      # 任务编排
│   └── types/                     # 类型定义
│       ├── config.md
│       ├── core.md
│       ├── model.md
│       └── task.md
│
├── 📁 reference/                  # 参考文档
│   ├── cli.md                     # CLI 参考
│   ├── configuration.md           # 配置参考
│   ├── environment.md             # 环境变量
│   └── error-codes.md             # 错误代码
│
├── 📁 editor-config/              # 编辑器配置
│   ├── overview.md                # 概览
│   ├── cursor.md               # PRD 解析器
│   ├── project-config.md          # 项目配置
│   ├── task-manager.md │   ├── project-requirements.md    # 项目需求
│   └── examples.md                # 使用示例
│
├── 📁 api/                        # API 文档
│   ├── index.md                   # API 概览
│   ├── ai-orchestrator.md         # AI 编排器
│   ├── config-manager.md          # 配置管理
│   ├── prd-parser.md          