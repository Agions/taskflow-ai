/**
 * Validation Utils - 验证工具
 * TaskFlow AI v4.0
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface TypeSchema {
  [key: string]: string;
}

export class ValidationUtils {
  /**
   * 验证邮箱
   */
  static isEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证 URL
   */
  static isURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 验证 JSON
   */
  static isJSON(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 验证文件路径
   */
  static isValidPath(path: string): boolean {
    if (!path || path.length === 0) return false;
    if (path.includes('..')) return false;
    if (path.includes('\0')) return false;
    return true;
  }

  /**
   * 验证端口号
   */
  static isValidPort(port: number): boolean {
    return Number.isInteger(port) && port >= 1 && port <= 65535;
  }

  /**
   * 验证 IP 地址
   */
  static isIP(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
      return false;
    }

    // Check IPv4 octets
    if (ipv4Regex.test(ip)) {
      const octets = ip.split('.');
      for (const octet of octets) {
        if (parseInt(octet, 10) > 255) return false;
      }
    }

    return true;
  }

  /**
   * 验证必填字段
   */
  static validateRequired(obj: Record<string, unknown>, required: string[]): ValidationResult {
    const errors: string[] = [];

    for (const field of required) {
      if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
        errors.push(`Field '${field}' is required`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证字段类型
   */
  static validateTypes(obj: Record<string, unknown>, schema: TypeSchema): ValidationResult {
    const errors: string[] = [];

    for (const [field, expectedType] of Object.entries(schema)) {
      const value = obj[field];

      if (value === undefined || value === null) return;

      const actualType = typeof value;
      if (actualType !== expectedType) {
        errors.push(`Field '${field}' expected ${expectedType}, got ${actualType}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证对象结构
   */
  static validateStructure(
    obj: Record<string, unknown>,
    schema: Record<string, unknown>
  ): ValidationResult {
    const errors: string[] = [];

    for (const [key, expected] of Object.entries(schema)) {
      const actual = obj[key];
      const expectedType = typeof expected;

      if (actual === undefined || actual === null) {
        errors.push(`Missing required field: '${key}'`);
        continue;
      }

      const actualType = typeof actual;
      if (actualType !== expectedType) {
        errors.push(`Field '${key}' expected ${expectedType}, got ${actualType}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证数组元素
   */
  static validateArray<T>(
    arr: T[],
    validator: (item: T) => boolean
  ): ValidationResult {
    const errors: string[] = [];

    arr.forEach((item, index) => {
      if (!validator(item)) {
        errors.push(`Item at index ${index} failed validation`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证数字范围
   */
  static isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  /**
   * 验证字符串长度
   */
  static isLength(str: string, min: number, max: number): boolean {
    return str.length >= min && str.length <= max;
  }

  /**
   * 验证正则表达式
   */
  static matchesPattern(str: string, pattern: RegExp): boolean {
    return pattern.test(str);
  }
}
