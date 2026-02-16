/**
 * 代码生成引擎
 * 根据组件规范生成代码
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import Handlebars from 'handlebars';
import {
  ComponentSpec,
  GeneratedComponent,
  GeneratedFile,
  CodeGenerationResult,
  CodegenConfig,
  SyncConfig,
  CodeQualityCheck,
  GenerationStats
} from '../types';
import { TemplateManager } from '../templates';

export class CodeGenerationEngine {
  private templateManager: TemplateManager;
  private config: CodegenConfig;

  constructor(config?: Partial<CodegenConfig>) {
    this.config = {
      templatesDir: path.join(__dirname, '../../templates'),
      outputDir: process.cwd(),
      defaultFramework: 'react',
      defaultLanguage: 'typescript',
      autoFormat: true,
      autoLint: true,
      ...config
    };
    this.templateManager = new TemplateManager(this.config.templatesDir);
  }

  /**
   * 初始化引擎
   */
  async initialize(): Promise<void> {
    await this.templateManager.loadCustomTemplates();
  }

  /**
   * 生成组件
   */
  async generateComponent(spec: ComponentSpec): Promise<CodeGenerationResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    try {
      // 1. 验证规范
      this.validateSpec(spec);

      // 2. 选择模板
      const template = this.templateManager.selectTemplateForSpec(spec);
      if (!template) {
        return {
          success: false,
          error: `No template found for framework: ${spec.framework}`
        };
      }

      // 3. 准备上下文
      const context = this.buildTemplateContext(spec);

      // 4. 渲染模板
      const mainContent = this.templateManager.renderTemplate(template.id, context);

      // 5. 生成文件
      const files: GeneratedFile[] = [];

      // 主组件文件
      const mainFile = this.generateMainFile(spec, mainContent);
      files.push(mainFile);

      // 样式文件
      if (spec.hasStyles) {
        const styleFile = this.generateStyleFile(spec);
        files.push(styleFile);
      }

      // 测试文件
      const testFile = this.generateTestFile(spec);
      files.push(testFile);

      // 索引文件
      const indexFile = this.generateIndexFile(spec);
      files.push(indexFile);

      // 6. 代码质量检查
      const qualityChecks = await this.checkCodeQuality(files);
      const failedChecks = qualityChecks.filter(c => !c.passed && c.severity === 'error');

      if (failedChecks.length > 0) {
        warnings.push(...failedChecks.map(c => c.message));
      }

      // 7. 格式化代码
      if (this.config.autoFormat) {
        await this.formatFiles(files);
      }

      const component: GeneratedComponent = {
        name: spec.name,
        framework: spec.framework,
        files,
        metadata: {
          generatedAt: new Date(),
          templateId: template.id,
          variables: context
        }
      };

      const stats: GenerationStats = {
        totalFiles: files.length,
        totalLines: files.reduce((sum, f) => sum + f.content.split('\n').length, 0),
        duration: Date.now() - startTime,
        templatesUsed: [template.id]
      };

      console.log(`✅ Generated ${component.name} (${stats.totalLines} lines, ${stats.duration}ms)`);

      return {
        success: true,
        component,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * 同步生成的代码到项目
   */
  async syncComponent(
    component: GeneratedComponent,
    syncConfig?: Partial<SyncConfig>
  ): Promise<{ success: boolean; syncedFiles: string[]; error?: string }> {
    const config: SyncConfig = {
      strategy: 'overwrite',
      backup: true,
      dryRun: false,
      ignorePatterns: ['node_modules', '.git', 'dist', 'build'],
      ...syncConfig
    };

    const syncedFiles: string[] = [];

    try {
      for (const file of component.files) {
        const targetPath = path.join(this.config.outputDir, file.path);

        // 检查是否忽略
        if (this.shouldIgnore(targetPath, config.ignorePatterns)) {
          continue;
        }

        // 备份现有文件
        if (config.backup && await fs.pathExists(targetPath)) {
          const backupPath = `${targetPath}.backup-${Date.now()}`;
          await fs.copy(targetPath, backupPath);
        }

        // 检查策略
        const exists = await fs.pathExists(targetPath);

        if (exists && config.strategy === 'skip') {
          console.log(`⏭️  Skipped: ${file.path}`);
          continue;
        }

        if (exists && config.strategy === 'merge') {
          // 合并逻辑（简化实现）
          console.log(`🔀 Merged: ${file.path}`);
        }

        // 写入文件
        if (!config.dryRun) {
          await fs.ensureDir(path.dirname(targetPath));
          await fs.writeFile(targetPath, file.content, 'utf-8');
        }

        syncedFiles.push(file.path);
        console.log(`✅ ${config.dryRun ? '[DRY RUN] ' : ''}Synced: ${file.path}`);
      }

      return { success: true, syncedFiles };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, syncedFiles, error: errorMessage };
    }
  }

  /**
   * 验证组件规范
   */
  private validateSpec(spec: ComponentSpec): void {
    if (!spec.name) {
      throw new Error('Component name is required');
    }

    if (!/^[A-Z][a-zA-Z0-9]*$/.test(spec.name)) {
      throw new Error('Component name must be PascalCase');
    }

    const validFrameworks = ['react', 'vue', 'angular', 'svelte', 'vanilla'];
    if (!validFrameworks.includes(spec.framework)) {
      throw new Error(`Invalid framework: ${spec.framework}. Must be one of: ${validFrameworks.join(', ')}`);
    }
  }

  /**
   * 构建模板上下文
   */
  private buildTemplateContext(spec: ComponentSpec): Record<string, unknown> {
    return {
      componentName: spec.name,
      description: spec.description,
      props: spec.props || [],
      hasState: spec.hasState || false,
      hasEffects: spec.hasEffects || false,
      hasStyles: spec.hasStyles !== false,
      styleType: spec.styleType || 'css',
      framework: spec.framework,
      language: spec.language
    };
  }

  /**
   * 生成主文件
   */
  private generateMainFile(spec: ComponentSpec, content: string): GeneratedFile {
    const extension = spec.language === 'typescript' ? 'tsx' : 'jsx';
    const fileName = `${spec.name}.${extension}`;

    return {
      path: fileName,
      content,
      type: extension
    };
  }

  /**
   * 生成样式文件
   */
  private generateStyleFile(spec: ComponentSpec): GeneratedFile {
    const extension = spec.styleType === 'scss' ? 'scss' : 'css';
    const fileName = `${spec.name}.module.${extension}`;
    const className = spec.name
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();

    const content = extension === 'scss'
      ? `.${className} {
  // TODO: Add styles

  &__container {
    // Container styles
  }
}`
      : `.${className} {
  /* TODO: Add styles */
}`;

    return {
      path: fileName,
      content,
      type: extension
    };
  }

  /**
   * 生成测试文件
   */
  private generateTestFile(spec: ComponentSpec): GeneratedFile {
    const extension = spec.language === 'typescript' ? 'test.tsx' : 'test.jsx';
    const fileName = `${spec.name}.${extension}`;

    const content = `import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ${spec.name} } from './${spec.name}';

describe('${spec.name}', () => {
  it('should render successfully', () => {
    render(<${spec.name} />);
    expect(screen.getByText('${spec.name}')).toBeInTheDocument();
  });

${spec.props?.map(prop => `  it('should handle ${prop.name} prop', () => {
    render(<${spec.name} ${prop.name}={${prop.defaultValue || 'null'}} />);
    // TODO: Add assertion
  });`).join('\n\n') || ''}
});
`;

    return {
      path: fileName,
      content,
      type: 'test'
    };
  }

  /**
   * 生成索引文件
   */
  private generateIndexFile(spec: ComponentSpec): GeneratedFile {
    const content = `export { ${spec.name} } from './${spec.name}';
export type { ${spec.name}Props } from './${spec.name}';
`;

    return {
      path: 'index.ts',
      content,
      type: 'ts'
    };
  }

  /**
   * 检查代码质量
   */
  private async checkCodeQuality(files: GeneratedFile[]): Promise<CodeQualityCheck[]> {
    const checks: CodeQualityCheck[] = [];

    for (const file of files) {
      // 检查文件大小
      const lines = file.content.split('\n').length;
      if (lines > 500) {
        checks.push({
          name: 'File Size',
          passed: false,
          message: `${file.path} is too large (${lines} lines)`,
          severity: 'warning'
        });
      }

      // 检查 TODO 标记
      const todoCount = (file.content.match(/TODO/g) || []).length;
      if (todoCount > 5) {
        checks.push({
          name: 'TODO Count',
          passed: false,
          message: `${file.path} has ${todoCount} TODOs`,
          severity: 'warning'
        });
      }

      // 检查 console.log
      if (file.content.includes('console.log')) {
        checks.push({
          name: 'Console Usage',
          passed: false,
          message: `${file.path} contains console.log`,
          severity: 'warning'
        });
      }
    }

    return checks;
  }

  /**
   * 格式化文件
   */
  private async formatFiles(files: GeneratedFile[]): Promise<void> {
    // 简化实现：实际应该使用 Prettier
    for (const file of files) {
      // 基本的格式化：确保文件以换行符结尾
      if (!file.content.endsWith('\n')) {
        file.content += '\n';
      }
    }
  }

  /**
   * 检查是否应该忽略
   */
  private shouldIgnore(filePath: string, patterns: string[]): boolean {
    return patterns.some(pattern => filePath.includes(pattern));
  }

  /**
   * 获取所有可用模板
   */
  getAvailableTemplates(): string[] {
    return this.templateManager.getAllTemplates().map(t => t.id);
  }

  /**
   * 获取模板详情
   */
  getTemplateDetails(templateId: string) {
    const template = this.templateManager.getTemplate(templateId);
    if (!template) return null;

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      framework: template.framework,
      language: template.language,
      variables: template.variables,
      category: template.metadata.category,
      complexity: template.metadata.complexity
    };
  }
}

export default CodeGenerationEngine;
