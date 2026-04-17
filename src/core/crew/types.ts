/**
 * TaskFlow AI - Crew 多 Agent 协作系统类型定义
 * 差异化设计: Workflow-First Agent System
 * 核心概念: Workflow → Stage → Agent → Result
 */

import { AgentCapability } from '../agent/types';

// ============================================================
// 1. Agent 定义（差异化：专业分工 instead of 角色扮演）
// ============================================================

/**
 * Agent 专业类型（取代 crewAI 的 role）
 * 每个专业有明确的职责边界和工具偏好
 */
export type AgentSpecialty =
  | 'researcher' // 需求研究员 - PRD 解析、信息提取
  | 'planner' // 计划员 - 任务拆解、优先级排序
  | 'coder' // 工程师 - 代码编写、调试
  | 'reviewer' // 审查员 - 代码审查、质量把控
  | 'documenter'; // 文档员 - 文档生成、注释编写

/**
 * Agent 配置（差异化：专业 + 工具 + 能力）
 */
export interface CrewAgentConfig {
  /** Agent ID */
  id: string;
  /** Agent 名称 */
  name: string;
  /** 专业类型 */
  specialty: AgentSpecialty;
  /** 描述 */
  description?: string;
  /** 模型配置 */
  model?: string;
  /** 工具列表（MCP 工具名）*/
  tools: string[];
  /** 能力列表 */
  capabilities: AgentCapability[];
  /** 最大执行步骤 */
  maxSteps?: number;
  /** 是否启用反思 */
  reflectionEnabled?: boolean;
}

// ============================================================
// 2. Stage 定义（差异化：工作流阶段 Instead of 简单任务）
// ============================================================

/**
 * Stage 输入来源
 */
export interface StageInput {
  /** 静态模板 */
  template?: string;
  /** 从上下文获取的 key */
  fromContext?: string;
  /** 默认值 */
  defaultValue?: string;
}

/**
 * Stage 输出 Schema（差异化：强类型输出验证）
 */
export interface OutputSchema {
  /** 输出字段定义 */
  fields: {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description?: string;
    required?: boolean;
  }[];
  /** 输出示例（用于 few-shot）*/
  example?: Record<string, unknown>;
}

/**
 * Stage 状态
 */
export type StageStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

/**
 * Stage 定义（差异化：与工作流深度绑定）
 */
export interface Stage {
  /** Stage ID */
  id: string;
  /** Stage 名称 */
  name: string;
  /** Agent 配置 */
  agent: CrewAgentConfig;
  /** 输入定义 */
  input: StageInput;
  /** 输出 Schema */
  output?: OutputSchema;
  /** 执行超时(ms) */
  timeout?: number;
  /** 成功后跳转 */
  onSuccess?: string;
  /** 失败后跳转 */
  onFailure?: string;
  /** 是否必需（false 则失败后跳过）*/
  required?: boolean;
  /** 条件执行 */
  condition?: string;
}

// ============================================================
// 3. Workflow 定义（核心差异化：以工作流为核心抽象）
// ============================================================

/**
 * Workflow 状态
 */
export type WorkflowStatus = 'created' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Workflow 执行历史
 */
export interface WorkflowHistoryEntry {
  stageId: string;
  stageName: string;
  status: StageStatus;
  startTime: number;
  endTime?: number;
  duration?: number;
  input: unknown;
  output?: unknown;
  error?: string;
}

/**
 * Workflow 定义
 */
export interface Workflow {
  /** Workflow ID */
  id: string;
  /** Workflow 名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 工作流阶段列表 */
  stages: Stage[];
  /** 初始 Stage ID */
  entryStage: string;
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

// ============================================================
// 4. SharedContext（crewAI 没有的！工作流共享上下文）
// ============================================================

/**
 * PRD 文档结构
 */
export interface PRDDocument {
  title?: string;
  overview?: string;
  requirements: string[];
  constraints?: string[];
  acceptanceCriteria?: string[];
  raw: string; // 原始内容
}

/**
 * 任务计划结构
 */
export interface TaskPlan {
  tasks: {
    id: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    dependencies?: string[];
    estimatedHours?: number;
  }[];
  totalEstimatedHours?: number;
}

/**
 * 代码产物结构
 */
export interface CodeArtifact {
  files: {
    path: string;
    content: string;
    language?: string;
  }[];
}

/**
 * 审查结果结构
 */
export interface ReviewResult {
  issues: {
    severity: 'critical' | 'major' | 'minor';
    file?: string;
    line?: number;
    message: string;
    suggestion?: string;
  }[];
  score: number; // 0-100
  summary: string;
}

/**
 * 共享上下文（差异化：跨 Stage 数据共享）
 */
export interface SharedContext {
  /** PRD 文档 */
  prd?: PRDDocument;
  /** 任务计划 */
  plan?: TaskPlan;
  /** 代码产物 */
  code?: CodeArtifact;
  /** 审查结果 */
  review?: ReviewResult;
  /** 自定义数据 */
  [key: string]: unknown;
}

// ============================================================
// 5. Workflow 执行结果
// ============================================================

/**
 * Stage 执行结果
 */
export interface StageExecutionResult {
  stageId: string;
  stageName: string;
  status: StageStatus;
  input: unknown;
  output?: unknown;
  error?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  steps?: {
    thought: string;
    action?: string;
    observation?: string;
  }[];
}

/**
 * Workflow 执行结果
 */
export interface WorkflowExecutionResult {
  workflowId: string;
  workflowName: string;
  status: WorkflowStatus;
  context: SharedContext;
  stageResults: StageExecutionResult[];
  startTime: number;
  endTime?: number;
  duration?: number;
  error?: string;
}

// ============================================================
// 6. CLI 相关类型
// ============================================================

/**
 * Crew 创建选项
 */
export interface CrewCreateOptions {
  name: string;
  description?: string;
  stages?: Stage[];
}

/**
 * Workflow 模板
 */
export interface WorkflowTemplate {
  name: string;
  description: string;
  category: 'prd-to-code' | 'code-review' | 'research' | 'custom';
  stages: Stage[];
  entryStage?: string;
}

/**
 * 内置 Workflow 模板
 */
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    name: 'prd-to-code',
    description: '从 PRD 文档到可运行代码的完整流程',
    category: 'prd-to-code',
    stages: [
      {
        id: 'parse-prd',
        name: '解析 PRD',
        agent: {
          id: 'agent-researcher',
          name: '需求研究员',
          specialty: 'researcher',
          description: '解析 PRD 文档，提取需求',
          tools: ['mcp_prd_parser'],
          capabilities: ['reasoning'],
        },
        input: { fromContext: 'prd.raw' },
        output: {
          fields: [
            { name: 'title', type: 'string', required: true },
            { name: 'requirements', type: 'array', required: true },
            { name: 'acceptanceCriteria', type: 'array' },
          ],
        },
      },
      {
        id: 'plan-tasks',
        name: '制定计划',
        agent: {
          id: 'agent-planner',
          name: '计划员',
          specialty: 'planner',
          description: '拆解任务，制定执行计划',
          tools: [],
          capabilities: ['reasoning'],
        },
        input: { fromContext: 'prd' },
        output: {
          fields: [
            { name: 'tasks', type: 'array', required: true },
            { name: 'totalEstimatedHours', type: 'number' },
          ],
        },
      },
      {
        id: 'implement',
        name: '编写代码',
        agent: {
          id: 'agent-coder',
          name: '工程师',
          specialty: 'coder',
          description: '实现代码功能',
          tools: ['mcp_file_write', 'mcp_shell_exec'],
          capabilities: ['code', 'tool_use'],
        },
        input: { fromContext: 'plan' },
        output: {
          fields: [{ name: 'files', type: 'array', required: true }],
        },
      },
      {
        id: 'review-code',
        name: '审查代码',
        agent: {
          id: 'agent-reviewer',
          name: '审查员',
          specialty: 'reviewer',
          description: '代码审查，发现问题',
          tools: ['mcp_file_read'],
          capabilities: ['reasoning', 'code'],
        },
        input: { fromContext: 'code' },
        output: {
          fields: [
            { name: 'issues', type: 'array' },
            { name: 'score', type: 'number' },
          ],
        },
        required: false,
      },
    ],
    entryStage: 'parse-prd',
  },
  {
    name: 'code-review',
    description: '代码审查工作流',
    category: 'code-review',
    stages: [
      {
        id: 'review',
        name: '代码审查',
        agent: {
          id: 'agent-reviewer',
          name: '审查员',
          specialty: 'reviewer',
          tools: ['mcp_file_read'],
          capabilities: ['reasoning', 'code'],
        },
        input: { fromContext: 'code' },
        output: {
          fields: [
            { name: 'issues', type: 'array' },
            { name: 'score', type: 'number' },
          ],
        },
      },
    ],
    entryStage: 'review',
  },
];
