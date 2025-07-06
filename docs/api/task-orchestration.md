# 任务编排引擎 API

## 概述

TaskFlow AI 的任务编排引擎提供了智能的任务排序、关键路径分析和并行优化功能。基于先进的项目管理算法，能够显著提升项目执行效率。

## 核心类

### `TaskOrchestrationEngine`

智能任务编排引擎的主要实现类。

#### 构造函数

```typescript
constructor(config?: TaskOrchestrationConfig)
```

**参数:**
- `config` - 编排配置选项（可选）

**示例:**
```typescript
import { TaskOrchestrationEngine } from 'taskflow-ai';

const engine = new TaskOrchestrationEngine({
  enableCriticalPath: true,
  enableParallelOptimization: true,
  schedulingStrategy: SchedulingStrategy.CRITICAL_PATH,
  optimizationGoal: OptimizationGoal.MINIMIZE_DURATION
});
```

#### 主要方法

##### `orchestrate(tasks: Task[]): Promise<TaskOrchestrationResult>`

执行任务编排，返回优化后的任务安排。

**参数:**
- `tasks` - 待编排的任务列表

**返回值:**
- `Promise<TaskOrchestrationResult>` - 编排结果

**示例:**
```typescript
const tasks = await taskManager.getAllTasks();
const result = await engine.orchestrate(tasks);

console.log(`项目预计持续时间: ${result.totalDuration} 小时`);
console.log(`关键路径任务: ${result.criticalPath.length} 个`);
console.log(`并行任务组: ${result.parallelGroups.length} 个`);
```

##### `updateTaskTimeInfo(tasks: Task[]): Task[]`

更新任务的时间信息，包括最早/最晚开始时间、浮动时间等。

**参数:**
- `tasks` - 任务列表

**返回值:**
- `Task[]` - 更新后的任务列表

##### `getOrchestrationStats(): OrchestrationStats`

获取编排统计信息。

**返回值:**
- `OrchestrationStats` - 统计信息对象

## 工厂类

### `OrchestrationFactory`

提供预设编排策略的工厂类。

#### 静态方法

##### `createEngine(preset?: OrchestrationPreset, customConfig?: Partial<TaskOrchestrationConfig>): TaskOrchestrationEngine`

创建编排引擎实例。

**参数:**
- `preset` - 预设策略（可选）
- `customConfig` - 自定义配置（可选）

**示例:**
```typescript
import { OrchestrationFactory, OrchestrationPreset } from 'taskflow-ai';

// 使用敏捷冲刺预设
const agileEngine = OrchestrationFactory.createEngine(
  OrchestrationPreset.AGILE_SPRINT
);

// 使用自定义配置
const customEngine = OrchestrationFactory.createEngine(
  OrchestrationPreset.ENTERPRISE,
  {
    maxParallelTasks: 15,
    bufferPercentage: 0.2
  }
);
```

##### `getAvailablePresets(): PresetInfo[]`

获取所有可用的预设策略。

**返回值:**
- `PresetInfo[]` - 预设信息列表

##### `recommendPreset(characteristics: ProjectCharacteristics): OrchestrationPreset`

根据项目特征推荐合适的预设策略。

**参数:**
- `characteristics` - 项目特征

**示例:**
```typescript
const recommended = OrchestrationFactory.recommendPreset({
  teamSize: 8,
  projectDuration: 60,
  uncertaintyLevel: 6,
  isAgile: true
});

console.log(`推荐策略: ${recommended}`);
```

## 类型定义

### `TaskOrchestrationConfig`

编排配置接口。

```typescript
interface TaskOrchestrationConfig {
  enableCriticalPath?: boolean;           // 启用关键路径分析
  enableParallelOptimization?: boolean;   // 启用并行优化
  enableResourceLeveling?: boolean;       // 启用资源平衡
  enableRiskAnalysis?: boolean;           // 启用风险分析
  schedulingStrategy?: SchedulingStrategy; // 调度策略
  optimizationGoal?: OptimizationGoal;    // 优化目标
  maxParallelTasks?: number;              // 最大并行任务数
  workingHoursPerDay?: number;            // 每日工作小时数
  workingDaysPerWeek?: number;            // 每周工作天数
  bufferPercentage?: number;              // 缓冲时间百分比
}
```

### `TaskOrchestrationResult`

编排结果接口。

```typescript
interface TaskOrchestrationResult {
  tasks: Task[];                          // 编排后的任务列表
  criticalPath: string[];                 // 关键路径任务ID列表
  totalDuration: number;                  // 项目总持续时间
  parallelGroups: string[][];             // 可并行执行的任务组
  resourceUtilization: ResourceUtilization[]; // 资源利用率
  riskAssessment: RiskAssessment;         // 风险评估
  recommendations: string[];              // 优化建议
  metadata: OrchestrationMetadata;        // 编排元数据
}
```

### `SchedulingStrategy`

调度策略枚举。

```typescript
enum SchedulingStrategy {
  CRITICAL_PATH = 'critical_path',        // 关键路径优先
  PRIORITY_FIRST = 'priority_first',      // 优先级优先
  SHORTEST_FIRST = 'shortest_first',      // 最短任务优先
  LONGEST_FIRST = 'longest_first',        // 最长任务优先
  RESOURCE_LEVELING = 'resource_leveling', // 资源平衡
  EARLY_START = 'early_start',            // 最早开始
  LATE_START = 'late_start'               // 最晚开始
}
```

### `OptimizationGoal`

优化目标枚举。

```typescript
enum OptimizationGoal {
  MINIMIZE_DURATION = 'minimize_duration', // 最小化项目持续时间
  MINIMIZE_COST = 'minimize_cost',         // 最小化项目成本
  MAXIMIZE_QUALITY = 'maximize_quality',   // 最大化项目质量
  BALANCE_RESOURCES = 'balance_resources', // 平衡资源使用
  MINIMIZE_RISK = 'minimize_risk'          // 最小化项目风险
}
```

### `OrchestrationPreset`

预设策略枚举。

```typescript
enum OrchestrationPreset {
  AGILE_SPRINT = 'agile_sprint',           // 敏捷冲刺
  WATERFALL = 'waterfall',                 // 瀑布模型
  CRITICAL_CHAIN = 'critical_chain',       // 关键链
  LEAN_STARTUP = 'lean_startup',           // 精益创业
  RAPID_PROTOTYPE = 'rapid_prototype',     // 快速原型
  ENTERPRISE = 'enterprise',               // 企业级
  RESEARCH = 'research',                   // 研究项目
  MAINTENANCE = 'maintenance'              // 维护项目
}
```

## 使用示例

### 基本编排

```typescript
import { TaskOrchestrationEngine, TaskManager } from 'taskflow-ai';

async function basicOrchestration() {
  // 加载任务
  const taskManager = new TaskManager();
  await taskManager.loadTasks();
  const tasks = taskManager.getAllTasks();
  
  // 创建编排引擎
  const engine = new TaskOrchestrationEngine({
    enableCriticalPath: true,
    enableParallelOptimization: true
  });
  
  // 执行编排
  const result = await engine.orchestrate(tasks);
  
  // 显示结果
  console.log('编排完成!');
  console.log(`总持续时间: ${result.totalDuration} 小时`);
  console.log(`关键任务: ${result.criticalPath.length} 个`);
  
  // 保存更新后的任务
  const updatedTasks = engine.updateTaskTimeInfo(result.tasks);
  for (const task of updatedTasks) {
    await taskManager.updateTask(task.id, task);
  }
}
```

### 使用预设策略

```typescript
import { OrchestrationFactory, OrchestrationPreset } from 'taskflow-ai';

async function usePresetStrategy() {
  // 创建敏捷冲刺引擎
  const agileEngine = OrchestrationFactory.createEngine(
    OrchestrationPreset.AGILE_SPRINT
  );
  
  // 执行编排
  const result = await agileEngine.orchestrate(tasks);
  
  // 显示敏捷相关的建议
  console.log('敏捷冲刺编排建议:');
  result.recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec}`);
  });
}
```

### 风险分析

```typescript
async function riskAnalysis() {
  const engine = new TaskOrchestrationEngine({
    enableRiskAnalysis: true,
    enableCriticalPath: true
  });
  
  const result = await engine.orchestrate(tasks);
  
  // 显示风险评估
  console.log(`整体风险等级: ${result.riskAssessment.overallRiskLevel}/10`);
  
  result.riskAssessment.riskFactors.forEach(risk => {
    console.log(`风险: ${risk.name} (${risk.category})`);
    console.log(`  概率: ${risk.probability * 100}%`);
    console.log(`  影响: ${risk.impact}/10`);
    console.log(`  评分: ${risk.riskScore}`);
  });
  
  // 显示缓解建议
  console.log('\n缓解建议:');
  result.riskAssessment.mitigationSuggestions.forEach((suggestion, index) => {
    console.log(`${index + 1}. ${suggestion}`);
  });
}
```

### 资源优化

```typescript
async function resourceOptimization() {
  const engine = new TaskOrchestrationEngine({
    enableResourceLeveling: true,
    optimizationGoal: OptimizationGoal.BALANCE_RESOURCES
  });
  
  const result = await engine.orchestrate(tasks);
  
  // 显示资源利用率
  console.log('资源利用率:');
  result.resourceUtilization.forEach(resource => {
    console.log(`${resource.resourceName}: ${(resource.utilizationRate * 100).toFixed(1)}%`);
    
    if (resource.overallocation > 0) {
      console.log(`  ⚠️ 超分配: ${resource.overallocation} 单位`);
    }
  });
}
```

## 最佳实践

### 1. 选择合适的策略

根据项目特征选择合适的编排策略：

- **敏捷项目**: 使用 `AGILE_SPRINT` 预设
- **传统项目**: 使用 `WATERFALL` 预设
- **大型企业项目**: 使用 `ENTERPRISE` 预设
- **研究项目**: 使用 `RESEARCH` 预设

### 2. 配置缓冲时间

为项目设置合理的缓冲时间：

```typescript
const config = {
  bufferPercentage: 0.15, // 15% 缓冲时间
  enableRiskAnalysis: true
};
```

### 3. 监控关键路径

重点关注关键路径上的任务：

```typescript
const criticalTasks = result.tasks.filter(task => 
  result.criticalPath.includes(task.id)
);

console.log('关键任务需要特别关注:');
criticalTasks.forEach(task => {
  console.log(`- ${task.name} (${task.estimatedHours}h)`);
});
```

### 4. 利用并行机会

识别并利用并行执行机会：

```typescript
console.log('可并行执行的任务组:');
result.parallelGroups.forEach((group, index) => {
  console.log(`组 ${index + 1}: ${group.join(', ')}`);
});
```

## 错误处理

```typescript
try {
  const result = await engine.orchestrate(tasks);
  // 处理成功结果
} catch (error) {
  if (error.message.includes('循环依赖')) {
    console.error('检测到任务间的循环依赖，请检查任务依赖关系');
  } else {
    console.error('编排失败:', error.message);
  }
}
```

## 性能考虑

- 对于大型项目（>100个任务），建议启用资源平衡以优化性能
- 复杂的依赖关系可能增加计算时间，考虑简化依赖结构
- 风险分析会增加计算开销，可根据需要选择性启用
