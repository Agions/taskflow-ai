# 配置参考

## 概述

TaskFlow AI 使用 JSON 格式的配置文件来管理PRD解析和任务管理相关的设置。配置文件支持嵌套结构，提供了灵活的配置选项。本文档详细介绍了所有可用的配置选项。

## 配置文件位置

### 默认位置
- **Windows**: `%USERPROFILE%\.taskflow\config.json`
- **macOS**: `~/.taskflow/config.json`
- **Linux**: `~/.taskflow/config.json`

### 自定义位置
```bash
# 使用环境变量指定配置文件路径
export TASKFLOW_CONFIG_PATH="/path/to/custom/config.json"

# 或使用命令行参数
taskflow --config /path/to/custom/config.json
```

## 配置结构

### 完整配置示例

```json
{
  "version": "1.0.0",
  "models": {
    "deepseek": {
      "apiKey": "your-deepseek-api-key",
      "baseUrl": "https://api.deepseek.com",
      "timeout": 30000,
      "maxRetries": 3
    },
    "zhipu": {
      "apiKey": "your-zhipu-api-key",
      "timeout": 30000,
      "maxRetries": 3
    },
    "qwen": {
      "apiKey": "your-qwen-api-key",
      "timeout": 30000,
      "maxRetries": 3
    },
    "baidu": {
      "apiKey": "your-baidu-api-key",
      "secretKey": "your-baidu-secret-key",
      "timeout": 30000,
      "maxRetries": 3
    }
  },
  "multiModel": {
    "enabled": true,
    "primary": "deepseek",
    "fallback": ["zhipu", "qwen"],
    "loadBalancing": true,
    "costOptimization": true,
    "selectionStrategy": "performance"
  },
  "logging": {
    "level": "info",
    "output": "both",
    "file": "./logs/taskflow.log",
    "maxFileSize": "10MB",
    "maxFiles": 5,
    "colorize": true,
    "timestamp": true
  },
  "performance": {
    "enableMonitoring": true,
    "cacheSize": 200,
    "cacheTTL": 300000,
    "timeout": 30000,
    "concurrency": 5,
    "retryAttempts": 3,
    "retryDelay": 1000
  },
  "security": {
    "encryptApiKeys": true,
    "validateInputs": true,
    "sanitizeOutputs": true,
    "enableRateLimit": true,
    "rateLimitWindow": 60000,
    "rateLimitMax": 100
  },
  "project": {
    "name": "我的项目",
    "type": "web-app",
    "workDir": "./src",
    "team": ["张三", "李四", "王五"]
  },
  "ui": {
    "theme": "default",
    "language": "zh-CN",
    "showProgress": true,
    "showTimestamps": true,
    "colorOutput": true,
    "verboseErrors": false
  },
  "storage": {
    "dataDir": "~/.taskflow/data",
    "backupEnabled": true,
    "backupInterval": 86400000,
    "maxBackups": 7,
    "compression": true
  },
  "network": {
    "proxy": {
      "enabled": false,
      "host": "proxy.company.com",
      "port": 8080,
      "username": "",
      "password": ""
    },
    "ssl": {
      "verify": true,
      "ca": "",
      "cert": "",
      "key": ""
    }
  }
}
```

## 配置选项详解

### 1. 基本信息 (Root Level)

#### version
- **类型**: `string`
- **必需**: 是
- **默认值**: `"1.0.0"`
- **描述**: 配置文件版本号，用于兼容性检查

### 2. AI模型配置 (models)

#### models.deepseek
DeepSeek 模型配置

| 选项 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `apiKey` | `string` | 是 | - | DeepSeek API 密钥 |
| `baseUrl` | `string` | 否 | `"https://api.deepseek.com"` | API 基础URL |
| `timeout` | `number` | 否 | `30000` | 请求超时时间（毫秒） |
| `maxRetries` | `number` | 否 | `3` | 最大重试次数 |

#### models.zhipu
智谱AI模型配置

| 选项 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `apiKey` | `string` | 是 | - | 智谱AI API 密钥 |
| `timeout` | `number` | 否 | `30000` | 请求超时时间（毫秒） |
| `maxRetries` | `number` | 否 | `3` | 最大重试次数 |

#### models.qwen
通义千问模型配置

| 选项 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `apiKey` | `string` | 是 | - | 通义千问 API 密钥 |
| `timeout` | `number` | 否 | `30000` | 请求超时时间（毫秒） |
| `maxRetries` | `number` | 否 | `3` | 最大重试次数 |

#### models.baidu
文心一言模型配置

| 选项 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `apiKey` | `string` | 是 | - | 百度 API Key |
| `secretKey` | `string` | 是 | - | 百度 Secret Key |
| `timeout` | `number` | 否 | `30000` | 请求超时时间（毫秒） |
| `maxRetries` | `number` | 否 | `3` | 最大重试次数 |

### 3. 多模型配置 (multiModel)

| 选项 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `enabled` | `boolean` | 否 | `false` | 是否启用多模型支持 |
| `primary` | `string` | 否 | `"deepseek"` | 主要使用的模型 |
| `fallback` | `string[]` | 否 | `[]` | 备用模型列表 |
| `loadBalancing` | `boolean` | 否 | `false` | 是否启用负载均衡 |
| `costOptimization` | `boolean` | 否 | `false` | 是否启用成本优化 |
| `selectionStrategy` | `string` | 否 | `"performance"` | 模型选择策略 |

#### selectionStrategy 选项
- `"performance"`: 基于性能选择
- `"cost"`: 基于成本选择
- `"random"`: 随机选择
- `"round_robin"`: 轮询选择

### 4. 日志配置 (logging)

| 选项 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `level` | `string` | 否 | `"info"` | 日志级别 |
| `output` | `string` | 否 | `"console"` | 日志输出方式 |
| `file` | `string` | 否 | `"./logs/taskflow.log"` | 日志文件路径 |
| `maxFileSize` | `string` | 否 | `"10MB"` | 单个日志文件最大大小 |
| `maxFiles` | `number` | 否 | `5` | 保留的日志文件数量 |
| `colorize` | `boolean` | 否 | `true` | 是否启用颜色输出 |
| `timestamp` | `boolean` | 否 | `true` | 是否显示时间戳 |

#### level 选项
- `"debug"`: 调试信息
- `"info"`: 一般信息
- `"warn"`: 警告信息
- `"error"`: 错误信息

#### output 选项
- `"console"`: 仅控制台输出
- `"file"`: 仅文件输出
- `"both"`: 控制台和文件都输出

### 5. 性能配置 (performance)

| 选项 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `enableMonitoring` | `boolean` | 否 | `true` | 是否启用性能监控 |
| `cacheSize` | `number` | 否 | `100` | 缓存大小 |
| `cacheTTL` | `number` | 否 | `300000` | 缓存过期时间（毫秒） |
| `timeout` | `number` | 否 | `30000` | 默认超时时间（毫秒） |
| `concurrency` | `number` | 否 | `5` | 并发请求数 |
| `retryAttempts` | `number` | 否 | `3` | 重试次数 |
| `retryDelay` | `number` | 否 | `1000` | 重试延迟（毫秒） |

### 6. 项目配置 (project)

| 选项 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `name` | `string` | 否 | `""` | 项目名称 |
| `type` | `string` | 否 | `"general"` | 项目类型 |
| `workDir` | `string` | 否 | `"./"` | 工作目录 |
| `team` | `string[]` | 否 | `[]` | 团队成员列表 |

#### type 选项
- `"web-app"`: 前端Web应用
- `"api"`: 后端API服务
- `"desktop"`: 桌面应用
- `"ai-ml"`: AI/ML项目
- `"general"`: 通用项目

### 7. 安全配置 (security)

| 选项 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `encryptApiKeys` | `boolean` | 否 | `true` | 是否加密存储API密钥 |
| `validateInputs` | `boolean` | 否 | `true` | 是否验证输入数据 |
| `sanitizeOutputs` | `boolean` | 否 | `true` | 是否清理输出数据 |
| `enableRateLimit` | `boolean` | 否 | `true` | 是否启用速率限制 |
| `rateLimitWindow` | `number` | 否 | `60000` | 速率限制时间窗口（毫秒） |
| `rateLimitMax` | `number` | 否 | `100` | 时间窗口内最大请求数 |

### 7. 用户界面配置 (ui)

| 选项 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `theme` | `string` | 否 | `"default"` | 界面主题 |
| `language` | `string` | 否 | `"zh-CN"` | 界面语言 |
| `showProgress` | `boolean` | 否 | `true` | 是否显示进度条 |
| `showTimestamps` | `boolean` | 否 | `true` | 是否显示时间戳 |
| `colorOutput` | `boolean` | 否 | `true` | 是否启用彩色输出 |
| `verboseErrors` | `boolean` | 否 | `false` | 是否显示详细错误信息 |

#### theme 选项
- `"default"`: 默认主题
- `"dark"`: 深色主题
- `"light"`: 浅色主题
- `"minimal"`: 简约主题

#### language 选项
- `"zh-CN"`: 简体中文
- `"en-US"`: 英语
- `"ja-JP"`: 日语

### 8. 存储配置 (storage)

| 选项 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `dataDir` | `string` | 否 | `"~/.taskflow/data"` | 数据存储目录 |
| `backupEnabled` | `boolean` | 否 | `true` | 是否启用自动备份 |
| `backupInterval` | `number` | 否 | `86400000` | 备份间隔（毫秒） |
| `maxBackups` | `number` | 否 | `7` | 保留的备份数量 |
| `compression` | `boolean` | 否 | `true` | 是否压缩备份文件 |

### 9. 网络配置 (network)

#### network.proxy
代理服务器配置

| 选项 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `enabled` | `boolean` | 否 | `false` | 是否启用代理 |
| `host` | `string` | 否 | `""` | 代理服务器地址 |
| `port` | `number` | 否 | `8080` | 代理服务器端口 |
| `username` | `string` | 否 | `""` | 代理用户名 |
| `password` | `string` | 否 | `""` | 代理密码 |

#### network.ssl
SSL/TLS配置

| 选项 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `verify` | `boolean` | 否 | `true` | 是否验证SSL证书 |
| `ca` | `string` | 否 | `""` | CA证书路径 |
| `cert` | `string` | 否 | `""` | 客户端证书路径 |
| `key` | `string` | 否 | `""` | 客户端私钥路径 |

## 环境变量

TaskFlow AI 支持通过环境变量覆盖配置文件中的设置：

### AI模型配置
```bash
TASKFLOW_DEEPSEEK_API_KEY=your-api-key
TASKFLOW_ZHIPU_API_KEY=your-api-key
TASKFLOW_QWEN_API_KEY=your-api-key
TASKFLOW_BAIDU_API_KEY=your-api-key
TASKFLOW_BAIDU_SECRET_KEY=your-secret-key
```

### 日志配置
```bash
TASKFLOW_LOG_LEVEL=debug
TASKFLOW_LOG_OUTPUT=console
TASKFLOW_LOG_FILE=./custom.log
```

### 性能配置
```bash
TASKFLOW_ENABLE_MONITORING=true
TASKFLOW_CACHE_SIZE=200
TASKFLOW_TIMEOUT=60000
```

### 安全配置
```bash
TASKFLOW_ENCRYPT_API_KEYS=true
TASKFLOW_VALIDATE_INPUTS=true
```

## 配置验证

### 验证命令
```bash
# 验证当前配置
taskflow config validate

# 验证特定配置文件
taskflow config validate --file /path/to/config.json

# 显示详细验证信息
taskflow config validate --verbose
```

### 常见验证错误

#### 1. 缺少必需字段
```
错误: 缺少必需的配置项 'models.deepseek.apiKey'
解决: taskflow config set models.deepseek.apiKey "your-api-key"
```

#### 2. 类型错误
```
错误: 配置项 'performance.cacheSize' 必须是数字类型
解决: taskflow config set performance.cacheSize 100
```

#### 3. 值超出范围
```
错误: 配置项 'performance.concurrency' 值必须在 1-20 之间
解决: taskflow config set performance.concurrency 5
```

## 配置管理命令

### 基本操作
```bash
# 查看所有配置
taskflow config list

# 获取特定配置
taskflow config get models.deepseek.apiKey

# 设置配置
taskflow config set logging.level debug

# 删除配置
taskflow config unset models.zhipu.apiKey
```

### 高级操作
```bash
# 导出配置
taskflow config export backup.json

# 导入配置
taskflow config import backup.json

# 重置配置
taskflow config reset

# 合并配置
taskflow config merge additional.json
```

## 最佳实践

### 1. 安全性
- 使用环境变量存储敏感信息
- 启用API密钥加密
- 定期轮换API密钥
- 限制配置文件权限

### 2. 性能优化
- 根据使用场景调整缓存大小
- 合理设置并发数
- 启用性能监控
- 定期清理日志文件

### 3. 维护性
- 使用版本控制管理配置模板
- 定期备份配置文件
- 文档化自定义配置
- 测试配置变更

## 故障排除

### 配置文件损坏
```bash
# 重新生成配置文件
taskflow config init --force

# 从备份恢复
taskflow config import backup.json
```

### 权限问题
```bash
# 修复配置文件权限
chmod 600 ~/.taskflow/config.json

# 修复目录权限
chmod 755 ~/.taskflow
```

### 格式错误
```bash
# 验证JSON格式
cat ~/.taskflow/config.json | jq .

# 格式化配置文件
taskflow config format
```

## 更多资源

- [安装指南](../guide/installation.md)
- [用户手册](../user-guide/user-manual.md)
- [CLI命令参考](../cli/commands.md)
- [故障排除](../troubleshooting/common-issues.md)
