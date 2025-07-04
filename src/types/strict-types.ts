/**
 * 严格类型定义文件
 * 用于替换项目中的any类型使用
 */

// 通用类型定义
export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export interface JSONObject {
  [key: string]: JSONValue;
}
export interface JSONArray extends Array<JSONValue> {}

// HTTP响应类型
export interface APIResponse<T = JSONValue> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 错误类型
export interface ErrorContext {
  code: string;
  details?: JSONObject;
  timestamp: string;
  source: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: JSONValue;
}

// 配置类型
export interface ConfigValue {
  value: JSONValue;
  source: 'default' | 'file' | 'env' | 'cli';
  isValid: boolean;
}

export interface ConfigSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  default?: JSONValue;
  enum?: JSONValue[];
  min?: number;
  max?: number;
  pattern?: string;
}

// 模型相关类型
export interface ModelRequest {
  prompt: string;
  options?: ModelOptions;
  context?: JSONObject;
}

export interface ModelOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  stream?: boolean;
}

export interface ModelResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: 'stop' | 'length' | 'content_filter';
  metadata?: JSONObject;
}

// 任务相关类型 - 与Task接口兼容
export interface TaskData {
  id: string;
  name: string;
  title: string;
  description: string;
  status: 'not_started' | 'pending' | 'in_progress' | 'running' | 'completed' | 'done' | 'cancelled' | 'failed' | 'blocked' | 'on_hold' | 'review' | 'todo';
  priority: 'low' | 'medium' | 'high' | 'critical';
  type?: 'feature' | 'bug_fix' | 'refactor' | 'test' | 'document' | 'analysis' | 'design' | 'deployment' | 'research';
  dependencies?: string[];
  estimatedHours?: number;
  actualHours?: number;
  createdAt?: string;
  updatedAt?: string;
  startedAt?: string;
  completedAt?: string;
  dueDate?: string;
  assignee?: string;
  tags: string[];
  acceptance?: string[];
  notes?: string;
  progress?: number;
  metadata: JSONObject;
  subtasks?: TaskData[];
}

export interface TaskFilter {
  status?: TaskData['status'][];
  priority?: TaskData['priority'][];
  assignee?: string[];
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

// 解析相关类型
export interface ParseResult<T = JSONValue> {
  success: boolean;
  data?: T;
  errors: ValidationError[];
  warnings: string[];
  metadata: {
    parseTime: number;
    source: string;
    version: string;
  };
}

export interface DocumentSection {
  title: string;
  content: string;
  level: number;
  type: 'heading' | 'paragraph' | 'list' | 'code' | 'table';
  metadata?: JSONObject;
}

// 性能监控类型
export interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  cacheHitRate: number;
  errorRate: number;
  throughput: number;
}

export interface PerformanceThresholds {
  maxExecutionTime: number;
  maxMemoryUsage: number;
  minCacheHitRate: number;
  maxErrorRate: number;
}

// 事件类型
export interface EventData<T = JSONValue> {
  type: string;
  payload: T;
  timestamp: string;
  source: string;
  correlationId?: string;
}

export type EventHandler<T = JSONValue> = (event: EventData<T>) => void | Promise<void>;

// 插件类型
export interface PluginConfig {
  name: string;
  version: string;
  enabled: boolean;
  options: JSONObject;
}

export interface PluginContext {
  config: PluginConfig;
  logger: {
    info: (message: string, meta?: JSONObject) => void;
    warn: (message: string, meta?: JSONObject) => void;
    error: (message: string, meta?: JSONObject) => void;
  };
  utils: {
    validateSchema: (data: JSONValue, schema: ConfigSchema) => ValidationError[];
    formatDate: (date: Date) => string;
    generateId: () => string;
  };
}

// 文件操作类型
export interface FileMetadata {
  path: string;
  size: number;
  mtime: string;
  type: string;
  encoding?: string;
}

export interface FileOperationResult {
  success: boolean;
  path: string;
  operation: 'read' | 'write' | 'delete' | 'copy' | 'move';
  metadata?: FileMetadata;
  error?: string;
}

// 网络请求类型
export interface RequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: JSONValue;
  timeout?: number;
  retries?: number;
}

export interface ResponseData<T = JSONValue> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
  config: RequestConfig;
}

// 缓存类型
export interface CacheEntry<T = JSONValue> {
  key: string;
  value: T;
  ttl: number;
  createdAt: string;
  accessCount: number;
}

export interface CacheStats {
  size: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  totalRequests: number;
}

// 日志类型
export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  source: string;
  metadata?: JSONObject;
  correlationId?: string;
}

export interface LogFilter {
  level?: LogEntry['level'][];
  source?: string[];
  timeRange?: {
    start: string;
    end: string;
  };
  search?: string;
}

// 工作流类型
export interface WorkflowStep {
  id: string;
  name: string;
  type: 'action' | 'condition' | 'parallel' | 'sequential';
  config: JSONObject;
  dependencies: string[];
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  steps: {
    stepId: string;
    status: WorkflowExecution['status'];
    result?: JSONValue;
    error?: string;
  }[];
}

// 类型守卫函数
export function isJSONObject(value: JSONValue): value is JSONObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isJSONArray(value: JSONValue): value is JSONArray {
  return Array.isArray(value);
}

export function isString(value: JSONValue): value is string {
  return typeof value === 'string';
}

export function isNumber(value: JSONValue): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: JSONValue): value is boolean {
  return typeof value === 'boolean';
}

// 类型断言函数
export function assertIsString(value: JSONValue, fieldName: string): asserts value is string {
  if (!isString(value)) {
    throw new Error(`Expected ${fieldName} to be a string, got ${typeof value}`);
  }
}

export function assertIsNumber(value: JSONValue, fieldName: string): asserts value is number {
  if (!isNumber(value)) {
    throw new Error(`Expected ${fieldName} to be a number, got ${typeof value}`);
  }
}

export function assertIsObject(value: JSONValue, fieldName: string): asserts value is JSONObject {
  if (!isJSONObject(value)) {
    throw new Error(`Expected ${fieldName} to be an object, got ${typeof value}`);
  }
}
