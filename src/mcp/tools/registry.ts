/**
 * 动态工具注册系统
 * 支持运行时注册和管理 MCP 工具
 */

import { Logger } from '../../utils/logger';
import {
  ToolDefinition,
  ToolRegistration,
  ToolCategory
} from './types';
import { defaultCategories, categoryMap } from './categories';
import { allBuiltInTools } from './built-in';
import { filesystemTools } from './filesystem';
import { httpTools } from './http';

export * from './types';

export class ToolRegistry {
  private logger = Logger.getInstance('ToolRegistry');
  private tools: Map<string, ToolRegistration> = new Map();
  private categories: Map<string, ToolCategory> = new Map();

  constructor() {
    this.initBuiltinCategories();
    this.registerBuiltinTools();
  }

  private initBuiltinCategories(): void {
    for (const cat of defaultCategories) {
      this.categories.set(cat.name.toLowerCase().replace(/\s+/g, '-'), cat);
    }
  }

  private registerBuiltinTools(): void {
    for (const tool of allBuiltInTools) {
      this.register(tool);
    }
    for (const tool of filesystemTools) {
      this.register(tool);
    }
    for (const tool of httpTools) {
      this.register(tool);
    }
  }

  register(tool: ToolDefinition): void {
    const registration: ToolRegistration = {
      tool,
      registeredAt: Date.now(),
      callCount: 0,
    };

    this.tools.set(tool.name, registration);

    const categoryKey = tool.category || 'custom';
    const category = this.categories.get(categoryKey);
    if (category && !category.tools.includes(tool.name)) {
      category.tools.push(tool.name);
    }

    this.logger.debug(`Registered tool: ${tool.name}`);
  }

  unregister(name: string): boolean {
    const reg = this.tools.get(name);
    if (!reg) return false;

    const category = this.categories.get(reg.tool.category || 'custom');
    if (category) {
      category.tools = category.tools.filter(t => t !== name);
    }

    this.tools.delete(name);
    this.logger.debug(`Unregistered tool: ${name}`);
    return true;
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name)?.tool;
  }

  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(r => r.tool);
  }

  async execute(name: string, input: Record<string, unknown>): Promise<unknown> {
    const reg = this.tools.get(name);
    if (!reg) {
      throw new Error(`Tool not found: ${name}`);
    }

    const startTime = Date.now();
    try {
      const result = await reg.tool.handler(input);
      reg.callCount++;
      reg.lastCalled = Date.now();
      this.logger.debug(`Executed tool ${name} in ${Date.now() - startTime}ms`);
      return result;
    } catch (error) {
      this.logger.error(`Tool ${name} execution failed:`, error);
      throw error;
    }
  }

  listByCategory(category: string): ToolDefinition[] {
    const cat = this.categories.get(category);
    if (!cat) return [];
    return cat.tools
      .map(name => this.tools.get(name)?.tool)
      .filter((t): t is ToolDefinition => t !== undefined);
  }

  listCategories(): ToolCategory[] {
    return Array.from(this.categories.values());
  }

  getStats(): {
    total: number;
    byCategory: Record<string, number>;
    mostUsed: Array<{ name: string; calls: number }>;
  } {
    const byCategory: Record<string, number> = {};
    const mostUsed: Array<{ name: string; calls: number }> = [];

    for (const [name, reg] of this.tools) {
      const category = reg.tool.category || 'custom';
      byCategory[category] = (byCategory[category] || 0) + 1;
      mostUsed.push({ name, calls: reg.callCount });
    }

    mostUsed.sort((a, b) => b.calls - a.calls);

    return {
      total: this.tools.size,
      byCategory,
      mostUsed: mostUsed.slice(0, 10),
    };
  }
}

export const toolRegistry = new ToolRegistry();
