# 配置问题故障排除

## 概述

本文档帮助解决TaskFlow AI配置相关的问题，包括API密钥配置、模型连接、权限设置等。

## 🔑 API密钥问题

### 1. API密钥无效

#### 问题症状
```bash
taskflow models test deepseek
# 错误: TF-CF-004: API密钥无效
```

#### 诊断步骤
```bash
# 检查当前配置的API密钥
taskflow config get models.deepseek.apiKey

# 验证API密钥格式
# DeepSeek: sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# 智谱AI: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxx
```

#### 解决方案
```bash
# 重新设置正确的API密钥
taskflow config set models.deepseek.apiKey "sk-your-correct-api-key"

# 或使用环境变量
export TASKFLOW_DEEPSEEK_API_KEY="sk-your-correct-api-key"

# 测试连接
taskflow models test deepseek
```

### 2. API密钥未配置

#### 问题症状
```bash
taskflow parse docs/requirements.md
# 错误: TF-CF-003: API密钥未配置
```

#### 解决方案
```bash
# 配置主要模型API密钥
taskflow config set models.deepseek.apiKey "your-deepseek-key"

# 配置备用模型
taskflow config set models.zhipu.apiKey "your-zhipu-key"

# 验证配置
taskflow config validate
```

### 3. API密钥权限不足

#### 问题症状
```bash
taskflow models test
# 错误: 403 Forbidden / insufficient permissions
```

#### 解决方案
- 检查API密钥是否有正确的权限
- 确认账户余额充足
- 联系API提供商确认账户状态

## 🔧 配置文件问题

### 1. 配置文件损坏

#### 问题症状
```bash
taskflow config list
# 错误: TF-CF-002: 配置文件格式错误
```

#### 诊断步骤
```bash
# 检查配置文件
cat .taskflow/config.json

# 验证JSON格式
python -m json.tool .taskflow/config.json
```

#### 解决方案
```bash
# 备份现有配置
cp .taskflow/config.json .taskflow/config.json.backup

# 重置配置文件
taskflow config reset

# 重新配置必要设置
taskflow config set models.deepseek.apiKey "your-api-key"
```

### 2. 配置文件权限问题

#### 问题症状
```bash
taskflow config set models.deepseek.apiKey "key"
# 错误: TF-CF-005: 配置权限错误
```

#### 解决方案
```bash
# 检查文件权限
ls -la .taskflow/

# 修复权限
chmod 644 .taskflow/config.json
chmod 755 .taskflow/

# 检查目录所有者
sudo chown -R $USER:$USER .taskflow/
```

### 3. 配置目录不存在

#### 问题症状
```bash
taskflow config list
# 错误: TF-CF-001: 配置文件不存在
```

#### 解决方案
```bash
# 检查当前目录
pwd
ls -la

# 重新初始化项目
taskflow init

# 或切换到正确的项目目录
cd /path/to/your/project
taskflow init
```

## 🤖 模型配置问题

### 1. 模型连接失败

#### 问题症状
```bash
taskflow models test
# 错误: TF-NW-001: 网络连接失败
```

#### 诊断步骤
```bash
# 测试网络连接
ping api.deepseek.com
curl -I https://api.deepseek.com

# 检查代理设置
echo $HTTP_PROXY
echo $HTTPS_PROXY
```

#### 解决方案
```bash
# 配置代理（如果需要）
export TASKFLOW_HTTP_PROXY="http://proxy.company.com:8080"
export TASKFLOW_HTTPS_PROXY="https://proxy.company.com:8080"

# 或在配置中设置
taskflow config set network.proxy.http "http://proxy.company.com:8080"
taskflow config set network.proxy.https "https://proxy.company.com:8080"
```

### 2. 多模型配置错误

#### 问题症状
```bash
taskflow parse docs/requirements.md --multi-model
# 错误: 没有可用的模型
```

#### 解决方案
```bash
# 启用多模型支持
taskflow config set multiModel.enabled true

# 设置主要模型
taskflow config set multiModel.primary "deepseek"

# 设置备用模型
taskflow config set multiModel.fallback '["zhipu", "qwen"]'

# 验证模型状态
taskflow models status
```

### 3. 模型参数配置错误

#### 问题症状
```bash
taskflow parse docs/requirements.md
# 错误: 模型参数无效
```

#### 解决方案
```bash
# 重置模型参数为默认值
taskflow config unset models.deepseek.temperature
taskflow config unset models.deepseek.maxTokens

# 或设置合理的参数
taskflow config set models.deepseek.temperature 0.7
taskflow config set models.deepseek.maxTokens 2000
```

## 🌐 网络配置问题

### 1. 代理配置问题

#### 问题症状
```bash
taskflow models test
# 错误: 代理连接失败
```

#### 解决方案
```bash
# 检查代理设置
taskflow config get network.proxy

# 测试代理连接
curl --proxy http://proxy.company.com:8080 https://api.deepseek.com

# 配置代理认证
taskflow config set network.proxy.auth "username:password"
```

### 2. SSL证书问题

#### 问题症状
```bash
taskflow models test
# 错误: TF-NW-004: SSL证书验证失败
```

#### 解决方案
```bash
# 临时禁用SSL验证（仅用于调试）
export TASKFLOW_DISABLE_SSL_VERIFY=true

# 或配置自定义CA证书
export TASKFLOW_CA_CERT_PATH="/path/to/ca-cert.pem"

# 更新系统CA证书
sudo apt-get update && sudo apt-get install ca-certificates
```

### 3. 防火墙问题

#### 问题症状
```bash
taskflow models test
# 错误: 连接被拒绝
```

#### 解决方案
- 检查防火墙设置
- 确保允许HTTPS出站连接
- 联系网络管理员开放必要端口

## 🏢 企业环境配置

### 1. 企业代理配置

#### 配置企业代理
```bash
# 设置企业代理
taskflow config set network.proxy.http "http://proxy.company.com:8080"
taskflow config set network.proxy.https "https://proxy.company.com:8080"

# 设置代理认证
taskflow config set network.proxy.auth "domain\\username:password"

# 设置不使用代理的地址
taskflow config set network.proxy.noProxy "localhost,127.0.0.1,.company.com"
```

### 2. 企业SSL证书

#### 配置企业CA证书
```bash
# 设置企业CA证书路径
taskflow config set network.ssl.caPath "/etc/ssl/certs/company-ca.pem"

# 或禁用SSL验证（不推荐）
taskflow config set network.ssl.verify false
```

### 3. 企业安全策略

#### 配置安全设置
```bash
# 启用API密钥加密
taskflow config set security.encryptApiKeys true

# 设置加密密钥
export TASKFLOW_ENCRYPTION_KEY="your-32-character-encryption-key"

# 启用审计日志
taskflow config set security.auditLog true
```

## 🔍 配置诊断

### 1. 配置验证

#### 运行配置验证
```bash
# 完整配置验证
taskflow config validate

# 验证特定配置
taskflow config validate --section models
taskflow config validate --section network
```

### 2. 配置导出和导入

#### 导出配置模板
```bash
# 导出当前配置（排除敏感信息）
taskflow config export --template config-template.json

# 导出完整配置（包含敏感信息）
taskflow config export --full config-full.json
```

#### 导入配置
```bash
# 导入配置模板
taskflow config import config-template.json

# 合并配置
taskflow config import config-template.json --merge
```

### 3. 配置重置

#### 重置特定配置
```bash
# 重置模型配置
taskflow config reset --section models

# 重置网络配置
taskflow config reset --section network
```

#### 完全重置
```bash
# 备份当前配置
taskflow config export --full config-backup.json

# 完全重置配置
taskflow config reset --all

# 重新初始化
taskflow init
```

## 🛠️ 高级配置

### 1. 环境特定配置

#### 开发环境配置
```bash
taskflow config env development
taskflow config set logging.level debug
taskflow config set performance.cacheSize 50
```

#### 生产环境配置
```bash
taskflow config env production
taskflow config set logging.level error
taskflow config set performance.cacheSize 200
```

### 2. 性能优化配置

#### 缓存配置
```bash
# 设置缓存大小
taskflow config set performance.cacheSize 100

# 设置缓存TTL
taskflow config set performance.cacheTTL 3600000

# 启用缓存压缩
taskflow config set performance.cacheCompression true
```

#### 并发配置
```bash
# 设置最大并发数
taskflow config set performance.maxConcurrency 5

# 设置请求超时
taskflow config set performance.timeout 30000

# 启用请求队列
taskflow config set performance.enableQueue true
```

## 📋 配置检查清单

### 基本配置检查
- [ ] 项目已初始化 (`taskflow init`)
- [ ] 配置文件存在 (`.taskflow/config.json`)
- [ ] API密钥已配置
- [ ] 模型连接正常

### 网络配置检查
- [ ] 网络连接正常
- [ ] 代理配置正确（如果需要）
- [ ] SSL证书验证通过
- [ ] 防火墙允许连接

### 安全配置检查
- [ ] API密钥安全存储
- [ ] 文件权限正确
- [ ] 审计日志启用（企业环境）
- [ ] 加密配置正确（企业环境）

## 📚 相关文档

- [配置参考](../reference/configuration.md) - 完整配置选项
- [环境变量](../reference/environment.md) - 环境变量配置
- [安装问题](./installation.md) - 安装相关问题
- [常见问题](./common-issues.md) - 其他常见问题
