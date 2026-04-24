/**
 * 工作流节点上下文
 */
export interface NodeContext {
  nodeId: string;
  workflowId: string;
  executionId: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  state: Record<string, unknown>;
  logger: any;
}
