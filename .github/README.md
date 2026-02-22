# GitHub 配置

本目录包含 TaskFlow AI 项目的 GitHub 相关配置。

## 📁 目录结构

```
.github/
├── workflows/          # GitHub Actions 工作流
│   ├── ci.yml         # 持续集成
│   ├── deploy-docs.yml # 文档部署
│   ├── npm-publish.yml # NPM 发布
│   ├── release.yml    # 版本发布
│   ├── pr-check.yml   # PR 检查
│   └── README.md      # 工作流说明
├── labeler.yml        # PR 自动标签配置
└── README.md          # 本文件
```

## 🚀 快速开始

### 配置 Secrets

在 GitHub 仓库设置中添加以下 Secrets：

1. **NPM_TOKEN** (必需)
   - 用于发布包到 NPM
   - 获取方式: npmjs.com → Account Settings → Access Tokens

2. **CODECOV_TOKEN** (可选)
   - 用于上传测试覆盖率
   - 获取方式: codecov.io

### 启用 GitHub Pages

1. 进入仓库 Settings → Pages
2. Source 选择 "GitHub Actions"
3. 保存设置

### 发布新版本

使用发布脚本：

```bash
# 补丁版本 (2.1.0 -> 2.1.1)
./scripts/release.sh patch

# 次版本 (2.1.0 -> 2.2.0)
./scripts/release.sh minor

# 主版本 (2.1.0 -> 3.0.0)
./scripts/release.sh major
```

或手动触发：

1. 进入 Actions 页面
2. 选择 "Publish to NPM"
3. 点击 "Run workflow"
4. 输入版本号

## 📊 工作流说明

详见 [workflows/README.md](workflows/README.md)

## 🔗 相关链接

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [GitHub Pages 文档](https://docs.github.com/en/pages)
- [NPM 发布指南](https://docs.npmjs.com/cli/v8/commands/npm-publish)
