/**
 * 代码模板管理器
 * 管理内置模板和自定义模板
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import Handlebars from 'handlebars';
import {
  CodeTemplate,
  TemplateVariable,
  TemplateContext,
  ComponentSpec,
  GeneratedComponent,
  GeneratedFile
} from '../types';

// 内置模板
const BUILT_IN_TEMPLATES: Record<string, CodeTemplate> = {
  'react-functional': {
    id: 'react-functional',
    name: 'React Functional Component',
    description: 'React functional component with TypeScript',
    framework: 'react',
    language: 'typescript',
    version: '1.0.0',
    template: `import React{{#if hasState}}, { useState, useEffect }{{/if}} from 'react';
{{#if hasStyles}}
import './{{componentName}}.{{styleType}}';
{{/if}}

{{#if description}}
/**
 * {{description}}
 */
{{/if}}
export interface {{componentName}}Props {
{{#each props}}
  {{name}}{{#if optional}}?{{/if}}: {{type}};
{{/each}}
}

export const {{componentName}}: React.FC<{{componentName}}Props> = ({
{{#each props}}
  {{name}}{{#if defaultValue}} = {{defaultValue}}{{/if}},
{{/each}}
}) => {
{{#if hasState}}
  const [state, setState] = useState<any>(null);
{{/if}}
{{#if hasEffects}}

  useEffect(() => {
    // TODO: Implement effect
  }, []);
{{/if}}

  return (
    <div className="{{kebabCase componentName}}">
{{#if description}}
      {/* {{description}} */}
{{/if}}
{{#each props}}
      <div>{{name}}: { {{name}} }</div>
{{/each}}
    </div>
  );
};

export default {{componentName}};
`,
    variables: [
      { name: 'componentName', type: 'string', required: true, description: 'Component name' },
      { name: 'description', type: 'string', required: false, description: 'Component description' },
      { name: 'props', type: 'array', required: false, default: [], description: 'Component props' },
      { name: 'hasState', type: 'boolean', required: false, default: false, description: 'Include state hooks' },
      { name: 'hasEffects', type: 'boolean', required: false, default: false, description: 'Include effect hooks' },
      { name: 'hasStyles', type: 'boolean', required: false, default: true, description: 'Include style file' },
      { name: 'styleType', type: 'string', required: false, default: 'css', description: 'Style file extension' }
    ],
    validation: [
      { rule: 'pascalCase', pattern: '^[A-Z][a-zA-Z0-9]*$', message: 'Component name must be PascalCase' }
    ],
    metadata: {
      author: 'TaskFlow AI',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['react', 'typescript', 'functional'],
      category: 'component',
      complexity: 'simple'
    }
  },

  'react-hook': {
    id: 'react-hook',
    name: 'React Custom Hook',
    description: 'React custom hook with TypeScript',
    framework: 'react',
    language: 'typescript',
    version: '1.0.0',
    template: `import { useState, useEffect, useCallback } from 'react';

{{#if description}}
/**
 * {{description}}
 * 
 * @example
 * const { {{#each returns}}{{name}}{{#unless @last}}, {{/unless}}{{/each}} } = {{hookName}}();
 */
{{/if}}
export function {{hookName}}() {
  const [state, setState] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // TODO: Implement logic
      setState(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    execute();
  }, [execute]);

  return {
    state,
    loading,
    error,
    execute,
  };
}

export default {{hookName}};
`,
    variables: [
      { name: 'hookName', type: 'string', required: true, description: 'Hook name (must start with "use")' },
      { name: 'description', type: 'string', required: false, description: 'Hook description' },
      { name: 'returns', type: 'array', required: false, default: [], description: 'Return values' }
    ],
    validation: [
      { rule: 'camelCase', pattern: '^use[A-Z][a-zA-Z0-9]*$', message: 'Hook name must start with "use" and be camelCase' }
    ],
    metadata: {
      author: 'TaskFlow AI',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['react', 'typescript', 'hook'],
      category: 'component',
      complexity: 'medium'
    }
  },

  'vue-component': {
    id: 'vue-component',
    name: 'Vue Single File Component',
    description: 'Vue 3 SFC with TypeScript',
    framework: 'vue',
    language: 'typescript',
    version: '1.0.0',
    template: `<template>
  <div class="{{kebabCase componentName}}">
{{#if description}}
    <!-- {{description}} -->
{{/if}}
{{#each props}}
    <div>{{name}}: {{curly name}}</div>
{{/each}}
  </div>
</template>

<script setup lang="ts">
{{#if description}}
/**
 * {{description}}
 */
{{/if}}
interface Props {
{{#each props}}
  {{name}}{{#if optional}}?{{/if}}: {{type}};
{{/each}}
}

const props = withDefaults(defineProps<Props>(), {
{{#each props}}
{{#if defaultValue}}
  {{name}}: {{defaultValue}},
{{/if}}
{{/each}}
});
{{#if hasState}}

const state = ref<any>(null);
{{/if}}
{{#if hasEffects}}

onMounted(() => {
  // TODO: Implement mounted logic
});
{{/if}}
</script>

{{#if hasStyles}}
<style scoped>
.{{kebabCase componentName}} {
  /* TODO: Add styles */
}
</style>
{{/if}}
`,
    variables: [
      { name: 'componentName', type: 'string', required: true, description: 'Component name' },
      { name: 'description', type: 'string', required: false, description: 'Component description' },
      { name: 'props', type: 'array', required: false, default: [], description: 'Component props' },
      { name: 'hasState', type: 'boolean', required: false, default: false, description: 'Include state' },
      { name: 'hasEffects', type: 'boolean', required: false, default: false, description: 'Include lifecycle hooks' },
      { name: 'hasStyles', type: 'boolean', required: false, default: true, description: 'Include style section' }
    ],
    validation: [
      { rule: 'pascalCase', pattern: '^[A-Z][a-zA-Z0-9]*$', message: 'Component name must be PascalCase' }
    ],
    metadata: {
      author: 'TaskFlow AI',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['vue', 'typescript', 'sfc'],
      category: 'component',
      complexity: 'simple'
    }
  },

  'api-route': {
    id: 'api-route',
    name: 'API Route Handler',
    description: 'Express/Fastify API route handler',
    framework: 'node',
    language: 'typescript',
    version: '1.0.0',
    template: `import { Request, Response } from 'express';
{{#if needsValidation}}
import { z } from 'zod';
{{/if}}

{{#if description}}
/**
 * {{description}}
 * 
 * @route {{method}} {{path}}
{{#each params}}
 * @param {{name}} - {{description}}
{{/each}}
 */
{{/if}}
{{#if needsValidation}}
const {{schemaName}} = z.object({
{{#each params}}
  {{name}}: z.{{zodType type}}(),
{{/each}}
});

{{/if}}
export async function {{handlerName}}(
  req: Request,
  res: Response
): Promise<void> {
  try {
{{#if needsValidation}}
    const validated = {{schemaName}}.parse(req.body);
{{/if}}
    
    // TODO: Implement handler logic
    
    res.json({
      success: true,
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default {{handlerName}};
`,
    variables: [
      { name: 'handlerName', type: 'string', required: true, description: 'Handler function name' },
      { name: 'description', type: 'string', required: false, description: 'Handler description' },
      { name: 'method', type: 'string', required: true, default: 'POST', description: 'HTTP method' },
      { name: 'path', type: 'string', required: true, description: 'API path' },
      { name: 'params', type: 'array', required: false, default: [], description: 'Request parameters' },
      { name: 'needsValidation', type: 'boolean', required: false, default: true, description: 'Include Zod validation' }
    ],
    validation: [
      { rule: 'camelCase', pattern: '^[a-z][a-zA-Z0-9]*$', message: 'Handler name must be camelCase' }
    ],
    metadata: {
      author: 'TaskFlow AI',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['api', 'express', 'typescript'],
      category: 'api',
      complexity: 'medium'
    }
  },

  'test-file': {
    id: 'test-file',
    name: 'Unit Test File',
    description: 'Jest/Vitest unit test template',
    framework: 'testing',
    language: 'typescript',
    version: '1.0.0',
    template: `import { describe, it, expect{{#if needsMock}}, vi{{/if}} } from 'vitest';
import { {{targetName}} } from './{{targetPath}}';

{{#if description}}
/**
 * {{description}}
 */
{{/if}}
describe('{{targetName}}', () => {
{{#if needsMock}}
  beforeEach(() => {
    vi.clearAllMocks();
  });
{{/if}}

{{#each testCases}}
  it('{{description}}', () => {
    // Arrange
    {{#if arrange}}
    {{arrange}}
    {{/if}}
    
    // Act
    {{#if act}}
    {{act}}
    {{/if}}
    
    // Assert
    {{#if assert}}
    {{assert}}
    {{else}}
    expect(true).toBe(true);
    {{/if}}
  });
{{/each}}

  it('should handle errors gracefully', () => {
    // TODO: Add error handling test
    expect(true).toBe(true);
  });
});
`,
    variables: [
      { name: 'targetName', type: 'string', required: true, description: 'Name of the function/component being tested' },
      { name: 'targetPath', type: 'string', required: true, description: 'Path to the target module' },
      { name: 'description', type: 'string', required: false, description: 'Test suite description' },
      { name: 'needsMock', type: 'boolean', required: false, default: false, description: 'Include mock setup' },
      { name: 'testCases', type: 'array', required: false, default: [], description: 'Test cases' }
    ],
    validation: [],
    metadata: {
      author: 'TaskFlow AI',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['test', 'vitest', 'jest'],
      category: 'test',
      complexity: 'simple'
    }
  }
};

// 注册 Handlebars 辅助函数
Handlebars.registerHelper('kebabCase', (str: string) => {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
});

Handlebars.registerHelper('camelCase', (str: string) => {
  return str
    .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
    .replace(/^[A-Z]/, char => char.toLowerCase());
});

Handlebars.registerHelper('curly', (str: string) => {
  return `{{ ${str} }}`;
});

Handlebars.registerHelper('zodType', (type: string) => {
  const typeMap: Record<string, string> = {
    'string': 'string',
    'number': 'number',
    'boolean': 'boolean',
    'Date': 'date',
    'array': 'array',
    'object': 'object'
  };
  return typeMap[type] || 'any';
});

export class TemplateManager {
  private templates: Map<string, CodeTemplate> = new Map();
  private templatesDir: string;

  constructor(templatesDir?: string) {
    this.templatesDir = templatesDir || path.join(__dirname, '../../templates');
    this.loadBuiltInTemplates();
  }

  /**
   * 加载内置模板
   */
  private loadBuiltInTemplates(): void {
    for (const [id, template] of Object.entries(BUILT_IN_TEMPLATES)) {
      this.templates.set(id, template);
    }
  }

  /**
   * 加载自定义模板
   */
  async loadCustomTemplates(): Promise<void> {
    if (!await fs.pathExists(this.templatesDir)) {
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

  /**
   * 获取模板
   */
  getTemplate(id: string): CodeTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * 获取所有模板
   */
  getAllTemplates(): CodeTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * 按框架过滤模板
   */
  getTemplatesByFramework(framework: string): CodeTemplate[] {
    return this.getAllTemplates().filter(t => t.framework === framework);
  }

  /**
   * 按类别过滤模板
   */
  getTemplatesByCategory(category: string): CodeTemplate[] {
    return this.getAllTemplates().filter(t => t.metadata.category === category);
  }

  /**
   * 渲染模板
   */
  renderTemplate(templateId: string, context: TemplateContext): string {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // 验证变量
    this.validateVariables(template, context);

    // 渲染
    const compiled = Handlebars.compile(template.template);
    return compiled(context);
  }

  /**
   * 验证变量
   */
  private validateVariables(template: CodeTemplate, context: TemplateContext): void {
    for (const variable of template.variables) {
      if (variable.required && !(variable.name in context)) {
        throw new Error(`Required variable missing: ${variable.name}`);
      }

      const value = context[variable.name];
      if (value !== undefined && variable.options && !variable.options.includes(String(value))) {
        throw new Error(`Invalid value for ${variable.name}: ${value}. Must be one of: ${variable.options.join(', ')}`);
      }
    }
  }

  /**
   * 保存模板
   */
  async saveTemplate(template: CodeTemplate): Promise<void> {
    await fs.ensureDir(this.templatesDir);
    const templatePath = path.join(this.templatesDir, `${template.id}.json`);
    await fs.writeJson(templatePath, template, { spaces: 2 });
    this.templates.set(template.id, template);
  }

  /**
   * 删除模板
   */
  async deleteTemplate(id: string): Promise<void> {
    const templatePath = path.join(this.templatesDir, `${id}.json`);
    if (await fs.pathExists(templatePath)) {
      await fs.remove(templatePath);
    }
    this.templates.delete(id);
  }

  /**
   * 根据组件规范选择最佳模板
   */
  selectTemplateForSpec(spec: ComponentSpec): CodeTemplate | undefined {
    const candidates = this.getTemplatesByFramework(spec.framework);

    if (candidates.length === 0) {
      return undefined;
    }

    // 优先选择匹配度最高的模板
    // 简化实现：返回第一个匹配的模板
    return candidates.find(t => {
      if (spec.hasState && t.id.includes('hook')) {
        return true;
      }
      if (!spec.hasState && t.id.includes('functional')) {
        return true;
      }
      return true;
    }) || candidates[0];
  }
}

export default TemplateManager;
