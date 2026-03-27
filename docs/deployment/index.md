# TaskFlow AI 部署指南

## 📋 概述

本文档详细介绍了TaskFlow AI的部署方法，包括本地部署、服务器部署和容器化部署等多种方式。

## 🔧 系统要求

### 最低要求
- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **内存**: >= 2GB
- **磁盘空间**: >= 1GB

### 推荐配置
- **Node.js**: >= 20.0.0
- **npm**: >= 10.0.0
- **内存**: >= 4GB
- **磁盘空间**: >= 5GB

### 支持的操作系统
- Windows 10/11
- macOS 10.15+
- Linux (Ubuntu 18.04+, CentOS 7+)

## 📦 安装方式

### 方式1: npm全局安装（推荐）

```bash
# 安装最新版本
npm install -g taskflow-ai

# 验证安装
taskflow --version
taskflow --help
```

### 方式2: 从源码构建

```bash
# 克隆仓库
git clone https://github.com/Agions/taskflow-ai.git
cd taskflow-ai

# 安装依赖
npm install

# 构建项目
npm run build

# 全局链接
npm link

# 验证安装
taskflow --version
```


## ⚙️ 配置设置

### 1. 初始化配置

```bash
# 在项目目录中初始化
cd your-project
taskflow init

# 强制重新初始化
taskflow init --force
```

### 2. 环境变量配置

创建 `.env` 文件：

```bash
# AI模型配置
DEEPSEEK_API_KEY=your_deepseek_key
ZHIPU_API_KEY=your_zhipu_key
QWEN_API_KEY=your_qwen_key
BAIDU_API_KEY=your_baidu_key
MOONSHOT_API_KEY=your_moonshot_key
SPARK_API_KEY=your_spark_key

# 日志配置
LOG_LEVEL=info
LOG_FILE=taskflow.log

# 性能配置
MAX_CONCURRENT_REQUESTS=5
REQUEST_TIMEOUT=30000
```

### 3. 配置验证

```bash
# 验证配置
taskflow config validate

# 查看当前配置
taskflow config list

# 测试AI模型连接
taskflow models test
```

## 🚀 部署场景

### 场景1: 个人开发环境

```bash
# 1. 全局安装
npm install -g taskflow-ai

# 2. 项目初始化
cd your-project
taskflow init

# 3. 配置API密钥
taskflow config set models.deepseek.apiKey "your-key"

# 4. 开始使用
taskflow parse docs/requirements.md
```

### 场景2: 团队协作环境

```bash
# 1. 项目级安装
npm install --save-dev taskflow-ai

# 2. 添加npm脚本到package.json
{
  "scripts": {
    "taskflow": "taskflow",
    "parse-prd": "taskflow parse docs/prd.md",
    "task-status": "taskflow status list"
  }
}

# 3. 团队成员使用
npm run parse-prd
npm run task-status
```

### 场景3: CI/CD集成

```yaml
# .github/workflows/taskflow.yml
name: TaskFlow AI Integration

on:
  push:
    paths:
      - 'docs/**/*.md'
  pull_request:
    paths:
      - 'docs/**/*.md'

jobs:
  parse-requirements:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install TaskFlow AI
        run: npm install -g taskflow-ai
        
      - name: Parse PRD
        run: taskflow parse docs/requirements.md
        env:
          DEEPSEEK_API_KEY: ${{ secrets.DEEPSEEK_API_KEY }}
          
      - name: Upload task plan
        uses: actions/upload-artifact@v3
        with:
          name: task-plan
          path: taskflow/tasks.json
```



# 切换用户
USER taskflow

# 设置入口点
ENTRYPOINT ["taskflow"]
CMD ["--help"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  taskflow:
    build: .
    volumes:
      - ./docs:/workspace/docs
      - ./taskflow:/workspace/taskflow
    working_dir: /workspace
    environment:
      - DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
      - ZHIPU_API_KEY=${ZHIPU_API_KEY}
    command: ["parse", "docs/requirements.md"]
```

## 🔒 安全配置

### 1. API密钥管理

```bash
# 使用环境变量（推荐）
export DEEPSEEK_API_KEY="your-key"

# 或使用配置文件（加密存储）
taskflow config set models.deepseek.apiKey "your-key"

# 验证密钥安全性
taskflow config validate --security-check
```

### 2. 网络安全

```bash
# 配置代理（如果需要）
taskflow config set network.proxy "http://proxy.company.com:8080"

# 配置超时
taskflow config set network.timeout 30000

# 启用SSL验证
taskflow config set network.ssl.verify true
```

### 3. 数据安全

```bash
# 启用数据加密
taskflow config set security.encryption.enabled true

# 设置数据保留期
taskflow config set security.dataRetention 30

# 配置日志级别
taskflow config set logging.level info
```

## 📊 监控和维护

### 1. 健康检查

```bash
# 系统状态检查
taskflow status system

# 模型连接检查
taskflow models status

# 配置完整性检查
taskflow config validate
```

### 2. 日志管理

```bash
# 查看日志
tail -f ~/.taskflow/logs/taskflow.log

# 日志轮转配置
taskflow config set logging.rotation.enabled true
taskflow config set logging.rotation.maxSize "10MB"
taskflow config set logging.rotation.maxFiles 5
```

### 3. 性能优化

```bash
# 性能监控
taskflow status performance

# 缓存清理
taskflow cache clear

# 配置优化
taskflow config optimize
```

## 🔄 升级和迁移

### 升级到新版本

```bash
# 检查当前版本
taskflow --version

# 升级到最新版本
npm update -g taskflow-ai

# 验证升级
taskflow --version
taskflow config validate
```

### 配置迁移

```bash
# 备份当前配置
taskflow config export > taskflow-config-backup.json

# 升级后恢复配置
taskflow config import taskflow-config-backup.json

# 验证迁移
taskflow config validate
```

## 🆘 故障排除

### 常见问题

1. **安装失败**
   ```bash
   # 清理npm缓存
   npm cache clean --force
   
   # 重新安装
   npm install -g taskflow-ai
   ```

2. **权限问题**
   ```bash
   # 修复npm权限
   sudo chown -R $(whoami) ~/.npm
   
   # 或使用nvm
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 20
   nvm use 20
   ```

3. **API连接失败**
   ```bash
   # 检查网络连接
   taskflow models test --verbose
   
   # 检查API密钥
   taskflow config get models.deepseek.apiKey
   ```

### 获取支持

- **文档**: https://agions.github.io/taskflow-ai/
- **GitHub Issues**: https://github.com/Agions/taskflow-ai/issues
- **讨论区**: https://github.com/Agions/taskflow-ai/discussions

## 📚 相关文档

- [快速开始](../getting-started.md)
- [配置参考](../reference/configuration.md)
- [API文档](../api/)
- [故障排除](../troubleshooting/common-issues.md)
- [测试指南](../testing/index.md)
