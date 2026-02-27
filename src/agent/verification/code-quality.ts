/**
 * 代码质量检查
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { CodeQualityReport, CodeIssue, ExecutionResult, VerificationCheck } from '../types';

export class CodeQualityChecker {
  constructor(private projectPath: string) {}

  async verify(result: ExecutionResult): Promise<VerificationCheck> {
    try {
      const report = await this.check([]);

      if (report.score >= 80) {
        return {
          name: 'Code Quality',
          passed: true,
          message: `Code quality score: ${report.score}/100`,
          severity: 'info',
          details: report
        };
      }

      return {
        name: 'Code Quality',
        passed: false,
        message: `Code quality score too low: ${report.score}/100 (minimum: 80)`,
        severity: 'warning',
        details: report
      };
    } catch (error) {
      return {
        name: 'Code Quality',
        passed: false,
        message: `Failed to check code quality: ${error}`,
        severity: 'error'
      };
    }
  }

  async check(_files: string[]): Promise<CodeQualityReport> {
    const issues: CodeIssue[] = [];
    let totalLines = 0;

    const srcPath = path.join(this.projectPath, 'src');
    if (await fs.pathExists(srcPath)) {
      await this.scanDirectory(srcPath, issues, (lines) => { totalLines += lines; });
    }

    const baseScore = 100;
    const errorPenalty = issues.filter(i => i.severity === 'error').length * 10;
    const warningPenalty = issues.filter(i => i.severity === 'warning').length * 2;
    const score = Math.max(0, baseScore - errorPenalty - warningPenalty);

    return {
      score,
      issues,
      metrics: {
        linesOfCode: totalLines,
        complexity: Math.floor(totalLines / 100),
        maintainability: score
      }
    };
  }

  private async scanDirectory(dir: string, issues: CodeIssue[], onLines: (n: number) => void): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await this.scanDirectory(fullPath, issues, onLines);
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        const content = await fs.readFile(fullPath, 'utf-8');
        const lines = content.split('\n');
        onLines(lines.length);

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          if (line.includes('console.log') && !line.includes('//')) {
            issues.push({
              file: fullPath,
              line: i + 1,
              message: 'Unexpected console.log',
              severity: 'warning',
              rule: 'no-console'
            });
          }

          if (line.includes('TODO') || line.includes('FIXME')) {
            issues.push({
              file: fullPath,
              line: i + 1,
              message: 'TODO/FIXME found',
              severity: 'info',
              rule: 'todo'
            });
          }
        }
      }
    }
  }
}
