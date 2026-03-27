/**
 * 思维链核心功能
 */

import { ThoughtChain, ThoughtNode, ThoughtType, ThoughtChainOptions, ToolCall } from './types';

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return `thought_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 思维链核心管理器
 */
export class ThoughtChainCore {
  private chains: Map<string, ThoughtChain> = new Map();
  private options: Required<ThoughtChainOptions>;

  constructor(options: ThoughtChainOptions = {}) {
    this.options = {
      verbose: options.verbose ?? true,
      maxDepth: options.maxDepth ?? 10,
      maxNodes: options.maxNodes ?? 100,
      enableReflection: options.enableReflection ?? true,
      outputFormat: options.outputFormat ?? 'markdown',
    };
  }

  /**
   * 创建新的思维链
   */
  createChain(input: string, model?: string): ThoughtChain {
    const id = generateId();
    const now = Date.now();

    const root: ThoughtNode = {
      id: generateId(),
      type: 'requirement',
      content: input,
      confidence: 1.0,
      reasoning: '理解用户输入',
      children: [],
      model,
      timestamp: now,
    };

    const chain: ThoughtChain = {
      id,
      root,
      nodes: new Map([[root.id, root]]),
      createdAt: now,
      updatedAt: now,
      metadata: { input, model },
    };

    this.chains.set(id, chain);
    return chain;
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
    const chain = this.chains.get(chainId);
    if (!chain) {
      console.error(`Chain not found: ${chainId}`);
      return null;
    }

    if (chain.nodes.size >= this.options.maxNodes) {
      console.warn('Max nodes reached');
      return null;
    }

    const parent = chain.nodes.get(parentId);
    if (!parent) {
      console.error(`Parent node not found: ${parentId}`);
      return null;
    }

    const depth = this.getNodeDepth(chain, parentId);
    if (depth >= this.options.maxDepth) {
      console.warn('Max depth reached');
      return null;
    }

    const node: ThoughtNode = {
      id: generateId(),
      type,
      content,
      confidence: options?.confidence ?? 0.8,
      reasoning,
      children: [],
      model: options?.model,
      timestamp: Date.now(),
      metadata: options?.metadata,
    };

    parent.children.push(node);
    chain.nodes.set(node.id, node);
    chain.updatedAt = Date.now();

    return node;
  }

  /**
   * 获取节点深度
   */
  private getNodeDepth(chain: ThoughtChain, nodeId: string): number {
    let depth = 0;
    let current = chain.nodes.get(nodeId);

    while (current && current !== chain.root) {
      depth++;
      for (const [, node] of chain.nodes) {
        if (node.children.some(c => c.id === nodeId)) {
          current = node;
          nodeId = node.id;
          break;
        }
      }
      if (current?.id === nodeId) break;
    }

    return depth;
  }

  /**
   * 获取思维链
   */
  getChain(chainId: string): ThoughtChain | undefined {
    return this.chains.get(chainId);
  }

  /**
   * 列出所有思维链
   */
  listChains(): Array<{ id: string; createdAt: number; input: string }> {
    return Array.from(this.chains.values()).map(chain => ({
      id: chain.id,
      createdAt: chain.createdAt,
      input: chain.metadata.input || '',
    }));
  }

  /**
   * 获取配置选项
   */
  getOptions(): Required<ThoughtChainOptions> {
    return this.options;
  }
}
