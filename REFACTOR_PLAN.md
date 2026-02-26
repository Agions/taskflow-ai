# TaskFlow AI 重构计划

## 项目现状

- **文件数**: 83 个 TS 文件
- **代码行数**: 21,677 行
- **大文件**: 18 个 (>300行)

## 重构目标

1. **删除冗余代码**
2. **拆分大文件** (>300行 → <200行)
3. **统一代码风格**
4. **优化导入/导出**

## 大文件清单

| 文件 | 行数 | 操作 |
|------|------|------|
| mcp/prompts/manager.ts | 622 | 拆分 |
| cicd/github/index.ts | 572 | 拆分 |
| codegen/templates/index.ts | 560 | 拆分 |
| mcp/server.ts | 528 | 拆分 |
| cli/commands/visualize.ts | 515 | 拆分 |
| agent/verification/engine.ts | 506 | 拆分 |
| mcp/resources/manager.ts | 481 | 拆分 |
| knowledge/retrieval/index.ts | 479 | 拆分 |
| marketplace/registry/index.ts | 475 | 拆分 |
| marketplace/installer/index.ts | 459 | 拆分 |
| mcp/tools/registry.ts | 458 | 拆分 |
| agent/state-machine/index.ts | 455 | 拆分 |
| agent/execution/engine.ts | 454 | 拆分 |
| agent/planning/engine.ts | 425 | 拆分 |
| codegen/engines/index.ts | 417 | 拆分 |
| cli/commands/agent.ts | 417 | 拆分 |
| core/config/index.ts | 393 | 拆分 |
| cli/commands/knowledge.ts | 382 | 拆分 |

## 重构步骤

### Phase 1: 删除未使用代码
- [ ] 检查并删除未使用的导入
- [ ] 删除注释掉的代码
- [ ] 删除空文件

### Phase 2: 拆分大文件
- [ ] 按功能模块拆分
- [ ] 提取公共逻辑到 utils
- [ ] 创建 index.ts 统一导出

### Phase 3: 优化结构
- [ ] 统一错误处理
- [ ] 统一日志格式
- [ ] 优化类型定义

## 执行顺序

1. 先删除明显冗余的代码
2. 再拆分最大的文件
3. 最后优化细节
