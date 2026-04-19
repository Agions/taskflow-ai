# Changelog

所有 TaskFlow AI 的显著变更都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [3.0.0] - 2026-04-18

### 🚀 v3.0.0 Major Upgrade - 事件驱动架构

这是 TaskFlow AI 的重大版本升级，带来全新的事件驱动架构和多项核心功能增强。

#### Added

##### 核心架构

- **EventBus 事件驱动系统** (`src/core/events/`)
  - `TaskFlowEvent` 枚举定义所有事件类型
  - 支持同步/异步发布、订阅、通配符、中间件
  - 事件历史记录 (`getHistory()`)
  - 内置事件: WORKFLOW_*, STEP_*, AI_*, CACHE_* 事件

- **多级缓存系统** (`src/core/cache/`)
  - `MemoryCache` - L1 内存 LRU 缓存 (20MB, 5分钟 TTL)
  - `LocalCache` - L2 文件持久化缓存 (24小时 TTL)
  - `CacheManager` - 分层缓存调度

- **网络层优化** (`src/core/network/`)
  - `RateLimiter` - 令牌桶限流 (RPM/RPS 控制)
  - `RetryHandler` - 指数退避重试机制

##### 插件系统

- **PluginManager** (`src/plugins/`)
  - 插件生命周期: onLoad → onEnable → onDisable → onUnload
  - 钩子系统: beforeWorkflowExecute, afterWorkflowComplete, onAIRequest, onAIResponse, onCacheHit
  - 内置插件: LoggerPlugin, StoragePlugin
  - 自动集成 EventBus

##### 多 Agent 协作

- **AgentCrew** (`src/core/multi-agent/`)
  - 三种协调模式: sequential, hierarchical, parallel
  - 流式执行支持
  - 团队状态管理 (pause/resume/stop)
  - 消息历史管理 (MessageHistory)
  - 上下文共享策略: full, minimal, contextual

##### 工具系统

- **ToolRegistry** (`src/core/tools/`)
  - 工具注册/查找/执行/统计
  - 内置工具: file_read, file_write, file_list, file_search, bash, git, http_request
  - 工具类别: filesystem, system, network, code, database
  - 调用历史和统计
  - 超时控制和重试机制

##### Function Calling

- **FunctionCallingHandler** (`src/core/function-call/`)
  - 函数调用处理器
  - StructuredOutputHandler - 结构化输出
  - 并行函数调用支持
  - RegistryFunctionExecutor - 工具注册表适配器

##### ModelGateway 增强

- 集成 RateLimiter 限流
- 集成多级缓存
- 集成 EventBus 事件发射
- 新增 `getRateLimitStats()` 方法

#### Changed

- **版本号升级** — v2.2.1 → v3.0.0
- **.gitignore 更新** — 添加 REFORM_PLAN*.md 忽略规则
- **构建优化** — 增量编译 (2157KB → 2220KB)

## [2.2.0] - 2026-04-17

### 🚀 Architecture Upgrade - 架构升级

#### Added

- **Monorepo 结构** — 采用 workspaces 管理多包
  - 新增 `@taskflow-ai/core` 核心包
  - 任务管理、工作流引擎、插件系统独立发布
  - 支持独立引用核心库

- **插件系统增强**
  - 新增 10+ 生命周期钩子
    - `onTaskCreated` / `onTaskUpdated` - 任务创建/更新后
    - `onWorkflowBeforeExecute` - 工作流执行前
    - `onCommandBefore` - 命令执行前
    - `onConfigLoaded` / `onConfigBeforeSave` - 配置加载/保存
    - `onError` - 错误处理
  - 新增 `PluginAPI` - 插件可调用任务/工作流/配置/存储 API
  - 新增 `EventEmitter` - 事件机制
  - 新增命令选项定义 `PluginCommandOption`
  - 新增可视化扩展 `PluginVisualization`

- **统一配置管理**
  - `ConfigManager` 整合所有配置操作
  - 支持 AI 模型管理、备份恢复、导入导出
  - 配置统计信息

#### Changed

- **版本号升级** — v2.1.13 → v2.2.0

## [2.1.13] - 2026-04-17

### Fixed

- **CLI 命令修复** — 注册缺失的命令
  - 注册 `taskflow model` 命令（包含 list/add/remove/enable/disable/test 子命令）
  - 注册 `taskflow doctor` 命令
  - 添加 `taskflow status list` 子命令，支持查看 parse 生成的任务列表

- **文档更新**
  - 修正 CLI 文档中的命令名称（models → model）
  - 移除不存在的命令文档（logs、cache）

### Added

- `taskflow status list` 新增功能
  - 支持 `--filter` 过滤任务
  - 支持 `--sort` 排序
  - 支持 `--format json` JSON 输出
  - 支持 `--output` 指定任务文件目录

## [2.1.11] - 2026-04-11

### Added

- Agent 核心模块重构
  - `GoalParser` 接口抽象，支持规则/AI/混合模式
  - `RuleBasedGoalParser` 实现，无 AI 依赖的规则解析器（支持中英文，32 个测试）
  - `AgentConfig` 替代直接对象字面量配置
  - `AgentCore` 新增 `replan()` / `resume()` 断点恢复
  - `MultiAgentCoordinator` 新增 `broadcast()` / `executeCollaborative()` / `AgentMetrics` 指标

### Changed

- **类型安全强化** — ~46 处 `any` 类型消除（115→69）
  - `core/plugin/types.ts`: `PluginContext.logger unknown→Logger`，hooks 参数类型化
  - `mcp/prompts/types.ts`: `PromptExample.arguments any→PromptArguments`
  - `cli/commands/flow/`: `format string→'yaml'|'json'`
  - `cli/commands/`: `options: any→AgentCLIOptions/StatusOptions`
  - `cicd/github/api-client.ts`: 定义 `GitHubWorkflowRun/Job/Step/Secret` 接口
  - `cicd/github/validator.ts`: `errors/warnings: any[]→ValidationError[]/ValidationWarning[]`
  - `workflow/types.ts`: `StepConfig` 新增 `dependsOn?: string[]`
  - `mcp/security/ip-filter.ts`: 定义 `RequestLike` 接口
  - `utils/error-handler.ts`: `getErrorMessage/isError any→unknown`
  - `agent/state-machine/`: `actor: any→ReturnType<typeof createActor>`
  - `agent/verification/`: `tasks filter` / `CoverageData` 类型化

### Fixed

- CLI `options.format as any` 全部移除
- `getTemplate()` 返回 `null` 时 null 安全处理
- `state-machine/machine.ts` 重复 import 移除
- **状态机关键 Bug 修复** (2026-04-11)
  - `retryCount` 从未递增导致重试死循环：现已通过 `incrementRetry` assign action 正确累计
  - `verificationResult` 从未写入 context：现已通过 `setVerificationResult` action 在 `verificationDecision` 节点前填充
  - XState v5 `onDone:[guard,guard,guard]` 并行评估竞态：现已通过 `verificationDecision` 中转节点解决
  - 5 个 named action 全部正式实现：`setTaskPlan` / `setExecutionResult` / `setVerificationResult` / `incrementRetry` / `setError`
- **Plugin 热重载**：`PluginManager.reload(pluginId)` 原子 unload+load，运行时更新插件无需重启
- **工具响应 Schema 统一**：`ToolResponse<T>` + `toolOk()` / `toolError()` 封装，所有 MCP 工具返回结构一致
- **并行执行超时**：`Promise.race` 超时取消机制，支持部分结果保留
- **Router 诊断增强**：`SmartRouter.explain()` 返回优先级评分明细 + `DEFAULT_ROUTING_RULES` 规则说明注释
- **TypeSafetyChecker 真实检查**：实际运行 `tsc --noEmit`，解析 `error TS####` 输出
- **CodeQualityChecker ESLint 集成**：实际运行 `npx eslint --format=json`，启发式扫描（console.log/TODO/implicit any）

### Tests

- 新增 `src/agent/verification/__tests__/engine.test.ts`（5 tests）：VerificationEngine 行为验证
- 新增 `src/agent/verification/__tests__/code-quality.test.ts`（9 tests）：CodeQualityChecker 黑盒覆盖
- 总测试数：152 passed（138 → 152）

---

## [2.2.0] - 2026-04-17

### Fixed

- **修复不存在的Discussions链接** - 将项目中的所有Discussions链接替换为有效的Issues链接
  - docs/security.md: 一般问题链接
  - README.md: 讨论社区链接
  - CONTRIBUTING.md: 社区讨论链接

### Changed

- **项目迁移** - 将项目从/tmp/taskflow-ai迁移到/root/taskflow-ai
- **文档更新** - 更新相关链接和文档结构

## [Unreleased]

### Added

- ✨ 新增 Agent 系统
  - 自主任务执行能力
  - 工具调用框架
  - 状态机管理
- 🔌 MCP 集成增强
  - 支持 Cursor/VSCode/Windsurf/Trae/Claude Desktop
  - MCP 服务器自动发现
  - 安全沙箱机制
- 🧠 思维链可视化优化
  - Mermaid 流程图导出
  - 思维导图支持
  - 置信度评估
- ⚡ 工作流性能提升
  - 并行执行优化
  - 缓存机制
  - 内存管理改进

### Changed

- 重构核心配置模块
- 优化 AI 路由算法
- 改进错误处理机制

### Fixed

- 修复 MCP 连接稳定性问题
- 修复工作流状态持久化 bug
- 修复多模型切换时的内存泄漏

## [2.0.0] - 2026-01-15

### Added

- 🎉 全新架构设计
  - 模块化架构
  - 插件系统
  - 事件驱动
- 🤖 多模型智能路由
  - 统一接口调用所有模型
  - 智能路由策略 (smart/cost/speed/priority)
  - 级联降级机制
- 📝 智能 PRD 解析
  - Markdown/Word/PDF 支持
  - AI 驱动的任务分解
  - 工时估算
- 🧩 插件系统
  - 钩子机制
  - 配置扩展
  - 自定义命令

### Changed

- 完全重构 CLI 架构
- 新的配置管理系统
- 改进的日志系统

### Removed

- 废弃 v1.x 的 API 接口
- 移除旧版配置格式支持

## [1.2.0] - 2025-12-10

### Added

- Docker MCP 注册表
- 容器化部署支持
- 环境变量配置

### Fixed

- 修复 Windows 路径问题
- 修复并发任务冲突

## [1.1.0] - 2025-11-20

### Added

- CI/CD 工作流支持
- GitHub Actions 集成
- 自动化测试

### Changed

- 优化 PRD 解析算法
- 改进任务分配逻辑

## [1.0.0] - 2025-10-01

### Added

- 🎉 初始版本发布
- 基础 CLI 功能
- PRD 文档解析
- 任务管理
- 多模型 AI 支持

---

## 版本说明

- **主版本号 (X.y.z)**: 不兼容的 API 变更
- **次版本号 (x.Y.z)**: 向下兼容的功能新增
- **修订号 (x.y.Z)**: 向下兼容的问题修复

## 标签说明

- `latest` - 最新稳定版本
- `beta` - 公测版本，功能基本完整
- `alpha` - 内测版本，可能包含未完成的功能
