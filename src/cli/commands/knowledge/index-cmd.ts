/**
 * Knowledge index 命令
 */

import path = require('path');
import fs = require('fs-extra');
import chalk = require('chalk');
import ora = require('ora');
import { createEngine, isInitialized } from './engine';

interface IndexOptions {
  recursive: boolean;
  watch: boolean;
}

/**
 * 执行 index 命令
 */
export async function executeIndex(docPath: string, options: IndexOptions): Promise<void> {
  const spinner = ora('Indexing documents...').start();

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
    const resolvedPath = path.resolve(docPath);
    const stats = await fs.stat(resolvedPath);

    if (stats.isDirectory()) {
      const indexResult = await engine.indexDirectory(resolvedPath);
      spinner.succeed(
        chalk.green(`Indexed ${indexResult.indexed} documents (${indexResult.failed} failed)`)
      );
    } else {
      const doc = {
        id: `doc-${Date.now()}`,
        content: await fs.readFile(resolvedPath, 'utf-8'),
        metadata: {
          title: path.basename(resolvedPath),
          source: resolvedPath,
          type: 'markdown' as const,
          tags: [],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await engine.indexDocument(doc);
      spinner.succeed(chalk.green('Document indexed'));
    }
  } catch (error) {
    spinner.fail(`Indexing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
