/**
 * 性能优化的 ToolRegistry
 * TaskFlow AI v4.0
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
  { name: 'file_read', category: 'filesystem', description: '读取文件内容' },
  { name: 'file_write', category: 'filesystem', description: '写入文件内容' },
  { name: 'file_search', category: 'filesystem', description: '搜索文件' },
  { name: 'file_list', category: 'filesystem', description: '列出目录文件' },
  { name: 'bash', category: 'system', description: '执行 Bash 命令' },
  { name: 'git', category: 'system', description: '执行 Git 命令' },
  { name: 'http_request', category: 'network', description: '发送 HTTP 请求' },
  { name: 'web_search', category: 'network', description: '网络搜索' },
  { name: 'code_search', category: 'code', description: '代码搜索' },
  { name: 'code_analysis', category: 'code', description: '代码分析' },
  { name: 'db_query', category: 'database', description: '执行数据库查询' },
];

/**
 * 缓存的工具信息（避免重复计算）
 */
interface CachedToolInfo {
  tool: Tool;
  lowercaseName: string;
  lowercaseDescription: string;
  lowercaseTags: string[];
}

/**
 * 性能优化的工具注册表
 */
export class ToolRegistry {
  private tools: Map<string, CachedToolInfo> = new Map();
  private toolsByCategory: Map<ToolCategory, Set<string>> = new Map(); // 按类别索引
  private toolCalls: Map<string, ToolCall> = new Map();
  private eventBus = getEventBus();
  private maxCallHistory: number;

  // 性能配置
  private readonly MAX_CALL_HISTORY = 500;
  private readonly TOOL_CALL_TTL = 7200000; // 2小时

  // 性能指标
  private metrics = {
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageExecutionTime: 0
  };

  constructor(maxCallHistory: number = 500) {
    this.maxCallHistory = maxCallHistory;
    logger.info('ToolRegistry 初始化');
    this.initializeCategoryIndex();
  }

  /**
   * 初始化类别索引
   */
  private initializeCategoryIndex(): void {
    const categories: ToolCategory[] = ['filesystem', 'system', 'network', 'code', 'database', 'custom'];
    for (const category of categories) {
      this.toolsByCategory.set(category, new Set());
    }
  }

  /**
   * 注册工具（优化版）
   */
  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      logger.warn(`工具 ${tool.name} 已存在，将被覆盖`);
    }

    // 创建缓存的工具信息
    const cachedInfo: CachedToolInfo = {
      tool,
      lowercaseName: tool.name.toLowerCase(),
      lowercaseDescription: tool.description.toLowerCase(),
      lowercaseTags: (tool.tags || []).map(tag => tag.toLowerCase())
    };

    this.tools.set(tool.name, cachedInfo);

    // 更新类别索引
    if (this.toolsByCategory.has(tool.category)) {
      this.toolsByCategory.get(tool.category)!.add(tool.name);
    }

    logger.debug(`工具注册: ${tool.name} [${tool.category}]`);
  }

  /**
   * 批量注册工具（优化版）
   */
  registerMany(tools: Tool[]): void {
    for (const tool of tools) {
      this.register(tool);
    }
    logger.info(`批量注册 ${tools.length} 个工具`);
  }

  /**
   * 获取工具（优化版）
   */
  get(name: string): Tool | undefined {
    const cached = this.tools.get(name);
    return cached?.tool;
  }

  /**
   * 获取所有工具
   */
  getAll(): Tool[] {
    // 优化：避免创建临时数组
    const result: Tool[] = [];
    for (const cached of this.tools.values()) {
      result.push(cached.tool);
    }
    return result;
  }

  /**
   * 按类别获取工具（优化版）
   */
  getByCategory(category: ToolCategory): Tool[] {
    const categoryTools = this.toolsByCategory.get(category);
    if (!categoryTools) return [];

    const result: Tool[] = [];
    for (const name of categoryTools) {
      const cached = this.tools.get(name);
      if (cached) {
        result.push(cached.tool);
      }
    }
    return result;
  }

  /**
   * 搜索工具（优化版）
   */
  search(query: string): Tool[] {
    const lower = query.toLowerCase();
    const result: Tool[] = [];

    // 优化：使用预计算的缓存信息
    for (const cached of this.tools.values()) {
      if (
        cached.lowercaseName.includes(lower) ||
        cached.lowercaseDescription.includes(lower) ||
        cached.lowercaseTags.some(tag => tag.includes(lower))
      ) {
        result.push(cached.tool);
      }
    }

    return result;
  }

  /**
   * 移除工具
   */
  unregister(name: string): boolean {
    const cached = this.tools.get(name);
    if (cached) {
      // 从类别索引中移除
      const categoryTools = this.toolsByCategory.get(cached.tool.category);
      if (categoryTools) {
        categoryTools.delete(name);
      }
    }
    return this.tools.delete(name);
  }

  /**
   * 执行工具（性能优化版）
   */
  async execute(
    name: string,
    params: Record<string, unknown>,
    context: ToolContext,
    options?: ToolExecuteOptions
  ): Promise<ToolResult> {
    const startTime = Date.now();
    this.metrics.totalCalls++;

    const cached = this.tools.get(name);
    if (!cached) {
      this.metrics.failedCalls++;
      return {
        success: false,
        error: `工具 ${name} 不存在`,
        duration: Date.now() - startTime,
      };
    }

    const tool = cached.tool;
    const callId = this.generateCallId(name);

    const toolCall: ToolCall = {
      id: callId,
      toolName: name,
      params,
      context,
      startTime,
    };

    this.toolCalls.set(callId, toolCall);
    this.trimCallHistory();
    this.cleanupOldCalls(); // 新增：清理旧调用

    // 异步发送开始事件
    this.emitToolEventAsync('tool_call_start', name, callId, params);

    try {
      const timeout = options?.timeout || tool.timeout || 30000;
      const maxRetries = options?.maxRetries || (tool.retryable ? 2 : 0);

      let lastError: Error | undefined;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await this.executeWithTimeout(tool.handler, params, context, timeout);

          const duration = Date.now() - startTime;
          toolCall.endTime = Date.now();
          toolCall.result = result;

          // 更新性能指标
          this.metrics.successfulCalls++;
          this.updateExecutionMetrics(duration);

          // 异步发送完成事件
          this.emitToolEventAsync('tool_call_complete', name, callId, undefined, result);

          logger.debug(`工具执行成功: ${name} (${duration}ms)`);
          return { ...result, duration };
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          if (attempt < maxRetries) {
            logger.warn(
              `工具 ${name} 执行失败，${attempt + 1}/${maxRetries} 重试:`,
              lastError.message
            );
            await this.sleep(Math.pow(2, attempt) * 100);
          }
        }
      }

      // 所有重试都失败
      this.metrics.failedCalls++;
      const duration = Date.now() - startTime;
      const errorResult: ToolResult = {
        success: false,
        error: lastError?.message || '执行失败',
        duration,
      };
      toolCall.endTime = Date.now();
      toolCall.result = errorResult;

      this.emitToolEventAsync('tool_call_error', name, callId, undefined, undefined, lastError?.message);

      return errorResult;
    } catch (error) {
      this.metrics.failedCalls++;
      const duration = Date.now() - startTime;
      const errorResult: ToolResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
      };
      toolCall.endTime = Date.now();
      toolCall.result = errorResult;

      this.emitToolEventAsync('tool_call_error', name, callId, undefined, undefined, errorResult.error);

      return errorResult;
    }
  }

  /**
   * 优化：高效生成调用ID
   */
  private generateCallId(toolName: string): string {
    return `call-${toolName}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  /**
   * 清理旧调用（新增）
   */
  private cleanupOldCalls(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [id, call] of this.toolCalls.entries()) {
      if (call.endTime && now - call.endTime > this.TOOL_CALL_TTL) {
        toDelete.push(id);
      }
    }

    for (const id of toDelete) {
      this.toolCalls.delete(id);
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
   * 异步发送工具事件（优化版）
   */
  private emitToolEventAsync(
    type: 'tool_call_start' | 'tool_call_complete' | 'tool_call_error',
    toolName: string,
    callId: string,
    params?: Record<string, unknown>,
    result?: ToolResult,
    error?: string
  ): void {
    setImmediate(() => {
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
        type: TaskFlowEvent.TASK_COMPLETED,
        payload: event,
        timestamp: Date.now(),
        source: 'ToolRegistry',
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      });
    });
  }

  /**
   * 获取调用历史
   */
  getCallHistory(limit?: number): ToolCall[] {
    // 优化：避免创建临时数组多次
    const calls = Array.from(this.toolCalls.values()).sort((a, b) => b.startTime - a.startTime);
    return limit ? calls.slice(0, limit) : calls;
  }

  /**
   * 获取调用统计（优化版）
   */
  getStats(): {
    totalTools: number;
    byCategory: Record<ToolCategory, number>;
    totalCalls: number;
    successRate: number;
    averageExecutionTime: number;
  } {
    const byCategory: Record<ToolCategory, number> = {
      filesystem: 0,
      system: 0,
      network: 0,
      code: 0,
      database: 0,
      custom: 0,
    };

    // 优化：使用类别索引统计
    for (const [category, tools] of this.toolsByCategory.entries()) {
      byCategory[category] = tools.size;
    }

    const totalCalls = this.metrics.totalCalls;

    return {
      totalTools: this.tools.size,
      byCategory,
      totalCalls,
      successRate: totalCalls > 0 ? this.metrics.successfulCalls / totalCalls : 0,
      averageExecutionTime: this.metrics.averageExecutionTime,
    };
  }

  /**
   * 更新执行指标
   */
  private updateExecutionMetrics(duration: number): void {
    // 使用移动平均
    this.metrics.averageExecutionTime =
      this.metrics.averageExecutionTime * 0.9 + duration * 0.1;
  }

  /**
   * 清理调用历史（优化版）
   */
  private trimCallHistory(): void {
    if (this.toolCalls.size > this.maxCallHistory) {
      // 优化：只查找需要的数量
      const sorted = Array.from(this.toolCalls.entries())
        .sort((a, b) => a[1].startTime - b[1].startTime)
        .slice(0, this.toolCalls.size - this.maxCallHistory);

      for (const [id] of sorted) {
        this.toolCalls.delete(id);
      }
    }
  }

  /**
   * 清除所有工具
   */
  clear(): void {
    this.tools.clear();
    this.toolsByCategory.clear();
    this.initializeCategoryIndex();
    this.toolCalls.clear();
    logger.info('ToolRegistry 已清除');
  }

  /**
   * 获取性能指标
   */
  getMetrics() {
    return { ...this.metrics };
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
