/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * TaskFlow AI 任务相关类型定义
 */

/**
 * 任务状态枚举
 */
export enum TaskStatus {
  NOT_STARTED = 'not_started',   // 未开始
  PENDING = 'pending',           // 等待中
  IN_PROGRESS = 'in_progress',   // 进行中
  RUNNING = 'running',           // 执行中
  COMPLETED = 'completed',       // 已完成
  DONE = 'done',                 // 完成（兼容性）
  CANCELLED = 'cancelled',       // 已取消
  FAILED = 'failed',             // 失败
  BLOCKED = 'blocked',           // 被阻塞
  ON_HOLD = 'on_hold',          // 暂停
  REVIEW = 'review',            // 审核中
  TODO = 'todo',                // 待办（兼容性）
}

/**
 * 任务优先级
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * 依赖关系类型
 */
export enum DependencyType {
  FINISH_TO_START = 'finish_to_start',     // 前置任务完成后才能开始
  START_TO_START = 'start_to_start',       // 前置任务开始后才能开始
  FINISH_TO_FINISH = 'finish_to_finish',   // 前置任务完成后才能完成
  START_TO_FINISH = 'start_to_finish',     // 前置任务开始后才能完成
}

/**
 * 任务约束类型
 */
export enum TaskConstraint {
  AS_SOON_AS_POSSIBLE = 'asap',           // 尽快开始
  AS_LATE_AS_POSSIBLE = 'alap',           // 尽晚开始
  MUST_START_ON = 'must_start_on',        // 必须在指定日期开始
  MUST_FINISH_ON = 'must_finish_on',      // 必须在指定日期完成
  START_NO_EARLIER_THAN = 'snet',         // 不早于指定日期开始
  START_NO_LATER_THAN = 'snlt',           // 不晚于指定日期开始
  FINISH_NO_EARLIER_THAN = 'fnet',        // 不早于指定日期完成
  FINISH_NO_LATER_THAN = 'fnlt',          // 不晚于指定日期完成
}

/**
 * 资源类型
 */
export enum ResourceType {
  HUMAN = 'human',                        // 人力资源
  EQUIPMENT = 'equipment',                // 设备资源
  MATERIAL = 'material',                  // 物料资源
  SOFTWARE = 'software',                  // 软件资源
  BUDGET = 'budget',                      // 预算资源
}

/**
 * 任务类型
 */
export enum TaskType {
  FEATURE = 'feature',           // 功能开发
  BUG_FIX = 'bug_fix',          // 缺陷修复
  REFACTOR = 'refactor',        // 代码重构
  TEST = 'test',                // 测试任务
  DOCUMENT = 'document',        // 文档任务
  ANALYSIS = 'analysis',        // 分析任务
  DESIGN = 'design',            // 设计任务
  DEPLOYMENT = 'deployment',    // 部署任务
  RESEARCH = 'research',        // 研究任务
}

/**
 * 任务依赖关系
 */
export interface TaskDependency {
  id: string;                             // 依赖关系ID
  predecessorId: string;                  // 前置任务ID
  successorId: string;                    // 后续任务ID
  type: DependencyType;                   // 依赖类型
  lag?: number;                           // 滞后时间（小时）
  lead?: number;                          // 提前时间（小时）
  isOptional?: boolean;                   // 是否为可选依赖
  description?: string;                   // 依赖描述
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 任务资源需求
 */
export interface TaskResource {
  id: string;                             // 资源ID
  name: string;                           // 资源名称
  type: ResourceType;                     // 资源类型
  quantity: number;                       // 需求数量
  unit: string;                           // 单位
  cost?: number;                          // 成本
  availability?: number;                  // 可用性（0-1）
  skills?: string[];                      // 所需技能
  metadata?: Record<string, any>;         // 资源元数据
}

/**
 * 任务约束
 */
export interface TaskConstraintInfo {
  type: TaskConstraint;                   // 约束类型
  date?: Date;                            // 约束日期
  description?: string;                   // 约束描述
  isHard?: boolean;                       // 是否为硬约束
}

/**
 * 任务时间信息
 */
export interface TaskTimeInfo {
  estimatedDuration: number;              // 预计持续时间（小时）
  actualDuration?: number;                // 实际持续时间（小时）
  earliestStart?: Date;                   // 最早开始时间
  latestStart?: Date;                     // 最晚开始时间
  earliestFinish?: Date;                  // 最早完成时间
  latestFinish?: Date;                    // 最晚完成时间
  totalFloat?: number;                    // 总浮动时间
  freeFloat?: number;                     // 自由浮动时间
  isCritical?: boolean;                   // 是否为关键任务
}

/**
 * 任务编排元数据
 */
export interface TaskOrchestrationMetadata {
  schedulingPriority?: number;            // 调度优先级（数值越大优先级越高）
  complexity?: number;                    // 复杂度评分（1-10）
  riskLevel?: number;                     // 风险等级（1-10）
  businessValue?: number;                 // 业务价值评分（1-10）
  technicalDebt?: number;                 // 技术债务评分（1-10）
  parallelizable?: boolean;               // 是否可并行化
  canSplit?: boolean;                     // 是否可拆分
  requiresReview?: boolean;               // 是否需要评审
  automatable?: boolean;                  // 是否可自动化
  tags?: string[];                        // 编排标签
}

/**
 * 基本任务接口
 */
export interface Task {
  id: string;
  name: string;                  // 任务名称
  title: string;                 // 任务标题（兼容性）
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  dependencies: string[];        // 依赖任务的ID列表（向后兼容）
  estimatedHours?: number;       // 预计耗时(小时)
  actualHours?: number;          // 实际耗时(小时)
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  dueDate?: Date;                // 截止日期
  assignee?: string;             // 负责人
  tags: string[];                // 标签
  acceptance?: string[];         // 验收标准
  notes?: string;                // 备注
  progress?: number;             // 进度百分比 (0-100)
  metadata?: Record<string, any>; // 元数据
  subtasks?: Task[];             // 子任务列表

  // 新增编排相关字段
  dependencyRelations?: TaskDependency[];     // 详细依赖关系
  resourceRequirements?: TaskResource[];      // 资源需求
  constraints?: TaskConstraintInfo[];         // 任务约束
  timeInfo?: TaskTimeInfo;                    // 时间信息
  orchestrationMetadata?: TaskOrchestrationMetadata; // 编排元数据
  parentTaskId?: string;                      // 父任务ID
  level?: number;                             // 任务层级
  wbsCode?: string;                           // 工作分解结构编码
}

/**
 * 复合任务（包含子任务）
 */
export interface CompositeTask extends Task {
  subtasks: Task[];
}

/**
 * 测试用例
 */
export interface TestCase {
  id: string;
  taskId: string;
  name: string;
  description: string;
  steps: string[];
  expectedResults: string[];
  framework?: string;
  filePath?: string;
  status?: 'passed' | 'failed' | 'pending';
}

/**
 * 任务执行结果
 */
export interface TaskResult {
  taskId: string;
  success: boolean;
  message?: string;
  artifacts?: string[];
  duration?: number;
  startTime: Date;
  endTime?: Date;
  testResults?: TestResult[];
}

/**
 * 测试结果
 */
export interface TestResult {
  testCaseId: string;
  passed: boolean;
  message?: string;
  executionTime: number;
  coverage?: {
    lines: number;
    functions: number;
    statements: number;
    branches: number;
  };
}

/**
 * 任务计划
 */
export interface TaskPlan {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;              // 计划截止日期
  source?: string;             // 来源文档
  status: 'draft' | 'active' | 'completed' | 'archived';
  metadata?: Record<string, any>;
}

/**
 * PRD解析结果
 */
export interface ParsedPRD {
  id?: string;                   // PRD标识符
  title: string;
  description: string;
  sections: PRDSection[];
  metadata: Record<string, any>;
}

/**
 * PRD章节
 */
export interface PRDSection {
  title: string;
  content: string;
  level: number;
  features: Feature[];
  subsections?: PRDSection[];
}

/**
 * 功能点
 */
export interface Feature {
  name: string;
  description: string;
  priority?: TaskPriority;
  acceptance?: string[];
}

/**
 * 创建任务选项
 */
export interface CreateTaskOptions {
  name: string;
  description: string;
  priority?: TaskPriority;
  type?: TaskType;
  dependencies?: string[];
  assignee?: string;
  tags?: string[];
  subtasks?: Omit<CreateTaskOptions, 'subtasks'>[];
}

/**
 * 创建测试用例选项
 */
export interface CreateTestCaseOptions {
  taskId: string;
  name: string;
  description: string;
  steps: string[];
  expectedResults: string[];
}

/**
 * 任务编排配置
 */
export interface TaskOrchestrationConfig {
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

/**
 * 调度策略
 */
export enum SchedulingStrategy {
  CRITICAL_PATH = 'critical_path',        // 关键路径优先
  PRIORITY_FIRST = 'priority_first',      // 优先级优先
  SHORTEST_FIRST = 'shortest_first',      // 最短任务优先
  LONGEST_FIRST = 'longest_first',        // 最长任务优先
  RESOURCE_LEVELING = 'resource_leveling', // 资源平衡
  EARLY_START = 'early_start',            // 最早开始
  LATE_START = 'late_start',              // 最晚开始
}

/**
 * 优化目标
 */
export enum OptimizationGoal {
  MINIMIZE_DURATION = 'minimize_duration', // 最小化项目持续时间
  MINIMIZE_COST = 'minimize_cost',         // 最小化项目成本
  MAXIMIZE_QUALITY = 'maximize_quality',   // 最大化项目质量
  BALANCE_RESOURCES = 'balance_resources', // 平衡资源使用
  MINIMIZE_RISK = 'minimize_risk',         // 最小化项目风险
}

/**
 * 任务编排结果
 */
export interface TaskOrchestrationResult {
  tasks: Task[];                          // 编排后的任务列表
  criticalPath: string[];                 // 关键路径任务ID列表
  totalDuration: number;                  // 项目总持续时间
  parallelGroups: string[][];             // 可并行执行的任务组
  resourceUtilization: ResourceUtilization[]; // 资源利用率
  riskAssessment: RiskAssessment;         // 风险评估
  recommendations: string[];              // 优化建议
  metadata: {
    orchestrationTime: Date;              // 编排时间
    strategy: SchedulingStrategy;         // 使用的策略
    goal: OptimizationGoal;               // 优化目标
    version: string;                      // 编排算法版本
  };
}

/**
 * 资源利用率
 */
export interface ResourceUtilization {
  resourceId: string;                     // 资源ID
  resourceName: string;                   // 资源名称
  totalCapacity: number;                  // 总容量
  allocatedCapacity: number;              // 已分配容量
  utilizationRate: number;                // 利用率（0-1）
  overallocation: number;                 // 超分配量
  timeline: ResourceTimelineEntry[];     // 时间线
}

/**
 * 资源时间线条目
 */
export interface ResourceTimelineEntry {
  date: Date;                             // 日期
  allocatedHours: number;                 // 分配小时数
  availableHours: number;                 // 可用小时数
  taskIds: string[];                      // 相关任务ID
}

/**
 * 风险评估
 */
export interface RiskAssessment {
  overallRiskLevel: number;               // 整体风险等级（1-10）
  riskFactors: RiskFactor[];              // 风险因素
  mitigationSuggestions: string[];        // 缓解建议
  contingencyPlans: ContingencyPlan[];    // 应急计划
}

/**
 * 风险因素
 */
export interface RiskFactor {
  id: string;                             // 风险ID
  name: string;                           // 风险名称
  description: string;                    // 风险描述
  probability: number;                    // 发生概率（0-1）
  impact: number;                         // 影响程度（1-10）
  riskScore: number;                      // 风险评分
  affectedTaskIds: string[];              // 受影响的任务ID
  category: RiskCategory;                 // 风险类别
}

/**
 * 风险类别
 */
export enum RiskCategory {
  TECHNICAL = 'technical',                // 技术风险
  RESOURCE = 'resource',                  // 资源风险
  SCHEDULE = 'schedule',                  // 进度风险
  QUALITY = 'quality',                    // 质量风险
  EXTERNAL = 'external',                  // 外部风险
  COMMUNICATION = 'communication',        // 沟通风险
}

/**
 * 应急计划
 */
export interface ContingencyPlan {
  id: string;                             // 计划ID
  name: string;                           // 计划名称
  description: string;                    // 计划描述
  triggerConditions: string[];            // 触发条件
  actions: string[];                      // 应对措施
  responsiblePerson?: string;             // 负责人
  estimatedCost?: number;                 // 预计成本
  estimatedTime?: number;                 // 预计时间
}