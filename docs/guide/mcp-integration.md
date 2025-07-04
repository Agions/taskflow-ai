# MCP (Model Context Protocol) 集成指南

## 🎯 概述

TaskFlow AI 遵循标准 MCP 协议，通过配置文件与 AI 编辑器实现无缝集成。编辑器会自动启动和管理 MCP 服务，无需手动操作。

## 🤖 支持的 AI 编辑器

| 编辑器 | MCP 支持 | 配置文件 | 自动启动 |
|--------|----------|----------|----------|
| **Windsurf** | ✅ 完整支持 | `.windsurf/mcp.json` | ✅ 是 |
| **Trae** | ✅ 完整支持 | `.trae/mcp-config.json` | ✅ 是 |
| **Cursor** | ✅ 完整支持 | `.cursor/mcp.json` | ✅ 是 |
| **VSCode** | ✅ 完整支持 | `.vscode/settings.json` | ✅ 是 |

## 🚀 快速开始

### 一键配置生成

```bash
# 生成所有编辑器的 MCP 配置
taskflow init

# 为特定编辑器生成配置
taskflow init --editor cursor

# 验证配置有效性
taskflow mcp validate --all
```

### 工作流程

1. **生成配置文件** - `taskflow init`
2. **设置环境变量** - 配置 API 密钥
3. **打开编辑器** - 编辑器自动启动 MCP 服务
4. **开始使用** - 享受 AI 驱动的开发体验

> **重要**: 无需手动启动服务，编辑器会根据配置文件自动管理 MCP 服务。

## 🔧 配置文件详解

### Cursor 配置

**文件**: `.cursor/mcp.json`

```json
{
  "mcpServers": {
    "taskflow-ai": {
      "command": "npx",
      "args": ["-y", "--package=taskflow-ai", "taskflow-mcp"],
      "env": {
        "DEEPSEEK_API_KEY": "${DEEPSEEK_API_KEY}",
        "ZHIPU_API_KEY": "${ZHIPU_API_KEY}",
        "QWEN_API_KEY": "${QWEN_API_KEY}",
        "BAIDU_API_KEY": "${BAIDU_API_KEY}",
        "BAIDU_SECRET_KEY": "${BAIDU_SECRET_KEY}",
        "MOONSHOT_API_KEY": "${MOONSHOT_API_KEY}",
        "SPARK_APP_ID": "${SPARK_APP_ID}",
        "SPARK_API_KEY": "${SPARK_API_KEY}",
        "SPARK_API_SECRET": "${SPARK_API_SECRET}",
        "TASKFLOW_PROJECT_ROOT": "${workspaceFolder}",
        "TASKFLOW_CONFIG_PATH": ".taskflow/config.json"
      }
    }
  }
}
```

**工作原理**:
1. Cursor 读取 `.cursor/mcp.json` 配置
2. 自动执行 `npx -y --package=taskflow-ai taskflow-mcp`
3. 启动 TaskFlow AI MCP 服务进程
4. 通过 stdio 进行通信

### VSCode 配置

**文件**: `.vscode/settings.json`

```json
{
  "taskflow.mcp.enabled": true,
  "taskflow.mcp.server": {
    "command": "npx",
    "args": ["-y", "--package=taskflow-ai", "taskflow-mcp"],
    "env": {
      "DEEPSEEK_API_KEY": "${env:DEEPSEEK_API_KEY}",
      "ZHIPU_API_KEY": "${env:ZHIPU_API_KEY}",
      "QWEN_API_KEY": "${env:QWEN_API_KEY}",
      "BAIDU_API_KEY": "${env:BAIDU_API_KEY}",
      "BAIDU_SECRET_KEY": "${env:BAIDU_SECRET_KEY}",
      "MOONSHOT_API_KEY": "${env:MOONSHOT_API_KEY}",
      "SPARK_APP_ID": "${env:SPARK_APP_ID}",
      "SPARK_API_KEY": "${env:SPARK_API_KEY}",
      "SPARK_API_SECRET": "${env:SPARK_API_SECRET}",
      "TASKFLOW_PROJECT_ROOT": "${workspaceFolder}"
    }
  },
  "taskflow.ai.models": {
    "primary": "deepseek",
    "fallback": ["zhipu", "qwen", "baidu"],
    "specialized": {
      "code": "deepseek",
      "chinese": "zhipu",
      "general": "qwen",
      "creative": "baidu",
      "longText": "moonshot",
      "multimodal": "spark"
    }
  }
}
```

### Windsurf 配置

**文件**: `.windsurf/mcp.json`

```json
{
  "mcpServers": {
    "taskflow-ai": {
      "command": "npx",
      "args": ["-y", "--package=taskflow-ai", "taskflow-mcp"],
      "env": {
        "DEEPSEEK_API_KEY": "${DEEPSEEK_API_KEY}",
        "ZHIPU_API_KEY": "${ZHIPU_API_KEY}",
        "QWEN_API_KEY": "${QWEN_API_KEY}",
        "BAIDU_API_KEY": "${BAIDU_API_KEY}",
        "BAIDU_SECRET_KEY": "${BAIDU_SECRET_KEY}",
        "MOONSHOT_API_KEY": "${MOONSHOT_API_KEY}",
        "SPARK_APP_ID": "${SPARK_APP_ID}",
        "SPARK_API_KEY": "${SPARK_API_KEY}",
        "SPARK_API_SECRET": "${SPARK_API_SECRET}",
        "TASKFLOW_PROJECT_ROOT": "${workspaceFolder}",
        "TASKFLOW_CONFIG_PATH": ".taskflow/config.json"
      },
      "capabilities": {
        "resources": true,
        "tools": true,
        "prompts": true,
        "streaming": true
      }
    }
  }
}
```

### Trae 配置

**文件**: `.trae/mcp-config.json`

```json
{
  "mcp": {
    "version": "1.0",
    "servers": {
      "taskflow": {
        "command": "npx",
        "args": ["-y", "--package=taskflow-ai", "taskflow-mcp"],
        "environment": {
          "TASKFLOW_WORKSPACE": "${workspaceFolder}",
          "DEEPSEEK_API_KEY": "${DEEPSEEK_API_KEY}",
          "ZHIPU_API_KEY": "${ZHIPU_API_KEY}",
          "QWEN_API_KEY": "${QWEN_API_KEY}",
          "BAIDU_API_KEY": "${BAIDU_API_KEY}",
          "BAIDU_SECRET_KEY": "${BAIDU_SECRET_KEY}",
          "MOONSHOT_API_KEY": "${MOONSHOT_API_KEY}",
          "SPARK_APP_ID": "${SPARK_APP_ID}",
          "SPARK_API_KEY": "${SPARK_API_KEY}",
          "SPARK_API_SECRET": "${SPARK_API_SECRET}"
        },
        "capabilities": [
          "code_analysis",
          "task_management",
          "prd_parsing",
          "ai_assistance"
        ]
      }
    }
  }
}
```

## 🌐 多模型 AI 支持

### 智能模型选择

TaskFlow AI 根据任务类型自动选择最适合的 AI 模型：

| 任务类型 | 推荐模型 | 能力特点 |
|----------|----------|----------|
| **代码生成** | DeepSeek | 强大的代码理解和生成能力 |
| **中文处理** | 智谱AI | 优秀的中文理解和推理能力 |
| **通用分析** | 通义千问 | 平衡的综合分析能力 |
| **创意任务** | 文心一言 | 出色的创意和内容生成 |
| **长文档** | 月之暗面 | 超长上下文处理能力 |
| **多模态** | 讯飞星火 | 文本、图像、音频综合处理 |

### 模型配置

```typescript
// 在 TaskFlow AI 中，模型选择是自动的
// 用户只需配置 API 密钥，系统会智能选择最优模型

interface ModelConfig {
  deepseek: { apiKey: string }
  zhipu: { apiKey: string }
  qwen: { apiKey: string }
  baidu: { apiKey: string, secretKey: string }
  moonshot: { apiKey: string }
  spark: { appId: string, apiKey: string, apiSecret: string }
}
```

## 🔐 环境变量配置

### 创建 .env 文件

```bash
# AI 模型 API 密钥
DEEPSEEK_API_KEY=sk-your-deepseek-key
ZHIPU_API_KEY=your-zhipu-key
QWEN_API_KEY=your-qwen-key
BAIDU_API_KEY=your-baidu-key
BAIDU_SECRET_KEY=your-baidu-secret
MOONSHOT_API_KEY=your-moonshot-key
SPARK_APP_ID=your-spark-appid
SPARK_API_KEY=your-spark-key
SPARK_API_SECRET=your-spark-secret

# TaskFlow 配置
TASKFLOW_LOG_LEVEL=info
TASKFLOW_CACHE_ENABLED=true
```

### 环境变量验证

```bash
# 验证环境变量配置
taskflow config validate

# 测试 API 密钥有效性
taskflow mcp test --all-models
```

## 🎯 使用示例

### Cursor 中的智能开发

```typescript
// 在 Cursor 中输入注释，AI 会自动处理
/**
 * @taskflow 创建用户认证系统
 * 需求：支持邮箱登录、JWT认证、角色权限
 */

// TaskFlow AI 会：
// 1. 使用智谱AI解析中文需求
// 2. 使用DeepSeek生成技术方案
// 3. 自动创建开发任务
// 4. 生成完整代码结构
```

### VSCode 中的项目管理

```bash
# 通过命令面板使用
# Ctrl+Shift+P -> "TaskFlow: Parse PRD"
# Ctrl+Shift+P -> "TaskFlow: Create Task"
# Ctrl+Shift+P -> "TaskFlow: Analyze Code"
```

## 🔧 配置验证

### 验证命令

```bash
# 验证所有 MCP 配置
taskflow mcp validate

# 验证特定编辑器配置
taskflow mcp validate --editor cursor

# 测试配置有效性
taskflow mcp test --editor cursor

# 检查环境变量
taskflow config check-env
```

### 故障排除

| 问题 | 症状 | 解决方案 |
|------|------|----------|
| 配置文件无效 | 编辑器无法启动服务 | `taskflow mcp validate` |
| API 密钥错误 | 认证失败 | 检查 `.env` 文件 |
| 环境变量未设置 | 服务启动失败 | `taskflow config check-env` |
| 网络连接问题 | 模型调用失败 | 检查网络和防火墙 |

## 📋 最佳实践

### 1. 配置管理

```bash
# 定期验证配置
taskflow mcp validate

# 备份配置文件
cp .cursor/mcp.json .cursor/mcp.json.backup

# 版本控制排除敏感信息
echo ".env" >> .gitignore
```

### 2. 安全考虑

- ✅ 使用环境变量存储 API 密钥
- ✅ 不要在配置文件中硬编码密钥
- ✅ 定期轮换 API 密钥
- ✅ 限制网络访问权限

### 3. 性能优化

- ✅ 启用缓存机制
- ✅ 合理设置超时时间
- ✅ 监控 API 使用量
- ✅ 使用负载均衡

---

**通过标准 MCP 协议，TaskFlow AI 与您的 AI 编辑器实现了真正的无缝集成！** 🚀
