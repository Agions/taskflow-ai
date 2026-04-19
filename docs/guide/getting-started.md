# 快速开始教程

## 欢迎使用 TaskFlow AI

这个5分钟的快速教程将帮助你在现有项目中集成 TaskFlow AI，体验智能PRD解析和任务管理的强大功能。

## 🎯 学习目标

完成本教程后，你将能够：

- ✅ 安装和配置 TaskFlow AI
- ✅ 在现有项目中集成 TaskFlow AI
- ✅ 解析PRD文档并生成任务
- ✅ 管理任务状态和进度
- ✅ 跟踪项目进展

## 📋 前置要求

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **现有项目**: 任何类型的开发项目（前端、后端、移动应用等）
- **PRD文档**: 产品需求文档（Markdown格式推荐）
- **AI模型API密钥**: 至少一个（DeepSeek、智谱AI、通义千问等）

## 🚀 第一步：安装 TaskFlow AI

### 全局安装

```bash
# 安装 TaskFlow AI
npm install -g taskflow-ai

# 验证安装
taskflow --version
```

如果看到版本号输出，说明安装成功！

### 可能遇到的问题

如果遇到权限错误，请参考：

```bash
# macOS/Linux 用户
sudo npm install -g taskflow-ai

# 或配置 npm 全局目录（推荐）
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g taskflow-ai
```

## ⚙️ 第二步：初始配置

### 创建配置文件

```bash
# 初始化配置
taskflow config init
```

这将在你的用户目录下创建 `.taskflow/config.json` 配置文件。

### 配置AI模型

选择一个你有API密钥的模型进行配置：

#### 配置 DeepSeek（推荐）

```bash
# 设置 DeepSeek API 密钥
taskflow config set models.deepseek.apiKey "your-deepseek-api-key"
```

#### 配置智谱AI

```bash
# 设置智谱AI API 密钥
taskflow config set models.zhipu.apiKey "your-zhipu-api-key"
```

#### 配置通义千问

```bash
# 设置通义千问 API 密钥
taskflow config set models.qwen.apiKey "your-qwen-api-key"
```

### 验证配置

```bash
# 验证配置是否正确
taskflow config validate

# 测试AI模型连接
taskflow models test
```

如果看到 "✅ 配置验证通过" 和 "✅ 模型连接成功"，说明配置完成！

## 📁 第三步：在现有项目中集成TaskFlow AI

### 进入现有项目

```bash
# 进入你的现有项目目录（任何类型的项目都可以）
cd your-existing-project

# 例如：React项目
cd my-react-app

# 或者：Python项目
cd my-python-api

# 或者：任何其他项目
cd my-mobile-app
```

### 初始化TaskFlow AI配置

```bash
# 在项目中初始化TaskFlow AI配置
taskflow init

# 查看生成的配置文件
ls -la .taskflow/
```

TaskFlow AI 会在你的项目中创建：

- `.taskflow/config.json` - TaskFlow AI 配置文件
- `.taskflow/tasks.json` - 任务数据存储
- `.taskflow/cache/` - 缓存目录

### 项目集成后的结构

```
your-existing-project/
├── src/                  # 你的原有源代码
├── docs/                 # 你的原有文档
├── package.json          # 你的原有配置
├── .taskflow/            # TaskFlow AI 配置目录
│   ├── config.json       # TaskFlow AI 配置
│   ├── tasks.json        # 任务数据
│   └── cache/            # 缓存目录
└── ...                   # 你的其他原有文件
```

**重要**: TaskFlow AI 不会修改你的现有项目结构，只是添加自己的配置目录。

## 📄 第四步：准备PRD文档

### 使用现有PRD文档

如果你的项目已经有PRD文档，可以直接使用：

```bash
# 查看项目中的文档
ls docs/
ls requirements/
ls specifications/

# 常见的PRD文档位置
docs/requirements.md
docs/product-requirements.md
requirements/user-stories.md
```

### 创建示例PRD文档

如果没有PRD文档，让我们创建一个简单的示例：

```bash
# 在项目文档目录中创建PRD文档
mkdir -p docs
cat > docs/requirements.md << 'EOF'
# 用户管理功能 PRD

## 项目概述
为现有系统添加用户管理功能，支持用户注册、登录、个人信息管理等基本功能。

## 功能需求

### 1. 用户注册
- 用户可以通过邮箱和密码注册账号
- 需要验证邮箱格式和密码强度
- 注册成功后发送确认邮件

**验收标准：**
- 邮箱格式验证正确
- 密码长度至少8位，包含字母和数字
- 注册成功后跳转到登录页面

### 2. 用户登录
- 用户可以通过邮箱和密码登录
- 支持"记住我"功能
- 登录失败时显示错误提示

**验收标准：**
- 登录成功后跳转到用户仪表板
- 错误提示信息清晰明确
- "记住我"功能正常工作

### 3. 个人信息管理
- 用户可以查看和编辑个人信息
- 支持头像上传
- 支持密码修改

**验收标准：**
- 信息修改后立即生效
- 头像上传支持常见图片格式
- 密码修改需要验证原密码

## 技术要求
- 集成到现有项目架构
- 保持与现有代码风格一致
- 确保数据安全和用户隐私

## 优先级
1. 用户登录（高）
2. 用户注册（高）
3. 个人信息管理（中）
EOF
```

## 🤖 第五步：解析PRD文档

现在让我们使用 TaskFlow AI 解析PRD文档：

```bash
# 解析项目中的PRD文档
taskflow parse docs/requirements.md

# 或者解析其他位置的PRD文档
taskflow parse requirements/user-stories.md
```

解析过程中你会看到：

1. 📄 正在读取文档...
2. 🤖 AI模型分析中...
3. 📋 生成任务列表...
4. ✅ 解析完成！

### 查看解析结果

```bash
# 查看生成的任务列表
taskflow status list
```

你应该会看到类似这样的输出：

```
📋 任务列表

┌─────────────┬──────────────────────────┬──────────┬──────────┬──────────┐
│ ID          │ 任务名称                 │ 状态     │ 优先级   │ 预估工时 │
├─────────────┼──────────────────────────┼──────────┼──────────┼──────────┤
│ task-001    │ 实现用户注册功能         │ 未开始   │ 高       │ 8小时    │
│ task-002    │ 实现用户登录功能         │ 未开始   │ 高       │ 6小时    │
│ task-003    │ 实现个人信息管理         │ 未开始   │ 中       │ 10小时   │
│ task-004    │ 设计数据库表结构         │ 未开始   │ 高       │ 4小时    │
│ task-005    │ 实现JWT认证中间件        │ 未开始   │ 高       │ 6小时    │
└─────────────┴──────────────────────────┴──────────┴──────────┴──────────┘

📊 项目统计
- 总任务数: 5
- 未开始: 5
- 进行中: 0
- 已完成: 0
- 总预估工时: 34小时
```

## 📊 第六步：管理任务状态

### 查看项目进度

```bash
# 查看整体进度
taskflow status progress
```

### 开始第一个任务

```bash
# 获取下一个推荐任务
taskflow status next

# 将任务标记为进行中
taskflow status update task-001 in_progress
```

### 完成任务

```bash
# 标记任务完成
taskflow status update task-001 completed --comment "用户注册功能已实现并测试通过"

# 查看更新后的进度
taskflow status progress
```

### 查看任务详情

```bash
# 查看特定任务的详细信息
taskflow status show task-001
```

## 🎮 第七步：体验交互式模式

TaskFlow AI 提供了友好的交互式界面：

```bash
# 启动交互式模式
taskflow interactive
```

在交互式模式中，你可以：

- 📋 浏览任务列表
- ✏️ 更新任务状态
- 📊 查看项目进度
- ⚙️ 管理配置
- 🔍 搜索和过滤任务

使用方向键导航，回车键选择，ESC键返回。

## 🎯 第八步：高级功能体验

### 多模型协同

如果你配置了多个AI模型，可以启用多模型协同：

```bash
# 启用多模型支持
taskflow config set multiModel.enabled true
taskflow config set multiModel.primary "deepseek"
taskflow config set multiModel.fallback '["zhipu", "qwen"]'

# 使用多模型解析
taskflow parse requirements.md --multi-model
```

### 任务依赖分析

```bash
# 查看任务依赖关系
taskflow status dependencies

# 生成依赖关系图
taskflow status dependencies --graph
```

### 性能监控

```bash
# 启用性能监控
taskflow config set performance.enableMonitoring true

# 查看性能统计
taskflow performance stats
```

## 🎉 恭喜！你已经完成了快速开始教程

你现在已经学会了：

- ✅ 安装和配置 TaskFlow AI
- ✅ 创建项目和解析PRD文档
- ✅ 管理任务状态和进度
- ✅ 使用交互式模式
- ✅ 体验高级功能

## 🚀 下一步

现在你可以：

1. **深入学习**：
   - [用户手册](../user-guide/user-manual.md) - 详细的功能说明
   - [高级功能指南](./advanced-features.md) - 探索更多功能
   - [CLI命令参考](../cli/commands.md) - 完整的命令列表

2. **实际应用**：
   - 使用你的真实PRD文档
   - 配置团队协作流程
   - 集成到现有开发工作流

3. **自定义配置**：
   - [配置参考](../reference/configuration.md) - 详细的配置选项
   - 优化性能设置
   - 配置多模型策略

4. **获取帮助**：
   - [故障排除指南](../troubleshooting/common-issues.md) - 常见问题解决
   - [GitHub Issues](https://github.com/agions/taskflow-ai/issues) - 报告问题
   - [讨论区](https://github.com/Agions/taskflow-ai/issues) - 社区交流

## 💡 小贴士

- **定期备份**：使用 `taskflow backup create` 备份你的配置和数据
- **保持更新**：定期运行 `npm update -g taskflow-ai` 获取最新功能
- **监控使用**：使用 `taskflow models stats` 监控API使用情况
- **优化配置**：根据使用情况调整缓存和并发设置

## 🤝 加入社区

- **GitHub**: [Star 项目](https://github.com/agions/taskflow-ai) 支持我们
- **讨论**: 参与 [GitHub Discussions](https://github.com/Agions/taskflow-ai/issues)
- **贡献**: 查看 [贡献指南](../../CONTRIBUTING.md) 了解如何参与开发

---

**开始你的智能开发之旅吧！** 🚀

如果在使用过程中遇到任何问题，请随时查看文档或联系我们。
