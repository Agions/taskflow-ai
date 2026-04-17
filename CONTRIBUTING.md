# 贡献指南

欢迎贡献 TaskFlow AI！🎉

感谢您对 TaskFlow AI 项目的兴趣。我们欢迎任何形式的贡献，包括但不限于：

## 🤝 如何贡献

### 1. 报告 Bug

- 使用 [GitHub Issues](https://github.com/Agions/taskflow-ai/issues) 报告
- 描述清楚问题环境和复现步骤
- 附上相关日志和截图

### 2. 提交 Pull Request

```bash
# Fork 项目
# 克隆到本地
git clone https://github.com/YOUR_USERNAME/taskflow-ai.git
cd taskflow-ai

# 创建功能分支
git checkout -b feature/your-feature-name

# 开发并测试
pnpm install
pnpm run build

# 提交更改
git add .
git commit -m "feat: 添加新功能"

# 推送到 Fork 仓库
git push origin feature/your-feature-name

# 在 GitHub 上创建 Pull Request
```

### 3. 贡献类型

| 类型 | 描述 |
|------|------|
| 🐛 Bug 修复 | 发现并修复问题 |
| 💡 新功能 | 实现改进建议 |
| 📖 文档改进 | 修正错误、补充内容 |
| 🎨 样式优化 | UI/UX 改进 |
| 🧪 测试用例 | 提升测试覆盖率 |

## 📋 开发规范

### 代码规范

- 使用 TypeScript 进行开发
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码

```bash
# 检查代码格式
pnpm run format:check

# 修复代码格式
pnpm run format

# 运行 lint
pnpm run lint
```

### 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

类型 (type)：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建/工具

示例：
```
feat(cli): 添加 status list 命令

修复 Windows 11 用户无法查看任务列表的问题

Closes #4
```

### 测试规范

- 新功能需要添加测试用例
- 确保所有测试通过

```bash
# 运行测试
pnpm run test

# 运行测试并监听
pnpm run test:watch
```

## 🏗️ 项目结构

```
taskflow-ai/
├── src/
│   ├── cli/          # CLI 命令
│   ├── core/         # 核心功能
│   ├── mcp/          # MCP 协议实现
│   ├── agent/        # Agent 系统
│   └── utils/        # 工具函数
├── docs/             # 文档
├── templates/        # 项目模板
└── bin/              # 入口文件
```

## 💬 社区

- 📖 [文档](https://agions.github.io/taskflow-ai/)
- 💬 [讨论](https://github.com/Agions/taskflow-ai/discussions)
- 🐛 [问题反馈](https://github.com/Agions/taskflow-ai/issues)

## 📜 行为准则

请阅读并遵守我们的 [行为准则](CODE_OF_CONDUCT.md)。

---

感谢您的贡献！❤️
