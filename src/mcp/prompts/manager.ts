/**
 * MCP提示管理器
 * 管理AI提示模板和生成智能提示
 */

import path from 'path';
import fs from 'fs-extra';
import { Logger } from '../../utils/logger';

export interface MCPPrompt {
  name: string;
  description: string;
  template: string;
  arguments: PromptArgument[];
  category: string;
  version: string;
  metadata?: {
    author?: string;
    tags?: string[];
    examples?: PromptExample[];
  };
}

export interface PromptArgument {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  default?: any;
}

export interface PromptExample {
  title: string;
  description: string;
  arguments: Record<string, any>;
  expectedOutput?: string;
}

export class MCPPromptManager {
  private prompts: Map<string, MCPPrompt> = new Map();
  private logger: Logger;
  private promptsDir: string;

  constructor(
    private config: any,
    logger?: Logger
  ) {
    this.logger = logger || Logger.getInstance('MCPPromptManager');
    this.promptsDir = path.join(process.cwd(), '.taskflow', 'prompts');
  }

  /**
   * 初始化提示管理器
   */
  async initialize(): Promise<void> {
    this.logger.info('正在初始化MCP提示管理器...');

    try {
      // 确保提示目录存在
      await fs.ensureDir(this.promptsDir);

      // 注册默认提示
      await this.registerDefaultPrompts();

      // 加载自定义提示
      await this.loadCustomPrompts();

      this.logger.info(`提示管理器初始化完成，共加载 ${this.prompts.size} 个提示`);
    } catch (error) {
      this.logger.error('提示管理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 注册默认提示
   */
  private async registerDefaultPrompts(): Promise<void> {
    const defaultPrompts: MCPPrompt[] = [
      {
        name: 'project_plan',
        description: '生成项目执行计划',
        template: `基于以下项目信息生成详细的执行计划：

项目名称：{{projectName}}
项目描述：{{projectDescription}}
{{#if requirements}}
需求列表：
{{#each requirements}}
- {{this}}
{{/each}}
{{/if}}

请生成包含以下内容的项目计划：
1. 项目阶段划分
2. 关键里程碑
3. 任务分解
4. 时间估算
5. 风险评估

计划应该具体可执行，包含明确的交付物和验收标准。`,
        arguments: [
          {
            name: 'projectName',
            description: '项目名称',
            type: 'string',
            required: true,
          },
          {
            name: 'projectDescription',
            description: '项目描述',
            type: 'string',
            required: true,
          },
          {
            name: 'requirements',
            description: '需求列表',
            type: 'array',
            required: false,
          },
        ],
        category: 'planning',
        version: '1.0.0',
        metadata: {
          tags: ['project', 'planning', 'management'],
          examples: [
            {
              title: '网站开发项目',
              description: '为电商网站生成开发计划',
              arguments: {
                projectName: '电商网站',
                projectDescription: '开发一个支持在线购物的电商平台',
                requirements: ['用户注册登录', '商品管理', '购物车', '支付系统'],
              },
            },
          ],
        },
      },
      {
        name: 'task_breakdown',
        description: '任务分解和工时估算',
        template: `请将以下功能需求分解为具体的开发任务：

功能名称：{{featureName}}
功能描述：{{featureDescription}}
{{#if constraints}}
约束条件：
{{#each constraints}}
- {{this}}
{{/each}}
{{/if}}

请提供：
1. 详细的任务列表
2. 每个任务的工时估算
3. 任务之间的依赖关系
4. 优先级建议
5. 技术栈推荐

输出格式为结构化的任务清单。`,
        arguments: [
          {
            name: 'featureName',
            description: '功能名称',
            type: 'string',
            required: true,
          },
          {
            name: 'featureDescription',
            description: '功能描述',
            type: 'string',
            required: true,
          },
          {
            name: 'constraints',
            description: '约束条件',
            type: 'array',
            required: false,
          },
        ],
        category: 'analysis',
        version: '1.0.0',
        metadata: {
          tags: ['task', 'breakdown', 'estimation'],
        },
      },
      {
        name: 'code_review',
        description: '代码审查建议',
        template: `请对以下代码进行审查并提供改进建议：

文件路径：{{filePath}}
编程语言：{{language}}

代码内容：
\`\`\`{{language}}
{{code}}
\`\`\`

请从以下方面进行审查：
1. 代码质量和可读性
2. 性能优化建议
3. 安全性检查
4. 最佳实践符合度
5. 潜在的bug或问题

提供具体的改进建议和示例代码。`,
        arguments: [
          {
            name: 'filePath',
            description: '文件路径',
            type: 'string',
            required: true,
          },
          {
            name: 'language',
            description: '编程语言',
            type: 'string',
            required: true,
          },
          {
            name: 'code',
            description: '代码内容',
            type: 'string',
            required: true,
          },
        ],
        category: 'development',
        version: '1.0.0',
        metadata: {
          tags: ['code', 'review', 'quality'],
        },
      },
      {
        name: 'test_generation',
        description: '生成测试用例',
        template: `为以下功能生成全面的测试用例：

功能名称：{{functionName}}
功能描述：{{functionDescription}}
{{#if inputParameters}}
输入参数：
{{#each inputParameters}}
- {{name}}: {{type}} - {{description}}
{{/each}}
{{/if}}

请生成：
1. 正常流程测试用例
2. 边界值测试用例
3. 异常情况测试用例
4. 性能测试建议

每个测试用例包含：
- 测试场景描述
- 输入数据
- 预期结果
- 测试步骤`,
        arguments: [
          {
            name: 'functionName',
            description: '功能名称',
            type: 'string',
            required: true,
          },
          {
            name: 'functionDescription',
            description: '功能描述',
            type: 'string',
            required: true,
          },
          {
            name: 'inputParameters',
            description: '输入参数',
            type: 'array',
            required: false,
          },
        ],
        category: 'testing',
        version: '1.0.0',
        metadata: {
          tags: ['test', 'generation', 'quality'],
        },
      },
      {
        name: 'documentation',
        description: '生成技术文档',
        template: `请为以下内容生成详细的技术文档：

文档类型：{{docType}}
主题：{{topic}}
目标受众：{{audience}}

{{#if sections}}
包含章节：
{{#each sections}}
- {{this}}
{{/each}}
{{/if}}

文档要求：
1. 结构清晰，层次分明
2. 内容准确，示例丰富
3. 易于理解和执行
4. 包含必要的图表说明

请按照技术文档的标准格式输出。`,
        arguments: [
          {
            name: 'docType',
            description: '文档类型（如API文档、用户手册等）',
            type: 'string',
            required: true,
          },
          {
            name: 'topic',
            description: '文档主题',
            type: 'string',
            required: true,
          },
          {
            name: 'audience',
            description: '目标受众',
            type: 'string',
            required: true,
          },
          {
            name: 'sections',
            description: '文档章节',
            type: 'array',
            required: false,
          },
        ],
        category: 'documentation',
        version: '1.0.0',
        metadata: {
          tags: ['documentation', 'technical', 'writing'],
        },
      },
    ];

    for (const prompt of defaultPrompts) {
      this.registerPrompt(prompt);
    }
  }

  /**
   * 加载自定义提示
   */
  private async loadCustomPrompts(): Promise<void> {
    try {
      const promptFiles = await this.findPromptFiles();

      for (const file of promptFiles) {
        try {
          const promptData = await fs.readJson(file);
          this.registerPrompt(promptData);
        } catch (error) {
          this.logger.warn(`加载提示文件失败: ${file}`, error);
        }
      }
    } catch (error) {
      this.logger.warn('加载自定义提示失败:', error);
    }
  }

  /**
   * 查找提示文件
   */
  private async findPromptFiles(): Promise<string[]> {
    const files: string[] = [];

    try {
      const items = await fs.readdir(this.promptsDir);

      for (const item of items) {
        if (item.endsWith('.json')) {
          files.push(path.join(this.promptsDir, item));
        }
      }
    } catch (error) {
      // 目录不存在或无法读取
    }

    return files;
  }

  /**
   * 注册提示
   */
  registerPrompt(prompt: MCPPrompt): void {
    if (!this.validatePrompt(prompt)) {
      throw new Error(`提示验证失败: ${prompt.name}`);
    }

    this.prompts.set(prompt.name, prompt);
    this.logger.debug(`提示已注册: ${prompt.name} (${prompt.category})`);
  }

  /**
   * 取消注册提示
   */
  unregisterPrompt(name: string): boolean {
    const result = this.prompts.delete(name);
    if (result) {
      this.logger.debug(`提示已取消注册: ${name}`);
    }
    return result;
  }

  /**
   * 获取提示
   */
  getPrompt(name: string): MCPPrompt | undefined {
    return this.prompts.get(name);
  }

  /**
   * 列出所有提示
   */
  async listPrompts(): Promise<MCPPrompt[]> {
    return Array.from(this.prompts.values());
  }

  /**
   * 按分类获取提示
   */
  getPromptsByCategory(category: string): MCPPrompt[] {
    return Array.from(this.prompts.values()).filter(p => p.category === category);
  }

  /**
   * 生成提示内容
   */
  async generatePrompt(name: string, args: Record<string, any>): Promise<any> {
    const prompt = this.getPrompt(name);
    if (!prompt) {
      throw new Error(`提示不存在: ${name}`);
    }

    // 验证参数
    this.validateArguments(prompt, args);

    // 渲染模板
    const content = await this.renderTemplate(prompt.template, args);

    return {
      name: prompt.name,
      description: prompt.description,
      messages: [
        {
          role: 'user',
          content,
        },
      ],
      metadata: {
        category: prompt.category,
        version: prompt.version,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * 验证提示数据
   */
  private validatePrompt(prompt: any): boolean {
    return !!(
      prompt.name &&
      prompt.description &&
      prompt.template &&
      prompt.category &&
      Array.isArray(prompt.arguments)
    );
  }

  /**
   * 验证参数
   */
  private validateArguments(prompt: MCPPrompt, args: Record<string, any>): void {
    for (const arg of prompt.arguments) {
      if (arg.required && !(arg.name in args)) {
        throw new Error(`缺少必需参数: ${arg.name}`);
      }

      if (arg.name in args) {
        const value = args[arg.name];
        if (!this.validateArgumentType(value, arg.type)) {
          throw new Error(`参数类型错误: ${arg.name} 应为 ${arg.type}`);
        }
      }
    }
  }

  /**
   * 验证参数类型
   */
  private validateArgumentType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }

  /**
   * 渲染模板
   */
  private async renderTemplate(template: string, args: Record<string, any>): Promise<string> {
    let result = template;

    // 简单的模板渲染实现
    // 替换 {{variable}} 格式的变量
    result = result.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return args[varName]?.toString() || match;
    });

    // 处理条件语句 {{#if condition}}...{{/if}}
    result = result.replace(
      /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
      (match, condition, content) => {
        return args[condition] ? content : '';
      }
    );

    // 处理循环语句 {{#each array}}...{{/each}}
    result = result.replace(
      /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
      (match, arrayName, itemTemplate) => {
        const array = args[arrayName];
        if (!Array.isArray(array)) {
          return '';
        }

        return array
          .map(item => {
            if (typeof item === 'string') {
              return itemTemplate.replace(/\{\{this\}\}/g, item);
            } else if (typeof item === 'object') {
              let itemResult = itemTemplate;
              for (const [key, value] of Object.entries(item)) {
                itemResult = itemResult.replace(
                  new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
                  String(value)
                );
              }
              return itemResult;
            }
            return itemTemplate.replace(/\{\{this\}\}/g, String(item));
          })
          .join('');
      }
    );

    return result;
  }

  /**
   * 保存自定义提示
   */
  async savePrompt(prompt: MCPPrompt): Promise<void> {
    const filePath = path.join(this.promptsDir, `${prompt.name}.json`);
    await fs.writeJson(filePath, prompt, { spaces: 2 });
    this.registerPrompt(prompt);
    this.logger.info(`提示已保存: ${prompt.name}`);
  }

  /**
   * 搜索提示
   */
  searchPrompts(query: string): MCPPrompt[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.prompts.values()).filter(
      prompt =>
        prompt.name.toLowerCase().includes(lowerQuery) ||
        prompt.description.toLowerCase().includes(lowerQuery) ||
        prompt.metadata?.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * 获取提示分类
   */
  getCategories(): string[] {
    const categories = new Set<string>();
    for (const prompt of this.prompts.values()) {
      categories.add(prompt.category);
    }
    return Array.from(categories);
  }

  /**
   * 获取提示数量
   */
  getPromptsCount(): number {
    return this.prompts.size;
  }

  /**
   * 获取提示名称列表
   */
  getPromptNames(): string[] {
    return Array.from(this.prompts.keys());
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    this.prompts.clear();
    this.logger.info('提示管理器已清理');
  }
}
