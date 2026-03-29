/**
 * 工具类型
 */

import { TaskFlowConfig } from './config';
import { Project } from './project';
import { OutputFormat } from './visualization';

/**
 * 日志器
 */
export interface Logger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

/**
 * TaskFlow 错误
 */
export interface TaskFlowError extends Error {
  code: string;
  type: ErrorType;
  context?: Record<string, any>;
}

/**
 * 错误类型
 */
export type ErrorType =
  | 'config'
  | 'parsing'
  | 'ai'
  | 'mcp'
  | 'validation'
  | 'network'
  | 'filesystem'
  | 'plugin';

/**
 * CLI 上下文
 */
export interface CLIContext {
  config: TaskFlowConfig;
  project?: Project;
  verbose: boolean;
  debug: boolean;
  outputFormat: OutputFormat;
}

/**
 * 命令结果
 */
export interface CommandResult {
  success: boolean;
  data?: unknown;
  message?: string;
  error?: string;
}

/**
 * 进度指示器
 */
export interface ProgressIndicator {
  start: (message: string) => void;
  update: (message: string) => void;
  succeed: (message: string) => void;
  fail: (message: string) => void;
  stop: () => void;
}

/**
 * 文件监听器
 */
export interface FileWatcher {
  watch: (pattern: string, callback: (event: string, path: string) => void) => void;
  stop: () => void;
}
