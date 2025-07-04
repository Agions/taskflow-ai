/**
 * MCP (Model Context Protocol) 相关类型定义
 */

/**
 * 支持的编辑器类型
 */
export type EditorType = 'windsurf' | 'trae' | 'cursor' | 'vscode';

/**
 * MCP服务器配置
 */
export interface MCPServerConfig {
  command: string;
  args: string[];
  timeout?: number;
  retries?: number;
}

/**
 * MCP能力声明
 */
export interface MCPCapabilities {
  resources: boolean;
  tools: boolean;
  prompts: boolean;
  streaming: boolean;
}

/**
 * MCP配置接口
 */
export interface MCPConfig {
  editor: EditorType;
  serverConfig: MCPServerConfig;
  capabilities: MCPCapabilities;
  environment: Record<string, string>;
}

/**
 * Cursor编辑器MCP配置格式
 */
export interface CursorMCPConfig {
  mcpServers: {
    'taskflow-ai': {
      command: string;
      args: string[];
      env: Record<string, string>;
    };
  };
}

/**
 * Windsurf编辑器MCP配置格式
 */
export interface WindsurfMCPConfig {
  mcpServers: {
    'taskflow-ai': {
      command: string;
      args: string[];
      env: Record<string, string>;
      capabilities: MCPCapabilities;
      timeout?: number;
      retries?: number;
    };
  };
}

/**
 * Trae编辑器MCP配置格式
 */
export interface TraeMCPConfig {
  mcp: {
    version: string;
    servers: {
      taskflow: {
        command: string;
        args: string[];
        environment: Record<string, string>;
        capabilities: string[];
        healthCheck?: {
          enabled: boolean;
          interval: number;
          timeout: number;
        };
      };
    };
    client: {
      name: string;
      version: string;
      features: {
        streaming: boolean;
        contextWindow: number;
        multiModel: boolean;
        codeCompletion?: boolean;
        semanticSearch?: boolean;
      };
    };
  };
}

/**
 * VSCode编辑器MCP配置格式
 */
export interface VSCodeMCPConfig {
  'taskflow.mcp.enabled': boolean;
  'taskflow.mcp.server': {
    command: string;
    args: string[];
    env: Record<string, string>;
    autoRestart?: boolean;
    healthCheck?: boolean;
  };
  'taskflow.ai.models': {
    primary: string;
    fallback: string[];
    specialized: {
      code: string;
      chinese: string;
      general: string;
      creative: string;
      longText: string;
      multimodal: string;
    };
    loadBalancing?: {
      enabled: boolean;
      strategy: string;
      weights: Record<string, number>;
    };
  };
  'taskflow.integration': {
    autoParseOnSave: boolean;
    showTaskProgress: boolean;
    enableCodeLens: boolean;
    contextMenuIntegration: boolean;
    statusBarIntegration: boolean;
    sidebarPanel: boolean;
  };
  'taskflow.ui': {
    showStatusBar: boolean;
    enableNotifications: boolean;
    theme: string;
    compactMode: boolean;
  };
  'files.associations': Record<string, string>;
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

/**
 * 测试结果
 */
export interface TestResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
  latency?: number;
}

/**
 * MCP配置生成选项
 */
export interface MCPConfigOptions {
  includeAllModels?: boolean;
  enableStreaming?: boolean;
  enableHealthCheck?: boolean;
  customEnvironment?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

/**
 * 环境变量映射
 */
export const MCP_ENVIRONMENT_VARIABLES = {
  DEEPSEEK_API_KEY: '${DEEPSEEK_API_KEY}',
  ZHIPU_API_KEY: '${ZHIPU_API_KEY}',
  QWEN_API_KEY: '${QWEN_API_KEY}',
  BAIDU_API_KEY: '${BAIDU_API_KEY}',
  BAIDU_SECRET_KEY: '${BAIDU_SECRET_KEY}',
  MOONSHOT_API_KEY: '${MOONSHOT_API_KEY}',
  SPARK_APP_ID: '${SPARK_APP_ID}',
  SPARK_API_KEY: '${SPARK_API_KEY}',
  SPARK_API_SECRET: '${SPARK_API_SECRET}',
  TASKFLOW_PROJECT_ROOT: '${workspaceFolder}',
  TASKFLOW_CONFIG_PATH: '.taskflow/config.json',
  TASKFLOW_LOG_LEVEL: 'info',
  TASKFLOW_CACHE_ENABLED: 'true',
  TASKFLOW_AUTO_START: 'true'
} as const;

/**
 * 默认MCP能力
 */
export const DEFAULT_MCP_CAPABILITIES: MCPCapabilities = {
  resources: true,
  tools: true,
  prompts: true,
  streaming: true
};

/**
 * 编辑器配置文件路径映射
 */
export const EDITOR_CONFIG_PATHS: Record<EditorType, string> = {
  cursor: '.cursor/mcp.json',
  windsurf: '.windsurf/mcp.json',
  trae: '.trae/mcp-config.json',
  vscode: '.vscode/settings.json'
};

/**
 * 编辑器扩展推荐文件路径
 */
export const EDITOR_EXTENSIONS_PATHS: Record<EditorType, string | null> = {
  cursor: null,
  windsurf: null,
  trae: null,
  vscode: '.vscode/extensions.json'
};

/**
 * VSCode扩展推荐配置
 */
export interface VSCodeExtensionsConfig {
  recommendations: string[];
  unwantedRecommendations?: string[];
}

/**
 * 默认VSCode扩展推荐
 */
export const DEFAULT_VSCODE_EXTENSIONS: VSCodeExtensionsConfig = {
  recommendations: [
    'taskflow-ai.vscode-taskflow',
    'ms-vscode.vscode-typescript-next',
    'esbenp.prettier-vscode',
    'ms-vscode.vscode-eslint',
    'bradlc.vscode-tailwindcss',
    'ms-vscode.vscode-json',
    'yzhang.markdown-all-in-one'
  ],
  unwantedRecommendations: [
    'ms-vscode.vscode-typescript'
  ]
};

/**
 * Cursor规则文件内容
 */
export const CURSOR_RULES_CONTENT = `# TaskFlow AI Cursor 集成规则

## 项目配置
- 使用 TaskFlow AI 进行智能 PRD 解析和任务管理
- 支持 6 种 AI 模型：DeepSeek、智谱AI、通义千问、文心一言、月之暗面、讯飞星火
- MCP 服务端点：通过配置文件自动启动

## AI 模型使用策略
- **DeepSeek**: 代码生成、重构、技术分析
- **智谱AI**: 中文内容处理、业务逻辑分析
- **通义千问**: 通用分析、文档处理
- **文心一言**: 创意任务、内容优化
- **月之暗面**: 长文档处理、深度分析
- **讯飞星火**: 多模态任务、综合处理

## 工作流程
1. PRD 解析 → 智谱AI 处理中文需求
2. 架构设计 → DeepSeek 技术方案设计
3. 代码实现 → DeepSeek 代码生成和优化
4. 测试编写 → DeepSeek 测试用例生成
5. 文档生成 → 通义千问 技术文档编写

## 代码规范
- 严格 TypeScript 类型安全
- 函数式编程优先
- 80%+ 测试覆盖率
- ESLint + Prettier 代码格式化

## 集成功能
- 自动 PRD 解析和任务创建
- 智能代码生成和重构
- 多模型协同工作
- 实时任务状态同步

## 性能优化
- 启用 MCP 请求缓存
- 使用流式响应提升用户体验
- 智能模型选择减少延迟
- 批量处理相似请求

## 安全考虑
- API 密钥通过环境变量管理
- 敏感信息不写入代码
- 使用 HTTPS 进行 API 通信
- 定期轮换 API 密钥
`;
