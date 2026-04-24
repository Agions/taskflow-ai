/**
 * Tool Registry - 工具注册表
 * 统一管理和发现工具
 */

import { getLogger } from '../../utils/logger';
import { getEventBus } from '../events';
import { TaskFlowEvent } from '../../types/event';
import {
  Tool,
  ToolCategory,
  ToolHandler,
  ToolResult,
  ToolContext,
  ToolCall,
  ToolCallEvent,
  ToolExecuteOptions,
  BuiltInToolInfo,
} from './types';

const logger = getLogger('tools');

/**
 * 内置工具列表
 */
export const BUILT_IN_TOOLS: BuiltInToolInfo[] = [
  // 文件操作
  { name: 'file_read', category: 'filesystem', description: '读取文件内容' },
  { name: 'file_write', category: 'filesystem', description: '写入文件内容' },
  { name: 'file_search', category: 'filesystem', description: '搜索文件' },
  { name: 'file_list', category: 'filesystem', description: '列出目录文件' },

  // 命令执行
  { name: 'bash', category: 'system', description: '执行 Bash 命令' },
  { name: 'git', category: 'system', description: '执行 Git 命令' },

  // 网络
  { name: 'http_request', category: 'network', description: '发送 HTTP 请求' },
  { name: 'web_search', category: 'network', description: '网络搜索' },

  // 代码
  { name: 'code_search', category: 'code', description: '代码搜索' },
  { name: 'code_analysis', category: 'code', description: '代码分析' },

  // 数据库
  { name: 'db_query', category: 'database', description: '执行数据库查询' },
];

/**
 * 工具注册表
 */
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private toolCalls: Map<string, ToolCall> = new Map();
  private eventBus = getEventBus();
  private maxCallHistory: number;

  constructor(maxCallHistory: number = 100) {
    this.maxCallHistory = maxCallHistory;
    logger.info('ToolRegistry 初始化');
  }

  /**
   * 注册工具
   */
  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      logger.warn(`工具 ${tool.name} 已存在，将被覆盖`);
    }
    this.tools.set(tool.name, tool);
    logger.debug(`工具注册: ${tool.name} [${tool.category}]`);
  }

  /**
   * 批量注册工具
   */
  registerMany(tools: Tool[]): void {
    for (const tool of tools) {
      this.register(tool);
    }
    logger.info(`批量注册 ${tools.length} 个工具`);
  }

  /**
   * 获取工具
   */
  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * 获取所有工具
   */
  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * 按类别获取工具
   */
  getByCategory(category: ToolCategory): Tool[] {
    return this.getAll().filter(t => t.category === category);
  }

  /**
   * 搜索工具
   */
  search(query: string): Tool[] {
    const lower = query.toLowerCase();
    return this.getAll().filter(
      t =>
        t.name.toLowerCase().includes(lower) ||
        t.description.toLowerCase().includes(lower) ||
        t.tags?.some(tag => tag.toLowerCase().includes(lower))
    );
  }

  /**
   * 移除工具
   */
  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  /**
   * 执行工具
   */
  async execute(
    name: string,
    params: Record<string, unknown>,
    context: ToolContext,
    options?: ToolExecuteOptions
  ): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        success: false,
        error: `工具 ${name} 不存在`,
      };
    }

    const callId = `call-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const startTime = Date.now();

    const toolCall: ToolCall = {
      id: callId,
      toolName: name,
      params,
      context,
      startTime,
    };

    this.toolCalls.set(callId, toolCall);
    this.trimCallHistory();

    // 发送开始事件
    this.emitToolEvent('tool_call_start', name, callId, params);

    try {
      const timeout = options?.timeout || tool.timeout || 30000;
      const maxRetries = options?.maxRetries || (tool.retryable ? 2 : 0);

      let lastError: Error | undefined;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await this.executeWithTimeout(tool.handler, params, context, timeout);

          toolCall.endTime = Date.now();
          toolCall.result = result;

          // 发送完成事件
          this.emitToolEvent('tool_call_complete', name, callId, undefined, result);

          logger.debug(`工具执行成功: ${name} (${toolCall.endTime - startTime}ms)`);
          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          if (attempt < maxRetries) {
            logger.warn(
              `工具 ${name} 执行失败，${attempt + 1}/${maxRetries} 重试:`,
              lastError.message
            );
            await this.sleep(Math.pow(2, attempt) * 100); // 指数退避
          }
        }
      }

      // 所有重试都失败
      const errorResult: ToolResult = {
        success: false,
        error: lastError?.message || '执行失败',
        duration: Date.now() - startTime,
      };
      toolCall.endTime = Date.now();
      toolCall.result = errorResult;

      this.emitToolEvent('tool_call_error', name, callId, undefined, undefined, lastError?.message);

      return errorResult;
    } catch (error) {
      const errorResult: ToolResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
      toolCall.endTime = Date.now();
      toolCall.result = errorResult;

      this.emitToolEvent('tool_call_error', name, callId, undefined, undefined, errorResult.error);

      return errorResult;
    }
  }

  /**
   * 带超时的执行
   */
  private async executeWithTimeout(
    handler: ToolHandler,
    params: Record<string, unknown>,
    context: ToolContext,
    timeout: number
  ): Promise<ToolResult> {
    return Promise.race([
      handler(params, context),
      new Promise<ToolResult>((_, reject) =>
        setTimeout(() => reject(new Error(`工具执行超时 (${timeout}ms)`)), timeout)
      ),
    ]);
  }

  /**
   * 发送工具事件
   */
  private emitToolEvent(
    type: 'tool_call_start' | 'tool_call_complete' | 'tool_call_error',
    toolName: string,
    callId: string,
    params?: Record<string, unknown>,
    result?: ToolResult,
    error?: string
  ): void {
    const event: ToolCallEvent = {
      type,
      toolName,
      toolCallId: callId,
      params,
      result,
      error,
      timestamp: Date.now(),
    };

    this.eventBus.emit({
      type: TaskFlowEvent.TASK_COMPLETED, // 复用任务完成事件
      payload: event,
      timestamp: Date.now(),
      source: 'ToolRegistry',
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    });
  }

  /**
   * 获取调用历史
   */
  getCallHistory(limit?: number): ToolCall[] {
    const calls = Array.from(this.toolCalls.values()).sort((a, b) => b.startTime - a.startTime);
    return limit ? calls.slice(0, limit) : calls;
  }

  /**
   * 获取调用统计
   */
  getStats(): {
    totalTools: number;
    byCategory: Record<ToolCategory, number>;
    totalCalls: number;
    successRate: number;
  } {
    const tools = this.getAll();
    const calls = Array.from(this.toolCalls.values());
    const successful = calls.filter(c => c.result?.success).length;

    const byCategory: Record<ToolCategory, number> = {
      filesystem: 0,
      system: 0,
      network: 0,
      code: 0,
      database: 0,
      custom: 0,
    };

    for (const tool of tools) {
      byCategory[tool.category]++;
    }

    return {
      totalTools: tools.length,
      byCategory,
      totalCalls: calls.length,
      successRate: calls.length > 0 ? successful / calls.length : 0,
    };
  }

  /**
   * 清理调用历史
   */
  private trimCallHistory(): void {
    if (this.toolCalls.size > this.maxCallHistory) {
      const sorted = Array.from(this.toolCalls.entries()).sort(
        (a, b) => b[1].startTime - a[1].startTime
      );

      const toDelete = sorted.slice(this.maxCallHistory);
      for (const [id] of toDelete) {
        this.toolCalls.delete(id);
      }
    }
  }

  /**
   * 清除所有工具
   */
  clear(): void {
    this.tools.clear();
    this.toolCalls.clear();
    logger.info('ToolRegistry 已清除');
  }

  /**
   * 睡眠辅助
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 默认实例
let defaultRegistry: ToolRegistry | null = null;

export function getToolRegistry(): ToolRegistry {
  if (!defaultRegistry) {
    defaultRegistry = new ToolRegistry();
  }
  return defaultRegistry;
}

export { ToolRegistry as default };
