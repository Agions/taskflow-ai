/**
 * CI/CD report 命令
 */

import chalk = require('chalk');
import ora = require('ora');
import { createIntegration, validateToken, detectRepo } from './engine';

/**
 * 执行 report 命令
 */
export async function executeReport(runId: string): Promise<void> {
  const spinner = ora('Fetching build report...').start();

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
    const report = await integration.getPipelineStatus(runId);

    spinner.stop();

    console.log(chalk.blue('\nBuild Report\n'));
    console.log(`Status: ${report.status.toUpperCase()}`);
    console.log(
      `Stages: ${report.summary.successfulStages}/${report.summary.totalStages} successful`
    );
    console.log(`Duration: ${(report.summary.totalDuration / 1000).toFixed(1)}s`);

    if (report.stages.length > 0) {
      console.log(chalk.blue('\nStages:'));
      for (const stage of report.stages) {
        const statusColor = stage.status === 'success' ? chalk.green : chalk.red;
        console.log(`  ${statusColor('●')} ${stage.name} (${(stage.duration / 1000).toFixed(1)}s)`);
      }
    }

    console.log();
  } catch (error) {
    spinner.fail(`Failed to get report: ${error instanceof Error ? error.message : String(error)}`);
  }
}
