# TaskFlow AI 测试完善计划

## 概述

本文档记录 TaskFlow AI 项目的测试完善状态和计划。

## 当前状态 (v4.0.1)

### 测试覆盖率
- **当前覆盖率**: 8.83% (1046/11840 行)
- **分支覆盖率**: 7.41%
- **函数覆盖率**: 8.59%
- **目标覆盖率**: 95%+

### 测试统计
- **总测试用例数**: 257
- **通过**: 228
- **失败**: 29
- **测试套件**: 43 个 (16 失败, 27 通过)

## 技术挑战

### 源代码结构特点
1. **大量的接口设计**: 大量使用 TypeScript interface 而非 class
2. **静态工厂模式**: Logger 等使用单例模式，构造函数私有
3. **复杂依赖**: 模块间依赖复杂，Mock 需要大量准备工作

### 测试失败原因分类

#### 1. API 不匹配 (10 个失败)
- 事件类型定义变动
- 扩展类型常量化
- Mock 对象不完整

#### 2. 功能实现不完整 (8 个失败)
- string-utils 实现与测试预期不符
- 文件系统工具未完全实现

#### 3. 类型导入错误 (11 个失败)
- 循环依赖
- 路径解析问题
- 类型导出不一致

## 测试优先级分级

### P0 - 核心基础模块 (必须完成)
| 模块 | 状态 | 负责人 | 预计工时 |
|------|------|--------|---------|
| `types/module.ts` | 已有测试 (80%) | - | 2h |
| `types/task.ts` | 已有测试 (90%) | - | 1h |
| `types/message.ts` | 已有测试 (85%) | - | 1h |
| `types/tool.ts` | 需要实现 | - | 4h |
| `types/event.ts` | 已有测试 (90%) | - | 1h |
| `types/extensions.ts` | 需要修复 | - | 3h |

### P1 - 核心功能模块 (高优先级)
| 模块 | 状态 | 负责人 | 预计工时 |
|------|------|--------|---------|
| `core/ai/adapter.ts` | 需要重构 | - | 8h |
| `core/ai/router.ts` | 需要重构 | - | 8h |
| `core/workflow/engine.ts` | 部分测试 | - | 6h |
| `core/tools/registry.ts` | 部分测试 | - | 4h |
| `core/agent/core.ts` | 部分测试 | - | 6h |

### P2 - Agent 系统 (中优先级)
| 模块 | 状态 | 负责人 | 预计工时 |
|------|------|--------|---------|
| `agent/execution/` | 无测试 | - | 12h |
| `agent/planning/` | 无测试 | - | 10h |
| `agent/verification/` | 部分测试 | - | 6h |

### P3 - CLI 和其他模块 (低优先级)
| 模块 | 状态 | 负责人 | 预计工时 |
|------|------|--------|---------|
| `cli/` | 部分测试 | - | 16h |
| `cicd/` | 无测试 | - | 12h |
| `marketplace/` | 无测试 | - | 10h |

## 分阶段实施计划

### Phase 1: 修复现有失败测试
**目标**: 使所有测试都能通过
**时间**: Week 1-2
**覆盖范围**: P0 + P1 部分
**预期覆盖率**: 20% → 40%

**任务**:
- [ ] 修复事件类型导入问题
- [ ] 修复扩展类型常量问题
- [ ] 修复 string-utils 实现与测试不一致
- [ ] 添加缺失的类型导出

### Phase 2: 补充核心模块测试
**目标**: 达到核心模块 80%+ 覆盖率
**时间**: Week 3-4
**覆盖范围**: P1 全部
**预期覆盖率**: 40% → 65%

**任务**:
- [ ] 为 AI adapter/router 创建完整测试
- [ ] 为 workflow engine 创建集成测试
- [ ] 为 tools registry 创建单元测试

### Phase 3: 扩展测试覆盖
**目标**: 达到整体 80%+ 覆盖率
**时间**: Week 5-6
**覆盖范围**: P0-P2 全部
**预期覆盖率**: 65% → 85%

**任务**:
- [ ] 为 agent 系统创建测试
- [ ] 为 CLI 命令创建测试
- [ ] 为 CI/CD 模块创建测试

### Phase 4: 达到 95% 目标
**目标**: 达到整体 95%+ 覆盖率
**时间**: Week 7-8
**覆盖范围**: 全部模块
**预期覆盖率**: 85% → 95%

**任务**:
- [ ] 填补剩余测试空白
- [ ] 添加集成测试
- [ ] 优化测试性能
- [ ] 设置覆盖率阈值

## 测试最佳实践

### 1. 接口测试策略
由于大量使用接口，测试分为两层：

**类型验证测试**:
```typescript
describe('TypeValidation', () => {
  it('should validate PRDDocument structure', () => {
    const doc: PRDDocument = {
      id: 'test-1',
      title: 'Test',
      sections: [],
      // Required fields
    };
    expect(doc).toBeDefined();
  });
});
```

**功能测试** (针对使用该接口的工具函数):
```typescript
describe('PRDParser', () => {
  it('should parse markdown to PRDDocument', () => {
    const result = PRDParser.parse(markdown);
    expect(result.id).toBe('test-1');
  });
});
```

### 2. Mock 策略
使用 manual mock 替代自动 mock：

```typescript
// __mocks__/logger.ts
export const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
};
```

### 3. 测试工具函数
创建通用测试辅助函数：

```typescript
// tests/helpers/createMockPRD.ts
export function createMockPRD(overrides?: Partial<PRDDocument>): PRDDocument {
  return {
    id: 'test-prd',
    title: 'Test PRD',
    sections: [],
    ...overrides,
  };
}
```

## 资源需求

### 人员
- 1 名资深开发 (架构理解 + 核心测试)
- 2 名中级开发 (功能测试)

### 工具
- Jest (已配置)
- test-utils (需要创建)
- Mock 生成工具

### 时间估算
- Phase 1: 40 h
- Phase 2: 60 h
- Phase 3: 80 h
- Phase 4: 60 h
- **总计**: 240 h (约 6 名开发者工作一周)

## 风险与缓解

### 风险1: 代码架构变更导致测试失效
**缓解**: 在代码变更前先更新测试，使用 TDD

### 风险2: Mock 复杂度过高
**缓解**: 创建测试工具类和辅助函数

### 风险3: 测试运行时间过长
**缓解**: 使用 Jest 的并行执行，优化测试文件组织

## 进度跟踪

此文档将每周更新，记录实际进度与计划的偏差。

| 日期 | Phase | 状态 | 覆盖率 | 备注 |
|------|-------|------|--------|------|
| 2024-04-24 | - | 规划阶段 | 8.83% | 创建计划文档 |

## 参考

- [Jest 官方文档](https://jestjs.io/)
- [TypeScript Testing Best Practices](https://basarat.gitbook.io/typescript/type-system/tjest)
- [Testing Library 文档](https://testing-library.com/)
