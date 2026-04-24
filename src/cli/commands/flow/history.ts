/**
 * Flow history 命令
 */

import chalk = require('chalk');
import { getEngine } from './engine';

interface HistoryOptions {
  workflow?: string;
}

/**
 * 执行 history 命令
 */
export async function executeHistory(options: HistoryOptions): Promise<void> {
  const executions = getEngine().listExecutions();

  if (executions.length === 0) {
    console.log(chalk.yellow('暂无执行历史'));
    return;
  }

  console.log(chalk.bold('\n📜 执行历史:\n'));

  for (const exec of executions.slice(-10).reverse()) {
    const statusColor =
      exec.status === 'completed'
        ? chalk.green
        : exec.status === 'failed'
          ? chalk.red
          : chalk.yellow;

    console.log(`  ${chalk.cyan(exec.id)}`);
    console.log(`    状态: ${statusColor(exec.status)}`);
    console.log(`    开始: ${new Date(exec.startedAt).toLocaleString()}`);
    if (exec.finishedAt) {
      console.log(`    耗时: ${exec.finishedAt - exec.startedAt}ms`);
    }
    if (exec.error) {
      console.log(`    ${chalk.red('错误: ' + exec.error)}`);
    }
    console.log();
  }
}
