/**
 * CI/CD status 命令
 */

import chalk = require('chalk');
import ora = require('ora');
import { createIntegration, validateToken, detectRepo } from './engine';
import { BuildReport } from '../../../cicd/types';

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
    const report = (await integration.getPipelineStatus(runId)) as BuildReport;

    spinner.stop();

    const statusColor =
      {
        pending: chalk.yellow,
        running: chalk.blue,
        success: chalk.green,
        failure: chalk.red,
        cancelled: chalk.gray,
        skipped: chalk.gray,
      }[report.status] || chalk.white;

    console.log(chalk.blue('\nPipeline Status\n'));
    console.log(`  Status: ${statusColor(report.status.toUpperCase())}`);

    // BuildReport 使用 stages 数组来获取时间信息
    const firstStage = report.stages[0];
    const lastStage = report.stages[report.stages.length - 1];

    if (firstStage) {
      console.log(
        `  Started: ${new Date(Date.now() - firstStage.duration * 1000).toLocaleString()}`
      );
    }
    if (lastStage && lastStage.status !== 'running') {
      console.log(`  Finished: ${new Date().toLocaleString()}`);
    }
    if (report.summary.totalDuration) {
      console.log(`  Duration: ${report.summary.totalDuration.toFixed(1)}s`);
    }
    console.log(
      `  Stages: ${report.summary.successfulStages}/${report.summary.totalStages} successful`
    );
    console.log();
  } catch (error) {
    spinner.fail(`Failed to get status: ${error instanceof Error ? error.message : String(error)}`);
  }
}
