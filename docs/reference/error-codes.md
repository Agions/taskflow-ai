# 错误代码参考

## 概述

TaskFlow AI 使用结构化的错误代码系统，帮助用户快速识别和解决问题。本文档列出了所有错误代码及其解决方案。

## 🏷️ 错误代码格式

错误代码格式：`TF-<类别>-<编号>`

- `TF` - TaskFlow AI前缀
- `<类别>` - 错误类别（2位字母）
- `<编号>` - 具体错误编号（3位数字）

## 📋 错误类别

| 类别     | 代码 | 描述          |
| -------- | ---- | ------------- |
| 配置错误 | CF   | Configuration |
| 解析错误 | PR   | Parsing       |
| 网络错误 | NW   | Network       |
| 文件错误 | FL   | File          |
| 模型错误 | MD   | Model         |
| 任务错误 | TK   | Task          |
| 权限错误 | PM   | Permission    |
| 系统错误 | SY   | System        |

## ⚙️ 配置错误 (CF)

### TF-CF-001: 配置文件不存在

**描述**: TaskFlow AI配置文件未找到

**原因**:

- 项目未初始化
- 配置文件被删除
- 工作目录错误

**解决方案**:

```bash
# 重新初始化项目
taskflow init

# 或指定正确的工作目录
cd /path/to/your/project
taskflow init
```

### TF-CF-002: 配置文件格式错误

**描述**: 配置文件JSON格式无效

**解决方案**:

```bash
# 验证配置文件
taskflow config validate

# 重置配置文件
taskflow config reset

# 手动修复JSON格式错误
```

### TF-CF-003: API密钥未配置

**描述**: AI模型API密钥未设置

**解决方案**:

```bash
# 设置DeepSeek API密钥
taskflow config set models.deepseek.apiKey "your-api-key"

# 或使用环境变量
export TASKFLOW_DEEPSEEK_API_KEY="your-api-key"
```

### TF-CF-004: API密钥无效

**描述**: 提供的API密钥格式错误或已过期

**解决方案**:

```bash
# 测试API密钥
taskflow models test deepseek

# 更新API密钥
taskflow config set models.deepseek.apiKey "new-api-key"
```

### TF-CF-005: 配置权限错误

**描述**: 无法读取或写入配置文件

**解决方案**:

```bash
# 检查文件权限
ls -la .taskflow/

# 修复权限
chmod 644 .taskflow/config.json
chmod 755 .taskflow/
```

## 📄 解析错误 (PR)

### TF-PR-001: 文件格式不支持

**描述**: PRD文档格式不受支持

**支持格式**: `.md`, `.txt`, `.docx`

**解决方案**:

```bash
# 转换为支持的格式
# 将Word文档另存为Markdown格式
# 或使用纯文本格式
```

### TF-PR-002: 文档内容为空

**描述**: PRD文档没有有效内容

**解决方案**:

- 检查文档是否包含实际内容
- 确保文档编码正确（UTF-8）
- 验证文档没有损坏

### TF-PR-003: 解析超时

**描述**: PRD解析过程超时

**解决方案**:

```bash
# 增加超时时间
taskflow config set performance.timeout 60000

# 或使用环境变量
export TASKFLOW_TIMEOUT=60000

# 分段解析大文档
```

### TF-PR-004: 内容结构无法识别

**描述**: 文档结构不符合PRD格式要求

**解决方案**:

- 使用标准的Markdown标题结构
- 添加明确的章节划分
- 参考[PRD编写最佳实践](../user-guide/best-practices.md)

### TF-PR-005: 任务生成失败

**描述**: 无法从PRD内容生成有效任务

**解决方案**:

- 确保PRD包含具体的功能需求
- 添加明确的验收标准
- 使用更详细的功能描述

## 🌐 网络错误 (NW)

### TF-NW-001: 网络连接失败

**描述**: 无法连接到AI模型API

**解决方案**:

```bash
# 检查网络连接
ping api.deepseek.com

# 检查代理设置
export TASKFLOW_HTTP_PROXY="http://proxy.company.com:8080"

# 测试连接
taskflow models test
```

### TF-NW-002: API请求超时

**描述**: API请求响应超时

**解决方案**:

```bash
# 增加超时时间
taskflow config set performance.timeout 30000

# 检查网络延迟
ping api.deepseek.com
```

### TF-NW-003: API限流

**描述**: 超出API调用频率限制

**解决方案**:

```bash
# 启用请求限流
taskflow config set performance.rateLimiting true

# 减少并发请求
taskflow config set performance.concurrency 2

# 等待一段时间后重试
```

### TF-NW-004: SSL证书验证失败

**描述**: SSL证书验证错误

**解决方案**:

```bash
# 更新CA证书
# 或临时禁用SSL验证（不推荐）
export TASKFLOW_DISABLE_SSL_VERIFY=true
```

## 📁 文件错误 (FL)

### TF-FL-001: 文件不存在

**描述**: 指定的PRD文件不存在

**解决方案**:

```bash
# 检查文件路径
ls -la docs/requirements.md

# 使用正确的文件路径
taskflow parse docs/correct-requirements.md
```

### TF-FL-002: 文件权限不足

**描述**: 无法读取PRD文件

**解决方案**:

```bash
# 检查文件权限
ls -la docs/requirements.md

# 修复权限
chmod 644 docs/requirements.md
```

### TF-FL-003: 文件编码错误

**描述**: 文件编码不是UTF-8

**解决方案**:

```bash
# 检查文件编码
file docs/requirements.md

# 转换为UTF-8编码
iconv -f GBK -t UTF-8 docs/requirements.md > docs/requirements-utf8.md
```

### TF-FL-004: 文件过大

**描述**: PRD文件超出大小限制

**解决方案**:

- 分割大文档为多个小文档
- 移除不必要的内容
- 压缩图片和附件

## 🤖 模型错误 (MD)

### TF-MD-001: 模型不可用

**描述**: 指定的AI模型当前不可用

**解决方案**:

```bash
# 检查模型状态
taskflow models status

# 使用其他可用模型
taskflow parse docs/requirements.md --model zhipu

# 启用多模型故障转移
taskflow config set multiModel.enabled true
```

### TF-MD-002: 模型响应格式错误

**描述**: AI模型返回的响应格式无效

**解决方案**:

```bash
# 重试请求
taskflow parse docs/requirements.md --retry

# 切换到其他模型
taskflow parse docs/requirements.md --model deepseek
```

### TF-MD-003: 模型配额不足

**描述**: AI模型API配额已用完

**解决方案**:

- 检查API账户余额
- 升级API套餐
- 使用其他模型作为备选

### TF-MD-004: 模型版本不兼容

**描述**: 使用的模型版本不兼容

**解决方案**:

```bash
# 更新TaskFlow AI到最新版本
npm update -g taskflow-ai

# 检查模型兼容性
taskflow models compatibility
```

## 📋 任务错误 (TK)

### TF-TK-001: 任务ID不存在

**描述**: 指定的任务ID不存在

**解决方案**:

```bash
# 查看所有任务ID
taskflow status list

# 使用正确的任务ID
taskflow status update correct-task-id completed
```

### TF-TK-002: 任务状态无效

**描述**: 尝试设置无效的任务状态

**有效状态**: `not_started`, `in_progress`, `completed`, `blocked`, `cancelled`

**解决方案**:

```bash
# 使用有效状态
taskflow status update task-001 in_progress
```

### TF-TK-003: 任务依赖循环

**描述**: 检测到任务依赖循环

**解决方案**:

```bash
# 检查依赖关系
taskflow tasks dependency graph

# 移除循环依赖
taskflow tasks dependency remove task-A task-B
```

## 🔒 权限错误 (PM)

### TF-PM-001: 访问权限不足

**描述**: 当前用户没有执行操作的权限

**解决方案**:

```bash
# 检查用户权限
taskflow users whoami

# 联系管理员分配权限
# 或使用有权限的账户
```

### TF-PM-002: 文件系统权限不足

**描述**: 无法创建或修改文件

**解决方案**:

```bash
# 检查目录权限
ls -la .

# 修复权限
chmod 755 .
chmod 644 .taskflow/config.json
```

## 🖥️ 系统错误 (SY)

### TF-SY-001: 内存不足

**描述**: 系统内存不足

**解决方案**:

```bash
# 减少缓存大小
taskflow config set performance.cacheSize 50

# 清理缓存
taskflow cache clear

# 增加系统内存
```

### TF-SY-002: 磁盘空间不足

**描述**: 磁盘空间不足

**解决方案**:

```bash
# 清理缓存
taskflow cache clear

# 清理日志
taskflow logs --clean

# 释放磁盘空间
```

### TF-SY-003: 依赖缺失

**描述**: 系统依赖缺失

**解决方案**:

```bash
# 检查依赖
taskflow doctor dependencies

# 重新安装TaskFlow AI
npm uninstall -g taskflow-ai
npm install -g taskflow-ai
```

## 🔧 错误处理最佳实践

### 1. 启用详细日志

```bash
export TASKFLOW_LOG_LEVEL=debug
taskflow parse docs/requirements.md --verbose
```

### 2. 使用诊断工具

```bash
# 系统健康检查
taskflow doctor

# 配置验证
taskflow config validate

# 网络连接测试
taskflow models test
```

### 3. 查看错误日志

```bash
# 查看最新错误
taskflow logs --level error

# 查看详细日志
taskflow logs --tail 100
```

## 📞 获取帮助

如果遇到未列出的错误代码：

1. **查看日志**: `taskflow logs --level error`
2. **运行诊断**: `taskflow doctor`
3. **检查文档**: [故障排除指南](../troubleshooting/common-issues.md)
4. **提交Issue**: [GitHub Issues](https://github.com/agions/taskflow-ai/issues)

## 📚 相关文档

- [故障排除](../troubleshooting/common-issues.md) - 常见问题解决
- [配置参考](./configuration.md) - 配置选项说明
- [CLI参考](./cli.md) - 命令行接口
