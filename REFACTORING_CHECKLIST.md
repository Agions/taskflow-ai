# TaskFlow AI 重构任务执行清单

> **项目**: taskflow-ai
> **报告日期**: 2025-04-29
> **执行状态**: 分析完成，待开始重构

---

## 📋 完整任务清单

### ✅ 已完成的分析任务

| ID | 任务 | 状态 | 输出 |
|----|------|------|------|
| 1 | 克隆项目并分析结构 | ✅ 完毕 | 目录结构分析报告 |
| 2 | MCP 和多 Agent 最佳实践研究 | ✅ 完毕 | 最佳实践文档 |
| 3 | 深度代码分析 | ✅ 完毕 | 架构分析报告 |
| 4 | 代码审查和 Bug 排查 | ✅ 完毕 | 19 个问题清单 |
| 5 | 制定重构规划方案 | ✅ 完毕 | 三阶段重构计划 |
| 6 | 交互设计优化方案 | ✅ 完毕 | UX 优化建议 |
| 7 | 文档重新设计方案 | ✅ 完毕 | 新文档结构 |
| 8 | 输出完整重构报告 | ✅ 完毕 | REFACTORING_REPORT.md |

---

## 🔴 P0 - 紧急修复清单（1-2周）

### 安全漏洞修复（4项）

- [ ] **修复命令白名单绕过漏洞**
  - 文件: `src/mcp/security/validator.ts:130-131`
  - 方案: 解析完整命令链，检查 `&&` `||` `;`
  - 测试: `rm -rf / && malicious-command` 应该被阻止

- [ ] **修复正则匹配绕过风险**
  - 文件: `src/mcp/security/validator.ts:125-126`
  - 方案: 使用 `escapeRegExp` 或更严格的验证
  - 测试: 测试各种反弹攻击模式

- [ ] **修复沙箱逃逸风险**
  - 文件: `src/mcp/security/sandbox.ts:43-56`
  - 方案: 使用 `vm2` 或移除沙箱依赖
  - 测试: 尝试 `require('fs')` 等危险模块访问

- [ ] **修复 shell_kill 权限问题**
  - 文件: `src/mcp/tools/shell.ts:206-210`
  - 方案: 只允许杀死 MCP 创建的进程
  - 测试: 验证不能杀死系统进程

### 关键 Bug 修复（2项）

- [ ] **修复 ModelGateway 无用表达式**
  - 文件: `src/core/ai/gateway.ts:374`
  - 当前代码: `model.id !== newModel.id;`
  - 正确代码: `model = newModel;`

- [ ] **为工具执行添加超时控制**
  - 文件: `src/mcp/server/executor.ts`
  - 方案: 使用 `Promise.race` 实现 30s 超时
  - 测试: 长时间运行的工具应该被中断

---

## ⚠️ P1 - 核心重构清单（4-6周）

### 架构解耦（3项）

- [ ] **分离 MCP Server 和 Agent 系统**
  - 目标: MCP Server 完全无状态
  - 步骤:
    1. MCP Tools 只定义工具元数据
    2. 工具执行通过 HTTP/gRPC 调用 Agent 系统
    3. Agent 系统启动独立 HTTP 服务
  - 验证: CLI 的 `taskflow mcp start` 可以独立运行

- [ ] **MCP Tools 重构为纯工具定义**
  - 文件: `src/mcp/tools/built-in.ts`
  - 移除: 对 Crew 和 AgentRuntime 的直接依赖
  - 添加: HTTP/gRPC 客户端调用 Agent 系统

- [ ] **Agent 系统独立运行**
  - 新增: `src/core/agent/server.ts` (HTTP 服务器)
  - API: 提供创建 Agent、执行任务、查询状态的 REST API
  - 测试: 使用 curl 测试所有 API 端点

### 统一类型系统（3项）

- [ ] **统一 Agent 类型定义**
  - 保留: `src/core/agent/types.ts` 作为唯一类型源
  - 删除: `src/agent/types/` 中的重复定义
  - 删除: `src/types/agent.ts` 中的重复定义
  - 验证: 运行 `npm run type-check` 确保无类型错误

- [ ] **统一 Config 系统**
  - 保留: `src/core/config/` 作为唯一配置层
  - 删除: `src/config/config-manager.ts`
  - 迁移: 所有引用都指向 Core 层
  - 测试: 确保配置加载和保存功能正常

- [ ] **统一 Plugin 系统**
  - 保留: `src/plugins/` 负责生命周期管理
  - 保留: `src/core/plugin/` 负责插件加载
  - 明确: 清晰的职责文档
  - 测试: 插件的注册、启用、禁用、卸载流程

### 实现缺失功能（3项）

- [ ] **实现 fileSearchTool**
  - 文件: `src/core/tools/implementations/built-in.ts:180-186`
  - 方案: 使用 `glob` 或 `ripgrep` 实现真实搜索
  - 测试: 搜索 `src/` 中的所有 `.ts` 文件

- [ ] **实现 FunctionCallingHandler**
  - 文件: `src/core/function-call/executor.ts:80-104`
  - 方案: 连接到 ModelGateway，解析和执行工具调用
  - 测试: 调用一个真实的工具

- [ ] **实现 StructuredOutputHandler**
  - 文件: `src/core/function-call/executor.ts:156-167`
  - 方案: 根据 JSON Schema 验证和格式化输出
  - 测试: 生成符合 Schema 的 JSON 输出

- [ ] **实现真实的 Agent 执行**
  - 文件: `src/core/multi-agent/crew.ts:440-468`
  - 替换: `simulateAgentExecution` 为真实执行
  - 测试: 运行一个完整的 Crew 任务

- [ ] **实现工作流恢复功能**
  - 文件: `src/core/workflow/engine.ts:216`
  - 方案: 加载持久化的状态继续执行
  - 测试: 暂停工作流，然后恢复

- [ ] **完善缓存统计**
  - 文件: `src/core/cache/cache-manager.ts:193-194`
  - 方案: 在 L1Cache 中维护真实的计数器
  - 测试: 多次调用后验证命中率准确

- [ ] **实现 DNS Rebinding 防护**
  - 文件: `src/mcp/security/validator.ts:169-170`
  - 方案: 验证 DNS 解析后的 IP 地址
  - 测试: 尝试访问内网 IP（应该被阻止）

---

## ℹ️ P2 - 架构优化清单（6-8周）

### MCP 对齐（3项）

- [ ] **确保 MCP Server 完全无状态**
  - 检查: MCP Server 中的所有状态管理
  - 移除: 任何持久化的状态
  - 验证: 多个 Client 同时使用时无冲突

- [ ] **优化工具定义，单一职责**
  - 审查: 所有工具的职责是否单一
  - 拆分: 过于复杂的工具
  - 文档: 每个工具都有清晰的文档

- [ ] **完善 Resources 和 Prompts**
  - 实现: Resources 系统的完整功能
  - 优化: Prompt 渲染引擎
  - 测试: 使用模板变量渲染 Prompt

### 多 Agent 优化（3项）

- [ ] **合并三套 Agent 系统**
  - 统一: 为一套类型系统和架构
  - 迁移: Crew、Coordinator、Runtime 的功能
  - 测试: 所有现有 Agent 功能正常

- [ ] **实现智能任务分解**
  - 方案: 使用 LLM 进行语义理解
  - 算法: 基于依赖分析生成任务图
  - 测试: "Build a blog system" → 分解为多层任务

- [ ] **完善消息队列和上下文**
  - 实现: 可靠的消息队列（优先级、重试）
  - 实现: 共享上下文管理
  - 测试: 多 Agent 协作场景

### 性能优化（3项）

- [ ] **实现 L2 缓存**
  - 方案: Redis 或文件系统缓存
  - 策略: 缓存预热、逐出策略
  - 测试: 缓存命中率和性能提升

- [ ] **优化 YAML 解析**
  - 替换: 手动解析为 `@node-rs/yaml`
  - 测试: 解析速度对比
  - 验证: 所有工作流 YAML 正确解析

- [ ] **实现准确的缓存统计**
  - 功能: 真实的命中率追踪
  - 仪表盘: 缓存性能可视化
  - 优化: 根据统计数据调整缓存策略

---

## 🎨 交互设计优化清单

### CLI 体验

- [ ] **统一命令结构**
  - 规范: `taskflow <namespace> <action> --options`
  - 文档: 所有命令都遵循此格式

- [ ] **改进错误提示**
  - 格式: 清晰的错误信息 + 修复建议 + 文档链接
  - 示例: 见重构报告

- [ ] **进度可视化**
  - 工具: 使用 `ora` 和 `cli-progress`
  - 模式: 默认、详细、静默

### 文档

- [ ] **重构文档结构**
  - 参考: 重构报告中的新结构
  - 目标: 分层、易导航

- [ ] **添加交互式示例**
  - 所有代码示例可复制
  - 提供预期输出
  - 添加 Playground 链接（可选）

- [ ] **故障排除指南**
  - FAQ: 常见问题和解答
  - 调试工具和技巧
  - 日志分析指南

### 开发体验

- [ ] **完善 TypeScript 类型**
  - 所有 API 都有类型定义
  - 启用严格模式
  - 添加 JSDoc

- [ ] **插件开发文档**
  - 快速开始指南
  - API 参考
  - 插件示例

- [ ] **测试指南**
  - 单元测试最佳实践
  - 集成测试示例
  - E2E 测试配置

---

## 📝 里程碑和版本规划

### v4.1.0 - 安全修复版（1-2周后）
**内容**:
- 修复 5 个 P0 安全漏洞
- 修复 2 个关键 Bug

**发布点**:
- ✅ 所有已知安全漏洞已修复
- ✅ 工具执行有超时保护
- ✅ 模型切换正常工作

---

### v5.0.0 - 核心重构版（5-8周后）
**内容**:
- 架构解耦：MCP 与 Agent 分离
- 统一类型系统
- 实现所有缺失功能

**发布点**:
- ✅ MCP Server 完全无状态
- ✅ 统一的 Plugin 和 Config 系统
- ✅ 所有核心功能完整可用

**Breaking Changes**:
- MCP Server 与 Agent 系统需要分别启动
- 部分 API 接口变更
- 需要更新配置文件

---

### v6.0.0 - 架构优化版（11-16周后）
**内容**:
- MCP 完全对齐
- 多 Agent 系统优化
- 性能优化

**发布点**:
- ✅ MCP 成为最佳实践参考
- ✅ 智能任务分解
- ✅ L2 缓存和性能提升
- ✅ 完整的文档和示例

---

## 🚀 执行建议

### 立即开始（本周）
1. 创建重构分支
   ```bash
   git checkout -b refactor/vNext
   ```

2. 修复 P0 安全漏洞（优先级最高）
   - 从命令白名单绕过开始
   - 每个修复都要有测试

3. 设置 CI/CD
   - 自动运行测试
   - 安全扫描
   - 代码覆盖率检查

### 第一周
- 完成所有 P0 修复
- 编写回归测试
- 发布 v4.1.0

### 第2-6周
- 开始 P1 核心重构
- 每周进行代码审查
- 持续发布 beta 版本

### 第7-16周
- P2 架构优化
- 完善文档
- 发布 v5.0.0 和 v6.0.0

---

## 📊 进度追踪

使用以下方式追踪进度：

```bash
# 查看所有任务清单
cat REFACTORING_CHECKLIST.md

# 标记任务完成（手动编辑）
# - [ ] 未完成
# - [x] 已完成
```

建议使用工具：
- [GitHub Projects](https://github.com/features/project-management/) - 可视化看板
- [Notion](https://www.notion.so/) - 任务追踪
- [Linear](https://linear.app/) - 项目管理

---

## 🆘 遇到问题时

### 技术问题
1. [查看重构报告](REFACTORING_REPORT.md)
2. [查看设计最佳实践](docs/concepts/)
3. 查看 GitHub Issues

### 决策问题
1. 参考 MCP 官方文档
2. 参考 Anthropic 文档
3. 讨论：团队会议或 Issue

---

## 📞 联系方式

- **项目**: https://github.com/Agions/taskflow-ai
- **文档**: https://taskflow.ai/docs
- **Issues**: https://github.com/Agions/taskflow-ai/issues

---

*保持更新！每隔两周更新这份清单喵！* (๑•̀ㅂ•́)و✧
