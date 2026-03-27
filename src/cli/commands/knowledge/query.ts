/**
 * Knowledge query 命令
 */

import chalk from 'chalk';
import ora from 'ora';
import { createEngine, isInitialized } from './engine';

interface QueryOptions {
  topK: string;
  threshold: string;
  rerank: boolean;
}

/**
 * 执行 query 命令
 */
export async function executeQuery(query: string, options: QueryOptions): Promise<void> {
  const spinner = ora('Querying knowledge base...').start();

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
    const searchResult = await engine.retrieve(query, {
      topK: parseInt(options.topK),
      threshold: parseFloat(options.threshold),
      rerank: options.rerank,
    });

    spinner.stop();

    if (searchResult.chunks.length === 0) {
      console.log(chalk.yellow('No relevant documents found'));
      return;
    }

    console.log(
      chalk.blue(
        `\nFound ${searchResult.chunks.length} relevant documents (${searchResult.latency}ms):\n`
      )
    );

    for (let i = 0; i < searchResult.chunks.length; i++) {
      const chunk = searchResult.chunks[i];
      console.log(
        `${chalk.bold(`${i + 1}. ${(chunk.chunk.metadata as any).title}`)} ${chalk.yellow(`(${chunk.score.toFixed(3)})`)}`
      );
      console.log(chalk.gray(chunk.chunk.content.slice(0, 200) + '...'));
      console.log();
    }
  } catch (error) {
    spinner.fail(`Query failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
