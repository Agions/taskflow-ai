# 故障排除指南

## 概述

本指南收集了 TaskFlow AI 使用过程中的常见问题和解决方案。如果你遇到的问题不在此列表中，请查看 [GitHub Issues](https://github.com/agions/taskflow-ai/issues) 或提交新的问题报告。

## 安装问题

### 1. npm 安装失败

#### 问题描述
```bash
npm ERR! code EACCES
npm ERR! syscall access
npm ERR! path /usr/local/lib/node_modules
npm ERR! errno -13
```

#### 解决方案
```bash
# 方案1: 使用 sudo (不推荐)
sudo npm install -g taskflow-ai

# 方案2: 配置 npm 全局目录 (推荐)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g taskflow-ai

# 方案3: 使用 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install node
npm install -g taskflow-ai
```

### 2. Node.js 版本不兼容

#### 问题描述
```bash
Error: TaskFlow AI requires Node.js >= 18.0.0
Current version: v16.14.0
```

#### 解决方案
```bash
# 使用 nvm 升级 Node.js
nvm install 18
nvm use 18
nvm alias default 18

# 验证版本
node --version
npm install -g taskflow-ai
```

### 3. 网络连接问题

#### 问题描述
```bash
npm ERR! network request to https://registry.npmjs.org/taskflow-ai failed
npm ERR! network This is a problem related to network connectivity
```

#### 解决方案
```bash
# 使用国内镜像
npm install -g taskflow-ai --registry https://registry.npmmirror.com

# 配置代理
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# 清理缓存
npm cache clean --force
```

## 配置问题

### 1. API 密钥无效

#### 问题描述
```bash
Error: Invalid API key for DeepSeek model
API returned: 401 Unauthorized
```

#### 解决方案
```bash
# 检查 API 密钥格式
taskflow config get models.deepseek.apiKey

# 重新设置 API 密钥
taskflow config set models.deepseek.apiKey "sk-xxxxxxxxxxxxxxxx"

# 测试连接
taskflow models test deepseek

# 检查 API 密钥是否过期
curl -H "Authorization: Bearer your-api-key" https://api.deepseek.com/v1/models
```

### 2. 配置文件损坏

#### 问题描述
```bash
Error: Failed to parse configuration file
SyntaxError: Unexpected token } in JSON at position 245
```

#### 解决方案
```bash
# 验证 JSON 格式
cat ~/.taskflow/config.json | jq .

# 备份当前配置
cp ~/.taskflow/config.json ~/.taskflow/config.json.backup

# 重新初始化配置
taskflow config init --force

# 从备份恢复部分配置
taskflow config import ~/.taskflow/config.json.backup --merge
```

### 3. 权限问题

#### 问题描述
```bash
Error: EACCES: permission denied, open '/Users/username/.taskflow/config.json'
```

#### 解决方案
```bash
# 检查文件权限
ls -la ~/.taskflow/

# 修复权限
chmod 755 ~/.taskflow
chmod 600 ~/.taskflow/config.json

# 检查所有者
sudo chown -R $USER:$USER ~/.taskflow
```

## AI 模型问题

### 1. 模型连接超时

#### 问题描述
```bash
Error: Request timeout after 30000ms
Model: deepseek
Operation: text processing
```

#### 解决方案
```bash
# 增加超时时间
taskflow config set models.deepseek.timeout 60000

# 检查网络连接
ping api.deepseek.com

# 使用备用模型
taskflow config set multiModel.enabled true
taskflow config set multiModel.fallback '["zhipu", "qwen"]'

# 测试连接
taskflow models test --timeout 60000
```

### 2. API 配额超限

#### 问题描述
```bash
Error: API quota exceeded
Model: zhipu
Remaining quota: 0
Reset time: 2024-01-01T00:00:00Z
```

#### 解决方案
```bash
# 检查配额状态
taskflow models status

# 启用多模型负载均衡
taskflow config set multiModel.enabled true
taskflow config set multiModel.loadBalancing true

# 启用成本优化
taskflow config set multiModel.costOptimization true

# 设置速率限制
taskflow config set security.enableRateLimit true
taskflow config set security.rateLimitMax 50
```

### 3. 模型响应质量差

#### 问题描述
解析结果不准确或任务生成质量低

#### 解决方案
```bash
# 尝试不同的模型
taskflow parse requirements.md --model zhipu

# 启用多模型对比
taskflow models benchmark --task parsing

# 调整模型参数
taskflow config set models.deepseek.temperature 0.7
taskflow config set models.deepseek.maxTokens 4000

# 优化输入格式
# 确保 PRD 文档结构清晰，包含明确的需求描述
```

## 解析问题

### 1. PRD 文档解析失败

#### 问题描述
```bash
Error: Failed to parse PRD document
File: requirements.md
Reason: Unsupported format or corrupted file
```

#### 解决方案
```bash
# 检查文件格式
file requirements.md

# 检查文件编码
file -i requirements.md

# 转换编码
iconv -f GBK -t UTF-8 requirements.md > requirements_utf8.md

# 验证 Markdown 格式
markdownlint requirements.md

# 尝试不同的解析选项
taskflow parse requirements.md --extract-sections
taskflow parse requirements.md --model zhipu
```

### 2. 任务生成不完整

#### 问题描述
解析后生成的任务数量少于预期，或缺少重要任务

#### 解决方案
```bash
# 启用详细解析
taskflow parse requirements.md --extract-sections --extract-features

# 使用多模型协同
taskflow parse requirements.md --multi-model

# 检查 PRD 文档结构
# 确保包含以下部分：
# - 功能需求
# - 技术要求
# - 验收标准
# - 优先级说明

# 手动补充任务
taskflow status add "补充任务名称" --description "详细描述"
```

### 3. 依赖关系识别错误

#### 问题描述
生成的任务依赖关系不正确或缺失

#### 解决方案
```bash
# 重新分析依赖关系
taskflow status analyze-dependencies

# 手动调整依赖关系
taskflow status update task-001 --dependencies "task-002,task-003"

# 可视化依赖关系
taskflow status dependencies --graph

# 验证依赖关系
taskflow status validate-dependencies
```

## 性能问题

### 1. 命令执行缓慢

#### 问题描述
TaskFlow AI 命令执行时间过长

#### 解决方案
```bash
# 启用性能监控
taskflow config set performance.enableMonitoring true

# 查看性能统计
taskflow performance stats

# 优化缓存设置
taskflow config set performance.cacheSize 200
taskflow config set performance.cacheTTL 600000

# 增加并发数
taskflow config set performance.concurrency 10

# 清理缓存
taskflow cache clear
```

### 2. 内存使用过高

#### 问题描述
TaskFlow AI 占用大量内存

#### 解决方案
```bash
# 减少缓存大小
taskflow config set performance.cacheSize 50

# 启用垃圾回收
node --max-old-space-size=4096 $(which taskflow) parse large-file.md

# 分批处理大文件
split -l 100 large-requirements.md requirements_part_

# 监控内存使用
taskflow performance monitor --memory
```

### 3. 网络请求频繁失败

#### 问题描述
AI 模型 API 请求经常失败

#### 解决方案
```bash
# 增加重试次数
taskflow config set performance.retryAttempts 5
taskflow config set performance.retryDelay 2000

# 启用指数退避
taskflow config set performance.backoffStrategy exponential

# 检查网络稳定性
ping -c 10 api.deepseek.com

# 使用本地代理
taskflow config set network.proxy.enabled true
taskflow config set network.proxy.host "127.0.0.1"
taskflow config set network.proxy.port 7890
```

## 数据问题

### 1. 任务数据丢失

#### 问题描述
之前创建的任务突然消失

#### 解决方案
```bash
# 检查数据目录
ls -la ~/.taskflow/data/

# 恢复备份
taskflow backup list
taskflow backup restore latest

# 检查数据完整性
taskflow data validate

# 重建索引
taskflow data reindex
```

### 2. 配置重置

#### 问题描述
配置设置被意外重置

#### 解决方案
```bash
# 检查配置历史
taskflow config history

# 恢复配置
taskflow config restore --date "2024-01-01"

# 导入备份配置
taskflow config import config-backup.json

# 启用配置保护
taskflow config set security.protectConfig true
```

### 3. 数据同步问题

#### 问题描述
多设备间数据不同步

#### 解决方案
```bash
# 手动同步数据
taskflow sync pull
taskflow sync push

# 检查同步状态
taskflow sync status

# 解决冲突
taskflow sync resolve --strategy merge

# 重新初始化同步
taskflow sync init --force
```

## 诊断工具

### 1. 系统诊断

```bash
# 运行完整诊断
taskflow doctor

# 检查系统信息
taskflow info

# 验证安装
taskflow verify

# 测试所有功能
taskflow test --all
```

### 2. 日志分析

```bash
# 查看最近日志
taskflow logs --tail 50

# 查看错误日志
taskflow logs --level error

# 导出日志
taskflow logs --export debug-logs.txt

# 清理日志
taskflow logs --clean --older-than 7d
```

### 3. 性能分析

```bash
# 生成性能报告
taskflow performance report

# 分析瓶颈
taskflow performance analyze

# 基准测试
taskflow benchmark --operations parsing,task-creation

# 内存分析
taskflow memory-profile --operation parse
```

## 获取帮助

### 1. 内置帮助

```bash
# 查看总体帮助
taskflow --help

# 查看特定命令帮助
taskflow parse --help
taskflow config --help

# 查看示例
taskflow examples

# 查看版本信息
taskflow --version
```

### 2. 在线资源

- **文档**: [https://agions.github.io/taskflow-ai](https://agions.github.io/taskflow-ai)
- **GitHub Issues**: [https://github.com/agions/taskflow-ai/issues](https://github.com/agions/taskflow-ai/issues)
- **讨论区**: [https://github.com/agions/taskflow-ai/discussions](https://github.com/agions/taskflow-ai/discussions)

### 3. 社区支持

- **QQ群**: 123456789
- **微信群**: 扫描二维码加入
- **邮件**: 1051736049@qq.com

## 报告问题

### 问题报告模板

当报告问题时，请提供以下信息：

```bash
# 系统信息
taskflow info

# 配置信息
taskflow config list --safe

# 错误日志
taskflow logs --level error --tail 20

# 重现步骤
1. 执行命令: taskflow parse requirements.md
2. 观察到的错误: [错误信息]
3. 预期行为: [预期结果]

# 环境信息
- 操作系统: [macOS 13.0 / Windows 11 / Ubuntu 22.04]
- Node.js 版本: [18.17.0]
- TaskFlow AI 版本: [1.0.0]
```

### 提交 Bug 报告

1. 访问 [GitHub Issues](https://github.com/agions/taskflow-ai/issues)
2. 点击 "New Issue"
3. 选择 "Bug Report" 模板
4. 填写详细信息
5. 添加相关标签
6. 提交问题

## 预防措施

### 1. 定期维护

```bash
# 每周运行诊断
taskflow doctor

# 清理缓存和日志
taskflow cache clear
taskflow logs --clean --older-than 30d

# 更新到最新版本
npm update -g taskflow-ai

# 备份配置和数据
taskflow backup create
```

### 2. 监控设置

```bash
# 启用监控
taskflow config set performance.enableMonitoring true

# 设置告警阈值
taskflow config set monitoring.errorThreshold 10
taskflow config set monitoring.latencyThreshold 5000

# 配置通知
taskflow config set monitoring.notifications.email "admin@example.com"
```

### 3. 最佳实践

- 定期备份配置和数据
- 使用版本控制管理 PRD 文档
- 保持 TaskFlow AI 版本更新
- 监控 API 使用量和成本
- 定期清理日志和缓存
- 使用环境变量管理敏感信息

---

*如果本指南没有解决你的问题，请通过 GitHub Issues 联系我们。*
