/**
 * TaskFlow AI
 * 智能PRD文档解析与任务管理助手，专为开发团队设计的AI驱动任务编排工具
 */

// 导出核心引擎
export { TaskFlowEngine } from './core/engine/taskflow-engine';

// 导出核心组件
export { PRDParser, PRDParseResult } from './core/parser/prd-parser';
export { TaskPlanner } from './core/planner/task-planner';
export { TaskManager } from './core/task/task-manager';
export { TaskVisualizer, VisualizationType } from './core/visualizer/task-visualizer';

// 导出编排引擎
export { TaskOrchestrationEngine } from './orchestration/TaskOrchestrationEngine';
export { OrchestrationFactory, OrchestrationPreset } from './orchestration/OrchestrationFactory';

// 导出MCP服务接口
export * from './mcp/service';

// 导出主要服务类
export { TaskFlowService } from './mcp/index';

// 导出核心类型
export { ModelType, LogLevel } from './types/config';
export { FileType, MessageRole, ModelCallOptions, ServiceResponse, ParseOptions } from './types/model';
export {
  Task,
  TaskPlan,
  TaskStatus,
  TaskPriority,
  TaskType,
  ParsedPRD,
  Feature
} from './types/task';

// 导出MCP服务
export { taskFlowService } from './mcp/index';

// 版本信息
export const VERSION = '1.3.0';
