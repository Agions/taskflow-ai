# Changelog

所有 TaskFlow AI 的显著变更都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

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

---

## [Unreleased]

### Added

- 新增专业级 CLI UI 组件库
  - 统一颜色主题系统
  - ASCII Logo 展示
  - 加载动画 (Spinner)
  - 信息框组件 (成功/错误/警告/信息)
  - 列表和表格展示
  - 进度条组件
  - 交互式提示 (确认/输入/选择/向导)
  - 仪表板组件 (项目状态/系统信息/任务列表/时间线)
- 新增 NPM 发布脚本
  - `npm run publish:patch` - 发布补丁版本
  - `npm run publish:minor` - 发布次要版本
  - `npm run publish:major` - 发布主要版本
  - `npm run publish:beta` - 发布 Beta 版本
  - `npm run publish:alpha` - 发布 Alpha 版本
- 优化 CI/CD 工作流
  - 增强的 npm-publish.yml
  - 改进的 ci.yml (支持 Node 18/20/22)
  - 增强的 release.yml

### Changed

- 优化 package.json 发布配置
  - 添加 publishConfig
  - 优化 files 字段
  - 添加 prepublishOnly 脚本

## [2.1.0] - 2026-02-22

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
