/**
 * MCP 服务错误处理器
 * 提供统一的错误处理、日志记录和用户反馈机制
 */

import { Logger } from '../infra/logger';
import { LogLevel } from '../types/config';

/**
 * MCP 错误类型枚举
 */
export enum MCPErrorType {
  // 连接错误
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  PROTOCOL_ERROR = 'PROTOCOL_ERROR',
  TIMEOUT = 'TIMEOUT',
  
  // 配置错误
  CONFIG_INVALID = 'CONFIG_INVALID',
  CONFIG_MISSING = 'CONFIG_MISSING',
  ENV_VAR_MISSING = 'ENV_VAR_MISSING',
  
  // API 错误
  API_KEY_INVALID = 'API_KEY_INVALID',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  API_QUOTA_EXCEEDED = 'API_QUOTA_EXCEEDED',
  API_SERVICE_UNAVAILABLE = 'API_SERVICE_UNAVAILABLE',
  
  // 业务逻辑错误
  INVALID_REQUEST = 'INVALID_REQUEST',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  // 系统错误
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  MEMORY_ERROR = 'MEMORY_ERROR',
  DISK_SPACE_ERROR = 'DISK_SPACE_ERROR'
}

/**
 * MCP 错误严重级别
 */
export enum MCPErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * MCP 错误接口
 */
export interface MCPError {
  type: MCPErrorType;
  severity: MCPErrorSeverity;
  message: string;
  details?: any;
  timestamp: Date;
  requestId?: string;
  userId?: string;
  context?: Record<string, any>;
  stack?: string;
}

/**
 * 错误恢复策略
 */
export interface ErrorRecoveryStrategy {
  canRecover: boolean;
  retryable: boolean;
  maxRetries?: number;
  retryDelay?: number;
  fallbackAction?: () => Promise<any>;
  userAction?: string;
}

/**
 * 用户友好的错误消息
 */
export interface UserFriendlyError {
  title: string;
  message: string;
  suggestion: string;
  actionRequired: boolean;
  helpUrl?: string;
}

/**
 * MCP 错误处理器类
 */
export class MCPErrorHandler {
  private logger: Logger;
  private errorCounts: Map<MCPErrorType, number> = new Map();
  private lastErrors: MCPError[] = [];
  private maxErrorHistory = 100;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * 处理错误
   */
  public handleError(error: Error | MCPError, context?: Record<string, any>): MCPError {
    let mcpError: MCPError;

    if (this.isMCPError(error)) {
      mcpError = error;
    } else {
      mcpError = this.convertToMCPError(error, context);
    }

    // 记录错误
    this.recordError(mcpError);

    // 记录日志
    this.logError(mcpError);

    // 更新错误统计
    this.updateErrorStats(mcpError);

    return mcpError;
  }

  /**
   * 获取错误恢复策略
   */
  public getRecoveryStrategy(error: MCPError): ErrorRecoveryStrategy {
    switch (error.type) {
      case MCPErrorType.CONNECTION_FAILED:
      case MCPErrorType.TIMEOUT:
        return {
          canRecover: true,
          retryable: true,
          maxRetries: 3,
          retryDelay: 1000,
          userAction: '检查网络连接并重试'
        };

      case MCPErrorType.API_RATE_LIMIT:
        return {
          canRecover: true,
          retryable: true,
          maxRetries: 5,
          retryDelay: 5000,
          userAction: '等待一段时间后重试'
        };

      case MCPErrorType.API_KEY_INVALID:
        return {
          canRecover: false,
          retryable: false,
          userAction: '检查并更新 API 密钥配置'
        };

      case MCPErrorType.CONFIG_MISSING:
      case MCPErrorType.ENV_VAR_MISSING:
        return {
          canRecover: false,
          retryable: false,
          userAction: '完善配置文件和环境变量'
        };

      case MCPErrorType.API_SERVICE_UNAVAILABLE:
        return {
          canRecover: true,
          retryable: true,
          maxRetries: 3,
          retryDelay: 10000,
          fallbackAction: async () => {
            // 尝试切换到备用模型
            return this.switchToFallbackModel();
          },
          userAction: '服务暂时不可用，已自动切换到备用模型'
        };

      default:
        return {
          canRecover: false,
          retryable: false,
          userAction: '请联系技术支持'
        };
    }
  }

  /**
   * 生成用户友好的错误消息
   */
  public generateUserFriendlyError(error: MCPError): UserFriendlyError {
    const errorMessages: Record<MCPErrorType, UserFriendlyError> = {
      [MCPErrorType.CONNECTION_FAILED]: {
        title: '连接失败',
        message: '无法连接到 TaskFlow AI 服务',
        suggestion: '请检查网络连接，确保防火墙允许访问，然后重试',
        actionRequired: true,
        helpUrl: 'https://docs.taskflow.ai/troubleshooting/connection'
      },

      [MCPErrorType.API_KEY_INVALID]: {
        title: 'API 密钥无效',
        message: '提供的 API 密钥无效或已过期',
        suggestion: '请检查 .env 文件中的 API 密钥配置，确保密钥正确且有效',
        actionRequired: true,
        helpUrl: 'https://docs.taskflow.ai/setup/api-keys'
      },

      [MCPErrorType.CONFIG_MISSING]: {
        title: '配置文件缺失',
        message: 'MCP 配置文件不存在或格式错误',
        suggestion: '运行 "taskflow init" 重新生成配置文件',
        actionRequired: true,
        helpUrl: 'https://docs.taskflow.ai/setup/configuration'
      },

      [MCPErrorType.CONFIG_INVALID]: {
        title: '配置文件无效',
        message: 'MCP 配置文件格式不正确或包含无效参数',
        suggestion: '请检查配置文件格式，或运行 "taskflow init --force" 重新生成',
        actionRequired: true,
        helpUrl: 'https://docs.taskflow.ai/setup/configuration'
      },

      [MCPErrorType.API_RATE_LIMIT]: {
        title: 'API 调用频率限制',
        message: 'API 调用过于频繁，已达到速率限制',
        suggestion: '请稍等片刻后重试，或考虑升级 API 套餐',
        actionRequired: false,
        helpUrl: 'https://docs.taskflow.ai/limits/rate-limits'
      },

      [MCPErrorType.API_QUOTA_EXCEEDED]: {
        title: 'API 配额已用完',
        message: '本月 API 调用配额已用完',
        suggestion: '请升级 API 套餐或等待下月配额重置',
        actionRequired: true,
        helpUrl: 'https://docs.taskflow.ai/billing/quotas'
      },

      [MCPErrorType.PROTOCOL_ERROR]: {
        title: 'MCP 协议错误',
        message: 'MCP 通信协议出现错误',
        suggestion: '请重启编辑器或更新 TaskFlow AI 到最新版本',
        actionRequired: true,
        helpUrl: 'https://docs.taskflow.ai/troubleshooting/protocol'
      },

      [MCPErrorType.INTERNAL_ERROR]: {
        title: '内部服务错误',
        message: 'TaskFlow AI 服务内部出现错误',
        suggestion: '这是一个临时问题，请稍后重试。如果问题持续，请联系技术支持',
        actionRequired: false,
        helpUrl: 'https://docs.taskflow.ai/support'
      },

      // 其他错误类型的默认处理
      [MCPErrorType.TIMEOUT]: {
        title: '请求超时',
        message: '请求处理时间过长',
        suggestion: '请检查网络连接并重试，或尝试简化请求内容',
        actionRequired: true
      },

      [MCPErrorType.ENV_VAR_MISSING]: {
        title: '环境变量缺失',
        message: '缺少必要的环境变量配置',
        suggestion: '请检查 .env 文件，确保所有必要的环境变量都已配置',
        actionRequired: true
      },

      [MCPErrorType.API_SERVICE_UNAVAILABLE]: {
        title: 'AI 服务不可用',
        message: '当前 AI 模型服务暂时不可用',
        suggestion: '已自动切换到备用模型，或请稍后重试',
        actionRequired: false
      },

      [MCPErrorType.INVALID_REQUEST]: {
        title: '请求格式错误',
        message: '请求参数格式不正确',
        suggestion: '请检查请求参数格式，确保符合 API 规范',
        actionRequired: true
      },

      [MCPErrorType.RESOURCE_NOT_FOUND]: {
        title: '资源未找到',
        message: '请求的资源不存在',
        suggestion: '请检查资源路径或 ID 是否正确',
        actionRequired: true
      },

      [MCPErrorType.PERMISSION_DENIED]: {
        title: '权限不足',
        message: '没有权限执行此操作',
        suggestion: '请检查 API 密钥权限或联系管理员',
        actionRequired: true
      },

      [MCPErrorType.MEMORY_ERROR]: {
        title: '内存不足',
        message: '系统内存不足，无法处理请求',
        suggestion: '请尝试简化请求或重启应用程序',
        actionRequired: true
      },

      [MCPErrorType.DISK_SPACE_ERROR]: {
        title: '磁盘空间不足',
        message: '磁盘空间不足，无法保存数据',
        suggestion: '请清理磁盘空间或更改存储位置',
        actionRequired: true
      }
    };

    return errorMessages[error.type] || {
      title: '未知错误',
      message: error.message,
      suggestion: '请联系技术支持获取帮助',
      actionRequired: true,
      helpUrl: 'https://docs.taskflow.ai/support'
    };
  }

  /**
   * 获取错误统计信息
   */
  public getErrorStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    this.errorCounts.forEach((count, type) => {
      stats[type] = count;
    });

    return {
      totalErrors: this.lastErrors.length,
      errorsByType: stats,
      recentErrors: this.lastErrors.slice(-10),
      errorRate: this.calculateErrorRate()
    };
  }

  /**
   * 清除错误历史
   */
  public clearErrorHistory(): void {
    this.lastErrors = [];
    this.errorCounts.clear();
  }

  /**
   * 检查是否为 MCP 错误
   */
  private isMCPError(error: any): error is MCPError {
    return error && typeof error === 'object' && 'type' in error && 'severity' in error;
  }

  /**
   * 转换为 MCP 错误
   */
  private convertToMCPError(error: Error, context?: Record<string, any>): MCPError {
    let type = MCPErrorType.INTERNAL_ERROR;
    let severity = MCPErrorSeverity.MEDIUM;

    // 根据错误消息推断错误类型
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('connection')) {
      type = MCPErrorType.CONNECTION_FAILED;
      severity = MCPErrorSeverity.HIGH;
    } else if (message.includes('timeout')) {
      type = MCPErrorType.TIMEOUT;
      severity = MCPErrorSeverity.MEDIUM;
    } else if (message.includes('api key') || message.includes('unauthorized')) {
      type = MCPErrorType.API_KEY_INVALID;
      severity = MCPErrorSeverity.HIGH;
    } else if (message.includes('rate limit')) {
      type = MCPErrorType.API_RATE_LIMIT;
      severity = MCPErrorSeverity.LOW;
    } else if (message.includes('quota')) {
      type = MCPErrorType.API_QUOTA_EXCEEDED;
      severity = MCPErrorSeverity.HIGH;
    }

    return {
      type,
      severity,
      message: error.message,
      details: context,
      timestamp: new Date(),
      stack: error.stack
    };
  }

  /**
   * 记录错误
   */
  private recordError(error: MCPError): void {
    this.lastErrors.push(error);
    
    // 保持错误历史在限制范围内
    if (this.lastErrors.length > this.maxErrorHistory) {
      this.lastErrors = this.lastErrors.slice(-this.maxErrorHistory);
    }
  }

  /**
   * 记录错误日志
   */
  private logError(error: MCPError): void {
    const logLevel = this.getLogLevel(error.severity);
    const logMessage = `[MCP Error] ${error.type}: ${error.message}`;
    
    this.logger.log(logLevel, logMessage, {
      type: error.type,
      severity: error.severity,
      details: error.details,
      requestId: error.requestId,
      userId: error.userId,
      context: error.context,
      timestamp: error.timestamp
    });
  }

  /**
   * 更新错误统计
   */
  private updateErrorStats(error: MCPError): void {
    const currentCount = this.errorCounts.get(error.type) || 0;
    this.errorCounts.set(error.type, currentCount + 1);
  }

  /**
   * 获取日志级别
   */
  private getLogLevel(severity: MCPErrorSeverity): LogLevel {
    switch (severity) {
      case MCPErrorSeverity.LOW:
        return LogLevel.WARN;
      case MCPErrorSeverity.MEDIUM:
        return LogLevel.ERROR;
      case MCPErrorSeverity.HIGH:
      case MCPErrorSeverity.CRITICAL:
        return LogLevel.ERROR;
      default:
        return LogLevel.ERROR;
    }
  }

  /**
   * 计算错误率
   */
  private calculateErrorRate(): number {
    const recentErrors = this.lastErrors.filter(
      error => Date.now() - error.timestamp.getTime() < 3600000 // 最近1小时
    );
    
    return recentErrors.length;
  }

  /**
   * 切换到备用模型
   */
  private async switchToFallbackModel(): Promise<string> {
    // 这里实现切换到备用模型的逻辑
    return 'switched to fallback model';
  }
}
