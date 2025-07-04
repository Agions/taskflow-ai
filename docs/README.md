# TaskFlow AI 文档

这是TaskFlow AI的官方文档，使用VitePress构建。

## 📚 文档结构

```
docs/
├── .vitepress/          # VitePress配置
│   ├── config.ts        # 主配置文件
│   └── theme/           # 自定义主题
├── guide/               # 使用指南
├── user-guide/          # 用户手册
├── api/                 # API文档
├── reference/           # 参考文档
├── troubleshooting/     # 故障排除
├── examples/            # 示例文档
└── public/              # 静态资源
```

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
cd docs
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173 查看文档。

### 构建文档

```bash
npm run build
```

构建产物将生成在 `.vitepress/dist` 目录。

### 预览构建结果

```bash
npm run preview
```

## 🛠️ 部署脚本

我们提供了便捷的部署脚本：

```bash
# 安装依赖
./scripts/deploy-docs.sh install

# 开发模式
./scripts/deploy-docs.sh dev

# 构建文档
./scripts/deploy-docs.sh build

# 预览文档
./scripts/deploy-docs.sh preview

# 部署到GitHub Pages
./scripts/deploy-docs.sh deploy
```

## 🌐 自动部署

### GitHub Actions

项目配置了GitHub Actions自动部署：

- **触发条件**: 推送到main分支且docs目录有变更
- **部署目标**: GitHub Pages
- **访问地址**: https://agions.github.io/taskflow-ai/

### 部署流程

1. 检测到docs目录变更
2. 自动安装依赖
3. 构建VitePress文档
4. 部署到GitHub Pages
5. 更新文档站点

## 📝 文档编写指南

### Markdown规范

- 使用标准Markdown语法
- 代码块指定语言类型
- 使用相对路径引用其他文档
- 图片放在public目录下

### 文档结构

每个文档应包含：

1. **标题和概述** - 清晰的标题和简要说明
2. **目录结构** - 复杂文档提供目录
3. **详细内容** - 分段落组织内容
4. **代码示例** - 提供实际可用的代码
5. **相关链接** - 链接到相关文档

### 代码示例

```typescript
// 使用TypeScript语法高亮
interface TaskConfig {
  name: string
  priority: 'high' | 'medium' | 'low'
}
```

```bash
# 使用bash语法高亮
taskflow init
taskflow parse docs/requirements.md
```

## 🔧 配置说明

### VitePress配置

主要配置在 `.vitepress/config.ts`：

- **站点信息**: 标题、描述、URL
- **导航栏**: 主导航菜单
- **侧边栏**: 各部分的侧边导航
- **主题配置**: 颜色、字体等样式
- **插件配置**: 搜索、代码高亮等

### 自定义主题

可以在 `.vitepress/theme/` 目录下自定义主题：

- `index.ts` - 主题入口文件
- `custom.css` - 自定义样式
- `components/` - 自定义组件

## 📊 性能优化

### 构建优化

- 启用代码分割
- 压缩静态资源
- 优化图片格式
- 使用CDN加速

### SEO优化

- 设置页面元数据
- 生成sitemap
- 配置robots.txt
- 优化页面标题和描述

## 🔍 故障排除

### 常见问题

1. **构建失败**
   - 检查Node.js版本
   - 清理node_modules重新安装
   - 检查Markdown语法错误

2. **样式异常**
   - 检查CSS语法
   - 清理浏览器缓存
   - 检查主题配置

3. **链接失效**
   - 检查文件路径
   - 确认文件存在
   - 使用相对路径

### 调试方法

```bash
# 启用详细日志
DEBUG=vitepress:* npm run dev

# 检查构建产物
npm run build
ls -la .vitepress/dist

# 测试链接
npm run build
npm run preview
```

## 📚 相关资源

- [VitePress官方文档](https://vitepress.dev/)
- [Markdown语法指南](https://www.markdownguide.org/)
- [GitHub Pages文档](https://docs.github.com/en/pages)
- [GitHub Actions文档](https://docs.github.com/en/actions)

## 🤝 贡献指南

### 文档贡献

1. Fork项目
2. 创建功能分支
3. 编写或修改文档
4. 本地测试文档
5. 提交Pull Request

### 提交规范

```bash
# 文档更新
git commit -m "docs: 更新API文档"

# 新增文档
git commit -m "docs: 添加故障排除指南"

# 修复文档
git commit -m "docs: 修复链接错误"
```

## 📞 获取帮助

如果在文档构建或部署过程中遇到问题：

1. 查看[故障排除文档](./troubleshooting/common-issues.md)
2. 提交[GitHub Issue](https://github.com/agions/taskflow-ai/issues)
3. 参与[GitHub Discussions](https://github.com/agions/taskflow-ai/discussions)

---

**注意**: 本文档会随着项目发展持续更新，请关注最新版本。
