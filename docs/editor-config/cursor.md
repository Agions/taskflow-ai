# Cursor AI 编辑器配置

## 📖 概述

Cursor是一款基于AI的智能代码编辑器，TaskFlow AI为其提供了专门的配置文件生成功能。

## 🚀 快速开始

### 生成Cursor配置

```bash
# 使用TaskFlow AI CLI生成Cursor配置
taskflow init --editor cursor

# 或者在交互模式中选择Cursor
taskflow interactive
```

### 配置文件位置

生成的配置文件将保存在：
- `.cursor-rules` - Cursor AI行为规则
- `.cursor/mcp.json` - MCP服务配置

## ⚙️ 配置选项

### 基本配置

TaskFlow AI会根据您的项目类型自动生成适合的Cursor配置：

- **项目类型检测**: 自动识别React、Vue、Node.js等项目类型
- **语言支持**: TypeScript、JavaScript、Python等
- **框架集成**: 针对不同框架优化的规则

### AI行为规则

生成的`.cursor-rules`文件包含：

1. **代码风格规范**
   - 命名约定
   - 格式化规则
   - 最佳实践

2. **框架特定规则**
   - React组件规范
   - TypeScript类型定义
   - 测试编写指南

3. **项目约定**
   - 文件组织结构
   - 导入导出规范
   - 错误处理模式

## 🔧 高级配置

### 自定义规则

您可以在生成的配置基础上进行自定义：

```markdown
# 在.cursor-rules文件中添加自定义规则

## 自定义代码风格
- 使用4个空格缩进
- 行长度限制为100字符
- 优先使用const和let，避免var

## 项目特定规则
- 组件文件使用PascalCase命名
- 工具函数文件使用camelCase命名
- 常量文件使用UPPER_SNAKE_CASE命名
```

### MCP服务集成

TaskFlow AI通过MCP协议与Cursor集成：

```json
{
  "mcpServers": {
    "taskflow-ai": {
      "command": "npx",
      "args": ["taskflow-ai", "mcp"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## 📋 功能特性

### 智能代码生成

- **上下文感知**: 基于项目结构和现有代码
- **最佳实践**: 遵循行业标准和团队约定
- **类型安全**: TypeScript项目的完整类型支持

### 实时协助

- **代码补全**: 智能的代码建议
- **错误检测**: 实时发现潜在问题
- **重构建议**: 代码优化建议

### 项目管理

- **任务分解**: 将需求转换为具体任务
- **进度跟踪**: 开发进度可视化
- **文档生成**: 自动生成项目文档

## 🛠️ 故障排除

### 常见问题

1. **配置文件未生效**
   - 检查文件路径是否正确
   - 重启Cursor编辑器
   - 验证JSON格式是否正确

2. **MCP服务连接失败**
   - 确认TaskFlow AI已正确安装
   - 检查网络连接
   - 查看Cursor控制台错误信息

3. **AI建议不准确**
   - 更新项目配置信息
   - 检查代码上下文
   - 调整AI规则设置

### 调试模式

启用调试模式获取更多信息：

```bash
# 启用详细日志
DEBUG=taskflow:* taskflow init --editor cursor

# 验证配置
taskflow validate --editor cursor
```

## 📚 相关资源

- [Cursor官方文档](https://cursor.sh/docs)
- [MCP协议规范](https://modelcontextprotocol.io/)
- [TaskFlow AI用户指南](/guide/getting-started)
- [配置参考](/reference/configuration)

## 🔄 更新配置

当项目结构或需求发生变化时，可以重新生成配置：

```bash
# 更新现有配置
taskflow update --editor cursor

# 强制重新生成
taskflow init --editor cursor --force
```

---

> **提示**: 建议定期更新Cursor配置以获得最新的AI功能和最佳实践。
