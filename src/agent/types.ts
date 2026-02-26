/**
 * Agent 类型定义
 * TaskFlow AI v3.0 - AI Agent 自主执行模式
 */

import { TaskFlowConfig } from '../types';

// Agent 配置
export interface AgentConfig {
  mode: 'assisted' | 'autonomous' | 'supervised';
  maxIterations: number;
  autoFix: boolean;
  approvalRequired: string[]; // 需要人工确认的操作
  continueOnError: boolean;
  timeout: number; // 单个任务超时时间（毫秒）
}

// Agent 状态
export type AgentStatus = 
  | 'idle' 
  | 'planning' 
  | 'executing' 
  | 'verifying' 
  | 'awaitingApproval'
  | 'completed' 
  | 'failed';

export interface AgentState {
  status: AgentStatus;
  currentTask: Task | null;
  iteration: number;
  context: AgentContext;
  history: ActionHistory[];
  error?: Error;
  startTime: Date;
  endTime?: Date;
}

// Agent 上下文
export interface AgentContext {
  prd: PRDDocument;
  projectConfig: TaskFlowConfig;
  availableTools: Tool[];
  constraints: string[];
  taskPlan?: TaskPlan;
  executionResult?: ExecutionResult;
  verificationResult?: VerificationResult;
}

// PRD 文档
export interface PRDDocument {
  id: string;
  title: string;
  description: string;
  requirements: Requirement[];
  acceptanceCriteria: string[];
  metadata: PRDMetadata;
}

export interface Requirement {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  type: 'functional' | 'non-functional';
}

export interface PRDMetadata {
  author: string;
  createdAt: Date;
  updatedAt: Date;
  version: string;
  tags: string[];
}

// 任务计划
export interface TaskPlan {
  tasks: Task[];
  dependencies: Dependency[];
  totalEstimate: number; // 工时估算（小时）
  criticalPath: string[]; // 关键路径任务ID
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  estimate: number; // 工时估算（小时）
  assignee?: string;
  dependencies: string[]; // 依赖的任务ID
  outputPath?: string; // 输出文件路径
  metadata: TaskMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskType = 
  | 'code' 
  | 'file' 
  | 'shell' 
  | 'analysis' 
  | 'design' 
  | 'test';

export type TaskStatus = 
  | 'pending' 
  | 'in-progress' 
  | 'completed' 
  | 'failed' 
  | 'blocked';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface TaskMetadata {
  framework?: string;
  language?: string;
  template?: string;
  tags: string[];
}

export interface Dependency {
  from: string; // 任务ID
  to: string;   // 任务ID
  type: 'blocks' | 'depends-on';
}

// 执行结果
export interface ExecutionResult {
  results: TaskResult[];
  completedAt: Date;
  success: boolean;
  summary: ExecutionSummary;
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  output?: string;
  error?: string;
  duration: number; // 执行时间（毫秒）
  artifacts?: string[]; // 生成的文件
}

export interface ExecutionSummary {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalDuration: number;
}

// 验证结果
export interface VerificationResult {
  checks: VerificationCheck[];
  allPassed: boolean;
  fixTasks?: Task[]; // 需要修复的任务
}

export interface VerificationCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

// 工具定义
export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: ToolHandler;
}

export type ToolHandler = (params: Record<string, unknown>) => Promise<ToolResult>;

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// 操作历史
export interface ActionHistory {
  id: string;
  type: ActionType;
  timestamp: Date;
  data: unknown;
  result: 'success' | 'failure';
  message: string;
}

export type ActionType = 
  | 'plan' 
  | 'execute' 
  | 'verify' 
  | 'fix' 
  | 'approve' 
  | 'reject';

// Agent 事件
export type AgentEvent =
  | { type: 'START' }
  | { type: 'PLAN_COMPLETE'; data: TaskPlan }
  | { type: 'PLAN_FAILED'; error: Error }
  | { type: 'EXECUTION_COMPLETE'; data: ExecutionResult }
  | { type: 'EXECUTION_FAILED'; error: Error }
  | { type: 'VERIFICATION_PASS'; data: VerificationResult }
  | { type: 'VERIFICATION_FAIL'; data: VerificationResult }
  | { type: 'APPROVED' }
  | { type: 'REJECTED' };

// 会话管理
export interface AgentSession {
  id: string;
  state: AgentState;
  config: AgentConfig;
  createdAt: Date;
  updatedAt: Date;
}

// 执行上下文
export interface ExecutionContext {
  config: AgentConfig;
  projectPath: string;
  workspacePath: string;
}

// 代码生成相关
export interface CodeTemplate {
  id: string;
  name: string;
  description: string;
  framework: string;
  language: string;
  template: string;
  variables: TemplateVariable[];
  validation: ValidationRule[];
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  default?: unknown;
  description?: string;
}

export interface ValidationRule {
  rule: string;
  pattern?: string;
  message?: string;
}

export interface TemplateContext {
  [key: string]: unknown;
}

// 组件生成
export interface ComponentSpec {
  name: string;
  description: string;
  framework: string;
  props?: ComponentProp[];
  hasState?: boolean;
  hasEffects?: boolean;
  hasStyles?: boolean;
}

export interface ComponentProp {
  name: string;
  type: string;
  optional?: boolean;
  defaultValue?: string;
}

export interface GeneratedComponent {
  name: string;
  framework: string;
  files: GeneratedFile[];
}

export interface GeneratedFile {
  path: string;
  content: string;
}

// 规划引擎
export interface PlanningEngine {
  plan(prd: PRDDocument): Promise<TaskPlan>;
  analyzeRequirements(prd: PRDDocument): Promise<RequirementAnalysis>;
  estimateEffort(tasks: Task[]): Promise<Task[]>;
}

export interface RequirementAnalysis {
  features: Feature[];
  technicalConstraints: string[];
  risks: Risk[];
}

export interface Feature {
  name: string;
  description: string;
  complexity: 'low' | 'medium' | 'high';
  dependencies: string[];
}

export interface Risk {
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

// 验证引擎
export interface VerificationEngine {
  verify(result: ExecutionResult): Promise<VerificationResult>;
  checkCodeQuality(files: string[]): Promise<CodeQualityReport>;
  checkTestCoverage(files: string[]): Promise<CoverageReport>;
}

export interface CodeQualityReport {
  score: number;
  issues: CodeIssue[];
  metrics: CodeMetrics;
}

export interface CodeIssue {
  file: string;
  line: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  rule: string;
}

export interface CodeMetrics {
  linesOfCode: number;
  complexity: number;
  maintainability: number;
}

export interface CoverageReport {
  overall: number;
  files: FileCoverage[];
}

export interface FileCoverage {
  file: string;
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}
