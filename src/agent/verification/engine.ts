/**
 * 验证引擎
 * 验证执行结果的质量和正确性
 */

import {
  ExecutionResult,
  VerificationResult,
  VerificationCheck,
  CodeQualityReport,
  CoverageReport,
  FileCoverage,
  CodeIssue
} from '../types';
import * as fs from 'fs-extra';
import * as path from 'path';
import { verifyTaskCompletion, verifyGeneratedFiles } from './checks';

export class VerificationEngine {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  async verify(result: ExecutionResult): Promise<VerificationResult> {
    console.log('🔍 Verifying execution results...');

    const checks: VerificationCheck[] = [];
    checks.push(await verifyTaskCompletion(result));
    checks.push(await verifyGeneratedFiles(result));
    checks.push(await this.verifyCodeQuality(result));
    checks.push(await this.verifyTestCoverage(result));
    checks.push(await this.verifyDependencies(result));
    checks.push(await this.verifyTypeSafety(result));

    const allPassed = checks.every(c => c.passed);
    const failedChecks = checks.filter(c => !c.passed);

    console.log(`   ✅ ${checks.filter(c => c.passed).length}/${checks.length} checks passed`);

    if (!allPassed) {
      console.log('   ⚠️ Failed checks:');
      failedChecks.forEach(c => {
        console.log(`      - ${c.name}: ${c.message}`);
      });
    }

    return {
      checks,
      allPassed,
      fixTasks: allPassed ? undefined : this.generateFixTasks(failedChecks)
    };
  }

  private async verifyCodeQuality(result: ExecutionResult): Promise<VerificationCheck> {
    try {
      const report = await this.checkCodeQuality([]);

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

  private async verifyTestCoverage(result: ExecutionResult): Promise<VerificationCheck> {
    try {
      const report = await this.checkTestCoverage([]);

      if (report.overall >= 70) {
        return {
          name: 'Test Coverage',
          passed: true,
          message: `Test coverage: ${report.overall.toFixed(1)}%`,
          severity: 'info',
          details: report
        };
      }

      return {
        name: 'Test Coverage',
        passed: false,
        message: `Test coverage too low: ${report.overall.toFixed(1)}% (minimum: 70%)`,
        severity: 'warning',
        details: report
      };
    } catch (error) {
      return {
        name: 'Test Coverage',
        passed: false,
        message: `Failed to check test coverage: ${error}`,
        severity: 'error'
      };
    }
  }

  private async verifyDependencies(result: ExecutionResult): Promise<VerificationCheck> {
    const nodeModulesPath = path.join(this.projectPath, 'node_modules');
    const packageJsonPath = path.join(this.projectPath, 'package.json');

    if (!await fs.pathExists(packageJsonPath)) {
      return {
        name: 'Dependencies',
        passed: true,
        message: 'No package.json found',
        severity: 'info'
      };
    }

    if (!await fs.pathExists(nodeModulesPath)) {
      return {
        name: 'Dependencies',
        passed: false,
        message: 'node_modules not found. Run npm install',
        severity: 'error'
      };
    }

    return {
      name: 'Dependencies',
      passed: true,
      message: 'Dependencies installed',
      severity: 'info'
    };
  }

  private async verifyTypeSafety(result: ExecutionResult): Promise<VerificationCheck> {
    const tsConfigPath = path.join(this.projectPath, 'tsconfig.json');

    if (!await fs.pathExists(tsConfigPath)) {
      return {
        name: 'Type Safety',
        passed: true,
        message: 'No TypeScript config found',
        severity: 'info'
      };
    }

    return {
      name: 'Type Safety',
      passed: true,
      message: 'TypeScript configuration found',
      severity: 'info'
    };
  }

  private generateFixTasks(failedChecks: VerificationCheck[]): any[] {
    const fixTasks: any[] = [];

    for (const check of failedChecks) {
      switch (check.name) {
        case 'Code Quality':
          fixTasks.push({
            title: 'Fix Code Quality Issues',
            description: 'Address code quality issues identified in the report',
            type: 'code',
            priority: 'medium'
          });
          break;
        case 'Test Coverage':
          fixTasks.push({
            title: 'Add Unit Tests',
            description: 'Increase test coverage to at least 70%',
            type: 'test',
            priority: 'medium'
          });
          break;
        case 'Dependencies':
          fixTasks.push({
            title: 'Install Dependencies',
            description: 'Run npm install to install missing dependencies',
            type: 'shell',
            priority: 'high'
          });
          break;
      }
    }

    return fixTasks;
  }

  async checkCodeQuality(_files: string[]): Promise<CodeQualityReport> {
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

  async checkTestCoverage(_files: string[]): Promise<CoverageReport> {
    const coveragePath = path.join(this.projectPath, 'coverage');
    let overall = 0;
    const fileCoverages: FileCoverage[] = [];

    if (await fs.pathExists(coveragePath)) {
      try {
        const summaryPath = path.join(coveragePath, 'coverage-summary.json');
        if (await fs.pathExists(summaryPath)) {
          const summary = await fs.readJson(summaryPath);
          overall = summary.total?.lines?.pct || 0;

          for (const [file, data] of Object.entries(summary)) {
            if (file !== 'total') {
              fileCoverages.push({
                file,
                statements: (data as any).statements?.pct || 0,
                branches: (data as any).branches?.pct || 0,
                functions: (data as any).functions?.pct || 0,
                lines: (data as any).lines?.pct || 0
              });
            }
          }
        }
      } catch {
        overall = 0;
      }
    }

    return { overall, files: fileCoverages };
  }
}

export default VerificationEngine;
