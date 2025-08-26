/**
 * TaskFlow AI 核心类型定义
 */

// ==================== 基础类型 ====================

export interface TaskFlowConfig {
  projectName: string;
  version: string;
  aiModels: AIModelConfig[];
  mcpSettings: MCPSettings;
  outputFormats: string[];
  plugins: PluginConfig[];
}

export interface AIModelConfig {
  provider: AIProvider;
  modelName: string;
  apiKey: string;
  endpoint?: string;
  maxTokens?: number;
  temperature?: number;
  priority: number;
  enabled: boolean;
}

export type AIProvider =
  | 'deepseek'
  | 'zhipu'
  | 'qwen'
  | 'baidu'
  | 'moonshot'
  | 'spark'
  | 'openai'
  | 'claude';

// ==================== PRD相关类型 ====================

export interface PRDDocument {
  id: string;
  title: string;
  version: string;
  filePath: string;
  content: string;
  metadata: PRDMetadata;
  sections: PRDSection[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PRDMetadata {
  author: string;
  createDate: Date;
  lastModified: Date;
  tags: string[];
  priority: Priority;
  complexity: Complexity;
  estimatedHours: number;
}

export interface PRDSection {
  id: string;
  title: string;
  type: SectionType;
  content: string;
  requirements: Requirement[];
  dependencies: string[];
  order: number;
}

export type SectionType =
  | 'overview'
  | 'requirements'
  | 'functional'
  | 'non-functional'
  | 'technical'
  | 'ui-ux'
  | 'acceptance';

export interface Requirement {
  id: string;
  title: string;
  description: string;
  type: RequirementType;
  priority: Priority;
  complexity: Complexity;
  estimatedHours: number;
  tags: string[];
  acceptance: AcceptanceCriteria[];
}

export type RequirementType = 'functional' | 'non-functional' | 'technical' | 'ui-ux';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Complexity = 'simple' | 'medium' | 'complex' | 'epic';

export interface AcceptanceCriteria {
  id: string;
  description: string;
  type: 'given-when-then' | 'checklist' | 'scenario';
  testable: boolean;
}

// ==================== 任务管理类型 ====================

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: Priority;
  complexity: Complexity;
  estimatedHours: number;
  actualHours?: number;
  assignee?: string;
  dependencies: string[];
  tags: string[];
  requirement?: Requirement;
  subtasks: SubTask[];
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  completedAt?: Date;
}

export type TaskType =
  | 'frontend'
  | 'backend'
  | 'database'
  | 'testing'
  | 'deployment'
  | 'documentation'
  | 'research'
  | 'design';

export type TaskStatus =
  | 'todo'
  | 'in-progress'
  | 'review'
  | 'testing'
  | 'done'
  | 'blocked'
  | 'cancelled';

export interface SubTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  estimatedHours: number;
  actualHours?: number;
  completedAt?: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  prdDocument?: PRDDocument;
  tasks: Task[];
  status: ProjectStatus;
  startDate: Date;
  endDate?: Date;
  estimatedHours: number;
  actualHours: number;
  progress: number;
  team: TeamMember[];
  metadata: ProjectMetadata;
}

export type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  skills: string[];
}

export interface ProjectMetadata {
  createdBy: string;
  methodology: 'agile' | 'waterfall' | 'lean';
  sprintDuration?: number;
  currentSprint?: number;
  repository?: string;
  deploymentUrl?: string;
}

// ==================== MCP相关类型 ====================

export interface MCPSettings {
  enabled: boolean;
  port: number;
  host: string;
  serverName: string;
  version: string;
  capabilities: MCPCapability[];
  security: MCPSecurity;
  tools: MCPTool[];
  resources: MCPResource[];
}

export interface MCPCapability {
  name: string;
  version: string;
  description: string;
  enabled: boolean;
}

export interface MCPSecurity {
  authRequired: boolean;
  allowedOrigins: string[];
  rateLimit: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
  };
  sandbox: {
    enabled: boolean;
    timeout: number;
    memoryLimit: number;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: object;
  outputSchema?: object;
  handler: string;
  enabled: boolean;
  category: string;
}

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  handler: string;
}

// ==================== 输出格式类型 ====================

export type OutputFormat = string;

export interface VisualizationConfig {
  type: ChartType;
  title: string;
  data: any;
  options: ChartOptions;
}

export type ChartType = 'gantt' | 'burndown' | 'pie' | 'bar' | 'line' | 'timeline' | 'kanban';

export interface ChartOptions {
  responsive: boolean;
  theme: 'light' | 'dark';
  colors: string[];
  animation: boolean;
  legend: boolean;
  grid: boolean;
}

// ==================== 插件系统类型 ====================

export interface PluginConfig {
  name: string;
  version: string;
  enabled: boolean;
  settings: Record<string, any>;
}

export interface Plugin {
  name: string;
  version: string;
  description: string;
  author: string;
  initialize: (config: PluginConfig) => Promise<void>;
  execute: (context: PluginContext) => Promise<PluginResult>;
  cleanup: () => Promise<void>;
}

export interface PluginContext {
  project: Project;
  tasks: Task[];
  config: TaskFlowConfig;
  logger: Logger;
}

export interface PluginResult {
  success: boolean;
  data?: any;
  error?: string;
  warnings?: string[];
}

// ==================== 日志和错误类型 ====================

export interface Logger {
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
}

export interface TaskFlowError extends Error {
  code: string;
  type: ErrorType;
  context?: Record<string, any>;
}

export type ErrorType =
  | 'config'
  | 'parsing'
  | 'ai'
  | 'mcp'
  | 'validation'
  | 'network'
  | 'filesystem'
  | 'plugin';

// ==================== CLI相关类型 ====================

export interface CLIContext {
  config: TaskFlowConfig;
  project?: Project;
  verbose: boolean;
  debug: boolean;
  outputFormat: OutputFormat;
}

export interface CommandResult {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

// ==================== 实用工具类型 ====================

export interface ProgressIndicator {
  start: (message: string) => void;
  update: (message: string) => void;
  succeed: (message: string) => void;
  fail: (message: string) => void;
  stop: () => void;
}

export interface FileWatcher {
  watch: (pattern: string, callback: (event: string, path: string) => void) => void;
  stop: () => void;
}
