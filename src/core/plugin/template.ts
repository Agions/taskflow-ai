/**
 * 模板系统
 * PRD 模板、工作流模板、任务模板
 */

import path from 'path';
import fs from 'fs-extra';
import { Logger } from '../../utils/logger';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'prd' | 'workflow' | 'task';
  content: string;
  tags?: string[];
  variables?: TemplateVariable[];
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  default?: any;
  options?: string[];
  description?: string;
}

/**
 * 模板管理器
 */
export class TemplateManager {
  private logger: Logger;
  private templates: Map<string, Template> = new Map();

  constructor(private templateDir: string = './templates') {
    this.logger = Logger.getInstance('TemplateManager');
    this.initBuiltinTemplates();
  }

  /**
   * 初始化内置模板
   */
  private initBuiltinTemplates(): void {
    // PRD 模板
    this.register({
      id: 'prd-default',
      name: '标准 PRD 模板',
      description: '通用的产品需求文档模板',
      category: 'prd',
      content: `# {{project_name}}

## 1. 背景
{{background}}

## 2. 目标
{{goals}}

## 3. 功能需求
### 3.1 核心功能
- {{feature_1}}
- {{feature_2}}
- {{feature_3}}

### 3.2 辅助功能
- {{aux_feature_1}}

## 4. 非功能需求
### 4.1 性能要求
- 响应时间 < {{response_time}}ms
- 支持 {{concurrent_users}} 并发用户

### 4.2 安全要求
- {{security_requirement}}

## 5. 验收标准
- [ ] {{acceptance_criteria_1}}
- [ ] {{acceptance_criteria_2}}

## 6. 时间计划
- 开始日期: {{start_date}}
- 结束日期: {{end_date}}
`,
      variables: [
        { name: 'project_name', type: 'string', description: '项目名称' },
        { name: 'background', type: 'string', description: '项目背景' },
        { name: 'goals', type: 'string', description: '项目目标' },
      ],
    });

    // 工作流模板
    this.register({
      id: 'workflow-prd-to-code',
      name: 'PRD 转代码工作流',
      description: '从 PRD 文档生成代码的完整工作流',
      category: 'workflow',
      content: JSON.stringify({
        name: '{{workflow_name}}',
        version: '1.0.0',
        description: '{{description}}',
        triggers: [{ type: 'manual' }],
        variables: {},
        steps: [
          { id: 'parse', name: '解析 PRD', type: 'thought' },
          { id: 'decompose', name: '任务拆分', type: 'task', depends_on: ['parse'] },
          { id: 'generate', name: '生成代码', type: 'tool', depends_on: ['decompose'] },
          { id: 'review', name: '代码审查', type: 'thought', depends_on: ['generate'] },
        ],
      }, null, 2),
    });

    // 任务模板
    this.register({
      id: 'task-feature',
      name: '功能开发任务',
      description: '标准的功能开发任务模板',
      category: 'task',
      content: JSON.stringify({
        title: '{{title}}',
        description: '{{description}}',
        type: 'development',
        priority: 'medium',
        estimatedHours: {{hours}},
        acceptanceCriteria: [
          '{{criteria_1}}',
          '{{criteria_2}}',
        ],
      }, null, 2),
    });

    this.register({
      id: 'task-bug',
      name: 'Bug 修复任务',
      description: 'Bug 修复任务模板',
      category: 'task',
      content: JSON.stringify({
        title: '修复: {{bug_title}}',
        description: '{{bug_description}}',
        type: 'development',
        priority: 'high',
        estimatedHours: 4,
        acceptanceCriteria: [
          'Bug 已修复',
          '相关测试通过',
        ],
      }, null, 2),
    });
  }

  /**
   * 注册模板
   */
  register(template: Template): void {
    this.templates.set(template.id, template);
    this.logger.info(`模板已注册: ${template.name}`);
  }

  /**
   * 获取模板
   */
  get(id: string): Template | undefined {
    return this.templates.get(id);
  }

  /**
   * 列出模板
   */
  list(category?: Template['category']): Template[] {
    if (category) {
      return Array.from(this.templates.values()).filter(t => t.category === category);
    }
    return Array.from(this.templates.values());
  }

  /**
   * 按分类列出
   */
  listByCategory(): Record<string, Template[]> {
    const result: Record<string, Template[]> = {
      prd: [],
      workflow: [],
      task: [],
    };

    for (const template of this.templates.values()) {
      result[template.category].push(template);
    }

    return result;
  }

  /**
   * 渲染模板
   */
  render(id: string, variables: Record<string, unknown>): string | null {
    const template = this.templates.get(id);
    if (!template) {
      return null;
    }

    let content = template.content;

    // 替换变量
    for (const [key, value] of Object.entries(variables)) {
      const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      content = content.replace(pattern, String(value));
    }

    // 移除未替换的变量
    content = content.replace(/\{\{\w+\}\}/g, '');

    return content;
  }

  /**
   * 从文件加载模板
   */
  async loadFromFile(filePath: string): Promise<Template | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const template = JSON.parse(content) as Template;
      this.register(template);
      return template;
    } catch (error) {
      this.logger.error('加载模板文件失败:', error);
      return null;
    }
  }

  /**
   * 保存模板到文件
   */
  async saveToFile(id: string, dir?: string): Promise<boolean> {
    const template = this.templates.get(id);
    if (!template) {
      return false;
    }

    try {
      const filePath = path.resolve(dir || this.templateDir, `${id}.json`);
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, JSON.stringify(template, null, 2));
      return true;
    } catch (error) {
      this.logger.error('保存模板文件失败:', error);
      return false;
    }
  }

  /**
   * 删除模板
   */
  unregister(id: string): boolean {
    return this.templates.delete(id);
  }

  /**
   * 搜索模板
   */
  search(query: string): Template[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.templates.values()).filter(
      t =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        t.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }
}

export default TemplateManager;
