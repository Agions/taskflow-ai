# TaskFlow AI 发布检查清单

## 📋 发布前检查

### 🔍 代码质量检查
- [ ] **TypeScript编译**: `npm run type-check` 零错误
- [ ] **ESLint检查**: `npm run lint` 零错误  
- [ ] **代码格式**: `npm run format:check` 通过
- [ ] **单元测试**: `npm test` 全部通过
- [ ] **性能测试**: `npm run test:benchmark` 通过
- [ ] **构建测试**: `npm run build` 成功

### 📖 文档检查
- [ ] **README.md** 更新到最新版本
- [ ] **CHANGELOG.md** 包含新版本变更
- [ ] **API文档** 与代码同步
- [ ] **CLI命令文档** 完整准确
- [ ] **示例代码** 可以正常运行

### 🔧 功能验证
- [ ] **CLI基本功能**:
  - [ ] `taskflow --help` 显示正确
  - [ ] `taskflow --version` 显示正确版本
  - [ ] `taskflow init` 生成正确配置
  - [ ] `taskflow parse` 解析功能正常
  - [ ] `taskflow status` 状态管理正常
  - [ ] `taskflow mcp info` MCP信息正确

- [ ] **MCP集成**:
  - [ ] Cursor配置生成正确
  - [ ] Windsurf配置生成正确
  - [ ] Trae配置生成正确
  - [ ] VSCode配置生成正确

- [ ] **AI模型支持**:
  - [ ] DeepSeek API调用正常
  - [ ] 智谱AI API调用正常
  - [ ] 通义千问 API调用正常
  - [ ] 文心一言 API调用正常
  - [ ] 月之暗面 API调用正常
  - [ ] 讯飞星火 API调用正常

### 📦 包管理检查
- [ ] **package.json**:
  - [ ] 版本号正确递增
  - [ ] 依赖版本最新且稳定
  - [ ] 脚本命令完整
  - [ ] 关键字和描述准确

- [ ] **构建产物**:
  - [ ] `dist/` 目录包含所有必要文件
  - [ ] `bin/` 目录CLI可执行文件正确
  - [ ] 类型定义文件 `.d.ts` 完整
  - [ ] 源码映射文件存在

### 🔒 安全检查
- [ ] **依赖安全**: `npm audit` 无高危漏洞
- [ ] **API密钥**: 示例中无真实密钥
- [ ] **敏感信息**: 代码中无硬编码敏感数据
- [ ] **权限控制**: 文件权限设置正确

## 🚀 发布流程

### 1. 准备发布
```bash
# 确保在main分支
git checkout main
git pull origin main

# 运行完整检查
npm run quality
npm test
npm run build

# 检查CLI功能
node bin/index.js --help
```

### 2. 版本管理
```bash
# 选择合适的版本类型
npm run release:patch   # 1.2.0 -> 1.2.1 (bug修复)
npm run release:minor   # 1.2.0 -> 1.3.0 (新功能)
npm run release:major   # 1.2.0 -> 2.0.0 (破坏性更改)

# 或者使用交互式发布
npm run release
```

### 3. 验证发布
```bash
# 检查npm包
npm view taskflow-ai

# 检查GitHub发布
# 访问: https://github.com/Agions/taskflow-ai/releases

# 检查文档部署
# 访问: https://agions.github.io/taskflow-ai/
```

### 4. 发布后验证
```bash
# 全局安装测试
npm install -g taskflow-ai@latest

# 功能测试
mkdir test-install
cd test-install
taskflow init
taskflow --version
```

## 📊 发布后任务

### 📢 宣传推广
- [ ] **GitHub Release Notes** 发布
- [ ] **npm包页面** 更新
- [ ] **文档网站** 部署成功
- [ ] **社交媒体** 发布动态
- [ ] **技术社区** 分享更新

### 📈 监控指标
- [ ] **下载量**: npm包下载统计
- [ ] **GitHub Stars**: 关注度增长
- [ ] **Issues**: 用户反馈收集
- [ ] **性能**: 运行时性能监控
- [ ] **错误**: 错误报告收集

### 🔄 后续维护
- [ ] **用户反馈**: 及时回复Issues
- [ ] **Bug修复**: 快速响应问题
- [ ] **文档更新**: 根据反馈完善
- [ ] **功能迭代**: 规划下一版本

## 🆘 回滚计划

如果发布出现问题，按以下步骤回滚：

### 1. npm包回滚
```bash
# 废弃有问题的版本
npm deprecate taskflow-ai@x.x.x "This version has issues, please use x.x.x-1"

# 如果必要，撤销发布（24小时内）
npm unpublish taskflow-ai@x.x.x
```

### 2. Git回滚
```bash
# 删除有问题的标签
git tag -d vx.x.x
git push origin :refs/tags/vx.x.x

# 回滚提交（如果必要）
git revert <commit-hash>
git push origin main
```

### 3. 文档回滚
```bash
# 重新部署上一版本文档
git checkout <previous-version-tag>
npm run docs:deploy
git checkout main
```

## 📞 联系信息

**发布负责人**: Agions
**技术支持**: https://github.com/Agions/taskflow-ai/issues
**文档网站**: https://agions.github.io/taskflow-ai/

---

**注意**: 每次发布前请仔细检查此清单，确保所有项目都已完成。
