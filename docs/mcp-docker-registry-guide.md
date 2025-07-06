# TaskFlow AI - Docker MCP Registry 发布指南

本文档详细介绍如何使用本地Docker环境构建TaskFlow AI MCP服务器并发布到Docker MCP Registry。

## 🎯 概述

TaskFlow AI 现在完全支持通过本地Docker环境构建和发布MCP服务器，而不依赖GitHub Actions。这提供了更好的控制性、灵活性和企业级部署支持。

## 📋 准备工作

### 1. 环境要求

- **Docker**: 版本 20.10.0 或更高
- **Docker Compose**: 版本 2.0 或更高
- **Node.js**: 版本 18.0 或更高
- **Git**: 用于版本控制

### 2. 验证环境

```bash
# 检查Docker版本
docker --version
docker-compose --version

# 检查Docker是否运行
docker info

# 检查Node.js版本
node --version
npm --version
```

### 3. 克隆项目

```bash
git clone https://github.com/Agions/taskflow-ai.git
cd taskflow-ai
```

## 🔧 配置设置

### 1. 环境变量配置

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量文件
nano .env
```

**必需的配置**:
```bash
# AI模型API密钥 (至少配置一个)
QWEN_API_KEY=your_qwen_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Docker配置
DOCKER_USERNAME=your_docker_username
DOCKER_PASSWORD=your_docker_password

# MCP配置
MCP_TRANSPORT=stdio
AI_MODEL=qwen
```

### 2. Docker Hub 登录

```bash
# 方式1: 使用环境变量
export DOCKER_PASSWORD=your_docker_password

# 方式2: 手动登录
docker login docker.io
```

## 🏗️ 本地构建流程

### 1. 项目构建

```bash
# 安装依赖并构建项目
npm ci
npm run build

# 验证构建结果
ls -la dist/ bin/
```

### 2. Docker镜像构建

```bash
# 方式1: 使用NPM脚本 (推荐)
npm run docker:build

# 方式2: 使用构建脚本
bash scripts/docker-build-publish.sh --build-only

# 方式3: 手动构建
docker build -f Dockerfile.mcp -t agions/taskflow-ai-mcp:latest .
```

### 3. 镜像测试

```bash
# 测试MCP服务器镜像
docker run --rm agions/taskflow-ai-mcp:latest node -e "console.log('MCP test successful')"

# 测试主应用镜像
docker run --rm agions/taskflow-ai:latest --version

# 运行完整测试套件
npm run mcp:test
```

## 🚀 发布到Docker Hub

### 1. 自动化发布 (推荐)

```bash
# 完整构建和发布流程
npm run docker:publish

# 构建、发布并清理本地镜像
npm run docker:publish:cleanup
```

### 2. 分步发布

```bash
# 步骤1: 仅构建
npm run docker:build

# 步骤2: 仅发布
npm run docker:push
```

### 3. 手动发布

```bash
# 构建镜像
docker build -f Dockerfile.mcp -t agions/taskflow-ai-mcp:latest .
docker build -f Dockerfile.mcp -t agions/taskflow-ai-mcp:v1.3.1 .

# 推送镜像
docker push agions/taskflow-ai-mcp:latest
docker push agions/taskflow-ai-mcp:v1.3.1
```

## 📦 Docker MCP Registry 提交

### 1. 准备提交文件

项目已包含所有必需的Docker MCP Registry提交文件：

- `mcp-server.json`: MCP服务器元数据
- `docker-mcp-registry.yaml`: Docker MCP Registry规范
- `Dockerfile.mcp`: MCP服务器Docker镜像
- `MCP-README.md`: MCP服务器文档

### 2. 验证提交文件

```bash
# 验证MCP配置
npm run mcp:test

# 验证Docker镜像
docker run --rm agions/taskflow-ai-mcp:latest
```

### 3. 提交到Docker MCP Registry

```bash
# 使用自动化提交脚本
bash scripts/submit-to-docker-mcp-registry.sh

# 按照脚本提示完成以下步骤:
# 1. Fork docker/mcp-registry 仓库
# 2. 推送提交分支到您的fork
# 3. 创建Pull Request
```

## 🐳 Docker Compose 部署

### 1. 启动MCP服务器

```bash
# 启动MCP服务器
docker-compose --profile mcp up taskflow-mcp

# 后台运行
docker-compose --profile mcp up -d taskflow-mcp
```

### 2. 启动完整服务

```bash
# 启动所有服务
docker-compose --profile mcp up

# 仅启动主应用
docker-compose up taskflow-prod
```

### 3. 开发环境

```bash
# 启动开发环境
docker-compose --profile dev up taskflow-dev
```

## 🔍 验证和测试

### 1. 服务健康检查

```bash
# 检查容器状态
docker ps

# 检查健康状态
docker inspect taskflow-ai-mcp | grep Health

# 查看日志
docker logs taskflow-ai-mcp
```

### 2. MCP功能测试

```bash
# 测试MCP服务器
docker exec taskflow-ai-mcp node bin/index.js mcp server --help

# 测试工具功能
docker exec taskflow-ai-mcp node -e "
const { TaskFlowMCPServer } = require('./dist/mcp/server.js');
console.log('MCP Server loaded successfully');
"
```

### 3. 集成测试

```bash
# 运行完整测试套件
npm test

# 运行MCP特定测试
npm run mcp:test

# 运行Docker构建测试
bash scripts/docker-build-publish.sh --build-only --no-test
```

## 📊 监控和维护

### 1. 日志管理

```bash
# 查看实时日志
docker logs -f taskflow-ai-mcp

# 查看特定时间段日志
docker logs --since "1h" taskflow-ai-mcp

# 导出日志
docker logs taskflow-ai-mcp > mcp-server.log
```

### 2. 性能监控

```bash
# 查看资源使用
docker stats taskflow-ai-mcp

# 查看容器详情
docker inspect taskflow-ai-mcp
```

### 3. 更新和维护

```bash
# 更新镜像
docker pull agions/taskflow-ai-mcp:latest

# 重启服务
docker-compose restart taskflow-mcp

# 清理旧镜像
docker image prune -f
```

## 🛠️ 故障排除

### 常见问题

1. **构建失败**
```bash
# 清理Docker缓存
docker system prune -f

# 重新构建
npm run docker:build
```

2. **推送失败**
```bash
# 检查登录状态
docker info | grep Username

# 重新登录
docker login docker.io
```

3. **容器启动失败**
```bash
# 检查环境变量
docker exec taskflow-ai-mcp env | grep TASKFLOW

# 检查配置文件
docker exec taskflow-ai-mcp cat /app/mcp-server.json
```

### 调试命令

```bash
# 进入容器调试
docker exec -it taskflow-ai-mcp /bin/sh

# 查看容器文件系统
docker exec taskflow-ai-mcp ls -la /app

# 测试网络连接
docker exec taskflow-ai-mcp ping google.com
```

## 🎉 成功发布

完成以上步骤后，您的TaskFlow AI MCP服务器将：

1. ✅ 在Docker Hub上可用: `agions/taskflow-ai-mcp`
2. ✅ 提交到Docker MCP Registry等待审核
3. ✅ 支持本地Docker Compose部署
4. ✅ 提供完整的企业级功能

## 📚 相关资源

- [Docker MCP Registry](https://github.com/docker/mcp-registry)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [TaskFlow AI文档](../README.md)
- [Docker部署指南](./docker-deployment.md)
