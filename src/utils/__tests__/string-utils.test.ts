// @ts-nocheck
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
    });

    it('should handle multiple words', () => {
      expect(StringUtils.camelCase('the-quick-brown-fox')).toBe('theQuickBrownFox');
    });
  });

  describe('snakeCase', () => {
    it('should convert to snake_case', () => {
      expect(StringUtils.snakeCase('helloWorld')).toBe('hello_world');
      expect(StringUtils.snakeCase('HelloWorld')).toBe('hello_world');
    });
  });

  describe('kebabCase', () => {
    it('should convert to kebab-case', () => {
      expect(StringUtils.kebabCase('helloWorld')).toBe('hello-world');
      expect(StringUtils.kebabCase('HelloWorld')).toBe('hello-world');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(StringUtils.truncate('hello world', 5)).toBe('helli...');
    });

    it('should not truncate short strings', () => {
      expect(StringUtils.truncate('hi', 10)).toBe('hi');
    });
  });

  describe('slugify', () => {
    it('should create slug from text', () => {
      expect(StringUtils.slugify('Hello World!')).toBe('hello-world');
      expect(StringUtils.slugify('Test: New Feature')).toBe('test-new-feature');
    });
  });

  describe('isUUID', () => {
    it('should validate UUID', () => {
      expect(StringUtils.isUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(StringUtils.isUUID('not-a-uuid')).toBe(false);
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
  });
});
