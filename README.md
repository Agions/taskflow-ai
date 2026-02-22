# TaskFlow AI

![TaskFlow AI Logo](https://img.shields.io/badge/TaskFlow%20AI-v2.1-blue)
![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)
![MCP](https://img.shields.io/badge/MCP-Enabled-purple)
![CI](https://github.com/Agions/taskflow-ai/workflows/CI/badge.svg)
![NPM Version](https://img.shields.io/npm/v/taskflow-ai)
![License](https://img.shields.io/npm/l/taskflow-ai)
![Downloads](https://img.shields.io/npm/dm/taskflow-ai)

**AI 思维流编排引擎** - 专为开发团队设计的下一代 AI 开发工具，支持多模型协同、MCP 集成、思维链可视化、工作流编排和自主 Agent。

## ✨ 核心特性

### 🧠 思维链可视化

- **推理过程可视化**: 展示 AI 思考的每一步
- **多种渲染格式**: Text、Markdown、Mermaid 流程图、思维导图
- **反思机制**: AI 自我审视，优化结果
- **置信度评估**: 显示每步推理的可靠性

### 🤖 多模型智能路由

- **统一模型网关**: 一个接口管理所有 LLM 提供商
- **智能路由策略**: smart / cost / speed / priority
- **级联降级**: 主模型失败自动切换备选
- **成本估算**: 实时计算 API 费用
- **支持模型**: DeepSeek, OpenAI, Anthropic, 智谱, 通义千问

### 📝 智能 PRD 解析

- **多格式支持**: Markdown、Word、PDF
- **任务自动拆分**: AI 驱动的任务分解
- **工时估算**: 基于历史数据的预测
- **风险识别**: 自动识别项目风险

### ⚡ 工作流引擎

- **声明式定义**: YAML/JSON 格式
- **流程控制**: 顺序、并行、条件分支、循环
- **变量系统**: 支持 `{{variable}}` 替换
- **状态持久化**: SQLite 存储执行状态
- **错误处理**: 重试、降级机制

### 🔌 MCP 集成

- **编辑器支持**: Cursor、VSCode、Windsurf、Trae、Claude Desktop
- **动态工具注册**: 运行时加载自定义工具
- **安全策略**: 权限控制、速率限制
- **工具市场**: 丰富的内置工具

### 🧩 插件系统

- **热插拔**: 动态加载/卸载插件
- **钩子系统**: onInit, onTaskCreate, onWorkflowExecute 等
- **生命周期管理**: 完整的加载/卸载流程

### 🤖 Agent 系统

- **自主执行**: 目标驱动的任务完成
- **反思机制**: 自我审视和改进
- **多 Agent 协作**: 消息传递、任务分发
- **记忆系统**: 短期/长期记忆

## 🏗️ 项目架构

```
src/
├── cli/                        # CLI 入口
│   ├── commands/              # 命令实现
│   │   ├── model.ts          # 模型管理
│   │   ├── think.ts          # 思维分析
│   │   ├── flow.ts           # 工作流
│   │   ├── plugin.ts         # 插件管理
│   │   ├── template.ts       # 模板管理
│   │   └── agent.ts          # Agent 管理
│   └── index.ts
│
├── core/
│   ├── ai/                    # AI 模型网关
│   │   ├── types.ts          # 类型定义
│   │   ├── adapter.ts        # 适配器基类
│   │   ├── gateway.ts        # 模型网关
│   │   ├── router.ts         # 路由策略
│   │   └── providers/        # 模型适配器
│   │       ├── deepseek.ts
│   │       ├── openai.ts
│   │       └── anthropic.ts
│   │
│   ├── thought/               # 思维链系统
│   │   ├── types.ts
│   │   ├── chain.ts         # 思维链管理器
│   │   └── renderer.ts      # 渲染器
│   │
│   ├── workflow/             # 工作流引擎
│   │   ├── types.ts
│   │   ├── parser.ts        # 解析器
│   │   ├── engine.ts        # 引擎
│   │   ├── executor.ts      # 执行器
│   │   ├── flow-control.ts  # 流程控制
│   │   └── storage.ts       # 状态存储
│   │
│   ├── plugin/               # 插件系统
│   │   ├── types.ts
│   │   ├── manager.ts       # 插件管理器
│   │   └── template.ts      # 模板系统
│   │
│   ├── agent/                # Agent 系统
│   │   ├── types.ts
│   │   ├── core.ts         # Agent 核心
│   │   └── coordinator.ts  # 多 Agent 协作
│   │
│   └── parser/               # PRD 解析器
│       ├── enhanced.ts
│       ├── word.ts
│       └── pdf.ts
│
└── mcp/                      # MCP 服务器
    ├── server.ts
    ├── tools/
    │   ├── registry.ts      # 工具注册表
    │   └── search-replace.ts
    └── ...
```

## 🚀 快速开始

### 安装

```bash
# 克隆项目
git clone https://github.com/Agions/taskflow-ai.git
cd taskflow-ai

# 安装依赖
npm install

# 构建项目
npm run build
```

### 配置 AI 模型

```bash
# 添加模型
taskflow model add -i deepseek-chat -p deepseek -m deepseek-chat -k YOUR_API_KEY

# 列出模型
taskflow model list

# 测试连接
taskflow model test
```

## 📋 命令参考

### 模型管理

```bash
taskflow model list                    # 列出所有模型
taskflow model add -i <id> -p <provider> -m <model> -k <key>  # 添加模型
taskflow model test                    # 测试连接
taskflow model route "帮我写个函数"     # 测试路由
taskflow model benchmark              # 基准测试
```

### 思维分析

```bash
taskflow think "帮我分析这个需求"       # 思维分析
taskflow think --visualize             # 可视化输出
taskflow think history                 # 查看历史
```

### 工作流

```bash
taskflow flow list                     # 列出工作流
taskflow flow run <name>               # 运行工作流
taskflow flow create <name>            # 创建工作流
taskflow flow history                  # 执行历史
```

### 插件

```bash
taskflow plugin list                   # 列出插件
taskflow plugin load <id>             # 加载插件
taskflow plugin unload <id>            # 卸载插件
```

### 模板

```bash
taskflow template list                 # 列出模板
taskflow template use <id> -o file.md # 使用模板
taskflow template search <query>      # 搜索模板
```

### Agent

```bash
taskflow agent create analyzer         # 创建分析 Agent
taskflow agent list                   # 列出 Agent
taskflow agent run <id> <task>        # 运行 Agent
taskflow agent collaborate <ids...>   # 多 Agent 协作
```

### 原有命令

```bash
taskflow init                         # 初始化项目
taskflow parse <file>                 # 解析 PRD
taskflow status                       # 查看状态
taskflow visualize                    # 生成图表
taskflow mcp start                    # 启动 MCP
```

## 📊 版本历史

### v2.0 - 跨时代升级

| 模块 | 新增功能 |
|------|----------|
| **模型网关** | 多模型路由、智能选择、成本估算 |
| **思维链** | 推理可视化、Mermaid 导出、反思机制 |
| **工作流** | YAML/JSON 定义、并行执行、状态持久化 |
| **插件** | 动态加载、钩子系统、模板市场 |
| **Agent** | 自主执行、多 Agent 协作、记忆系统 |

### v1.x - 基础版本

- PRD 解析
- 任务管理
- 可视化报告
- MCP 集成

## 🧪 测试验证

```bash
# ✅ 模型网关测试
taskflow model test
# 结果: 显示所有模型的连接状态

# ✅ 思维分析测试
taskflow think "分析用户登录功能需求"
# 结果: 输出思维链分析结果

# ✅ 工作流测试
taskflow flow run prd-to-code
# 结果: 执行完整工作流

# ✅ Agent 测试
taskflow agent create executor
taskflow agent run executor "帮我写个 API"
# 结果: Agent 自主执行任务
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发环境

```bash
git clone https://github.com/Agions/taskflow-ai.git
cd taskflow-ai
npm install
npm run build
npm test
```

## 📄 许可证

MIT License

## 🙏 致谢

感谢所有为 TaskFlow AI 贡献代码和建议的开发者！

---

**TaskFlow AI** - 让 AI 开发工作流从"被动执行"变为"主动思考"！

🔗 [GitHub](https://github.com/Agions/taskflow-ai) | 📚 [文档](https://agions.github.io/taskflow-ai/) | 💬 [讨论](https://github.com/Agions/taskflow-ai/discussions)

## 📖 文档导航

- [API 参考](docs/api-reference.md) - 完整的 API 文档
- [MCP 配置指南](docs/guide/mcp-setup.md) - MCP 服务器配置
- [开发者指南](docs/development/developer-guide.md) - 开发环境搭建
- [贡献指南](docs/development/contributing.md) - 如何贡献代码
- [安全策略](docs/security.md) - 安全相关信息
- [示例 PRD](docs/examples/example-prd.md) - PRD 文档示例
