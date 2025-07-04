/**
 * 错误注册中心
 * 统一管理所有错误类型和错误处理策略
 */

import { TaskFlowError, ErrorContext } from './typed-errors';

/**
 * 错误类型枚举
 */
export enum ErrorType {
  // 验证错误
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  
  // 网络错误
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // 文件系统错误
  FILESYSTEM_ERROR = 'FILESYSTEM_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  
  // 解析错误
  PARSE_ERROR = 'PARSE_ERROR',
  FORMAT_ERROR = 'FORMAT_ERROR',
  
  // 业务逻辑错误
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  
  // 系统错误
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  MEMORY_ERROR = 'MEMORY_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * 错误严重级别
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * 错误恢复策略
 */
export enum RecoveryStrategy {
  NONE = 'none',
  RETRY = 'retry',
  FALLBACK = 'fallback',
  USER_INPUT = 'user_input',
  GRACEFUL_DEGRADATION = 'graceful_degradation'
}

/**
 * 错误定义接口
 */
export interface ErrorDefinition {
  type: ErrorType;
  severity: ErrorSeverity;
  recoveryStrategy: RecoveryStrategy;
  userMessage: string;
  technicalMessage: string;
  suggestions: string[];
  documentationUrl?: string;
  retryable: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * 错误注册中心类
 */
export class ErrorRegistry {
  private static instance: ErrorRegistry;
  private errorDefinitions = new Map<ErrorType, ErrorDefinition>();

  private constructor() {
    this.initializeDefaultErrors();
  }

  public static getInstance(): ErrorRegistry {
    if (!ErrorRegistry.instance) {
      ErrorRegistry.instance = new ErrorRegistry();
    }
    return ErrorRegistry.instance;
  }

  /**
   * 注册错误定义
   */
  public registerError(definition: ErrorDefinition): void {
    this.errorDefinitions.set(definition.type, definition);
  }

  /**
   * 获取错误定义
   */
  public getErrorDefinition(type: ErrorType): ErrorDefinition | undefined {
    return this.errorDefinitions.get(type);
  }

  /**
   * 创建标准化错误
   */
  public createError(
    type: ErrorType,
    message: string,
    context?: Partial<ErrorContext>
  ): TaskFlowError {
    const definition = this.getErrorDefinition(type);
    
    if (!definition) {
      const defaultContext: ErrorContext = {
        timestamp: new Date().toISOString(),
        source: context?.source || 'unknown',
        details: context?.details || {},
        stackTrace: new Error().stack
      };
      return new TaskFlowError(
        message,
        ErrorType.UNKNOWN_ERROR,
        defaultContext
      );
    }

    const errorContext: ErrorContext = {
      timestamp: new Date().toISOString(),
      source: context?.source || 'unknown',
      details: context?.details || {},
      stackTrace: new Error().stack,
      ...context
    };

    return new TaskFlowError(message, type, errorContext);
  }

  /**
   * 获取错误恢复建议
   */
  public getRecoveryActions(type: ErrorType): string[] {
    const definition = this.getErrorDefinition(type);
    return definition?.suggestions || [
      '检查输入参数',
      '查看日志获取更多信息',
      '联系技术支持'
    ];
  }

  /**
   * 检查错误是否可重试
   */
  public isRetryable(type: ErrorType): boolean {
    const definition = this.getErrorDefinition(type);
    return definition?.retryable || false;
  }

  /**
   * 获取最大重试次数
   */
  public getMaxRetries(type: ErrorType): number {
    const definition = this.getErrorDefinition(type);
    return definition?.maxRetries || 0;
  }

  /**
   * 获取重试延迟
   */
  public getRetryDelay(type: ErrorType): number {
    const definition = this.getErrorDefinition(type);
    return definition?.retryDelay || 1000;
  }

  /**
   * 初始化默认错误定义
   */
  private initializeDefaultErrors(): void {
    // 验证错误
    this.registerError({
      type: ErrorType.VALIDATION_ERROR,
      severity: ErrorSeverity.MEDIUM,
      recoveryStrategy: RecoveryStrategy.USER_INPUT,
      userMessage: '输入数据验证失败',
      technicalMessage: 'Input validation failed',
      suggestions: [
        '检查输入参数格式',
        '确保必填字段已填写',
        '参考API文档中的参数说明'
      ],
      documentationUrl: 'https://taskflow.ai/docs/validation',
      retryable: false
    });

    // 配置错误
    this.registerError({
      type: ErrorType.CONFIGURATION_ERROR,
      severity: ErrorSeverity.HIGH,
      recoveryStrategy: RecoveryStrategy.USER_INPUT,
      userMessage: '配置错误',
      technicalMessage: 'Configuration error',
      suggestions: [
        '检查配置文件格式',
        '确保所有必需的配置项已设置',
        '使用 taskflow config validate 验证配置'
      ],
      documentationUrl: 'https://taskflow.ai/docs/configuration',
      retryable: false
    });

    // 网络错误
    this.registerError({
      type: ErrorType.NETWORK_ERROR,
      severity: ErrorSeverity.MEDIUM,
      recoveryStrategy: RecoveryStrategy.RETRY,
      userMessage: '网络连接失败',
      technicalMessage: 'Network connection failed',
      suggestions: [
        '检查网络连接',
        '确认API端点可访问',
        '检查防火墙设置'
      ],
      retryable: true,
      maxRetries: 3,
      retryDelay: 2000
    });

    // API错误
    this.registerError({
      type: ErrorType.API_ERROR,
      severity: ErrorSeverity.MEDIUM,
      recoveryStrategy: RecoveryStrategy.FALLBACK,
      userMessage: 'API调用失败',
      technicalMessage: 'API call failed',
      suggestions: [
        '检查API密钥是否有效',
        '确认API配额未超限',
        '查看API提供商的状态页面'
      ],
      retryable: true,
      maxRetries: 2,
      retryDelay: 5000
    });

    // 文件系统错误
    this.registerError({
      type: ErrorType.FILESYSTEM_ERROR,
      severity: ErrorSeverity.MEDIUM,
      recoveryStrategy: RecoveryStrategy.USER_INPUT,
      userMessage: '文件操作失败',
      technicalMessage: 'File system operation failed',
      suggestions: [
        '检查文件路径是否正确',
        '确认有足够的磁盘空间',
        '检查文件权限'
      ],
      retryable: false
    });

    // 解析错误
    this.registerError({
      type: ErrorType.PARSE_ERROR,
      severity: ErrorSeverity.MEDIUM,
      recoveryStrategy: RecoveryStrategy.USER_INPUT,
      userMessage: '文档解析失败',
      technicalMessage: 'Document parsing failed',
      suggestions: [
        '检查文件格式是否正确',
        '确认文件编码为UTF-8',
        '使用在线工具验证文件格式'
      ],
      retryable: false
    });

    // 系统错误
    this.registerError({
      type: ErrorType.SYSTEM_ERROR,
      severity: ErrorSeverity.CRITICAL,
      recoveryStrategy: RecoveryStrategy.GRACEFUL_DEGRADATION,
      userMessage: '系统内部错误',
      technicalMessage: 'Internal system error',
      suggestions: [
        '重启应用程序',
        '检查系统资源使用情况',
        '联系技术支持'
      ],
      retryable: true,
      maxRetries: 1,
      retryDelay: 10000
    });

    // 未知错误
    this.registerError({
      type: ErrorType.UNKNOWN_ERROR,
      severity: ErrorSeverity.HIGH,
      recoveryStrategy: RecoveryStrategy.NONE,
      userMessage: '发生未知错误',
      technicalMessage: 'Unknown error occurred',
      suggestions: [
        '查看详细错误信息',
        '检查系统日志',
        '联系技术支持'
      ],
      retryable: false
    });
  }

  /**
   * 获取所有错误类型
   */
  public getAllErrorTypes(): ErrorType[] {
    return Array.from(this.errorDefinitions.keys());
  }

  /**
   * 获取错误统计信息
   */
  public getErrorStats(): {
    totalTypes: number;
    retryableTypes: number;
    severityDistribution: Record<ErrorSeverity, number>;
  } {
    const definitions = Array.from(this.errorDefinitions.values());
    
    const severityDistribution = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 0,
      [ErrorSeverity.HIGH]: 0,
      [ErrorSeverity.CRITICAL]: 0
    };

    let retryableTypes = 0;

    definitions.forEach(def => {
      severityDistribution[def.severity]++;
      if (def.retryable) {
        retryableTypes++;
      }
    });

    return {
      totalTypes: definitions.length,
      retryableTypes,
      severityDistribution
    };
  }
}

/**
 * 便捷函数
 */
export function getErrorRegistry(): ErrorRegistry {
  return ErrorRegistry.getInstance();
}

/**
 * 创建标准化错误
 */
export function createStandardError(
  type: ErrorType,
  message: string,
  context?: Partial<ErrorContext>
): TaskFlowError {
  return getErrorRegistry().createError(type, message, context);
}
