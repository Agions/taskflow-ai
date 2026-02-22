# 🚀 快速开始指南

## 📋 前置要求

- Node.js >= 18.0.0
- Git >= 2.0
- GitHub 账号
- NPM 账号（用于发布）

## 🔧 初始配置

### 1. 配置 GitHub Secrets

进入仓库 Settings → Secrets and variables → Actions，添加：

```
NPM_TOKEN=your_npm_token_here
```

获取 NPM Token:
1. 登录 [npmjs.com](https://www.npmjs.com/)
2. Account Settings → Access Tokens
3. Generate New Token → Automation
4. 复制 Token

### 2. 启用 GitHub Pages

1. Settings → Pages
2. Source: **GitHub Actions**
3. Save

## 📚 文档相关

### 本地预览文档

```bash
cd docs
pnpm install
pnpm dev
```

访问: http://localhost:5173

### 部署文档

```bash
# 方法 1: 自动部署（推荐）
# 修改 docs/ 目录下的文件后推送到 main 分支
git add docs/
git commit -m "docs: update documentation"
git push origin main

# 方法 2: 手动触发
# 在 GitHub Actions 页面手动运行 "Deploy Documentation"
```

## 📦 发布新版本

### 使用发布脚本（推荐）

```bash
# 补丁版本 (2.1.0 -> 2.1.1)
./scripts/release.sh patch

# 次版本 (2.1.0 -> 2.2.0)
./scripts/release.sh minor

# 主版本 (2.1.0 -> 3.0.0)
./scripts/release.sh major
```

脚本会自动：
1. ✅ 检查分支和工作区
2. ✅ 运行测试和构建
3. ✅ 更新版本号
4. ✅ 提交更改
5. ✅ 创建标签
6. ✅ 推送到远程

### 手动发布

```bash
# 1. 更新版本号
npm version patch  # 或 minor, major

# 2. 更新 CHANGELOG.md
# 手动编辑 CHANGELOG.md

# 3. 提交更改
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: release v2.1.1"

# 4. 创建标签
git tag -a v2.1.1 -m "Release v2.1.1"

# 5. 推送
git push origin main
git push origin v2.1.1
```

### GitHub Actions 手动触发

1. 进入 Actions 页面
2. 选择 "Publish to NPM"
3. 点击 "Run workflow"
4. 输入版本号（如 2.1.1）
5. 点击 "Run workflow"

## 🔍 查看状态

### CI 状态

- 访问: https://github.com/Agions/taskflow-ai/actions
- 查看所有工作流运行历史
- 点击具体运行查看详细日志

### 文档状态

- 在线文档: https://agions.github.io/taskflow-ai/
- 构建状态: Actions → Deploy Documentation

### NPM 包状态

- NPM 页面: https://www.npmjs.com/package/taskflow-ai
- 发布状态: Actions → Publish to NPM

## 🛠️ 开发工作流

### 创建新功能

```bash
# 1. 创建分支
git checkout -b feature/your-feature

# 2. 开发
npm run dev  # 监听模式

# 3. 测试
npm test
npm run lint
npm run type-check

# 4. 提交
git add .
git commit -m "feat: add new feature"

# 5. 推送并创建 PR
git push origin feature/your-feature
```

### PR 检查

创建 PR 后会自动运行：
- ✅ 代码质量检查
- ✅ 测试
- ✅ 构建验证
- ✅ 依赖审查
- ✅ 包大小影响分析

## 📝 常用命令

### 开发

```bash
npm run dev          # 监听模式
npm run build        # 构建项目
npm test             # 运行测试
npm run lint         # 代码检查
npm run format       # 格式化代码
npm run type-check   # 类型检查
npm run quality      # 完整质量检查
```

### 文档

```bash
cd docs
pnpm dev             # 本地预览
pnpm build           # 构建文档
```

### 发布

```bash
./scripts/release.sh patch   # 发布补丁版本
./scripts/release.sh minor   # 发布次版本
./scripts/release.sh major   # 发布主版本
./scripts/release.sh --help  # 查看帮助
```

## 🐛 故障排除

### CI 失败

```bash
# 本地运行相同的检查
npm run quality
npm test
npm run build
```

### 文档构建失败

```bash
cd docs
pnpm install
pnpm build
```

### NPM 发布失败

1. 检查 NPM_TOKEN 是否正确
2. 确认版本号未被使用
3. 检查 package.json 中的 files 字段
4. 确保 dist 目录已正确构建

## 📚 更多资源

- [完整文档](docs/README.md)
- [贡献指南](docs/development/contributing.md)
- [开发者指南](docs/development/developer-guide.md)
- [GitHub Actions 说明](.github/workflows/README.md)
- [API 参考](docs/api-reference.md)

## 💡 提示

1. **提交前检查**: 运行 `npm run quality` 确保代码质量
2. **语义化提交**: 使用规范的提交消息格式
3. **更新 CHANGELOG**: 发布前更新 CHANGELOG.md
4. **测试覆盖**: 保持测试覆盖率 > 80%
5. **文档同步**: 代码变更时同步更新文档

## 🆘 获取帮助

- GitHub Issues: https://github.com/Agions/taskflow-ai/issues
- GitHub Discussions: https://github.com/Agions/taskflow-ai/discussions
- 文档: https://agions.github.io/taskflow-ai/

---

**最后更新**: 2025-02-22
