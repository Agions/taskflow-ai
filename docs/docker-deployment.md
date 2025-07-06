# TaskFlow AI - Docker 部署指南

本文档介绍如何使用Docker在本地环境构建、测试和发布TaskFlow AI。

## 🐳 Docker 镜像

TaskFlow AI 提供两个主要的Docker镜像：

### 1. 主应用镜像
- **镜像名称**: `agions/taskflow-ai`
- **用途**: TaskFlow AI 主应用程序
- **标签**:
  - `latest`: 最新稳定版本
  - `v1.x.x`: 特定版本
  - `dev`: 开发版本

### 2. MCP 服务器镜像
- **镜像名称**: `agions/taskflow-ai-mcp`
- **用途**: Model Context Protocol 服务器
- **标签**:
  - `latest`: 最新稳定版本
  - `v1.x.x`: 特定版本

## 🚀 快速开始

### 使用 Docker Compose (推荐)

1. **克隆项目**
```bash
git clone https://github.com/Agions/taskflow-ai.git
cd taskflow-ai
```

2. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，填入您的API密钥
```

3. **启动服务**
```bash
# 启动主应用
docker-compose up taskflow-prod

# 启动MCP服务器
docker-compose --profile mcp up taskflow-mcp

# 启动所有服务
docker-compose --profile mcp up
```

### 使用 Docker 命令

1. **运行主应用**
```bash
docker run -d \
  --name taskflow-ai \
  -p 3000:3000 \
  -e QWEN_API_KEY=your_api_key \
  -v $(pwd)/data:/app/data \
  agions/taskflow-ai:latest
```

2. **运行MCP服务器**
```bash
docker run -d \
  --name taskflow-mcp \
  -p 3001:3001 \
  -e AI_MODEL=qwen \
  -e MCP_TRANSPORT=http \
  -v $(pwd)/data:/app/data \
  agions/taskflow-ai-mcp:latest
```

## 🔨 本地构建

### 使用构建脚本 (推荐)

```bash
# 构建所有镜像
npm run docker:build

# 构建并发布到Docker Hub
npm run docker:publish

# 构建、发布并清理本地镜像
npm run docker:publish:cleanup
```

### 手动构建

```bash
# 构建主应用镜像
docker build -t agions/taskflow-ai:latest .

# 构建MCP服务器镜像
docker build -f Dockerfile.mcp -t agions/taskflow-ai-mcp:latest .
```

## 📋 环境变量配置

### 必需的环境变量

```bash
# AI模型API密钥 (至少配置一个)
QWEN_API_KEY=your_qwen_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
ZHIPU_API_KEY=your_zhipu_api_key
```

### 可选的环境变量

```bash
# 应用配置
NODE_ENV=production
LOG_LEVEL=info
AI_MODEL=qwen

# MCP配置
MCP_TRANSPORT=stdio  # 或 http
MCP_PORT=3001

# 数据目录
TASKFLOW_DATA_DIR=/app/data
TASKFLOW_LOG_DIR=/app/logs
TASKFLOW_CONFIG_DIR=/app/config

# 性能配置
TASKFLOW_MAX_CONCURRENT_TASKS=10
TASKFLOW_MAX_REQUESTS_PER_MINUTE=100
```

## 📁 数据卷挂载

### 推荐的卷挂载

```bash
# 数据持久化
-v $(pwd)/data:/app/data

# 日志文件
-v $(pwd)/logs:/app/logs

# 配置文件
-v $(pwd)/config:/app/config

# 缓存目录
-v $(pwd)/.cache:/app/.cache
```

### Docker Compose 卷配置

```yaml
volumes:
  - taskflow-data:/app/data
  - taskflow-logs:/app/logs
  - taskflow-config:/app/config
  - ./config:/app/config/host:ro  # 主机配置只读
```

## 🌐 网络配置

### 端口映射

- **主应用**: `3000:3000`
- **MCP服务器**: `3001:3001`
- **开发环境**: `3002:3000`

### Docker Compose 网络

```yaml
networks:
  taskflow-network:
    driver: bridge
```

## 🔍 健康检查

### 主应用健康检查

```bash
# 检查应用状态
curl http://localhost:3000/health

# Docker健康检查
docker exec taskflow-ai node -e "console.log('Health check')"
```

### MCP服务器健康检查

```bash
# 检查MCP服务器状态
docker exec taskflow-mcp node -e "console.log('MCP Server healthy')"
```

## 🚀 发布到 Docker Hub

### 自动发布 (推荐)

```bash
# 设置Docker Hub凭据
export DOCKER_PASSWORD=your_docker_password

# 构建并发布
npm run docker:publish
```

### 手动发布

```bash
# 登录Docker Hub
docker login

# 推送镜像
docker push agions/taskflow-ai:latest
docker push agions/taskflow-ai-mcp:latest
```

## 🐛 故障排除

### 常见问题

1. **构建失败**
```bash
# 清理Docker缓存
docker system prune -f

# 重新构建
docker build --no-cache -t agions/taskflow-ai:latest .
```

2. **容器启动失败**
```bash
# 查看日志
docker logs taskflow-ai

# 进入容器调试
docker exec -it taskflow-ai /bin/sh
```

3. **权限问题**
```bash
# 修复数据目录权限
sudo chown -R 1001:1001 ./data ./logs
```

### 调试命令

```bash
# 查看容器状态
docker ps -a

# 查看镜像信息
docker images | grep taskflow

# 查看容器资源使用
docker stats taskflow-ai

# 查看容器详细信息
docker inspect taskflow-ai
```

## 📊 监控和日志

### 日志查看

```bash
# 实时查看日志
docker logs -f taskflow-ai

# 查看最近100行日志
docker logs --tail 100 taskflow-ai

# 查看特定时间段日志
docker logs --since "2024-01-01T00:00:00" taskflow-ai
```

### 性能监控

```bash
# 查看资源使用情况
docker stats taskflow-ai taskflow-mcp

# 查看容器进程
docker exec taskflow-ai ps aux
```

## 🔧 高级配置

### 多阶段构建

```dockerfile
# 生产环境
docker build --target production -t agions/taskflow-ai:prod .

# 开发环境
docker build --target development -t agions/taskflow-ai:dev .
```

### 自定义配置

```bash
# 使用自定义配置文件
docker run -v $(pwd)/custom-config.json:/app/config/config.json agions/taskflow-ai:latest
```

### 集群部署

```bash
# 使用Docker Swarm
docker stack deploy -c docker-compose.yml taskflow

# 使用Kubernetes
kubectl apply -f k8s/
```

## 📚 相关文档

- [Docker官方文档](https://docs.docker.com/)
- [Docker Compose文档](https://docs.docker.com/compose/)
- [TaskFlow AI配置指南](./configuration.md)
- [MCP服务器文档](../MCP-README.md)
