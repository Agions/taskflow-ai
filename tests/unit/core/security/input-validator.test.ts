/**
 * 输入验证系统单元测试
 */

import { 
  InputValidator, 
  ValidationRule, 
  CommonValidationRules,
  validateProjectName,
  validateEmail,
  validateApiKey,
  sanitizeInput,
  escapeSql,
  escapeHtml
} from '../../../../src/core/security/input-validator';
import { ValidationError } from '../../../../src/core/error-handling/typed-errors';

describe('InputValidator Unit Tests', () => {
  describe('基本类型验证', () => {
    it('应该验证字符串类型', () => {
      const rule: ValidationRule = { type: 'string', required: true };
      
      const validResult = InputValidator.validate('test string', rule);
      expect(validResult.isValid).toBe(true);
      expect(validResult.sanitizedValue).toBe('test string');
      
      const invalidResult = InputValidator.validate(123, rule);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('必须是字符串类型');
    });

    it('应该验证数字类型', () => {
      const rule: ValidationRule = { type: 'number', required: true };
      
      const validResult = InputValidator.validate(42, rule);
      expect(validResult.isValid).toBe(true);
      expect(validResult.sanitizedValue).toBe(42);
      
      const stringNumberResult = InputValidator.validate('123', rule);
      expect(stringNumberResult.isValid).toBe(true);
      expect(stringNumberResult.sanitizedValue).toBe(123);
      
      const invalidResult = InputValidator.validate('not a number', rule);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('必须是有效的数字');
    });

    it('应该验证布尔类型', () => {
      const rule: ValidationRule = { type: 'boolean', required: true };
      
      const validResult = InputValidator.validate(true, rule);
      expect(validResult.isValid).toBe(true);
      expect(validResult.sanitizedValue).toBe(true);
      
      const stringTrueResult = InputValidator.validate('true', rule);
      expect(stringTrueResult.isValid).toBe(true);
      expect(stringTrueResult.sanitizedValue).toBe(true);
      
      const stringFalseResult = InputValidator.validate('false', rule);
      expect(stringFalseResult.isValid).toBe(true);
      expect(stringFalseResult.sanitizedValue).toBe(false);
      
      const invalidResult = InputValidator.validate('maybe', rule);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('必须是布尔值 (true/false)');
    });

    it('应该验证对象类型', () => {
      const rule: ValidationRule = { type: 'object', required: true };
      
      const validResult = InputValidator.validate({ key: 'value' }, rule);
      expect(validResult.isValid).toBe(true);
      
      const invalidArrayResult = InputValidator.validate([1, 2, 3], rule);
      expect(invalidArrayResult.isValid).toBe(false);
      expect(invalidArrayResult.errors).toContain('必须是对象类型');
      
      const invalidNullResult = InputValidator.validate(null, rule);
      expect(invalidNullResult.isValid).toBe(false);
      expect(invalidNullResult.errors).toContain('必须是对象类型');
    });

    it('应该验证数组类型', () => {
      const rule: ValidationRule = { type: 'array', required: true };
      
      const validResult = InputValidator.validate([1, 2, 3], rule);
      expect(validResult.isValid).toBe(true);
      
      const invalidResult = InputValidator.validate({ key: 'value' }, rule);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('必须是数组类型');
    });

    it('应该验证邮箱格式', () => {
      const rule: ValidationRule = { type: 'email', required: true };
      
      const validResult = InputValidator.validate('test@example.com', rule);
      expect(validResult.isValid).toBe(true);
      
      const invalidResult = InputValidator.validate('invalid-email', rule);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('必须是有效的邮箱地址');
    });

    it('应该验证URL格式', () => {
      const rule: ValidationRule = { type: 'url', required: true };
      
      const validResult = InputValidator.validate('https://example.com', rule);
      expect(validResult.isValid).toBe(true);
      
      const invalidResult = InputValidator.validate('not-a-url', rule);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('必须是有效的URL地址');
    });

    it('应该验证路径格式', () => {
      const rule: ValidationRule = { type: 'path', required: true };
      
      const validResult = InputValidator.validate('path/to/file', rule);
      expect(validResult.isValid).toBe(true);
      
      const invalidResult = InputValidator.validate('path with spaces', rule);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('必须是有效的路径');
    });
  });

  describe('范围和长度验证', () => {
    it('应该验证字符串长度', () => {
      const rule: ValidationRule = { type: 'string', min: 3, max: 10 };
      
      const validResult = InputValidator.validate('hello', rule);
      expect(validResult.isValid).toBe(true);
      
      const tooShortResult = InputValidator.validate('hi', rule);
      expect(tooShortResult.isValid).toBe(false);
      expect(tooShortResult.errors).toContain('长度不能少于3个字符');
      
      const tooLongResult = InputValidator.validate('this is too long', rule);
      expect(tooLongResult.isValid).toBe(false);
      expect(tooLongResult.errors).toContain('长度不能超过10个字符');
    });

    it('应该验证数字范围', () => {
      const rule: ValidationRule = { type: 'number', min: 0, max: 100 };
      
      const validResult = InputValidator.validate(50, rule);
      expect(validResult.isValid).toBe(true);
      
      const tooSmallResult = InputValidator.validate(-1, rule);
      expect(tooSmallResult.isValid).toBe(false);
      expect(tooSmallResult.errors).toContain('值不能小于0');
      
      const tooLargeResult = InputValidator.validate(101, rule);
      expect(tooLargeResult.isValid).toBe(false);
      expect(tooLargeResult.errors).toContain('值不能大于100');
    });

    it('应该验证数组长度', () => {
      const rule: ValidationRule = { type: 'array', min: 1, max: 3 };
      
      const validResult = InputValidator.validate([1, 2], rule);
      expect(validResult.isValid).toBe(true);
      
      const tooShortResult = InputValidator.validate([], rule);
      expect(tooShortResult.isValid).toBe(false);
      expect(tooShortResult.errors).toContain('数组长度不能少于1');
      
      const tooLongResult = InputValidator.validate([1, 2, 3, 4], rule);
      expect(tooLongResult.isValid).toBe(false);
      expect(tooLongResult.errors).toContain('数组长度不能超过3');
    });
  });

  describe('枚举值验证', () => {
    it('应该验证枚举值', () => {
      const rule: ValidationRule = { 
        type: 'string', 
        enum: ['option1', 'option2', 'option3'] 
      };
      
      const validResult = InputValidator.validate('option1', rule);
      expect(validResult.isValid).toBe(true);
      
      const invalidResult = InputValidator.validate('invalid-option', rule);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('值必须是以下之一: option1, option2, option3');
    });
  });

  describe('正则表达式验证', () => {
    it('应该验证正则表达式模式', () => {
      const rule: ValidationRule = { 
        type: 'string', 
        pattern: /^[A-Z][a-z]+$/ 
      };
      
      const validResult = InputValidator.validate('Hello', rule);
      expect(validResult.isValid).toBe(true);
      
      const invalidResult = InputValidator.validate('hello', rule);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('格式不正确');
    });
  });

  describe('自定义验证', () => {
    it('应该支持自定义验证函数', () => {
      const rule: ValidationRule = { 
        type: 'string',
        custom: (value) => {
          if (typeof value === 'string' && value.includes('test')) {
            return true;
          }
          return '值必须包含"test"';
        }
      };
      
      const validResult = InputValidator.validate('test-value', rule);
      expect(validResult.isValid).toBe(true);
      
      const invalidResult = InputValidator.validate('invalid-value', rule);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('值必须包含"test"');
    });
  });

  describe('必填字段验证', () => {
    it('应该验证必填字段', () => {
      const rule: ValidationRule = { type: 'string', required: true };
      
      const nullResult = InputValidator.validate(null, rule);
      expect(nullResult.isValid).toBe(false);
      expect(nullResult.errors).toContain('此字段为必填项');
      
      const undefinedResult = InputValidator.validate(null, rule);
      expect(undefinedResult.isValid).toBe(false);
      expect(undefinedResult.errors).toContain('此字段为必填项');
      
      const emptyStringResult = InputValidator.validate('', rule);
      expect(emptyStringResult.isValid).toBe(false);
      expect(emptyStringResult.errors).toContain('此字段为必填项');
    });

    it('应该允许非必填字段为空', () => {
      const rule: ValidationRule = { type: 'string', required: false };
      
      const nullResult = InputValidator.validate(null, rule);
      expect(nullResult.isValid).toBe(true);
      
      const undefinedResult = InputValidator.validate(null, rule);
      expect(undefinedResult.isValid).toBe(true);
      
      const emptyStringResult = InputValidator.validate('', rule);
      expect(emptyStringResult.isValid).toBe(true);
    });
  });

  describe('字符串清理', () => {
    it('应该清理字符串输入', () => {
      const rule: ValidationRule = { type: 'string', sanitize: true };
      
      const result = InputValidator.validate('  <script>alert("xss")</script>  ', rule);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('scriptalert(xss)/script');
    });
  });

  describe('对象验证', () => {
    it('应该验证对象的所有字段', () => {
      const schema = {
        name: { type: 'string' as const, required: true, min: 2 },
        age: { type: 'number' as const, required: true, min: 0, max: 150 },
        email: { type: 'email' as const, required: false }
      };

      const validObject = {
        name: 'John',
        age: 30,
        email: 'john@example.com'
      };

      const result = InputValidator.validateObject(validObject, schema);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedObject).toEqual(validObject);
    });

    it('应该返回所有字段的验证错误', () => {
      const schema = {
        name: { type: 'string' as const, required: true, min: 5 },
        age: { type: 'number' as const, required: true, min: 0 }
      };

      const invalidObject = {
        name: 'Jo', // 太短
        age: -1     // 太小
      };

      const result = InputValidator.validateObject(invalidObject, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toContain('长度不能少于5个字符');
      expect(result.errors.age).toContain('值不能小于0');
    });
  });
});

describe('CommonValidationRules Tests', () => {
  it('应该有正确的项目名称规则', () => {
    expect(CommonValidationRules.projectName.type).toBe('string');
    expect(CommonValidationRules.projectName.required).toBe(true);
    expect(CommonValidationRules.projectName.min).toBe(1);
    expect(CommonValidationRules.projectName.max).toBe(100);
  });

  it('应该有正确的邮箱规则', () => {
    expect(CommonValidationRules.email.type).toBe('email');
    expect(CommonValidationRules.email.required).toBe(true);
  });

  it('应该有正确的API密钥规则', () => {
    expect(CommonValidationRules.apiKey.type).toBe('string');
    expect(CommonValidationRules.apiKey.required).toBe(true);
    expect(CommonValidationRules.apiKey.min).toBe(10);
  });
});

describe('快速验证函数测试', () => {
  describe('validateProjectName', () => {
    it('应该验证有效的项目名称', () => {
      expect(() => validateProjectName('valid-project')).not.toThrow();
    });

    it('应该拒绝无效的项目名称', () => {
      expect(() => validateProjectName('')).toThrow(ValidationError);
      expect(() => validateProjectName('invalid project name')).toThrow(ValidationError);
    });
  });

  describe('validateEmail', () => {
    it('应该验证有效的邮箱地址', () => {
      expect(() => validateEmail('test@example.com')).not.toThrow();
    });

    it('应该拒绝无效的邮箱地址', () => {
      expect(() => validateEmail('invalid-email')).toThrow(ValidationError);
    });
  });

  describe('validateApiKey', () => {
    it('应该验证有效的API密钥', () => {
      expect(() => validateApiKey('valid-api-key-123')).not.toThrow();
    });

    it('应该拒绝无效的API密钥', () => {
      expect(() => validateApiKey('short')).toThrow(ValidationError);
    });
  });
});

describe('安全函数测试', () => {
  describe('sanitizeInput', () => {
    it('应该清理危险字符', () => {
      const input = '<script>alert("xss")</script>';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe('scriptalert(xss)/script');
    });

    it('应该移除命令注入字符', () => {
      const input = 'command; rm -rf /';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe('command rm -rf /');
    });
  });

  describe('escapeSql', () => {
    it('应该转义SQL特殊字符', () => {
      const input = "'; DROP TABLE users; --";
      const escaped = escapeSql(input);
      expect(escaped).toBe("'' DROP TABLE users --");
    });
  });

  describe('escapeHtml', () => {
    it('应该转义HTML特殊字符', () => {
      const input = '<script>alert("xss")</script>';
      const escaped = escapeHtml(input);
      expect(escaped).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('应该转义所有HTML实体', () => {
      const input = '& < > " \'';
      const escaped = escapeHtml(input);
      expect(escaped).toBe('&amp; &lt; &gt; &quot; &#x27;');
    });
  });

  describe('边界情况测试', () => {
    it('应该处理空字符串', () => {
      expect(sanitizeInput('')).toBe('');
      expect(escapeSql('')).toBe('');
      expect(escapeHtml('')).toBe('');
    });

    it('应该处理只包含空格的字符串', () => {
      expect(sanitizeInput('   ')).toBe('');
      expect(escapeSql('   ')).toBe('   ');
      expect(escapeHtml('   ')).toBe('   ');
    });

    it('应该处理特殊Unicode字符', () => {
      const unicode = '测试🚀💻';
      expect(sanitizeInput(unicode)).toBe(unicode);
      expect(escapeHtml(unicode)).toBe(unicode);
    });
  });
});
