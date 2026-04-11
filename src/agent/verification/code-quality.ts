import { getLogger } from '../../utils/logger';
/**
 * 代码质量检查 — 实际运行 ESLint + 本地启发式扫描
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { CodeQualityReport, CodeIssue, ExecutionResult, VerificationCheck } from '../types';
const execAsync = promisify(exec);
const logger = getLogger('agent/verification/code-quality');

export class CodeQualityChecker {
  constructor(
    private projectPath: string,
    private eslintPath: string = 'npx eslint',
    private eslintExtensions: string[] = ['.ts', '.tsx'],
    private scoreThreshold: number = 80
  ) {}

  async verify(_result: ExecutionResult): Promise<VerificationCheck> {
    const eslintReport = await this.runEslint();
    const heuristicReport = await this.runHeuristicScan();

    const issues = [...eslintReport.issues, ...heuristicReport.issues];
    const score = this.calculateScore(issues, eslintReport.totalErrors, eslintReport.totalWarnings);

    if (score >= this.scoreThreshold) {
      return {
        name: 'Code Quality',
        passed: true,
        message: `Code quality score: ${score}/${this.scoreThreshold} (${issues.length} issue(s))`,
        severity: 'info',
        details: { score, issues, eslint: eslintReport, heuristic: heuristicReport },
      };
    }

    return {
      name: 'Code Quality',
      passed: false,
      message: `Code quality score too low: ${score}/${this.scoreThreshold} (${issues.length} issue(s))`,
      severity: 'warning',
      details: { score, issues, eslint: eslintReport, heuristic: heuristicReport },
    };
  }

  /** 运行 ESLint，返回结构和解析后的 issues */
  async runEslint(): Promise<{
    issues: CodeIssue[];
    totalErrors: number;
    totalWarnings: number;
  }> {
    const issues: CodeIssue[] = [];
    let totalErrors = 0;
    let totalWarnings = 0;

    const srcPath = path.join(this.projectPath, 'src');
    if (!(await fs.pathExists(srcPath))) {
      return { issues, totalErrors, totalWarnings };
    }

    const extGlob = this.eslintExtensions.map(e => `**/*${e}`).join(' ');
    const eslintCmd = `${this.eslintPath} ${extGlob} --format=json --no-error-on-unmatched-pattern`;

    try {
      const { stdout } = await execAsync(eslintCmd, {
        cwd: this.projectPath,
        timeout: 120_000,
      });

      const results: Array<{
        filePath?: string;
        messages: Array<{
          line: number;
          severity: number;
          message: string;
          ruleId?: string;
        }>;
      }> = JSON.parse(stdout);

      for (const fileResult of results) {
        const file = fileResult.filePath || 'unknown';
        for (const msg of fileResult.messages) {
          const severity = msg.severity === 2 ? 'error' : 'warning';
          if (severity === 'error') totalErrors++;
          else totalWarnings++;

          issues.push({
            file,
            line: msg.line,
            message: msg.message,
            severity,
            rule: msg.ruleId || 'unknown',
          });
        }
      }
    } catch (error: unknown) {
      const err = error as { stdout?: string; stderr?: string; code?: number };
      // ESLint exits non-zero when linting errors found — parse partial output
      if (err.stdout) {
        try {
          const results: Array<{
            filePath?: string;
            messages: Array<{
              line: number;
              severity: number;
              message: string;
              ruleId?: string;
            }>;
          }> = JSON.parse(err.stdout);

          for (const fileResult of results) {
            const file = fileResult.filePath || 'unknown';
            for (const msg of fileResult.messages) {
              const severity = msg.severity === 2 ? 'error' : 'warning';
              if (severity === 'error') totalErrors++;
              else totalWarnings++;
              issues.push({
                file,
                line: msg.line,
                message: msg.message,
                severity,
                rule: msg.ruleId || 'unknown',
              });
            }
          }
        } catch {
          // JSON parse failed, skip ESLint results
          logger.debug('ESLint output parse failed, continuing with heuristic scan');
        }
      }
    }

    return { issues, totalErrors, totalWarnings };
  }

  /** 启发式扫描：console.log / TODO / FIXME / any 类型 */
  async runHeuristicScan(): Promise<{ issues: CodeIssue[] }> {
    const issues: CodeIssue[] = [];
    const srcPath = path.join(this.projectPath, 'src');

    if (!(await fs.pathExists(srcPath))) {
      return { issues };
    }

    await this.scanDirectory(srcPath, issues);
    return { issues };
  }

  private calculateScore(
    issues: CodeIssue[],
    eslintErrors: number,
    eslintWarnings: number
  ): number {
    // 基础分 100，先扣 ESLint 的真实错误/警告
    let score = 100;

    // ESLint 真实问题权重最高
    const errorPenalty = eslintErrors * 10 + eslintWarnings * 2;
    score = Math.max(0, score - errorPenalty);

    // 启发式问题（console.log / TODO 等）
    const heuristicErrors = issues.filter(
      i => !i.rule && (i.rule === 'no-console' || i.rule === 'todo' || i.rule === 'no-any')
    );
    const heuristicWarningPenalty = heuristicErrors.length * 1;
    score = Math.max(0, score - heuristicWarningPenalty);

    return score;
  }

  private async scanDirectory(dir: string, issues: CodeIssue[]): Promise<void> {
    let entries: Array<{ isDirectory: () => boolean; name: string }>;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // 跳过 node_modules / dist / coverage 等
        if (['node_modules', 'dist', 'coverage', '.git', '_DEAD'].includes(entry.name)) {
          continue;
        }
        await this.scanDirectory(fullPath, issues);
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        const content = await fs.readFile(fullPath, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmed = line.trim();

          if (trimmed.includes('console.log') && !trimmed.startsWith('//')) {
            issues.push({
              file: fullPath,
              line: i + 1,
              message: 'Unexpected console.log',
              severity: 'warning',
              rule: 'no-console',
            });
          }
          if (trimmed.includes('TODO') || trimmed.includes('FIXME')) {
            issues.push({
              file: fullPath,
              line: i + 1,
              message: `${trimmed.includes('TODO') ? 'TODO' : 'FIXME'} found`,
              severity: 'info',
              rule: 'todo',
            });
          }
          if (/: any$/.test(trimmed) || /<any>/.test(trimmed)) {
            issues.push({
              file: fullPath,
              line: i + 1,
              message: 'Implicit any type',
              severity: 'info',
              rule: 'no-any',
            });
          }
        }
      }
    }
  }
}
