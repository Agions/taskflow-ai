# TaskFlow AI 用户指南

## 简介

TaskFlow AI 是一个智能的项目需求文档(PRD)解析和任务管理工具，能够自动将产品需求文档转换为结构化的任务计划，并提供智能的任务编排和执行建议。

## 核心功能

- **PRD智能解析**: 支持Markdown、JSON等格式的PRD文档解析
- **任务自动生成**: 基于需求自动生成详细的任务计划
- **智能任务编排**: 分析任务依赖关系，优化执行顺序
- **多模型支持**: 集成国产大模型（DeepSeek、智谱GLM、通义千问等）
- **可视化管理**: 提供任务进度可视化和项目统计
- **MCP协议支持**: 兼容Model Context Protocol标准

## 安装指南

### 系统要求

- Node.js 18.0.0 或更高版本
- npm 或 yarn 包管理器
- 操作系统：Windows、macOS、Linux

### 安装步骤

#### 1. 通过 npm 安装

```bash
npm install -g taskflow-ai
```

#### 2. 通过源码安装

```bash
# 克隆仓库
git clone https://github.com/your-org/taskflow-ai.git
cd taskflow-ai

# 安装依赖
npm install

# 构建项目
npm run build

# 全局安装
npm link
```

### 验证安装

```bash
taskflow-ai --version
```

## 快速开始

### 1. 初始化配置

首次使用需要配置API密钥：

```bash
taskflow-ai config set models.apiKeys.deepseek "your-deepseek-api-key"
```

### 2. 解析PRD文档

```bash
# 解析Markdown格式的PRD
taskflow-ai parse ./docs/product-requirements.md

# 指定输出路径
taskflow-ai parse ./docs/prd.md --output ./output/tasks.json

# 使用特定模型
taskflow-ai parse ./docs/prd.md --model zhipu
```

### 3. 生成任务计划

```bash
# 从PRD生成任务计划
taskflow-ai generate-tasks ./docs/prd.md

# 生成并保存任务计划
taskflow-ai generate-tasks ./docs/prd.md --output ./tasks/plan.json
```

### 4. 启动Web界面

```bash
# 启动本地Web服务
taskflow-ai serve --port 3000

# 在浏览器中访问 http://localhost:3000
```

## 配置说明

### 配置文件位置

- 全局配置：`~/.taskflow-ai/config.json`
- 项目配置：`./taskflow-ai.config.json`

### 主要配置项

```json
{
  "models": {
    "default": "deepseek",
    "apiKeys": {
      "deepseek": "your-api-key",
      "zhipu": "your-zhipu-key",
      "qwen": "your-qwen-key"
    },
    "endpoints": {
      "deepseek": "https://api.deepseek.com",
      "zhipu": "https://open.bigmodel.cn/api/paas/v4/",
      "qwen": "https://dashscope.aliyuncs.com/api/v1/"
    }
  },
  "ui": {
    "theme": "light",
    "language": "zh-CN"
  },
  "features": {
    "autoSave": true,
    "notifications": true
  }
}
```

### 配置命令

```bash
# 查看当前配置
taskflow-ai config list

# 设置配置项
taskflow-ai config set models.default "zhipu"

# 获取配置项
taskflow-ai config get models.default

# 重置配置
taskflow-ai config reset
```

## 使用示例

### 示例1：解析简单PRD

创建一个PRD文件 `example.md`：

```markdown
# 用户管理系统

## 功能需求

### 用户注册
- 用户可以通过邮箱注册账号
- 需要验证邮箱有效性
- 密码强度要求：至少8位，包含字母和数字

### 用户登录
- 支持邮箱和用户名登录
- 登录失败3次后锁定账号
- 支持记住登录状态

## 非功能需求

### 性能要求
- 登录响应时间 < 2秒
- 支持1000并发用户

### 安全要求
- 密码加密存储
- 支持HTTPS
```

解析PRD：

```bash
taskflow-ai parse example.md --output tasks.json
```

生成的任务计划将包含：
- 数据库设计任务
- 用户注册功能开发
- 用户登录功能开发
- 安全性实现
- 性能优化
- 测试任务

### 示例2：使用API

```javascript
const { TaskFlowService } = require('taskflow-ai');

const service = new TaskFlowService();

// 解析PRD
const prdContent = `
# 电商平台
## 功能需求
### 商品管理
- 商品添加、编辑、删除
- 商品分类管理
`;

const result = await service.parsePRD(prdContent, 'markdown');
console.log(result);

// 生成任务计划
const taskPlan = await service.generateTaskPlan(result.data);
console.log(taskPlan);
```

## 高级功能

### 自定义任务模板

创建自定义任务模板文件 `templates/custom.json`：

```json
{
  "name": "自定义开发模板",
  "tasks": [
    {
      "type": "analysis",
      "template": "需求分析：{requirement}",
      "estimatedHours": 4
    },
    {
      "type": "design",
      "template": "设计方案：{requirement}",
      "estimatedHours": 8
    }
  ]
}
```

使用自定义模板：

```bash
taskflow-ai generate-tasks prd.md --template ./templates/custom.json
```

### 任务依赖管理

TaskFlow AI 自动分析任务依赖关系：

- **前置依赖**: 必须完成的前置任务
- **并行任务**: 可以同时进行的任务
- **里程碑**: 重要的检查点

### 进度跟踪

```bash
# 查看项目进度
taskflow-ai status

# 更新任务状态
taskflow-ai update-task <task-id> --status completed

# 生成进度报告
taskflow-ai report --format html
```

## 故障排除

### 常见问题

#### 1. API密钥配置错误

**问题**: 提示"API密钥无效"

**解决方案**:
```bash
# 检查配置
taskflow-ai config get models.apiKeys

# 重新设置密钥
taskflow-ai config set models.apiKeys.deepseek "correct-api-key"
```

#### 2. 解析失败

**问题**: PRD解析失败

**解决方案**:
- 检查PRD格式是否正确
- 确保文件编码为UTF-8
- 尝试使用不同的模型

#### 3. 网络连接问题

**问题**: 无法连接到模型API

**解决方案**:
```bash
# 检查网络连接
ping api.deepseek.com

# 配置代理（如需要）
taskflow-ai config set proxy.http "http://proxy:8080"
```

### 日志调试

启用详细日志：

```bash
# 设置日志级别
taskflow-ai config set logger.level debug

# 查看日志文件
tail -f ~/.taskflow-ai/logs/taskflow.log
```

## 更新和维护

### 更新软件

```bash
# 检查更新
taskflow-ai --version
npm list -g taskflow-ai

# 更新到最新版本
npm update -g taskflow-ai
```

### 备份配置

```bash
# 备份配置
cp ~/.taskflow-ai/config.json ~/taskflow-ai-config-backup.json

# 恢复配置
cp ~/taskflow-ai-config-backup.json ~/.taskflow-ai/config.json
```

## 支持和反馈

- **GitHub**: [https://github.com/agions/taskflow-ai](https://github.com/agions/taskflow-ai)
- **问题反馈**: [GitHub Issues](https://github.com/agions/taskflow-ai/issues)
- **社区讨论**: [GitHub Discussions](https://github.com/agions/taskflow-ai/discussions)

## 许可证

本项目采用 MIT 许可证，详见 [LICENSE](../LICENSE) 文件。
