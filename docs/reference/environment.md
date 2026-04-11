# 环境变量参考

## 概述

TaskFlow AI 支持通过环境变量进行配置，这对于CI/CD环境和安全管理特别有用。

## 🔑 AI模型配置

### API密钥

```bash
# DeepSeek API密钥
export TASKFLOW_DEEPSEEK_API_KEY="your-deepseek-api-key"

# 智谱AI API密钥
export TASKFLOW_ZHIPU_API_KEY="your-zhipu-api-key"

# 通义千问 API密钥
export TASKFLOW_QWEN_API_KEY="your-qwen-api-key"

# 文心一言 API密钥
export TASKFLOW_BAIDU_API_KEY="your-baidu-api-key"
```

### API端点

```bash
# 自定义API端点
export TASKFLOW_DEEPSEEK_ENDPOINT="https://api.deepseek.com/v1"
export TASKFLOW_ZHIPU_ENDPOINT="https://open.bigmodel.cn/api/paas/v4"
```

## ⚙️ 系统配置

### 基本配置

```bash
# 配置目录路径
export TASKFLOW_CONFIG_DIR=".taskflow"

# 日志级别 (debug, info, warn, error)
export TASKFLOW_LOG_LEVEL="info"

# 日志文件路径
export TASKFLOW_LOG_FILE="./logs/taskflow.log"

# 缓存目录
export TASKFLOW_CACHE_DIR=".taskflow/cache"
```

### 性能配置

```bash
# 缓存大小（条目数）
export TASKFLOW_CACHE_SIZE="100"

# 请求超时时间（毫秒）
export TASKFLOW_TIMEOUT="30000"

# 最大并发请求数
export TASKFLOW_MAX_CONCURRENCY="5"

# 重试次数
export TASKFLOW_MAX_RETRIES="3"
```

## 🌐 网络配置

### 代理设置

```bash
# HTTP代理
export TASKFLOW_HTTP_PROXY="http://proxy.company.com:8080"

# HTTPS代理
export TASKFLOW_HTTPS_PROXY="https://proxy.company.com:8080"

# 不使用代理的地址
export TASKFLOW_NO_PROXY="localhost,127.0.0.1,.local"
```

### SSL配置

```bash
# 禁用SSL验证（不推荐用于生产环境）
export TASKFLOW_DISABLE_SSL_VERIFY="false"

# 自定义CA证书路径
export TASKFLOW_CA_CERT_PATH="/path/to/ca-cert.pem"
```

## 🔒 安全配置

### 加密设置

```bash
# 启用API密钥加密存储
export TASKFLOW_ENCRYPT_API_KEYS="true"

# 加密密钥（用于加密API密钥）
export TASKFLOW_ENCRYPTION_KEY="your-encryption-key"

# 启用审计日志
export TASKFLOW_AUDIT_LOG="true"
```

### 访问控制

```bash
# 启用访问控制
export TASKFLOW_ACCESS_CONTROL="true"

# 默认用户角色
export TASKFLOW_DEFAULT_ROLE="viewer"

# 管理员用户列表（逗号分隔）
export TASKFLOW_ADMIN_USERS="admin@company.com,manager@company.com"
```

## 🏢 企业配置

### 团队设置

```bash
# 默认团队名称
export TASKFLOW_DEFAULT_TEAM="development"

# 团队成员列表（JSON格式）
export TASKFLOW_TEAM_MEMBERS='["张三", "李四", "王五"]'

# 默认分配人
export TASKFLOW_DEFAULT_ASSIGNEE="张三"
```

### 集成配置

```bash
# Slack Webhook URL
export TASKFLOW_SLACK_WEBHOOK="https://hooks.slack.com/services/..."

# 邮件服务器配置
export TASKFLOW_SMTP_HOST="smtp.company.com"
export TASKFLOW_SMTP_PORT="587"
export TASKFLOW_SMTP_USER="taskflow@company.com"
export TASKFLOW_SMTP_PASS="smtp-password"

# Jira集成
export TASKFLOW_JIRA_URL="https://company.atlassian.net"
export TASKFLOW_JIRA_TOKEN="your-jira-token"
```

## 📄 配置文件示例

### 环境变量文件示例

```bash
# .env
# AI模型配置
TASKFLOW_DEEPSEEK_API_KEY=your-deepseek-api-key
TASKFLOW_ZHIPU_API_KEY=your-zhipu-api-key

# 系统配置
TASKFLOW_LOG_LEVEL=info
TASKFLOW_CACHE_SIZE=200

# 网络配置
TASKFLOW_HTTP_PROXY=http://proxy.company.com:8080
TASKFLOW_HTTPS_PROXY=https://proxy.company.com:8080

# 安全配置
TASKFLOW_ENCRYPT_API_KEYS=true
TASKFLOW_ENCRYPTION_KEY=your-encryption-key
```

### .env文件示例

```bash
# .env
# AI模型API密钥
DEEPSEEK_API_KEY=your-deepseek-api-key
ZHIPU_API_KEY=your-zhipu-api-key

# 系统配置
TASKFLOW_LOG_LEVEL=debug
TASKFLOW_CACHE_SIZE=50

# 安全配置
ENCRYPTION_KEY=your-32-character-encryption-key

# 网络配置
HTTP_PROXY=http://proxy.company.com:8080
HTTPS_PROXY=https://proxy.company.com:8080
```

## 🔧 CI/CD环境

### GitHub Actions

```yaml
# .github/workflows/taskflow.yml
name: TaskFlow AI
on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup TaskFlow AI
        run: npm install -g taskflow-ai

      - name: Parse PRD
        env:
          TASKFLOW_DEEPSEEK_API_KEY: ${{ secrets.DEEPSEEK_API_KEY }}
          TASKFLOW_LOG_LEVEL: info
          TASKFLOW_CACHE_SIZE: 100
        run: |
          taskflow init
          taskflow parse docs/requirements.md
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - analyze

taskflow_analysis:
  stage: analyze
  image: node:18
  variables:
    TASKFLOW_LOG_LEVEL: 'info'
    TASKFLOW_CACHE_SIZE: '100'
  script:
    - npm install -g taskflow-ai
    - taskflow init
    - taskflow parse docs/requirements.md
  only:
    changes:
      - docs/**/*.md
```

## 📊 监控和调试

### 调试配置

```bash
# 启用详细日志
export TASKFLOW_LOG_LEVEL="debug"

# 启用性能监控
export TASKFLOW_PERFORMANCE_MONITORING="true"

# 启用请求跟踪
export TASKFLOW_TRACE_REQUESTS="true"

# 保存请求/响应数据（调试用）
export TASKFLOW_SAVE_RAW_DATA="true"
```

### 监控配置

```bash
# 启用指标收集
export TASKFLOW_METRICS_ENABLED="true"

# 指标导出端口
export TASKFLOW_METRICS_PORT="9090"

# 健康检查端点
export TASKFLOW_HEALTH_CHECK_PORT="8080"
```

## 🔍 故障排除

### 常见问题环境变量

```bash
# 跳过SSL验证（仅用于调试）
export TASKFLOW_DISABLE_SSL_VERIFY="true"

# 增加超时时间
export TASKFLOW_TIMEOUT="60000"

# 禁用缓存（调试用）
export TASKFLOW_CACHE_SIZE="0"

# 强制使用特定模型
export TASKFLOW_FORCE_MODEL="deepseek"
```

## 📋 环境变量优先级

配置的优先级顺序（从高到低）：

1. **命令行参数** - `--config key=value`
2. **环境变量** - `TASKFLOW_*`
3. **配置文件** - `.taskflow/config.json`
4. **默认值** - 内置默认配置

## ✅ 验证环境变量

### 检查配置

```bash
# 显示当前环境变量
taskflow config list --source env

# 验证环境变量配置
taskflow doctor config --check-env

# 测试API连接
taskflow models test --use-env-config
```

### 配置模板生成

```bash
# 生成环境变量模板
taskflow config export --format env > .env.template

# 生成环境变量配置
taskflow config export --format bash > env-config.sh
```

## 🔐 安全最佳实践

### API密钥管理

```bash
# 使用密钥管理服务
export TASKFLOW_DEEPSEEK_API_KEY="$(aws secretsmanager get-secret-value --secret-id deepseek-api-key --query SecretString --output text)"

# 使用加密存储
export TASKFLOW_ENCRYPT_API_KEYS="true"
export TASKFLOW_ENCRYPTION_KEY="$(openssl rand -hex 32)"
```

### 权限控制

```bash
# 限制文件权限
chmod 600 .env

# 使用专用用户运行
export TASKFLOW_RUN_AS_USER="taskflow"
export TASKFLOW_RUN_AS_GROUP="taskflow"
```

## 📚 相关文档

- [配置参考](./configuration.md) - 详细配置选项
- [CLI参考](./cli.md) - 命令行接口
- [故障排除](../troubleshooting/configuration.md) - 配置问题解决
