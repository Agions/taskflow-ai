# 安装问题故障排除

## 概述

本文档帮助解决TaskFlow AI安装过程中可能遇到的各种问题，包括npm安装、权限问题、依赖冲突等。

## 🚀 常见安装问题

### 1. npm安装失败

#### 问题描述

```bash
npm install -g taskflow-ai
# 错误: EACCES: permission denied
```

#### 解决方案

**方案1: 使用sudo（Linux/macOS）**

```bash
sudo npm install -g taskflow-ai
```

**方案2: 配置npm全局目录**

```bash
# 创建全局目录
mkdir ~/.npm-global

# 配置npm使用新目录
npm config set prefix '~/.npm-global'

# 添加到PATH
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# 重新安装
npm install -g taskflow-ai
```

**方案3: 使用npx（推荐）**

```bash
# 无需全局安装，直接使用
npx taskflow-ai --version
npx taskflow-ai init
```

### 2. Node.js版本不兼容

#### 问题描述

```bash
npm install -g taskflow-ai
# 错误: engine "node" is incompatible with this module
```

#### 解决方案

**检查Node.js版本**

```bash
node --version
# 需要 Node.js 18.0.0 或更高版本
```

**升级Node.js**

```bash
# 使用nvm升级（推荐）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# 或直接从官网下载安装
# https://nodejs.org/
```

### 3. 网络连接问题

#### 问题描述

```bash
npm install -g taskflow-ai
# 错误: network timeout / ENOTFOUND
```

#### 解决方案

**配置npm镜像源**

```bash
# 使用淘宝镜像
npm config set registry https://registry.npmmirror.com

# 或使用cnpm
npm install -g cnpm --registry=https://registry.npmmirror.com
cnpm install -g taskflow-ai
```

**配置代理**

```bash
# 设置HTTP代理
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# 设置代理认证
npm config set proxy http://username:password@proxy.company.com:8080
```

### 4. 依赖冲突

#### 问题描述

```bash
npm install -g taskflow-ai
# 错误: peer dep missing / conflicting dependencies
```

#### 解决方案

**清理npm缓存**

```bash
npm cache clean --force
```

**删除node_modules重新安装**

```bash
rm -rf node_modules package-lock.json
npm install
```

**使用--force标志**

```bash
npm install -g taskflow-ai --force
```

**设置工作目录权限**

```bash
# 确保目录可写
chmod 755 $(pwd)
```

## 🖥️ 平台特定问题

### Windows平台

#### PowerShell执行策略问题

```powershell
# 错误: execution of scripts is disabled
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 路径问题

```cmd
# 添加npm全局路径到PATH
set PATH=%PATH%;%APPDATA%\npm
```

#### 长路径问题

```cmd
# 启用长路径支持
git config --system core.longpaths true
```

### macOS平台

#### Xcode命令行工具缺失

```bash
# 安装Xcode命令行工具
xcode-select --install
```

#### Homebrew权限问题

```bash
# 修复Homebrew权限
sudo chown -R $(whoami) $(brew --prefix)/*
```

### Linux平台

#### 缺少构建工具

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install build-essential

# CentOS/RHEL
sudo yum groupinstall "Development Tools"
sudo yum install gcc gcc-c++ make
```

#### Python依赖问题

```bash
# 安装Python开发包
sudo apt-get install python3-dev python3-pip
```

## 🔧 验证安装

### 基本验证

```bash
# 检查版本
taskflow --version

# 检查帮助
taskflow --help

# 检查命令可用性
taskflow init --help
taskflow parse --help
```

### 完整验证

```bash
# 创建测试目录
mkdir taskflow-test
cd taskflow-test

# 初始化测试
taskflow init

# 检查配置文件
ls -la .taskflow/
cat .taskflow/config.json

# 清理测试
cd ..
rm -rf taskflow-test
```

## 🩺 诊断工具

### 系统诊断

```bash
# 运行系统诊断
taskflow doctor

# 检查依赖
taskflow doctor dependencies

# 检查配置
taskflow doctor config
```

### 手动诊断

```bash
# 检查Node.js环境
node --version
npm --version

# 检查全局包
npm list -g --depth=0

# 检查npm配置
npm config list

# 检查网络连接
ping registry.npmjs.org
```

## 🔄 重新安装

### 完全卸载

```bash
# 卸载全局包
npm uninstall -g taskflow-ai

# 清理npm缓存
npm cache clean --force

# 清理配置（可选）
rm -rf ~/.taskflow
```

### 重新安装

```bash
# 更新npm
npm install -g npm@latest

# 重新安装TaskFlow AI
npm install -g taskflow-ai

# 验证安装
taskflow --version
```

## 🆘 获取帮助

### 收集诊断信息

```bash
# 生成诊断报告
taskflow doctor --export diagnosis.txt

# 包含以下信息：
# - 系统信息
# - Node.js版本
# - npm配置
# - 错误日志
# - 网络状态
```

### 报告问题

当需要报告安装问题时，请提供：

1. **系统信息**
   - 操作系统版本
   - Node.js版本
   - npm版本

2. **错误信息**
   - 完整的错误消息
   - 安装命令
   - 错误发生的步骤

3. **环境信息**
   - 网络环境（是否使用代理）
   - 权限设置
   - 之前的安装尝试

### 联系支持

- **GitHub Issues**: [提交问题](https://github.com/agions/taskflow-ai/issues)
- **文档**: [查看文档](https://agions.github.io/taskflow-ai/)
- **社区**: [讨论区](https://github.com/Agions/taskflow-ai/issues)

## 📚 相关文档

- [安装指南](../guide/installation.md) - 详细安装说明
- [快速开始](../guide/getting-started.md) - 安装后的第一步
- [配置问题](./configuration.md) - 配置相关问题
- [常见问题](./common-issues.md) - 其他常见问题
