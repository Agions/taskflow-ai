/**
 * 任务执行 Agent 类型定义
 * 说明: 此模块为旧版 "任务执行 Agent" 系统，用于基于 PRD 文档的任务执行、状态机管理
 * 与新版 AI Agent 运行时 (src/core/agent/) 是不同的系统:
 *   - 此模块: 任务执行引擎，基于状态机和 PRD 解析
 *   - src/core/agent/: AI Agent 运行时，基于能力、记忆和目标解析
 * 请根据需求选择合适的系统。
 */

import { getLogger } from '../../utils/logger';
const logger = getLogger('agent/types/index');

/**
 * Agent 类型定义
 * TaskFlow AI v3.0 - AI Agent 自主执行模式
 */

// Agent 核心类型
export * from './agent';

// PRD 相关
export * from './prd';

// 任务相关
export * from './task';

// 工具相关
export * from './tool';

// 历史记录相关
export * from './history';

// 验证相关
export * from './verification';

// 模板相关
export * from './template';

// 执行相关
export * from './execution';
