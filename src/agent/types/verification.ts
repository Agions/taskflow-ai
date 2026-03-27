/**
 * 验证相关类型
 */

/**
 * 验证结果
 */
export interface VerificationResult {
  checks: VerificationCheck[];
  allPassed: boolean;
  fixTasks?: any[];
}

/**
 * 验证检查
 */
export interface VerificationCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
  details?: any;
}

/**
 * 代码质量报告
 */
export interface CodeQualityReport {
  score: number;
  issues: CodeIssue[];
  metrics: CodeMetrics;
}

/**
 * 代码问题
 */
export interface CodeIssue {
  file: string;
  line: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  rule: string;
}

/**
 * 代码指标
 */
export interface CodeMetrics {
  linesOfCode: number;
  complexity: number;
  maintainability: number;
}

/**
 * 覆盖率报告
 */
export interface CoverageReport {
  overall: number;
  files: FileCoverage[];
}

/**
 * 文件覆盖率
 */
export interface FileCoverage {
  file: string;
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}

/**
 * 验证引擎接口
 */
export interface VerificationEngine {
  verify(result: any): Promise<VerificationResult>;
  checkCodeQuality(files: string[]): Promise<CodeQualityReport>;
  checkTestCoverage(files: string[]): Promise<CoverageReport>;
}
