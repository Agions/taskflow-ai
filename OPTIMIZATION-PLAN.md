# TaskFlow AI 代码优化与项目结构改进计划

## ✅ 已完成的修复

### CI/CD 构建错误修复 (2026-02-16)
- [x] 修复 `visualize.ts` 中的数组类型定义
- [x] 修复 `ai/index.ts` 中的缓存键类型
- [x] 修复 `config/index.ts` 中的 error 类型
- [x] 修复 `mcp/security/manager.ts` 中的 error 类型
- [x] 修复 `mcp/tools/registry.ts` 中的 analysis 类型

**结果**: ✅ TypeScript 类型检查通过，构建成功

---

## 📊 代码分析结果

### 当前代码统计
- **TypeScript 文件**: 22 个
- **总代码行数**: ~6,633 行
- **最大文件**: `mcp/tools/registry.ts` (637 行)

### 代码复杂度分析
| 文件 | 行数 | 复杂度 | 建议 |
|------|------|--------|------|
| `mcp/tools/registry.ts` | 637 | 高 | 需要拆分 |
| `mcp/prompts/manager.ts` | 622 | 高 | 需要拆分 |
| `cli/commands/visualize.ts` | 515 | 中 | 可优化 |
| `mcp/resources/manager.ts` | 481 | 中 | 可优化 |
| `mcp/server.ts` | 474 | 中 | 可优化 |

---

## 🔧 优化计划

### Phase 1: 代码去重 (本周)

#### 1.1 提取通用错误处理
**当前问题**: 多个文件重复的错误处理模式

**解决方案**: 创建统一的错误处理工具

```typescript
// src/utils/error-handler.ts
export async function handleAsyncError<T>(
  fn: () => Promise<T>,
  errorMessage: string
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    throw new Error(`${errorMessage}: ${error.message}`);
  }
}
```

**影响文件**:
- `src/core/config/index.ts`
- `src/mcp/security/manager.ts`
- `src/mcp/tools/registry.ts`

#### 1.2 提取通用日志模式
**当前问题**: 重复的日志记录代码

**解决方案**: 创建日志装饰器

```typescript
// src/utils/decorators.ts
export function LogOperation(operation: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const logger = Logger.getInstance(target.constructor.name);
      logger.info(`开始 ${operation}...`);
      try {
        const result = await original.apply(this, args);
        logger.info(`${operation} 完成`);
        return result;
      } catch (error) {
        logger.error(`${operation} 失败:`, error);
        throw error;
      }
    };
  };
}
```

---

### Phase 2: 文件拆分 (下周)

#### 2.1 拆分 `mcp/tools/registry.ts`
当前 637 行 → 拆分为多个小文件

```
src/mcp/tools/
├── registry.ts          # 核心注册逻辑 (200 行)
├── executors/
│   ├── file-executor.ts    # 文件操作
│   ├── shell-executor.ts   # 命令执行
│   └── project-executor.ts # 项目分析
└── validators/
    └── input-validator.ts  # 输入验证
```

#### 2.2 拆分 `mcp/prompts/manager.ts`
当前 622 行 → 按功能拆分

```
src/mcp/prompts/
├── manager.ts           # 核心管理 (200 行)
├── templates/
│   ├── task-prompts.ts    # 任务相关
│   ├── analysis-prompts.ts # 分析相关
│   └── code-prompts.ts    # 代码相关
└── renderers/
    └── template-renderer.ts
```

#### 2.3 拆分 `cli/commands/visualize.ts`
当前 515 行 → 按图表类型拆分

```
src/cli/commands/visualize/
├── index.ts             # 主命令
├── generators/
│   ├── gantt-generator.ts
│   ├── kanban-generator.ts
│   ├── pie-generator.ts
│   └── timeline-generator.ts
└── templates/
    └── html-template.ts
```

---

### Phase 3: 架构优化 (第 3-4 周)

#### 3.1 引入依赖注入
**目标**: 解耦组件，提高可测试性

```typescript
// src/shared/container.ts
import { Container } from 'inversify';

const container = new Container();

// 注册服务
container.bind<IAIService>(TYPES.AIService).to(AIModelManager);
container.bind<IParser>(TYPES.Parser).to(EnhancedPRDParser);
container.bind<ITaskGenerator>(TYPES.TaskGenerator).to(AITaskGenerator);
container.bind<ILogger>(TYPES.Logger).to(Logger);

export { container };
```

#### 3.2 实现 Repository 模式
**目标**: 统一数据访问层

```typescript
// src/core/repositories/
├── task-repository.ts
├── project-repository.ts
└── config-repository.ts
```

#### 3.3 引入事件驱动架构
**目标**: 解耦模块间通信

```typescript
// src/shared/events/
├── event-bus.ts
├── event-types.ts
└── handlers/
    ├── task-created-handler.ts
    └── project-updated-handler.ts
```

---

### Phase 4: 性能优化 (第 5-6 周)

#### 4.1 AI 响应缓存优化
```typescript
// 实现 LRU 缓存
import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, AIResponse>({
  max: 100,
  ttl: 1000 * 60 * 60, // 1小时
});
```

#### 4.2 并行处理优化
```typescript
// 并行生成任务
const tasks = await Promise.all(
  sections.map(section => this.generateTasksForSection(section))
);
```

#### 4.3 懒加载优化
```typescript
// AI 服务懒加载
private getService(provider: AIProvider): AIService {
  if (!this.services.has(provider)) {
    this.services.set(provider, this.createService(provider));
  }
  return this.services.get(provider)!;
}
```

---

## 📁 优化后的项目结构

```
taskflow-ai/
├── src/
│   ├── cli/                    # CLI 层
│   │   ├── commands/           # 命令
│   │   │   ├── init/
│   │   │   ├── parse/
│   │   │   ├── status/
│   │   │   ├── visualize/      # 拆分子目录
│   │   │   ├── mcp/
│   │   │   └── config/
│   │   ├── ui/                 # UI 组件
│   │   └── index.ts
│   │
│   ├── core/                   # 核心业务
│   │   ├── ai/                 # AI 服务
│   │   │   ├── index.ts
│   │   │   ├── providers/      # AI 提供商
│   │   │   └── prompts/        # 提示模板
│   │   ├── parser/             # PRD 解析
│   │   ├── tasks/              # 任务管理
│   │   ├── config/             # 配置管理
│   │   ├── repositories/       # 数据访问 (新增)
│   │   └── workflow/           # 工作流引擎 (新增)
│   │
│   ├── mcp/                    # MCP 服务器
│   │   ├── server.ts
│   │   ├── tools/              # 工具
│   │   │   ├── registry.ts
│   │   │   ├── executors/      # 执行器 (拆分)
│   │   │   └── validators/     # 验证器 (新增)
│   │   ├── resources/          # 资源
│   │   ├── prompts/            # 提示
│   │   │   ├── manager.ts
│   │   │   └── templates/      # 模板 (拆分)
│   │   └── security/           # 安全
│   │
│   ├── shared/                 # 共享组件 (新增)
│   │   ├── container.ts        # 依赖注入容器
│   │   ├── events/             # 事件系统
│   │   ├── decorators/         # 装饰器
│   │   └── constants/
│   │
│   ├── utils/                  # 工具函数
│   │   ├── logger.ts
│   │   ├── errors.ts
│   │   ├── error-handler.ts    # 错误处理 (新增)
│   │   ├── decorators.ts       # 装饰器 (新增)
│   │   └── validators.ts       # 验证器 (新增)
│   │
│   ├── types/                  # 类型定义
│   └── constants/              # 常量
│
├── tests/                      # 测试
│   ├── unit/                   # 单元测试
│   ├── integration/            # 集成测试
│   └── fixtures/               # 测试数据
│
├── docs/                       # 文档
├── scripts/                    # 脚本
└── templates/                  # 模板
```

---

## 📈 预期改进效果

### 代码质量
- **类型安全**: 100% TypeScript 严格模式
- **代码重复**: 减少 60%+
- **文件大小**: 最大文件 < 300 行
- **测试覆盖**: 达到 80%+

### 可维护性
- **模块化**: 清晰的职责分离
- **可测试**: 依赖注入支持 Mock
- **可扩展**: 插件化架构
- **文档化**: 完整的 JSDoc

### 性能
- **启动时间**: < 1s
- **AI 响应**: 缓存命中率 > 70%
- **内存使用**: 减少 30%

---

## 🚀 下一步行动

### 今天完成
- [x] 修复 CI/CD 构建错误
- [x] 创建优化计划文档

### 本周完成
- [ ] 实现通用错误处理工具
- [ ] 实现日志装饰器
- [ ] 拆分 `mcp/tools/registry.ts`
- [ ] 拆分 `mcp/prompts/manager.ts`

### 下周完成
- [ ] 拆分 `cli/commands/visualize.ts`
- [ ] 引入依赖注入容器
- [ ] 实现 Repository 模式

### 持续优化
- [ ] 添加单元测试
- [ ] 性能基准测试
- [ ] 代码审查流程

---

## 📊 成功指标

| 指标 | 当前 | 目标 | 状态 |
|------|------|------|------|
| 构建成功率 | 0% | 100% | ✅ 已修复 |
| TypeScript 错误 | 10+ | 0 | ✅ 已修复 |
| 最大文件行数 | 637 | < 300 | 🔄 进行中 |
| 代码重复率 | 高 | 低 | 🔄 进行中 |
| 测试覆盖率 | 0% | 80% | ⏳ 待开始 |

---

**制定时间**: 2026-02-16  
**版本**: v2.0.1 → v2.1.0  
**负责人**: 8号
