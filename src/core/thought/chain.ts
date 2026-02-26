/**
 * 思维链管理器
 * 负责创建、管理和序列化思维链
 */

import { 
  ThoughtNode, 
  ThoughtChain, 
  ThoughtType, 
  ReasoningStep,
  ThoughtChainOptions,
  ToolCall 
} from './types';

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `thought_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 思维链管理器
 */
export class ThoughtChainManager {
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
      metadata: {
        input,
        model,
      },
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
      if (current?.id === nodeId) break; // 防止死循环
    }

    return depth;
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
    return this.addNode(
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
  addToolCall(
    chainId: string,
    nodeId: string,
    toolCall: ToolCall
  ): void {
    const chain = this.chains.get(chainId);
    const node = chain?.nodes.get(nodeId);
    
    if (node) {
      node.toolCalls = node.toolCalls || [];
      node.toolCalls.push(toolCall);
    }
  }

  /**
   * 将思维链转换为步骤数组
   */
  toSteps(chain: ThoughtChain): ReasoningStep[] {
    const steps: ReasoningStep[] = [];
    this.traverseTree(chain.root, (node, depth) => {
      steps.push({
        step: steps.length + 1,
        type: node.type,
        title: this.getTypeTitle(node.type),
        description: node.content,
        reasoning: node.reasoning,
        confidence: node.confidence,
      });
    });
    return steps;
  }

  /**
   * 遍历思维树
   */
  private traverseTree(
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
  private getTypeTitle(type: ThoughtType): string {
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

  /**
   * 序列化为文本格式
   */
  toText(chain: ThoughtChain): string {
    const lines: string[] = [];
    
    lines.push('🤔 思维链分析\n');
    lines.push('─'.repeat(40));
    
    const steps = this.toSteps(chain);
    for (const step of steps) {
      lines.push(`\n${'  '.repeat(step.step - 1)}${step.title}`);
      lines.push(`${'  '.repeat(step.step)}📝 ${step.description}`);
      if (step.reasoning && this.options.verbose) {
        lines.push(`${'  '.repeat(step.step)}💭 ${step.reasoning}`);
      }
      lines.push(`${'  '.repeat(step.step)}📊 置信度: ${(step.confidence * 100).toFixed(0)}%`);
    }

    return lines.join('\n');
  }

  /**
   * 序列化为 Markdown 格式
   */
  toMarkdown(chain: ThoughtChain): string {
    const lines: string[] = [];
    
    lines.push('# 🧠 思维链分析\n');
    lines.push(`> 输入: ${chain.metadata.input?.substring(0, 100)}...`);
    lines.push(`> 模型: ${chain.metadata.model || '未知'}`);
    lines.push(`> 时间: ${new Date(chain.createdAt).toLocaleString()}\n`);
    lines.push('---\n');
    
    const steps = this.toSteps(chain);
    for (const step of steps) {
      lines.push(`## ${step.step}. ${step.title}\n`);
      lines.push(`**描述**: ${step.description}\n`);
      lines.push(`**置信度**: ${(step.confidence * 100).toFixed(0)}%\n`);
      if (step.reasoning && this.options.verbose) {
        lines.push(`**推理**: ${step.reasoning}\n`);
      }
    }

    return lines.join('\n');
  }

  /**
   * 序列化为 JSON 格式
   */
  toJSON(chain: ThoughtChain): string {
    return JSON.stringify({
      id: chain.id,
      createdAt: chain.createdAt,
      metadata: chain.metadata,
      steps: this.toSteps(chain),
    }, null, 2);
  }

  /**
   * 导出思维链
   */
  export(chainId: string): string | null {
    const chain = this.chains.get(chainId);
    if (!chain) return null;

    switch (this.options.outputFormat) {
      case 'json':
        return this.toJSON(chain);
      case 'markdown':
        return this.toMarkdown(chain);
      default:
        return this.toText(chain);
    }
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
}

export default ThoughtChainManager;
