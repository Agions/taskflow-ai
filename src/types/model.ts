/**
 * 模型相关类型定义
 */

/**
 * 服务响应类型
 */
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
import { ModelType } from './config';

/**
 * 消息角色
 */
export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

/**
 * 聊天消息
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
}

/**
 * 基本模型请求参数
 */
export interface ModelRequestParams {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
}

/**
 * 基本模型响应
 */
export interface ModelResponse {
  content: string;
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * 模型调用选项
 */
export interface ModelCallOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  timeout?: number;
}

/**
 * 模型服务能力
 */
export interface ModelCapabilities {
  modelType: ModelType;
  maxContextLength: number;
  supportsStreaming: boolean;
  supportsFunctionCalling?: boolean;
  supportsMultimodalInput?: boolean;
  supportsVision?: boolean;
  maxResponseTokens: number;
}

/**
 * 多模型配置
 */
export interface MultiModelConfig {
  enabled: boolean;
  primary: ModelType;
  fallback: ModelType[];
  loadBalancing?: boolean;
  costOptimization?: boolean;
}

/**
 * PRD解析选项
 */
export interface ParseOptions {
  modelType?: ModelType;
  multiModel?: MultiModelConfig;
  extractSections?: boolean;
  extractFeatures?: boolean;
  prioritize?: boolean;
  outputPath?: string;
}

/**
 * 任务规划选项
 */
export interface PlanningOptions {
  modelType?: ModelType;
  taskTemplate?: string;
  estimateDuration?: boolean;
  assignTasks?: boolean;
  suggestDependencies?: boolean;
  // 任务编排选项
  optimizeForTime?: boolean;
  optimizeForResources?: boolean;
  considerTeamSize?: number;
  maxParallelTasks?: number;
  includeTestTasks?: boolean;
  includeDocTasks?: boolean;
}

/**
 * 测试生成选项
 */
export interface TestGenerationOptions {
  modelType?: ModelType;
  framework?: string;
  coverage?: boolean;
  includeEdgeCases?: boolean;
  mockDependencies?: boolean;
}

/**
 * 文件类型
 */
export enum FileType {
  MARKDOWN = 'markdown',
  PDF = 'pdf',
  WORD = 'word',
  TEXT = 'text',
  JSON = 'json',
  UNKNOWN = 'unknown',
}

/**
 * 百度文心API请求体
 */
export interface BaiduRequestBody {
  messages: {
    role: string;
    content: string;
  }[];
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  user_id?: string;
}

/**
 * 百度文心API响应体
 */
export interface BaiduResponseBody {
  id: string;
  object: string;
  created: number;
  sentence_id?: number;
  is_end?: boolean;
  result: string;
  need_clear_history: boolean;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * 讯飞星火API请求体
 */
export interface XunfeiRequestBody {
  header: {
    app_id: string;
    uid?: string;
  };
  parameter: {
    chat: {
      domain: string;
      temperature?: number;
      max_tokens?: number;
      top_k?: number;
    };
  };
  payload: {
    message: {
      text: {
        role: string;
        content: string;
      }[];
    };
  };
}

/**
 * 讯飞星火API响应体
 */
export interface XunfeiResponseBody {
  header: {
    code: number;
    message: string;
    sid: string;
    status: number;
  };
  payload: {
    choices: {
      status: number;
      seq: number;
      text: {
        content: string;
        role: string;
      }[];
    };
    usage?: {
      text: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    };
  };
}

/**
 * 智谱API请求体
 */
export interface ZhipuRequestBody {
  model: string;
  messages: {
    role: string;
    content: string;
  }[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
}

/**
 * 智谱API响应体
 */
export interface ZhipuResponseBody {
  id: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * DeepSeek API请求体
 */
export interface DeepseekRequestBody {
  model: string;
  messages: {
    role: string;
    content: string;
  }[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
}

/**
 * DeepSeek API响应体
 */
export interface DeepseekResponseBody {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
} 