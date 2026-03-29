import { getLogger } from '../../utils/logger';
/**
 * 测试覆盖率检查
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { CoverageReport, FileCoverage, ExecutionResult, VerificationCheck } from '../types';
const logger = getLogger('agent/verification/coverage');


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
              fileCoverages.push({
                file,
                statements: (data as any).statements?.pct || 0,
                branches: (data as any).branches?.pct || 0,
                functions: (data as any).functions?.pct || 0,
                lines: (data as any).lines?.pct || 0,
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
