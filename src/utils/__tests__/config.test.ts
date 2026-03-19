/**
 * 配置工具测试
 */

import { validateConfig } from '../config';

describe('Config Utilities', () => {
  describe('validateConfig', () => {
    it('should validate correct config', () => {
      const config = {
        projectName: 'test-project',
        version: '1.0.0',
        aiModels: [
          { provider: 'openai', modelName: 'gpt-4o', enabled: true },
        ],
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(true);
    });

    it('should reject config without projectName', () => {
      const config = {
        version: '1.0.0',
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should reject invalid semver', () => {
      const config = {
        projectName: 'test',
        version: 'invalid',
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
    });

    it('should validate mcpSettings', () => {
      const config = {
        projectName: 'test',
        version: '1.0.0',
        mcpSettings: {
          enabled: true,
          port: 3000,
        },
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid port', () => {
      const config = {
        projectName: 'test',
        version: '1.0.0',
        mcpSettings: {
          enabled: true,
          port: 99999,
        },
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
    });
  });
});
