# TaskFlow AI vNext: 专注 MCP，打造精品 Server

> **核心决策**: 移除所有 Agent 能力，专注于成为精品 MCP Server
>
> **新定位**: TaskFlow AI = Claude Desktop / Cursor / Windsurf 的最佳 MCP Server
>
> **时间估算**: 6-9 周（从 11-16 周大幅缩短）

---

## 🎯 为什么这样决策？

### MCP 的本质
MCP（Model Context Protocol）是 **工具协议**，不是 Agent 框架。

**MCP 应该做什么**:
- ✅ 提供工具定义和描述
- ✅ 执行工具调用
- ✅ 管理资源访问
- ✅ 渲染 Prompt 模板

**MCP 不应该做什么**:
- ❌ 管理 Agent 生命周期
- ❌ 编排多 Agent 协作
- ❌ 维护复杂状态

### 当前项目的问题
1. **职责混乱**: MCP Server 直接管理 Agent 生命周期，违反 MCP 设计哲学
2. **过度设计**: 三套 Agent 系统并存，增加复杂度
3. **维护困难**: 代码量大，边界不清

### 新定位的优势
1. **专注**: 100% 精力专注 MCP 协议
2. **简单**: 架构清晰，易于理解
3. **可靠**: 无状态设计，稳定运行
4. **精品**: 成为 MCP Server 的标杆实现

---

## 🏗️ 新架构（大幅简化）

```
┌─────────────────────────────────────────┐
│         CLI 命令层 (taskflow)           │
│  mcp start/stop/status/init/tools      │
│  doctor/check/config                   │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│      MCP Server (stdio/HTTP)            │
│  - Tools 执行引擎                       │
│  - Resources 管理器                     │
│  - Prompts 渲染器                       │
└──────────┬──────────────────────────────┘
           │
    ┌──────┴──────┬──────────┬──────────┐
    ▼             ▼          ▼          ▼
┌─────┐    ┌─────────┐  ┌───────┐  ┌─────────┐
│工具库│    │资源管理器│  │Prompt │  │  安全   │
│15+  │    │文件/DB   │  │引擎   │  │验证器   │
└─────┘    └─────────┘  └───────┘  └─────────┘
```

### 核心组件

#### 1. MCP Server (`src/mcp/`)
- **传输**: stdio（推荐）+ HTTP
- **能力**: Tools / Resources / Prompts
- **特点**: 完全无状态

#### 2. 工具库 (`src/mcp/tools/`)
保留的核心工具：
- `filesystem` - 文件系统操作
- `shell` - Shell 命令执行
- `git` - Git 操作
- `http` - HTTP 请求
- `code` - 代码执行
- `search-replace` - 搜索替换
- `vector` - 向量搜索

#### 3. 资源管理器 (`src/mcp/resources/`)
- 文件读取
- 目录扫描
- 配置文件管理

#### 4. Prompt 引擎 (`src/mcp/prompts/`)
- 模板渲染
- 动态变量替换
- 多模板支持

#### 5. 安全层 (`src/mcp/security/`)
- 命令白名单
- 路径遍历防护
- SSRF 防护
- 沙箱隔离

---

## 🗑️ 需要删除的模块

### 完全删除的目录
```
src/core/agent/           # 整个 Agent 系统
src/core/multi-agent/     # CrewAI 风格的多 Agent
src/agent/                # Agent 高级功能
```

### 删除的工具（MCP）
```
src/mcp/tools/built-in.ts 中的:
  - create_agent
  - create_crew
  - run_crew
  - agent_status
```

### 删除的 CLI 命令
```
taskflow crew/*           # 整个 crew 命令组
taskflow agent/*           # 整个 agent 命令组
```

### 删除的依赖（可选）
移除后不再需要的依赖：
- `xstate` - 状态机（Agent 需要）
- `@xstate/fsm`
- 其他 Agent 专用依赖

---

## 📋 新的重构计划

### 阶段 1: 清理和修复（1-2 周）

#### 1.1 移除 Agent 相关代码（3 天）
```
删除目录:
  ✓ src/core/agent/
  ✓ src/core/multi-agent/
  ✓ src/agent/

删除文件:
  ✓ src/mcp/tools/built-in.ts 中的 Agent/Crew 工具
  ✓ src/cli/commands/crew/*
  ✓ src/cli/commands/agent/*
```

#### 1.2 修复安全漏洞（4 天）
保持 P0 优先级：
- [ ] 修复命令白名单绕过漏洞
- [ ] 修复正则匹配绕过风险
- [ ] 修复沙箱逃逸风险
- [ ] 修复 shell_kill 权限问题
- [ ] 修复 ModelGateway 无用表达式
- [ ] 添加工具执行超时控制

#### 1.3 清理依赖和配置（2 天）
- [ ] 移除不再需要的 npm 依赖
- [ ] 清理 package.json
- [ ] 更新 tsconfig.json
- [ ] 移除废弃的配置文件

**验证**: `npm run build` 成功，所有测试通过

---

### 阶段 2: MCP 完善（3-4 周）

#### 2.1 完善工具实现（2 周）
确保所有工具都有完整实现：
- [ ] `filesystem`: 完整的文件操作（读写、列表、删除）
- [ ] `shell`: 支持 sudo、环境变量、超时控制
- [ ] `git`: 所有常用 Git 操作
- [ ] `http`: 支持 POST/GET、headers、认证
- [ ] `code`: TypeScript/Python 代码执行
- [ ] `search-replace`: 正则搜索、多文件替换
- [ ] `vector`: 向量数据库集成

#### 2.2 增强 Resources（3 天）
- [ ] 实现文件阅读器
- [ ] 实现目录扫描器
- [ ] 实现配置文件管理器
- [ ] 支持流式读取大文件

#### 2.3 优化 Prompts（2 天）
- [ ] 增强模板渲染引擎
- [ ] 支持嵌套变量
- [ ] 支持条件渲染
- [ ] 添加内置模板库

#### 2.4 错误处理和日志（3 天）
- [ ] 统一的错误类型
- [ ] 详细的错误日志
- [ ] 错误恢复机制
- [ ] 用户友好的错误提示

**验证**: 所有工具在 Claude Desktop / Cursor 中正常工作

---

### 阶段 3: 体验优化（2-3 周）

#### 3.1 CLI 优化（3 天）
- [ ] 统一命令格式
- [ ] 改进错误提示
- [ ] 添加进度条
- [ ] 完善 `taskflow doctor` 命令

#### 3.2 文档重构（5 天）
- [ ] 重写 README（突出 MCP 定位）
- [ ] 添加 MCP 快速开始指南
- [ ] 工具使用文档
- [ ] 安全最佳实践
- [ ] 故障排除指南

#### 3.3 性能优化（4 天）
- [ ] 实现工具执行缓存
- [ ] 并发执行优化
- [ ] 内存使用优化
- [ ] 启动速度优化

#### 3.4 额外功能（3 天）
- [ ] 添加更多工具
- [ ] 添加更多资源类型
- [ ] 添加更多实用 Prompt 模板
- [ ] 支持自定义工具配置

**验证**: 在真实场景中测试性能和稳定性

---

## 🎨 新的项目结构

```
taskflow-ai/
├── bin/index.js                 # CLI 入口
├── src/
│   ├── cli/                     # CLI 命令（简化版）
│   │   ├── commands/
│   │   │   ├── mcp.ts          # MCP 管理
│   │   │   ├── config.ts       # 配置
│   │   │   ├── doctor.ts       # 诊断
│   │   │   └── template.ts     # 模板
│   │   └── ui/                 # UI 组件
│   │
│   ├── mcp/                     # MCP Server（核心）
│   │   ├── server/             # MCP 协议实现
│   │   ├── tools/              # 工具库
│   │   ├── resources/          # 资源管理
│   │   ├── prompts/            # Prompt 引擎
│   │   └── security/           # 安全层
│   │
│   ├── core/                    # 核心基础设施
│   │   ├── ai/                 # AI 适配器（可选）
│   │   ├── events/             # 事件总线
│   │   ├── config/             # 配置管理
│   │   └── plugins/            # 插件系统（工具扩展）
│   │
│   ├── utils/                   # 工具函数
│   └── types/                   # 类型定义
│
├── docs/                        # 文档
│   ├── getting-started/         # MCP 快速开始
│   ├── concepts/                # MCP 概念
│   ├── tools/                   # 工具文档
│   └── api/                     # API 参考
│
└── package.json
```

---

## 📊 代码量对比

| 指标 | 之前 | 之后 | 减少 |
|------|------|------|------|
| TypeScript 文件 | 417 | ~250 | 40% |
| 代码行数 | ~50K | ~30K | 40% |
| 核心模块 | 8 个 | 3 个 | 63% |
| CLI 命令 | 19 组 | 4 组 | 79% |

---

## 🚀 价值主张

### 简化后的 TaskFlow AI

1. **专注 MCP**: 100% 精力专注 MCP 协议
2. **工具齐全**: 15+ 工具，覆盖开发全流程
3. **安全可靠**: 严格的安全验证和沙箱隔离
4. **易于使用**: 一键启动，自动配置编辑器
5. **开箱即用**: Claude Desktop / Cursor / Windsurf 完美支持

### 目标用户

- ✅ 使用 Claude Desktop 的开发者
- ✅ 使用 Cursor / Windsurf 的开发者
- ✅ 需要 MCP Server 进行自动化操作的所有用户
- ✅ 想要自定义 MCP 工具的高级用户

---

## 📝 版本规划

### v4.1.0 - MCP 精简版（2 周后）
**内容**:
- 移除所有 Agent 代码
- 修复 5 个安全漏洞
- 修复 ModelGateway Bug

**发布点**:
- ✅ 纯净的 MCP Server
- ✅ 安全可靠
- ✅ 代码减少 40%

**Breaking Changes**:
- ~~移除 crew 命令~~
- ~~移除 agent 命令~~
- CLI 命令简化

---

### v5.0.0 - MCP 增强版（6 周后）
**内容**:
- 完善所有工具实现
- 增强 Resources 和 Prompts
- 优化错误处理和日志
- CLI 体验优化

**发布点**:
- ✅ 工具完整可用
- ✅ 文档完善
- ✅ 性能优化

---

### v6.0.0 - 精品版（9 周后）
**内容**:
- 更多工具和资源
- 性能极致优化
- 插件系统完善
- 社区生态建设

**发布点**:
- ✅ MCP Server 标杆
- ✅ 社区认可
- ✅ 广泛采用

---

## ✅ 验收标准

### 阶段 1 验收
- [ ] 所有 Agent 代码已删除
- [ ] `npm run build` 成功
- [ ] 安全漏洞全部修复
- [ ] 所有测试通过
- [ ] MCP Server 正常启动

### 阶段 2 验收
- [ ] 所有工具完整实现
- [ ] Resources 功能完善
- [ ] Prompts 引擎优化
- [ ] 在 Claude Desktop 中测试通过
- [ ] 在 Cursor 中测试通过

### 阶段 3 验收
- [ ] CLI 体验流畅
- [ ] 文档完整准确
- [ ] 性能达标
- [ ] 社区反馈良好
- [ ] 用户满意度高

---

## 🎯 总结

### 核心决策
**移除 Agent，专注 MCP** 成为精品 Server

### 预期成果
- **代码减少 40%**
- **维护成本降低 50%**
- **重构时间缩短 40%**（11-16 周 → 6-9 周）
- **更易理解和使用**

### 长期愿景
成为 **Claude Desktop / Cursor / Windsurf 的最佳 MCP Server**

---

*让 MIAO 陪伴主人打造真正的精品喵！* (๑•̀ㅂ•́)و✧
