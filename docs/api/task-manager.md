# 任务管理器 API

## 概述

任务管理器是TaskFlow AI的核心组件，负责任务的完整生命周期管理，包括创建、更新、查询、删除以及状态跟踪。本文档详细介绍任务管理器的API接口和使用方法。

## 🏗️ 架构设计

```typescript
interface TaskManager {
  // 基本CRUD操作
  createTask(taskData: Partial<Task>): Promise<Task>
  updateTask(id: string, updates: Partial<Task>): Promise<Task>
  getTask(id: string): Promise<Task | null>
  getTasks(filter?: TaskFilter): Promise<Task[]>
  deleteTask(id: string): Promise<boolean>
  
  // 状态管理
  updateStatus(id: string, status: TaskStatus, comment?: string): Promise<Task>
  getTasksByStatus(status: TaskStatus): Promise<Task[]>
  
  // 依赖关系管理
  addDependency(taskId: string, dependsOn: string): Promise<void>
  removeDependency(taskId: string, dependsOn: string): Promise<void>
  getDependencies(taskId: string): Promise<Task[]>
  getDependents(taskId: string): Promise<Task[]>
  
  // 批量操作
  batchUpdate(updates: BatchTaskUpdate[]): Promise<Task[]>
  batchCreate(tasks: Partial<Task>[]): Promise<Task[]>
  
  // 查询和分析
  searchTasks(query: string): Promise<Task[]>
  getTaskStatistics(): Promise<TaskStatistics>
  analyzeProgress(): Promise<ProgressAnalysis>
}
```

## 📋 核心接口

### createTask

创建新任务。

```typescript
async createTask(taskData: Partial<Task>): Promise<Task>
```

**参数**:
- `taskData` (Partial&lt;Task&gt;): 任务数据

**返回值**: `Promise&lt;Task&gt;` - 创建的任务对象

**示例**:
```typescript
import { TaskManager, TaskPriority, TaskStatus } from 'taskflow-ai'

const taskManager = new TaskManager()

// 创建基本任务
const task = await taskManager.createTask({
  name: '实现用户登录功能',
  description: '创建用户登录组件，包含表单验证和错误处理',
  priority: TaskPriority.HIGH,
  estimatedHours: 8,
  assignee: '张三'
})

// 创建带依赖的任务
const dependentTask = await taskManager.createTask({
  name: '实现用户仪表板',
  description: '用户登录后的主页面',
  priority: TaskPriority.MEDIUM,
  estimatedHours: 12,
  dependencies: [task.id]
})
```

### updateTask

更新现有任务。

```typescript
async updateTask(id: string, updates: Partial<Task>): Promise<Task>
```

**示例**:
```typescript
// 更新任务信息
const updatedTask = await taskManager.updateTask('task-001', {
  status: TaskStatus.IN_PROGRESS,
  actualHours: 4,
  assignee: '李四'
})

// 添加备注
const taskWithComment = await taskManager.updateTask('task-001', {
  comments: [
    ...task.comments,
    {
      text: '已完成UI设计，开始编码实现',
      author: '张三',
      timestamp: new Date()
    }
  ]
})
```

### getTasks

查询任务列表。

```typescript
async getTasks(filter?: TaskFilter): Promise<Task[]>
```

**示例**:
```typescript
// 获取所有任务
const allTasks = await taskManager.getTasks()

// 按状态过滤
const inProgressTasks = await taskManager.getTasks({
  status: TaskStatus.IN_PROGRESS
})

// 按优先级和分配人过滤
const highPriorityTasks = await taskManager.getTasks({
  priority: TaskPriority.HIGH,
  assignee: '张三'
})

// 复杂查询
const complexFilter = await taskManager.getTasks({
  status: [TaskStatus.NOT_STARTED, TaskStatus.IN_PROGRESS],
  priority: [TaskPriority.HIGH, TaskPriority.MEDIUM],
  tags: ['frontend', 'urgent'],
  createdAfter: new Date('2024-01-01'),
  estimatedHours: { min: 4, max: 16 }
})
```

### updateStatus

更新任务状态。

```typescript
async updateStatus(
  id: string, 
  status: TaskStatus, 
  comment?: string
): Promise<Task>
```

**示例**:
```typescript
// 开始任务
await taskManager.updateStatus('task-001', TaskStatus.IN_PROGRESS)

// 完成任务并添加备注
await taskManager.updateStatus(
  'task-001', 
  TaskStatus.COMPLETED,
  '功能实现完成，已通过单元测试'
)

// 阻塞任务
await taskManager.updateStatus(
  'task-002', 
  TaskStatus.BLOCKED,
  '等待后端API接口完成'
)
```

## 🔗 依赖关系管理

### addDependency

添加任务依赖关系。

```typescript
async addDependency(taskId: string, dependsOn: string): Promise<void>
```

**示例**:
```typescript
// 设置任务依赖
await taskManager.addDependency('task-002', 'task-001')

// 批量设置依赖
const dependencies = ['task-001', 'task-003', 'task-004']
for (const dep of dependencies) {
  await taskManager.addDependency('task-005', dep)
}
```

### getDependencies

获取任务依赖关系。

```typescript
async getDependencies(taskId: string): Promise<Task[]>
```

**示例**:
```typescript
// 获取任务的所有依赖
const dependencies = await taskManager.getDependencies('task-005')
console.log(`任务 task-005 依赖于 ${dependencies.length} 个任务`)

// 检查依赖是否完成
const incompleteDeps = dependencies.filter(dep => 
  dep.status !== TaskStatus.COMPLETED
)

if (incompleteDeps.length > 0) {
  console.log('以下依赖任务尚未完成:', incompleteDeps.map(t => t.name))
}
```

## 📊 批量操作

### batchUpdate

批量更新任务。

```typescript
async batchUpdate(updates: BatchTaskUpdate[]): Promise<Task[]>
```

**示例**:
```typescript
// 批量更新任务状态
const batchUpdates = [
  { id: 'task-001', updates: { status: TaskStatus.COMPLETED } },
  { id: 'task-002', updates: { status: TaskStatus.IN_PROGRESS, assignee: '李四' } },
  { id: 'task-003', updates: { priority: TaskPriority.HIGH } }
]

const updatedTasks = await taskManager.batchUpdate(batchUpdates)
console.log(`批量更新了 ${updatedTasks.length} 个任务`)
```

### batchCreate

批量创建任务。

```typescript
async batchCreate(tasks: Partial<Task>[]): Promise<Task[]>
```

**示例**:
```typescript
const newTasks = [
  {
    name: '设计用户界面',
    description: '创建用户登录和注册页面的UI设计',
    priority: TaskPriority.HIGH,
    estimatedHours: 6
  },
  {
    name: '实现表单验证',
    description: '添加客户端和服务端表单验证',
    priority: TaskPriority.MEDIUM,
    estimatedHours: 4
  }
]

const createdTasks = await taskManager.batchCreate(newTasks)
```

## 🔍 查询和搜索

### searchTasks

搜索任务。

```typescript
async searchTasks(query: string): Promise<Task[]>
```

**示例**:
```typescript
// 文本搜索
const loginTasks = await taskManager.searchTasks('登录')

// 搜索特定分配人的任务
const zhangTasks = await taskManager.searchTasks('assignee:张三')

// 复合搜索
const urgentFrontendTasks = await taskManager.searchTasks('priority:high tag:frontend')
```

### getTaskStatistics

获取任务统计信息。

```typescript
async getTaskStatistics(): Promise<TaskStatistics>
```

**示例**:
```typescript
const stats = await taskManager.getTaskStatistics()

console.log(`
任务统计:
- 总任务数: ${stats.total}
- 已完成: ${stats.completed} (${stats.completionRate}%)
- 进行中: ${stats.inProgress}
- 未开始: ${stats.notStarted}
- 已阻塞: ${stats.blocked}

工时统计:
- 总预估工时: ${stats.totalEstimatedHours}小时
- 已消耗工时: ${stats.totalActualHours}小时
- 剩余工时: ${stats.remainingHours}小时

优先级分布:
- 高优先级: ${stats.priorityDistribution.high}
- 中优先级: ${stats.priorityDistribution.medium}
- 低优先级: ${stats.priorityDistribution.low}
`)
```

## 📈 进度分析

### analyzeProgress

分析项目进度。

```typescript
async analyzeProgress(): Promise<ProgressAnalysis>
```

**示例**:
```typescript
const analysis = await taskManager.analyzeProgress()

console.log(`
进度分析:
- 整体完成度: ${analysis.overallProgress}%
- 预计完成时间: ${analysis.estimatedCompletion}
- 当前速度: ${analysis.velocity} 任务/天
- 风险评估: ${analysis.riskLevel}

里程碑进度:
${analysis.milestones.map(m => 
  `- ${m.name}: ${m.progress}% (${m.status})`
).join('\n')}

团队效率:
${analysis.teamEfficiency.map(t => 
  `- ${t.member}: ${t.completionRate}% 完成率`
).join('\n')}
`)
```

## 🔧 类型定义

### Task

任务对象定义。

```typescript
interface Task {
  // 基本信息
  id: string
  name: string
  description: string
  
  // 状态信息
  status: TaskStatus
  priority: TaskPriority
  
  // 分配信息
  assignee?: string
  team?: string
  
  // 时间信息
  estimatedHours: number
  actualHours?: number
  startDate?: Date
  endDate?: Date
  dueDate?: Date
  
  // 依赖关系
  dependencies: string[]
  dependents: string[]
  blockers: string[]
  
  // 分类和标签
  category?: string
  tags: string[]
  
  // 验收标准
  acceptanceCriteria: string[]
  
  // 备注和历史
  comments: TaskComment[]
  history: TaskHistoryEntry[]
  
  // 元数据
  metadata: {
    source: string
    createdBy: string
    createdAt: Date
    updatedAt: Date
    version: number
  }
}
```

### TaskStatus

任务状态枚举。

```typescript
enum TaskStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold'
}
```

### TaskPriority

任务优先级枚举。

```typescript
enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}
```

### TaskFilter

任务过滤器。

```typescript
interface TaskFilter {
  // 状态过滤
  status?: TaskStatus | TaskStatus[]
  priority?: TaskPriority | TaskPriority[]
  
  // 分配过滤
  assignee?: string | string[]
  team?: string | string[]
  
  // 时间过滤
  createdAfter?: Date
  createdBefore?: Date
  dueAfter?: Date
  dueBefore?: Date
  
  // 工时过滤
  estimatedHours?: {
    min?: number
    max?: number
  }
  
  // 标签过滤
  tags?: string | string[]
  category?: string | string[]
  
  // 依赖过滤
  hasDependencies?: boolean
  hasBlockers?: boolean
  
  // 排序
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'dueDate' | 'estimatedHours'
  sortOrder?: 'asc' | 'desc'
  
  // 分页
  limit?: number
  offset?: number
}
```

## 🎯 使用示例

### 基本任务管理

```typescript
import { TaskManager, TaskStatus, TaskPriority } from 'taskflow-ai'

async function basicTaskManagement() {
  const taskManager = new TaskManager()
  
  // 创建任务
  const task = await taskManager.createTask({
    name: '实现用户认证',
    description: '实现JWT基础的用户认证系统',
    priority: TaskPriority.HIGH,
    estimatedHours: 16,
    assignee: '张三',
    tags: ['backend', 'security'],
    acceptanceCriteria: [
      '用户可以注册新账号',
      '用户可以登录和登出',
      'JWT token正确生成和验证',
      '密码安全存储（加密）'
    ]
  })
  
  // 开始任务
  await taskManager.updateStatus(task.id, TaskStatus.IN_PROGRESS)
  
  // 更新进度
  await taskManager.updateTask(task.id, {
    actualHours: 8,
    comments: [
      {
        text: '已完成用户注册功能',
        author: '张三',
        timestamp: new Date()
      }
    ]
  })
  
  // 完成任务
  await taskManager.updateStatus(
    task.id, 
    TaskStatus.COMPLETED,
    '认证系统实现完成，所有测试通过'
  )
}
```

### 依赖关系管理

```typescript
async function dependencyManagement() {
  const taskManager = new TaskManager()
  
  // 创建有依赖关系的任务
  const dbTask = await taskManager.createTask({
    name: '设计数据库表结构',
    priority: TaskPriority.HIGH,
    estimatedHours: 4
  })
  
  const apiTask = await taskManager.createTask({
    name: '实现用户API',
    priority: TaskPriority.HIGH,
    estimatedHours: 8,
    dependencies: [dbTask.id]
  })
  
  const frontendTask = await taskManager.createTask({
    name: '实现前端用户界面',
    priority: TaskPriority.MEDIUM,
    estimatedHours: 12,
    dependencies: [apiTask.id]
  })
  
  // 检查任务是否可以开始
  const canStart = await taskManager.canStartTask(frontendTask.id)
  if (!canStart.allowed) {
    console.log('任务无法开始，原因:', canStart.reasons)
  }
  
  // 获取关键路径
  const criticalPath = await taskManager.getCriticalPath()
  console.log('关键路径任务:', criticalPath.map(t => t.name))
}
```

### 团队协作

```typescript
async function teamCollaboration() {
  const taskManager = new TaskManager()
  
  // 按团队成员查看任务
  const teamMembers = ['张三', '李四', '王五']
  
  for (const member of teamMembers) {
    const memberTasks = await taskManager.getTasks({
      assignee: member,
      status: [TaskStatus.NOT_STARTED, TaskStatus.IN_PROGRESS]
    })
    
    console.log(`${member} 的任务 (${memberTasks.length}):`)
    memberTasks.forEach(task => {
      console.log(`  - ${task.name} (${task.status}, ${task.priority})`)
    })
  }
  
  // 工作负载平衡
  const workload = await taskManager.getWorkloadDistribution()
  const overloadedMembers = workload.filter(w => w.totalHours > 40)
  
  if (overloadedMembers.length > 0) {
    console.log('工作负载过重的成员:', overloadedMembers.map(m => m.member))
    
    // 重新分配任务
    await taskManager.rebalanceWorkload({
      maxHoursPerPerson: 40,
      strategy: 'even-distribution'
    })
  }
}
```

## 🔄 事件和钩子

### 任务事件

```typescript
taskManager.on('taskCreated', (task: Task) => {
  console.log(`新任务创建: ${task.name}`)
})

taskManager.on('taskUpdated', (task: Task, changes: Partial<Task>) => {
  console.log(`任务更新: ${task.name}`, changes)
})

taskManager.on('statusChanged', (task: Task, oldStatus: TaskStatus, newStatus: TaskStatus) => {
  console.log(`任务 ${task.name} 状态从 ${oldStatus} 变更为 ${newStatus}`)
})

taskManager.on('taskCompleted', (task: Task) => {
  console.log(`任务完成: ${task.name}`)
  // 自动开始依赖任务
  taskManager.startDependentTasks(task.id)
})
```

### 自定义钩子

```typescript
// 任务创建前验证
taskManager.addHook('beforeCreate', async (taskData: Partial<Task>) => {
  if (!taskData.name || taskData.name.length < 5) {
    throw new Error('任务名称至少需要5个字符')
  }
  return taskData
})

// 任务完成后自动化
taskManager.addHook('afterComplete', async (task: Task) => {
  // 自动创建代码审查任务
  if (task.tags.includes('development')) {
    await taskManager.createTask({
      name: `代码审查: ${task.name}`,
      description: `对任务 ${task.name} 的代码进行审查`,
      priority: TaskPriority.MEDIUM,
      estimatedHours: 2,
      dependencies: [task.id]
    })
  }
})
```

## 📚 相关文档

- [PRD解析器 API](./prd-parser.md) - PRD文档解析
- [AI编排器 API](./ai-orchestrator.md) - AI模型管理
- [项目配置管理 API](./project-config.md) - 项目配置
- [类型定义](./types/task.md) - 任务相关类型
