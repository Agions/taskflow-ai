/**
 * Knowledge init 命令
 */

import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { KnowledgeBaseConfig } from '../../../knowledge/types';
import { saveConfig, createEngine } from './engine';

interface InitOptions {
  model: string;
  dimensions: string;
  store: string;
}

/**
 * 执行 init 命令
 */
export async function executeInit(options: InitOptions): Promise<void> {
  const spinner = ora('Initializing knowledge base...').start();

  try {
    const config: KnowledgeBaseConfig = {
      embeddingModel: {
        name: options.model,
        provider: 'openai',
        dimensions: parseInt(options.dimensions),
        maxTokens: 8192,
        batchSize: 100,
      },
      vectorStore: {
        name: 'default',
        type: options.store as 'lancedb' | 'chroma' | 'pinecone' | 'weaviate' | 'qdrant',
        connection: {
          path: path.join(process.cwd(), '.taskflow', 'knowledge'),
          collection: 'documents',
        },
      },
      chunkSize: 1000,
      chunkOverlap: 200,
      indexName: 'default',
      autoIndex: true,
    };

    await saveConfig(config);

    const result = await createEngine();
    if (!result) {
      spinner.fail('Failed to initialize engine');
      return;
    }

    spinner.succeed(chalk.green('Knowledge base initialized'));
    console.log(chalk.blue(`\nConfiguration saved`));
    console.log(chalk.gray(`Embedding model: ${config.embeddingModel.name}`));
    console.log(chalk.gray(`Vector store: ${config.vectorStore.type}`));
  } catch (error) {
    spinner.fail(
      `Initialization failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
