# TaskFlow AI 文档站点部署指南

## 🚀 快速部署

TaskFlow AI 使用 VitePress 构建文档站点，支持自动化部署到 GitHub Pages。

### 📋 部署清单

- ✅ VitePress 配置完成
- ✅ GitHub Actions 工作流配置
- ✅ 自动化部署脚本
- ✅ 文档内容完整

## 🌐 在线访问

- **文档站点**: https://agions.github.io/taskflow-ai/
- **GitHub 仓库**: https://github.com/agions/taskflow-ai
- **部署状态**: https://github.com/agions/taskflow-ai/actions

## 🛠️ 本地开发

### 环境要求

- Node.js 18+
- npm 或 yarn

### 快速开始

```bash
# 1. 安装依赖
./scripts/deploy-docs.sh install

# 2. 启动开发服务器
./scripts/deploy-docs.sh dev
```

访问 http://localhost:5173 查看文档。

### 构建和预览

```bash
# 构建文档
./scripts/deploy-docs.sh build

# 预览构建结果
./scripts/deploy-docs.sh preview
```

## 🚀 部署到 GitHub Pages

### 自动部署（推荐）

推送到 main 分支会自动触发部署：

```bash
# 提交文档更改
git add docs/
git commit -m "docs: 更新文档内容"
git push origin main
```

GitHub Actions 会自动：
1. 检测 docs/ 目录变更
2. 安装依赖并构建文档
3. 部署到 GitHub Pages
4. 更新文档站点

### 手动部署

使用部署脚本：

```bash
./scripts/deploy-docs.sh deploy
```

## 📁 项目结构

```
taskflow-ai/
├── docs/                          # 文档源码
│   ├── .vitepress/                # VitePress 配置
│   │   ├── config.ts              # 主配置文件
│   │   └── theme/                 # 自定义主题
│   ├── guide/                     # 使用指南
│   ├── user-guide/                # 用户手册
│   ├── api/                       # API 文档
│   ├── reference/                 # 参考文档
│   ├── troubleshooting/           # 故障排除
│   ├── examples/                  # 示例文档
│   ├── package.json               # 文档依赖
│   └── README.md                  # 文档说明
├── .github/workflows/             # GitHub Actions
│   └── deploy-docs.yml            # 自动部署工作流
├── scripts/                       # 部署脚本
│   └── deploy-docs.sh             # 文档部署脚本
└── DEPLOY.md                      # 本文件
```

## ⚙️ 配置说明

### VitePress 配置

主要配置在 `docs/.vitepress/config.ts`：

```typescript
export default defineConfig({
  title: 'TaskFlow AI',
  description: '智能PRD解析和任务管理工具',
  base: '/taskflow-ai/',
  
  themeConfig: {
    nav: [...],
    sidebar: {...},
    socialLinks: [
      { icon: 'github', link: 'https://github.com/agions/taskflow-ai' }
    ]
  }
})
```

### GitHub Actions 配置

工作流配置在 `.github/workflows/deploy-docs.yml`：

- **触发条件**: 推送到 main 分支且 docs/ 目录有变更
- **构建环境**: Ubuntu Latest + Node.js 18
- **部署目标**: GitHub Pages
- **权限设置**: 自动配置 Pages 权限

## 🔧 自定义配置

### 修改站点信息

编辑 `docs/.vitepress/config.ts`：

```typescript
export default defineConfig({
  title: '你的站点标题',
  description: '你的站点描述',
  base: '/your-repo-name/',
  // ...
})
```

### 添加自定义样式

在 `docs/.vitepress/theme/` 目录下添加：

```css
/* custom.css */
:root {
  --vp-c-brand: #your-color;
}
```

### 配置搜索功能

VitePress 内置本地搜索，无需额外配置。

## 📊 部署监控

### 查看部署状态

1. 访问 [GitHub Actions](https://github.com/agions/taskflow-ai/actions)
2. 查看 "Deploy VitePress Documentation" 工作流
3. 检查构建和部署日志

### 部署失败排查

常见问题：

1. **构建失败**
   - 检查 Node.js 版本
   - 验证 package.json 依赖
   - 查看构建日志错误

2. **部署失败**
   - 检查 GitHub Pages 设置
   - 验证仓库权限
   - 确认工作流权限

3. **页面无法访问**
   - 检查 base 配置
   - 验证 GitHub Pages 域名
   - 等待 DNS 传播

## 🔄 更新流程

### 文档更新

1. 编辑 `docs/` 目录下的 Markdown 文件
2. 本地预览：`./scripts/deploy-docs.sh dev`
3. 提交更改：`git commit -m "docs: 更新内容"`
4. 推送到 main 分支：`git push origin main`
5. 等待自动部署完成

### 配置更新

1. 修改 `docs/.vitepress/config.ts`
2. 本地测试：`./scripts/deploy-docs.sh build`
3. 提交并推送更改
4. 验证部署结果

## 🆘 获取帮助

如果遇到部署问题：

1. 查看 [GitHub Actions 日志](https://github.com/agions/taskflow-ai/actions)
2. 检查 [VitePress 文档](https://vitepress.dev/)
3. 提交 [GitHub Issue](https://github.com/agions/taskflow-ai/issues)

## 📚 相关资源

- [VitePress 官方文档](https://vitepress.dev/)
- [GitHub Pages 文档](https://docs.github.com/en/pages)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Markdown 语法指南](https://www.markdownguide.org/)

---

**注意**: 确保在 GitHub 仓库设置中启用了 GitHub Pages，并选择 "GitHub Actions" 作为部署源。
