# 发布流程

## 快速发布

```bash
# 1. 确保代码质量
npm run verify

# 2. 选择版本类型发布
npm run publish:patch   # 修复版本 2.1.0 -> 2.1.1
npm run publish:minor   # 小版本 2.1.0 -> 2.2.0
npm run publish:major   # 大版本 2.1.0 -> 3.0.0
npm run publish:beta    # 测试版本 2.1.0 -> 2.1.1-beta.0
npm run publish:alpha   # 内测版本 2.1.0 -> 2.1.1-alpha.0
```

## 手动发布流程

```bash
# 1. 更新版本
npm version patch|minor|major

# 2. 推送到 GitHub
git push origin main --tags

# 3. 创建 Release
# 在 GitHub 上创建 Release，会自动触发发布工作流
```

## CI/CD 流程

```
代码推送
    ↓
并行检查（类型/格式/Lint/测试）
    ↓
构建
    ↓
安全扫描
    ↓
发布到 NPM（Release 触发）
    ↓
更新文档
```

## 工作流说明

| 工作流 | 触发条件 | 说明 |
|--------|----------|------|
| `ci-optimized.yml` | PR / Push | 并行质量检查 |
| `npm-publish.yml` | Release / 手动 | 发布到 NPM |
| `deploy-docs.yml` | docs/** 变更 | 部署文档 |

## 本地检查

```bash
# 完整检查
npm run verify

# 快速检查（跳过格式）
npm run check

# 自动修复
npm run check:fix
```
