/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 配置模式定义 - 定义TaskFlow AI的配置结构和验证规则
 * 提供类型安全的配置访问和自动补全
 */

import { ConfigValidation } from './config-manager';

/**
 * 应用配置接口
 */
export interface AppConfig {
  name: string;
  version: string;
  environment: 'development' | 'testing' | 'staging' | 'production';
  debug: boolean;
  timezone: string;
  locale: string;
}

/**
 * 服务器配置接口
 */
export interface ServerConfig {
  port: number;
  host: string;
  timeout: number;
  cors: {
    enabled: boolean;
    origins: string[];
    methods: string[];
    credentials: boolean;
  };
  compression: {
    enabled: boolean;
    level: number;
  };
  ssl: {
    enabled: boolean;
    cert?: string;
    key?: string;
  };
}

/**
 * 数据库配置接口
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  username: string;
  password: string;
  ssl: boolean;
  pool: {
    min: number;
    max: number;
    idle: number;
    acquire: number;
  };
  migrations: {
    enabled: boolean;
    directory: string;
  };
  backup: {
    enabled: boolean;
    schedule: string;
    retention: number;
  };
}

/**
 * 日志配置接口
 */
export interface LoggingConfig {
  level: 'error' | 'warn' | 'info' | 'debug';
  format: 'json' | 'text' | 'combined';
  console: {
    enabled: boolean;
    colorize: boolean;
  };
  file: {
    enabled: boolean;
    path: string;
    maxSize: string;
    maxFiles: number;
    compress: boolean;
  };
  remote: {
    enabled: boolean;
    endpoint?: string;
    apiKey?: string;
  };
}

/**
 * AI模型配置接口
 */
export interface AIModelsConfig {
  default: string;
  timeout: number;
  retryCount: number;
  providers: {
    [key: string]: {
      enabled: boolean;
      apiKey: string;
      secretKey?: string;
      baseUrl?: string;
      model: string;
      maxTokens: number;
      temperature: number;
      topP: number;
    };
  };
  loadBalancing: {
    enabled: boolean;
    strategy: 'round_robin' | 'least_cost' | 'least_latency' | 'random';
    healthCheck: boolean;
  };
}

/**
 * 缓存配置接口
 */
export interface CacheConfig {
  enabled: boolean;
  type: 'memory' | 'redis' | 'memcached';
  ttl: number;
  maxSize: number;
  redis?: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  memcached?: {
    servers: string[];
  };
}

/**
 * 安全配置接口
 */
export interface SecurityConfig {
  jwt: {
    secret: string;
    expiresIn: string;
    algorithm: string;
  };
  encryption: {
    algorithm: string;
    key: string;
  };
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    max: number;
    message: string;
  };
  cors: {
    enabled: boolean;
    origins: string[];
  };
  helmet: {
    enabled: boolean;
    options: Record<string, any>;
  };
}

/**
 * 文件存储配置接口
 */
export interface StorageConfig {
  type: 'local' | 's3' | 'azure' | 'gcp';
  local?: {
    uploadDir: string;
    maxFileSize: number;
    allowedTypes: string[];
  };
  s3?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  azure?: {
    connectionString: string;
    containerName: string;
  };
  gcp?: {
    projectId: string;
    keyFilename: string;
    bucketName: string;
  };
}

/**
 * 通知配置接口
 */
export interface NotificationConfig {
  email: {
    enabled: boolean;
    provider: 'smtp' | 'sendgrid' | 'ses';
    smtp?: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
    sendgrid?: {
      apiKey: string;
    };
    ses?: {
      region: string;
      accessKeyId: string;
      secretAccessKey: string;
    };
  };
  slack: {
    enabled: boolean;
    webhookUrl?: string;
    token?: string;
    channel?: string;
  };
  webhook: {
    enabled: boolean;
    urls: string[];
    timeout: number;
  };
}

/**
 * 监控配置接口
 */
export interface MonitoringConfig {
  metrics: {
    enabled: boolean;
    interval: number;
    endpoint: string;
  };
  health: {
    enabled: boolean;
    endpoint: string;
    checks: string[];
  };
  tracing: {
    enabled: boolean;
    serviceName: string;
    endpoint?: string;
  };
  alerts: {
    enabled: boolean;
    thresholds: {
      errorRate: number;
      responseTime: number;
      memoryUsage: number;
      cpuUsage: number;
    };
  };
}

/**
 * 完整配置接口
 */
export interface TaskFlowConfig {
  app: AppConfig;
  server: ServerConfig;
  database: DatabaseConfig;
  logging: LoggingConfig;
  aiModels: AIModelsConfig;
  cache: CacheConfig;
  security: SecurityConfig;
  storage: StorageConfig;
  notification: NotificationConfig;
  monitoring: MonitoringConfig;
}

/**
 * 配置验证规则定义
 */
export const CONFIG_VALIDATION_RULES: Record<string, ConfigValidation> = {
  // 应用配置验证
  'app.name': {
    type: 'string',
    required: true,
    min: 1,
    max: 100
  },
  'app.version': {
    type: 'string',
    required: true,
    pattern: '^\\d+\\.\\d+\\.\\d+$'
  },
  'app.environment': {
    type: 'string',
    required: true,
    enum: ['development', 'testing', 'staging', 'production']
  },

  // 服务器配置验证
  'server.port': {
    type: 'number',
    required: true,
    min: 1,
    max: 65535
  },
  'server.host': {
    type: 'string',
    required: true,
    min: 1
  },
  'server.timeout': {
    type: 'number',
    required: true,
    min: 1000,
    max: 300000
  },

  // 数据库配置验证
  'database.host': {
    type: 'string',
    required: true,
    min: 1
  },
  'database.port': {
    type: 'number',
    required: true,
    min: 1,
    max: 65535
  },
  'database.name': {
    type: 'string',
    required: true,
    min: 1,
    max: 63
  },
  'database.pool.min': {
    type: 'number',
    required: true,
    min: 0,
    max: 100
  },
  'database.pool.max': {
    type: 'number',
    required: true,
    min: 1,
    max: 1000
  },

  // 日志配置验证
  'logging.level': {
    type: 'string',
    required: true,
    enum: ['error', 'warn', 'info', 'debug']
  },
  'logging.format': {
    type: 'string',
    required: true,
    enum: ['json', 'text', 'combined']
  },

  // AI模型配置验证
  'aiModels.timeout': {
    type: 'number',
    required: true,
    min: 1000,
    max: 300000
  },
  'aiModels.retryCount': {
    type: 'number',
    required: true,
    min: 0,
    max: 10
  },

  // 缓存配置验证
  'cache.ttl': {
    type: 'number',
    required: true,
    min: 1,
    max: 86400
  },
  'cache.maxSize': {
    type: 'number',
    required: true,
    min: 1,
    max: 1000000
  },

  // 安全配置验证
  'security.jwt.secret': {
    type: 'string',
    required: true,
    min: 32
  },
  'security.jwt.expiresIn': {
    type: 'string',
    required: true,
    pattern: '^\\d+[smhd]$'
  },
  'security.rateLimit.max': {
    type: 'number',
    required: true,
    min: 1,
    max: 10000
  }
};

/**
 * 默认配置值
 */
export const DEFAULT_CONFIG: Partial<TaskFlowConfig> = {
  app: {
    name: 'TaskFlow AI',
    version: '1.0.0',
    environment: 'development',
    debug: true,
    timezone: 'Asia/Shanghai',
    locale: 'zh-CN'
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    timeout: 30000,
    cors: {
      enabled: true,
      origins: ['*'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true
    },
    compression: {
      enabled: true,
      level: 6
    },
    ssl: {
      enabled: false
    }
  },
  database: {
    host: 'localhost',
    port: 5432,
    name: 'taskflow',
    username: 'taskflow',
    password: 'password',
    ssl: false,
    pool: {
      min: 2,
      max: 10,
      idle: 30000,
      acquire: 60000
    },
    migrations: {
      enabled: true,
      directory: './migrations'
    },
    backup: {
      enabled: false,
      schedule: '0 2 * * *',
      retention: 7
    }
  },
  logging: {
    level: 'info',
    format: 'json',
    console: {
      enabled: true,
      colorize: true
    },
    file: {
      enabled: true,
      path: './logs/app.log',
      maxSize: '10m',
      maxFiles: 5,
      compress: true
    },
    remote: {
      enabled: false
    }
  },
  aiModels: {
    default: 'alibaba_qwen',
    timeout: 30000,
    retryCount: 3,
    providers: {},
    loadBalancing: {
      enabled: false,
      strategy: 'round_robin',
      healthCheck: true
    }
  },
  cache: {
    enabled: true,
    type: 'memory',
    ttl: 300,
    maxSize: 1000
  },
  security: {
    jwt: {
      secret: 'your-secret-key-change-in-production',
      expiresIn: '24h',
      algorithm: 'HS256'
    },
    encryption: {
      algorithm: 'aes-256-gcm',
      key: 'your-encryption-key-32-chars-long'
    },
    rateLimit: {
      enabled: true,
      windowMs: 900000, // 15分钟
      max: 100,
      message: 'Too many requests from this IP'
    },
    cors: {
      enabled: true,
      origins: ['*']
    },
    helmet: {
      enabled: true,
      options: {}
    }
  },
  storage: {
    type: 'local',
    local: {
      uploadDir: './uploads',
      maxFileSize: 10485760, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf', 'text/plain']
    }
  },
  notification: {
    email: {
      enabled: false,
      provider: 'smtp'
    },
    slack: {
      enabled: false
    },
    webhook: {
      enabled: false,
      urls: [],
      timeout: 5000
    }
  },
  monitoring: {
    metrics: {
      enabled: true,
      interval: 60000,
      endpoint: '/metrics'
    },
    health: {
      enabled: true,
      endpoint: '/health',
      checks: ['database', 'cache', 'ai-models']
    },
    tracing: {
      enabled: false,
      serviceName: 'taskflow-ai'
    },
    alerts: {
      enabled: false,
      thresholds: {
        errorRate: 0.05,
        responseTime: 1000,
        memoryUsage: 0.8,
        cpuUsage: 0.8
      }
    }
  }
};

/**
 * 配置环境变量映射
 */
export const ENV_MAPPING: Record<string, string> = {
  'TASKFLOW_APP_NAME': 'app.name',
  'TASKFLOW_APP_VERSION': 'app.version',
  'TASKFLOW_APP_ENVIRONMENT': 'app.environment',
  'TASKFLOW_SERVER_PORT': 'server.port',
  'TASKFLOW_SERVER_HOST': 'server.host',
  'TASKFLOW_DATABASE_HOST': 'database.host',
  'TASKFLOW_DATABASE_PORT': 'database.port',
  'TASKFLOW_DATABASE_NAME': 'database.name',
  'TASKFLOW_DATABASE_USERNAME': 'database.username',
  'TASKFLOW_DATABASE_PASSWORD': 'database.password',
  'TASKFLOW_JWT_SECRET': 'security.jwt.secret',
  'TASKFLOW_LOG_LEVEL': 'logging.level',
  'TASKFLOW_CACHE_ENABLED': 'cache.enabled',
  'TASKFLOW_AI_DEFAULT_MODEL': 'aiModels.default'
};

/**
 * 敏感配置键列表（需要加密存储）
 */
export const SENSITIVE_CONFIG_KEYS = [
  'database.password',
  'security.jwt.secret',
  'security.encryption.key',
  'aiModels.providers.*.apiKey',
  'aiModels.providers.*.secretKey',
  'notification.email.smtp.auth.pass',
  'notification.email.sendgrid.apiKey',
  'storage.s3.secretAccessKey',
  'storage.azure.connectionString'
];

/**
 * 配置分组定义
 */
export const CONFIG_GROUPS = {
  core: ['app', 'server', 'database', 'logging'],
  ai: ['aiModels'],
  security: ['security', 'cache'],
  integrations: ['storage', 'notification'],
  monitoring: ['monitoring']
};

/**
 * 配置优先级定义（数字越大优先级越高）
 */
export const CONFIG_PRIORITY = {
  environment: 100,
  file: 80,
  database: 60,
  remote: 40,
  memory: 20
};
