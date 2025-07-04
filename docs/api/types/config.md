# 配置类型定义

## 概述

本文档定义了TaskFlow AI中配置管理相关的所有类型，包括项目配置、系统配置、AI模型配置等。

## 🏗️ 项目配置类型

### ProjectConfig - 项目配置
```typescript
interface ProjectConfig extends BaseEntity {
  // 项目基本信息
  project: ProjectInfo
  
  // AI配置
  ai: AIConfig
  
  // 团队配置
  team: TeamConfig
  
  // 工作流配置
  workflow: WorkflowConfig
  
  // 性能配置
  performance: PerformanceConfig
  
  // 安全配置
  security: SecurityConfig
  
  // 网络配置
  network: NetworkConfig
  
  // 日志配置
  logging: LoggingConfig
  
  // 环境配置
  environment: Environment
}

// 项目信息
interface ProjectInfo {
  name: string
  type: ProjectType
  description?: string
  version?: string
  workDir: string
  language?: string
  framework?: string
  repository?: RepositoryInfo
}

// 项目类型
enum ProjectType {
  WEB_APP = 'web-app',
  MOBILE_APP = 'mobile-app',
  API = 'api',
  DESKTOP_APP = 'desktop-app',
  LIBRARY = 'library',
  MICROSERVICE = 'microservice',
  OTHER = 'other'
}

// 仓库信息
interface RepositoryInfo {
  url: string
  branch: string
  provider: 'github' | 'gitlab' | 'bitbucket' | 'other'
  private: boolean
}
```

## 🤖 AI配置类型

### AIConfig - AI配置
```typescript
interface AIConfig {
  // 模型配置
  models: ModelConfigs
  
  // 多模型配置
  multiModel: MultiModelConfig
  
  // 解析配置
  parsing: ParsingConfig
  
  // 生成配置
  generation: GenerationConfig
}

// 模型配置集合
interface ModelConfigs {
  deepseek: ModelConfig
  zhipu: ModelConfig
  qwen: ModelConfig
  baidu: ModelConfig
  [key: string]: ModelConfig
}

// 单个模型配置
interface ModelConfig {
  enabled: boolean
  apiKey: string
  endpoint?: string
  model?: string
  parameters: ModelParameters
  limits: ModelLimits
  pricing?: ModelPricing
}

// 模型参数
interface ModelParameters {
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
  stopSequences?: string[]
}

// 模型限制
interface ModelLimits {
  requestsPerMinute: number
  tokensPerMinute: number
  maxConcurrentRequests: number
  dailyQuota?: number
}

// 模型定价
interface ModelPricing {
  inputTokens: number    // per 1K tokens
  outputTokens: number   // per 1K tokens
  fixedCost?: number     // per request
  currency: string
}

// 多模型配置
interface MultiModelConfig {
  enabled: boolean
  primary: string
  fallback: string[]
  loadBalancing: boolean
  selectionStrategy: ModelSelectionStrategy
  costOptimization: boolean
  qualityThreshold: number
}

// 模型选择策略
enum ModelSelectionStrategy {
  PERFORMANCE = 'performance',
  COST = 'cost',
  BALANCED = 'balanced',
  ROUND_ROBIN = 'round_robin',
  RANDOM = 'random',
  CUSTOM = 'custom'
}
```

## 👥 团队配置类型

### TeamConfig - 团队配置
```typescript
interface TeamConfig {
  // 团队成员
  members: TeamMember[]
  
  // 角色定义
  roles: TeamRole[]
  
  // 默认设置
  defaults: TeamDefaults
  
  // 协作设置
  collaboration: CollaborationConfig
  
  // 通知设置
  notifications: NotificationConfig
}

// 团队成员
interface TeamMember {
  id: ID
  name: string
  email: string
  role: string
  skills: string[]
  availability: Availability
  timezone: string
  active: boolean
  joinedAt: Timestamp
}

// 可用性
interface Availability {
  hoursPerWeek: number
  workingDays: number[]  // 0-6, 0=Sunday
  workingHours: {
    start: string  // HH:mm
    end: string    // HH:mm
  }
  vacations: VacationPeriod[]
}

// 假期时间
interface VacationPeriod {
  start: Timestamp
  end: Timestamp
  type: 'vacation' | 'sick' | 'personal' | 'holiday'
  description?: string
}

// 团队角色
interface TeamRole {
  id: ID
  name: string
  permissions: Permission[]
  responsibilities: string[]
  canAssignTasks: boolean
  canUpdateStatus: boolean
  canDeleteTasks: boolean
  isAdmin: boolean
}

// 团队默认设置
interface TeamDefaults {
  assignee?: string
  reviewer?: string
  priority: TaskPriority
  estimationMethod: 'hours' | 'story_points' | 'tshirt'
  autoAssignment: boolean
  workingHours: number
}
```

## 🔄 工作流配置类型

### WorkflowConfig - 工作流配置
```typescript
interface WorkflowConfig {
  // 任务工作流
  taskWorkflow: TaskWorkflowConfig
  
  // 自动化规则
  automation: AutomationConfig
  
  // 集成配置
  integrations: IntegrationConfig
  
  // 报告配置
  reporting: ReportingConfig
}

// 任务工作流配置
interface TaskWorkflowConfig {
  defaultStatus: TaskStatus
  statusTransitions: TaskStatusTransition[]
  approvalRequired: boolean
  reviewRequired: boolean
  testingRequired: boolean
  autoStatusUpdate: boolean
}

// 自动化配置
interface AutomationConfig {
  enabled: boolean
  rules: AutomationRule[]
  triggers: AutomationTrigger[]
  actions: AutomationAction[]
}

// 自动化规则
interface AutomationRule {
  id: ID
  name: string
  description: string
  enabled: boolean
  trigger: AutomationTrigger
  conditions: AutomationCondition[]
  actions: AutomationAction[]
  priority: number
}

// 自动化触发器
interface AutomationTrigger {
  type: 'event' | 'schedule' | 'webhook' | 'manual'
  event?: EventType
  schedule?: ScheduleConfig
  webhook?: WebhookConfig
}

// 自动化条件
interface AutomationCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  value: any
  logicalOperator?: 'and' | 'or'
}

// 自动化动作
interface AutomationAction {
  type: 'update_task' | 'send_notification' | 'create_task' | 'assign_task' | 'webhook'
  parameters: Record<string, any>
}
```

## ⚡ 性能配置类型

### PerformanceConfig - 性能配置
```typescript
interface PerformanceConfig {
  // 缓存配置
  cache: CacheConfig
  
  // 并发配置
  concurrency: ConcurrencyConfig
  
  // 超时配置
  timeout: TimeoutConfig
  
  // 监控配置
  monitoring: MonitoringConfig
  
  // 优化配置
  optimization: OptimizationConfig
}

// 缓存配置
interface CacheConfig {
  enabled: boolean
  size: number
  ttl: number
  compression: boolean
  strategy: 'lru' | 'lfu' | 'fifo'
  levels: CacheLevelConfig[]
}

// 缓存层级配置
interface CacheLevelConfig {
  name: string
  type: 'memory' | 'disk' | 'redis'
  size: number
  ttl: number
  enabled: boolean
}

// 并发配置
interface ConcurrencyConfig {
  maxConcurrency: number
  queueSize: number
  timeout: number
  strategy: 'fifo' | 'lifo' | 'priority'
  adaptive: boolean
}

// 超时配置
interface TimeoutConfig {
  request: number
  parsing: number
  generation: number
  database: number
  network: number
}

// 监控配置
interface MonitoringConfig {
  enabled: boolean
  interval: number
  metrics: MonitoringMetric[]
  alerts: AlertConfig[]
  retention: number
}

// 监控指标
enum MonitoringMetric {
  RESPONSE_TIME = 'response_time',
  THROUGHPUT = 'throughput',
  ERROR_RATE = 'error_rate',
  MEMORY_USAGE = 'memory_usage',
  CPU_USAGE = 'cpu_usage',
  CACHE_HIT_RATE = 'cache_hit_rate'
}

// 告警配置
interface AlertConfig {
  metric: MonitoringMetric
  threshold: number
  operator: 'greater_than' | 'less_than' | 'equals'
  duration: number
  actions: AlertAction[]
}

// 告警动作
interface AlertAction {
  type: 'email' | 'slack' | 'webhook' | 'log'
  target: string
  template?: string
}
```

## 🔒 安全配置类型

### SecurityConfig - 安全配置
```typescript
interface SecurityConfig {
  // 认证配置
  authentication: AuthenticationConfig
  
  // 授权配置
  authorization: AuthorizationConfig
  
  // 加密配置
  encryption: EncryptionConfig
  
  // 审计配置
  audit: AuditConfig
  
  // 访问控制
  accessControl: AccessControlConfig
}

// 认证配置
interface AuthenticationConfig {
  enabled: boolean
  method: 'local' | 'oauth' | 'ldap' | 'saml'
  sessionTimeout: number
  maxLoginAttempts: number
  lockoutDuration: number
  passwordPolicy: PasswordPolicy
}

// 密码策略
interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  maxAge: number
  historyCount: number
}

// 授权配置
interface AuthorizationConfig {
  enabled: boolean
  defaultRole: string
  roleHierarchy: RoleHierarchy[]
  resourcePermissions: ResourcePermission[]
}

// 角色层级
interface RoleHierarchy {
  parent: string
  children: string[]
}

// 资源权限
interface ResourcePermission {
  resource: string
  roles: string[]
  permissions: Permission[]
}

// 加密配置
interface EncryptionConfig {
  enabled: boolean
  algorithm: 'AES-256-GCM' | 'AES-256-CBC' | 'ChaCha20-Poly1305'
  keyRotation: boolean
  keyRotationInterval: number
  encryptApiKeys: boolean
  encryptDatabase: boolean
}

// 审计配置
interface AuditConfig {
  enabled: boolean
  logLevel: 'minimal' | 'standard' | 'detailed'
  retention: number
  storage: 'file' | 'database' | 'external'
  events: AuditEvent[]
}

// 审计事件
enum AuditEvent {
  LOGIN = 'login',
  LOGOUT = 'logout',
  TASK_CREATE = 'task_create',
  TASK_UPDATE = 'task_update',
  TASK_DELETE = 'task_delete',
  CONFIG_CHANGE = 'config_change',
  PERMISSION_CHANGE = 'permission_change'
}
```

## 🌐 网络配置类型

### NetworkConfig - 网络配置
```typescript
interface NetworkConfig {
  // 代理配置
  proxy: ProxyConfig
  
  // SSL配置
  ssl: SSLConfig
  
  // 重试配置
  retry: RetryConfig
  
  // 连接池配置
  connectionPool: ConnectionPoolConfig
  
  // 限流配置
  rateLimit: RateLimitConfig
}

// 重试配置
interface RetryConfig {
  enabled: boolean
  maxAttempts: number
  initialDelay: number
  maxDelay: number
  backoffStrategy: 'linear' | 'exponential' | 'fixed'
  retryableErrors: string[]
}

// 连接池配置
interface ConnectionPoolConfig {
  maxConnections: number
  maxIdleConnections: number
  idleTimeout: number
  connectionTimeout: number
  keepAlive: boolean
}

// 限流配置
interface RateLimitConfig {
  enabled: boolean
  requestsPerSecond: number
  burstSize: number
  strategy: 'token_bucket' | 'sliding_window' | 'fixed_window'
}
```

## 📊 集成配置类型

### IntegrationConfig - 集成配置
```typescript
interface IntegrationConfig {
  // 第三方集成
  thirdParty: ThirdPartyIntegration[]
  
  // Webhook配置
  webhooks: WebhookConfig[]
  
  // API配置
  api: APIConfig
  
  // 导入导出配置
  importExport: ImportExportConfig
}

// 第三方集成
interface ThirdPartyIntegration {
  name: string
  type: 'jira' | 'github' | 'slack' | 'teams' | 'trello' | 'asana'
  enabled: boolean
  config: Record<string, any>
  syncEnabled: boolean
  syncInterval: number
  mapping: FieldMapping[]
}

// 字段映射
interface FieldMapping {
  localField: string
  remoteField: string
  transformation?: string
  required: boolean
}

// Webhook配置
interface WebhookConfig {
  id: ID
  name: string
  url: string
  events: EventType[]
  headers: Record<string, string>
  secret?: string
  enabled: boolean
  retryPolicy: RetryConfig
}

// API配置
interface APIConfig {
  enabled: boolean
  port: number
  host: string
  cors: CORSConfig
  authentication: boolean
  rateLimit: RateLimitConfig
  documentation: boolean
}

// CORS配置
interface CORSConfig {
  enabled: boolean
  origins: string[]
  methods: string[]
  headers: string[]
  credentials: boolean
}
```

## 📋 配置验证类型

### ConfigValidation - 配置验证
```typescript
interface ConfigValidation {
  schema: ConfigSchema
  rules: ValidationRule[]
  customValidators: CustomValidator[]
}

// 配置模式
interface ConfigSchema {
  type: 'object'
  properties: Record<string, ConfigPropertySchema>
  required: string[]
  additionalProperties: boolean
}

// 配置属性模式
interface ConfigPropertySchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description?: string
  default?: any
  enum?: any[]
  minimum?: number
  maximum?: number
  pattern?: string
  items?: ConfigPropertySchema
  properties?: Record<string, ConfigPropertySchema>
}

// 自定义验证器
interface CustomValidator {
  name: string
  description: string
  validator: (value: any, config: ProjectConfig) => ValidationResult
}
```

## 🔧 配置管理类型

### ConfigManager - 配置管理器类型
```typescript
// 配置操作选项
interface ConfigOperationOptions {
  validate?: boolean
  backup?: boolean
  notify?: boolean
  merge?: boolean
  overwrite?: boolean
}

// 配置模板
interface ConfigTemplate {
  name: string
  description: string
  version: string
  config: Partial<ProjectConfig>
  metadata: ConfigTemplateMetadata
}

// 配置模板元数据
interface ConfigTemplateMetadata {
  author: string
  createdAt: Timestamp
  tags: string[]
  category: string
  compatibility: string[]
  dependencies: string[]
}

// 配置备份
interface ConfigBackup {
  id: ID
  timestamp: Timestamp
  config: ProjectConfig
  reason: string
  createdBy: string
  size: number
}

// 配置差异
interface ConfigDiff {
  added: ConfigChange[]
  modified: ConfigChange[]
  removed: ConfigChange[]
}

// 配置变更
interface ConfigChange {
  path: string
  oldValue?: any
  newValue?: any
  type: 'added' | 'modified' | 'removed'
}
```

## 📚 相关文档

- [核心类型](./core.md) - 基础类型定义
- [任务类型](./task.md) - 任务相关类型
- [模型类型](./model.md) - AI模型相关类型
- [配置管理 API](../config-manager.md) - 配置管理接口
