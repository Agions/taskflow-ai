/**
 * 思维链管理器
 * 负责创建、管理和序列化思维链
 */

import { ThoughtChain, ThoughtNode, ThoughtType, ThoughtChainOptions, ToolCall } from './types';
import { ThoughtChainCore } from './chain-core';
import { ThoughtChainOperations } from './chain-operations';
import { ThoughtChainSerializer } from './chain-serializer';

/**
 * 思维链管理器
 */
export class ThoughtChainManager {
  private core: ThoughtChainCore;
  private operations: ThoughtChainOperations;
  private serializer: ThoughtChainSerializer;

  constructor(options: ThoughtChainOptions = {}) {
    this.core = new ThoughtChainCore(options);
    this.operations = new ThoughtChainOperations(this.core);
    this.serializer = new ThoughtChainSerializer(this.operations, this.core.getOptions().verbose);
  }

  /**
   * 创建新的思维链
   */
  createChain(input: string, model?: string): ThoughtChain {
    return this.core.createChain(input, model);
  }

  /**
   * 添加思维节点
   */
  addNode(
    chainId: string,
    parentId: string,
    type: ThoughtType,
    content: string,
    reasoning: string,
    options?: {
      confidence?: number;
      model?: string;
      metadata?: Record<string, unknown>;
    }
  ): ThoughtNode | null {
    return this.core.addNode(chainId, parentId, type, content, reasoning, options);
  }

  /**
   * 添加反思节点
   */
  addReflection(
    chainId: string,
    targetNodeId: string,
    reflection: string,
    confidence: number,
    model?: string
  ): ThoughtNode | null {
    return this.operations.addReflection(chainId, targetNodeId, reflection, confidence, model);
  }

  /**
   * 添加工具调用
   */
  addToolCall(chainId: string, nodeId: string, toolCall: ToolCall): void {
    this.operations.addToolCall(chainId, nodeId, toolCall);
  }

  /**
   * 将思维链转换为步骤数组
   */
  toSteps(chain: ThoughtChain): import('./types').ReasoningStep[] {
    return this.serializer.toSteps(chain);
  }

  /**
   * 序列化为文本格式
   */
  toText(chain: ThoughtChain): string {
    return this.serializer.toText(chain);
  }

  /**
   * 序列化为 Markdown 格式
   */
  toMarkdown(chain: ThoughtChain): string {
    return this.serializer.toMarkdown(chain);
  }

  /**
   * 序列化为 JSON 格式
   */
  toJSON(chain: ThoughtChain): string {
    return this.serializer.toJSON(chain);
  }

  /**
   * 导出思维链
   */
  export(chainId: string): string | null {
    const chain = this.core.getChain(chainId);
    if (!chain) return null;

    switch (this.core.getOptions().outputFormat) {
      case 'json':
        return this.serializer.toJSON(chain);
      case 'markdown':
        return this.serializer.toMarkdown(chain);
      default:
        return this.serializer.toText(chain);
    }
  }

  /**
   * 获取思维链
   */
  getChain(chainId: string): ThoughtChain | undefined {
    return this.core.getChain(chainId);
  }

  /**
   * 列出所有思维链
   */
  listChains(): Array<{ id: string; createdAt: number; input: string }> {
    return this.core.listChains();
  }
}

export default ThoughtChainManager;
