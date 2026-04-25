/**
 * Config Types Tests
 * TaskFlow AI v4.0
 */

import type {
  ConfigStats,
  ApiKeyValidationResult,
  IConfigManager,
} from '../types';

describe('Config Types', () => {
  describe('ConfigStats', () => {
    it('should create valid stats', () => {
      const stats: ConfigStats = {
        hasConfig: true,
        aiModelsCount: 3,
        enabledModelsCount: 2,
        mcpEnabled: true,
      };
      expect(stats.hasConfig).toBe(true);
      expect(stats.aiModelsCount).toBe(3);
    });

    it('should support optional lastModified', () => {
      const stats: ConfigStats = {
        hasConfig: false,
        aiModelsCount: 0,
        enabledModelsCount: 0,
        mcpEnabled: false,
        lastModified: new Date(),
      };
      expect(stats.lastModified).toBeInstanceOf(Date);
    });
  });

  describe('ApiKeyValidationResult', () => {
    it('should create a valid result', () => {
      const result: ApiKeyValidationResult = {
        provider: 'openai',
        valid: true,
      };
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should support error case', () => {
      const result: ApiKeyValidationResult = {
        provider: 'invalid',
        valid: false,
        error: 'Invalid API key format',
      };
      expect(result.error).toBe('Invalid API key format');
    });
  });

  describe('IConfigManager', () => {
    it('should define all required methods', () => {
      const manager: IConfigManager = {
        loadConfig: async () => null,
        saveConfig: async (config) => { config.projectName; },
        updateAIModel: async (model) => { model.provider; },
        removeAIModel: async (provider, name) => { provider; name; },
        getAIModels: async () => [],
        getEnabledAIModels: async () => [],
        updateMCPSettings: async (settings) => { settings; },
        configExists: async () => false,
        getConfigPath: () => '.taskflow/config.json',
        getConfigDir: () => '.taskflow',
        backupConfig: async () => '/backup/path',
        restoreConfig: async (path) => { path; },
        resetConfig: async () => {},
        getConfigStats: async () => ({
          hasConfig: false, aiModelsCount: 0, enabledModelsCount: 0, mcpEnabled: false,
        }),
        validateApiKeys: async () => [],
        exportConfig: async () => ({}),
        importConfig: async (data) => { data; },
      };

      expect(typeof manager.loadConfig).toBe('function');
      expect(typeof manager.saveConfig).toBe('function');
      expect(typeof manager.getConfigPath).toBe('function');
      expect(typeof manager.backupConfig).toBe('function');
      expect(typeof manager.validateApiKeys).toBe('function');
    });
  });
});
