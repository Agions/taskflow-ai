/**
 * Constants Tests
 * TaskFlow AI v4.0
 */

import {
  APP_NAME,
  APP_VERSION,
  APP_DESCRIPTION,
  CONFIG_DIR,
  CONFIG_FILE,
  CACHE_DIR,
  LOGS_DIR,
  TEMPLATES_DIR,
  PLUGINS_DIR,
  DEFAULT_OUTPUT_DIR,
  DEFAULT_REPORTS_DIR,
  SUPPORTED_PRD_FORMATS,
  SUPPORTED_OUTPUT_FORMATS,
  AI_PROVIDERS,
  DEFAULT_AI_SETTINGS,
  AI_MODEL_ENDPOINTS,
  MCP_CONFIG,
  MCP_TOOLS,
  MCP_RESOURCES,
  TASK_TYPES,
  TASK_STATUSES,
  PRIORITY_LEVELS,
  COMPLEXITY_LEVELS,
  CHART_TYPES,
  CHART_THEMES,
  DEFAULT_COLORS,
  ERROR_CODES,
  CLI_COLORS,
  CLI_SYMBOLS,
  REGEX_PATTERNS,
  PERFORMANCE,
  ENV_VARS,
  DEFAULT_CONFIG,
} from '../index';

describe('Constants', () => {
  describe('App Info', () => {
    it('should define APP_NAME', () => {
      expect(APP_NAME).toBe('TaskFlow AI');
    });
    it('should define APP_VERSION in semver format', () => {
      expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });
    it('should define APP_DESCRIPTION', () => {
      expect(APP_DESCRIPTION).toBeTruthy();
    });
  });

  describe('Directory Constants', () => {
    it('should define all directory constants', () => {
      expect(CONFIG_DIR).toBe('.taskflow');
      expect(CONFIG_FILE).toBe('config.json');
      expect(CACHE_DIR).toBe('cache');
      expect(LOGS_DIR).toBe('logs');
      expect(TEMPLATES_DIR).toBe('templates');
      expect(PLUGINS_DIR).toBe('plugins');
      expect(DEFAULT_OUTPUT_DIR).toBe('output');
      expect(DEFAULT_REPORTS_DIR).toBe('reports');
    });
  });

  describe('SUPPORTED_PRD_FORMATS', () => {
    it('should include common formats', () => {
      expect(SUPPORTED_PRD_FORMATS).toContain('.md');
      expect(SUPPORTED_PRD_FORMATS).toContain('.pdf');
      expect(SUPPORTED_PRD_FORMATS).toContain('.docx');
    });
    it('should have at least 6 formats', () => {
      expect(SUPPORTED_PRD_FORMATS.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('SUPPORTED_OUTPUT_FORMATS', () => {
    it('should include json and markdown', () => {
      expect(SUPPORTED_OUTPUT_FORMATS).toContain('json');
      expect(SUPPORTED_OUTPUT_FORMATS).toContain('markdown');
    });
  });

  describe('AI_PROVIDERS', () => {
    it('should define all providers', () => {
      expect(AI_PROVIDERS.DEEPSEEK).toBe('deepseek');
      expect(AI_PROVIDERS.OPENAI).toBe('openai');
      expect(AI_PROVIDERS.CLAUDE).toBe('claude');
      expect(AI_PROVIDERS.ZHIPU).toBe('zhipu');
    });
    it('should have at least 6 providers', () => {
      expect(Object.keys(AI_PROVIDERS).length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('DEFAULT_AI_SETTINGS', () => {
    it('should have reasonable defaults', () => {
      expect(DEFAULT_AI_SETTINGS.temperature).toBeGreaterThan(0);
      expect(DEFAULT_AI_SETTINGS.temperature).toBeLessThanOrEqual(1);
      expect(DEFAULT_AI_SETTINGS.maxTokens).toBeGreaterThan(0);
      expect(DEFAULT_AI_SETTINGS.retryAttempts).toBeGreaterThan(0);
    });
  });

  describe('MCP_CONFIG', () => {
    it('should define server defaults', () => {
      expect(MCP_CONFIG.DEFAULT_PORT).toBe(3000);
      expect(MCP_CONFIG.DEFAULT_HOST).toBe('localhost');
      expect(MCP_CONFIG.SERVER_NAME).toBe('taskflow-ai');
      expect(MCP_CONFIG.TIMEOUT).toBeGreaterThan(0);
    });
  });

  describe('MCP_TOOLS', () => {
    it('should define all tool names', () => {
      expect(MCP_TOOLS.FILE_READ).toBe('file_read');
      expect(MCP_TOOLS.FILE_WRITE).toBe('file_write');
      expect(MCP_TOOLS.SHELL_EXEC).toBe('shell_exec');
      expect(MCP_TOOLS.TASK_CREATE).toBe('task_create');
    });
  });

  describe('TASK_TYPES', () => {
    it('should include frontend and backend', () => {
      expect(TASK_TYPES.FRONTEND).toBe('frontend');
      expect(TASK_TYPES.BACKEND).toBe('backend');
    });
  });

  describe('TASK_STATUSES', () => {
    it('should include all statuses', () => {
      expect(TASK_STATUSES.TODO).toBe('todo');
      expect(TASK_STATUSES.IN_PROGRESS).toBe('in-progress');
      expect(TASK_STATUSES.DONE).toBe('done');
      expect(TASK_STATUSES.BLOCKED).toBe('blocked');
    });
  });

  describe('PRIORITY_LEVELS', () => {
    it('should have 4 levels', () => {
      expect(Object.keys(PRIORITY_LEVELS)).toHaveLength(4);
    });
  });

  describe('ERROR_CODES', () => {
    it('should have unique numeric codes', () => {
      const codes = Object.values(ERROR_CODES);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });
    it('should group errors by range', () => {
      expect(ERROR_CODES.CONFIG_NOT_FOUND).toBeGreaterThanOrEqual(1000);
      expect(ERROR_CODES.FILE_NOT_FOUND).toBeGreaterThanOrEqual(2000);
      expect(ERROR_CODES.AI_MODEL_ERROR).toBeGreaterThanOrEqual(4000);
      expect(ERROR_CODES.MCP_SERVER_ERROR).toBeGreaterThanOrEqual(5000);
    });
  });

  describe('DEFAULT_COLORS', () => {
    it('should have at least 8 colors', () => {
      expect(DEFAULT_COLORS.length).toBeGreaterThanOrEqual(8);
    });
    it('should be valid hex colors', () => {
      for (const color of DEFAULT_COLORS) {
        expect(color).toMatch(/^#[0-9A-F]{6}$/);
      }
    });
  });

  describe('REGEX_PATTERNS', () => {
    it('should validate email pattern', () => {
      expect(REGEX_PATTERNS.EMAIL.test('test@example.com')).toBe(true);
      expect(REGEX_PATTERNS.EMAIL.test('invalid')).toBe(false);
    });
    it('should validate URL pattern', () => {
      expect(REGEX_PATTERNS.URL.test('https://example.com')).toBe(true);
      expect(REGEX_PATTERNS.URL.test('not-url')).toBe(false);
    });
    it('should validate semver pattern', () => {
      expect(REGEX_PATTERNS.SEMVER.test('1.0.0')).toBe(true);
      expect(REGEX_PATTERNS.SEMVER.test('1.0')).toBe(false);
    });
  });

  describe('PERFORMANCE', () => {
    it('should have reasonable performance settings', () => {
      expect(PERFORMANCE.CACHE_TTL).toBeGreaterThan(0);
      expect(PERFORMANCE.MAX_FILE_SIZE).toBeGreaterThan(0);
      expect(PERFORMANCE.MAX_BATCH_SIZE).toBeGreaterThan(0);
    });
  });

  describe('ENV_VARS', () => {
    it('should define NODE_ENV', () => {
      expect(ENV_VARS.NODE_ENV).toBe('NODE_ENV');
    });
    it('should define TASKFLOW-prefixed vars', () => {
      expect(ENV_VARS.CONFIG_PATH).toMatch(/^TASKFLOW_/);
      expect(ENV_VARS.MCP_PORT).toMatch(/^TASKFLOW_/);
    });
  });

  describe('DEFAULT_CONFIG', () => {
    it('should be a valid config object', () => {
      expect(DEFAULT_CONFIG).toBeDefined();
      expect(DEFAULT_CONFIG.environment).toBe('development');
      expect(DEFAULT_CONFIG.logging.level).toBe('info');
    });
    it('should have MCP settings', () => {
      expect(DEFAULT_CONFIG.mcpSettings).toBeDefined();
      expect(DEFAULT_CONFIG.mcpSettings?.enabled).toBe(true);
    });
  });
});
