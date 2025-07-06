# Docker 部署指南

## 概述

TaskFlow AI 提供完整的 Docker 容器化支持，包括生产环境和开发环境的优化配置。本指南将详细介绍如何使用 Docker 部署和运行 TaskFlow AI。

## 🐳 快速开始

### 使用预构建镜像

```bash
# 拉取最新镜像
docker pull agions/taskflow-ai:latest

# 运行容器
docker run -d \
  --name taskflow-ai \
  -p 3000:3000 \
  -e TASKFLOW_DEEPSEEK_API_KEY="your-api-key" \
  -v taskflow-data:/app/data \
  agions/taskflow-ai:latest
```

### 使用 Docker Compose

```bash
# 克隆项目
git clone https://github.com/Agions/taskflow-ai.git
cd taskflow-ai

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，添加你的 AI 模型 API 密钥

# 启动服务
docker-compose up -d taskflow-prod
```

## 📦 可用镜像

### 镜像标签

| 标签 | 描述 | 用途 |
|------|------|------|
| `latest` | 最新稳定版本 | 生产环境 |
| `dev` | 开发版本 | 开发环境 |
| `v1.3.1` | 特定版本 | 生产环境 |
| `main` | 主分支最新构建 | 测试环境 |

### 多架构支持

所有镜像都支持以下架构：
- `linux/amd64` (x86_64)
- `linux/arm64` (ARM64/AArch64)

## 🚀 部署方式

### 1. 生产环境部署

#### 使用 Docker Compose (推荐)

```bash
# 使用生产配置
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f taskflow-app
```

#### 手动 Docker 运行

```bash
# 创建网络
docker network create taskflow-network

# 启动 Redis
docker run -d \
  --name taskflow-redis \
  --network taskflow-network \
  -v redis-data:/data \
  redis:7-alpine

# 启动 TaskFlow AI
docker run -d \
  --name taskflow-ai \
  --network taskflow-network \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e TASKFLOW_REDIS_URL=redis://taskflow-redis:6379 \
  -e TASKFLOW_DEEPSEEK_API_KEY="your-api-key" \
  -v taskflow-data:/app/data \
  -v taskflow-config:/app/.taskflow \
  -v taskflow-logs:/app/logs \
  agions/taskflow-ai:latest
```

### 2. 开发环境部署

```bash
# 使用开发配置
docker-compose -f docker-compose.dev.yml up -d

# 进入开发容器
docker-compose -f docker-compose.dev.yml exec taskflow-dev bash

# 查看开发日志
docker-compose -f docker-compose.dev.yml logs -f taskflow-dev
```

### 3. 本地构建部署

```bash
# 构建生产镜像
docker build --target production -t taskflow-ai:local .

# 构建开发镜像
docker build --target development -t taskflow-ai:dev-local .

# 运行本地构建的镜像
docker run -d \
  --name taskflow-local \
  -p 3000:3000 \
  -e TASKFLOW_DEEPSEEK_API_KEY="your-api-key" \
  taskflow-ai:local
```

## ⚙️ 配置选项

### 环境变量

#### 必需配置

```bash
# AI 模型 API 密钥（至少配置一个）
TASKFLOW_DEEPSEEK_API_KEY=your-deepseek-api-key
TASKFLOW_ZHIPU_API_KEY=your-zhipu-api-key
TASKFLOW_QWEN_API_KEY=your-qwen-api-key
TASKFLOW_BAIDU_API_KEY=your-baidu-api-key
```

#### 可选配置

```bash
# 应用配置
NODE_ENV=production
LOG_LEVEL=info
TASKFLOW_CONFIG_DIR=/app/.taskflow
TASKFLOW_DATA_DIR=/app/data

# Redis 配置
TASKFLOW_REDIS_URL=redis://redis:6379
TASKFLOW_ENABLE_REDIS_CACHE=true

# 性能配置
TASKFLOW_ENABLE_CLUSTERING=true
TASKFLOW_CLUSTER_WORKERS=4
TASKFLOW_MAX_REQUESTS_PER_MINUTE=100

# 监控配置
TASKFLOW_ENABLE_METRICS=true
TASKFLOW_METRICS_PORT=9464
```

### 卷挂载

```bash
# 数据持久化
-v taskflow-data:/app/data          # 用户数据
-v taskflow-config:/app/.taskflow   # 配置文件
-v taskflow-logs:/app/logs          # 日志文件

# 开发环境额外挂载
-v $(pwd):/app                      # 源码热重载
-v /app/node_modules               # 防止覆盖
```

### 端口映射

```bash
# 应用端口
-p 3000:3000    # 主应用服务

# 开发环境额外端口
-p 9229:9229    # Node.js 调试端口
-p 5173:5173    # VitePress 文档服务

# 监控端口
-p 9464:9464    # Prometheus metrics
-p 9090:9090    # Prometheus UI
-p 3001:3000    # Grafana
```

## 🔧 高级配置

### 1. 使用 Secrets 管理敏感信息

```yaml
# docker-compose.prod.yml
secrets:
  deepseek_api_key:
    file: ./secrets/deepseek_api_key.txt
  zhipu_api_key:
    file: ./secrets/zhipu_api_key.txt

services:
  taskflow-app:
    secrets:
      - deepseek_api_key
      - zhipu_api_key
    environment:
      - TASKFLOW_DEEPSEEK_API_KEY_FILE=/run/secrets/deepseek_api_key
```

### 2. 负载均衡配置

```yaml
# nginx.conf
upstream taskflow_backend {
    server taskflow-app-1:3000;
    server taskflow-app-2:3000;
    server taskflow-app-3:3000;
}

server {
    listen 80;
    location / {
        proxy_pass http://taskflow_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. 监控和日志

```bash
# 启用完整监控栈
docker-compose -f docker-compose.prod.yml --profile monitoring up -d

# 查看 Prometheus metrics
curl http://localhost:9090/metrics

# 访问 Grafana 仪表板
open http://localhost:3001
```

## 🔍 故障排除

### 常见问题

#### 1. 容器启动失败

```bash
# 查看容器日志
docker logs taskflow-ai

# 检查容器状态
docker ps -a

# 进入容器调试
docker exec -it taskflow-ai sh
```

#### 2. API 密钥配置问题

```bash
# 验证环境变量
docker exec taskflow-ai env | grep TASKFLOW

# 测试 API 连接
docker exec taskflow-ai taskflow config validate
```

#### 3. 数据持久化问题

```bash
# 检查卷挂载
docker volume ls
docker volume inspect taskflow-data

# 备份数据
docker run --rm -v taskflow-data:/data -v $(pwd):/backup alpine tar czf /backup/taskflow-backup.tar.gz -C /data .
```

#### 4. 网络连接问题

```bash
# 检查网络
docker network ls
docker network inspect taskflow-network

# 测试服务连接
docker exec taskflow-ai ping redis
```

### 性能优化

#### 1. 资源限制

```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 2G
    reservations:
      cpus: '1.0'
      memory: 1G
```

#### 2. 缓存优化

```bash
# 启用 Redis 缓存
TASKFLOW_ENABLE_REDIS_CACHE=true
TASKFLOW_REDIS_URL=redis://redis:6379

# 配置缓存策略
TASKFLOW_CACHE_TTL=3600
TASKFLOW_CACHE_MAX_SIZE=1000
```

## 📋 维护操作

### 更新镜像

```bash
# 拉取最新镜像
docker-compose pull

# 重启服务
docker-compose up -d

# 清理旧镜像
docker image prune -f
```

### 备份和恢复

```bash
# 备份数据
docker run --rm \
  -v taskflow-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/taskflow-backup-$(date +%Y%m%d).tar.gz -C /data .

# 恢复数据
docker run --rm \
  -v taskflow-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/taskflow-backup-20240101.tar.gz -C /data
```

### 日志管理

```bash
# 查看日志
docker-compose logs -f --tail=100 taskflow-app

# 清理日志
docker system prune -f

# 配置日志轮转
# 在 docker-compose.yml 中添加：
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## 🔗 相关链接

- [Docker Hub 镜像](https://hub.docker.com/r/agions/taskflow-ai)
- [GitHub 源码](https://github.com/Agions/taskflow-ai)
- [在线文档](https://agions.github.io/taskflow-ai/)
- [API 参考](https://agions.github.io/taskflow-ai/api/)
