# TaskFlow AI 故障排除指南

## 🚨 常见问题解决

### 安装问题

#### 问题1：npm安装失败
```bash
# 错误信息
npm ERR! code EACCES
npm ERR! syscall access
npm ERR! path /usr/local/lib/node_modules
```

**解决方案**:
```bash
# 方法1：使用sudo（不推荐）
sudo npm install -g taskflow-ai

# 方法2：配置npm全局目录（推荐）
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g taskflow-ai

# 方法3：使用nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install node
npm install -g taskflow-ai
```

#### 问题2：Node.js版本不兼容
```bash
# 错误信息
Error: TaskFlow AI requires Node.js version 18.0.0 or higher
```

**解决方案**:
```bash
# 检查当前版本
node --version

# 升级Node.js
# 使用nvm
nvm install 18
nvm use 18

# 或下载最新版本
# https://nodejs.org/
```

### 配置问题

#### 问题3：API密钥配置错误
```bash
# 错误信息
Error: Invalid API key for model 'deepseek'
```

**解决方案**:
```bash
# 检查当前配置
taskflow-ai config list

# 重新设置API密钥
taskflow-ai config set models.apiKeys.deepseek "sk-your-actual-api-key"

# 验证API密钥
taskflow-ai test-connection deepseek

# 检查配置文件
cat ~/.taskflow-ai/config.json
```

#### 问题4：配置文件损坏
```bash
# 错误信息
Error: Failed to parse config file
```

**解决方案**:
```bash
# 备份当前配置
cp ~/.taskflow-ai/config.json ~/.taskflow-ai/config.json.backup

# 重置配置
taskflow-ai config reset

# 或手动删除配置文件
rm ~/.taskflow-ai/config.json

# 重新初始化
taskflow-ai config set models.default "deepseek"
```

### 解析问题

#### 问题5：PRD解析失败
```bash
# 错误信息
Error: Failed to parse PRD document
```

**解决方案**:
```bash
# 启用详细日志
taskflow-ai parse prd.md --verbose

# 检查文件编码
file -I prd.md
# 应该显示: text/plain; charset=utf-8

# 转换文件编码（如果需要）
iconv -f gbk -t utf-8 prd.md > prd_utf8.md

# 尝试不同的模型
taskflow-ai parse prd.md --model zhipu

# 检查文件格式
taskflow-ai validate prd.md
```

#### 问题6：解析结果不准确
```bash
# 问题：生成的任务不符合预期
```

**解决方案**:
```bash
# 优化PRD文档结构
# 1. 使用清晰的标题层级
# 2. 详细描述功能需求
# 3. 明确技术要求

# 调整解析参数
taskflow-ai parse prd.md \
  --extract-sections \
  --extract-features \
  --prioritize \
  --model deepseek

# 使用自定义提示词
taskflow-ai parse prd.md --prompt-template custom-prompt.txt
```

### 网络问题

#### 问题7：网络连接超时
```bash
# 错误信息
Error: Request timeout after 30000ms
```

**解决方案**:
```bash
# 检查网络连接
ping api.deepseek.com
ping open.bigmodel.cn

# 配置代理
taskflow-ai config set proxy.http "http://proxy.company.com:8080"
taskflow-ai config set proxy.https "https://proxy.company.com:8080"

# 增加超时时间
taskflow-ai config set network.timeout 60000

# 使用国内镜像（如果可用）
taskflow-ai config set models.endpoints.deepseek "https://api.deepseek.com.cn"
```

#### 问题8：SSL证书错误
```bash
# 错误信息
Error: unable to verify the first certificate
```

**解决方案**:
```bash
# 临时禁用SSL验证（不推荐用于生产环境）
export NODE_TLS_REJECT_UNAUTHORIZED=0

# 或配置证书
taskflow-ai config set network.rejectUnauthorized false

# 更新系统证书
# Ubuntu/Debian
sudo apt-get update && sudo apt-get install ca-certificates

# CentOS/RHEL
sudo yum update ca-certificates
```

### 性能问题

#### 问题9：解析速度慢
```bash
# 问题：大型PRD文档解析时间过长
```

**解决方案**:
```bash
# 分块处理大文档
taskflow-ai parse large-prd.md --chunk-size 2000

# 使用更快的模型
taskflow-ai parse prd.md --model deepseek --fast-mode

# 并行处理
taskflow-ai parse prd.md --parallel --workers 4

# 缓存结果
taskflow-ai parse prd.md --cache --cache-ttl 3600
```

#### 问题10：内存使用过高
```bash
# 错误信息
Error: JavaScript heap out of memory
```

**解决方案**:
```bash
# 增加Node.js内存限制
export NODE_OPTIONS="--max-old-space-size=4096"

# 或在命令中指定
node --max-old-space-size=4096 $(which taskflow-ai) parse large-prd.md

# 使用流式处理
taskflow-ai parse prd.md --stream --batch-size 100
```

## 🔧 最佳实践

### PRD文档编写规范

#### 1. 文档结构
```markdown
# 项目标题

## 1. 项目概述
- 项目背景
- 目标用户
- 核心价值

## 2. 功能需求
### 2.1 核心功能
- 功能1：详细描述
- 功能2：详细描述

### 2.2 辅助功能
- 功能A：详细描述
- 功能B：详细描述

## 3. 技术要求
### 3.1 技术栈
- 前端：具体技术
- 后端：具体技术
- 数据库：具体技术

### 3.2 架构要求
- 系统架构
- 部署要求

## 4. 非功能需求
### 4.1 性能要求
- 响应时间
- 并发用户数
- 吞吐量

### 4.2 安全要求
- 数据安全
- 访问控制
- 合规要求
```

#### 2. 描述规范
```markdown
# 好的描述示例
## 用户登录功能
- **功能描述**: 用户可以通过邮箱和密码登录系统
- **输入**: 邮箱地址、密码
- **输出**: 登录成功后跳转到首页，失败显示错误信息
- **验证规则**: 
  - 邮箱格式验证
  - 密码长度8-20位
  - 连续失败3次锁定账号
- **异常处理**: 网络异常、服务器错误的处理方式

# 避免的描述
## 登录
- 用户登录 ❌ (描述过于简单)
```

### 配置管理最佳实践

#### 1. 环境配置
```bash
# 开发环境
taskflow-ai config set models.default "deepseek"
taskflow-ai config set models.options.temperature 0.7

# 生产环境
taskflow-ai config set models.default "zhipu"
taskflow-ai config set models.options.temperature 0.3
taskflow-ai config set features.autoSave true
```

#### 2. 团队配置同步
```bash
# 导出配置
taskflow-ai config export --output team-config.json

# 导入配置
taskflow-ai config import team-config.json

# 项目级配置
echo '{
  "models": {
    "default": "deepseek",
    "options": {
      "temperature": 0.5
    }
  }
}' > taskflow.config.json
```

### 任务管理最佳实践

#### 1. 任务命名规范
```bash
# 好的任务命名
- "实现用户注册API接口"
- "设计商品详情页UI"
- "编写单元测试-用户模块"

# 避免的命名
- "做登录" ❌
- "前端" ❌
- "修复bug" ❌
```

#### 2. 任务优先级设置
```bash
# 关键路径任务
taskflow-ai tasks update task-001 --priority critical

# 依赖关系管理
taskflow-ai tasks add-dependency task-002 task-001

# 里程碑设置
taskflow-ai milestones create "MVP完成" --date "2024-03-01"
```

### 性能优化建议

#### 1. 缓存策略
```bash
# 启用解析缓存
taskflow-ai config set cache.enabled true
taskflow-ai config set cache.ttl 3600

# 清理缓存
taskflow-ai cache clear

# 查看缓存状态
taskflow-ai cache status
```

#### 2. 批量操作
```bash
# 批量解析
find docs -name "*.md" -exec taskflow-ai parse {} \;

# 批量更新任务
taskflow-ai tasks batch-update --status completed --filter "type=test"
```

## 🔍 调试技巧

### 启用调试模式
```bash
# 设置调试级别
export DEBUG=taskflow:*
taskflow-ai parse prd.md

# 或使用配置
taskflow-ai config set logger.level debug
taskflow-ai config set logger.output file
```

### 日志分析
```bash
# 查看日志文件
tail -f ~/.taskflow-ai/logs/taskflow.log

# 搜索错误
grep "ERROR" ~/.taskflow-ai/logs/taskflow.log

# 分析性能
grep "PERF" ~/.taskflow-ai/logs/taskflow.log
```

### 问题报告
当遇到无法解决的问题时，请提供以下信息：

1. **系统信息**:
```bash
taskflow-ai --version
node --version
npm --version
uname -a
```

2. **配置信息**:
```bash
taskflow-ai config list --sanitized
```

3. **错误日志**:
```bash
taskflow-ai parse prd.md --verbose 2>&1 | tee error.log
```

4. **重现步骤**:
- 详细的操作步骤
- 使用的命令
- 预期结果 vs 实际结果

## 📞 获取帮助
- **GitHub Issues**: [https://github.com/agions/taskflow-ai/issues](https://github.com/agions/taskflow-ai/issues)
- **社区讨论**: [https://github.com/agions/taskflow-ai/discussions](https://github.com/agions/taskflow-ai/discussions)
- **邮件支持**: 1051736049@qq.com

## 🔄 版本更新

### 检查更新
```bash
# 检查当前版本
taskflow-ai --version

# 检查可用更新
npm outdated -g taskflow-ai

# 更新到最新版本
npm update -g taskflow-ai
```

### 版本兼容性
- v1.x: 支持基础PRD解析
- v2.x: 增加AI模型集成
- v3.x: 支持项目管理功能
- v4.x: 企业级功能和性能优化

记住：遇到问题时，首先查看日志，然后参考本指南，最后再寻求社区帮助。大多数问题都有标准的解决方案！
