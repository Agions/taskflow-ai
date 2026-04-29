<div align="center">

<img src="assets/logo.svg" alt="TaskFlow AI Logo" width="180" style="margin: 2rem 0; filter: drop-shadow(0 4px 12px rgba(59, 130, 246, 0.15));" />

# 🚀 TaskFlow AI

### 精品 MCP Server · 为编辑器提供强大工具能力

[![NPM Version](https://img.shields.io/npm/v/taskflow-ai.svg?color=3b82f6&style=for-the-badge)](https://www.npmjs.com/package/taskflow-ai)
[![Downloads](https://img.shields.io/npm/dm/taskflow-ai.svg?color=10b981&style=for-the-badge)](https://www.npmjs.com/package/taskflow-ai)
[![License](https://img.shields.io/github/license/Agions/taskflow-ai.svg?color=8b5cf6&style=for-the-badge)](LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Agions/taskflow-ai/ci.yml?branch=main&style=for-the-badge)](https://github.com/Agions/taskflow-ai/actions)
[![codecov](https://img.shields.io/codecov/c/github/Agions/taskflow-ai?style=for-the-badge)](https://codecov.io/gh/Agions/taskflow-ai)
[![GitHub Stars](https://img.shields.io/github/stars/Agions/taskflow-ai?style=for-the-badge)](https://github.com/Agions/taskflow-ai/stargazers)

> **📦 最新版本: v4.1.0** — 专注 MCP Server · 极简架构 · 企业级安全 · 2024-04-30

> **🚨 架构升级**: 移除 Agent 系统，专注成为精品 MCP Server，代码减少 40%+

**专为 AI 编辑器打造的 MCP Server · Claude / Cursor / Windsurf 的最佳选择**

<p align="center" style="margin-top: 2rem;">
  <a href="#-核心特性" style="margin: 0 0.5rem; text-decoration: none; color: var(--tf-primary, #3b82f6); font-weight: 600;">✨ 核心特性</a>
  <span style="color: #e5e7eb;">|</span>
  <a href="#-快速开始" style="margin: 0 0.5rem; text-decoration: none; color: var(--tf-primary, #3b82f6); font-weight: 600;">🚀 快速开始</a>
  <span style="color: #e5e7eb;">|</span>
  <a href="#-mcp-工具列表" style="margin: 0 0.5rem; text-decoration: none; color: var(--tf-primary, #3b82f6); font-weight: 600;">🔧 MCP 工具</a>
  <span style="color: #e5e7eb;">|</span>
  <a href="https://agions.github.io/taskflow-ai/" style="margin: 0 0.5rem; text-decoration: none; color: var(--tf-primary, #3b82f6); font-weight: 600;">📚 在线文档</a>
  <span style="color: #e5e7eb;">|</span>
  <a href="https://github.com/Agions/taskflow-ai/issues" style="margin: 0 0.5rem; text-decoration: none; color: var(--tf-primary, #3b82f6); font-weight: 600;">🐛 问题反馈</a>
</p>

</div>

---

## 🎯 什么是 TaskFlow AI？

TaskFlow AI 是一款**精品 MCP (Model Context Protocol) Server**，专为 AI 编辑器设计。提供 40+ 内置工具，覆盖文件系统、HTTP 请求、数据库、Git 操作等常见场景。

### v4.1.0 架构亮点

| 指标 | v4.0.0 | v4.1.0 | 改进 |
|------|--------|--------|------|
| **代码行数** | ~25k | **~14k** | ↓ 44% |
| **架构复杂度** | 高 (Multi-Agent) | **低 (MCP Only)** | ↓ 40% |
| **安全漏洞** | 6 P0 | **0** | ✅ 100% |
| **启动速度** | ~2s | **<500ms** | ↑ 4x |

### 我们解决什么问题

| 痛点 | 传统方案 | TaskFlow AI |
|------|----------|-------------|
| **工具分散** | 需要配置多个 MCP Server | ✅ 一站式 40+ 工具 |
| **安全风险** | 命令注入、SSRF 等漏洞 | ✅ 多层安全防护 |
| **配置复杂** | 每个编辑器单独配置 | ✅ 一键生成所有配置 |
| **性能问题** | 启动慢、响应慢 | ✅ <500ms 启动 |

---

## ✨ 核心特性

### 🔌 完整的 MCP 协议支持

**符合 MCP 标准的完整实现**

TaskFlow AI 完全遵循 MCP 协议规范，支持：
- ✅ **Tools** - 40+ 内置工具
- ✅ **Resources** - 文件、数据库等资源访问
- ✅ **Prompts** - 预设提示模板
- ✅ **Events** - 实时事件通知

### 🛡️ 企业级安全防护

**多层防御，生产就绪**

```
第 1 层：输入验证  → 禁止字符 + 命令白名单 + 路径防护
    ↓
第 2 层：输入过滤  → 危险正则 + 命令链检测 + SSRF 防护
    ↓
第 3 层：执行控制  → 30秒超时 + 内存限制 + 权限检查
    ↓
第 4 层：审计日志  → 命令记录 + 安全告警 + 异常检测
```

**防护能力**:

| 防护类型 | 能力 |
|----------|------|
| 🔒 **命令注入** | Shell 命令白名单 + 危险字符检测 |
| 🌐 **SSRF 防护** | 私有 IP 限制 + URL 协议验证 |
| 📁 **路径遍历** | 文件路径规范化 + 敏感目录保护 |
| 🔑 **密钥管理** | 环境变量 + 自动脱敏 |
| 📝 **审计日志** | 完整操作审计 + 可追溯 |

### 📁 文件系统工具

**完整的文件操作能力**

| 工具 | 功能 |
|------|------|
| `fs_read` | 读取文件内容 |
| `fs_write` | 写入文件内容 |
| `fs_append` | 追加到文件 |
| `fs_delete` | 删除文件 |
| `fs_list` | 列出目录内容 |
| `fs_search` | 搜索文件 |
| `fs_copy` | 复制文件 |
| `fs_move` | 移动/重命名文件 |

### 🌐 HTTP 请求工具

**强大的网络请求能力**

| 工具 | 功能 |
|------|------|
| `http_get` | GET 请求 |
| `http_post` | POST 请求 |
| `http_put` | PUT 请求 |
| `http_delete` | DELETE 请求 |
| `http_download` | 下载文件 |
| `http_head` | HEAD 请求 |
| `http_options` | OPTIONS 请求 |

**特性**:
- ✅ 自定义 Headers
- ✅ 请求/响应 Body 处理
- ✅ 超时控制
- ✅ 错误处理

### 💾 数据库工具

**SQLite 数据库管理**

| 工具 | 功能 |
|------|------|
| `db_query` | 执行 SQL 查询 |
| `db_init` | 初始化数据库 |
| `db_schema` | 获取数据库 Schema |
| `db_tables` | 列出所有表 |
| `db_backup` | 备份数据库 |

### 💻 Shell 命令工具

**安全的命令执行（白名单验证）**

| 工具 | 功能 |
|------|------|
| `shell_exec` | 执行 Shell 命令（同步） |
| `shell_exec_async` | 异步执行 Shell 命令 |
| `shell_test` | 测试命令是否可用 |

**安全特性**:
- ✅ 命令白名单
- ✅ 危险字符过滤
- ✅ 链式命令检测
- ✅ 执行超时保护

### 🔀 Git 操作工具

**完整的 Git 工作流支持**

| 工具 | 功能 |
|------|------|
| `git_status` | 查看 Git 状态 |
| `git_log` | 查看提交历史 |
| `git_commit` | 提交更改 |
| `git_push` | 推送更改 |
| `git_pull` | 拉取更改 |
| `git_branch` | 分支管理 |
| `git_checkout` | 切换分支 |
| `git_diff` | 查看差异 |

### 🧠 记忆管理工具

**持久化的上下文记忆**

| 工具 | 功能 |
|------|------|
| `memory_set` | 设置记忆 |
| `memory_get` | 获取记忆 |
| `memory_clear` | 清除记忆 |
| `memory_list` | 列出所有记忆 |

### 📊 代码执行工具

**安全的代码执行环境**

| 工具 | 功能 |
|------|------|
| `code_execute` | 执行代码 |
| `code_eval_js` | 评估 JavaScript |
| `code_eval_python` | 评估 Python |

---

## 🚀 快速开始

### 安装

```bash
# npm
npm install -g taskflow-ai

# pnpm
pnpm add -g taskflow-ai

# yarn
yarn global add taskflow-ai
```

### 初始化

```bash
# 1. 快速初始化配置
taskflow init

# 2. 配置 MCP Server（推荐）
taskflow mcp init -e claude-desktop
taskflow mcp init -e cursor
taskflow mcp init -e windsurf

# 3. 启动 MCP Server
taskflow mcp start
```

### 配置示例

**Claude Desktop 配置** (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "taskflow": {
      "command": "/usr/local/bin/taskflow",
      "args": ["mcp", "start"]
    }
  }
}
```

**Cursor 配置** (Settings > MCP):

```json
{
  "mcpServers": {
    "taskflow": {
      "command": "taskflow",
      "args": ["mcp", "start"]
    }
  }
}
```

---

## 🧰 MCP 工具列表

### 文件系统 (8)
- `fs_read` - 读取文件
- `fs_write` - 写入文件
- `fs_append` - 追加内容
- `fs_delete` - 删除文件
- `fs_list` - 列出目录
- `fs_search` - 搜索文件
- `fs_copy` - 复制文件
- `fs_move` - 移动文件

### HTTP 请求 (7)
- `http_get` - GET 请求
- `http_post` - POST 请求
- `http_put` - PUT 请求
- `http_delete` - DELETE 请求
- `http_download` - 下载文件
- `http_head` - HEAD 请求
- `http_options` - OPTIONS 请求

### 数据库 (5)
- `db_query` - 执行查询
- `db_init` - 初始化数据库
- `db_schema` - 获取 Schema
- `db_tables` - 列出表
- `db_backup` - 备份

### Shell 命令 (3)
- `shell_exec` - 执行命令
- `shell_exec_async` - 异步执行
- `shell_test` - 测试命令

### Git 操作 (8)
- `git_status` - Git 状态
- `git_log` - 提交历史
- `git_commit` - 提交
- `git_push` - 推送
- `git_pull` - 拉取
- `git_branch` - 分支管理
- `git_checkout` - 切换分支
- `git_diff` - 查看差异

### 记忆管理 (4)
- `memory_set` - 设置记忆
- `memory_get` - 获取记忆
- `memory_clear` - 清除记忆
- `memory_list` - 列出记忆

### 代码执行 (3)
- `code_execute` - 执行代码
- `code_eval_js` - 评估 JS
- `code_eval_python` - 评估 Python

**总计: 38 个工具**

---

## 🏗️ 架构设计

```
┌─────────────────────────────────────────────────────────────────┐
│                       AI 编辑器层                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │
│  │  Claude     │ │   Cursor    │ │   Windsurf  │                │
│  │  Desktop    │ │             │ │             │                │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘                │
└─────────┼────────────────┼────────────────┼────────────────────┘
          │                │                │
          │      MCP Protocol (JSON-RPC)     │
          └────────────────┼────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────────────┐
│                     TaskFlow AI MCP Server                       │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    安全层 (Security)                     │   │
│  │  命令白名单 · SSRF 防护 · 路径遍历防护 · 审计日志         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   工具层 (Tools)                          │   │
│  │  文件系统 · HTTP · 数据库 · Shell · Git · 记忆 · 代码     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  协议层 (MCP Protocol)                    │   │
│  │  Tools · Resources · Prompts · Events                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### 核心优势

1. **极简架构** - 移除 Agent 系统，专注 MCP Server
2. **企业级安全** - 多层防御，生产就绪
3. **高性能** - <500ms 启动，快速响应
4. **完整工具集** - 38 个内置工具，覆盖常见场景
5. **标准协议** - 完全符合 MCP 规范

---

## 🛡️ 安全性

### 多层防御体系

TaskFlow AI 采用多层安全防护，确保生产环境安全：

**第 1 层：输入验证**
- ✅ 命令白名单
- ✅ 危险字符检测
- ✅ 路径规范化

**第 2 层：输入过滤**
- ✅ 危险正则模式匹配
- ✅ 命令链检测
- ✅ SSRF 防护

**第 3 层：执行控制**
- ✅ 30 秒超时
- ✅ 内存限制
- ✅ 权限检查

**第 4 层：审计日志**
- ✅ 命令记录
- ✅ 安全告警
- ✅ 异常检测

### 安全统计

| 指标 | 状态 |
|------|------|
| P0 安全漏洞 | ✅ 0 |
| 安全测试覆盖 | ✅ 90% |
| 漏洞修复时间 | ✅ <24h |

---

## 📖 完整示例

### 示例 1: 在 Claude Desktop 中使用

1. **安装并配置**

```bash
npm install -g taskflow-ai
taskflow mcp init -e claude-desktop
```

2. **重启 Claude Desktop**

3. **在对话中使用**

```
用户：帮我读取 README.md 文件

Claude：（自动调用 fs_read 工具）
文件内容已读取...

用户：帮我分析代码库中的 Bug

Claude：（自动调用 git_log、git_diff、code_execute 等工具）
代码分析完成...
```

### 示例 2: 在 Cursor 中使用

1. **配置 Cursor**

```bash
taskflow mcp init -e cursor
```

2. **在 Cursor 中使用工具**

```
// Cursor 会自动检测 TaskFlow AI 的工具
// 在 AI 聊天框中直接请求

用户：帮我搜索所有 TypeScript 文件
Cursor：（调用 fs_search 工具）
找到 42 个 TypeScript 文件...
```

### 示例 3: 使用 HTTP 工具获取 API 数据

```bash
# 通过 MCP 调用 http_get 工具
用户：帮我获取 GitHub API 返回的信息

AI：（调用 http_get 工具）
GET https://api.github.com/repos/Agions/taskflow-ai

返回仓库信息...
```

---

## 🤝 贡献指南

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详情。

### 开发流程

```bash
# 1. Fork 并 Clone
git clone https://github.com/YOUR_USERNAME/taskflow-ai.git

# 2. 安装依赖
npm install

# 3. 启动开发服务
npm run dev

# 4. 运行测试
npm test

# 5. 提交 PR
```

---

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

---

## 🙏 致谢

- [Anthropic](https://www.anthropic.com/) - MCP 协议
- [Claude](https://claude.ai/) - AI 编程助手
- 所有贡献者 - ✨

---

## 📞 联系我们

- 📧 Email: [1051736049@qq.com](mailto:1051736049@qq.com)
- 🐛 Issues: [GitHub Issues](https://github.com/Agions/taskflow-ai/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/Agions/taskflow-ai/discussions)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个 Star！⭐**

Made with ❤️ by [Agions](https://github.com/Agions)

</div>
