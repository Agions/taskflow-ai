# GitHub Actions Workflows

本目录包含 TaskFlow AI 项目的所有 GitHub Actions 工作流配置。

## 📋 工作流列表

### 🔄 持续集成 (CI)

#### `ci.yml` - 主 CI 流程
**触发条件**: Push 到 main/develop 分支，或 PR

**包含任务**:
- ✅ 代码检查 (ESLint)
- ✅ 格式检查 (Prettier)
- ✅ 类型检查 (TypeScript)
- ✅ 单元测试 (多平台、多 Node 版本)
- ✅ 构建验证
- ✅ 安全扫描
- ✅ 包大小检查

**运行平台**: Ubuntu, Windows, macOS  
**Node 版本**: 18.x, 20.x

---

### 📚 文档部署

#### `deploy-docs.yml` - 文档自动部署
**触发条件**: 
- Push 到 main 分支且修改了 docs 目录
- 手动触发

**流程**:
1. 使用 pnpm 安装依赖
2. 使用 VitePress 构建文档
3. 部署到 GitHub Pages

**部署地址**: https://agions.github.io/taskflow-ai/

---

### 📦 NPM 发布

#### `npm-publish.yml` - NPM 包发布
**触发条件**:
- 创建 Release
- 手动触发（需要指定版本号）

**流程**:
1. 运行完整测试套件
2. 构建项目
3. 发布到 NPM
4. 创建 Git 标签（手动触发时）
5. 创建 GitHub Release（手动触发时）

**所需 Secret**: `NPM_TOKEN`

---

### 🏷️ 版本发布

#### `release.yml` - 自动创建 Release
**触发条件**: Push 标签 (v*.*.*)

**流程**:
1. 从 CHANGELOG.md 提取版本说明
2. 创建 GitHub Release
3. 自动生成 Release Notes
4. 标记预发布版本 (alpha/beta/rc)

---

### 🔍 PR 检查

#### `pr-check.yml` - Pull Request 检查
**触发条件**: PR 打开、同步、重新打开

**检查项**:
- ✅ PR 标题格式（语义化提交）
- ✅ 代码质量检查
- ✅ 依赖审查
- ✅ 包大小影响分析
- ✅ 自动标签

---

## 🔐 所需 Secrets

在 GitHub 仓库设置中配置以下 Secrets：

| Secret | 用途 | 必需 |
|--------|------|------|
| `NPM_TOKEN` | NPM 发布认证 | ✅ 是 |
| `CODECOV_TOKEN` | Codecov 上传 | ⚪ 可选 |

### 配置 NPM_TOKEN

1. 登录 [npmjs.com](https://www.npmjs.com/)
2. 进入 Account Settings → Access Tokens
3. 创建新的 Automation Token
4. 在 GitHub 仓库设置中添加 Secret: `NPM_TOKEN`

---

## 🚀 使用指南

### 发布新版本

#### 方法 1: 自动发布（推荐）

```bash
# 1. 更新版本号
npm version patch  # 或 minor, major

# 2. 推送标签
git push origin v2.1.1

# 3. GitHub Actions 自动创建 Release 和发布到 NPM
```

#### 方法 2: 手动触发

1. 进入 GitHub Actions 页面
2. 选择 "Publish to NPM" 工作流
3. 点击 "Run workflow"
4. 输入版本号（如 2.1.1）
5. 点击 "Run workflow"

### 部署文档

文档会在以下情况自动部署：
- Push 到 main 分支且修改了 docs 目录
- 手动触发工作流

手动触发：
1. 进入 GitHub Actions 页面
2. 选择 "Deploy Documentation" 工作流
3. 点击 "Run workflow"

### 查看 CI 状态

所有 PR 和 Push 都会自动运行 CI 检查。查看状态：
1. 在 PR 页面查看检查状态
2. 点击 "Details" 查看详细日志
3. 在 Actions 页面查看所有工作流运行历史

---

## 📊 工作流状态徽章

在 README.md 中添加状态徽章：

```markdown
![CI](https://github.com/Agions/taskflow-ai/workflows/CI/badge.svg)
![Deploy Docs](https://github.com/Agions/taskflow-ai/workflows/Deploy%20Documentation/badge.svg)
![NPM Version](https://img.shields.io/npm/v/taskflow-ai)
```

---

## 🔧 故障排除

### CI 失败

1. **Lint 错误**: 运行 `npm run lint:fix` 修复
2. **格式错误**: 运行 `npm run format` 修复
3. **类型错误**: 运行 `npm run type-check` 检查
4. **测试失败**: 运行 `npm test` 本地调试

### 文档部署失败

1. 检查 docs 目录下的 pnpm-lock.yaml 是否存在
2. 确保 VitePress 配置正确
3. 查看 Actions 日志获取详细错误信息

### NPM 发布失败

1. 检查 NPM_TOKEN 是否配置正确
2. 确认版本号未被使用
3. 检查 package.json 中的 files 字段
4. 确保 dist 目录已正确构建

---

## 📝 最佳实践

1. **提交前检查**: 运行 `npm run quality` 确保代码质量
2. **语义化提交**: 使用规范的提交消息格式
3. **更新 CHANGELOG**: 发布前更新 CHANGELOG.md
4. **测试覆盖**: 保持测试覆盖率 > 80%
5. **文档同步**: 代码变更时同步更新文档

---

## 🔗 相关链接

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [语义化版本](https://semver.org/lang/zh-CN/)
- [语义化提交](https://www.conventionalcommits.org/zh-hans/)
- [NPM 发布指南](https://docs.npmjs.com/cli/v8/commands/npm-publish)
