# PRD解析器 API

## 概述

PRD解析器是TaskFlow AI的核心组件，负责智能解析产品需求文档(PRD)，提取结构化信息，并生成开发任务。本文档详细介绍PRD解析器的API接口和使用方法。

## 🏗️ 架构设计

```typescript
interface PRDParser {
  parseFromFile(filePath: string, options?: ParseOptions): Promise<ParseResult>;
  parseFromText(content: string, options?: ParseOptions): Promise<ParseResult>;
  validatePRD(prd: ParsedPRD): ValidationResult;
  extractSections(content: string): Promise<DocumentSection[]>;
  generateTasks(prd: ParsedPRD, options?: TaskGenerationOptions): Promise<Task[]>;
}
```

## 📄 核心接口

### parseFromFile

从文件解析PRD文档。

```typescript
async parseFromFile(
  filePath: string,
  options?: ParseOptions
): Promise<ParseResult>
```

**参数**:

- `filePath` (string): PRD文档文件路径
- `options` (ParseOptions, 可选): 解析选项

**返回值**: `Promise<ParseResult>` - 解析结果

**示例**:

```typescript
import { PRDParser } from 'taskflow-ai';

const parser = new PRDParser();

// 基本解析
const result = await parser.parseFromFile('docs/requirements.md');

// 带选项的解析
const result = await parser.parseFromFile('docs/requirements.md', {
  model: 'deepseek',
  extractSections: true,
  generateTasks: true,
  prioritize: true,
});
```

### parseFromText

从文本内容解析PRD。

```typescript
async parseFromText(
  content: string,
  options?: ParseOptions
): Promise<ParseResult>
```

**参数**:

- `content` (string): PRD文档文本内容
- `options` (ParseOptions, 可选): 解析选项

**示例**:

```typescript
const content = `
# 用户管理系统

## 功能需求
### 用户登录
- 用户可以通过邮箱和密码登录
- 支持记住登录状态
`;

const result = await parser.parseFromText(content, {
  model: 'zhipu',
  extractFeatures: true,
});
```

### validatePRD

验证PRD文档的完整性和质量。

```typescript
validatePRD(prd: ParsedPRD): ValidationResult
```

**参数**:

- `prd` (ParsedPRD): 已解析的PRD对象

**返回值**: `ValidationResult` - 验证结果

**示例**:

```typescript
const validation = parser.validatePRD(parsedPRD);

if (!validation.isValid) {
  console.log('验证失败:', validation.errors);
  console.log('建议:', validation.suggestions);
}
```

### extractSections

提取文档章节结构。

```typescript
async extractSections(content: string): Promise<DocumentSection[]>
```

**示例**:

```typescript
const sections = await parser.extractSections(content);
sections.forEach(section => {
  console.log(`${section.level}: ${section.title}`);
  console.log(`内容: ${section.content.substring(0, 100)}...`);
});
```

### generateTasks

基于解析的PRD生成开发任务。

```typescript
async generateTasks(
  prd: ParsedPRD,
  options?: TaskGenerationOptions
): Promise<Task[]>
```

**示例**:

```typescript
const tasks = await parser.generateTasks(parsedPRD, {
  includeEstimation: true,
  analyzeDependencies: true,
  prioritize: true,
});
```

## 🔧 类型定义

### ParseOptions

解析选项配置。

```typescript
interface ParseOptions {
  // AI模型选择
  model?: 'deepseek' | 'zhipu' | 'qwen' | 'baidu' | 'auto';

  // 多模型协同
  multiModel?: boolean;

  // 解析功能开关
  extractSections?: boolean;
  extractFeatures?: boolean;
  generateTasks?: boolean;
  analyzeDependencies?: boolean;
  prioritize?: boolean;

  // 输出控制
  includeMetadata?: boolean;
  includeStatistics?: boolean;

  // 缓存控制
  useCache?: boolean;
  cacheKey?: string;

  // 自定义规则
  customRules?: ParseRule[];

  // 回调函数
  onProgress?: (progress: ParseProgress) => void;
  onSection?: (section: DocumentSection) => void;
}
```

### ParseResult

解析结果对象。

```typescript
interface ParseResult {
  // 基本信息
  success: boolean;
  timestamp: Date;
  duration: number;

  // 解析内容
  prd: ParsedPRD;
  tasks: Task[];
  sections: DocumentSection[];

  // 元数据
  metadata: ParseMetadata;
  statistics: ParseStatistics;

  // 错误信息
  errors?: ParseError[];
  warnings?: ParseWarning[];
}
```

### ParsedPRD

解析后的PRD对象。

```typescript
interface ParsedPRD {
  // 基本信息
  title: string;
  description: string;
  version?: string;

  // 项目信息
  project: {
    name: string;
    type: ProjectType;
    scope: string;
    objectives: string[];
  };

  // 功能需求
  requirements: Requirement[];

  // 非功能性需求
  nonFunctionalRequirements: NonFunctionalRequirement[];

  // 技术约束
  technicalConstraints: TechnicalConstraint[];

  // 验收标准
  acceptanceCriteria: AcceptanceCriterion[];

  // 优先级信息
  priorities: Priority[];

  // 依赖关系
  dependencies: Dependency[];
}
```

### Requirement

功能需求定义。

```typescript
interface Requirement {
  id: string;
  name: string;
  description: string;
  type: 'functional' | 'non-functional';
  priority: 'high' | 'medium' | 'low';

  // 用户故事
  userStory?: {
    as: string; // 作为...
    want: string; // 我希望...
    so: string; // 以便...
  };

  // 验收标准
  acceptanceCriteria: string[];

  // 依赖关系
  dependencies: string[];

  // 估算信息
  estimation?: {
    complexity: 'simple' | 'medium' | 'complex';
    hours: number;
    confidence: number;
  };

  // 标签和分类
  tags: string[];
  category: string;
}
```

### Task

生成的开发任务。

```typescript
interface Task {
  id: string;
  name: string;
  description: string;

  // 状态信息
  status: TaskStatus;
  priority: TaskPriority;

  // 分配信息
  assignee?: string;
  team?: string;

  // 时间信息
  estimatedHours: number;
  actualHours?: number;
  startDate?: Date;
  endDate?: Date;

  // 依赖关系
  dependencies: string[];
  blockers: string[];

  // 关联需求
  requirementIds: string[];

  // 验收标准
  acceptanceCriteria: string[];

  // 元数据
  metadata: {
    source: 'prd-parser';
    confidence: number;
    generatedAt: Date;
    model: string;
  };
}
```

## 🎯 使用示例

### 基本使用

```typescript
import { PRDParser, ParseOptions } from 'taskflow-ai';

async function basicUsage() {
  const parser = new PRDParser();

  // 解析PRD文件
  const result = await parser.parseFromFile('docs/requirements.md');

  if (result.success) {
    console.log(`解析成功，生成 ${result.tasks.length} 个任务`);

    // 显示任务列表
    result.tasks.forEach(task => {
      console.log(`- ${task.name} (${task.priority}, ${task.estimatedHours}h)`);
    });
  } else {
    console.error('解析失败:', result.errors);
  }
}
```

### 高级配置

```typescript
async function advancedUsage() {
  const parser = new PRDParser();

  const options: ParseOptions = {
    model: 'deepseek',
    multiModel: true,
    extractSections: true,
    extractFeatures: true,
    generateTasks: true,
    analyzeDependencies: true,
    prioritize: true,

    // 进度回调
    onProgress: progress => {
      console.log(`解析进度: ${progress.percentage}%`);
    },

    // 章节回调
    onSection: section => {
      console.log(`处理章节: ${section.title}`);
    },
  };

  const result = await parser.parseFromFile('docs/complex-requirements.md', options);

  // 验证PRD质量
  const validation = parser.validatePRD(result.prd);
  if (!validation.isValid) {
    console.warn('PRD质量问题:', validation.suggestions);
  }

  return result;
}
```

### 批量处理

```typescript
async function batchProcessing() {
  const parser = new PRDParser();
  const files = ['feature-a.md', 'feature-b.md', 'feature-c.md'];

  const results = await Promise.all(files.map(file => parser.parseFromFile(`docs/${file}`)));

  // 合并所有任务
  const allTasks = results.flatMap(result => result.tasks);

  // 分析任务依赖关系
  const dependencies = analyzeCrossDependencies(allTasks);

  return {
    tasks: allTasks,
    dependencies,
    statistics: generateStatistics(results),
  };
}
```

### 自定义解析规则

```typescript
async function customRules() {
  const parser = new PRDParser();

  const customRules: ParseRule[] = [
    {
      name: 'extract-api-endpoints',
      pattern: /API\s+(\w+)\s*:\s*(.+)/g,
      handler: match => ({
        type: 'api-endpoint',
        method: match[1],
        description: match[2],
      }),
    },
    {
      name: 'extract-user-roles',
      pattern: /作为\s*(\w+)/g,
      handler: match => ({
        type: 'user-role',
        role: match[1],
      }),
    },
  ];

  const result = await parser.parseFromFile('docs/api-requirements.md', {
    customRules,
    extractFeatures: true,
  });

  return result;
}
```

## 🔄 事件和钩子

### 解析事件

```typescript
parser.on('parseStart', (filePath: string) => {
  console.log(`开始解析: ${filePath}`);
});

parser.on('parseProgress', (progress: ParseProgress) => {
  console.log(`解析进度: ${progress.percentage}%`);
});

parser.on('parseComplete', (result: ParseResult) => {
  console.log(`解析完成: ${result.tasks.length} 个任务`);
});

parser.on('parseError', (error: ParseError) => {
  console.error(`解析错误: ${error.message}`);
});
```

### 自定义钩子

```typescript
// 任务生成前钩子
parser.addHook('beforeTaskGeneration', async (prd: ParsedPRD) => {
  // 自定义处理逻辑
  return enhancePRD(prd);
});

// 任务生成后钩子
parser.addHook('afterTaskGeneration', async (tasks: Task[]) => {
  // 自定义任务处理
  return optimizeTasks(tasks);
});
```

## 🔧 配置和优化

### 性能优化

```typescript
// 启用缓存
const parser = new PRDParser({
  cache: {
    enabled: true,
    ttl: 3600000, // 1小时
    maxSize: 100,
  },
});

// 并发控制
const parser = new PRDParser({
  concurrency: {
    maxConcurrent: 3,
    timeout: 30000,
  },
});
```

### 模型配置

```typescript
const parser = new PRDParser({
  models: {
    primary: 'deepseek',
    fallback: ['zhipu', 'qwen'],
    loadBalancing: true,
    retryAttempts: 3,
  },
});
```

## 🐛 错误处理

### 错误类型

```typescript
enum ParseErrorType {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  INVALID_FORMAT = 'INVALID_FORMAT',
  MODEL_ERROR = 'MODEL_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

interface ParseError {
  type: ParseErrorType;
  message: string;
  details?: any;
  stack?: string;
}
```

### 错误处理示例

```typescript
try {
  const result = await parser.parseFromFile('docs/requirements.md');
} catch (error) {
  if (error instanceof ParseError) {
    switch (error.type) {
      case ParseErrorType.FILE_NOT_FOUND:
        console.error('文件不存在:', error.message);
        break;
      case ParseErrorType.MODEL_ERROR:
        console.error('AI模型错误:', error.message);
        break;
      default:
        console.error('解析错误:', error.message);
    }
  }
}
```

## 📊 统计和分析

### 解析统计

```typescript
interface ParseStatistics {
  // 文档统计
  documentSize: number;
  sectionCount: number;
  requirementCount: number;

  // 任务统计
  taskCount: number;
  estimatedHours: number;
  complexityDistribution: Record<string, number>;

  // 质量指标
  completenessScore: number;
  clarityScore: number;
  consistencyScore: number;

  // 性能指标
  parseTime: number;
  modelResponseTime: number;
  cacheHitRate: number;
}
```

## 📚 相关文档

- [任务管理器 API](./task-manager.md) - 任务管理接口
- [AI编排器 API](./ai-orchestrator.md) - AI模型管理
- [配置管理 API](./config-manager.md) - 配置管理接口
- [类型定义](./types/core.md) - 核心类型定义
