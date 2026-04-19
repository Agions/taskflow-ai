/**
 * TaskFlow AI - Crew 多 Agent 协作系统
 * 差异化设计: Workflow-First Agent System
 */

// 类型导出
export * from './types';

// 核心类导出
export { WorkflowContext } from './context';
export { StageExecutor } from './stage';
export { WorkflowEngine } from './workflow';

// 便捷实例
import { WorkflowEngine } from './workflow';
export const workflowEngine = new WorkflowEngine();
