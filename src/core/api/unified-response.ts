/**
 * 统一API响应格式
 * 标准化所有命令和服务的返回格式
 */

import { TaskFlowError } from '../error-handling/typed-errors';
import { JSONValue, JSONObject } from '../../types/strict-types';

/**
 * 统一响应接口
 */
export interface UnifiedResponse<T = JSONValue> {
  success: boolean;
  data?: T;
  error?: ErrorDetails;
  metadata: ResponseMetadata;
}

/**
 * 错误详情接口
 */
export interface ErrorDetails {
  code: string;
  message: string;
  details?: JSONObject;
  suggestions?: string[];
  documentation?: string;
}

/**
 * 响应元数据接口
 */
export interface ResponseMetadata {
  timestamp: string;
  requestId: string;
  version: string;
  executionTime: number;
  source: string;
}

/**
 * 分页响应接口
 */
export interface PaginatedResponse<T = JSONValue> extends UnifiedResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * 统一响应构建器
 */
export class ResponseBuilder {
  private static requestCounter = 0;
  private static readonly VERSION = '1.0.0';

  /**
   * 创建成功响应
   */
  public static success<T = JSONValue>(
    data: T,
    source: string,
    executionTime?: number
  ): UnifiedResponse<T> {
    return {
      success: true,
      data,
      metadata: this.createMetadata(source, executionTime)
    };
  }

  /**
   * 创建错误响应
   */
  public static error(
    error: TaskFlowError | Error | string,
    source: string,
    executionTime?: number
  ): UnifiedResponse<never> {
    const errorDetails = this.createErrorDetails(error);
    
    return {
      success: false,
      error: errorDetails,
      metadata: this.createMetadata(source, executionTime)
    };
  }

  /**
   * 创建分页响应
   */
  public static paginated<T = JSONValue>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    source: string,
    executionTime?: number
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit);
    
    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      metadata: this.createMetadata(source, executionTime)
    };
  }

  /**
   * 创建空响应
   */
  public static empty(
    source: string,
    message?: string,
    executionTime?: number
  ): UnifiedResponse<null> {
    return {
      success: true,
      data: null,
      metadata: {
        ...this.createMetadata(source, executionTime),
        message
      } as ResponseMetadata & { message?: string }
    };
  }

  /**
   * 创建响应元数据
   */
  private static createMetadata(
    source: string,
    executionTime?: number
  ): ResponseMetadata {
    return {
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId(),
      version: this.VERSION,
      executionTime: executionTime || 0,
      source
    };
  }

  /**
   * 创建错误详情
   */
  private static createErrorDetails(error: TaskFlowError | Error | string): ErrorDetails {
    if (error instanceof TaskFlowError) {
      return {
        code: error.code,
        message: error.message,
        details: error.context.details as JSONObject,
        suggestions: this.getSuggestions(error.code),
        documentation: this.getDocumentationLink(error.code)
      };
    }

    if (error instanceof Error) {
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message,
        suggestions: ['检查输入参数', '查看日志获取更多信息'],
        documentation: 'https://taskflow.ai/docs/errors'
      };
    }

    return {
      code: 'STRING_ERROR',
      message: String(error),
      suggestions: ['检查错误信息', '联系技术支持'],
      documentation: 'https://taskflow.ai/docs/errors'
    };
  }

  /**
   * 获取错误建议
   */
  private static getSuggestions(errorCode: string): string[] {
    const suggestions: Record<string, string[]> = {
      'VALIDATION_ERROR': [
        '检查输入参数格式',
        '确保必填字段已填写',
        '参考API文档中的参数说明'
      ],
      'CONFIGURATION_ERROR': [
        '检查配置文件格式',
        '确保所有必需的配置项已设置',
        '使用 taskflow config validate 验证配置'
      ],
      'NETWORK_ERROR': [
        '检查网络连接',
        '确认API端点可访问',
        '检查防火墙设置'
      ],
      'API_ERROR': [
        '检查API密钥是否有效',
        '确认API配额未超限',
        '查看API提供商的状态页面'
      ],
      'FILESYSTEM_ERROR': [
        '检查文件路径是否正确',
        '确认有足够的磁盘空间',
        '检查文件权限'
      ],
      'PARSE_ERROR': [
        '检查文件格式是否正确',
        '确认文件编码为UTF-8',
        '使用在线工具验证文件格式'
      ]
    };

    return suggestions[errorCode] || [
      '查看详细错误信息',
      '检查系统日志',
      '联系技术支持'
    ];
  }

  /**
   * 获取文档链接
   */
  private static getDocumentationLink(errorCode: string): string {
    const baseUrl = 'https://taskflow.ai/docs/errors';
    return `${baseUrl}#${errorCode.toLowerCase().replace('_', '-')}`;
  }

  /**
   * 生成请求ID
   */
  private static generateRequestId(): string {
    this.requestCounter++;
    const timestamp = Date.now().toString(36);
    const counter = this.requestCounter.toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `req_${timestamp}_${counter}_${random}`;
  }
}

/**
 * 命令执行结果接口
 */
export interface CommandResult<T = JSONValue> extends UnifiedResponse<T> {
  command: string;
  args: string[];
  exitCode: number;
}

/**
 * 命令响应构建器
 */
export class CommandResponseBuilder extends ResponseBuilder {
  /**
   * 创建命令成功响应
   */
  public static commandSuccess<T = JSONValue>(
    command: string,
    args: string[],
    data: T,
    executionTime?: number
  ): CommandResult<T> {
    const baseResponse = this.success(data, `command:${command}`, executionTime);
    
    return {
      ...baseResponse,
      command,
      args,
      exitCode: 0
    };
  }

  /**
   * 创建命令错误响应
   */
  public static commandError(
    command: string,
    args: string[],
    error: TaskFlowError | Error | string,
    exitCode = 1,
    executionTime?: number
  ): CommandResult<never> {
    const baseResponse = this.error(error, `command:${command}`, executionTime);
    
    return {
      ...baseResponse,
      command,
      args,
      exitCode
    };
  }
}

/**
 * 响应验证器
 */
export class ResponseValidator {
  /**
   * 验证响应格式
   */
  public static validate(response: unknown): response is UnifiedResponse {
    if (!response || typeof response !== 'object') {
      return false;
    }

    const resp = response as Record<string, unknown>;
    
    // 检查必需字段
    if (typeof resp.success !== 'boolean') {
      return false;
    }

    if (!resp.metadata || typeof resp.metadata !== 'object') {
      return false;
    }

    const metadata = resp.metadata as Record<string, unknown>;
    if (!metadata || typeof metadata !== 'object') {
      return false;
    }

    if (!metadata.timestamp || !metadata.requestId || !metadata.version || !metadata.source) {
      return false;
    }

    // 如果是错误响应，检查错误字段
    if (!resp.success) {
      if (!resp.error || typeof resp.error !== 'object') {
        return false;
      }

      const error = resp.error as Record<string, unknown>;
      if (!error.code || !error.message) {
        return false;
      }
    }

    return true;
  }

  /**
   * 验证分页响应格式
   */
  public static validatePaginated(response: unknown): response is PaginatedResponse {
    if (!this.validate(response)) {
      return false;
    }

    const resp = response as unknown as Record<string, unknown>;
    
    if (!resp.pagination || typeof resp.pagination !== 'object') {
      return false;
    }

    const pagination = resp.pagination;
    const requiredFields = ['page', 'limit', 'total', 'totalPages', 'hasNext', 'hasPrev'];
    
    return requiredFields.every(field => Object.prototype.hasOwnProperty.call(pagination, field));
  }
}

/**
 * 响应转换器
 */
export class ResponseTransformer {
  /**
   * 转换为CLI友好格式
   */
  public static toCLI(response: UnifiedResponse): string {
    if (response.success) {
      return JSON.stringify(response.data, null, 2);
    } else {
      const error = response.error!;
      let output = `错误 [${error.code}]: ${error.message}`;
      
      if (error.suggestions && error.suggestions.length > 0) {
        output += '\n\n建议:';
        error.suggestions.forEach((suggestion, index) => {
          output += `\n  ${index + 1}. ${suggestion}`;
        });
      }

      if (error.documentation) {
        output += `\n\n文档: ${error.documentation}`;
      }

      return output;
    }
  }

  /**
   * 转换为JSON格式
   */
  public static toJSON(response: UnifiedResponse): string {
    return JSON.stringify(response, null, 2);
  }

  /**
   * 转换为简化格式
   */
  public static toSimple(response: UnifiedResponse): JSONObject {
    if (response.success) {
      return {
        success: true,
        data: response.data || null
      };
    } else {
      return {
        success: false,
        error: response.error!.message
      };
    }
  }
}
