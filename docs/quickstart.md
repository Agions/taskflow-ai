# 5分钟快速入门

本指南将帮助您在 5 分钟内体验 TaskFlow AI 的核心功能。

## 第 1 分钟：安装

### 确认环境

```bash
node --version  # 需要 v18+
npm --version   # 需要 v9+
```

### 全局安装

```bash
npm install -g @taskflow-ai/cli
```

### 验证安装

```bash
taskflow --version
# 输出: TaskFlow CLI v4.0.0
```

---

## 第 2 分钟：设置 API Key

### 获取 API Key

1. 访问 [OpenAI API Key 页面](https://platform.openai.com/api-keys)
2. 创建新的 API Key
3. 复制 Key

### 配置环境

```bash
# 创建 .env 文件
cat > .env << 'EOF'
OPENAI_API_KEY=sk-你的API密钥
EOF

# 加载环境变量
export $(cat .env | xargs)

# 或在运行时直接设置
OPENAI_API_KEY=sk-你的API密钥 taskflow --version
```

---

## 第 3 分钟：创建示例 PRD

```bash
# 创建 PRD 文件
cat > quick-prd.md << 'EOF'
# 简单计算器 API PRD

## 需求
创建一个简单的 REST API，提供基本的计算功能。

## 功能
- 加法：GET /api/add?a=1&b=2 返回 3
- 减法：GET /api/subtract?a=5&b=3 返回 2
- 乘法：GET /api/multiply?a=4&b=3 返回 12

## 技术要求
- Node.js + Express
- TypeScript
- 包含错误处理
- API 响应时间 < 50ms

## 验收标准
- 所有端点返回 JSON 格式
- 错误处理完善
- 带有简单的单元测试
EOF

echo "✅ PRD 文件创建成功"
cat quick-prd.md
```

---

## 第 4 分钟：解析并执行

### 解析 PRD

```bash
taskflow parse quick-prd.md

# 输出类似：
# ✅ PRD 解析成功
#
# 识别的需求: 3
# 提取的功能: 4
# 生成的任务: 7
#
# 任务列表:
# [1] 创建项目结构
# [2] 实现 Express 服务器
# [3] 实现加法接口
# [4] 实现减法接口
# [5] 实现乘法接口
# [6] 添加错误处理
# [7] 编写单元测试
```

### 查看状态

```bash
taskflow status

# 输出类似：
# 项目状态: 🟢 就绪
# 待执行任务: 7
```

### 启动 Agent

```bash
taskflow agent

# 进入交互模式
# 选择 [2] 执行任务
# 选择 [1] 执行所有任务
# 等待 AI 完成工作（约 2-3 分钟）
```

---

## 第 5 分钟：验证结果

### 查看生成的文件

```bash
ls -la
# 应该看到：
# - src/index.ts (主服务器)
# - src/routes/calc.ts (计算路由)
# - src/types.ts (类型定义)
# - src/index.test.ts (测试文件)
# - package.json
# - tsconfig.json
```

### 运行测试

```bash
npm test

# 输出：
# PASS  src/index.test.ts
#   ✓ GET /add returns correct sum (12ms)
#   ✓ GET /subtract returns correct result (8ms)
#   ✓ GET /multiply returns correct product (10ms)
# Test Suites: 1 passed, 1 total
# Tests:       3 passed, 3 total
```

### 启动服务器

```bash
npm start

# 新开终端测试：
curl "http://localhost:3000/api/add?a=10&b=20"
# {"result":30,"success":true}

curl "http://localhost:3000/api/multiply?a=5&b=6"
# {"result":30,"success":true}
```

---

## 恭喜！您已成功使用 TaskFlow AI

您刚刚完成的操作：

1. ✅ 安装了 TaskFlow CLI
2. ✅ 配置了 AI API
3. ✅ 创建了 PRD 文档
4. ✅ 使用 AI 解析了需求
5. ✅ 自动生成了完整的项目代码
6. ✅ 运行并通过了测试
7. ✅ 启动了可用的服务

**从 PRD 到可运行的服务，全程自动化！**

---

## 接下来做什么？

### 📚 深入学习

- 阅读 [完整快速开始指南](../getting-started.md)
- 了解 [Agent 系统](../concepts/agent.md)
- 查看更多 [CLI 命令](../cli/README.md)

### 🚀 尝试更复杂的项目

```bash
# 创建博客系统
taskflow init blog-app
cat > prd.md << 'EOF'
# 博客系统 PRD

## 功能需求
- 用户注册和登录
- 发布和编辑文章
- 评论功能
- Markdown 支持

## 技术栈
- Next.js + TypeScript
- PostgreSQL 数据库
- Prisma ORM
EOF
taskflow parse prd.md
taskflow agent
```

### 🔌 与编辑器集成

TaskFlow 支持 MCP 协议，可与以下编辑器深度集成：

- **VS Code**: 安装 TaskFlow Extension
- **Cursor**: 内置支持
- **JetBrains**: 插件支持

配置示例（VS Code settings.json）：

```json
{
  "taskflow.mcp.enabled": true,
  "taskflow.mcp.mode": "stdio",
  "taskflow.agent.mode": "assisted"
}
```

### 🤖 自定义工作流

在 `taskflow.config.yaml` 中配置自动化工作流：

```yaml
workflow:
  onPush:
    - parse-prd
    - generate-code
    - run-tests
    - deploy-dev
```

---

## 常见问题

### Q: API Key 在哪里找？

A: OpenAI Key: https://platform.openai.com/api-keys
   Anthropic Key: https://console.anthropic.com/settings/keys

### Q: 可以使用其他 AI 模型吗？

A: 可以！支持 OpenAI、Anthropic Claude、本地模型等。配置示例：

```yaml
ai:
  provider: anthropic
  model: claude-3-opus-20240229
```

### Q: 生成的代码质量如何？

A: TaskFlow AI 生成的代码经过以下验证：
- TypeScript 类型检查
- ESLint 代码风格检查
- 单元测试覆盖
- 安全扫描

### Q: 如何撤销生成的代码？

A: TaskFlow 会自动创建 `.taskflow/backup` 目录备份原始文件。恢复命令：

```bash
taskflow restore --checkpoint initial
```

---

## 获取帮助

- 📖 [完整文档](../README.md)
- 💬 [Discord 社区](https://discord.gg/taskflow)
- 🐛 [GitHub Issues](https://github.com/taskflow-ai/issues)
- 📧 邮箱: 1051736049@qq.com

---

**准备好了吗？开始您下一个项目！**

```bash
taskflow init my-awesome-project
```
