/**
 * 模型配置类型定义
 * 定义所有模型相关的类型接口
 */

export type ProviderType = 
  | 'deepseek' 
  | 'openai' 
  | 'anthropic' 
  | 'zhipu'      // 智谱 AI
  | 'qwen'       // 通义千问
  | 'ERNIE'      // 文心一言
  | 'moonshot';  // 月之暗面

export type ModelCapability = 
  | 'chat' 
  | 'reasoning' 
  | 'code' 
  | 'vision' 
  | 'function_calling';

export interface ModelConfig {
  /** 模型唯一标识 */
  id: string;
  /** 提供商类型 */
  provider: ProviderType;
  /** 模型名称 */
  modelName: string;
  /** API Key */
  apiKey: string;
  /** API 基础 URL */
  baseUrl?: string;
  /** 是否启用 */
  enabled: boolean;
  /** 优先级 (数字越小优先级越高) */
  priority: number;
  /** 支持的能力 */
  capabilities: ModelCapability[];
  /** 最大 token 数 */
  maxTokens?: number;
  /** 温度参数 */
  temperature?: number;
  /** 输入价格 (美元/1M tokens) */
  costPer1MInput?: number;
  /** 输出价格 (美元/1M tokens) */
  costPer1MOutput?: number;
}

export interface ModelInfo {
  id: string;
  provider: ProviderType;
  name: string;
  capabilities: ModelCapability[];
  contextLength: number;
  costPer1MInput: number;
  costPer1MOutput: number;
}

// 内置模型信息注册表
export const MODEL_REGISTRY: Record<string, ModelInfo> = {
  // DeepSeek
  'deepseek-chat': {
    id: 'deepseek-chat',
    provider: 'deepseek',
    name: 'DeepSeek Chat',
    capabilities: ['chat', 'reasoning'],
    contextLength: 128000,
    costPer1MInput: 0.5,
    costPer1MOutput: 2,
  },
  'deepseek-coder': {
    id: 'deepseek-coder',
    provider: 'deepseek',
    name: 'DeepSeek Coder',
    capabilities: ['chat', 'code'],
    contextLength: 128000,
    costPer1MInput: 0.5,
    costPer1MOutput: 2,
  },
  
  // OpenAI
  'gpt-4o': {
    id: 'gpt-4o',
    provider: 'openai',
    name: 'GPT-4o',
    capabilities: ['chat', 'vision', 'function_calling'],
    contextLength: 128000,
    costPer1MInput: 5,
    costPer1MOutput: 15,
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    provider: 'openai',
    name: 'GPT-4o Mini',
    capabilities: ['chat'],
    contextLength: 128000,
    costPer1MInput: 0.15,
    costPer1MOutput: 0.6,
  },
  'o1': {
    id: 'o1',
    provider: 'openai',
    name: 'OpenAI o1',
    capabilities: ['reasoning'],
    contextLength: 200000,
    costPer1MInput: 15,
    costPer1MOutput: 60,
  },
  'o1-mini': {
    id: 'o1-mini',
    provider: 'openai',
    name: 'OpenAI o1-mini',
    capabilities: ['reasoning', 'code'],
    contextLength: 128000,
    costPer1MInput: 3,
    costPer1MOutput: 12,
  },
  
  // Anthropic
  'claude-3-5-sonnet': {
    id: 'claude-3-5-sonnet',
    provider: 'anthropic',
    name: 'Claude 3.5 Sonnet',
    capabilities: ['chat', 'vision', 'function_calling'],
    contextLength: 200000,
    costPer1MInput: 3,
    costPer1MOutput: 15,
  },
  'claude-3-opus': {
    id: 'claude-3-opus',
    provider: 'anthropic',
    name: 'Claude 3 Opus',
    capabilities: ['chat', 'reasoning', 'vision'],
    contextLength: 200000,
    costPer1MInput: 15,
    costPer1MOutput: 75,
  },
  
  // 智谱 AI
  'glm-4': {
    id: 'glm-4',
    provider: 'zhipu',
    name: 'GLM-4',
    capabilities: ['chat'],
    contextLength: 128000,
    costPer1MInput: 0.5,
    costPer1MOutput: 1,
  },
  'glm-4-flash': {
    id: 'glm-4-flash',
    provider: 'zhipu',
    name: 'GLM-4 Flash',
    capabilities: ['chat'],
    contextLength: 128000,
    costPer1MInput: 0.1,
    costPer1MOutput: 0.1,
  },
  
  // 通义千问
  'qwen-turbo': {
    id: 'qwen-turbo',
    provider: 'qwen',
    name: 'Qwen Turbo',
    capabilities: ['chat'],
    contextLength: 100000,
    costPer1MInput: 0.2,
    costPer1MOutput: 0.6,
  },
  'qwen-plus': {
    id: 'qwen-plus',
    provider: 'qwen',
    name: 'Qwen Plus',
    capabilities: ['chat', 'reasoning'],
    contextLength: 100000,
    costPer1MInput: 1,
    costPer1MOutput: 3,
  },
};

// Provider API 端点配置
export const PROVIDER_ENDPOINTS: Record<ProviderType, string> = {
  deepseek: 'https://api.deepseek.com/v1',
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  zhipu: 'https://open.bigmodel.cn/api/paas/v4',
  qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  ERNIE: 'https://qianfan.baidubce.com/v2',
  moonshot: 'https://api.moonshot.cn/v1',
};
