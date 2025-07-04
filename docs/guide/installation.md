# 安装和配置指南

## 系统要求

### 最低要求
- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0 或 **yarn**: >= 1.22.0
- **操作系统**: Windows 10+, macOS 10.15+, Linux (Ubuntu 18.04+)
- **内存**: 最少 2GB RAM
- **磁盘空间**: 最少 500MB 可用空间

### 推荐配置
- **Node.js**: >= 20.0.0
- **npm**: >= 10.0.0
- **内存**: 4GB+ RAM
- **磁盘空间**: 2GB+ 可用空间
- **网络**: 稳定的互联网连接（用于AI模型API调用）

## 安装方式

### 1. 全局安装（推荐）

全局安装可以在任何目录下使用 `taskflow` 命令：

```bash
# 使用 npm
npm install -g taskflow-ai

# 使用 yarn
yarn global add taskflow-ai

# 使用 pnpm
pnpm add -g taskflow-ai
```

安装完成后验证：

```bash
taskflow --version
taskflow --help
```

### 2. 项目本地安装

如果你只想在特定项目中使用 TaskFlow AI：

```bash
# 进入项目目录
cd your-project

# 安装为开发依赖
npm install --save-dev taskflow-ai

# 或安装为生产依赖
npm install --save taskflow-ai
```

使用 npx 运行：

```bash
npx taskflow --version
npx taskflow init
```

### 3. 从源码安装

适合开发者或需要最新功能的用户：

```bash
# 克隆仓库
git clone https://github.com/agions/taskflow-ai.git
cd taskflow-ai

# 安装依赖
npm install

# 构建项目
npm run build

# 链接到全局
npm link

# 验证安装
taskflow --version
```

### 4. 使用包管理器

#### Homebrew (macOS)

```bash
# 添加 tap（如果有的话）
brew tap agions/taskflow-ai

# 安装
brew install taskflow-ai
```

#### Chocolatey (Windows)

```bash
# 安装
choco install taskflow-ai
```

#### Snap (Linux)

```bash
# 安装
sudo snap install taskflow-ai
```

## 初始配置

### 1. 创建配置文件

首次运行时，TaskFlow AI 会自动创建配置文件：

```bash
# 初始化配置
taskflow config init

# 查看配置文件位置
taskflow config path
```

配置文件位置：
- **Windows**: `%USERPROFILE%\.taskflow\config.json`
- **macOS**: `~/.taskflow/config.json`
- **Linux**: `~/.taskflow/config.json`

### 2. 配置AI模型

TaskFlow AI 支持多个国产大模型，你需要配置至少一个模型的API密钥：

#### DeepSeek 配置

```bash
# 设置 DeepSeek API 密钥
taskflow config set models.deepseek.apiKey "your-deepseek-api-key"

# 设置自定义 API 端点（可选）
taskflow config set models.deepseek.baseUrl "https://api.deepseek.com"
```

#### 智谱AI (GLM) 配置

```bash
# 设置智谱AI API 密钥
taskflow config set models.zhipu.apiKey "your-zhipu-api-key"
```

#### 通义千问 (Qwen) 配置

```bash
# 设置通义千问 API 密钥
taskflow config set models.qwen.apiKey "your-qwen-api-key"
```

#### 文心一言 (ERNIE) 配置

```bash
# 设置文心一言 API 密钥和密钥
taskflow config set models.baidu.apiKey "your-api-key"
taskflow config set models.baidu.secretKey "your-secret-key"
```

### 3. 验证配置

```bash
# 验证所有配置
taskflow config validate

# 测试AI模型连接
taskflow models test

# 查看当前配置
taskflow config list
```

### 4. 高级配置

#### 多模型配置

```bash
# 启用多模型支持
taskflow config set multiModel.enabled true

# 设置主要模型
taskflow config set multiModel.primary "deepseek"

# 设置备用模型
taskflow config set multiModel.fallback '["zhipu", "qwen"]'

# 启用负载均衡
taskflow config set multiModel.loadBalancing true

# 启用成本优化
taskflow config set multiModel.costOptimization true
```

#### 日志配置

```bash
# 设置日志级别
taskflow config set logging.level "info"

# 设置日志输出方式
taskflow config set logging.output "both"

# 设置日志文件路径
taskflow config set logging.file "./logs/taskflow.log"
```

#### 性能配置

```bash
# 启用性能监控
taskflow config set performance.enableMonitoring true

# 设置缓存大小
taskflow config set performance.cacheSize 200

# 设置请求超时时间
taskflow config set performance.timeout 30000
```

## 环境变量配置

你也可以使用环境变量来配置 TaskFlow AI：

```bash
# AI模型配置
export TASKFLOW_DEEPSEEK_API_KEY="your-api-key"
export TASKFLOW_ZHIPU_API_KEY="your-api-key"
export TASKFLOW_QWEN_API_KEY="your-api-key"

# 日志配置
export TASKFLOW_LOG_LEVEL="debug"
export TASKFLOW_LOG_OUTPUT="console"

# 性能配置
export TASKFLOW_ENABLE_MONITORING="true"
export TASKFLOW_CACHE_SIZE="100"
```

环境变量优先级高于配置文件。

## 配置文件示例

完整的配置文件示例：

```json
{
  "version": "1.0.0",
  "models": {
    "deepseek": {
      "apiKey": "your-deepseek-api-key",
      "baseUrl": "https://api.deepseek.com"
    },
    "zhipu": {
      "apiKey": "your-zhipu-api-key"
    },
    "qwen": {
      "apiKey": "your-qwen-api-key"
    },
    "baidu": {
      "apiKey": "your-baidu-api-key",
      "secretKey": "your-baidu-secret-key"
    }
  },
  "multiModel": {
    "enabled": true,
    "primary": "deepseek",
    "fallback": ["zhipu", "qwen"],
    "loadBalancing": true,
    "costOptimization": true
  },
  "logging": {
    "level": "info",
    "output": "both",
    "file": "./logs/taskflow.log"
  },
  "performance": {
    "enableMonitoring": true,
    "cacheSize": 200,
    "timeout": 30000
  },
  "security": {
    "encryptApiKeys": true,
    "validateInputs": true
  },
  "ui": {
    "theme": "default",
    "language": "zh-CN",
    "showProgress": true
  }
}
```

## 故障排除

### 常见安装问题

#### 1. 权限错误

```bash
# macOS/Linux: 使用 sudo
sudo npm install -g taskflow-ai

# 或配置 npm 全局目录
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

#### 2. 网络问题

```bash
# 使用国内镜像
npm install -g taskflow-ai --registry https://registry.npmmirror.com

# 或配置代理
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
```

#### 3. Node.js 版本问题

```bash
# 使用 nvm 管理 Node.js 版本
nvm install 18
nvm use 18
npm install -g taskflow-ai
```

### 常见配置问题

#### 1. API 密钥无效

```bash
# 验证 API 密钥格式
taskflow config validate

# 测试 API 连接
taskflow models test deepseek
```

#### 2. 配置文件损坏

```bash
# 重置配置文件
taskflow config reset

# 重新初始化
taskflow config init
```

#### 3. 权限问题

```bash
# 检查配置文件权限
ls -la ~/.taskflow/

# 修复权限
chmod 600 ~/.taskflow/config.json
```

## 更新和卸载

### 更新 TaskFlow AI

```bash
# 检查当前版本
taskflow --version

# 更新到最新版本
npm update -g taskflow-ai

# 或重新安装
npm uninstall -g taskflow-ai
npm install -g taskflow-ai
```

### 卸载 TaskFlow AI

```bash
# 卸载全局安装
npm uninstall -g taskflow-ai

# 清理配置文件（可选）
rm -rf ~/.taskflow

# 清理缓存
npm cache clean --force
```

## 下一步

安装和配置完成后，你可以：

1. [查看快速开始教程](./getting-started.md)
2. [学习基本使用方法](./basic-usage.md)
3. [探索高级功能](./advanced-features.md)
4. [查看CLI命令参考](../cli/commands.md)

如果遇到问题，请查看：
- [常见问题解答](../faq.md)
- [故障排除指南](../troubleshooting/common-issues.md)
- [GitHub Issues](https://github.com/agions/taskflow-ai/issues)
