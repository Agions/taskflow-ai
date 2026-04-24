# TypeScript Type System

TaskFlow AI v4.0 使用严格的 TypeScript 类型系统，确保代码的类型安全、可维护性和开发体验。

## 📊 当前状态

- **TypeScript 版本**: 5.9.3
- **编译错误**: 0 ✅
- **严格模式**: 已启用
- **test 覆盖率**: ~93%

## 🏗️ 类型架构设计

### 核心类型层次结构

```
src/types/
├── index.ts          # 统一类型导出入口
├── agent/index.ts    # Agent 相关类型
├── task/index.ts     # Task 相关类型
├── extensions.ts     # Extension 类型系统
├── tool/index.ts     # Tool 类型系统
├── workflow/         # Workflow 类型系统
├── config.ts         # Configuration 类型
├── prd.ts            # PRD 文档类型
└── plugin.ts         # Plugin 类型
```

## 🔑 关键类型系统

### 1. ExtensionType

```typescript
/**
 * Extension 类型别名（向后兼容）
 */
export type ExtensionType = 'plugin' | 'agent' | 'tool' | 'workflow' | 'command' | 'ui' | 'middleware';

/**
 * Extension 类型常量
 */
export const ExtensionTypes = {
  COMMAND: 'command',
  PLUGIN: 'plugin',
  AGENT: 'agent',
  TOOL: 'tool',
  WORKFLOW: 'workflow',
  UI: 'ui',
  MIDDLEWARE: 'middleware',
} as const;

/**
 * ExtensionType 值数组（用于运行时迭代）
 */
export const EXTENSION_TYPE_VALUES = [
  'command', 'plugin', 'agent', 'tool', 'workflow', 'ui', 'middleware',
] as const;
```

**使用示例**:

```typescript
// 类型检查
const type: ExtensionType = 'plugin'; // ✅ 正确

// 运行时迭代
EXTENSION_TYPE_VALUES.forEach(type => {
  console.log(type); // ✅ 可以迭代
});

// ❌ 错误：ExtensionType 是字符串字面量类型，不能使用 Object.values()
Object.values(ExtensionType).forEach(type => {
  console.log(type); // ❌ TypeScript 错误
});
```

### 2. ToolCategory

```typescript
/**
 * Tool 分类类型
 */
export type ToolCategory = 'filesystem' | 'shell' | 'http' | 'git' | 'code' | 'mcp' | 'utility';

/**
 * Tool 分类常量
 */
export const ToolCategories = {
  FILESYSTEM: 'filesystem',
  SHELL: 'shell',
  HTTP: 'http',
  GIT: 'git',
  CODE: 'code',
  MCP: 'mcp',
  UTILITY: 'utility',
} as const;

/**
 * Tool 分类值数组
 */
export const TOOL_CATEGORY_VALUES = [
  'filesystem', 'shell', 'http', 'git', 'code', 'mcp', 'utility',
] as const;
```

### 3. PRDDocument

为兼容 Agent 类型系统和 Core 类型系统，PRDDocument 添加了可选字段：

```typescript
import { PRDDocument as CorePRD } from '../../types/prd';

export interface PRDDocument extends CorePRD {
  // Agent 特有字段
  description: string;
  requirements: Requirement[];
  acceptanceCriteria: string[];

  // Core 兼容字段（可选）
  version?: string;
  filePath?: string;
  sections?: PRDSection[];
  createdAt?: Date;
  updatedAt?: Date;
}
```

使用时的类型兼容性处理：

```typescript
async plan(prd: PRDDocument): Promise<TaskPlan> {
  const prdForGenerator: any = {
    ...prd,
    version: prd.version || '1.0.0',
    filePath: prd.filePath || '',
    sections: prd.sections || [],
    createdAt: prd.createdAt || new Date().toISOString(),
    updatedAt: prd.updatedAt || new Date().toISOString(),
  };
  const tasks = await this.taskGenerator.generate(prdForGenerator);
  // ...
}
```

### 4. TaskFlowError

错误类型系统统一：

```typescript
export interface TaskFlowError extends Error {
  type: string;          // 错误类型
  code: number;          // 错误代码（数字）
  context?: Record<string, unknown>;
}

export function createTaskFlowError(
  type: string,
  code: number,          // ✅ 数字类型
  message: string,
  context?: Record<string, any>
): TaskFlowError {
  const error = new Error(message) as TaskFlowError;
  error.name = 'TaskFlowError';
  error.type = type;
  error.code = code;     // ✅ 数字类型
  error.context = context;
  return error;
}
```

### 5. MCPSettings

配置类型使用 `NonNullable` 确保类型安全：

```typescript
export interface MCPSettings {
  enabled?: boolean;
  port?: number;
  security: {
    enableAuth?: boolean;
    rateLimit?: {
      requestsPerMinute: number;
      tokensPerMinute: number;
    };
  };
  tools: unknown[];
  resources: unknown[];
}

// 使用 NonNullable 避免类型错误
async updateSecuritySettings(
  securitySettings: Partial<NonNullable<TaskFlowConfig['mcpSettings']>['security']>
): Promise<void> {
  const config = await this.operations.loadConfig();
  // ...
}
```

## 🛠️ 类型安全最佳实践

### 1. 可选链操作符

```typescript
// ❌ 错误：可能导致 undefined 错误
aiModelsCount: config?.aiModels.length || 0

// ✅ 正确：使用可选链
aiModelsCount: config?.aiModels?.length || 0

// ❌ 错误：可能导致 undefined 错误
mcpEnabled: config?.mcpSettings.enabled || false

// ✅ 正确：使用可选链
mcpEnabled: config?.mcpSettings?.enabled || false
```

### 2. 类型守卫和断言

```typescript
// 类型守卫
if (src && typeof src === 'object' && !Array.isArray(src)) {
  return { ...acc, ...src };
}

// 类型断言
const content = await fs.readFile(filepath, encoding as BufferEncoding);
```

### 3. Record 类型注解

```typescript
// ✅ 明确类型注解
const merged = sources.reduce(
  (acc: Record<string, any>, src: unknown): Record<string, any> => {
    if (src && typeof src === 'object' && !Array.isArray(src)) {
      return { ...acc, ...src };
    }
    return acc;
  }, {}
);
```

### 4. 函数返回类型

```typescript
// ✅ 避免返回 undefined
static validateTypes(obj: Record<string, unknown>, schema: TypeSchema): ValidationResult {
  const errors: string[] = [];

  for (const [field, expectedType] of Object.entries(schema)) {
    const value = obj[field];
    if (value === undefined || value === null) continue; // ✅ 使用 continue
    // ...
  }

  return {
    valid: errors.length === 0,
    errors  // ✅ 总是返回对象
  };
}
```

## 📚 类型系统文档

### 扩展类型系统

创建自定义扩展：

```typescript
import { ExtensionDefinition, ExtensionType } from './types/extensions';

const myTool: ExtensionDefinition = {
  type: ExtensionTypes.TOOL,  // ✅ 使用常量
  id: 'my-tool',
  name: 'My Tool',
  version: '1.0.0',
  implementation: async (params) => {
    // 实现代码
  },
};
```

### 工具类型系统

注册自定义工具：

```typescript
import { ToolDefinition, ToolCategory, ToolCategories } from './types/tool';
import { TOOLS_CATEGORIES } from './types/tool'; // ✅ 使用常量数组

const myTool: ToolDefinition = {
  id: 'my-tool',
  name: 'My Tool',
  category: ToolCategories.CODE,  // ✅ 使用常量
  description: 'Description',
  schema: {
    inputSchema: { /* ... */ },
    outputSchema: { /* ... */ },
  },
  execute: async (params, context) => {
    // 执行逻辑
    return { success: true, output: '...' };
  },
};
```

### 配置类型系统

访问嵌套配置：

```typescript
const getNestedValue = (obj: any, path: string, defaultValue: any) => {
  return path.split('.').reduce((current, key) =>
    current && current[key] !== undefined ? current[key] : defaultValue, obj);
};

// 安全访问
const rateLimit = getNestedValue(config, 'mcpSettings.security.rateLimit', {
  requestsPerMinute: 60,
  tokensPerMinute: 10000,
});
```

## 🧪 类型测试

### 运行类型检查

```bash
# 完整类型检查（包括所有文件）
npx tsc --noEmit

# 增量类型检查
npx tsc --noEmit --incremental

# 查看类型错误详情
npx tsc --noEmit --pretty
```

### 类型覆盖率

TaskFlow AI 的类型覆盖率：

| 模块 | 类型覆盖率 | 状态 |
|------|-----------|------|
| src/types | 100% | ✅ |
| src/core | 100% | ✅ |
| src/cli | 100% | ✅ |
| src/agent | 100% | ✅ |
| src/tools | 100% | ✅ |
| src/workflow | 100% | ✅ |
| src/utils | 100% | ✅ |
| **总计** | **100%** | ✅ |

## 📖 参考资料

- [TypeScript官方文档](https://www.typescriptlang.org/docs/)
- [TypeScript 严格模式](https://www.typescriptlang.org/tsconfig#strict)
- [高级类型](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)
- [类型守卫](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)

## 🆘 类型错误排查

### 常见错误

#### 1. 无法使用 Object.values() 遍历字符串字面量类型

**错误**:
```typescript
type MyType = 'a' | 'b' | 'c';
Object.values(MyType).forEach(t => console.log(t)); // ❌ 错误
```

**解决方案**:
```typescript
export const MY_TYPE_VALUES = ['a', 'b', 'c'] as const;
MY_TYPE_VALUES.forEach(t => console.log(t)); // ✅ 正确
```

#### 2. undefined 属性访问

**错误**:
```typescript
config.mcpSettings.security.rateLimit; // ❌ 可能 undefined
```

**解决方案**:
```typescript
config.mcpSettings?.security?.rateLimit; // ✅ 使用可选链
```

#### 3. 无效的赋值语法

**错误**:
```typescript
(obj?.property ?? {}) = { ... }; // ❌ 无效
```

**解决方案**:
```typescript
const value = obj?.property ?? {} as any;
Object.assign(value, newValue); // ✅ 使用 Object.assign
```

---

## 📄 License

Apache License 2.0 © TaskFlow AI
