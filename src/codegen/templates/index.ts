/**
 * 代码模板管理器
 * 管理内置模板和自定义模板
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import Handlebars from 'handlebars';
import { CodeTemplate, TemplateContext, ComponentSpec } from '../types';
import { builtInTemplates } from './built-in';

// 注册 Handlebars 辅助函数
Handlebars.registerHelper('kebabCase', (str: string) => {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
});

Handlebars.registerHelper('unless', function (this: any, conditional: any, options: any) {
  if (!conditional) {
    return options.fn(this);
  }
  return options.inverse(this);
});

export class TemplateManager {
  private templates: Map<string, CodeTemplate> = new Map();
  private templatesDir: string;

  constructor(templatesDir?: string) {
    this.templatesDir = templatesDir || path.join(__dirname, '../../templates');
    this.loadBuiltInTemplates();
  }

  private loadBuiltInTemplates(): void {
    for (const [id, template] of Object.entries(builtInTemplates)) {
      this.templates.set(id, template);
    }
  }

  async loadCustomTemplates(): Promise<void> {
    if (!(await fs.pathExists(this.templatesDir))) {
      return;
    }

    const files = await fs.readdir(this.templatesDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const templatePath = path.join(this.templatesDir, file);
          const template = await fs.readJson(templatePath);
          this.templates.set(template.id, template);
        } catch (error) {
          console.warn(`Failed to load template: ${file}`, error);
        }
      }
    }
  }

  getTemplate(id: string): CodeTemplate | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): CodeTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByFramework(framework: string): CodeTemplate[] {
    return this.getAllTemplates().filter(t => t.framework === framework);
  }

  getTemplatesByCategory(category: string): CodeTemplate[] {
    return this.getAllTemplates().filter(t => t.metadata.category === category);
  }

  renderTemplate(templateId: string, context: TemplateContext): string {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    this.validateVariables(template, context);

    const compiled = Handlebars.compile(template.template);
    return compiled(context);
  }

  private validateVariables(template: CodeTemplate, context: TemplateContext): void {
    for (const variable of template.variables) {
      if (variable.required && !(variable.name in context)) {
        throw new Error(`Required variable missing: ${variable.name}`);
      }

      const value = context[variable.name];
      if (value !== undefined && variable.options && !variable.options.includes(String(value))) {
        throw new Error(`Invalid value for ${variable.name}: ${value}`);
      }
    }
  }

  async saveTemplate(template: CodeTemplate): Promise<void> {
    await fs.ensureDir(this.templatesDir);
    const templatePath = path.join(this.templatesDir, `${template.id}.json`);
    await fs.writeJson(templatePath, template, { spaces: 2 });
    this.templates.set(template.id, template);
  }

  async deleteTemplate(id: string): Promise<void> {
    const templatePath = path.join(this.templatesDir, `${id}.json`);
    if (await fs.pathExists(templatePath)) {
      await fs.remove(templatePath);
    }
    this.templates.delete(id);
  }

  selectTemplateForSpec(spec: ComponentSpec): CodeTemplate | undefined {
    const candidates = this.getTemplatesByFramework(spec.framework);

    if (candidates.length === 0) {
      return undefined;
    }

    return (
      candidates.find(t => {
        if (spec.hasState && t.id.includes('hook')) {
          return true;
        }
        if (!spec.hasState && t.id.includes('functional')) {
          return true;
        }
        return true;
      }) || candidates[0]
    );
  }
}

export default TemplateManager;
export * from './built-in';
