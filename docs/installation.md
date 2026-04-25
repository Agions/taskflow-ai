# 安装与配置指南

## 支持的安装方式

### 1. npm 全局安装（推荐生产环境）

```bash
npm install -g @taskflow-ai/cli

# 验证安装
taskflow --version
```

**优点**：
- 全局可用命令
- 易于升级：`npm update -g @taskflow-ai/cli`

**缺点**：
- 需要管理员权限
- 版本固定，需手动更新

### 2. 项目本地安装（推荐开发环境）

```bash
cd your-project
npm install @taskflow-ai/sdk
```

**使用方式**：
```bash
# 通过 npx
npx taskflow init

# 或添加到 package.json scripts
```

package.json 示例：

```json
{
  "scripts": {
    "taskflow": "taskflow",
    "prd:parse": "taskflow parse docs/prd.md",
    "agent:run": "taskflow agent"
  }
}
```

### 3. Docker 部署（推荐容器化环境）

```bash
# 拉取镜像
docker pull taskflow-ai/cli:latest

# 运行容器
docker run -it \
  -v $(pwd):/workspace \
  -e OPENAI_API_KEY=sk-xxxxx \
  taskflow-ai/cli:latest
```

### 4. Docker Compose（完整环境）

docker-compose.yml：

```yaml
version: '3.8'
services:
  taskflow:
    image: taskflow-ai/cli:latest
    container_name: taskflow
    volumes:
      - ./workspace:/workspace
      - ./config:/root/.taskflow
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - LOG_LEVEL=info
    working_dir: /workspace
```

启动：

```bash
docker-compose up -d
docker-compose exec taskflow taskflow init
```

### 5. 从源码构建

```bash
# 克隆仓库
git clone https://github.com/taskflow-ai/taskflow.git
cd taskflow

# 安装依赖
npm install

# 构建
npm run build

# 链接到全局
npm link

# 验证
taskflow --version
```

## 系统要求

### 最低要求

| 组件 | 版本 | 说明 |
|------|------|------|
| Node.js | 18.0+ | 支持 ES2022+ |
| npm | 9.0+ | 包管理器 |
| 内存 | 4GB | 运行时最小内存 |
| 磁盘 | 500MB | 安装空间 |

### 推荐配置

| 组件 | 版本/规格 | 说明 |
|------|----------|------|
| Node.js | 20.0+ | 最新 LTS 版本 |
| npm | 10.0+ | 最新稳定版 |
| 内存 | 8GB+ | 大型项目推荐 |
| 磁盘 | 2GB+ | 包含缓存和日志 |
| CPU | 4 核+ | 并发处理能力 |

### 操作系统支持

- ✅ macOS 12+ (Monterey 及以上)
- ✅ Ubuntu 20.04+ / Debian 11+
- ✅ CentOS 8+ / RHEL 8+
- ✅ Windows 10/11 (WSL2)
- ⚠️ Windows 原生（部分功能受限）

## 配置文件

### 配置文件位置

优先级从高到低：
1. `./taskflow.config.yaml` （项目级）
2. `~/.taskflow/config.yaml` （用户级）
3. `/etc/taskflow/config.yaml` （系统级）

### 完整配置示例

```yaml
# taskflow.config.yaml

# 项目信息
project:
  name: my-project
  version: 1.0.0
  description: TaskFlow AI 项目

# AI 配置
ai:
  provider: openai  # openai | anthropic | claude | custom
  model: gpt-4
  apiKey: ${OPENAI_API_KEY}
  baseUrl: ${OPENAI_BASE_URL}
  maxTokens: 4096
  temperature: 0.7
  timeout: 60000
  retries: 3
  # 自定义提供商
  custom:
    endpoint: https://api.my-ai.com/v1

# Agent 配置
agent:
  mode: assisted  # assisted | autonomous | supervised
  maxIterations: 10
  autoFix: true
  approvalRequired:
    - deploy
    - delete
  continueOnError: false
  timeout: 300000
  maxRetries: 3

# MCP 配置
mcp:
  enabled: true
  transport: stdio  # stdio | http
  serverName: taskflow-ai
  version: 1.0.0
  # stdio 配置
  stdio:
    command: node
    args: ["./mcp-server.js"]
  # http 配置
  http:
    port: 3000
    host: localhost
    auth:
      enabled: false

# 知识库配置
knowledge:
  enabled: false
  vectorStore:
    type: lancedb  # lancedb | chroma | pinecone
    path: ./vectors
    apiKey: ${VECTOR_DB_KEY}
  embedding:
    provider: openai
    model: text-embedding-3-small
    dimensions: 1536
  chunkSize: 1000
  chunkOverlap: 200

# 缓存配置
cache:
  enabled: true
  type: memory  # memory | redis | file
  memory:
    maxSize: 1000
    ttl: 3600000  # 1小时
  redis:
    host: localhost
    port: 6379
    password: ${REDIS_PASSWORD}
    db: 0

# 存储配置
storage:
  type: file  # file | s3 | minio
  file:
    path: ./.taskflow/storage
  s3:
    region: us-east-1
    bucket: taskflow-ai
    accessKey: ${AWS_ACCESS_KEY_ID}
    secretKey: ${AWS_SECRET_ACCESS_KEY}

# 日志配置
logging:
  level: info  # debug | info | warn | error
  format: json  # json | text
  file:
    enabled: true
    path: ./logs/taskflow.log
    maxSize: 10MB
    maxFiles: 10
  console:
    enabled: true
    colorize: true

# Security 配置
security:
  authRequired: false
  allowedOrigins: []
  rateLimit:
    enabled: true
    maxRequests: 100
    windowMs: 60000
  sandbox:
    enabled: true
    timeout: 30000
    memoryLimit: 512

# CI/CD 配置
cicd:
  enabled: false
  provider: github  # github | gitlab | jenkins
  repository: taskflow-ai/taskflow
  branch: main
  token: ${GITHUB_TOKEN}
  autoSync: false
```

## 环境变量

创建 `.env` 文件：

```bash
# AI API
OPENAI_API_KEY=sk-xxxxx
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_ORGANIZATION=org-xxxxx

# Anthropic（如使用）
ANTHROPIC_API_KEY=sk-ant-xxxxx

# 知识库
VECTOR_DB_URL=http://localhost:8080
VECTOR_DB_API_KEY=xxxxx

# 存储
AWS_ACCESS_KEY_ID=AKIAXXXXX
AWS_SECRET_ACCESS_KEY=xxxxx

# 缓存
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=xxxxx

# 日志
LOG_LEVEL=info
LOG_FORMAT=json

# MCP
MCP_TRANSPORT=stdio
MCP_SERVER_NAME=taskflow-ai
```

## 验证安装

### 完整诊断命令

```bash
# 检查版本
taskflow --version

# 检查配置
taskflow config validate

# 检查依赖
taskflow doctor

# 查看系统信息
taskflow info
```

预期输出：

```
TaskFlow CLI v4.0.0
Node.js: v20.10.0
npm: 10.2.4
Platform: darwin arm64

配置状态: ✅ 有效
AI 连接: ✅ 正常
存储: ✅ 可用
缓存: ✅ 启用
```

## 升级与卸载

### 升级

```bash
# 全局安装
npm update -g @taskflow-ai/cli

# 项目本地
npm update @taskflow-ai/sdk

# Docker
docker pull taskflow-ai/cli:latest
```

### 卸载

```bash
# 全局卸载
npm uninstall -g @taskflow-ai/cli

# 清理配置文件
rm -rf ~/.taskflow

# 项目本地
npm uninstall @taskflow-ai/sdk
```

## 网络配置

### 代理设置

```bash
# HTTP 代理
export HTTP_PROXY=http://proxy.example.com:8080
export HTTPS_PROXY=http://proxy.example.com:8080

# npm 代理
npm config set proxy http://proxy.example.com:8080
npm config set https-proxy http://proxy.example.com:8080
```

### 防火墙配置

允许的端口：
- MCP Server: 3000（默认）
- HTTP 接口: 8080（可选）
- WebSocket: 9000（可选）

## 常见安装问题

### 问题 1：权限错误

```bash
# 使用 sudo（不推荐）
sudo npm install -g @taskflow-ai/cli

# 正确方式：配置 npm 全局路径
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
npm install -g @taskflow-ai/cli
```

### 问题 2：Node 版本不兼容

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 安装 Node.js 20
nvm install 20
nvm use 20
```

### 问题 3：网络超时

```bash
# 设置 npm 淘宝镜像
npm config set registry https://registry.npmmirror.com

# 设置超时
npm config set fetch-timeout 600000
```

---

下一步：[快速开始指南](./getting-started.md)
