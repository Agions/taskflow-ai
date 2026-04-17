# 任务类型定义

## 概述

本文档定义了TaskFlow AI中任务管理相关的所有类型，包括任务实体、状态、优先级、依赖关系等。

## 📋 任务核心类型

### Task - 任务实体

```typescript
interface Task extends BaseEntity, NamedEntity, TaggableEntity {
  // 基本信息
  id: ID;
  name: string;
  description: string;

  // 状态信息
  status: TaskStatus;
  priority: TaskPriority;

  // 分配信息
  assignee?: string;
  team?: string;
  reporter?: string;

  // 时间信息
  estimatedHours: number;
  actualHours?: number;
  startDate?: Timestamp;
  endDate?: Timestamp;
  dueDate?: Timestamp;

  // 依赖关系
  dependencies: ID[];
  dependents: ID[];
  blockers: ID[];

  // 分类和标签
  category?: string;
  tags: string[];
  labels: TaskLabel[];

  // 验收标准
  acceptanceCriteria: AcceptanceCriterion[];

  // 备注和历史
  comments: TaskComment[];
  history: TaskHistoryEntry[];
  attachments: TaskAttachment[];

  // 进度信息
  progress: TaskProgress;

  // 元数据
  metadata: TaskMetadata;
}
```

## 🏷️ 任务状态类型

### TaskStatus - 任务状态

```typescript
enum TaskStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
  REVIEW = 'review',
  TESTING = 'testing',
}

// 状态转换规则
interface TaskStatusTransition {
  from: TaskStatus;
  to: TaskStatus;
  allowed: boolean;
  conditions?: TaskStatusCondition[];
  requiredPermissions?: Permission[];
}

// 状态条件
interface TaskStatusCondition {
  type: 'dependency' | 'approval' | 'time' | 'custom';
  description: string;
  validator: (task: Task) => boolean;
}
```

### TaskPriority - 任务优先级

```typescript
enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical',
}

// 优先级配置
interface TaskPriorityConfig {
  priority: TaskPriority;
  color: string;
  weight: number;
  autoEscalation?: {
    enabled: boolean;
    daysOverdue: number;
    escalateTo: TaskPriority;
  };
}
```

## 🔗 依赖关系类型

### TaskDependency - 任务依赖

```typescript
interface TaskDependency {
  id: ID;
  sourceTaskId: ID;
  targetTaskId: ID;
  type: DependencyType;
  description?: string;
  createdAt: Timestamp;
  createdBy: string;
}

// 依赖类型
enum DependencyType {
  FINISH_TO_START = 'finish_to_start', // 前置任务完成后才能开始
  START_TO_START = 'start_to_start', // 前置任务开始后才能开始
  FINISH_TO_FINISH = 'finish_to_finish', // 前置任务完成后才能完成
  START_TO_FINISH = 'start_to_finish', // 前置任务开始后才能完成
}

// 依赖分析结果
interface DependencyAnalysis {
  hasCycles: boolean;
  cycles: TaskDependencyCycle[];
  criticalPath: ID[];
  longestPath: ID[];
  parallelTasks: ID[][];
}

// 依赖循环
interface TaskDependencyCycle {
  tasks: ID[];
  description: string;
  severity: 'warning' | 'error';
}
```

## 📊 任务进度类型

### TaskProgress - 任务进度

```typescript
interface TaskProgress {
  percentage: number;
  completedSubtasks: number;
  totalSubtasks: number;
  completedCriteria: number;
  totalCriteria: number;
  timeSpent: number;
  timeRemaining: number;
  velocity: number;
  lastUpdated: Timestamp;
}

// 进度计算配置
interface ProgressCalculationConfig {
  method: 'manual' | 'subtasks' | 'criteria' | 'time' | 'weighted';
  weights?: {
    subtasks: number;
    criteria: number;
    time: number;
  };
  autoUpdate: boolean;
}
```

## 💬 任务交互类型

### TaskComment - 任务备注

```typescript
interface TaskComment extends BaseEntity {
  taskId: ID;
  text: string;
  author: string;
  type: CommentType;
  mentions: string[];
  attachments: CommentAttachment[];
  reactions: CommentReaction[];
  isEdited: boolean;
  editedAt?: Timestamp;
  parentCommentId?: ID;
  replies: TaskComment[];
}

// 备注类型
enum CommentType {
  GENERAL = 'general',
  STATUS_UPDATE = 'status_update',
  BLOCKER = 'blocker',
  QUESTION = 'question',
  SOLUTION = 'solution',
  REVIEW = 'review',
}

// 备注反应
interface CommentReaction {
  emoji: string;
  users: string[];
  count: number;
}
```

### TaskHistoryEntry - 任务历史

```typescript
interface TaskHistoryEntry extends BaseEntity {
  taskId: ID;
  action: TaskAction;
  field?: string;
  oldValue?: any;
  newValue?: any;
  author: string;
  description: string;
  metadata?: Record<string, any>;
}

// 任务操作
enum TaskAction {
  CREATED = 'created',
  UPDATED = 'updated',
  STATUS_CHANGED = 'status_changed',
  ASSIGNED = 'assigned',
  UNASSIGNED = 'unassigned',
  COMMENTED = 'commented',
  DEPENDENCY_ADDED = 'dependency_added',
  DEPENDENCY_REMOVED = 'dependency_removed',
  ATTACHMENT_ADDED = 'attachment_added',
  ATTACHMENT_REMOVED = 'attachment_removed',
}
```

## 📎 任务附件类型

### TaskAttachment - 任务附件

```typescript
interface TaskAttachment extends BaseEntity {
  taskId: ID;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  description?: string;
  isPublic: boolean;
}

// 附件类型
enum AttachmentType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  SPREADSHEET = 'spreadsheet',
  PRESENTATION = 'presentation',
  ARCHIVE = 'archive',
  CODE = 'code',
  OTHER = 'other',
}
```

## ✅ 验收标准类型

### AcceptanceCriterion - 验收标准

```typescript
interface AcceptanceCriterion extends BaseEntity {
  taskId: ID;
  title: string;
  description: string;
  type: CriterionType;
  status: CriterionStatus;
  priority: number;
  testCases: TestCase[];
  verifiedBy?: string;
  verifiedAt?: Timestamp;
  notes?: string;
}

// 标准类型
enum CriterionType {
  FUNCTIONAL = 'functional',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  USABILITY = 'usability',
  COMPATIBILITY = 'compatibility',
  BUSINESS = 'business',
}

// 标准状态
enum CriterionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  PASSED = 'passed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

// 测试用例
interface TestCase {
  id: ID;
  title: string;
  steps: string[];
  expectedResult: string;
  actualResult?: string;
  status: CriterionStatus;
  executedBy?: string;
  executedAt?: Timestamp;
}
```

## 🏷️ 任务标签类型

### TaskLabel - 任务标签

```typescript
interface TaskLabel {
  id: ID;
  name: string;
  color: string;
  description?: string;
  category?: string;
  isSystem: boolean;
}

// 系统标签
enum SystemLabel {
  BUG = 'bug',
  FEATURE = 'feature',
  ENHANCEMENT = 'enhancement',
  DOCUMENTATION = 'documentation',
  TESTING = 'testing',
  REFACTORING = 'refactoring',
  HOTFIX = 'hotfix',
}
```

## 📊 任务查询类型

### TaskFilter - 任务过滤器

```typescript
interface TaskFilter {
  // 状态过滤
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];

  // 分配过滤
  assignee?: string | string[];
  team?: string | string[];
  reporter?: string | string[];

  // 时间过滤
  createdAfter?: Timestamp;
  createdBefore?: Timestamp;
  dueAfter?: Timestamp;
  dueBefore?: Timestamp;

  // 工时过滤
  estimatedHours?: NumberRange;
  actualHours?: NumberRange;

  // 标签过滤
  tags?: string | string[];
  labels?: string | string[];
  category?: string | string[];

  // 依赖过滤
  hasDependencies?: boolean;
  hasBlockers?: boolean;
  isDependentOn?: ID | ID[];

  // 文本搜索
  search?: string;
  searchFields?: TaskSearchField[];

  // 排序
  sortBy?: TaskSortField;
  sortOrder?: 'asc' | 'desc';

  // 分页
  limit?: number;
  offset?: number;
}

// 数值范围
interface NumberRange {
  min?: number;
  max?: number;
}

// 搜索字段
enum TaskSearchField {
  NAME = 'name',
  DESCRIPTION = 'description',
  COMMENTS = 'comments',
  TAGS = 'tags',
  ASSIGNEE = 'assignee',
}

// 排序字段
enum TaskSortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  DUE_DATE = 'dueDate',
  PRIORITY = 'priority',
  STATUS = 'status',
  ESTIMATED_HOURS = 'estimatedHours',
  PROGRESS = 'progress',
}
```

## 📈 任务统计类型

### TaskStatistics - 任务统计

```typescript
interface TaskStatistics {
  // 基本统计
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  blocked: number;
  cancelled: number;

  // 完成率
  completionRate: number;

  // 工时统计
  totalEstimatedHours: number;
  totalActualHours: number;
  remainingHours: number;

  // 优先级分布
  priorityDistribution: Record<TaskPriority, number>;

  // 状态分布
  statusDistribution: Record<TaskStatus, number>;

  // 分配统计
  assigneeDistribution: Record<string, number>;
  teamDistribution: Record<string, number>;

  // 时间统计
  averageCompletionTime: number;
  overdueTasks: number;
  upcomingDeadlines: number;

  // 趋势数据
  trends: TaskTrend[];
}

// 任务趋势
interface TaskTrend {
  date: Timestamp;
  created: number;
  completed: number;
  inProgress: number;
  velocity: number;
}
```

## 🔄 任务操作类型

### TaskOperation - 任务操作

```typescript
// 批量任务更新
interface BatchTaskUpdate {
  taskIds: ID[];
  updates: Partial<Task>;
  conditions?: TaskUpdateCondition[];
}

// 更新条件
interface TaskUpdateCondition {
  field: keyof Task;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in';
  value: any;
}

// 任务创建选项
interface TaskCreateOptions {
  generateId?: boolean;
  validateDependencies?: boolean;
  notifyAssignee?: boolean;
  autoAssign?: boolean;
  template?: string;
}

// 任务模板
interface TaskTemplate {
  id: ID;
  name: string;
  description: string;
  defaultValues: Partial<Task>;
  requiredFields: (keyof Task)[];
  customFields: CustomField[];
}

// 自定义字段
interface CustomField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'select' | 'multiselect';
  required: boolean;
  defaultValue?: any;
  options?: string[];
  validation?: ValidationRule[];
}
```

## 📊 任务分析类型

### TaskAnalysis - 任务分析

```typescript
interface TaskAnalysis {
  // 复杂度分析
  complexity: TaskComplexity;

  // 风险评估
  risks: TaskRisk[];

  // 依赖分析
  dependencyAnalysis: DependencyAnalysis;

  // 工时预测
  effortEstimation: EffortEstimation;

  // 建议
  recommendations: TaskRecommendation[];
}

// 任务复杂度
interface TaskComplexity {
  level: 'simple' | 'medium' | 'complex' | 'very_complex';
  score: number;
  factors: ComplexityFactor[];
}

// 复杂度因素
interface ComplexityFactor {
  name: string;
  weight: number;
  score: number;
  description: string;
}

// 任务风险
interface TaskRisk {
  type: 'schedule' | 'resource' | 'technical' | 'business';
  level: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  mitigation: string;
  probability: number;
}

// 工时预测
interface EffortEstimation {
  optimistic: number;
  realistic: number;
  pessimistic: number;
  confidence: number;
  factors: EstimationFactor[];
}

// 预测因素
interface EstimationFactor {
  name: string;
  impact: number;
  description: string;
}

// 任务建议
interface TaskRecommendation {
  type: 'optimization' | 'risk_mitigation' | 'resource_allocation' | 'scheduling';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  action: string;
  expectedBenefit: string;
}
```

## 📚 相关文档

- [核心类型](./core.md) - 基础类型定义
- [配置类型](./config.md) - 配置相关类型
- [模型类型](./model.md) - AI模型相关类型
- [任务管理器 API](../task-manager.md) - 任务管理接口
