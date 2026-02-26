/**
 * Knowledge CLI 命令
 * RAG 知识库管理
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as path from 'path';
import { EmbeddingManager } from '../../knowledge/embedding';
import { VectorStoreManager } from '../../knowledge/storage';
import { KnowledgeRetrievalEngine } from '../../knowledge/retrieval';
import { KnowledgeBaseConfig } from '../../knowledge/types';

export const knowledgeCommand = new Command('knowledge')
  .description('RAG Knowledge Base - manage and query knowledge')
  .alias('kb');

// 初始化命令
knowledgeCommand
  .command('init')
  .description('Initialize knowledge base')
  .option('-m, --model <model>', 'Embedding model', 'text-embedding-3-small')
  .option('-d, --dimensions <n>', 'Embedding dimensions', '1536')
  .option('--store <store>', 'Vector store type', 'lancedb')
  .action(async (options) => {
    const spinner = ora('Initializing knowledge base...').start();

    try {
      const config: KnowledgeBaseConfig = {
        embeddingModel: {
          name: options.model,
          provider: 'openai',
          dimensions: parseInt(options.dimensions),
          maxTokens: 8192,
          batchSize: 100
        },
        vectorStore: {
          name: 'default',
          type: options.store,
          connection: {
            path: path.join(process.cwd(), '.taskflow', 'knowledge'),
            collection: 'documents'
          }
        },
        chunkSize: 1000,
        chunkOverlap: 200,
        indexName: 'default',
        autoIndex: true
      };

      // 保存配置
      const configPath = path.join(process.cwd(), '.taskflow', 'knowledge-config.json');
      await require('fs-extra').writeJson(configPath, config, { spaces: 2 });

      // 初始化引擎
      const embeddingManager = new EmbeddingManager(config.embeddingModel);
      const vectorStore = new VectorStoreManager(
        config.vectorStore,
        embeddingManager
      );
      const engine = new KnowledgeRetrievalEngine(
        embeddingManager,
        vectorStore,
        config.chunkSize,
        config.chunkOverlap
      );

      await engine.initialize();

      spinner.succeed(chalk.green('Knowledge base initialized'));
      console.log(chalk.blue(`\nConfiguration saved to: ${configPath}`));
      console.log(chalk.gray(`Embedding model: ${config.embeddingModel.name}`));
      console.log(chalk.gray(`Vector store: ${config.vectorStore.type}`));

    } catch (error) {
      spinner.fail(`Initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

// 索引命令
knowledgeCommand
  .command('index')
  .description('Index documents into knowledge base')
  .argument('<path>', 'Path to document or directory')
  .option('-r, --recursive', 'Index recursively', true)
  .option('-w, --watch', 'Watch for changes')
  .action(async (docPath, options) => {
    const spinner = ora('Indexing documents...').start();

    try {
      // 加载配置
      const configPath = path.join(process.cwd(), '.taskflow', 'knowledge-config.json');
      const fs = require('fs-extra');

      if (!await fs.pathExists(configPath)) {
        spinner.fail('Knowledge base not initialized. Run "taskflow knowledge init" first.');
        return;
      }

      const config: KnowledgeBaseConfig = await fs.readJson(configPath);

      // 初始化引擎
      const embeddingManager = new EmbeddingManager(config.embeddingModel);
      const vectorStore = new VectorStoreManager(
        config.vectorStore,
        embeddingManager
      );
      const engine = new KnowledgeRetrievalEngine(
        embeddingManager,
        vectorStore,
        config.chunkSize,
        config.chunkOverlap
      );

      await engine.initialize();

      // 索引文档
      const resolvedPath = path.resolve(docPath);
      const stats = await fs.stat(resolvedPath);

      if (stats.isDirectory()) {
        const result = await engine.indexDirectory(resolvedPath);
        spinner.succeed(chalk.green(`Indexed ${result.indexed} documents (${result.failed} failed)`));
      } else {
        const doc = {
          id: `doc-${Date.now()}`,
          content: await fs.readFile(resolvedPath, 'utf-8'),
          metadata: {
            title: path.basename(resolvedPath),
            source: resolvedPath,
            type: 'markdown' as const,
            tags: []
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await engine.indexDocument(doc);
        spinner.succeed(chalk.green('Document indexed'));
      }

    } catch (error) {
      spinner.fail(`Indexing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

// 查询命令
knowledgeCommand
  .command('query')
  .description('Query knowledge base')
  .argument('<query>', 'Query string')
  .option('-k, --top-k <n>', 'Number of results', '5')
  .option('-t, --threshold <n>', 'Similarity threshold', '0.6')
  .option('--no-rerank', 'Disable reranking')
  .action(async (query, options) => {
    const spinner = ora('Querying knowledge base...').start();

    try {
      // 加载配置
      const configPath = path.join(process.cwd(), '.taskflow', 'knowledge-config.json');
      const fs = require('fs-extra');

      if (!await fs.pathExists(configPath)) {
        spinner.fail('Knowledge base not initialized. Run "taskflow knowledge init" first.');
        return;
      }

      const config: KnowledgeBaseConfig = await fs.readJson(configPath);

      // 初始化引擎
      const embeddingManager = new EmbeddingManager(config.embeddingModel);
      const vectorStore = new VectorStoreManager(
        config.vectorStore,
        embeddingManager
      );
      const engine = new KnowledgeRetrievalEngine(
        embeddingManager,
        vectorStore,
        config.chunkSize,
        config.chunkOverlap
      );

      await engine.initialize();

      // 执行查询
      const result = await engine.retrieve(query, {
        topK: parseInt(options.topK),
        threshold: parseFloat(options.threshold),
        rerank: options.rerank
      });

      spinner.stop();

      if (result.chunks.length === 0) {
        console.log(chalk.yellow('No relevant documents found'));
        return;
      }

      console.log(chalk.blue(`\nFound ${result.chunks.length} relevant documents (${result.latency}ms):\n`));

      for (let i = 0; i < result.chunks.length; i++) {
        const chunk = result.chunks[i];
        console.log(`${chalk.bold(`${i + 1}. ${(chunk.chunk.metadata as any).title}`)} ${chalk.yellow(`(${chunk.score.toFixed(3)})`)}`);
        console.log(chalk.gray(chunk.chunk.content.slice(0, 200) + '...'));
        console.log();
      }

    } catch (error) {
      spinner.fail(`Query failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

// 问答命令
knowledgeCommand
  .command('ask')
  .description('Ask a question using knowledge base')
  .argument('<question>', 'Question to ask')
  .option('-k, --top-k <n>', 'Number of sources', '5')
  .action(async (question, options) => {
    const spinner = ora('Thinking...').start();

    try {
      // 加载配置
      const configPath = path.join(process.cwd(), '.taskflow', 'knowledge-config.json');
      const fs = require('fs-extra');

      if (!await fs.pathExists(configPath)) {
        spinner.fail('Knowledge base not initialized. Run "taskflow knowledge init" first.');
        return;
      }

      const config: KnowledgeBaseConfig = await fs.readJson(configPath);

      // 初始化引擎
      const embeddingManager = new EmbeddingManager(config.embeddingModel);
      const vectorStore = new VectorStoreManager(
        config.vectorStore,
        embeddingManager
      );
      const engine = new KnowledgeRetrievalEngine(
        embeddingManager,
        vectorStore,
        config.chunkSize,
        config.chunkOverlap
      );

      await engine.initialize();

      // 获取答案
      const result = await engine.answer(question, {
        topK: parseInt(options.topK)
      });

      spinner.stop();

      console.log(chalk.blue('\nAnswer:'));
      console.log(result.answer);
      console.log();

      if (result.sources.length > 0) {
        console.log(chalk.blue('Sources:'));
        result.sources.forEach((source, i) => {
          console.log(`  ${i + 1}. ${source.title} ${chalk.yellow(`(${source.score.toFixed(3)})`)}`);
        });
      }

      console.log();
      console.log(chalk.gray(`Confidence: ${(result.confidence * 100).toFixed(1)}% | Latency: ${result.latency}ms`));

    } catch (error) {
      spinner.fail(`Failed to get answer: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

// 统计命令
knowledgeCommand
  .command('stats')
  .description('Show knowledge base statistics')
  .action(async () => {
    const spinner = ora('Loading statistics...').start();

    try {
      // 加载配置
      const configPath = path.join(process.cwd(), '.taskflow', 'knowledge-config.json');
      const fs = require('fs-extra');

      if (!await fs.pathExists(configPath)) {
        spinner.fail('Knowledge base not initialized. Run "taskflow knowledge init" first.');
        return;
      }

      const config: KnowledgeBaseConfig = await fs.readJson(configPath);

      // 初始化引擎
      const embeddingManager = new EmbeddingManager(config.embeddingModel);
      const vectorStore = new VectorStoreManager(
        config.vectorStore,
        embeddingManager
      );
      const engine = new KnowledgeRetrievalEngine(
        embeddingManager,
        vectorStore,
        config.chunkSize,
        config.chunkOverlap
      );

      await engine.initialize();

      // 获取统计
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
      spinner.fail(`Failed to get statistics: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

// 清除命令
knowledgeCommand
  .command('clear')
  .description('Clear knowledge base')
  .option('-f, --force', 'Force clear without confirmation')
  .action(async (options) => {
    if (!options.force) {
      console.log(chalk.yellow('This will delete all indexed documents. Use --force to confirm.'));
      return;
    }

    const spinner = ora('Clearing knowledge base...').start();

    try {
      // 加载配置
      const configPath = path.join(process.cwd(), '.taskflow', 'knowledge-config.json');
      const fs = require('fs-extra');

      if (!await fs.pathExists(configPath)) {
        spinner.fail('Knowledge base not initialized.');
        return;
      }

      const config: KnowledgeBaseConfig = await fs.readJson(configPath);

      // 初始化引擎
      const embeddingManager = new EmbeddingManager(config.embeddingModel);
      const vectorStore = new VectorStoreManager(
        config.vectorStore,
        embeddingManager
      );

      await vectorStore.initialize();
      await vectorStore.clear();

      spinner.succeed(chalk.green('Knowledge base cleared'));

    } catch (error) {
      spinner.fail(`Failed to clear: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

export default knowledgeCommand;
