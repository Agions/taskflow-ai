/**
 * 配置相关类型定义
 */

/**
 * 模型类型枚举
 */
export enum ModelType {
  BAIDU = 'baidu',
  XUNFEI = 'xunfei',
  ZHIPU = 'zhipu',
  DEEPSEEK = 'deepseek',
  QWEN = 'qwen',
  SPARK = 'spark',
  MOONSHOT = 'moonshot',
}

/**
 * 日志级别
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

/**
 * 通用模型配置接口
 */
export interface ModelConfig {
  apiKey: string;
  endpoint?: string;
}

/**
 * 百度文心模型配置
 */
export interface BaiduModelConfig extends ModelConfig {
  secretKey: string;
  modelVersion?: string;
}

/**
 * 讯飞星火模型配置
 */
export interface XunfeiModelConfig extends ModelConfig {
  appId: string;
  apiSecret: string;
}

/**
 * 智谱AI模型配置
 */
export interface ZhipuModelConfig extends ModelConfig {
  modelVersion?: string;
}

/**
 * DeepSeek模型配置
 */
export interface DeepseekModelConfig extends ModelConfig {
  modelVersion?: string;
}

/**
 * 阿里通义千问模型配置
 */
export interface QwenModelConfig extends ModelConfig {
  modelVersion?: string;
  region?: string;
}

/**
 * 讯飞星火模型配置（扩展版）
 */
export interface SparkModelConfig extends ModelConfig {
  appId: string;
  apiSecret: string;
  domain?: string;
}

/**
 * 月之暗面模型配置
 */
export interface MoonshotModelConfig extends ModelConfig {
  modelVersion?: string;
}

/**
 * 多模型协作配置
 */
export interface MultiModelConfig {
  enabled: boolean;
  primary: ModelType;
  fallback: ModelType[];
  loadBalancing: boolean;
  costOptimization: boolean;
}

/**
 * 所有模型配置映射
 */
export interface ModelsConfig {
  default: ModelType;
  multiModel?: MultiModelConfig;
  [ModelType.BAIDU]?: BaiduModelConfig;
  [ModelType.XUNFEI]?: XunfeiModelConfig;
  [ModelType.ZHIPU]?: ZhipuModelConfig;
  [ModelType.DEEPSEEK]?: DeepseekModelConfig;
  [ModelType.QWEN]?: QwenModelConfig;
  [ModelType.SPARK]?: SparkModelConfig;
  [ModelType.MOONSHOT]?: MoonshotModelConfig;
}

/**
 * 任务设置配置
 */
export interface TaskSettings {
  outputDir: string;
  autoSave: boolean;
  saveInterval: number;
}

/**
 * 测试配置
 */
export interface TestSettings {
  framework: string;
  outputDir: string;
  coverage: boolean;
}

/**
 * 日志配置
 */
export interface LoggerConfig {
  level: LogLevel;
  output: 'console' | 'file' | 'both';
  file?: string;
}

/**
 * 完整应用配置
 */
export interface AppConfig {
  models: ModelsConfig;
  taskSettings: TaskSettings;
  testSettings: TestSettings;
  logger: LoggerConfig;
}

/**
 * 默认配置
 */
export const DEFAULT_CONFIG: AppConfig = {
  models: {
    default: ModelType.BAIDU,
  },
  taskSettings: {
    outputDir: './tasks',
    autoSave: true,
    saveInterval: 300,
  },
  testSettings: {
    framework: 'jest',
    outputDir: './tests',
    coverage: true,
  },
  logger: {
    level: LogLevel.INFO,
    output: 'console',
  },
}; 