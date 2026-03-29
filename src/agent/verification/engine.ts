import { getLogger } from '../../utils/logger';
/**
 * 验证引擎
 * 验证执行结果的质量和正确性
 */

import { ExecutionResult, VerificationResult, VerificationCheck } from '../types';
import { verifyTaskCompletion, verifyGeneratedFiles } from './checks';
import { CodeQualityChecker } from './code-quality';
import { CoverageChecker } from './coverage';
import { DependencyChecker } from './dependencies';
import { TypeSafetyChecker } from './type-safety';
import { generateFixTasks } from './fix-tasks';
const logger = getLogger('agent/verification/engine');


export class VerificationEngine {
  private projectPath: string;
  private codeQualityChecker: CodeQualityChecker;
  private coverageChecker: CoverageChecker;
  private dependencyChecker: DependencyChecker;
  private typeSafetyChecker: TypeSafetyChecker;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.codeQualityChecker = new CodeQualityChecker(projectPath);
    this.coverageChecker = new CoverageChecker(projectPath);
    this.dependencyChecker = new DependencyChecker(projectPath);
    this.typeSafetyChecker = new TypeSafetyChecker(projectPath);
  }

  async verify(result: ExecutionResult): Promise<VerificationResult> {
    logger.info('🔍 Verifying execution results...');

    const checks: VerificationCheck[] = [];
    checks.push(await verifyTaskCompletion(result));
    checks.push(await verifyGeneratedFiles(result));
    checks.push(await this.codeQualityChecker.verify(result));
    checks.push(await this.coverageChecker.verify(result));
    checks.push(await this.dependencyChecker.verify(result));
    checks.push(await this.typeSafetyChecker.verify(result));

    const allPassed = checks.every(c => c.passed);
    const failedChecks = checks.filter(c => !c.passed);

    logger.info(`   ✅ ${checks.filter(c => c.passed).length}/${checks.length} checks passed`);

    if (!allPassed) {
      logger.info('   ⚠️ Failed checks:');
      failedChecks.forEach(c => {
        logger.info(`      - ${c.name}: ${c.message}`);
      });
    }

    return {
      checks,
      allPassed,
      fixTasks: allPassed ? undefined : generateFixTasks(failedChecks),
    };
  }

  async checkCodeQuality(files: string[]) {
    return this.codeQualityChecker.check(files);
  }

  async checkTestCoverage(files: string[]) {
    return this.coverageChecker.check(files);
  }
}

export default VerificationEngine;
