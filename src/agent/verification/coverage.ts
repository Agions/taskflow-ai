import { getLogger } from '../../utils/logger';
/**
 * 测试覆盖率检查
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { CoverageReport, FileCoverage, ExecutionResult, VerificationCheck } from '../types';
const logger = getLogger('agent/verification/coverage');

/** Istanbul/lcov coverage-summary.json 文件的单个条目格式 */
interface CoverageData {
  statements?: { pct?: number };
  branches?: { pct?: number };
  functions?: { pct?: number };
  lines?: { pct?: number };
}

export class CoverageChecker {
  constructor(private projectPath: string) {}

  async verify(result: ExecutionResult): Promise<VerificationCheck> {
    try {
      const report = await this.check([]);

      if (report.overall >= 70) {
        return {
          name: 'Test Coverage',
          passed: true,
          message: `Test coverage: ${report.overall.toFixed(1)}%`,
          severity: 'info',
          details: report,
        };
      }

      return {
        name: 'Test Coverage',
        passed: false,
        message: `Test coverage too low: ${report.overall.toFixed(1)}% (minimum: 70%)`,
        severity: 'warning',
        details: report,
      };
    } catch (error) {
      return {
        name: 'Test Coverage',
        passed: false,
        message: `Failed to check test coverage: ${error}`,
        severity: 'error',
      };
    }
  }

  async check(_files: string[]): Promise<CoverageReport> {
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
              const d = data as CoverageData;
              fileCoverages.push({
                file,
                statements: d.statements?.pct || 0,
                branches: d.branches?.pct || 0,
                functions: d.functions?.pct || 0,
                lines: d.lines?.pct || 0,
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
