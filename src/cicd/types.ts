/**
 * CI/CD 集成类型定义
 * TaskFlow AI v3.0 - CI/CD 流水线集成
 */

// CI/CD 提供商
export type CIProvider = 'github' | 'gitlab' | 'jenkins' | 'azure' | 'circleci' | 'travis';

// 流水线配置
export interface PipelineConfig {
  provider: CIProvider;
  name: string;
  triggers: PipelineTrigger[];
  stages: PipelineStage[];
  environment: Record<string, string>;
  secrets: string[];
  notifications: NotificationConfig[];
}

export interface PipelineTrigger {
  type: 'push' | 'pr' | 'schedule' | 'manual' | 'webhook';
  branches?: string[];
  paths?: string[];
  cron?: string;
}

export interface PipelineStage {
  name: string;
  jobs: PipelineJob[];
  parallel?: boolean;
  needs?: string[];
  condition?: string;
}

export interface PipelineJob {
  name: string;
  steps: PipelineStep[];
  runner?: string;
  timeout?: number;
  artifacts?: string[];
  cache?: CacheConfig;
}

export interface PipelineStep {
  name: string;
  command: string;
  workingDirectory?: string;
  condition?: string;
  continueOnError?: boolean;
}

export interface CacheConfig {
  paths: string[];
  key: string;
}

export interface NotificationConfig {
  type: 'slack' | 'email' | 'webhook' | 'github';
  target: string;
  events: ('start' | 'success' | 'failure' | 'always')[];
}

// GitHub Actions 特定配置
export interface GitHubActionsConfig extends PipelineConfig {
  provider: 'github';
  workflowFile: string;
  permissions: GitHubPermissions;
  concurrency?: GitHubConcurrency;
}

export interface GitHubPermissions {
  contents?: 'read' | 'write';
  issues?: 'read' | 'write';
  pullRequests?: 'read' | 'write';
  actions?: 'read' | 'write';
}

export interface GitHubConcurrency {
  group: string;
  cancelInProgress: boolean;
}

// 验证结果
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

// 流水线状态
export interface PipelineStatus {
  id: string;
  status: 'pending' | 'running' | 'success' | 'failure' | 'cancelled' | 'skipped';
  stage: string;
  job: string;
  startedAt: Date;
  finishedAt?: Date;
  duration?: number;
  url?: string;
  logs?: string;
}

// 任务同步配置
export interface TaskSyncConfig {
  enabled: boolean;
  provider: 'jira' | 'linear' | 'asana' | 'trello' | 'github';
  projectKey: string;
  mappings: TaskFieldMapping[];
  bidirectional: boolean;
  autoCreate: boolean;
  autoClose: boolean;
}

export interface TaskFieldMapping {
  localField: string;
  remoteField: string;
  transform?: string;
}

// PR 审查配置
export interface PRReviewConfig {
  enabled: boolean;
  autoReview: boolean;
  reviewers: string[];
  requiredChecks: string[];
  aiReview: boolean;
  aiReviewPrompt?: string;
}

// 部署配置
export interface DeployConfig {
  environments: DeployEnvironment[];
  strategies: DeployStrategy[];
}

export interface DeployEnvironment {
  name: string;
  url: string;
  requiresApproval: boolean;
  approvers?: string[];
  variables: Record<string, string>;
}

export interface DeployStrategy {
  name: string;
  type: 'rolling' | 'blue-green' | 'canary';
  steps: DeployStep[];
}

export interface DeployStep {
  name: string;
  weight?: number;
  healthCheck?: HealthCheckConfig;
}

export interface HealthCheckConfig {
  endpoint: string;
  interval: number;
  timeout: number;
  retries: number;
}

// 集成配置
export interface CIIntegrationConfig {
  provider: CIProvider;
  repository: string;
  branch: string;
  token: string;
  baseUrl?: string;
  pipeline: PipelineConfig;
  taskSync?: TaskSyncConfig;
  prReview?: PRReviewConfig;
  deploy?: DeployConfig;
}

// 工作流模板
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  provider: CIProvider;
  content: string;
  variables: WorkflowVariable[];
}

export interface WorkflowVariable {
  name: string;
  description: string;
  default?: string;
  required: boolean;
}

// 构建报告
export interface BuildReport {
  id: string;
  status: PipelineStatus['status'];
  stages: StageReport[];
  summary: BuildSummary;
  artifacts: BuildArtifact[];
}

export interface StageReport {
  name: string;
  status: PipelineStatus['status'];
  duration: number;
  jobs: JobReport[];
}

export interface JobReport {
  name: string;
  status: PipelineStatus['status'];
  duration: number;
  steps: StepReport[];
}

export interface StepReport {
  name: string;
  status: PipelineStatus['status'];
  duration: number;
  output?: string;
}

export interface BuildSummary {
  totalStages: number;
  successfulStages: number;
  failedStages: number;
  totalDuration: number;
  testsPassed: number;
  testsFailed: number;
  coverage: number;
}

export interface BuildArtifact {
  name: string;
  path: string;
  size: number;
  url?: string;
}
