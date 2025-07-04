# 核心类型定义

## 概述

本文档定义了TaskFlow AI的核心类型，包括基础数据结构、枚举类型和接口定义。

## 🏗️ 基础类型

### ID类型
```typescript
// 唯一标识符类型
type ID = string

// 时间戳类型
type Timestamp = number | Date

// 版本号类型
type Version = string
```

### 通用接口
```typescript
// 基础实体接口
interface BaseEntity {
  id: ID
  createdAt: Timestamp
  updatedAt: Timestamp
  version: Version
}

// 可命名实体接口
interface NamedEntity extends BaseEntity {
  name: string
  description?: string
}

// 可标记实体接口
interface TaggableEntity {
  tags: string[]
  category?: string
}
```

## 📊 结果类型

### 操作结果
```typescript
// 通用操作结果
interface Result<T = any> {
  success: boolean
  data?: T
  error?: Error
  message?: string
  timestamp: Timestamp
}

// 异步操作结果
type AsyncResult<T = any> = Promise<Result<T>>

// 分页结果
interface PaginatedResult<T = any> extends Result<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    hasNext: boolean
    hasPrev: boolean
  }
}
```

### 验证结果
```typescript
// 验证结果
interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  suggestions: string[]
}

// 验证错误
interface ValidationError {
  field: string
  message: string
  code: string
  severity: 'error' | 'warning' | 'info'
}

// 验证警告
interface ValidationWarning {
  field: string
  message: string
  suggestion?: string
}
```

## 🔧 配置类型

### 基础配置
```typescript
// 配置项接口
interface ConfigItem<T = any> {
  key: string
  value: T
  type: ConfigType
  required: boolean
  default?: T
  description?: string
  validation?: ValidationRule[]
}

// 配置类型枚举
enum ConfigType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  OBJECT = 'object',
  ARRAY = 'array'
}

// 验证规则
interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom'
  value?: any
  message?: string
  validator?: (value: any) => boolean
}
```

### 环境配置
```typescript
// 环境类型
enum Environment {
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  STAGING = 'staging',
  PRODUCTION = 'production'
}

// 环境配置
interface EnvironmentConfig {
  name: Environment
  debug: boolean
  logging: LoggingConfig
  performance: PerformanceConfig
  security: SecurityConfig
}
```

## 📝 日志类型

### 日志级别
```typescript
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

// 日志条目
interface LogEntry {
  timestamp: Timestamp
  level: LogLevel
  message: string
  context?: Record<string, any>
  error?: Error
  source?: string
  requestId?: string
}

// 日志配置
interface LoggingConfig {
  level: LogLevel
  file?: string
  maxSize?: string
  maxFiles?: number
  format?: 'json' | 'text'
  console?: boolean
}
```

## 🚨 错误类型

### 错误基类
```typescript
// 基础错误类
abstract class BaseError extends Error {
  abstract readonly code: string
  abstract readonly category: ErrorCategory
  readonly timestamp: Timestamp
  readonly context?: Record<string, any>

  constructor(message: string, context?: Record<string, any>) {
    super(message)
    this.name = this.constructor.name
    this.timestamp = Date.now()
    this.context = context
  }
}

// 错误类别
enum ErrorCategory {
  CONFIGURATION = 'configuration',
  PARSING = 'parsing',
  NETWORK = 'network',
  FILE = 'file',
  MODEL = 'model',
  TASK = 'task',
  PERMISSION = 'permission',
  SYSTEM = 'system'
}
```

### 具体错误类型
```typescript
// 配置错误
class ConfigurationError extends BaseError {
  readonly code = 'TF-CF-001'
  readonly category = ErrorCategory.CONFIGURATION
}

// 解析错误
class ParsingError extends BaseError {
  readonly code = 'TF-PR-001'
  readonly category = ErrorCategory.PARSING
}

// 网络错误
class NetworkError extends BaseError {
  readonly code = 'TF-NW-001'
  readonly category = ErrorCategory.NETWORK
}
```

## 📊 性能类型

### 性能指标
```typescript
// 性能指标
interface PerformanceMetrics {
  responseTime: number
  throughput: number
  errorRate: number
  successRate: number
  cacheHitRate: number
  memoryUsage: number
  cpuUsage: number
}

// 性能配置
interface PerformanceConfig {
  cacheSize: number
  timeout: number
  maxConcurrency: number
  retryAttempts: number
  enableMonitoring: boolean
}
```

### 监控类型
```typescript
// 监控状态
enum MonitoringStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  CRITICAL = 'critical',
  UNKNOWN = 'unknown'
}

// 健康检查结果
interface HealthStatus {
  status: MonitoringStatus
  timestamp: Timestamp
  checks: HealthCheck[]
  uptime: number
}

// 健康检查项
interface HealthCheck {
  name: string
  status: MonitoringStatus
  message?: string
  duration: number
  metadata?: Record<string, any>
}
```

## 🔒 安全类型

### 权限类型
```typescript
// 权限枚举
enum Permission {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  ADMIN = 'admin'
}

// 角色定义
interface Role {
  id: ID
  name: string
  permissions: Permission[]
  description?: string
}

// 用户类型
interface User {
  id: ID
  name: string
  email: string
  roles: Role[]
  active: boolean
  lastLogin?: Timestamp
}
```

### 安全配置
```typescript
// 安全配置
interface SecurityConfig {
  encryptApiKeys: boolean
  auditLog: boolean
  accessControl: boolean
  sessionTimeout: number
  maxLoginAttempts: number
}

// 审计日志条目
interface AuditLogEntry {
  timestamp: Timestamp
  userId: ID
  action: string
  resource: string
  result: 'success' | 'failure'
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}
```

## 🌐 网络类型

### HTTP类型
```typescript
// HTTP方法
enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH'
}

// HTTP状态码
enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500
}

// HTTP请求
interface HttpRequest {
  method: HttpMethod
  url: string
  headers?: Record<string, string>
  body?: any
  timeout?: number
}

// HTTP响应
interface HttpResponse<T = any> {
  status: HttpStatusCode
  headers: Record<string, string>
  data: T
  duration: number
}
```

### 网络配置
```typescript
// 网络配置
interface NetworkConfig {
  timeout: number
  retryAttempts: number
  proxy?: ProxyConfig
  ssl?: SSLConfig
  keepAlive: boolean
}

// 代理配置
interface ProxyConfig {
  http?: string
  https?: string
  auth?: string
  noProxy?: string[]
}

// SSL配置
interface SSLConfig {
  verify: boolean
  caPath?: string
  certPath?: string
  keyPath?: string
}
```

## 📅 时间类型

### 时间范围
```typescript
// 时间范围
interface TimeRange {
  start: Timestamp
  end: Timestamp
}

// 时间段
enum TimePeriod {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year'
}

// 调度配置
interface ScheduleConfig {
  enabled: boolean
  cron?: string
  interval?: number
  timezone?: string
}
```

## 🔄 事件类型

### 事件系统
```typescript
// 事件类型
enum EventType {
  TASK_CREATED = 'task:created',
  TASK_UPDATED = 'task:updated',
  TASK_COMPLETED = 'task:completed',
  PRD_PARSED = 'prd:parsed',
  MODEL_SELECTED = 'model:selected',
  ERROR_OCCURRED = 'error:occurred'
}

// 事件数据
interface Event<T = any> {
  type: EventType
  timestamp: Timestamp
  source: string
  data: T
  metadata?: Record<string, any>
}

// 事件处理器
type EventHandler<T = any> = (event: Event<T>) => void | Promise<void>

// 事件发射器接口
interface EventEmitter {
  on<T>(eventType: EventType, handler: EventHandler<T>): void
  off<T>(eventType: EventType, handler: EventHandler<T>): void
  emit<T>(eventType: EventType, data: T): void
}
```

## 🔌 插件类型

### 插件系统
```typescript
// 插件接口
interface Plugin {
  name: string
  version: Version
  description?: string
  author?: string
  dependencies?: string[]
  
  initialize(context: PluginContext): Promise<void>
  execute(input: any): Promise<any>
  cleanup(): Promise<void>
}

// 插件上下文
interface PluginContext {
  config: Record<string, any>
  logger: Logger
  events: EventEmitter
  storage: Storage
}

// 插件状态
enum PluginStatus {
  INSTALLED = 'installed',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error'
}
```

## 📦 存储类型

### 存储接口
```typescript
// 存储接口
interface Storage {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T): Promise<void>
  delete(key: string): Promise<void>
  exists(key: string): Promise<boolean>
  clear(): Promise<void>
  keys(): Promise<string[]>
}

// 缓存接口
interface Cache extends Storage {
  ttl(key: string): Promise<number>
  expire(key: string, ttl: number): Promise<void>
  size(): Promise<number>
}
```

## 🎯 工具类型

### 实用类型
```typescript
// 深度部分类型
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// 必需字段类型
type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// 可选字段类型
type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// 键值对类型
type KeyValuePair<T = any> = {
  key: string
  value: T
}

// 字典类型
type Dictionary<T = any> = Record<string, T>
```

## 📚 相关文档

- [任务类型](./task.md) - 任务相关类型定义
- [配置类型](./config.md) - 配置相关类型定义
- [模型类型](./model.md) - AI模型相关类型定义
- [API文档](../) - 完整API接口文档
