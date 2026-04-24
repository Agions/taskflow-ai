/**
 * CI/CD trigger 命令
 */

import chalk = require('chalk');
import ora = require('ora');
import { createIntegration, validateToken, detectRepo } from './engine';

interface TriggerOptions {
  branch: string;
}

/**
 * 执行 trigger 命令
 */
export async function executeTrigger(options: TriggerOptions): Promise<void> {
  const spinner = ora('Triggering pipeline...').start();

  try {
    const tokenValidation = validateToken();
    if (!tokenValidation.valid) {
      spinner.fail(tokenValidation.error);
      return;
    }

    const repo = detectRepo();
    if (!repo) {
      spinner.fail('Could not detect GitHub repository');
      return;
    }

    const integration = createIntegration(repo);
    await integration.triggerPipeline('taskflow.yml', options.branch);
    const runId = 'pending';

    spinner.succeed(chalk.green(`Pipeline triggered: ${runId}`));
  } catch (error) {
    spinner.fail(`Failed to trigger: ${error instanceof Error ? error.message : String(error)}`);
  }
}
