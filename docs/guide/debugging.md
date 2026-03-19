# 调试工具

TaskFlow AI 提供强大的调试工具，帮助开发者追踪和分析 AI 执行过程。

## 思维链时间线

可视化展示 AI 推理过程的每个步骤。

```typescript
import { ThoughtChainTimeline, CostTracker, ErrorHandler } from '@taskflow-ai/core/debug';

const timeline = new ThoughtChainTimeline();
timeline.fromChain(chain);

// 输出文本格式
console.log(timeline.toText());

// 输出 JSON 格式
console.log(timeline.toJSON());

// 简洁进度条
console.log(timeline.toProgressBar());

// 获取统计信息
const stats = timeline.getStats();
console.log(stats.totalSteps, stats.avgConfidence);
```

## 成本跟踪

实时监控 AI 调用的成本。

```typescript
const costTracker = new CostTracker({
  budgetThreshold: 10,  // 预算警告阈值
  requestThreshold: 1, // 单次请求警告阈值
});

// 记录 API 调用
costTracker.record('gpt-4o', 1000, 500, 1500);

// 渲染成本面板
console.log(costTracker.renderPanel());

// 导出 CSV
console.log(costTracker.toCSV());
```

## 错误处理

自动错误分类和重试机制。

```typescript
const handler = new ErrorHandler();

// 记录错误
const error = handler.record(new Error('Network failed'), 'network');

// 带重试的操作
const { result, error } = await handler.retryWithRecovery(
  async () => {
    // your operation
  },
  {
    maxRetries: 3,
    initialDelay: 1000,
    backoffFactor: 2,
  }
);

// 生成错误报告
console.log(handler.generateErrorReport(error));
```

## 选项

### TimelineViewOptions

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| showReasoning | boolean | true | 显示详细推理 |
| showTimestamp | boolean | true | 显示时间戳 |
| showModel | boolean | true | 显示模型信息 |
| maxDepth | number | 10 | 最大显示深度 |
| timeFormat | string | 'relative' | 时间格式 |

### CostTrackerOptions

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| budgetThreshold | number | 10 | 预算警告阈值 (美元) |
| requestThreshold | number | 1 | 单次请求警告阈值 |
| autoPrint | boolean | false | 自动打印成本面板 |
| decimalPlaces | number | 4 | 保留小数位数 |
