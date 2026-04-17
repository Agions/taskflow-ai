/**
 * @taskflow-ai/core - TaskFlow AI 核心库
 * 任务管理、工作流引擎、插件系统
 */

export { TaskGenerator } from './tasks/index.js';
export type { Task, TaskFlowConfig, PRDDocument } from './tasks/index.js';

export { WorkflowEngine, ParallelExecutor } from './workflow/engine.js';
export type { Workflow, WorkflowExecution, WorkflowStep, ExecutionResult } from './workflow/types.js';

export { PluginManager } from './plugin/manager.js';
export type { Plugin, PluginContext, PluginHooks } from './plugin/types.js';

export { ConfigManager, loadConfig, saveConfig } from './config/index.js';
export type { TaskFlowConfig, AIModelConfig } from './config/types.js';
