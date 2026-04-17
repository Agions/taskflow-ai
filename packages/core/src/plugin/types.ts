/**
 * 插件系统核心类型定义
 * @taskflow-ai/core 插件系统
 */

/**
 * 插件注册表
 */
export interface PluginRegistry {
  /** 注册插件 */
  register: (plugin: Plugin) => void;
  /** 注销插件 */
  unregister: (pluginId: string) => void;
  /** 获取插件 */
  get: (pluginId: string) => Plugin | undefined;
  /** 获取所有插件 */
  getAll: () => Plugin[];
}

/**
 * 插件基础接口
 */
export interface Plugin {
  /** 插件唯一标识 */
  id: string;
  /** 插件名称 */
  name: string;
  /** 版本 */
  version: string;
  /** 描述 */
  description?: string;
  /** 作者 */
  author?: string;
  /** 入口文件 */
  main: string;
  /** 依赖 */
  dependencies?: Record<string, string>;
  /** 生命周期钩子 */
  hooks?: PluginHooks;
  /** CLI 命令扩展 */
  commands?: PluginCommand[];
  /** 可视化扩展 */
  visualizations?: PluginVisualization[];
  /** 配置 schema */
  configSchema?: Record<string, unknown>;
  /** 启用状态 */
  enabled?: boolean;
}

/**
 * 插件生命周期钩子
 * 扩展支持更多钩子点
 */
export interface PluginHooks {
  /** 初始化 - 应用启动时 */
  onInit?: (context: PluginContext) => void | Promise<void>;
  /** 加载 - 插件加载时 */
  onLoad?: (plugin: Plugin) => void | Promise<void>;
  /** 卸载 - 插件卸载时 */
  onUnload?: (plugin: Plugin) => void | Promise<void>;
  /** 任务创建前 */
  onTaskCreate?: (task: Task) => Promise<Task> | Task;
  /** 任务创建后 */
  onTaskCreated?: (task: Task) => void | Promise<void>;
  /** 任务更新前 */
  onTaskUpdate?: (task: Task) => Promise<Task> | Task;
  /** 任务更新后 */
  onTaskUpdated?: (task: Task) => void | Promise<void>;
  /** 任务完成时 */
  onTaskComplete?: (task: Task) => void | Promise<void>;
  /** 工作流执行前 */
  onWorkflowBeforeExecute?: (workflow: Workflow, context: PluginContext) => void | Promise<void>;
  /** 工作流执行后 */
  onWorkflowExecute?: (workflow: Workflow, result: WorkflowResult, context: PluginContext) => void | Promise<void>;
  /** 命令执行前 */
  onCommandBefore?: (command: string, args: string[]) => void | Promise<void>;
  /** 命令执行后 */
  onCommand?: (command: string, args: string[], result?: unknown) => string | void | Promise<string | void>;
  /** 配置加载后 */
  onConfigLoaded?: (config: TaskFlowConfig) => void | Promise<void>;
  /** 配置保存前 */
  onConfigBeforeSave?: (config: TaskFlowConfig) => TaskFlowConfig | Promise<TaskFlowConfig>;
  /** 错误处理 */
  onError?: (error: Error, context: PluginContext) => void | Promise<void>;
}

/**
 * 工作流执行结果
 */
export interface WorkflowResult {
  success: boolean;
  output?: Record<string, unknown>;
  error?: string;
  duration: number;
}

/**
 * 插件 CLI 命令
 */
export interface PluginCommand {
  name: string;
  description: string;
  options?: PluginCommandOption[];
  action: (args: Record<string, unknown>, context: PluginContext) => void | Promise<void>;
}

/**
 * 插件命令选项
 */
export interface PluginCommandOption {
  name: string;
  short?: string;
  description: string;
  type: 'string' | 'number' | 'boolean';
  required?: boolean;
  default?: unknown;
}

/**
 * 插件可视化扩展
 */
export interface PluginVisualization {
  name: string;
  type: 'chart' | 'diagram' | 'table' | 'custom';
  renderer: (data: unknown, context: PluginContext) => string | Promise<string>;
}

/**
 * 插件上下文
 */
export interface PluginContext {
  /** 应用根目录 */
  appRoot: string;
  /** 工作目录 */
  workspace: string;
  /** 配置 */
  config: Partial<TaskFlowConfig>;
  /** 日志 */
  logger: Logger;
  /** 注册表 */
  registry: PluginRegistry;
  /** 事件发射器 */
  emitter?: EventEmitter;
  /** API 客户端 */
  api?: PluginAPI;
}

/**
 * 简单事件发射器
 */
export interface EventEmitter {
  on: (event: string, handler: (...args: unknown[]) => void | Promise<void>) => void;
  off: (event: string, handler: (...args: unknown[]) => void | Promise<void>) => void;
  emit: (event: string, ...args: unknown[]) => void | Promise<void>;
}

/**
 * 插件 API
 */
export interface PluginAPI {
  /** 任务管理 */
  tasks: {
    create: (task: Partial<Task>) => Promise<Task>;
    update: (taskId: string, updates: Partial<Task>) => Promise<Task>;
    delete: (taskId: string) => Promise<void>;
    get: (taskId: string) => Promise<Task | null>;
    list: (filters?: TaskFilters) => Promise<Task[]>;
  };
  /** 工作流管理 */
  workflows: {
    execute: (workflowId: string, input?: Record<string, unknown>) => Promise<WorkflowResult>;
    getStatus: (executionId: string) => Promise<WorkflowExecution | null>;
  };
  /** 配置管理 */
  config: {
    get: (key?: string) => Promise<unknown>;
    set: (key: string, value: unknown) => Promise<void>;
  };
  /** 存储 */
  storage: {
    get: (key: string) => Promise<unknown>;
    set: (key: string, value: unknown) => Promise<void>;
    delete: (key: string) => Promise<void>;
  };
}

/**
 * 任务过滤器
 */
export interface TaskFilters {
  status?: string[];
  priority?: string[];
  type?: string[];
  tags?: string[];
  search?: string;
}

/**
 * 插件元数据
 */
export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  repository?: string;
  keywords?: string[];
  license?: string;
  homepage?: string;
}

/**
 * Logger 接口
 */
export interface Logger {
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  debug: (message: string, ...args: unknown[]) => void;
}

/**
 * 任务类型
 */
export interface Task {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  priority: string;
  complexity?: string;
  estimatedHours?: number;
  dependencies?: string[];
  tags?: string[];
  subtasks?: Task[];
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 工作流类型
 */
export interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  variables?: Record<string, unknown>;
}

/**
 * 工作流步骤
 */
export interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  next?: string[];
  errorHandling?: {
    onError?: string;
    retry?: number;
  };
}

/**
 * 工作流执行
 */
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: string;
  currentStep?: string;
  stepStatuses?: Record<string, string>;
  variables?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  startedAt: number;
  finishedAt?: number;
  error?: string;
}

/**
 * TaskFlow 配置
 */
export interface TaskFlowConfig {
  version: string;
  projectName: string;
  aiModels?: AIModelConfig[];
  mcpSettings?: MCPConfig;
  storage?: StorageConfig;
  plugins?: PluginConfig;
  [key: string]: unknown;
}

/**
 * AI 模型配置
 */
export interface AIModelConfig {
  provider: string;
  model: string;
  apiKey?: string;
  enabled: boolean;
}

/**
 * MCP 配置
 */
export interface MCPConfig {
  servers?: Record<string, unknown>;
}

/**
 * 存储配置
 */
export interface StorageConfig {
  type: 'sqlite' | 'json' | 'memory';
  path?: string;
}

/**
 * 插件配置
 */
export interface PluginConfig {
  enabled: string[];
  disabled: string[];
  config?: Record<string, unknown>;
}
