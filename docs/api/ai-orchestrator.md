# AI编排器 API

## 概述

AI编排器负责管理和协调多个AI模型，提供智能模型选择、负载均衡、故障转移等功能。本文档详细介绍AI编排器的API接口和使用方法。

## 🏗️ 架构设计

```typescript
interface AIOrchestrator {
  // 模型管理
  registerModel(model: AIModel): Promise<void>;
  unregisterModel(modelId: string): Promise<void>;
  getAvailableModels(): Promise<AIModel[]>;

  // 智能处理
  processText(text: string, options: ProcessingOptions): Promise<ProcessingResult>;
  selectOptimalModel(task: string, context: ProcessingContext): Promise<string>;

  // 负载均衡
  balanceLoad(models: string[]): Promise<string>;
  getModelLoad(modelId: string): Promise<ModelLoad>;

  // 健康检查
  healthCheck(modelId?: string): Promise<HealthStatus>;
  testConnection(modelId: string): Promise<ConnectionResult>;

  // 性能监控
  getPerformanceMetrics(modelId?: string): Promise<PerformanceMetrics>;
  getUsageStatistics(period?: TimePeriod): Promise<UsageStatistics>;
}
```

## 🤖 模型管理

### registerModel

注册AI模型。

```typescript
async registerModel(model: AIModel): Promise<void>
```

**示例**:

```typescript
import { AIOrchestrator, AIModel } from 'taskflow-ai';

const orchestrator = new AIOrchestrator();

// 注册DeepSeek模型
await orchestrator.registerModel({
  id: 'deepseek',
  name: 'DeepSeek Chat',
  provider: 'deepseek',
  endpoint: 'https://api.deepseek.com/v1/chat/completions',
  apiKey: process.env.DEEPSEEK_API_KEY,
  capabilities: ['text-generation', 'code-analysis', 'reasoning'],
  limits: {
    maxTokens: 4000,
    requestsPerMinute: 60,
    tokensPerMinute: 100000,
  },
  pricing: {
    inputTokens: 0.0014, // per 1K tokens
    outputTokens: 0.0028,
  },
});

// 注册智谱AI模型
await orchestrator.registerModel({
  id: 'zhipu',
  name: 'GLM-4',
  provider: 'zhipu',
  endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  apiKey: process.env.ZHIPU_API_KEY,
  capabilities: ['text-generation', 'chinese-understanding', 'reasoning'],
  limits: {
    maxTokens: 8000,
    requestsPerMinute: 100,
    tokensPerMinute: 150000,
  },
});
```

### getAvailableModels

获取可用模型列表。

```typescript
async getAvailableModels(): Promise<AIModel[]>
```

**示例**:

```typescript
const models = await orchestrator.getAvailableModels();

console.log('可用模型:');
models.forEach(model => {
  console.log(`- ${model.name} (${model.id})`);
  console.log(`  能力: ${model.capabilities.join(', ')}`);
  console.log(`  状态: ${model.status}`);
  console.log(`  负载: ${model.currentLoad}%`);
});
```

## 🧠 智能处理

### processText

处理文本内容。

```typescript
async processText(
  text: string,
  options: ProcessingOptions
): Promise<ProcessingResult>
```

**示例**:

```typescript
// 基本文本处理
const result = await orchestrator.processText('PRD文档内容...', {
  task: 'prd-analysis',
  preferredModel: 'deepseek',
  fallbackModels: ['zhipu', 'qwen'],
  maxTokens: 2000,
  temperature: 0.7,
});

// 多模型对比处理
const comparison = await orchestrator.processText('PRD文档内容...', {
  task: 'prd-analysis',
  multiModel: true,
  models: ['deepseek', 'zhipu', 'qwen'],
  compareResults: true,
});

console.log('处理结果:');
console.log(`- 使用模型: ${result.modelUsed}`);
console.log(`- 处理时间: ${result.processingTime}ms`);
console.log(`- 置信度: ${result.confidence}`);
console.log(`- 结果: ${result.content}`);
```

### selectOptimalModel

选择最优模型。

```typescript
async selectOptimalModel(
  task: string,
  context: ProcessingContext
): Promise<string>
```

**示例**:

```typescript
// 根据任务类型选择模型
const modelForCode = await orchestrator.selectOptimalModel('code-analysis', {
  language: 'typescript',
  complexity: 'medium',
  domain: 'web-development',
});

const modelForBusiness = await orchestrator.selectOptimalModel('business-analysis', {
  language: 'chinese',
  domain: 'e-commerce',
  documentType: 'requirements',
});

console.log(`代码分析推荐模型: ${modelForCode}`);
console.log(`业务分析推荐模型: ${modelForBusiness}`);
```

## ⚖️ 负载均衡

### balanceLoad

负载均衡选择模型。

```typescript
async balanceLoad(models: string[]): Promise<string>
```

**示例**:

```typescript
// 在多个模型间进行负载均衡
const availableModels = ['deepseek', 'zhipu', 'qwen'];
const selectedModel = await orchestrator.balanceLoad(availableModels);

console.log(`负载均衡选择的模型: ${selectedModel}`);

// 获取各模型当前负载
for (const modelId of availableModels) {
  const load = await orchestrator.getModelLoad(modelId);
  console.log(`${modelId} 负载: ${load.currentRequests}/${load.maxRequests}`);
}
```

### getModelLoad

获取模型负载信息。

```typescript
async getModelLoad(modelId: string): Promise<ModelLoad>
```

**示例**:

```typescript
const load = await orchestrator.getModelLoad('deepseek');

console.log(`DeepSeek 模型负载:`);
console.log(`- 当前请求数: ${load.currentRequests}`);
console.log(`- 最大请求数: ${load.maxRequests}`);
console.log(`- 负载百分比: ${load.loadPercentage}%`);
console.log(`- 平均响应时间: ${load.averageResponseTime}ms`);
console.log(`- 队列长度: ${load.queueLength}`);
```

## 🏥 健康检查

### healthCheck

检查模型健康状态。

```typescript
async healthCheck(modelId?: string): Promise<HealthStatus>
```

**示例**:

```typescript
// 检查所有模型健康状态
const overallHealth = await orchestrator.healthCheck();

console.log(`系统健康状态: ${overallHealth.status}`);
console.log(`可用模型数: ${overallHealth.availableModels}/${overallHealth.totalModels}`);

// 检查特定模型
const deepseekHealth = await orchestrator.healthCheck('deepseek');

if (deepseekHealth.status === 'healthy') {
  console.log('DeepSeek 模型运行正常');
} else {
  console.log(`DeepSeek 模型异常: ${deepseekHealth.issues.join(', ')}`);
}
```

### testConnection

测试模型连接。

```typescript
async testConnection(modelId: string): Promise<ConnectionResult>
```

**示例**:

```typescript
const connectionTest = await orchestrator.testConnection('zhipu');

console.log(`智谱AI 连接测试:`);
console.log(`- 连接状态: ${connectionTest.success ? '成功' : '失败'}`);
console.log(`- 响应时间: ${connectionTest.responseTime}ms`);
console.log(`- API状态: ${connectionTest.apiStatus}`);

if (!connectionTest.success) {
  console.log(`错误信息: ${connectionTest.error}`);
}
```

## 📊 性能监控

### getPerformanceMetrics

获取性能指标。

```typescript
async getPerformanceMetrics(modelId?: string): Promise<PerformanceMetrics>
```

**示例**:

```typescript
// 获取所有模型的性能指标
const overallMetrics = await orchestrator.getPerformanceMetrics();

console.log('整体性能指标:');
console.log(`- 平均响应时间: ${overallMetrics.averageResponseTime}ms`);
console.log(`- 成功率: ${overallMetrics.successRate}%`);
console.log(`- 吞吐量: ${overallMetrics.throughput} 请求/分钟`);

// 获取特定模型的性能指标
const deepseekMetrics = await orchestrator.getPerformanceMetrics('deepseek');

console.log('DeepSeek 性能指标:');
console.log(`- 响应时间: ${deepseekMetrics.averageResponseTime}ms`);
console.log(`- 成功率: ${deepseekMetrics.successRate}%`);
console.log(`- 错误率: ${deepseekMetrics.errorRate}%`);
console.log(`- 缓存命中率: ${deepseekMetrics.cacheHitRate}%`);
```

### getUsageStatistics

获取使用统计。

```typescript
async getUsageStatistics(period?: TimePeriod): Promise<UsageStatistics>
```

**示例**:

```typescript
// 获取本月使用统计
const monthlyStats = await orchestrator.getUsageStatistics({
  start: new Date('2024-01-01'),
  end: new Date('2024-01-31'),
});

console.log('本月使用统计:');
console.log(`- 总请求数: ${monthlyStats.totalRequests}`);
console.log(`- 总Token数: ${monthlyStats.totalTokens}`);
console.log(`- 总费用: $${monthlyStats.totalCost}`);

console.log('按模型分布:');
monthlyStats.byModel.forEach(stat => {
  console.log(`- ${stat.modelId}: ${stat.requests} 请求, $${stat.cost}`);
});

console.log('按任务类型分布:');
monthlyStats.byTask.forEach(stat => {
  console.log(`- ${stat.taskType}: ${stat.requests} 请求`);
});
```

## 🔧 类型定义

### AIModel

AI模型定义。

```typescript
interface AIModel {
  // 基本信息
  id: string;
  name: string;
  provider: string;
  version?: string;

  // 连接信息
  endpoint: string;
  apiKey: string;
  headers?: Record<string, string>;

  // 能力描述
  capabilities: ModelCapability[];
  supportedTasks: string[];

  // 限制和配额
  limits: {
    maxTokens: number;
    requestsPerMinute: number;
    tokensPerMinute: number;
    maxConcurrentRequests?: number;
  };

  // 定价信息
  pricing?: {
    inputTokens: number; // per 1K tokens
    outputTokens: number; // per 1K tokens
    fixedCost?: number; // per request
  };

  // 状态信息
  status: ModelStatus;
  currentLoad: number;
  lastHealthCheck: Date;

  // 配置参数
  defaultParams: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
  };
}
```

### ProcessingOptions

处理选项。

```typescript
interface ProcessingOptions {
  // 任务类型
  task: string;

  // 模型选择
  preferredModel?: string;
  fallbackModels?: string[];
  multiModel?: boolean;
  models?: string[];

  // 处理参数
  maxTokens?: number;
  temperature?: number;
  topP?: number;

  // 质量控制
  compareResults?: boolean;
  minConfidence?: number;
  maxRetries?: number;

  // 缓存控制
  useCache?: boolean;
  cacheKey?: string;
  cacheTTL?: number;

  // 回调函数
  onProgress?: (progress: ProcessingProgress) => void;
  onModelSelected?: (modelId: string) => void;
  onError?: (error: ProcessingError) => void;
}
```

### ProcessingResult

处理结果。

```typescript
interface ProcessingResult {
  // 基本结果
  success: boolean;
  content: string;

  // 模型信息
  modelUsed: string;
  modelsAttempted: string[];

  // 性能指标
  processingTime: number;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };

  // 质量指标
  confidence: number;
  quality: QualityMetrics;

  // 成本信息
  cost: {
    amount: number;
    currency: string;
    breakdown: CostBreakdown;
  };

  // 元数据
  metadata: {
    timestamp: Date;
    requestId: string;
    version: string;
  };

  // 错误信息
  errors?: ProcessingError[];
  warnings?: ProcessingWarning[];
}
```

## 🎯 使用示例

### 基本使用

```typescript
import { AIOrchestrator } from 'taskflow-ai';

async function basicUsage() {
  const orchestrator = new AIOrchestrator();

  // 处理PRD文档
  const result = await orchestrator.processText('PRD文档内容...', {
    task: 'prd-analysis',
    preferredModel: 'deepseek',
    maxTokens: 2000,
  });

  if (result.success) {
    console.log('解析结果:', result.content);
    console.log('使用模型:', result.modelUsed);
    console.log('处理时间:', result.processingTime, 'ms');
    console.log('费用:', result.cost.amount, result.cost.currency);
  } else {
    console.error('处理失败:', result.errors);
  }
}
```

### 多模型协同

```typescript
async function multiModelProcessing() {
  const orchestrator = new AIOrchestrator();

  // 多模型协同处理
  const result = await orchestrator.processText('复杂的PRD文档内容...', {
    task: 'complex-analysis',
    multiModel: true,
    models: ['deepseek', 'zhipu', 'qwen'],
    compareResults: true,
    minConfidence: 0.8,
  });

  console.log('多模型处理结果:');
  console.log(`- 主要结果: ${result.content}`);
  console.log(`- 置信度: ${result.confidence}`);
  console.log(`- 尝试的模型: ${result.modelsAttempted.join(', ')}`);
  console.log(`- 最终选择: ${result.modelUsed}`);

  // 如果有对比结果
  if (result.metadata.comparisons) {
    console.log('模型对比结果:');
    result.metadata.comparisons.forEach(comp => {
      console.log(`- ${comp.modelId}: 置信度 ${comp.confidence}`);
    });
  }
}
```

### 智能模型选择

```typescript
async function intelligentModelSelection() {
  const orchestrator = new AIOrchestrator();

  // 配置智能选择策略
  await orchestrator.configureSelection({
    strategy: 'performance-cost-balanced',
    factors: {
      performance: 0.4,
      cost: 0.3,
      availability: 0.3,
    },
    learningEnabled: true,
  });

  // 处理不同类型的任务
  const tasks = [
    { content: '技术规格文档...', type: 'technical-analysis' },
    { content: '业务需求文档...', type: 'business-analysis' },
    { content: '代码审查内容...', type: 'code-review' },
  ];

  for (const task of tasks) {
    const optimalModel = await orchestrator.selectOptimalModel(task.type, {
      content: task.content,
    });

    console.log(`${task.type} 推荐模型: ${optimalModel}`);

    const result = await orchestrator.processText(task.content, {
      task: task.type,
      preferredModel: optimalModel,
    });

    // 记录结果用于学习
    await orchestrator.recordResult(task.type, optimalModel, result);
  }
}
```

### 性能监控和优化

```typescript
async function performanceMonitoring() {
  const orchestrator = new AIOrchestrator();

  // 启用实时监控
  orchestrator.enableMonitoring({
    interval: 60000, // 1分钟
    metrics: ['response-time', 'success-rate', 'cost', 'load'],
    alerts: {
      responseTimeThreshold: 5000,
      errorRateThreshold: 0.05,
      costThreshold: 100,
    },
  });

  // 监听性能事件
  orchestrator.on('performanceAlert', alert => {
    console.log(`性能告警: ${alert.type} - ${alert.message}`);

    if (alert.type === 'high-response-time') {
      // 自动切换到更快的模型
      orchestrator.temporaryModelSwitch(alert.modelId, 'faster-model');
    }
  });

  // 定期生成性能报告
  setInterval(async () => {
    const metrics = await orchestrator.getPerformanceMetrics();
    console.log('性能报告:', metrics);

    // 自动优化建议
    const suggestions = await orchestrator.getOptimizationSuggestions();
    if (suggestions.length > 0) {
      console.log('优化建议:', suggestions);
    }
  }, 3600000); // 每小时
}
```

## 🔄 事件和钩子

### 模型事件

```typescript
orchestrator.on('modelRegistered', (model: AIModel) => {
  console.log(`模型注册: ${model.name}`);
});

orchestrator.on('modelHealthChanged', (modelId: string, status: ModelStatus) => {
  console.log(`模型 ${modelId} 健康状态变更: ${status}`);
});

orchestrator.on('loadBalanced', (selectedModel: string, availableModels: string[]) => {
  console.log(`负载均衡选择: ${selectedModel} (可选: ${availableModels.join(', ')})`);
});
```

### 处理事件

```typescript
orchestrator.on('processingStart', (requestId: string, options: ProcessingOptions) => {
  console.log(`开始处理请求: ${requestId}`);
});

orchestrator.on('processingComplete', (result: ProcessingResult) => {
  console.log(`处理完成: ${result.modelUsed}, 耗时: ${result.processingTime}ms`);
});

orchestrator.on('processingError', (error: ProcessingError) => {
  console.error(`处理错误: ${error.message}`);
});
```

## 📚 相关文档

- [PRD解析器 API](./prd-parser.md) - PRD文档解析
- [任务管理器 API](./task-manager.md) - 任务管理
- [配置管理 API](./config-manager.md) - 配置管理
- [类型定义](./types/model.md) - 模型相关类型
