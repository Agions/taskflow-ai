/**
 * 代码验证器
 */

import { ComponentSpec, CodeQualityCheck, GeneratedFile } from '../types';

export class CodeValidator {
  validateSpec(spec: ComponentSpec): void {
    if (!spec.name) {
      throw new Error('Component name is required');
    }

    if (!/^[A-Z][a-zA-Z0-9]*$/.test(spec.name)) {
      throw new Error(`Invalid component name: ${spec.name}. Must start with uppercase letter.`);
    }

    const validFrameworks = ['react', 'vue', 'angular', 'svelte'];
    if (!validFrameworks.includes(spec.framework)) {
      throw new Error(`Unsupported framework: ${spec.framework}`);
    }
  }

  async checkCodeQuality(files: GeneratedFile[]): Promise<CodeQualityCheck[]> {
    const checks: CodeQualityCheck[] = [];

    for (const file of files) {
      if (file.type === 'component') {
        checks.push(this.checkComponentStructure(file));
        checks.push(this.checkImports(file));
      }

      if (file.type === 'test') {
        checks.push(this.checkTestCoverage(file));
      }
    }

    return checks;
  }

  private checkComponentStructure(file: GeneratedFile): CodeQualityCheck {
    const hasExport = file.content.includes('export');
    const hasDefaultExport = file.content.includes('export default');

    return {
      name: 'component-structure',
      passed: hasExport || hasDefaultExport,
      message: hasExport ? 'Component has export' : 'Component missing export',
      severity: 'error'
    };
  }

  private checkImports(file: GeneratedFile): CodeQualityCheck {
    const unusedImports = this.findUnusedImports(file.content);

    return {
      name: 'unused-imports',
      passed: unusedImports.length === 0,
      message: unusedImports.length > 0 ? `Unused imports: ${unusedImports.join(', ')}` : 'No unused imports',
      severity: 'warning'
    };
  }

  private checkTestCoverage(file: GeneratedFile): CodeQualityCheck {
    const hasTests = file.content.includes('it(') || file.content.includes('test(');

    return {
      name: 'test-coverage',
      passed: hasTests,
      message: hasTests ? 'Tests found' : 'No tests found',
      severity: 'warning'
    };
  }

  private findUnusedImports(content: string): string[] {
    const importRegex = /import\s+\{([^}]+)\}/g;
    const imports: string[] = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const names = match[1].split(',').map(s => s.trim().split(' ')[0]);
      imports.push(...names);
    }

    return imports.filter(name => {
      const usageRegex = new RegExp(`\\b${name}\\b`, 'g');
      const usages = content.match(usageRegex);
      return usages && usages.length <= 1;
    });
  }
}
