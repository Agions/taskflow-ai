/**
 * Tool Registry - 工具注册表
 * TaskFlow AI v4.0
 */

import { ToolDefinition, ToolCategory, ToolResult, ToolCategories } from '../types/tool';
import { Logger } from '../utils/logger';
import { getEventBus } from '../core/events';

/**
 * ToolCategory 值数组
 */
const TOOL_CATEGORY_VALUES: ToolCategory[] = [
  'filesystem', 'shell', 'http', 'git', 'database', 'code', 'ai', 'custom'
];

export interface ToolRegistration {
  definition: ToolDefinition;
  registeredAt: number;
  usageCount: number;
  lastUsedAt: number;
}

export class ToolRegistry {
  private logger: Logger;
  private tools: Map<string, ToolRegistration> = new Map();
  private byCategory: Map<ToolCategory, Set<string>> = new Map();
  private eventBus = getEventBus();

  constructor() {
    this.logger = Logger.getInstance('ToolRegistry');
    this.initializeCategories();
  }

  private initializeCategories(): void {
    TOOL_CATEGORY_VALUES.forEach(category => {
      this.byCategory.set(category, new Set());
    });
  }

  /**
   * 注册工具
   */
  register(definition: ToolDefinition): void {
    if (this.tools.has(definition.id)) {
      this.logger.warn(`Tool ${definition.id} already registered, overwriting`);
    }

    const registration: ToolRegistration = {
      definition,
      registeredAt: Date.now(),
      usageCount: 0,
      lastUsedAt: 0
    };

    this.tools.set(definition.id, registration);
    this.byCategory.get(definition.category)?.add(definition.id);

    this.logger.info(`Registered tool: ${definition.id} (${definition.name})`);

    this.eventBus.emit({
      type: 'tool.registered' as any,
      payload: { toolId: definition.id, category: definition.category },
      timestamp: Date.now(),
      source: 'ToolRegistry',
      id: `event-${Date.now()}`
    });
  }

  /**
   * 获取工具
   */
  get(toolId: string): ToolDefinition | undefined {
    const registration = this.tools.get(toolId);
    return registration?.definition;
  }

  /**
   * 检查工具是否存在
   */
  has(toolId: string): boolean {
    return this.tools.has(toolId);
  }

  /**
   * 列出所有工具
   */
  listAll(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(r => r.definition);
  }

  /**
   * 按类别列出工具
   */
  listByCategory(category: ToolCategory): ToolDefinition[] {
    const toolIds = this.byCategory.get(category);
    if (!toolIds) return [];

    return Array.from(toolIds)
      .map(id => this.tools.get(id)!)
      .filter(Boolean)
      .map(r => r.definition);
  }

  /**
   * 注销工具
   */
  unregister(toolId: string): boolean {
    const registration = this.tools.get(toolId);
    if (!registration) {
      return false;
    }

    this.byCategory.get(registration.definition.category)?.delete(toolId);
    this.tools.delete(toolId);

    this.logger.info(`Unregistered tool: ${toolId}`);
    return true;
  }

  /**
   * 记录工具使用
   */
  recordUsage(toolId: string): void {
    const registration = this.tools.get(toolId);
    if (registration) {
      registration.usageCount++;
      registration.lastUsedAt = Date.now();
    }
  }

  /**
   * 获取工具统计
   */
  getStats(toolId: string) {
    const registration = this.tools.get(toolId);
    if (!registration) return undefined;

    return {
      usageCount: registration.usageCount,
      lastUsedAt: registration.lastUsedAt,
      registeredAt: registration.registeredAt
    };
  }

  /**
   * 清空所有注册
   */
  clear(): void {
    this.tools.clear();
    this.byCategory.forEach(set => set.clear());
    this.logger.info('Cleared all tool registrations');
  }
}
