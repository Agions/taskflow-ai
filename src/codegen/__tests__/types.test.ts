/**
 * Codegen Types Tests - TaskFlow AI v4.0
 */

import type {
  CodeTemplate as CodegenTemplate, TemplateVariable, ValidationRule, TemplateMetadata,
  TemplateContext, ComponentSpec, ComponentProp, GeneratedComponent,
  GeneratedFile, CodeGenerationResult, CodegenConfig, FrameworkConfig,
  ComponentPattern, FileStructure, SyncConfig, CodegenRequest,
  TemplateRepository, CodeQualityCheck, GenerationStats,
} from '../types';

const ALL_VAR_TYPES: TemplateVariable['type'][] = ['string','number','boolean','array','object'];
const ALL_CATEGORIES: TemplateMetadata['category'][] = ['component','page','api','model','test','config','other'];
const ALL_COMPLEXITY: TemplateMetadata['complexity'][] = ['simple','medium','complex'];
const ALL_FRAMEWORKS: ComponentSpec['framework'][] = ['react','vue','angular','svelte','vanilla'];
const ALL_LANGUAGES: ComponentSpec['language'][] = ['typescript','javascript'];
const ALL_FILE_TYPES: GeneratedFile['type'][] = ['tsx','ts','jsx','js','css','scss','test','other'];
const ALL_PATTERN_TYPES: ComponentPattern['type'][] = ['functional','class','hook'];
const ALL_SYNC_STRATEGIES: SyncConfig['strategy'][] = ['overwrite','merge','skip'];

describe('Codegen Types', () => {
  describe('CodegenTemplate', () => {
    it('should create valid template', () => {
      const t: CodegenTemplate = {
        id: 'tpl-1', name: 'React Component', description: 'A React component',
        framework: 'react', language: 'typescript', version: '1.0',
        template: 'export const {{name}} = () => {}',
        partials: { header: '// Header' },
        variables: [{ name: 'name', type: 'string', required: true }],
        validation: [{ rule: 'required' }],
        metadata: { author: 'Agions', createdAt: new Date(), updatedAt: new Date(), tags: [], category: 'component', complexity: 'simple' },
      };
      expect(t.metadata.category).toBe('component');
    });
  });

  describe('TemplateVariable', () => {
    it('should support 5 types', () => {
      expect(ALL_VAR_TYPES).toHaveLength(5);
    });
  });

  describe('TemplateMetadata', () => {
    it('should have 7 categories and 3 complexity levels', () => {
      expect(ALL_CATEGORIES).toHaveLength(7);
      expect(ALL_COMPLEXITY).toHaveLength(3);
    });
  });

  describe('ComponentSpec', () => {
    it('should support 5 frameworks and 2 languages', () => {
      expect(ALL_FRAMEWORKS).toHaveLength(5);
      expect(ALL_LANGUAGES).toHaveLength(2);
    });
  });

  describe('GeneratedFile', () => {
    it('should support 8 file types', () => {
      expect(ALL_FILE_TYPES).toHaveLength(8);
    });
  });

  describe('CodeGenerationResult', () => {
    it('should create success and error results', () => {
      const succ: CodeGenerationResult = {
        success: true, warnings: ['Unused import'],
      };
      const err: CodeGenerationResult = { success: false, error: 'Template not found' };
      expect(succ.warnings).toHaveLength(1);
      expect(err.error).toBe('Template not found');
    });
  });

  describe('SyncConfig', () => {
    it('should support 3 strategies', () => {
      expect(ALL_SYNC_STRATEGIES).toHaveLength(3);
    });
  });
});

describe('Codegen Modules', () => {
  it('FileGenerator should be importable', async () => {
    const mod = await import('../engines/file-generator');
    expect(mod.FileGenerator).toBeDefined();
  });

  it('CodeSyncer should be importable', async () => {
    const mod = await import('../engines/sync');
    expect(mod.CodeSyncer).toBeDefined();
  });

  it('CodeValidator should be importable', async () => {
    const mod = await import('../engines/validator');
    expect(mod.CodeValidator).toBeDefined();
  });

  it('CodeGenerationEngine should be importable', async () => {
    const mod = await import('../engines');
    expect(mod.CodeGenerationEngine).toBeDefined();
  });
});
