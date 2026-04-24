// @ts-nocheck
import { ValidationUtils } from '../validation-utils';

describe('ValidationUtils', () => {
  describe('isEmail', () => {
    it('should validate email', () => {
      expect(ValidationUtils.isEmail('test@example.com')).toBe(true);
      expect(ValidationUtils.isEmail('invalid')).toBe(false);
    });
  });

  describe('isURL', () => {
    it('should validate URL', () => {
      expect(ValidationUtils.isURL('https://example.com')).toBe(true);
      expect(ValidationUtils.isURL('not-a-url')).toBe(false);
    });
  });

  describe('isJSON', () => {
    it('should validate JSON', () => {
      expect(ValidationUtils.isJSON('{"key":"value"}')).toBe(true);
      expect(ValidationUtils.isJSON('not json')).toBe(false);
    });
  });

  describe('isValidPath', () => {
    it('should validate file path', () => {
      expect(ValidationUtils.isValidPath('/valid/path')).toBe(true);
      expect(ValidationUtils.isValidPath('')).toBe(false);
    });
  });

  describe('validateRequired', () => {
    it('should check required fields', () => {
      const result = ValidationUtils.validateRequired({ name: 'test' }, ['name']);
      expect(result.valid).toBe(true);

      const result2 = ValidationUtils.validateRequired({ name: 'test' }, ['name', 'email']);
      expect(result2.valid).toBe(false);
    });
  });

  describe('validateTypes', () => {
    it('should validate field types', () => {
      const schema = {
        name: 'string',
        age: 'number',
        active: 'boolean'
      };

      const result = ValidationUtils.validateTypes(
        { name: 'test', age: 25, active: true },
        schema
      );
      expect(result.valid).toBe(true);
    });
  });
});
