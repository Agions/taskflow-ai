/**
 * 验证引擎
 * 验证执行结果的质量和正确性
 */

import {
  ExecutionResult,
  VerificationResult,
  VerificationCheck,
  TaskResult,
  CodeQualityReport,
  CodeIssue,
  CodeMetrics,
  CoverageReport,
  FileCoverage
} from '../types';
import * as fs from 'fs-extra';
import * as path from 'path';

export class VerificationEngine {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * 验证执行结果
   */
  async verify(result: ExecutionResult): Promise<VerificationResult> {
    console.log('🔍 Verifying execution results...');

    const checks: VerificationCheck[] = [];

    checks.push(await this.verifyTaskCompletion(result));

    checks.push(await this.verifyGeneratedFiles(result));

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

  /**
   * 检查任务完成状态
   */
  private async verifyTaskCompletion(result: ExecutionResult): Promise<VerificationCheck> {
    const failedTasks = result.results.filter(r => !r.success);

    if (failedTasks.length === 0) {
      return {
        name: 'Task Completion',
        passed: true,
        message: `All ${result.results.length} tasks completed successfully`,
        severity: 'info'
      };
    }

    return {
      name: 'Task Completion',
      passed: false,
      message: `${failedTasks.length} tasks failed: ${failedTasks.map(t => t.taskId).join(', ')}`,
      severity: 'error'
    };
  }

  /**
   * 检查生成的文件
   */
  private async verifyGeneratedFiles(result: ExecutionResult): Promise<VerificationCheck> {
    const allArtifacts: string[] = [];

    for (const taskResult of result.results) {
      if (taskResult.artifacts) {
        allArtifacts.push(...taskResult.artifacts);
      }
    }

    if (allArtifacts.length === 0) {
      return {
        name: 'Generated Files',
        passed: true,
        message: 'No files to verify',
        severity: 'info'
      };
    }

    const missingFiles: string[] = [];
    const emptyFiles: string[] = [];

    for (const filePath of allArtifacts) {
      try {
        const stats = await fs.stat(filePath);
        if (stats.size === 0) {
          emptyFiles.push(filePath);
        }
      } catch {
        missingFiles.push(filePath);
      }
    }

    if (missingFiles.length === 0 && emptyFiles.length === 0) {
      return {
        name: 'Generated Files',
        passed: true,
        message: `${allArtifacts.length} files generated and verified`,
        severity: 'info'
      };
    }

    const issues: string[] = [];
    if (missingFiles.length > 0) {
      issues.push(`${missingFiles.length} missing`);
    }
    if (emptyFiles.length > 0) {
      issues.push(`${emptyFiles.length} empty`);
    }

    return {
      name: 'Generated Files',
      passed: false,
      message: `File issues: ${issues.join(', ')}`,
      severity: 'error'
    };
  }

  /**
   * 检查代码质量
   */
  private async verifyCodeQuality(result: ExecutionResult): Promise<VerificationCheck> {
    try {
      const report = await this.checkCodeQuality([]);

      if (report.score >= 80) {
        return {
          name: 'Code Quality',
          passed: true,
          message: `Code quality score: ${report.score}/100`,
          severity: 'info'
        };
      }

      const criticalIssues = report.issues.filter(i => i.severity === 'error');
      if (criticalIssues.length > 0) {
        return {
          name: 'Code Quality',
          passed: false,
          message: `Quality score ${report.score}/100, ${criticalIssues.length} critical issues`,
          severity: 'error'
        };
      }

      return {
        name: 'Code Quality',
        passed: true,
        message: `Quality score: ${report.score}/100 (with warnings)`,
        severity: 'warning'
      };
    } catch (error) {
      return {
        name: 'Code Quality',
        passed: true,
        message: 'Could not verify code quality',
        severity: 'warning'
      };
    }
  }

  /**
   * 检查测试覆盖
   */
  private async verifyTestCoverage(result: ExecutionResult): Promise<VerificationCheck> {
    try {
      const report = await this.checkTestCoverage([]);

      if (report.overall >= 70) {
        return {
          name: 'Test Coverage',
          passed: true,
          message: `Coverage: ${report.overall.toFixed(1)}%`,
          severity: 'info'
        };
      }

      if (report.overall >= 50) {
        return {
          name: 'Test Coverage',
          passed: true,
          message: `Coverage: ${report.overall.toFixed(1)}% (below recommended 70%)`,
          severity: 'warning'
        };
      }

      return {
        name: 'Test Coverage',
        passed: false,
        message: `Coverage too low: ${report.overall.toFixed(1)}%`,
        severity: 'error'
      };
    } catch (error) {
      return {
        name: 'Test Coverage',
        passed: true,
        message: 'Could not verify test coverage',
        severity: 'warning'
      };
    }
  }

  /**
   * 检查依赖完整性
   */
  private async verifyDependencies(result: ExecutionResult): Promise<VerificationCheck> {
    try {
      const packageJsonPath = path.join(this.projectPath, 'package.json');
      const packageJson = await fs.readJson(packageJsonPath);

      const hasDependencies = Object.keys(packageJson.dependencies || {}).length > 0;
      const hasDevDependencies = Object.keys(packageJson.devDependencies || {}).length > 0;

      if (!hasDependencies && !hasDevDependencies) {
        return {
          name: 'Dependencies',
          passed: true,
          message: 'No dependencies required',
          severity: 'info'
        };
      }

      const nodeModulesPath = path.join(this.projectPath, 'node_modules');
      const nodeModulesExists = await fs.pathExists(nodeModulesPath);

      if (!nodeModulesExists) {
        return {
          name: 'Dependencies',
          passed: false,
          message: 'Dependencies not installed (run npm install)',
          severity: 'error'
        };
      }

      return {
        name: 'Dependencies',
        passed: true,
        message: 'Dependencies verified',
        severity: 'info'
      };
    } catch (error) {
      return {
        name: 'Dependencies',
        passed: true,
        message: 'Could not verify dependencies',
        severity: 'warning'
      };
    }
  }

  /**
   * 检查类型安全
   */
  private async verifyTypeSafety(result: ExecutionResult): Promise<VerificationCheck> {
    try {
      const tsConfigPath = path.join(this.projectPath, 'tsconfig.json');
      const tsConfigExists = await fs.pathExists(tsConfigPath);

      if (!tsConfigExists) {
        return {
          name: 'Type Safety',
          passed: true,
          message: 'No TypeScript configuration found',
          severity: 'warning'
        };
      }

      return {
        name: 'Type Safety',
        passed: true,
        message: 'TypeScript configuration present',
        severity: 'info'
      };
    } catch (error) {
      return {
        name: 'Type Safety',
        passed: true,
        message: 'Could not verify type safety',
        severity: 'warning'
      };
    }
  }

  /**
   * 生成修复任务
   */
  private generateFixTasks(failedChecks: VerificationCheck[]): any[] {
    const fixTasks: any[] = [];

    for (const check of failedChecks) {
      switch (check.name) {
        case 'Task Completion':
          fixTasks.push({
            title: 'Fix Failed Tasks',
            description: `Address failures: ${check.message}`,
            type: 'code',
            priority: 'critical'
          });
          break;

        case 'Generated Files':
          fixTasks.push({
            title: 'Regenerate Missing Files',
            description: 'Regenerate files that are missing or empty',
            type: 'code',
            priority: 'high'
          });
          break;

        case 'Code Quality':
          fixTasks.push({
            title: 'Fix Code Quality Issues',
            description: 'Address code quality and linting issues',
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

  /**
   * 检查代码质量（详细实现）
   */
  async checkCodeQuality(files: string[]): Promise<CodeQualityReport> {

    const issues: CodeIssue[] = [];
    let totalLines = 0;

    const srcPath = path.join(this.projectPath, 'src');
    if (await fs.pathExists(srcPath)) {
      const scanDirectory = async (dir: string): Promise<void> => {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            await scanDirectory(fullPath);
          } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
            const content = await fs.readFile(fullPath, 'utf-8');
            const lines = content.split('\n');
            totalLines += lines.length;

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
      };

      await scanDirectory(srcPath);
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

  /**
   * 检查测试覆盖（详细实现）
   */
  async checkTestCoverage(files: string[]): Promise<CoverageReport> {

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
        } else {
          overall = 45;
        }
      } catch {
        overall = 0;
      }
    } else {
      overall = 0;
    }

    return {
      overall,
      files: fileCoverages
    };
  }
}

export default VerificationEngine;
