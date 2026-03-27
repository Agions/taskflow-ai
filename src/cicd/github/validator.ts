/**
 * GitHub Actions 配置验证器
 */

import { PipelineConfig, ValidationResult } from '../types';

export class GitHubConfigValidator {
  async validate(config: PipelineConfig): Promise<ValidationResult> {
    const errors: any[] = [];
    const warnings: any[] = [];

    this.validateTriggers(config, errors);
    this.validateStages(config, errors);
    this.validateSecrets(config, errors);
    this.validateEnvironment(config, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateTriggers(config: PipelineConfig, errors: any[]): void {
    if (!config.triggers || config.triggers.length === 0) {
      errors.push({
        field: 'triggers',
        message: 'At least one trigger is required',
        code: 'MISSING_TRIGGERS',
      });
    }
  }

  private validateStages(config: PipelineConfig, errors: any[]): void {
    if (!config.stages || config.stages.length === 0) {
      errors.push({
        field: 'stages',
        message: 'At least one stage is required',
        code: 'MISSING_STAGES',
      });
    }
  }

  private validateSecrets(config: PipelineConfig, errors: any[]): void {
    for (const secret of config.secrets || []) {
      if (!/^[A-Z_][A-Z0-9_]*$/.test(secret)) {
        errors.push({
          field: `secrets.${secret}`,
          message: 'Secret names must be uppercase with underscores',
          code: 'INVALID_SECRET_NAME',
        });
      }
    }
  }

  private validateEnvironment(_config: PipelineConfig, warnings: any[]): void {
    if (!process.env.GITHUB_TOKEN) {
      warnings.push({
        field: 'env.GITHUB_TOKEN',
        message: 'GITHUB_TOKEN not set, some features may not work',
        code: 'MISSING_TOKEN',
      });
    }
  }
}
