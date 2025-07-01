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
  dependencies: string[];        // 依赖任务的ID列表
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