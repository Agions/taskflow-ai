/**
 * 配置验证器
 * 提供配置文件的结构化验证和错误报告
 */

import { JSONValue, JSONObject } from '../../types/strict-types';
import { ValidationError } from '../error-handling/typed-errors';
import { ErrorType, createStandardError } from '../error-handling/error-registry';

/**
 * 配置验证规则接口
 */
export interface ConfigValidationRule {
  required?: boolean;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: JSONValue[];
  default?: JSONValue;
  description: string;
  example?: JSONValue;
  deprecated?: boolean;
  deprecationMessage?: string;
}

/**
 * 配置模式接口
 */
export interface ConfigSchema {
  [key: string]: ConfigValidationRule | ConfigSchema;
}

/**
 * 验证结果接口
 */
export interface ConfigValidationResult {
  isValid: boolean;
  errors: ConfigValidationError[];
  warnings: ConfigValidationWarning[];
  normalizedConfig?: JSONObject;
}

/**
 * 配置验证错误接口
 */
export interface ConfigValidationError {
  path: string;
  message: string;
  value?: JSONValue;
  rule?: ConfigValidationRule;
}

/**
 * 配置验证警告接口
 */
export interface ConfigValidationWarning {
  path: string;
  message: string;
  value?: JSONValue;
  suggestion?: string;
}

/**
 * 配置验证器类
 */
export class ConfigValidator {
  private schema: ConfigSchema;

  constructor(schema: ConfigSchema) {
    this.schema = schema;
  }

  /**
   * 验证配置对象
   */
  public validate(config: JSONObject): ConfigValidationResult {
    const errors: ConfigValidationError[] = [];
    const warnings: ConfigValidationWarning[] = [];
    const normalizedConfig: JSONObject = {};

    this.validateObject(config, this.schema, '', errors, warnings, normalizedConfig);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      normalizedConfig: errors.length === 0 ? normalizedConfig : undefined
    };
  }

  /**
   * 验证对象
   */
  private validateObject(
    obj: JSONObject,
    schema: ConfigSchema,
    basePath: string,
    errors: ConfigValidationError[],
    warnings: ConfigValidationWarning[],
    normalized: JSONObject
  ): void {
    // 检查必需字段
    for (const [key, rule] of Object.entries(schema)) {
      const currentPath = basePath ? `${basePath}.${key}` : key;
      const value = obj[key];

      if (this.isValidationRule(rule)) {
        this.validateField(value, rule, currentPath, errors, warnings, normalized, key);
      } else {
        // 嵌套对象验证
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          const nestedNormalized: JSONObject = {};
          this.validateObject(value as JSONObject, rule, currentPath, errors, warnings, nestedNormalized);
          if (Object.keys(nestedNormalized).length > 0) {
            normalized[key] = nestedNormalized;
          }
        } else if (this.hasRequiredFields(rule)) {
          errors.push({
            path: currentPath,
            message: '缺少必需的配置对象',
            value
          });
        }
      }
    }

    // 检查未知字段
    for (const key of Object.keys(obj)) {
      if (!schema[key]) {
        const currentPath = basePath ? `${basePath}.${key}` : key;
        warnings.push({
          path: currentPath,
          message: '未知的配置字段',
          value: obj[key],
          suggestion: '请检查配置文档或移除此字段'
        });
      }
    }
  }

  /**
   * 验证单个字段
   */
  private validateField(
    value: JSONValue,
    rule: ConfigValidationRule,
    path: string,
    errors: ConfigValidationError[],
    warnings: ConfigValidationWarning[],
    normalized: JSONObject,
    key: string
  ): void {
    // 检查弃用警告
    if (rule.deprecated) {
      warnings.push({
        path,
        message: rule.deprecationMessage || '此配置项已弃用',
        value,
        suggestion: '请查看文档了解替代方案'
      });
    }

    // 检查必需字段
    if (rule.required && (value === undefined || value === null)) {
      errors.push({
        path,
        message: '缺少必需的配置项',
        rule
      });
      return;
    }

    // 如果字段不是必需的且值为空，使用默认值
    if (!rule.required && (value === undefined || value === null)) {
      if (rule.default !== undefined) {
        normalized[key] = rule.default;
      }
      return;
    }

    // 类型验证
    if (!this.validateType(value, rule.type)) {
      errors.push({
        path,
        message: `类型错误: 期望 ${rule.type}, 实际 ${typeof value}`,
        value,
        rule
      });
      return;
    }

    // 范围验证
    if (rule.min !== undefined || rule.max !== undefined) {
      const rangeError = this.validateRange(value, rule);
      if (rangeError) {
        errors.push({
          path,
          message: rangeError,
          value,
          rule
        });
        return;
      }
    }

    // 正则表达式验证
    if (rule.pattern && typeof value === 'string') {
      if (!rule.pattern.test(value)) {
        errors.push({
          path,
          message: '格式不正确',
          value,
          rule
        });
        return;
      }
    }

    // 枚举值验证
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push({
        path,
        message: `值必须是以下之一: ${rule.enum.join(', ')}`,
        value,
        rule
      });
      return;
    }

    // 验证通过，添加到标准化配置
    normalized[key] = value;
  }

  /**
   * 验证类型
   */
  private validateType(value: JSONValue, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      default:
        return false;
    }
  }

  /**
   * 验证范围
   */
  private validateRange(value: JSONValue, rule: ConfigValidationRule): string | null {
    if (typeof value === 'string') {
      if (rule.min !== undefined && value.length < rule.min) {
        return `长度不能少于${rule.min}个字符`;
      }
      if (rule.max !== undefined && value.length > rule.max) {
        return `长度不能超过${rule.max}个字符`;
      }
    } else if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return `值不能小于${rule.min}`;
      }
      if (rule.max !== undefined && value > rule.max) {
        return `值不能大于${rule.max}`;
      }
    } else if (Array.isArray(value)) {
      if (rule.min !== undefined && value.length < rule.min) {
        return `数组长度不能少于${rule.min}`;
      }
      if (rule.max !== undefined && value.length > rule.max) {
        return `数组长度不能超过${rule.max}`;
      }
    }
    return null;
  }

  /**
   * 检查是否为验证规则
   */
  private isValidationRule(obj: any): obj is ConfigValidationRule {
    return obj && typeof obj === 'object' && 'type' in obj;
  }

  /**
   * 检查是否有必需字段
   */
  private hasRequiredFields(schema: ConfigSchema): boolean {
    return Object.values(schema).some(rule => 
      this.isValidationRule(rule) ? rule.required : this.hasRequiredFields(rule)
    );
  }

  /**
   * 生成配置文档
   */
  public generateDocumentation(): string {
    const lines: string[] = [];
    lines.push('# 配置文档\n');
    
    this.generateSchemaDoc(this.schema, '', lines);
    
    return lines.join('\n');
  }

  /**
   * 生成模式文档
   */
  private generateSchemaDoc(schema: ConfigSchema, prefix: string, lines: string[]): void {
    for (const [key, rule] of Object.entries(schema)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (this.isValidationRule(rule)) {
        lines.push(`## ${fullKey}`);
        lines.push(`**类型:** ${rule.type}`);
        lines.push(`**必需:** ${rule.required ? '是' : '否'}`);
        lines.push(`**描述:** ${rule.description}`);
        
        if (rule.default !== undefined) {
          lines.push(`**默认值:** \`${JSON.stringify(rule.default)}\``);
        }
        
        if (rule.example !== undefined) {
          lines.push(`**示例:** \`${JSON.stringify(rule.example)}\``);
        }
        
        if (rule.enum) {
          lines.push(`**可选值:** ${rule.enum.map(v => `\`${v}\``).join(', ')}`);
        }
        
        if (rule.min !== undefined || rule.max !== undefined) {
          const range = [];
          if (rule.min !== undefined) range.push(`最小: ${rule.min}`);
          if (rule.max !== undefined) range.push(`最大: ${rule.max}`);
          lines.push(`**范围:** ${range.join(', ')}`);
        }
        
        if (rule.deprecated) {
          lines.push(`**⚠️ 已弃用:** ${rule.deprecationMessage || '请使用替代方案'}`);
        }
        
        lines.push('');
      } else {
        lines.push(`## ${fullKey} (对象)`);
        lines.push('');
        this.generateSchemaDoc(rule, fullKey, lines);
      }
    }
  }
}

/**
 * TaskFlow AI 配置模式
 */
export const TaskFlowConfigSchema: ConfigSchema = {
  version: {
    type: 'string',
    required: true,
    pattern: /^\d+\.\d+\.\d+$/,
    description: '配置文件版本号',
    example: '1.0.0'
  },
  
  models: {
    deepseek: {
      apiKey: {
        type: 'string',
        required: false,
        min: 10,
        description: 'DeepSeek API密钥',
        example: 'sk-xxxxxxxxxxxxxxxx'
      },
      baseUrl: {
        type: 'string',
        required: false,
        pattern: /^https?:\/\/.+/,
        description: 'API基础URL',
        default: 'https://api.deepseek.com'
      }
    },
    
    zhipu: {
      apiKey: {
        type: 'string',
        required: false,
        min: 10,
        description: '智谱AI API密钥'
      }
    },
    
    qwen: {
      apiKey: {
        type: 'string',
        required: false,
        min: 10,
        description: '通义千问 API密钥'
      }
    }
  },
  
  logging: {
    level: {
      type: 'string',
      required: false,
      enum: ['debug', 'info', 'warn', 'error'],
      default: 'info',
      description: '日志级别'
    },
    
    output: {
      type: 'string',
      required: false,
      enum: ['console', 'file', 'both'],
      default: 'console',
      description: '日志输出方式'
    },
    
    file: {
      type: 'string',
      required: false,
      description: '日志文件路径',
      default: './logs/taskflow.log'
    }
  },
  
  performance: {
    enableMonitoring: {
      type: 'boolean',
      required: false,
      default: true,
      description: '启用性能监控'
    },
    
    cacheSize: {
      type: 'number',
      required: false,
      min: 10,
      max: 1000,
      default: 100,
      description: '缓存大小'
    }
  }
};

/**
 * 验证TaskFlow配置
 */
export function validateTaskFlowConfig(config: JSONObject): ConfigValidationResult {
  const validator = new ConfigValidator(TaskFlowConfigSchema);
  return validator.validate(config);
}

/**
 * 创建配置验证错误
 */
export function createConfigValidationError(
  message: string,
  path: string,
  value?: JSONValue
): ValidationError {
  return createStandardError(
    ErrorType.CONFIGURATION_ERROR,
    message,
    {
      source: 'config-validator',
      details: { path, value: value || null }
    }
  ) as ValidationError;
}
