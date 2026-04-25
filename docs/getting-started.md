# TaskFlow AI v4.0 快速开始指南

欢迎使用 TaskFlow AI v4.0！本指南将帮助您在 5 分钟内完成安装、配置并运行第一个任务。

## 📋 前置要求

- **Node.js**: v18.0 或更高版本
- **npm**: v9.0 或更高版本
- **Git**: 用于代码仓库管理
- **操作系统**: macOS、Linux、Windows (WSL2)

验证环境：

```bash
node --version  # 应 ≥ 18.0.0
npm --version   # 应 ≥ 9.0.0
git --version
```

## 🚀 快速安装

### 方式一：npm 全局安装（推荐）

```bash
npm install -g @taskflow-ai/cli
```

### 方式二：项目本地安装

```bash
# 创建新项目
mkdir my-project
cd my-project
npm init -y

# 安装 TaskFlow
npm install @taskflow-ai/sdk

# 初始化配置
npx taskflow init
```

### 方式三：克隆源码（开发环境）

```bash
git clone https://github.com/taskflow-ai/taskflow.git
cd taskflow
npm install
npm run build
npm link
```

## ⚙️ 基础配置

### 1. 初始化项目

```bash
taskflow init my-first-project
cd my-first-project
```

### 2. 配置 AI 模型

编辑 `taskflow.config.yaml`：

```yaml
ai:
  provider: openai
  model: gpt-4
  apiKey: ${OPENAI_API_KEY}
  maxTokens: 4096
  temperature: 0.7
```

### 3. 设置环境变量

```bash
# 创建 .env 文件
OPENAI_API_KEY=sk-xxxxx
PROJECT_ID=my-first-project
LOG_LEVEL=info
```

## 🎯 运行第一个任务

### 示例 1：解析 PRD 文档

```bash
# 创建示例 PRD
cat > prd.md << 'EOF'
# 用户登录系统 PRD

## 功能需求
1. 用户通过邮箱/用户名登录
2. 支持记住我功能
3. 登录失败 5 次后锁定账户

## 技术要求
- 前端: React + TypeScript
- 后端: Node.js + Express
- 数据库: PostgreSQL
- 认证: JWT

## 验收标准
- 所有测试通过
- 测试覆盖率 > 80%
- API 响应时间 < 200ms
EOF

# 解析 PRD
taskflow parse prd.md
```

### 示例 2：查看任务状态

```bash
taskflow status
```

输出示例：

```
当前项目: my-first-project
状态: 🟢 进行中

任务统计:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 总任务数: 12
✅ 已完成: 3
⏳ 进行中: 5
⏸️ 待开始: 4
❌ 已失败: 0

进度: █████████░░░░░░░░ 25%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 示例 3：生成代码

```bash
# 选择要执行的任务
taskflow agent

# 选择任务 5 (实现登录接口)
# Agent 将自动分析、编写代码、运行测试
```

## 🏗️ 项目结构

初始化后的项目结构：

```
my-first-project/
├── taskflow.config.yaml    # 配置文件
├── prd.md                  # PRD 文档
├── .env                    # 环境变量
├── src/                    # 源代码目录
│   ├── auth/               # 认证模块
│   ├── routes/             # API 路由
│   └── tests/              # 测试文件
├── docs/                   # 文档目录
├── .taskflow/              # TaskFlow 内部数据
│   ├── state.json          # 状态文件
│   ├── tasks.json          # 任务列表
│   └── cache/              # 缓存目录
└── package.json            # Node.js 配置
```

## 🔧 常用命令

```bash
# 查看帮助
taskflow --help

# 初始化项目
taskflow init [项目名]

# 解析 PRD
taskflow parse [prd文件]

# 查看状态
taskflow status [--watch]

# 启动 Agent
taskflow agent

# MCP 集成
taskflow mcp start
taskflow mcp tools

# 管理 Marketplace
taskflow marketplace list
taskflow marketplace install [包名]

# 知识库操作
taskflow knowledge index
taskflow knowledge search [查询词]

# CI/CD
taskflow cicd validate
taskflow cicd deploy
```

## 🐛 故障排查

### 问题：命令找不到

```bash
# 重新安装
npm install -g @taskflow-ai/cli

# 或使用 npx
npx taskflow --version
```

### 问题：AI 调用失败

检查 `~/.taskflow/config.yaml` 中的 API 配置：

```bash
taskflow config list
taskflow config set ai.apiKey sk-xxxxx
```

### 问题：任务执行超时

调整配置：

```yaml
execution:
  timeout: 300000  # 5分钟（毫秒）
  retries: 3
  continueOnError: false
```

## 📚 下一步

- 📖 [架构总览](./architecture.md) - 深入了解系统架构
- 🛠️ [CLI 命令参考](./cli/README.md) - 完整命令手册
- 🔌 [API 参考](./api/README.md) - 编程接口文档
- 🚀 [部署指南](./deployment/README.md) - 生产环境部署

## 💡 提示

- 使用 `taskflow --verbose` 查看详细日志
- 配置 `taskflow.config.yaml` 优化性能
- 定期运行 `taskflow agent` 同步任务状态
- 使用 MCP 编辑器集成提升开发效率

---

**需要帮助？** 查看 [常见问题](./reference/faq.md) 或访问 [GitHub Issues](https://github.com/taskflow-ai/taskflow/issues)
