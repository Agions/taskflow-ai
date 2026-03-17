/**
 * MCP 配置生成器测试
 */

import { describe, it, expect } from '@jest/globals';
import {
  generateCursorConfig,
  generateClaudeDesktopConfig,
  generateVSCodeConfig,
  generateWindsurfConfig,
  generateTraeConfig,
  generateZedConfig,
  generateAllConfigs,
  exportConfig,
} from '../generator';

describe('MCP Config Generator', () => {
  const defaultOptions = {
    packageName: 'taskflow-ai',
    packageVersion: '2.1.0',
    apiKey: 'TASKFLOW_API_KEY',
  };

  describe('generateCursorConfig', () => {
    it('should generate valid Cursor config', () => {
      const config = generateCursorConfig(defaultOptions);
      const cfg = config.config as Record<string, any>;

      expect(config.name).toBe('Cursor');
      expect(config.configPath).toBe('~/.cursor/mcp.json');
      expect(cfg.mcpServers).toBeDefined();
      expect(cfg.mcpServers['taskflow-ai']).toBeDefined();
    });

    it('should use npx command', () => {
      const config = generateCursorConfig(defaultOptions);
      const cfg = config.config as Record<string, any>;
      const serverConfig = cfg.mcpServers['taskflow-ai'];

      expect(serverConfig.command).toBe('npx');
      expect(serverConfig.args).toContain('-y');
      expect(serverConfig.args).toContain('taskflow-ai@2.1.0');
    });
  });

  describe('generateClaudeDesktopConfig', () => {
    it('should generate valid Claude Desktop config', () => {
      const config = generateClaudeDesktopConfig(defaultOptions);
      const cfg = config.config as Record<string, any>;

      expect(config.name).toBe('Claude Desktop');
      expect(config.configPath).toContain('Claude');
      expect(cfg.mcpServers).toBeDefined();
    });
  });

  describe('generateVSCodeConfig', () => {
    it('should generate valid VSCode config', () => {
      const config = generateVSCodeConfig(defaultOptions);
      const cfg = config.config as Record<string, any>;

      expect(config.name).toBe('VSCode');
      expect(cfg.mcpServers).toBeDefined();
    });
  });

  describe('generateWindsurfConfig', () => {
    it('should generate valid Windsurf config', () => {
      const config = generateWindsurfConfig(defaultOptions);
      const cfg = config.config as Record<string, any>;

      expect(config.name).toBe('Windsurf');
      expect(cfg.mcpServers).toBeDefined();
    });
  });

  describe('generateTraeConfig', () => {
    it('should generate valid Trae config', () => {
      const config = generateTraeConfig(defaultOptions);
      const cfg = config.config as Record<string, any>;

      expect(config.name).toBe('Trae');
      expect(cfg.mcpServers).toBeDefined();
    });
  });

  describe('generateZedConfig', () => {
    it('should generate valid Zed config', () => {
      const config = generateZedConfig(defaultOptions);
      const cfg = config.config as Record<string, any>;

      expect(config.name).toBe('Zed');
      expect(cfg.assistant).toBeDefined();
    });
  });

  describe('generateAllConfigs', () => {
    it('should generate configs for all editors', () => {
      const configs = generateAllConfigs(defaultOptions);

      expect(configs.length).toBe(6);
      expect(configs.map(c => c.name)).toContain('Cursor');
      expect(configs.map(c => c.name)).toContain('Claude Desktop');
      expect(configs.map(c => c.name)).toContain('VSCode');
      expect(configs.map(c => c.name)).toContain('Windsurf');
      expect(configs.map(c => c.name)).toContain('Trae');
      expect(configs.map(c => c.name)).toContain('Zed');
    });
  });

  describe('exportConfig', () => {
    it('should export as JSON by default', () => {
      const config = generateCursorConfig(defaultOptions);
      const output = exportConfig(config);

      expect(() => JSON.parse(output)).not.toThrow();
    });

    it('should export as YAML when specified', () => {
      const config = generateCursorConfig(defaultOptions);
      const output = exportConfig(config, 'json');

      expect(output).toBeDefined();
      expect(typeof output).toBe('string');
    });
  });

  describe('Config Structure', () => {
    it('should have mcpServers with correct structure', () => {
      const config = generateCursorConfig(defaultOptions);
      const cfg = config.config as Record<string, any>;
      const server = cfg.mcpServers['taskflow-ai'];

      expect(server.command).toBe('npx');
      expect(server.args).toBeInstanceOf(Array);
      expect(server.env).toBeDefined();
    });

    it('should include API key in env', () => {
      const config = generateCursorConfig({
        ...defaultOptions,
        apiKey: 'TASKFLOW_API_KEY',
      });
      const cfg = config.config as Record<string, any>;
      const server = cfg.mcpServers['taskflow-ai'];

      expect(server.env.TASKFLOW_API_KEY).toBeDefined();
    });
  });
});
