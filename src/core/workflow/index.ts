/**
 * 工作流模块导出
 */

export * from './types';
export * from './parser';
export * from './executor';
export * from './engine';

import { WorkflowEngine } from './engine';

export const workflowEngine = new WorkflowEngine();
