/**
 * Workflow Node Factory - 工作流节点工厂
 * TaskFlow AI v4.0
 */

import { WorkflowNodeDefinition, NodeExecutor, NodeOutput, NodeContext } from '../../types/workflow';

export class WorkflowNodeFactory {
  private nodes: Map<string, WorkflowNodeDefinition> = new Map();
  private nodeExecutors: Map<string, NodeExecutor> = new Map();

  /**
   * 注册工作流节点
   */
  register(definition: WorkflowNodeDefinition): void {
    this.nodes.set(definition.type, definition);
    this.nodeExecutors.set(definition.type, definition.executor);
  }

  /**
   * 批量注册节点
   */
  registerBatch(definitions: WorkflowNodeDefinition[]): void {
    definitions.forEach(def => this.register(def));
  }

  /**
   * 获取节点定义
   */
  get(nodeType: string): WorkflowNodeDefinition | undefined {
    return this.nodes.get(nodeType);
  }

  /**
   * 获取节点执行器
   */
  getExecutor(nodeType: string): NodeExecutor | undefined {
    return this.nodeExecutors.get(nodeType);
  }

  /**
   * 检查节点是否存在
   */
  has(nodeType: string): boolean {
    return this.nodes.has(nodeType);
  }

  /**
   * 执行节点
   */
  async execute(
    nodeType: string,
    input: Record<string, unknown>,
    context: NodeContext
  ): Promise<NodeOutput> {
    const executor = this.nodeExecutors.get(nodeType);
    if (!executor) {
      throw new Error(`Node executor not found: ${nodeType}`);
    }
    return executor(input, context);
  }

  /**
   * 列出所有节点类型
   */
  listTypes(): string[] {
    return Array.from(this.nodes.keys());
  }

  /**
   * 按并行能力筛选
   */
  getParallelizableTypes(): WorkflowNodeDefinition[] {
    return Array.from(this.nodes.values()).filter(n => n.parallelizable);
  }

  /**
   * 注销节点
   */
  unregister(nodeType: string): boolean {
    this.nodes.delete(nodeType);
    this.nodeExecutors.delete(nodeType);
    return true;
  }

  /**
   * 清空所有节点
   */
  clear(): void {
    this.nodes.clear();
    this.nodeExecutors.clear();
  }
}
