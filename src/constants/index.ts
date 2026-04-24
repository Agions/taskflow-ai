/**
 * TaskFlow AI 常量定义
 */

export const APP_NAME = 'TaskFlow AI';
export const APP_VERSION = '2.0.0';
export const APP_DESCRIPTION = '智能PRD文档解析与任务管理助手';

export const CONFIG_DIR = '.taskflow';
export const CONFIG_FILE = 'config.json';
export const CACHE_DIR = 'cache';
export const LOGS_DIR = 'logs';
export const TEMPLATES_DIR = 'templates';
export const PLUGINS_DIR = 'plugins';

export const DEFAULT_OUTPUT_DIR = 'output';
export const DEFAULT_REPORTS_DIR = 'reports';

export const SUPPORTED_PRD_FORMATS = [
  '.md',
  '.markdown',
  '.txt',
  '.doc',
  '.docx',
  '.pdf',
  '.html',
  '.htm',
] as const;

export const SUPPORTED_OUTPUT_FORMATS = [
  'json',
  'yaml',
  'markdown',
  'html',
  'csv',
  'excel',
] as const;

export const AI_PROVIDERS = {
  DEEPSEEK: 'deepseek',
  ZHIPU: 'zhipu',
  QWEN: 'qwen',
  BAIDU: 'baidu',
  MOONSHOT: 'moonshot',
  SPARK: 'spark',
  OPENAI: 'openai',
  CLAUDE: 'claude',
} as const;

export const DEFAULT_AI_SETTINGS = {
  maxTokens: 4000,
  temperature: 0.7,
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};

export const AI_MODEL_ENDPOINTS = {
  [AI_PROVIDERS.DEEPSEEK]: 'https://api.deepseek.com/v1',
  [AI_PROVIDERS.ZHIPU]: 'https://open.bigmodel.cn/api/paas/v4',
  [AI_PROVIDERS.QWEN]: 'https://dashscope.aliyuncs.com/api/v1',
  [AI_PROVIDERS.BAIDU]: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1',
  [AI_PROVIDERS.MOONSHOT]: 'https://api.moonshot.cn/v1',
  [AI_PROVIDERS.SPARK]: 'https://spark-api.xf-yun.com/v1.1',
};

export const MCP_CONFIG = {
  DEFAULT_PORT: 3000,
  DEFAULT_HOST: 'localhost',
  SERVER_NAME: 'taskflow-ai',
  PROTOCOL_VERSION: '2024-11-05',
  TIMEOUT: 30000,
  MAX_REQUESTS_PER_MINUTE: 100,
};

export const MCP_TOOLS = {
  FILE_READ: 'file_read',
  FILE_WRITE: 'file_write',
  FILE_LIST: 'file_list',
  SHELL_EXEC: 'shell_exec',
  PROJECT_ANALYZE: 'project_analyze',
  TASK_CREATE: 'task_create',
  TASK_UPDATE: 'task_update',
  TASK_LIST: 'task_list',
  PRD_PARSE: 'prd_parse',
  VISUALIZE: 'visualize',
} as const;

export const MCP_RESOURCES = {
  TASKS: '/tasks',
  PROJECTS: '/projects',
  MODELS: '/models',
  CONFIG: '/config',
  STATUS: '/status',
  HEALTH: '/health',
} as const;

export const TASK_TYPES = {
  FRONTEND: 'frontend',
  BACKEND: 'backend',
  DATABASE: 'database',
  TESTING: 'testing',
  DEPLOYMENT: 'deployment',
  DOCUMENTATION: 'documentation',
  RESEARCH: 'research',
  DESIGN: 'design',
} as const;

export const TASK_STATUSES = {
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  REVIEW: 'review',
  TESTING: 'testing',
  DONE: 'done',
  BLOCKED: 'blocked',
  CANCELLED: 'cancelled',
} as const;

export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export const COMPLEXITY_LEVELS = {
  SIMPLE: 'simple',
  MEDIUM: 'medium',
  COMPLEX: 'complex',
  EPIC: 'epic',
} as const;

export const CHART_TYPES = {
  GANTT: 'gantt',
  BURNDOWN: 'burndown',
  PIE: 'pie',
  BAR: 'bar',
  LINE: 'line',
  TIMELINE: 'timeline',
  KANBAN: 'kanban',
} as const;

export const CHART_THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

export const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6B7280', // Gray
];

export const ERROR_CODES = {
  CONFIG_NOT_FOUND: 1001,
  CONFIG_INVALID: 1002,
  CONFIG_PARSE_ERROR: 1003,

  FILE_NOT_FOUND: 2001,
  FILE_READ_ERROR: 2002,
  FILE_WRITE_ERROR: 2003,

  UNSUPPORTED_FORMAT: 2004,

  PRD_PARSE_ERROR: 3001,
  PRD_FORMAT_UNSUPPORTED: 3002,
  PRD_CONTENT_INVALID: 3003,

  AI_MODEL_ERROR: 4001,
  AI_API_ERROR: 4002,
  AI_RATE_LIMIT: 4003,
  AI_TIMEOUT: 4004,

  MCP_SERVER_ERROR: 5001,
  MCP_TOOL_ERROR: 5002,
  MCP_RESOURCE_ERROR: 5003,

  VALIDATION_ERROR: 6001,
  REQUIRED_FIELD_MISSING: 6002,
  INVALID_FORMAT: 6003,

  NETWORK_ERROR: 7001,
  CONNECTION_TIMEOUT: 7002,

  PLUGIN_NOT_FOUND: 8001,
  PLUGIN_LOAD_ERROR: 8002,
  PLUGIN_EXECUTION_ERROR: 8003,
} as const;

import { TaskFlowConfig } from '../types';

export const DEFAULT_CONFIG: TaskFlowConfig = {
  projectName: '',
  version: '1.0.0',
  workspace: '',
  environment: 'development',
  models: [],
  aiModels: [],
  cache: { enabled: false, l1: { enabled: false, maxSize: 0, ttl: 0 }, l2: { enabled: false, ttl: 0 } },
  logging: { level: 'info', console: true, format: 'text' },
  plugins: { enabled: [], directory: './plugins', autoLoad: false },
  extensions: { agents: { directory: './agents', autoDiscover: false }, tools: { directory: './tools', autoDiscover: false }, workflows: { directory: './workflows', autoDiscover: false } },
  security: { enableCommandWhitelist: false, enablePrivateIPRestriction: false, enablePathTraversalProtection: true, enableCredentialMasking: true },
  mcpSettings: {
    enabled: true,
    port: MCP_CONFIG.DEFAULT_PORT,
    host: MCP_CONFIG.DEFAULT_HOST,
    serverName: MCP_CONFIG.SERVER_NAME,
    version: MCP_CONFIG.PROTOCOL_VERSION,
    capabilities: [],
    security: {
      authRequired: false,
      allowedOrigins: ['*'],
      rateLimit: {
        requestsPerMinute: MCP_CONFIG.MAX_REQUESTS_PER_MINUTE,
        tokensPerMinute: 10000,
      },
      sandbox: {
        enabled: true,
        timeout: 30000,
      },
    },
    tools: [],
    resources: [],
  },
};

export const CLI_COLORS = {
  PRIMARY: '#3B82F6',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#06B6D4',
  MUTED: '#6B7280',
};

export const CLI_SYMBOLS = {
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️',
  LOADING: '⏳',
  ARROW: '➜',
  BULLET: '•',
};

export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  SEMVER: /^\d+\.\d+\.\d+$/,
  TASK_ID: /^[a-zA-Z0-9-_]+$/,
  PROJECT_NAME: /^[a-zA-Z0-9-_\s]+$/,
};

export const PERFORMANCE = {
  CACHE_TTL: 60 * 60 * 1000, // 1小时
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_BATCH_SIZE: 100,
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 1000,
};

export const ENV_VARS = {
  NODE_ENV: 'NODE_ENV',
  DEBUG: 'DEBUG',
  CONFIG_PATH: 'TASKFLOW_CONFIG_PATH',
  DATA_DIR: 'TASKFLOW_DATA_DIR',
  CACHE_DIR: 'TASKFLOW_CACHE_DIR',
  LOG_LEVEL: 'TASKFLOW_LOG_LEVEL',
  MCP_PORT: 'TASKFLOW_MCP_PORT',
  MCP_HOST: 'TASKFLOW_MCP_HOST',
} as const;
