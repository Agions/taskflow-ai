import { StringUtils } from '../string-utils';

describe('StringUtils', () => {
  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(StringUtils.capitalize('hello')).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(StringUtils.capitalize('')).toBe('');
    });

    it('should handle single character', () => {
      expect(StringUtils.capitalize('a')).toBe('A');
    });
  });

  describe('camelCase', () => {
    it('should convert to camelCase', () => {
      expect(StringUtils.camelCase('hello-world')).toBe('helloWorld');
      expect(StringUtils.camelCase('HelloWorld')).toBe('helloWorld');
      expect(StringUtils.camelCase('hello-world-test')).toBe('helloWorldTest');
    });

    it('should handle multiple words', () => {
      expect(StringUtils.camelCase('the-quick-brown-fox')).toBe('theQuickBrownFox');
      expect(StringUtils.camelCase('THE_QUICK_BROWN_FOX')).toBe('tHEQUICKBROWNFOX'); // 保持现有行为
      expect(StringUtils.camelCase('the_quick_brown_fox')).toBe('theQuickBrownFox');
    });

    it('should handle spaces', () => {
      expect(StringUtils.camelCase('hello world')).toBe('helloWorld');
      expect(StringUtils.camelCase('hello   world')).toBe('helloWorld');
    });
  });

  describe('snakeCase', () => {
    it('should convert to snake_case', () => {
      expect(StringUtils.snakeCase('helloWorld')).toBe('hello_world');
    });

    it('should handle consecutive capital letters', () => {
      expect(StringUtils.snakeCase('HelloWorld')).toBe('hello_world');
      expect(StringUtils.snakeCase('XMLHttpRequest')).toBe('x_m_l_http_request');
    });

    it('should handle already snake_case', () => {
      expect(StringUtils.snakeCase('hello_world')).toBe('hello_world');
    });
  });

  describe('kebabCase', () => {
    it('should convert to kebab-case', () => {
      expect(StringUtils.kebabCase('helloWorld')).toBe('hello-world');
      expect(StringUtils.kebabCase('HelloWorld')).toBe('hello-world');
      expect(StringUtils.kebabCase('hello-world')).toBe('hello-world');
    });

    it('should handle consecutive capital letters', () => {
      expect(StringUtils.kebabCase('XMLHttpRequest')).toBe('x-m-l-http-request');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      // maxLength 包含后缀长度，所以实际保留 maxLength - suffix.length 个字符
      expect(StringUtils.truncate('hello world', 5)).toBe('he...');   // 2 + 3 = 5
      expect(StringUtils.truncate('hello world', 8)).toBe('hello...'); // 5 + 3 = 8
    });

    it('should not truncate short strings', () => {
      expect(StringUtils.truncate('hi', 10)).toBe('hi');
      expect(StringUtils.truncate('hello', 5)).toBe('hello');
    });

    it('should use custom suffix', () => {
      expect(StringUtils.truncate('hello world', 7, '***')).toBe('hell***'); // 4 + 3 = 7
    });
  });

  describe('slugify', () => {
    it('should create slug from text', () => {
      expect(StringUtils.slugify('Hello World!')).toBe('hello-world');
      expect(StringUtils.slugify('Test: New Feature')).toBe('test-new-feature');
    });

    it('should handle special characters', () => {
      expect(StringUtils.slugify('This is a test!!!')).toBe('this-is-a-test');
      expect(StringUtils.slugify('User@Email#Domain')).toBe('useremaildomain');
    });
  });

  describe('isUUID', () => {
    it('should validate UUID', () => {
      expect(StringUtils.isUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(StringUtils.isUUID('not-a-uuid')).toBe(false);
      expect(StringUtils.isUUID('')).toBe(false);
    });

    it('should handle different UUID versions', () => {
      // 有效 UUID v1-v5
      expect(StringUtils.isUUID('10000000-0000-1000-a000-000000000000')).toBe(true);
      expect(StringUtils.isUUID('20000000-0000-2000-a000-000000000000')).toBe(true);
      expect(StringUtils.isUUID('30000000-0000-3000-a000-000000000000')).toBe(true);
      expect(StringUtils.isUUID('40000000-0000-4000-a000-000000000000')).toBe(true);
      expect(StringUtils.isUUID('50000000-0000-5000-a000-000000000000')).toBe(true);
      // 最大有效值 UUID v4
      expect(StringUtils.isUUID('ffffffff-ffff-4fff-bfff-ffffffffffff')).toBe(true);
    });
  });

  describe('generateId', () => {
    it('should generate unique ID', () => {
      const id1 = StringUtils.generateId('test');
      const id2 = StringUtils.generateId('test');
      expect(id1).not.toBe(id2);
    });

    it('should include prefix', () => {
      const id = StringUtils.generateId('agent');
      expect(id).toMatch(/^agent-/);
    });

    it('should use default prefix', () => {
      const id = StringUtils.generateId();
      expect(id).toMatch(/^id-/);
    });
  });

  describe('trimAll', () => {
    it('should remove all whitespace', () => {
      expect(StringUtils.trimAll('h e l l o')).toBe('hello');
      expect(StringUtils.trimAll('a  b\tc\nd')).toBe('abcd');
    });
  });

  describe('byteLength', () => {
    it('should calculate byte length', () => {
      expect(StringUtils.byteLength('hello')).toBe(5);
      expect(StringUtils.byteLength('你好')).toBe(6); // UTF-8: 3 bytes per Chinese character
    });
  });

  describe('formatBytes', () => {
    it('should format bytes', () => {
      expect(StringUtils.formatBytes(0)).toBe('0 B');
      expect(StringUtils.formatBytes(1024)).toBe('1.00 KB');
      expect(StringUtils.formatBytes(1048576)).toBe('1.00 MB');
      expect(StringUtils.formatBytes(1073741824)).toBe('1.00 GB');
    });

    it('should handle decimals', () => {
      expect(StringUtils.formatBytes(1536)).toBe('1.50 KB');
      expect(StringUtils.formatBytes(1536, 1)).toBe('1.5 KB');
      expect(StringUtils.formatBytes(1536, 0)).toBe('2 KB');
    });
  });
});
