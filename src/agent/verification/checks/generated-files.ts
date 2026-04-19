import { getLogger } from '../../../utils/logger';
/**
 * 生成文件检查
 */

import * as fs from 'fs-extra';
import { ExecutionResult, VerificationCheck } from '../../types';
const logger = getLogger('agent/verification/checks/generated-files');

export async function verifyGeneratedFiles(result: ExecutionResult): Promise<VerificationCheck> {
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
      severity: 'info',
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
      severity: 'info',
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
    severity: 'error',
  };
}
