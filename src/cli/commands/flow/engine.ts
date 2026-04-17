/**
 * Flow 命令引擎
 */

import { WorkflowEngine, WorkflowParser } from '../../../core/workflow';

let engine: WorkflowEngine | null = null;
let parser: WorkflowParser | null = null;

/**
 * 获取工作流引擎
 */
export function getEngine(): WorkflowEngine {
  if (!engine) {
    engine = new WorkflowEngine();
  }
  return engine;
}

/**
 * 获取工作流解析器
 */
export function getParser(): WorkflowParser {
  if (!parser) {
    parser = new WorkflowParser();
  }
  return parser;
}

/**
 * 重置引擎（用于测试）
 */
export function resetEngine(): void {
  engine = null;
  parser = null;
}
