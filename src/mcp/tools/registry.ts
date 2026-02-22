/**
 * 动态工具注册系统
 * 支持运行时注册和管理 MCP 工具
 */

import { Logger } from '../../utils/logger';

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: ToolHandler;
  category?: string;
  tags?: string[];
  version?: string;
}

export type ToolHandler = (input: Record<string, unknown>) => Promise<unknown>;

export interface ToolRegistration {
  tool: ToolDefinition;
  registeredAt: number;
  callCount: number;
  lastCalled?: number;
}

export interface ToolCategory {
  name: string;
  description: string;
  tools: string[];
}

/**
 * 工具注册表
 */
export class ToolRegistry {
  private logger = Logger.getInstance('ToolRegistry');
  private tools: Map<string, ToolRegistration> = new Map();
  private categories: Map<string, ToolCategory> = new Map();

  constructor() {
    this.initBuiltinCategories();
    this.registerBuiltinTools();
  }

  /**
   * 初始化内置分类
   */
  private initBuiltinCategories(): void {
    this.categories.set('file', {
      name: 'File Operations',
      description: '文件读写操作',
      tools: [],
    });
    this.categories.set('shell', {
      name: 'Shell Commands',
      description: 'Shell 命令执行',
      tools: [],
    });
    this.categories.set('analysis', {
      name: 'Analysis',
      description: '项目分析工具',
      tools: [],
    });
    this.categories.set('task', {
      name: 'Task Management',
      description: '任务管理工具',
      tools: [],
    });
    this.categories.set('custom', {
      name: 'Custom',
      description: '自定义工具',
      tools: [],
    });
  }

  /**
   * 注册内置工具
   */
  private registerBuiltinTools(): void {
    // 文件读取工具
    this.register({
      name: 'file_read',
      description: '读取文件内容',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '文件路径' },
          offset: { type: 'number', description: '起始行' },
          limit: { type: 'number', description: '读取行数' },
        },
        required: ['path'],
      },
      handler: async (input) => {
        const fs = await import('fs/promises');
        const path = await import('path');
        const content = await fs.readFile(input.path as string, 'utf-8');
        const lines = content.split('\n');
        
        const offset = (input.offset as number) || 0;
        const limit = (input.limit as number) || lines.length;
        
        return {
          content: lines.slice(offset, offset + limit).join('\n'),
          totalLines: lines.length,
          path: path.resolve(input.path as string),
        };
      },
      category: 'file',
      tags: ['read', 'file'],
    });

    // 文件写入工具
    this.register({
      name: 'file_write',
      description: '写入文件内容',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '文件路径' },
          content: { type: 'string', description: '文件内容' },
          mode: { type: 'string', description: '写入模式: write|append' },
        },
        required: ['path', 'content'],
      },
      handler: async (input) => {
        const fs = await import('fs/promises');
        const path = await import('path');
        
        const mode = (input.mode as string) || 'write';
        const fullPath = path.resolve(input.path as string);
        
        if (mode === 'append') {
          await fs.appendFile(fullPath, input.content as string);
        } else {
          await fs.writeFile(fullPath, input.content as string);
        }
        
        return { success: true, path: fullPath };
      },
      category: 'file',
      tags: ['write', 'file'],
    });

    // 文件编辑工具
    this.register({
      name: 'file_edit',
      description: '编辑文件局部内容',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '文件路径' },
          oldText: { type: 'string', description: '要替换的文本' },
          newText: { type: 'string', description: '替换后的文本' },
        },
        required: ['path', 'oldText', 'newText'],
      },
      handler: async (input) => {
        const fs = await import('fs/promises');
        const path = await import('path');
        
        const fullPath = path.resolve(input.path as string);
        let content = await fs.readFile(fullPath, 'utf-8');
        
        const oldText = input.oldText as string;
        const newText = input.newText as string;
        
        if (!content.includes(oldText)) {
          throw new Error('未找到要替换的文本');
        }
        
        content = content.replace(oldText, newText);
        await fs.writeFile(fullPath, content);
        
        return { success: true, path: fullPath };
      },
      category: 'file',
      tags: ['edit', 'file'],
    });

    // Shell 执行工具
    this.register({
      name: 'shell_exec',
      description: '执行 Shell 命令',
      inputSchema: {
        type: 'object',
        properties: {
          command: { type: 'string', description: '要执行的命令' },
          cwd: { type: 'string', description: '工作目录' },
          timeout: { type: 'number', description: '超时时间(ms)' },
        },
        required: ['command'],
      },
      handler: async (input) => {
        const { exec } = await import('child_process');
        const util = await import('util');
        
        const execPromise = util.promisify(exec);
        const timeout = (input.timeout as number) || 30000;
        
        try {
          const { stdout, stderr } = await execPromise(input.command as string, {
            cwd: input.cwd as string || process.cwd(),
            timeout,
          });
          
          return { stdout, stderr, success: true };
        } catch (error: any) {
          return {
            stdout: error.stdout || '',
            stderr: error.message,
            success: false,
            code: error.code,
          };
        }
      },
      category: 'shell',
      tags: ['shell', 'exec'],
    });

    // 项目分析工具
    this.register({
      name: 'project_analyze',
      description: '分析项目结构',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '项目路径' },
          depth: { type: 'number', description: '分析深度' },
        },
        required: ['path'],
      },
      handler: async (input) => {
        const fs = await import('fs/promises');
        const path = await import('path');
        
        const projectPath = path.resolve(input.path as string);
        const depth = (input.depth as number) || 3;
        
        const result = await this.analyzeProject(projectPath, depth);
        return result;
      },
      category: 'analysis',
      tags: ['analyze', 'project'],
    });

    // 任务创建工具
    this.register({
      name: 'task_create',
      description: '创建新任务',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '任务标题' },
          description: { type: 'string', description: '任务描述' },
          type: { type: 'string', description: '任务类型' },
          priority: { type: 'string', description: '优先级' },
        },
        required: ['title'],
      },
      handler: async (input) => {
        // 简化的任务创建
        const task = {
          id: `task-${Date.now()}`,
          title: input.title,
          description: input.description || '',
          type: input.type || 'development',
          priority: input.priority || 'medium',
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        
        return task;
      },
      category: 'task',
      tags: ['task', 'create'],
    });
  }

  /**
   * 注册工具
   */
  register(tool: ToolDefinition): void {
    const registration: ToolRegistration = {
      tool,
      registeredAt: Date.now(),
      callCount: 0,
    };

    this.tools.set(tool.name, registration);

    // 添加到分类
    const category = tool.category || 'custom';
    if (this.categories.has(category)) {
      this.categories.get(category)!.tools.push(tool.name);
    }

    this.logger.info(`工具已注册: ${tool.name}`);
  }

  /**
   * 注销工具
   */
  unregister(name: string): boolean {
    const tool = this.tools.get(name);
    if (!tool) return false;

    // 从分类中移除
    const category = tool.tool.category || 'custom';
    if (this.categories.has(category)) {
      const tools = this.categories.get(category)!.tools;
      const index = tools.indexOf(name);
      if (index > -1) tools.splice(index, 1);
    }

    this.tools.delete(name);
    this.logger.info(`工具已注销: ${name}`);
    return true;
  }

  /**
   * 获取工具
   */
  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name)?.tool;
  }

  /**
   * 执行工具
   */
  async execute(name: string, input: Record<string, unknown>): Promise<unknown> {
    const registration = this.tools.get(name);
    if (!registration) {
      throw new Error(`工具不存在: ${name}`);
    }

    registration.callCount++;
    registration.lastCalled = Date.now();

    try {
      const result = await registration.tool.handler(input);
      return result;
    } catch (error) {
      this.logger.error(`工具执行失败: ${name}`, error);
      throw error;
    }
  }

  /**
   * 列出所有工具
   */
  list(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(r => r.tool);
  }

  /**
   * 按分类列出工具
   */
  listByCategory(category: string): ToolDefinition[] {
    const cat = this.categories.get(category);
    if (!cat) return [];
    
    return cat.tools
      .map(name => this.tools.get(name)?.tool)
      .filter((t): t is ToolDefinition => t !== undefined);
  }

  /**
   * 列出所有分类
   */
  listCategories(): ToolCategory[] {
    return Array.from(this.categories.values());
  }

  /**
   * 获取工具统计
   */
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
   * 分析项目结构
   */
  private async analyzeProject(projectPath: string, depth: number): Promise<unknown> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const result: any = {
      path: projectPath,
      name: path.basename(projectPath),
      files: 0,
      directories: 0,
      languages: {} as Record<string, number>,
      size: 0,
    };

    const scan = async (dir: string, currentDepth: number) => {
      if (currentDepth > depth) return;

      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          // 跳过隐藏文件和 node_modules
          if (entry.name.startsWith('.') || entry.name === 'node_modules') {
            continue;
          }

          if (entry.isDirectory()) {
            result.directories++;
            await scan(fullPath, currentDepth + 1);
          } else {
            result.files++;
            const ext = path.extname(entry.name).slice(1);
            result.languages[ext] = (result.languages[ext] || 0) + 1;

            try {
              const stat = await fs.stat(fullPath);
              result.size += stat.size;
            } catch {
              // 忽略无法访问的文件
            }
          }
        }
      } catch {
        // 忽略无法访问的目录
      }
    };

    await scan(projectPath, 0);
    return result;
  }
}

// 导出单例
export const toolRegistry = new ToolRegistry();
