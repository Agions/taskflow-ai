/**
 * 思维链核心类型定义
 */

export type ThoughtType = 
  | 'requirement'    // 需求理解
  | 'analysis'       // 分析
  | 'decomposition'  // 拆解
  | 'task'           // 任务
  | 'action'         // 行动
  | 'reflection'     // 反思
  | 'synthesis';     // 综合

export interface ThoughtNode {
  /** 节点唯一ID */
  id: string;
  /** 思维类型 */
  type: ThoughtType;
  /** 内容 */
  content: string;
  /** 置信度 0-1 */
  confidence: number;
  /** 推理过程 */
  reasoning: string;
  /** 子节点 */
  children: ThoughtNode[];
  /** 生成模型 */
  model?: string;
  /** 时间戳 */
  timestamp: number;
  /** 元数据 */
  metadata?: Record<string, unknown>;
  /** 工具调用 */
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: string;
  error?: string;
}

export interface ThoughtChain {
  /** 链ID */
  id: string;
  /** 根节点 */
  root: ThoughtNode;
  /** 所有节点 (用于快速查找) */
  nodes: Map<string, ThoughtNode>;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
  /** 元数据 */
  metadata: {
    input?: string;
    output?: string;
    duration?: number;
    model?: string;
  };
}

export interface ReasoningStep {
  /** 步骤编号 */
  step: number;
  /** 步骤类型 */
  type: ThoughtType;
  /** 标题 */
  title: string;
  /** 描述 */
  description: string;
  /** 详细推理 */
  reasoning?: string;
  /** 输出 */
  output?: string;
  /** 子步骤 */
  children?: ReasoningStep[];
  /** 置信度 */
  confidence: number;
  /** 耗时 (ms) */
  duration?: number;
}

/** 思维链配置 */
export interface ThoughtChainOptions {
  /** 是否记录完整推理 */
  verbose?: boolean;
  /** 最大深度 */
  maxDepth?: number;
  /** 最大节点数 */
  maxNodes?: number;
  /** 是否启用反思 */
  enableReflection?: boolean;
  /** 输出格式 */
  outputFormat?: 'text' | 'markdown' | 'json';
}

/** 思维解析结果 */
export interface ThoughtParseResult {
  chain: ThoughtChain;
  steps: ReasoningStep[];
  summary: string;
  tasks?: string[];
  risks?: string[];
}
