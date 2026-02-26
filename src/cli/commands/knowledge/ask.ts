/**
 * Knowledge ask 命令
 */

import chalk from 'chalk';
import ora from 'ora';
import { createEngine, isInitialized } from './engine';

interface AskOptions {
  topK: string;
}

/**
 * 执行 ask 命令
 */
export async function executeAsk(question: string, options: AskOptions): Promise<void> {
  const spinner = ora('Thinking...').start();

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
    const answerResult = await engine.answer(question, {
      topK: parseInt(options.topK)
    });

    spinner.stop();

    console.log(chalk.blue('\nAnswer:'));
    console.log(answerResult.answer);
    console.log();

    if (answerResult.sources.length > 0) {
      console.log(chalk.blue('Sources:'));
      answerResult.sources.forEach((source, i) => {
        console.log(`  ${i + 1}. ${source.title} ${chalk.yellow(`(${source.score.toFixed(3)})`)}`);
      });
    }

    console.log();
    console.log(chalk.gray(`Confidence: ${(answerResult.confidence * 100).toFixed(1)}% | Latency: ${answerResult.latency}ms`));

  } catch (error) {
    spinner.fail(`Failed to get answer: ${error instanceof Error ? error.message : String(error)}`);
  }
}
