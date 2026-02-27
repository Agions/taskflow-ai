/**
 * 思维链操作
 */

import { ThoughtChain, ThoughtNode, ThoughtType, ToolCall } from './types';
import { ThoughtChainCore } from './chain-core';

/**
 * 思维链操作管理器
 */
export class ThoughtChainOperations {
  constructor(private core: ThoughtChainCore) {}

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
    return this.core.addNode(
      chainId,
      targetNodeId,
      'reflection',
      reflection,
      '反思审查',
      { confidence, model }
    );
  }

  /**
   * 添加工具调用
   */
  addToolCall(chainId: string, nodeId: string, toolCall: ToolCall): void {
    const chain = this.core.getChain(chainId);
    const node = chain?.nodes.get(nodeId);

    if (node) {
      node.toolCalls = node.toolCalls || [];
      node.toolCalls.push(toolCall);
    }
  }

  /**
   * 遍历思维树
   */
  traverseTree(
    node: ThoughtNode,
    callback: (node: ThoughtNode, depth: number) => void,
    depth = 0
  ): void {
    callback(node, depth);
    for (const child of node.children) {
      this.traverseTree(child, callback, depth + 1);
    }
  }

  /**
   * 获取类型标题
   */
  getTypeTitle(type: ThoughtType): string {
    const titles: Record<ThoughtType, string> = {
      requirement: '🎯 理解需求',
      analysis: '📊 分析问题',
      decomposition: '🔨 拆解任务',
      task: '📋 生成任务',
      action: '⚡ 执行行动',
      reflection: '🔍 反思审查',
      synthesis: '✅ 综合总结',
    };
    return titles[type];
  }
}
