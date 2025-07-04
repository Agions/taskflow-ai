/**
 * 输入验证系统
 * 提供类型安全的输入验证和清理功能
 */

import { ValidationError } from '../error-handling/typed-errors';
import { JSONValue, JSONObject } from '../../types/strict-types';

/**
 * 验证规则接口
 */
export interface ValidationRule {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'email' | 'url' | 'path';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: JSONValue[];
  custom?: (value: JSONValue) => boolean | string;
  sanitize?: boolean;
}

/**
 * 验证结果接口
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: JSONValue;
}

/**
 * 输入验证器类
 */
export class InputValidator {
  private static readonly EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly URL_PATTERN = /^https?:\/\/[^\s/$.?#].[^\s]*$/;
  private static readonly PATH_PATTERN = /^[a-zA-Z0-9._/-]+$/;

  /**
   * 验证单个值
   */
  public static validate(value: JSONValue, rule: ValidationRule): ValidationResult {
    const errors: string[] = [];
    let sanitizedValue = value;

    // 检查必填项
    if (rule.required && (value === null || value === undefined || value === '')) {
      errors.push('此字段为必填项');
      return { isValid: false, errors };
    }

    // 如果值为空且非必填，直接返回有效
    if (!rule.required && (value === null || value === undefined || value === '')) {
      return { isValid: true, errors: [], sanitizedValue: value };
    }

    // 类型验证
    const typeValidation = this.validateType(value, rule.type);
    if (!typeValidation.isValid) {
      errors.push(...typeValidation.errors);
    } else {
      sanitizedValue = typeValidation.sanitizedValue || value;
    }

    // 长度/范围验证
    if (rule.min !== undefined || rule.max !== undefined) {
      const rangeValidation = this.validateRange(sanitizedValue, rule.min, rule.max, rule.type);
      if (!rangeValidation.isValid) {
        errors.push(...rangeValidation.errors);
      }
    }

    // 正则表达式验证
    if (rule.pattern && typeof sanitizedValue === 'string') {
      if (!rule.pattern.test(sanitizedValue)) {
        errors.push('格式不正确');
      }
    }

    // 枚举值验证
    if (rule.enum && rule.enum.length > 0) {
      if (!rule.enum.includes(sanitizedValue)) {
        errors.push(`值必须是以下之一: ${rule.enum.join(', ')}`);
      }
    }

    // 自定义验证
    if (rule.custom) {
      const customResult = rule.custom(sanitizedValue);
      if (customResult !== true) {
        errors.push(typeof customResult === 'string' ? customResult : '自定义验证失败');
      }
    }

    // 清理处理
    if (rule.sanitize && typeof sanitizedValue === 'string') {
      sanitizedValue = this.sanitizeString(sanitizedValue);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue
    };
  }

  /**
   * 验证对象
   */
  public static validateObject(
    obj: JSONObject,
    schema: Record<string, ValidationRule>
  ): { isValid: boolean; errors: Record<string, string[]>; sanitizedObject?: JSONObject } {
    const errors: Record<string, string[]> = {};
    const sanitizedObject: JSONObject = {};
    let isValid = true;

    for (const [key, rule] of Object.entries(schema)) {
      const value = obj[key];
      const result = this.validate(value, rule);

      if (!result.isValid) {
        errors[key] = result.errors;
        isValid = false;
      } else {
        sanitizedObject[key] = result.sanitizedValue ?? value;
      }
    }

    return { isValid, errors, sanitizedObject: isValid ? sanitizedObject : undefined };
  }

  /**
   * 类型验证
   */
  private static validateType(value: JSONValue, type: ValidationRule['type']): ValidationResult {
    const errors: string[] = [];
    let sanitizedValue = value;

    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push('必须是字符串类型');
        }
        break;

      case 'number':
        if (typeof value === 'string' && !isNaN(Number(value))) {
          sanitizedValue = Number(value);
        } else if (typeof value !== 'number' || isNaN(value)) {
          errors.push('必须是有效的数字');
        }
        break;

      case 'boolean':
        if (typeof value === 'string') {
          if (value.toLowerCase() === 'true') {
            sanitizedValue = true;
          } else if (value.toLowerCase() === 'false') {
            sanitizedValue = false;
          } else {
            errors.push('必须是布尔值 (true/false)');
          }
        } else if (typeof value !== 'boolean') {
          errors.push('必须是布尔值');
        }
        break;

      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          errors.push('必须是对象类型');
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          errors.push('必须是数组类型');
        }
        break;

      case 'email':
        if (typeof value !== 'string' || !this.EMAIL_PATTERN.test(value)) {
          errors.push('必须是有效的邮箱地址');
        }
        break;

      case 'url':
        if (typeof value !== 'string' || !this.URL_PATTERN.test(value)) {
          errors.push('必须是有效的URL地址');
        }
        break;

      case 'path':
        if (typeof value !== 'string' || !this.PATH_PATTERN.test(value)) {
          errors.push('必须是有效的路径');
        }
        break;

      default:
        errors.push('未知的验证类型');
    }

    return { isValid: errors.length === 0, errors, sanitizedValue };
  }

  /**
   * 范围验证
   */
  private static validateRange(
    value: JSONValue,
    min?: number,
    max?: number,
    type?: ValidationRule['type']
  ): ValidationResult {
    const errors: string[] = [];

    if (type === 'string' && typeof value === 'string') {
      if (min !== undefined && value.length < min) {
        errors.push(`长度不能少于${min}个字符`);
      }
      if (max !== undefined && value.length > max) {
        errors.push(`长度不能超过${max}个字符`);
      }
    } else if (type === 'number' && typeof value === 'number') {
      if (min !== undefined && value < min) {
        errors.push(`值不能小于${min}`);
      }
      if (max !== undefined && value > max) {
        errors.push(`值不能大于${max}`);
      }
    } else if (type === 'array' && Array.isArray(value)) {
      if (min !== undefined && value.length < min) {
        errors.push(`数组长度不能少于${min}`);
      }
      if (max !== undefined && value.length > max) {
        errors.push(`数组长度不能超过${max}`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * 字符串清理
   */
  private static sanitizeString(value: string): string {
    return value
      .trim()
      .replace(/[<>]/g, '') // 移除潜在的HTML标签
      .replace(/['"]/g, '') // 移除引号
      .replace(/\s+/g, ' '); // 规范化空白字符
  }

  /**
   * 验证装饰器
   */
  public static validateInput(schema: Record<string, ValidationRule>) {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;

      descriptor.value = function(input: JSONObject, ...args: any[]) {
        const validation = InputValidator.validateObject(input, schema);
        
        if (!validation.isValid) {
          const errorMessages = Object.entries(validation.errors)
            .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
            .join('; ');
          
          throw new ValidationError(
            `输入验证失败: ${errorMessages}`,
            Object.keys(validation.errors)[0],
            input
          );
        }

        return originalMethod.call(this, validation.sanitizedObject, ...args);
      };

      return descriptor;
    };
  }
}

/**
 * 常用验证规则
 */
export const CommonValidationRules = {
  projectName: {
    type: 'string' as const,
    required: true,
    min: 1,
    max: 100,
    pattern: /^[a-zA-Z0-9_-]+$/,
    sanitize: true
  },

  email: {
    type: 'email' as const,
    required: true,
    sanitize: true
  },

  url: {
    type: 'url' as const,
    required: false,
    sanitize: true
  },

  apiKey: {
    type: 'string' as const,
    required: true,
    min: 10,
    max: 200,
    pattern: /^[a-zA-Z0-9_-]+$/
  },

  language: {
    type: 'string' as const,
    required: true,
    enum: ['typescript', 'javascript', 'python', 'java', 'go', 'rust', 'csharp', 'php']
  },

  projectType: {
    type: 'string' as const,
    required: true,
    enum: ['web-app', 'api', 'mobile-app', 'ai-ml']
  },

  filePath: {
    type: 'path' as const,
    required: true,
    min: 1,
    max: 500
  },

  port: {
    type: 'number' as const,
    required: false,
    min: 1,
    max: 65535
  },

  timeout: {
    type: 'number' as const,
    required: false,
    min: 100,
    max: 300000
  }
};

/**
 * 快速验证函数
 */
export function validateProjectName(name: string): void {
  const result = InputValidator.validate(name, CommonValidationRules.projectName);
  if (!result.isValid) {
    throw new ValidationError(`项目名称无效: ${result.errors.join(', ')}`, 'projectName', name);
  }
}

export function validateEmail(email: string): void {
  const result = InputValidator.validate(email, CommonValidationRules.email);
  if (!result.isValid) {
    throw new ValidationError(`邮箱地址无效: ${result.errors.join(', ')}`, 'email', email);
  }
}

export function validateApiKey(apiKey: string): void {
  const result = InputValidator.validate(apiKey, CommonValidationRules.apiKey);
  if (!result.isValid) {
    throw new ValidationError(`API密钥无效: ${result.errors.join(', ')}`, 'apiKey', '[REDACTED]');
  }
}

/**
 * 安全字符串清理
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // 移除HTML标签
    .replace(/['"]/g, '') // 移除引号
    .replace(/[;&|`$]/g, '') // 移除命令注入字符
    .trim();
}

/**
 * SQL注入防护
 */
export function escapeSql(input: string): string {
  return input.replace(/'/g, "''").replace(/;/g, '');
}

/**
 * XSS防护
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
