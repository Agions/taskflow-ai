# TaskFlow AI 快速开始指南

## 🚀 5分钟快速上手

### 第一步：安装 TaskFlow AI

```bash
# 全局安装（推荐）
npm install -g taskflow-ai

# 或者使用 yarn
yarn global add taskflow-ai

# 验证安装
taskflow-ai --version
```

### 第二步：初始化项目

```bash
# 创建新项目并生成AI编辑器配置
taskflow-ai init my-awesome-project

# 进入项目目录
cd my-awesome-project

# 查看生成的文件结构
ls -la
```

生成的项目结构：
```
my-awesome-project/
├── .cursor/              # Cursor AI 配置
│   ├── rules.md         # AI助手编程规范
│   └── settings.json    # Cursor设置
├── .vscode/             # VSCode 配置
│   ├── settings.json    # 编辑器设置
│   ├── extensions.json  # 推荐扩展
│   ├── tasks.json       # 构建任务
│   └── launch.json      # 调试配置
├── docs/                # 文档目录
│   └── example.md       # 示例PRD文档
├── tasks/               # 任务文件目录
├── tests/               # 测试目录
├── .eslintrc.json       # ESLint配置
├── .prettierrc.json     # Prettier配置
├── .gitignore           # Git忽略文件
├── README.md            # 项目说明
└── taskflow.config.json # TaskFlow配置
```

### 第三步：配置AI模型

```bash
# 配置DeepSeek API密钥（推荐，性价比高）
taskflow-ai config set models.apiKeys.deepseek "your-deepseek-api-key"

# 或配置智谱GLM
taskflow-ai config set models.apiKeys.zhipu "your-zhipu-api-key"

# 设置默认模型
taskflow-ai config set models.default "deepseek"

# 验证配置
taskflow-ai config list
```

### 第四步：解析你的第一个PRD

使用提供的示例PRD：

```bash
# 解析示例PRD文档
taskflow-ai parse docs/example.md

# 生成详细的任务计划
taskflow-ai plan docs/example.md --output tasks/project-plan.json

# 查看生成的任务
taskflow-ai tasks list
```

## 🎯 常用命令速查

### 项目初始化
```bash
# 完整初始化（所有配置）
taskflow-ai init project-name

# 只生成Cursor配置
taskflow-ai init project-name --editor cursor

# 只生成VSCode配置
taskflow-ai init project-name --editor vscode

# 跳过示例文件
taskflow-ai init project-name --no-examples

# 强制覆盖已有文件
taskflow-ai init project-name --force
```

### PRD解析
```bash
# 基本解析
taskflow-ai parse prd.md

# 指定输出路径
taskflow-ai parse prd.md --output tasks.json

# 使用特定模型
taskflow-ai parse prd.md --model zhipu

# 详细模式
taskflow-ai parse prd.md --verbose
```

### 任务管理
```bash
# 生成任务计划
taskflow-ai plan prd.md

# 查看所有任务
taskflow-ai tasks list

# 查看特定任务
taskflow-ai tasks show <task-id>

# 更新任务状态
taskflow-ai tasks update <task-id> --status completed

# 筛选任务
taskflow-ai tasks list --status in_progress --priority high
```

### 配置管理
```bash
# 查看所有配置
taskflow-ai config list

# 设置配置项
taskflow-ai config set key value

# 获取配置项
taskflow-ai config get key

# 重置配置
taskflow-ai config reset
```

## 📝 创建你的第一个PRD

创建文件 `my-prd.md`：

```markdown
# 智能待办事项应用

## 1. 项目概述
开发一个智能的待办事项管理应用，支持AI智能分类和优先级排序。

## 2. 功能需求

### 2.1 基础功能
- **任务创建**: 用户可以快速创建待办任务
- **任务编辑**: 支持修改任务内容、截止时间
- **任务删除**: 支持删除已完成或不需要的任务
- **任务分类**: 支持自定义分类标签

### 2.2 智能功能
- **AI分类**: 自动识别任务类型并分类
- **优先级排序**: 基于截止时间和重要性智能排序
- **智能提醒**: 根据用户习惯智能设置提醒时间

### 2.3 数据同步
- **云端同步**: 支持多设备数据同步
- **离线模式**: 支持离线使用，联网后自动同步
- **数据备份**: 定期自动备份用户数据

## 3. 技术要求

### 3.1 前端技术
- 框架：React 18 + TypeScript
- 状态管理：Redux Toolkit
- UI组件：Ant Design
- 构建工具：Vite

### 3.2 后端技术
- 运行时：Node.js + Express
- 数据库：MongoDB
- 认证：JWT
- AI服务：集成OpenAI API

### 3.3 部署要求
- 容器化：Docker
- 云服务：阿里云/腾讯云
- CDN：支持静态资源加速
- 监控：集成应用性能监控

## 4. 非功能需求

### 4.1 性能要求
- 页面加载时间 < 2秒
- API响应时间 < 500ms
- 支持1000+并发用户

### 4.2 安全要求
- 数据传输加密（HTTPS）
- 用户数据隐私保护
- 防止XSS和CSRF攻击

### 4.3 可用性要求
- 系统可用性 > 99.5%
- 支持7x24小时运行
- 故障恢复时间 < 30分钟
```

然后解析这个PRD：

```bash
# 解析PRD并生成任务计划
taskflow-ai parse my-prd.md --output my-tasks.json

# 生成开发计划
taskflow-ai plan my-prd.md --team-size 3 --sprint-duration 14

# 查看生成的任务
taskflow-ai tasks list --format table
```

## 🔧 高级配置

### 自定义模型配置

编辑 `taskflow.config.json`：

```json
{
  "models": {
    "default": "deepseek",
    "apiKeys": {
      "deepseek": "your-api-key",
      "zhipu": "your-zhipu-key"
    },
    "endpoints": {
      "deepseek": "https://api.deepseek.com",
      "zhipu": "https://open.bigmodel.cn/api/paas/v4/"
    },
    "options": {
      "temperature": 0.7,
      "maxTokens": 4000
    }
  },
  "parsing": {
    "extractSections": true,
    "extractFeatures": true,
    "prioritize": true
  },
  "planning": {
    "includeTests": true,
    "includeDocs": true,
    "defaultSprintDuration": 14,
    "defaultTeamSize": 5
  }
}
```

### 自定义任务模板

创建 `templates/custom-template.json`：

```json
{
  "name": "敏捷开发模板",
  "description": "适用于敏捷开发团队的任务模板",
  "phases": [
    {
      "name": "需求分析",
      "tasks": [
        {
          "type": "analysis",
          "template": "需求分析：{requirement}",
          "estimatedHours": 8,
          "priority": "high"
        }
      ]
    },
    {
      "name": "设计阶段",
      "tasks": [
        {
          "type": "design",
          "template": "UI/UX设计：{feature}",
          "estimatedHours": 16,
          "priority": "medium"
        }
      ]
    }
  ]
}
```

使用自定义模板：

```bash
taskflow-ai plan prd.md --template templates/custom-template.json
```

## 🚨 常见问题解决

### 问题1：API密钥无效
```bash
# 检查配置
taskflow-ai config get models.apiKeys

# 重新设置
taskflow-ai config set models.apiKeys.deepseek "new-api-key"

# 测试连接
taskflow-ai test-connection deepseek
```

### 问题2：解析失败
```bash
# 启用详细日志
taskflow-ai parse prd.md --verbose

# 尝试不同模型
taskflow-ai parse prd.md --model zhipu

# 检查文件编码
file -I prd.md
```

### 问题3：网络连接问题
```bash
# 配置代理
taskflow-ai config set proxy.http "http://proxy:8080"
taskflow-ai config set proxy.https "https://proxy:8080"

# 测试网络
ping api.deepseek.com
```

## 📚 下一步学习

1. **阅读完整文档**: [用户指南](./user-guide.md)
2. **API参考**: [API文档](./api-reference.md)
3. **查看示例**: [示例项目](../examples/)
4. **加入社区**: [GitHub讨论](https://github.com/agions/taskflow-ai/discussions)

## 🎉 恭喜！

你已经成功完成了TaskFlow AI的快速上手！现在你可以：

- ✅ 解析任何PRD文档
- ✅ 生成智能任务计划
- ✅ 使用AI编辑器优化配置
- ✅ 管理项目开发流程

开始你的智能项目管理之旅吧！🚀
