# CLI 命令参考

TaskFlow CLI 是一个功能强大的命令行工具，提供完整的项目管理、开发执行和部署能力。

## 安装验证

```bash
taskflow --version
# 输出: TaskFlow CLI v4.0.0
```

## 全局选项

| 选项 | 简写 | 说明 | 示例 |
|------|------|------|------|
| `--verbose` | `-v` | 显示详细日志 | `taskflow -v status` |
| `--debug` | `-d` | 启用调试模式 | `taskflow -d agent` |
| `--config <path>` | `-c` | 指定配置文件 | `taskflow -c custom.yaml` |
| `--workspace <path>` | `-w` | 指定工作目录 | `taskflow -w ./project` |
| `--help` | `-h` | 显示帮助信息 | `taskflow --help` |

---

## 基础命令

### init - 初始化项目

初始化新的 TaskFlow 项目。

```bash
taskflow init [项目名称]
```

**选项**：
| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--template <name>` | 使用模板 | default |
| `--description <text>` | 项目描述 | "" |
| `--git` | 初始化 Git 仓库 | false |

**示例**：
```bash
# 基础初始化
taskflow init my-project

# 使用 React 模板
taskflow init web-app --template react

# 带描述并初始化 Git
taskflow init api-server --description "REST API Server" --git
```

**输出结构**：
```
my-project/
├── taskflow.config.yaml
├── prd.md
├── .env
├── src/
├── tests/
├── docs/
└── .taskflow/
```

---

### status - 查看项目状态

显示当前项目状态和任务进度。

```bash
taskflow status
```

**选项**：
| 选项 | 说明 |
|------|------|
| `--watch` | 实时监控状态变化 |
| `--format <type>` | 输出格式：text|json|table |

**示例**：
```bash
# 查看状态
taskflow status

# 实时监控
taskflow status --watch

# JSON 格式输出
taskflow status --format json
```

**输出示例**：
```
项目: my-first-project
状态: 🟢 进行中
版本: v1.0.0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 任务统计
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
总任务数: 12
✅ 已完成: 3 (25%)
⏳ 进行中: 5 (42%)
⏸️ 待开始: 4 (33%)
❌ 已失败: 0

进度: ████████░░░░░░░░ 25%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 当前任务
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ID: task-5
标题: 实现用户认证服务
类型: code
优先级: high
状态: 在执行中

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 性能指标
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
平均响应时间: 2.3s
成功率: 100%
Token 使用: 15,420 / 100,000
```

---

### parse - 解析 PRD 文档

解析 PRD 文档并生成任务计划。

```bash
taskflow parse <prd文件路径>
```

**选项**：
| 选项 | 说明 |
|------|------|
| `--output <path>` | 输出计划到文件 |
| `--dry-run` | 只解析不生成任务 |
| `--validate` | 验证 PRD 格式 |

**示例**：
```bash
# 解析 PRD
taskflow parse docs/prd.md

# 输出到文件
taskflow parse docs/prd.md --output .taskflow/plan.json

# 验证 PRD 格式
taskflow parse docs/prd.md --validate
```

---

## Agent 命令

### agent - 启动智能体

启动 AI Agent 执行任务。

```bash
taskflow agent [选项]
```

**选项**：
| 选项 | 说明 |
|------|------|
| `--task <id>` | 执行指定任务 |
| `--mode <mode>` | 模式：assisted\|autonomous\|supervised |
| `--resume` | 恢复之前会话 |
| `--interactive` | 交互模式 |

**示例**：
```bash
# 启动交互模式
taskflow agent

# 执行单个任务
taskflow agent --task task-5

# 恢复会话
taskflow agent --resume

# 自主模式
taskflow agent --mode autonomous
```

**交互模式操作**：
```
TaskFlow Agent v4.0.0 (interactive mode)

[1] 列出任务
[2] 执行任务
[3] 查看详情
[4] 修复错误
[5] 生成代码
[6] 运行测试
[7] 部署
[8] 退出

> 选择操作: 2
> 选择任务 ID: task-5
> 确认执行? (y/N): y

执行中... ████████████ 100%
✅ 任务完成
生成文件:
  - src/auth/service.ts
  - src/auth/middleware.ts
  - src/auth/types.ts
```

---

## MCP 命令

### mcp start - 启动 MCP 服务器

启动 Model Context Protocol 服务器。

```bash
taskflow mcp start
```

**选项**：
| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--transport <type>` | 传输协议：stdio\|http | stdio |
| `--port <number>` | HTTP 端口 | 3000 |
| `--host <address>` | 绑定地址 | localhost |

**示例**：
```bash
# stdio 模式（默认）
taskflow mcp start

# HTTP 模式
taskflow mcp start --transport http --port 8080
```

### mcp tools - 列出可用工具

列出 MCP 服务器提供的所有工具。

```bash
taskflow mcp tools
```

**输出示例**：
```
可用工具 (共 24 个)

📁 文件操作
  - file_read: 读取文件内容
  - file_write: 写入文件
  - file_search: 搜索文件
  - file_delete: 删除文件

💻 Shell 操作
  - shell_exec: 执行 Shell 命令
  - shell_install: 安装依赖

🔧 Git 操作
  - git_clone: 克隆仓库
  - git_commit: 提交更改
  - git_push: 推送到远程

📊 数据库
  - db_query: 执行 SQL 查询
  - db_migrate: 运行迁移

🌐 HTTP
  - http_request: HTTP 请求
  - http_download: 下载文件

🧪 测试
  - test_run: 运行测试
  - test_coverage: 查看覆盖率
```

---

## 配置管理

### config - 配置命令

管理 TaskFlow 配置。

```bash
taskflow config <子命令>
```

**子命令**：

#### config list - 列出配置

```bash
taskflow config list
```

#### config get - 获取配置值

```bash
taskflow config get <key>
```

**示例**：
```bash
taskflow config get ai.model
# 输出: gpt-4
```

#### config set - 设置配置值

```bash
taskflow config set <key> <value>
```

**示例**：
```bash
taskflow config set ai.model gpt-4-turbo
taskflow config set agent.mode autonomous
```

#### config validate - 验证配置

```bash
taskflow config validate
```

---

## Marketplace 命令

### marketplace search - 搜索工具包

在 Marketplace 中搜索工具包。

```bash
taskflow marketplace search <关键词>
```

**选项**：
| 选项 | 说明 |
|------|------|
| `--category <cat>` | 过滤分类 |
| `--author <name>` | 过滤作者 |
| `--verified` | 只显示已验证包 |

**示例**：
```bash
# 搜索所有 React 相关包
taskflow marketplace search react

# 搜索已验证的 API 工具
taskflow marketplace search api --verified

# 搜索特定作者
taskflow marketplace search cli --author taskflow-ai
```

### marketplace install - 安装工具包

安装来自 Marketplace 的工具包。

```bash
taskflow marketplace install <包名>
```

**选项**：
| 选项 | 说明 |
|------|------|
| `--version <ver>` | 指定版本 |
| `--force` | 强制重装 |
| `--save-dev` | 安装为开发依赖 |

**示例**：
```bash
# 安装最新版本
taskflow marketplace install @taskflow/express-tools

# 安装指定版本
taskflow marketplace install @taskflow/database --version 2.0.0

# 开发依赖
taskflow marketplace install jest-tools --save-dev
```

### marketplace update - 更新工具包

更新已安装的工具包。

```bash
taskflow marketplace update [包名]
```

**不指定包名则更新所有可更新包。**

---

## 知识库命令

### knowledge index - 索引知识库

将项目文档索引到知识库。

```bash
taskflow knowledge index
```

**选项**：
| 选项 | 说明 |
|------|------|
| `--path <dir>` | 指定索引路径 |
| `--force` | 强制重建索引 |
| `--watch` | 监听文件变化 |

**示例**：
```bash
# 索引当前项目
taskflow knowledge index

# 索引指定目录
taskflow knowledge index --path ./docs

# 实时监听
taskflow knowledge index --watch
```

### knowledge search - 搜索知识库

在知识库中搜索相关内容。

```bash
taskflow knowledge search <查询词>
```

**选项**：
| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--top-k` | 返回结果数量 | 5 |
| `--threshold` | 相似度阈值 | 0.7 |

**示例**：
```bash
taskflow knowledge search "用户认证"
```

**输出示例**：
```
找到 3 个相关文档 (0.8s)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[1] docs/api/auth.md - 相似度: 0.95
摘要: 用户认证 API 规范包含登录、注册、密码重置...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[2] docs/prd_features.md - 相似度: 0.82
摘要: 认证功能需求说明，包含安全要求...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[3] docs/security/policy.md - 相似度: 0.78
摘要: 认证安全策略，包含密码强度、加密算法...
```

---

## CI/CD 命令

### cicd validate - 验证 CI/CD 配置

验证 CI/CD 配置文件的有效性。

```bash
taskflow cicd validate
```

**输出示例**：
```
✅ CI/CD 配置验证通过

检查项:
  ✅ GitHub Actions workflow 语法
  ✅ 环境变量定义
  ✅ 工作流依赖关系
  ✅ 权限配置

警告:
  ⚠️ deploy 阶段缺少审批配置 (建议: add approval step)
```

### cicd generate - 生成 CI/CD 配置

根据项目自动生成 CI/CD 配置。

```bash
taskflow cicd generate [provider]
```

**支持的 providers**：
- `github` - GitHub Actions
- `gitlab` - GitLab CI
- `jenkins` - Jenkins

**示例**：
```bash
# 生成 GitHub Actions
taskflow cicd generate github

# 输出文件: .github/workflows/ci.yml
```

### cicd trigger - 触发 CI/CD 流水线

手动触发 CI/CD 流水线。

```bash
taskflow cicd trigger [pipeline]
```

## 调试命令

### debug - 调试模式

启动调试接口。

```bash
taskflow debug
```

**提供功能**：
- Step-through 执行
- 断点设置
- 变量检查
- 调用栈查看

### doctor - 诊断检查

运行系统诊断检查。

```bash
taskflow doctor
```

**输出示例**：
```
TaskFlow 诊断报告 v4.0.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Node.js: v20.10.0
✅ npm: 10.2.4
✅ 项目结构: 正常
✅ 配置文件: 有效

⚠️ AI Provider: 未配置
   建议: 设置 OPENAI_API_KEY 环境变量

⚠️ Git: 未初始化
   建议: 运行 git init

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
总体状态: ⚠️ 5/7 检查通过
```

---

## 快捷命令

| 命令 | 简写 | 说明 |
|------|------|------|
| `taskflow init` | `tf i` | 初始化项目 |
| `taskflow status` | `tf s` | 查看状态 |
| `taskflow agent` | `tf a` | 启动 Agent |
| `taskflow parse` | `tf p` | 解析 PRD |
| `taskflow config` | `tf c` | 配置管理 |

---

## 帮助

获取帮助信息：

```bash
# 总帮助
taskflow --help

# 命令帮助
taskflow agent --help

# 子命令帮助
taskflow config --help
```

---

## 环境变量

TaskFlow 支持通过环境变量配置：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `OPENAI_API_KEY` | OpenAI API 密钥 | `sk-xxxxx` |
| `ANTHROPIC_API_KEY` | Anthropic API 密钥 | `sk-ant-xxxxx` |
| `TASKFLOW_CONFIG` | 配置文件路径 | `~/.taskflow/config.yaml` |
| `TASKFLOW_LOG_LEVEL` | 日志级别 | `debug` |
| `TASKFLOW_CACHE_DIR` | 缓存目录 | `~/.taskflow/cache` |

---

相关文档：
- [快速开始](../getting-started.md)
- [Agent 系统](./agent.md)
- [配置参考](../reference/config.md)
