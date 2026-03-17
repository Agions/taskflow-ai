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
import { TOOL_CATEGORIES, getCategory } from './categories';

export * from './types';

export class ToolRegistry {
  private logger = Logger.getInstance('ToolRegistry');
  private tools: Map<string, ToolRegistration> = new Map();
  private categories: Map<string, ToolCategory> = new Map();
  private initialized = false;

  constructor() {
    this.initCategories();
  }

  private initCategories(): void {
    for (const cat of TOOL_CATEGORIES) {
      this.categories.set(cat.id, { ...cat, tools: [] });
    }
    // 添加默认分类
    this.categories.set('custom', { 
      id: 'custom', 
      name: 'Custom', 
      description: '自定义工具', 
      tools: [],
    });
  }

  /**
   * 注册所有内置工具
   * 延迟加载以避免循环依赖
   */
  registerBuiltinTools(): void {
    if (this.initialized) return;
    this.initialized = true;

    // 动态导入所有工具
    this.loadTools('./built-in');
    this.loadTools('./filesystem');
    this.loadTools('./http');
    this.loadTools('./database');
    this.loadTools('./vector');
    this.loadTools('./shell');
    this.loadTools('./git');
    this.loadTools('./memory');
  }

  private async loadTools(toolModule: string): Promise<void> {
    try {
      const modules = await import(toolModule);
      const toolArrays = ['fileTools', 'shellTools', 'taskTools', 'httpTools', 'databaseTools', 'vectorTools', 'gitTools', 'memoryTools'];
      
      for (const arrayName of toolArrays) {
        if (modules[arrayName]) {
          for (const tool of modules[arrayName]) {
            this.register(tool);
          }
        }
      }
      
      // 检查默认导出
      if (modules.default) {
        const tools = Array.isArray(modules.default) ? modules.default : [modules.default];
        for (const tool of tools) {
          this.register(tool);
        }
      }
    } catch (error) {
      // 工具模块不存在，跳过
    }
  }

  register(tool: ToolDefinition): void {
    const registration: ToolRegistration = {
      tool,
      registeredAt: Date.now(),
      callCount: 0,
    };

    this.tools.set(tool.name, registration);

    // 添加到分类
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

    const categoryKey = reg.tool.category || 'custom';
    const category = this.categories.get(categoryKey);
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

  listByCategory(categoryId: string): ToolDefinition[] {
    const cat = this.categories.get(categoryId);
    if (!cat) return [];
    return cat.tools
      .map(name => this.tools.get(name)?.tool)
      .filter((t): t is ToolDefinition => t !== undefined);
  }

  listCategories(): ToolCategory[] {
    return Array.from(this.categories.values()).filter(c => c.tools.length > 0);
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

  /**
   * 搜索工具
   */
  search(query: string): ToolDefinition[] {
    const q = query.toLowerCase();
    return this.getAllTools().filter(tool => 
      tool.name.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      tool.tags?.some(tag => tag.toLowerCase().includes(q))
    );
  }
}

export const toolRegistry = new ToolRegistry();
