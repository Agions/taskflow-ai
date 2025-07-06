# TaskFlow AI - 本地MCP服务部署指南

本文档详细介绍如何在本地环境部署和配置TaskFlow AI MCP服务器。

## 🎯 概述

TaskFlow AI提供完整的Model Context Protocol (MCP)服务器实现，支持智能PRD解析、任务管理和项目编排功能。本指南将帮助您在本地环境快速部署和配置MCP服务。

## 📋 前置要求

### 系统要求
- **Node.js**: 版本 18.0 或更高
- **npm**: 版本 8.0 或更高
- **操作系统**: macOS, Linux, Windows

### 验证环境
```bash
# 检查Node.js版本
node --version

# 检查npm版本
npm --version

# 检查TaskFlow AI安装
npx taskflow-ai --version
```

## 🚀 快速部署

### 方式1: 使用NPM包 (推荐)

```bash
# 全局安装TaskFlow AI
npm install -g taskflow-ai

# 验证MCP配置
taskflow-ai mcp validate
```

### 方式2: 从源码部署

```bash
# 克隆项目
git clone https://github.com/Agions/taskflow-ai.git
cd taskflow-ai

# 安装依赖
npm ci

# 构建项目
npm run build

# 验证MCP配置
node bin/index.js mcp validate
```

## 🔧 MCP服务器配置

### 1. 基本配置

创建MCP客户端配置文件 `mcp-config.json`:

```json
{
  "mcpServers": {
    "taskflow-ai": {
      "command": "npx",
      "args": ["taskflow-ai", "mcp"],
      "env": {
        "NODE_ENV": "production",
        "AI_MODEL": "qwen",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### 2. 环境变量配置

```bash
# AI模型配置 (至少配置一个)
export QWEN_API_KEY="your-qwen-api-key"
export DEEPSEEK_API_KEY="your-deepseek-api-key"
export ZHIPU_API_KEY="your-zhipu-api-key"

# MCP服务配置
export AI_MODEL="qwen"
export MCP_TRANSPORT="stdio"
export LOG_LEVEL="info"

# 可选配置
export TASKFLOW_CONFIG_PATH="/path/to/config.json"
export TASKFLOW_DATA_DIR="/path/to/data"
```

### 3. 高级配置

创建 `taskflow-config.json`:

```json
{
  "ai": {
    "defaultModel": "qwen",
    "models": {
      "qwen": {
        "apiKey": "${QWEN_API_KEY}",
        "baseURL": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "model": "qwen-turbo"
      }
    }
  },
  "mcp": {
    "transport": "stdio",
    "port": 3000,
    "enableLogging": true,
    "logLevel": "info"
  },
  "storage": {
    "dataDir": "./data",
    "autoSave": true,
    "saveInterval": 300
  }
}
```

## 🛠️ MCP配置管理

### 验证配置

```bash
# 验证MCP配置
taskflow-ai mcp validate

# 测试MCP服务
taskflow-ai mcp test

# 显示服务信息
taskflow-ai mcp info
```

### 重新生成配置

```bash
# 重新生成MCP配置文件
taskflow-ai mcp regenerate

# 指定输出路径
taskflow-ai mcp regenerate --output ./custom-mcp-config.json
```

## 🔌 MCP客户端集成

### Claude Desktop集成

1. **找到Claude Desktop配置文件**:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. **添加TaskFlow AI MCP服务器**:
```json
{
  "mcpServers": {
    "taskflow-ai": {
      "command": "npx",
      "args": ["taskflow-ai", "mcp"],
      "env": {
        "QWEN_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

3. **重启Claude Desktop**

### 其他MCP客户端

TaskFlow AI MCP服务器兼容所有标准MCP客户端，包括：
- Claude Desktop
- MCP Inspector
- 自定义MCP客户端

## 🧪 功能测试

### 1. PRD解析测试

```bash
# 创建测试PRD文件
echo "# 用户认证功能

## 需求
- 用户注册和登录
- 密码重置功能
- 会话管理" > test-prd.md

# 解析PRD
taskflow-ai parse test-prd.md
```

### 2. 任务管理测试

```bash
# 查看任务列表
taskflow-ai task list

# 创建测试任务
taskflow-ai task create "实现用户登录" --priority high --estimated-hours 8

# 更新任务状态
taskflow-ai task update <task-id> --status in_progress
```

### 3. 编排功能测试

```bash
# 分析项目
taskflow-ai orchestrate analyze

# 查看编排预设
taskflow-ai orchestrate presets

# 执行编排
taskflow-ai orchestrate optimize --preset agile_sprint
```

## 📊 监控和日志

### 日志配置

```bash
# 设置日志级别
export LOG_LEVEL=debug

# 启用详细日志
taskflow-ai mcp server --verbose

# 日志文件输出
taskflow-ai mcp server --verbose > mcp-server.log 2>&1
```

### 性能监控

```bash
# 查看服务状态
taskflow-ai mcp info

# 检查内存使用
ps aux | grep "taskflow-ai"

# 监控进程
top -p $(pgrep -f "taskflow-ai")
```

## 🛠️ 故障排除

### 常见问题

1. **服务器启动失败**
```bash
# 检查Node.js版本
node --version

# 检查依赖安装
npm list taskflow-ai

# 重新安装
npm install -g taskflow-ai
```

2. **API密钥错误**
```bash
# 验证环境变量
echo $QWEN_API_KEY

# 测试API连接
taskflow-ai config test-api
```

3. **MCP连接问题**
```bash
# 验证MCP配置
taskflow-ai mcp validate

# 测试MCP服务
taskflow-ai mcp test

# 检查端口占用
lsof -i :3000
```

### 调试模式

```bash
# 启用调试日志
DEBUG=taskflow:* taskflow-ai mcp server

# 详细错误信息
NODE_ENV=development taskflow-ai mcp server --verbose
```

## 🔄 更新和维护

### 更新TaskFlow AI

```bash
# 检查当前版本
taskflow-ai --version

# 更新到最新版本
npm update -g taskflow-ai

# 验证更新
taskflow-ai --version
```

### 配置备份

```bash
# 备份配置文件
cp ~/.taskflow/config.json ~/.taskflow/config.backup.json

# 备份数据目录
tar -czf taskflow-data-backup.tar.gz ~/.taskflow/data/
```

## 📚 相关资源

- [TaskFlow AI文档](https://agions.github.io/taskflow-ai)
- [Model Context Protocol规范](https://modelcontextprotocol.io/)
- [Claude Desktop MCP指南](https://docs.anthropic.com/claude/docs/mcp)
- [GitHub仓库](https://github.com/Agions/taskflow-ai)

## 🎉 部署完成

完成以上步骤后，您的TaskFlow AI MCP配置将：

1. ✅ 正确配置MCP服务器元数据
2. ✅ 支持所有MCP客户端连接
3. ✅ 提供完整的任务管理功能
4. ✅ 支持智能项目编排
5. ✅ 具备企业级稳定性和性能

现在您可以通过Claude Desktop等MCP客户端使用TaskFlow AI的强大功能！
