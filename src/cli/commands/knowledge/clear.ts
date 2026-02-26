/**
 * Knowledge clear 命令
 */

import chalk from 'chalk';
import ora from 'ora';
import { createVectorStore, isInitialized } from './engine';

interface ClearOptions {
  force: boolean;
}

/**
 * 执行 clear 命令
 */
export async function executeClear(options: ClearOptions): Promise<void> {
  if (!options.force) {
    console.log(chalk.yellow('This will delete all indexed documents. Use --force to confirm.'));
    return;
  }

  const spinner = ora('Clearing knowledge base...').start();

  try {
    if (!(await isInitialized())) {
      spinner.fail('Knowledge base not initialized.');
      return;
    }

    const result = await createVectorStore();
    if (!result) {
      spinner.fail('Failed to initialize vector store');
      return;
    }

    const { vectorStore } = result;
    await vectorStore.clear();

    spinner.succeed(chalk.green('Knowledge base cleared'));

  } catch (error) {
    spinner.fail(`Failed to clear: ${error instanceof Error ? error.message : String(error)}`);
  }
}
