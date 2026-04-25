/**
 * Codegen Types Tests
 * TaskFlow AI v4.0
 */

import type {
  CodeTemplate,
  TemplateVariable,
  ValidationRule,
  TemplateMetadata,
  TemplateContext
} from '../types';

describe('Codegen Types', () => {
  describe('TemplateVariable', () => {
    it('should create string variable', () => {
      const variable: TemplateVariable = {
        name: 'componentName',
        type: 'string',
        required: true,
        description: 'Name of the component'
      };
      expect(variable.type).toBe('string');
      expect(variable.required).toBe(true);
    });

    it('should create number variable with default', () => {
      const variable: TemplateVariable = {
        name: 'port',
        type: 'number',
        required: false,
        default: 3000
      };
      expect(variable.default).toBe(3000);
      expect(variable.required).toBe(false);
    });

    it('should create array variable with options', () => {
      const variable: TemplateVariable = {
        name: 'framework',
        type: 'array',
        required: true,
        options: ['react', 'vue', 'angular', 'svelte']
      };
      expect(variable.options).toHaveLength(4);
      expect(variable.options).toContain('react');
    });

    it('should create boolean variable', () => {
      const variable: TemplateVariable = {
        name: 'enableStrictMode',
        type: 'boolean',
        required: false,
        default: false
      };
      expect(variable.type).toBe('boolean');
    });

    it('should create object variable', () => {
      const variable: TemplateVariable = {
        name: 'config',
        type: 'object',
        required: true
      };
      expect(variable.type).toBe('object');
    });
  });

  describe('ValidationRule', () => {
    it('should create regex validation rule', () => {
      const rule: ValidationRule = {
        rule: 'pattern',
        pattern: '^[a-zA-Z][a-zA-Z0-9-]*$',
        message: 'Must start with a letter and contain only alphanumeric characters and hyphens'
      };
      expect(rule.rule).toBe('pattern');
      expect(rule.pattern).toBeDefined();
      expect(rule.message).toBeDefined();
    });

    it('should create range validation rule', () => {
      const rule: ValidationRule = {
        rule: 'range',
        min: 1,
        max: 100,
        message: 'Value must be between 1 and 100'
      };
      expect(rule.min).toBe(1);
      expect(rule.max).toBe(100);
    });

    it('should create custom validation rule', () => {
      const rule: ValidationRule = {
        rule: 'custom',
        pattern: '^(?!.*\\.\\.)',
        message: 'Cannot contain consecutive periods'
      };
      expect(rule.rule).toBe('custom');
    });
  });

  describe('TemplateMetadata', () => {
    it('should create metadata for simple component', () => {
      const metadata: TemplateMetadata = {
        author: 'Agions',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
        tags: ['react', 'component', 'ui'],
        category: 'component',
        complexity: 'simple'
      };
      expect(metadata.category).toBe('component');
      expect(metadata.complexity).toBe('simple');
      expect(metadata.tags).toContain('react');
    });

    it('should create metadata for complex api', () => {
      const metadata: TemplateMetadata = {
        author: 'Agions',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['api', 'rest', 'typescript'],
        category: 'api',
        complexity: 'complex'
      };
      expect(metadata.complexity).toBe('complex');
      expect(metadata.category).toBe('api');
    });
  });

  describe('CodeTemplate', () => {
    it('should create complete code template', () => {
      const template: CodeTemplate = {
        id: 'react-button',
        name: 'React Button Component',
        description: 'A customizable button component for React',
        framework: 'React',
        language: 'TypeScript',
        version: '1.0.0',
        template: 'export const {{componentName}}: React.FC<Props> = () => {\n  return <button>{{buttonText}}</button>;\n};',
        variables: [
          {
            name: 'componentName',
            type: 'string',
            required: true,
            description: 'Component name'
          },
          {
            name: 'buttonText',
            type: 'string',
            required: false,
            default: 'Click me'
          }
        ],
        validation: [
          {
            rule: 'pattern',
            pattern: '^[A-Z][a-zA-Z0-9]*$',
            message: 'Component name must be in PascalCase'
          }
        ],
        metadata: {
          author: 'Agions',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['react', 'component', 'button'],
          category: 'component',
          complexity: 'simple'
        }
      };

      expect(template.id).toBe('react-button');
      expect(template.variables).toHaveLength(2);
      expect(template.validation).toHaveLength(1);
    });

    it('should create template with partials', () => {
      const template: CodeTemplate = {
        id: 'page-template',
        name: 'Page Template',
        description: 'Complete page template with header and footer',
        framework: 'React',
        language: 'TypeScript',
        version: '1.0.0',
        template: '{{> header}}\n<main>{{content}}</main>\n{{> footer}}',
        partials: {
          header: '<header>{{title}}</header>',
          footer: '<footer>&copy; {{year}}</footer>'
        },
        variables: [
          {
            name: 'title',
            type: 'string',
            required: true
          },
          {
            name: 'content',
            type: 'string',
            required: true
          },
          {
            name: 'year',
            type: 'number',
            required: false,
            default: new Date().getFullYear()
          }
        ],
        validation: [],
        metadata: {
          author: 'Agions',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['react', 'page', 'template'],
          category: 'page',
          complexity: 'medium'
        }
      };

      expect(template.partials).toBeDefined();
      expect(Object.keys(template.partials!)).toHaveLength(2);
    });
  });

  describe('TemplateContext', () => {
    it('should create template context with variables', () => {
      const context: TemplateContext = {
        componentName: 'MyButton',
        buttonText: 'Click me',
        enableRipple: true,
        cssClasses: ['btn', 'btn-primary']
      };

      expect(context.componentName).toBe('MyButton');
      expect(context.cssClasses).toContain('btn-primary');
      expect(context.enableRipple).toBe(true);
    });

    it('should create empty context', () => {
      const context: TemplateContext = {};
      expect(Object.keys(context)).toHaveLength(0);
    });
  });
});
