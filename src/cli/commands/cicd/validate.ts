/**
 * CI/CD validate 命令
 */

import chalk from 'chalk';
import ora from 'ora';
import { isInitialized, loadConfig, createIntegration } from './engine';

interface ValidateOptions {
  config?: string;
}

/**
 * 执行 validate 命令
 */
export async function executeValidate(options: ValidateOptions): Promise<void> {
  const spinner = ora('Validating configuration...').start();

  try {
    if (!(await isInitialized(options.config))) {
      spinner.fail('CI/CD not initialized. Run "taskflow cicd init" first.');
      return;
    }

    const config = await loadConfig(options.config);
    if (!config) {
      spinner.fail('Failed to load configuration');
      return;
    }

    const integration = createIntegration('owner/repo');
    const result = await integration.validateConfig(config);

    spinner.stop();

    if (result.valid) {
      console.log(chalk.green('✅ Configuration is valid'));
    } else {
      console.log(chalk.red('❌ Configuration has errors:'));
      for (const error of result.errors) {
        console.log(`  • ${error.field}: ${error.message}`);
      }
    }

    if (result.warnings.length > 0) {
      console.log(chalk.yellow('\n⚠️  Warnings:'));
      for (const warning of result.warnings) {
        console.log(`  • ${warning.field}: ${warning.message}`);
      }
    }
  } catch (error) {
    spinner.fail(`Validation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
