# 模型类型定义

## 概述

本文档定义了TaskFlow AI中AI模型相关的所有类型，包括模型定义、处理选项、结果类型等。

## 🤖 AI模型核心类型

### AIModel - AI模型定义
```typescript
interface AIModel extends BaseEntity {
  // 基本信息
  id: ID
  name: string
  provider: ModelProvider
  version?: string
  description?: string
  
  // 连接信息
  endpoint: string
  apiKey: string
  headers?: Record<string, string>
  
  // 能力描述
  capabilities: ModelCapability[]
  supportedTasks: string[]
  languages: string[]
  
  // 限制和配额
  limits: ModelLimits
  
  // 定价信息
  pricing?: ModelPricing
  
  // 状态信息
  status: ModelStatus
  currentLoad: number
  lastHealthCheck: Timestamp
  
  // 配置参数
  defaultParams: ModelParameters
  
  // 性能指标
  performance: ModelPerformance
}

// 模型提供商
enum ModelProvider {
  DEEPSEEK = 'deepseek',
  ZHIPU = 'zhipu',
  QWEN = 'qwen',
  BAIDU = 'baidu',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  CUSTOM = 'custom'
}

// 模型能力
enum ModelCapability {
  TEXT_GENERATION = 'text-generation',
  CODE_ANALYSIS = 'code-analysis',
  REASONING = 'reasoning',
  CHINESE_UNDERSTANDING = 'chinese-understanding',
  ENGLISH_UNDERSTANDING = 'english-understanding',
  MULTIMODAL = 'multimodal',
  FUNCTION_CALLING = 'function-calling',
  JSON_MODE = 'json-mode'
}

// 模型状态
enum ModelStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  ERROR = 'error',
  DEPRECATED = 'deprecated'
}
```

## 📊 模型性能类型

### ModelPerformance - 模型性能
```typescript
interface ModelPerformance {
  // 响应时间指标
  responseTime: ResponseTimeMetrics
  
  // 质量指标
  quality: QualityMetrics
  
  // 可靠性指标
  reliability: ReliabilityMetrics
  
  // 成本指标
  cost: CostMetrics
  
  // 使用统计
  usage: UsageMetrics
}

// 响应时间指标
interface ResponseTimeMetrics {
  average: number
  median: number
  p95: number
  p99: number
  min: number
  max: number
  lastUpdated: Timestamp
}

// 质量指标
interface QualityMetrics {
  accuracy: number
  relevance: number
  completeness: number
  consistency: number
  confidence: number
  userRating: number
  lastEvaluated: Timestamp
}

// 可靠性指标
interface ReliabilityMetrics {
  uptime: number
  successRate: number
  errorRate: number
  timeoutRate: number
  retryRate: number
  lastIncident?: Timestamp
}

// 成本指标
interface CostMetrics {
  costPerRequest: number
  costPerToken: number
  totalCost: number
  costEfficiency: number
  budgetUtilization: number
  period: TimePeriod
}

// 使用统计
interface UsageMetrics {
  totalRequests: number
  totalTokens: number
  activeUsers: number
  requestsPerDay: number
  tokensPerDay: number
  peakUsage: number
  period: TimePeriod
}
```

## 🔧 处理选项类型

### ProcessingOptions - 处理选项
```typescript
interface ProcessingOptions {
  // 任务类型
  task: ProcessingTask
  
  // 模型选择
  preferredModel?: string
  fallbackModels?: string[]
  multiModel?: boolean
  models?: string[]
  
  // 处理参数
  parameters?: ModelParameters
  
  // 质量控制
  qualityControl?: QualityControlOptions
  
  // 缓存控制
  cache?: CacheOptions
  
  // 回调函数
  callbacks?: ProcessingCallbacks
  
  // 元数据
  metadata?: Record<string, any>
}

// 处理任务类型
enum ProcessingTask {
  PRD_ANALYSIS = 'prd-analysis',
  TASK_GENERATION = 'task-generation',
  CODE_ANALYSIS = 'code-analysis',
  BUSINESS_ANALYSIS = 'business-analysis',
  REQUIREMENT_EXTRACTION = 'requirement-extraction',
  DEPENDENCY_ANALYSIS = 'dependency-analysis',
  PRIORITY_ASSESSMENT = 'priority-assessment'
}

// 质量控制选项
interface QualityControlOptions {
  compareResults?: boolean
  minConfidence?: number
  maxRetries?: number
  validationRules?: ValidationRule[]
  qualityThreshold?: number
}

// 缓存选项
interface CacheOptions {
  useCache?: boolean
  cacheKey?: string
  cacheTTL?: number
  cacheStrategy?: 'aggressive' | 'conservative' | 'disabled'
}

// 处理回调
interface ProcessingCallbacks {
  onProgress?: (progress: ProcessingProgress) => void
  onModelSelected?: (modelId: string) => void
  onError?: (error: ProcessingError) => void
  onComplete?: (result: ProcessingResult) => void
}
```

## 📈 处理结果类型

### ProcessingResult - 处理结果
```typescript
interface ProcessingResult {
  // 基本结果
  success: boolean
  content: string
  
  // 模型信息
  modelUsed: string
  modelsAttempted: string[]
  
  // 性能指标
  processingTime: number
  tokenUsage: TokenUsage
  
  // 质量指标
  confidence: number
  quality: QualityMetrics
  
  // 成本信息
  cost: CostBreakdown
  
  // 元数据
  metadata: ProcessingMetadata
  
  // 错误信息
  errors?: ProcessingError[]
  warnings?: ProcessingWarning[]
  
  // 对比结果（多模型时）
  comparisons?: ModelComparison[]
}

// Token使用情况
interface TokenUsage {
  input: number
  output: number
  total: number
  cached?: number
}

// 成本分解
interface CostBreakdown {
  amount: number
  currency: string
  inputCost: number
  outputCost: number
  fixedCost?: number
  breakdown: CostItem[]
}

// 成本项目
interface CostItem {
  type: 'input_tokens' | 'output_tokens' | 'request' | 'cache'
  quantity: number
  unitPrice: number
  amount: number
}

// 处理元数据
interface ProcessingMetadata {
  requestId: string
  timestamp: Timestamp
  version: string
  environment: Environment
  userAgent?: string
  sessionId?: string
}

// 模型对比结果
interface ModelComparison {
  modelId: string
  confidence: number
  quality: number
  responseTime: number
  cost: number
  selected: boolean
  reason?: string
}
```

## 🚨 错误和警告类型

### ProcessingError - 处理错误
```typescript
interface ProcessingError extends BaseError {
  // 错误分类
  category: ProcessingErrorCategory
  
  // 模型相关
  modelId?: string
  
  // 重试信息
  retryable: boolean
  retryCount: number
  
  // 恢复建议
  recovery?: RecoveryAction[]
}

// 处理错误类别
enum ProcessingErrorCategory {
  MODEL_ERROR = 'model_error',
  NETWORK_ERROR = 'network_error',
  TIMEOUT_ERROR = 'timeout_error',
  QUOTA_ERROR = 'quota_error',
  VALIDATION_ERROR = 'validation_error',
  PARSING_ERROR = 'parsing_error'
}

// 恢复动作
interface RecoveryAction {
  type: 'retry' | 'fallback' | 'manual' | 'ignore'
  description: string
  parameters?: Record<string, any>
}

// 处理警告
interface ProcessingWarning {
  type: 'quality' | 'performance' | 'cost' | 'compatibility'
  message: string
  severity: 'low' | 'medium' | 'high'
  suggestion?: string
}
```

## 🔄 模型编排类型

### ModelOrchestration - 模型编排
```typescript
interface ModelOrchestration {
  // 选择策略
  selectionStrategy: ModelSelectionStrategy
  
  // 负载均衡
  loadBalancing: LoadBalancingConfig
  
  // 故障转移
  failover: FailoverConfig
  
  // 性能优化
  optimization: OptimizationConfig
}

// 负载均衡配置
interface LoadBalancingConfig {
  enabled: boolean
  algorithm: 'round_robin' | 'weighted' | 'least_connections' | 'response_time'
  weights?: Record<string, number>
  healthCheck: boolean
}

// 故障转移配置
interface FailoverConfig {
  enabled: boolean
  maxRetries: number
  retryDelay: number
  fallbackModels: string[]
  circuitBreaker: CircuitBreakerConfig
}

// 断路器配置
interface CircuitBreakerConfig {
  enabled: boolean
  failureThreshold: number
  recoveryTimeout: number
  halfOpenMaxCalls: number
}

// 优化配置
interface OptimizationConfig {
  caching: boolean
  batching: boolean
  compression: boolean
  parallelization: boolean
  adaptiveTimeout: boolean
}
```

## 📊 模型监控类型

### ModelMonitoring - 模型监控
```typescript
interface ModelMonitoring {
  // 健康检查
  healthCheck: HealthCheckConfig
  
  // 性能监控
  performanceMonitoring: PerformanceMonitoringConfig
  
  // 使用监控
  usageMonitoring: UsageMonitoringConfig
  
  // 告警配置
  alerting: AlertingConfig
}

// 健康检查配置
interface HealthCheckConfig {
  enabled: boolean
  interval: number
  timeout: number
  retries: number
  endpoints: HealthCheckEndpoint[]
}

// 健康检查端点
interface HealthCheckEndpoint {
  name: string
  url: string
  method: HttpMethod
  expectedStatus: number
  timeout: number
}

// 性能监控配置
interface PerformanceMonitoringConfig {
  enabled: boolean
  metrics: PerformanceMetric[]
  samplingRate: number
  aggregationWindow: number
  retention: number
}

// 性能指标
enum PerformanceMetric {
  RESPONSE_TIME = 'response_time',
  THROUGHPUT = 'throughput',
  ERROR_RATE = 'error_rate',
  TOKEN_RATE = 'token_rate',
  COST_RATE = 'cost_rate',
  QUALITY_SCORE = 'quality_score'
}

// 使用监控配置
interface UsageMonitoringConfig {
  enabled: boolean
  trackUsers: boolean
  trackSessions: boolean
  trackCosts: boolean
  aggregationLevel: 'request' | 'session' | 'user' | 'day'
}

// 告警配置
interface AlertingConfig {
  enabled: boolean
  rules: AlertRule[]
  channels: AlertChannel[]
  escalation: EscalationPolicy[]
}

// 告警规则
interface AlertRule {
  id: ID
  name: string
  metric: PerformanceMetric
  condition: AlertCondition
  threshold: number
  duration: number
  severity: 'low' | 'medium' | 'high' | 'critical'
}

// 告警条件
enum AlertCondition {
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CHANGE_RATE = 'change_rate'
}

// 告警渠道
interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms'
  config: Record<string, any>
  enabled: boolean
}

// 升级策略
interface EscalationPolicy {
  level: number
  delay: number
  channels: string[]
  conditions: string[]
}
```

## 🧪 模型测试类型

### ModelTesting - 模型测试
```typescript
interface ModelTesting {
  // 基准测试
  benchmark: BenchmarkConfig
  
  // A/B测试
  abTesting: ABTestConfig
  
  // 回归测试
  regressionTesting: RegressionTestConfig
  
  // 性能测试
  performanceTesting: PerformanceTestConfig
}

// 基准测试配置
interface BenchmarkConfig {
  enabled: boolean
  testSuites: TestSuite[]
  baseline: string
  metrics: BenchmarkMetric[]
  schedule: ScheduleConfig
}

// 测试套件
interface TestSuite {
  name: string
  description: string
  testCases: TestCase[]
  expectedResults: ExpectedResult[]
}

// 基准测试指标
enum BenchmarkMetric {
  ACCURACY = 'accuracy',
  RESPONSE_TIME = 'response_time',
  THROUGHPUT = 'throughput',
  COST_EFFICIENCY = 'cost_efficiency',
  QUALITY_SCORE = 'quality_score'
}

// A/B测试配置
interface ABTestConfig {
  enabled: boolean
  experiments: ABExperiment[]
  trafficSplit: TrafficSplit
  duration: number
  successMetrics: string[]
}

// A/B实验
interface ABExperiment {
  id: ID
  name: string
  description: string
  controlModel: string
  treatmentModel: string
  hypothesis: string
  status: ExperimentStatus
}

// 实验状态
enum ExperimentStatus {
  DRAFT = 'draft',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// 流量分配
interface TrafficSplit {
  control: number
  treatment: number
  rampUp?: RampUpConfig
}

// 渐进式发布配置
interface RampUpConfig {
  enabled: boolean
  initialPercentage: number
  incrementPercentage: number
  incrementInterval: number
  maxPercentage: number
}
```

## 📚 相关文档

- [核心类型](./core.md) - 基础类型定义
- [任务类型](./task.md) - 任务相关类型
- [配置类型](./config.md) - 配置相关类型
- [AI编排器 API](../ai-orchestrator.md) - AI模型管理接口
