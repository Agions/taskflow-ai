# TaskFlow AI 测试指南

## 概述

TaskFlow AI 遵循 TDD (Test-Driven Development) 方法论，目标达到 95%+ 的代码覆盖率。

## 当前状态

- **测试覆盖率**: 约 9% (需要提升到 95%+)
- **总文件数**: 285 个 src 文件
- **已测试文件**: 约 35 个
- **未测试文件**: 约 250 个

## 测试优先级

### P0 - 核心基础模块（必须覆盖）
- `src/types/` - 类型定义系统
- `src/utils/` - 工具函数
- `src/config/` - 配置管理

### P1 - 核心功能模块（高优先级）
- `src/core/ai/` - AI 适配器和路由
- `src/core/workflow/` - 工作流引擎
- `src/core/tools/` - 工具系统
- `src/core/errors/` - 错误处理

### P2 - Agent 系统（中优先级）
- `src/agent/execution/` - 任务执行
- `src/agent/planning/` - 任务规划
- `src/agent/verification/` - 验证引擎

### P3 - CLI 和其他模块（低优先级）
- `src/cli/` - 命令行界面
- `src/cicd/` - CI/CD 功能
- `src/marketplace/` - 市场功能

## 测试结构

```
src/
├── module/
│   ├── index.ts
│   └── __tests__/
│       └── module.test.ts
```

## 测试规范

### 命名规范

- 测试文件：`[module].test.ts`
- 测试套件：使用 `describe` 分组
- 测试用例：清晰描述测试意图

### 测试模式

```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('ModuleName', () => {
  let instance: ModuleClass;

  beforeEach(() => {
    // 准备测试环境
    instance = new ModuleClass();
  });

  afterEach(() => {
    // 清理测试环境
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should do something when condition', () => {
      // Arrange（准备）
      const input = { /* ... */ };

      // Act（执行）
      const result = instance.methodName(input);

      // Assert（断言）
      expect(result).toBe(expected);
    });
  });
});
```

### Mock 使用

```typescript
jest.mock('module', () => ({
  exportedFunction: jest.fn(),
}));
```

## 运行测试

### 运行所有测试
```bash
npm test
```

### 运行特定测试
```bash
npm test -- module.test.ts
```

### 运行测试并生成覆盖率报告
```bash
npm test -- --coverage
```

### 监听模式
```bash
npm test -- --watch
```

## 覆盖率目标

| 模块 | 当前覆盖率 | 目标覆盖率 |
|------|----------|-----------|
| types | ~50% | 100% |
| utils | ~20% | 100% |
| core/ai | ~5% | 95% |
| core/workflow | ~10% | 95% |
| agent | ~2% | 90% |
| cli | ~1% | 80% |

## CI/CD 集成

测试在 GitHub Actions CI/CD 流程中自动运行：

- **Lint & Type Check**: ESLint 和 TypeScript 类型检查
- **Test Suite**: Jest 测试套件
- **Coverage Check**: 确保覆盖率不低于阈值

## 测试最佳实践

### 1. 测试独立性
每个测试用例应该独立运行，不依赖其他测试的执行顺序。

### 2. AAA 模式
- **Arrange（准备）**: 设置测试数据和环境
- **Act（执行）**: 调用被测试的方法
- **Assert（断言）**: 验证结果

### 3. 边界测试
- 测试正常情况
- 测试边界条件
- 测试异常情况

### 4. Mock 外部依赖
使用 mock 隔离外部依赖，确保测试的可重现性。

### 5. 清晰的测试描述
测试名称应该清晰描述被测试的行为。

## 待完成测试

### 核心基础模块
- [ ] `src/types/prd.ts` - PRD 类型
- [ ] `src/types/project.ts` - 项目类型
- [ ] `src/utils/logger.ts` - 日志系统
- [ ] `src/config/index.ts` - 配置管理

### 核心功能模块
- [ ] `src/core/ai/adapter.ts` - AI 适配器
- [ ] `src/core/ai/router.ts` - AI 路由
- [ ] `src/core/workflow/engine.ts` - 工作流引擎
- [ ] `src/core/tools/registry.ts` - 工具注册

### Agent 系统
- [ ] `src/agent/execution/task-executor.ts` - 任务执行器
- [ ] `src/agent/planning/task-generator.ts` - 任务生成器
- [ ] `src/agent/verification/type-safety.ts` - 类型安全检查

## 进度跟踪

本文档将在测试覆盖率提升时更新。
