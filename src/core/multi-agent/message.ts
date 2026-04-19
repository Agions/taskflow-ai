/**
 * Agent Message - 消息处理模块
 */

import { AgentMessage, Attachment, ReasoningStep } from './types';

/**
 * 生成唯一消息 ID
 */
export function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 创建 Agent 消息
 */
export function createAgentMessage(
  role: AgentMessage['role'],
  content: string,
  options: Partial<AgentMessage> = {}
): AgentMessage {
  return {
    id: generateMessageId(),
    role,
    content,
    timestamp: Date.now(),
    ...options,
  };
}

/**
 * 创建用户消息
 */
export function createUserMessage(content: string, attachments?: Attachment[]): AgentMessage {
  return createAgentMessage('user', content, { attachments });
}

/**
 * 创建 Agent 消息 (带推理)
 */
export function createAgentMessageWithReasoning(
  agentId: string,
  agentName: string,
  content: string,
  reasoning: ReasoningStep[]
): AgentMessage {
  return createAgentMessage('agent', content, {
    agentId,
    agentName,
    reasoning,
  });
}

/**
 * 消息转 ChatMessage 格式 (用于 AI 模型)
 */
export function toChatMessage(msg: AgentMessage): {
  role: 'user' | 'assistant' | 'system';
  content: string;
} {
  const prefix = msg.agentName ? `[${msg.agentName}] ` : '';
  return {
    role: msg.role === 'agent' ? 'assistant' : msg.role,
    content: prefix + msg.content,
  };
}

/**
 * Agent 消息列表转 ChatMessage 格式
 */
export function toChatMessages(
  messages: AgentMessage[]
): { role: 'user' | 'assistant' | 'system'; content: string }[] {
  return messages.map(toChatMessage);
}

/**
 * 构建系统提示词 (用于 Agent)
 */
export function buildSystemPrompt(
  agentName: string,
  agentDescription: string,
  instructions: string,
  availableTools: string[]
): string {
  const toolsList =
    availableTools.length > 0
      ? `\n\n可用工具:\n${availableTools.map(t => `- ${t}`).join('\n')}`
      : '';

  return `你是 ${agentName}。
  
角色描述: ${agentDescription}

指令: ${instructions}
${toolsList}

请按照你的角色和指令完成任务。`;
}

/**
 * 消息历史管理器
 */
export class MessageHistory {
  private messages: AgentMessage[] = [];
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  /**
   * 添加消息
   */
  add(message: AgentMessage): void {
    this.messages.push(message);
    this.trim();
  }

  /**
   * 获取所有消息
   */
  getAll(): AgentMessage[] {
    return [...this.messages];
  }

  /**
   * 获取最近 N 条消息
   */
  getRecent(count: number): AgentMessage[] {
    return this.messages.slice(-count);
  }

  /**
   * 清空历史
   */
  clear(): void {
    this.messages = [];
  }

  /**
   * 获取消息数量
   */
  size(): number {
    return this.messages.length;
  }

  /**
   * 裁剪超长历史
   */
  private trim(): void {
    if (this.messages.length > this.maxSize) {
      this.messages = this.messages.slice(-this.maxSize);
    }
  }

  /**
   * 按 Agent 过滤
   */
  filterByAgent(agentId: string): AgentMessage[] {
    return this.messages.filter(m => m.agentId === agentId);
  }

  /**
   * 搜索消息内容
   */
  search(keyword: string): AgentMessage[] {
    const lower = keyword.toLowerCase();
    return this.messages.filter(m => m.content.toLowerCase().includes(lower));
  }
}
