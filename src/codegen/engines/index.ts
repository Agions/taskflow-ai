/**
 * 代码生成引擎
 * 根据组件规范生成代码
 */

import * as path from 'path';
import {
  ComponentSpec,
  GeneratedComponent,
  CodeGenerationResult,
  CodegenConfig,
  SyncConfig,
  GenerationStats,
} from '../types';
import { TemplateManager } from '../templates';
import { FileGenerator } from './file-generator';
import { CodeValidator } from './validator';
import { CodeSyncer } from './sync';

export * from './file-generator';
export * from './validator';
export * from './sync';

export class CodeGenerationEngine {
  private templateManager: TemplateManager;
  private fileGenerator: FileGenerator;
  private validator: CodeValidator;
  private syncer: CodeSyncer;
  private config: CodegenConfig;

  constructor(config?: Partial<CodegenConfig>) {
    this.config = {
      templatesDir: path.join(__dirname, '../../templates'),
      outputDir: process.cwd(),
      defaultFramework: 'react',
      defaultLanguage: 'typescript',
      autoFormat: true,
      autoLint: true,
      ...config,
    };
    this.templateManager = new TemplateManager(this.config.templatesDir);
    this.fileGenerator = new FileGenerator();
    this.validator = new CodeValidator();
    this.syncer = new CodeSyncer(this.config.outputDir);
  }

  async initialize(): Promise<void> {
    await this.templateManager.loadCustomTemplates();
  }

  async generateComponent(spec: ComponentSpec): Promise<CodeGenerationResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    try {
      this.validator.validateSpec(spec);

      const template = this.templateManager.selectTemplateForSpec(spec);
      if (!template) {
        return { success: false, error: `No template found for framework: ${spec.framework}` };
      }

      const context = this.buildTemplateContext(spec);
      const mainContent = this.templateManager.renderTemplate(template.id, context);

      const files = [
        this.fileGenerator.generateMainFile(spec, mainContent),
        ...(spec.hasStyles ? [this.fileGenerator.generateStyleFile(spec)] : []),
        this.fileGenerator.generateTestFile(spec),
        this.fileGenerator.generateIndexFile(spec),
      ];

      const qualityChecks = await this.validator.checkCodeQuality(files);
      const failedChecks = qualityChecks.filter(c => !c.passed && c.severity === 'error');

      if (failedChecks.length > 0) {
        warnings.push(...failedChecks.map(c => c.message));
      }

      const component: GeneratedComponent = {
        name: spec.name,
        framework: spec.framework,
        files,
        metadata: {
          generatedAt: new Date(),
          templateId: template.id,
          variables: context,
        },
      };

      const stats: GenerationStats = {
        totalFiles: files.length,
        totalLines: files.reduce((sum, f) => sum + f.content.split('\n').length, 0),
        duration: Date.now() - startTime,
        templatesUsed: [template.id],
      };

      console.log(
        `✅ Generated ${component.name} (${stats.totalLines} lines, ${stats.duration}ms)`
      );

      return {
        success: true,
        component,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async syncComponent(
    component: GeneratedComponent,
    syncConfig?: Partial<SyncConfig>
  ): Promise<{ success: boolean; syncedFiles: string[]; error?: string }> {
    return this.syncer.sync(component, syncConfig);
  }

  private buildTemplateContext(spec: ComponentSpec): Record<string, any> {
    return {
      name: spec.name,
      description: spec.description,
      props: spec.props || [],
      hasStyles: spec.hasStyles,
      framework: spec.framework,
      language: spec.language,
    };
  }
}

export default CodeGenerationEngine;
