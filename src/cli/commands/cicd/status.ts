/**
 * CI/CD status 命令
 */

import chalk from 'chalk';
import ora from 'ora';
import { createIntegration, validateToken, detectRepo } from './engine';

/**
 * 执行 status 命令
 */
export async function executeStatus(runId: string): Promise<void> {
  const spinner = ora('Fetching pipeline status...').start();

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
    const status = await integration.getPipelineStatus(runId);

    spinner.stop();

    const statusColor = {
      'pending': chalk.yellow,
      'running': chalk.blue,
      'success': chalk.green,
      'failure': chalk.red,
      'cancelled': chalk.gray,
      'skipped': chalk.gray
    }[status.status] || chalk.white;

    console.log(chalk.blue('\nPipeline Status\n'));
    console.log(`  Status: ${statusColor(status.status.toUpperCase())}`);
    console.log(`  Started: ${status.startedAt.toLocaleString()}`);
    if (status.finishedAt) {
      console.log(`  Finished: ${status.finishedAt.toLocaleString()}`);
    }
    if (status.duration) {
      console.log(`  Duration: ${(status.duration / 1000).toFixed(1)}s`);
    }
    if (status.url) {
      console.log(`  URL: ${chalk.underline(status.url)}`);
    }
    console.log();

  } catch (error) {
    spinner.fail(`Failed to get status: ${error instanceof Error ? error.message : String(error)}`);
  }
}
