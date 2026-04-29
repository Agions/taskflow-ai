# TaskFlow AI MCP 专注化 - 快速行动清单

> **新策略**: 移除所有 Agent 能力，专注于成为精品 MCP Server
>
> **时间**: 6-9 周
>
> **第一步**: 删除 Agent 代码 + 修复安全漏洞

---

## 🎯 立即开始（本周）

### Day 1-2: 删除 Agent 相关代码

```bash
# 1. 创建新分支
git checkout -b refactor/mcp-only

# 2. 备份当前代码
git add .
git commit -m "Backup: before removing agent code"

# 3. 删除目录
rm -rf src/core/agent/
rm -rf src/core/multi-agent/
rm -rf src/agent/

# 4. 删除 CLI 命令
rm -rf src/cli/commands/crew/
rm -rf src/cli/commands/agent/

# 5. 清理 MCP tools 中的 Agent 相关代码
# 编辑 src/mcp/tools/built-in.ts
# 删除: create_agent, create_crew, run_crew, agent_status

# 6. 移除相关依赖（可选）
npm uninstall xstate @xstate/fsm  # 如果不再使用

# 7. 尝试构建
npm run build

# 8. 修复编译错误
# 根据错误提示，删除其他文件中对 Agent 的引用
```

**检查清单**:
- [ ] 删除 `src/core/agent/` 目录
- [ ] 删除 `src/core/multi-agent/` 目录
- [ ] 删除 `src/agent/` 目录
- [ ] 删除 `src/cli/commands/crew/` 目录
- [ ] 删除 `src/cli/commands/agent/` 目录
- [ ] 清理 `src/mcp/tools/built-in.ts` 中的 Agent 工具
- [ ] 修复所有编译错误
- [ ] `npm run build` 成功
- [ ] `npm test` 通过

---

### Day 3-4: 修复安全漏洞

#### 1. 修复命令白名单绕过
**文件**: `src/mcp/security/validator.ts`

```typescript
// 修复前（第 130-131 行）
const command = args[0].trim();
if (!allowedCommands.includes(command)) {

// 修复后
const fullCommand = args.join(' ');  // 获取完整命令
// 检查是否包含操作符
if (fullCommand.includes('&&') || fullCommand.includes('||') || fullCommand.includes(';')) {
  throw new Error('Command chaining not allowed');
}
const command = args[0].trim();
if (!allowedCommands.includes(command)) {
```

#### 2. 修复正则匹配绕过
**文件**: `src/mcp/security/validator.ts`

```typescript
// 修复前（第 125-126 行）
if (pattern.test(trimmed)) {

// 修复后
const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const regex = new RegExp(escapedPattern);
if (regex.test(trimmed)) {
```

#### 3. 修复沙箱逃逸
**文件**: `src/mcp/security/sandbox.ts`

```typescript
// 建议：移除沙箱，使用严格的白名单
// 或者使用 vm2 库
```

#### 4. 修复 shell_kill 权限
**文件**: `src/mcp/tools/shell.ts`

```typescript
// 修复前（第 206-210 行）
// 允许杀死任何进程

// 修复后
// 只允许杀死由 MCP Server 创建的进程
// 维护一个进程列表，只从列表中杀进程
```

#### 5. 修复 ModelGateway 无用表达式
**文件**: `src/core/ai/gateway.ts`

```typescript
// 修复前（第 374 行）
model.id !== newModel.id;  // 这是无用表达式

// 修复后
model = newModel;  // 但应该是这样
```

#### 6. 添加工具执行超时
**文件**: `src/mcp/server/executor.ts`

```typescript
// 添加超时控制
async execute(toolName: string, args: any): Promise<any> {
  const timeout = 30000; // 30 秒

  const result = await Promise.race([
    this.doExecute(toolName, args),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Tool execution timeout')), timeout)
    )
  ]);

  return result;
}
```

**检查清单**:
- [ ] 修复命令白名单绕过漏洞
- [ ] 修复正则匹配绕过风险
- [ ] 修复沙箱逃逸风险
- [ ] 修复 shell_kill 权限问题
- [ ] 修复 ModelGateway Bug
- [ ] 添加超时控制
- [ ] 添加安全测试
- [ ] 所有安全测试通过

---

### Day 5: 清理和验证

```bash
# 1. 清理依赖
npm uninstall xstate @xstate/fsm  # 检查是否还有其他不需要的

# 2. 清理配置文件
# 检查 tsconfig.json, 删除对已删除模块的引用
# 检查 jest.config.js, 更新测试配置

# 3. 更新 package.json
# 删除不再需要的 scripts
# 更新 description
# 更新 keywords（移除 agent 相关）

# 4. 运行完整测试
npm run quality  # 类型检查 + lint + test

# 5. 测试 MCP Server
npm run mcp

# 6. 在 Claude Desktop 中测试
# 配置 MCP Server 并测试基本工具
```

**检查清单**:
- [ ] 移除不需要的依赖
- [ ] 清理配置文件
- [ ] 更新 package.json
- [ ] `npm run quality` 通过
- [ ] MCP Server 正常启动
- [ ] 基本工具（ls, cat, echo）可用
- [ ] Claude Desktop 连接成功

---

## 🚀 第二周：完善 MCP 工具

### 重点任务

#### 完善文件系统工具
```typescript
// src/mcp/tools/filesystem.ts
// 确保所有文件操作都有完整实现
```

- [ ] readFile - 支持大文件流式读取
- [ ] writeFile - 支持权限控制
- [ ] listDirectory - 遍历深层目录
- [ ] deleteFile - 安全删除
- [ ] moveFile - 支持跨设备

#### 完善 Shell 工具
```typescript
// src/mcp/tools/shell.ts
```

- [ ] 支持 sudo
- [ ] 环境变量传递
- [ ] 输出捕获
- [ ] 错误处理

#### 完善 Git 工具
```typescript
// src/mcp/tools/git.ts
```

- [ ] commit/push/pull
- [ ] branch 管理
- [ ] tag 管理
- [ ] merge/rebase

#### 完善 HTTP 工具
```typescript
// src/mcp/tools/http.ts
```

- [ ] POST/GET/PUT/DELETE
- [ ] 自定义 headers
- [ ] 认证支持
- [ ] 重试机制

---

## 📊 进度追踪

### Week 1（第 1-7 天）
- [ ] Day 1-2: 删除 Agent 代码
- [ ] Day 3-4: 修复安全漏洞
- [ ] Day 5: 清理和验证

**里程碑**: ✅ v4.1.0 可发布

### Week 2-4（第 8-28 天）
- [ ] 完善所有工具实现
- [ ] 增强 Resources 功能
- [ ] 优化 Prompts 引擎
- [ ] 改进错误处理

**里程碑**: ✅ v5.0.0 beta

### Week 5-7（第 29-49 天）
- [ ] CLI 优化
- [ ] 文档重构
- [ ] 性能优化
- [ ] 社区反馈

**里程碑**: ✅ v6.0.0（精品版）

---

## 🎯 每日检查

### 每天结束前问自己：
1. 今天完成了什么？
2. 有什么阻碍？
3. 明天要做什么？

### 每周回顾：
1. 本周目标是否达成？
2. 有什么可以改进的地方？
3. 下周计划是什么？

---

## 💡 快速提示

### 遇到问题时：
1. 先看错误信息
2. 检查相关测试
3. 查阅 MCP 文档
4. 在 GitHub 讨论

### 测试建议：
```bash
# 快速测试
npm test -- --verbose

# 测试特定工具
npm test -- tools/filesystem

# 测试 MCP Server
npm run mcp

# 手动测试（在另一个终端）
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/mcp/stdio-server.js
```

---

## 📞 需要帮助？

- [GitHub Issues](https://github.com/Agions/taskflow-ai/issues)
- [MCP 文档](https://modelcontextprotocol.io)
- [项目重构方案](REFACTORING_V2_FOCUS_MCP.md)

---

**开始行动吧！喵！** (๑•̀ㅂ•́)و✧
