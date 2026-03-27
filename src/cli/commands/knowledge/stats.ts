/**
 * Knowledge stats 命令
 */

import chalk from 'chalk';
import ora from 'ora';
import { createEngine, isInitialized } from './engine';

/**
 * 执行 stats 命令
 */
export async function executeStats(): Promise<void> {
  const spinner = ora('Loading statistics...').start();

  try {
    if (!(await isInitialized())) {
      spinner.fail('Knowledge base not initialized. Run "taskflow knowledge init" first.');
      return;
    }

    const result = await createEngine();
    if (!result) {
      spinner.fail('Failed to initialize engine');
      return;
    }

    const { engine } = result;
    const stats = await engine.getStats();

    spinner.stop();

    console.log(chalk.blue('\nKnowledge Base Statistics\n'));
    console.log(`  Documents: ${chalk.bold(stats.documents)}`);
    console.log(`  Chunks: ${chalk.bold(stats.chunks)}`);
    console.log(`  Size: ${chalk.bold((stats.size / 1024 / 1024).toFixed(2))} MB`);
    console.log(`  Queries: ${chalk.bold(stats.queries)}`);
    console.log(`  Avg Latency: ${chalk.bold(stats.avgLatency)}ms`);

    if (stats.topTags.length > 0) {
      console.log(`\n  Top Tags: ${stats.topTags.join(', ')}`);
    }

    if (Object.keys(stats.documentTypes).length > 0) {
      console.log(chalk.blue('\n  Document Types:'));
      for (const [type, count] of Object.entries(stats.documentTypes)) {
        console.log(`    ${type}: ${count}`);
      }
    }

    console.log();
  } catch (error) {
    spinner.fail(
      `Failed to get statistics: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
