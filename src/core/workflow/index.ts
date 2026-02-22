/**
 * 工作流模块导出
 */

export * from './types';
export * from './parser';
export * from './executor';
export * from './engine';

import { WorkflowEngine } from './engine';

// 导出单例
export const workflowEngine = new WorkflowEngine();
