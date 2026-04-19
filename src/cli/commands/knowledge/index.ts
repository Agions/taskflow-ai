/**
 * Knowledge CLI 命令
 * RAG 知识库管理
 */

import { Command } from 'commander';
import { executeInit } from './init';
import { executeIndex } from './index-cmd';
import { executeQuery } from './query';
import { executeAsk } from './ask';
import { executeStats } from './stats';
import { executeClear } from './clear';

export const knowledgeCommand = new Command('knowledge')
  .description('RAG Knowledge Base - manage and query knowledge')
  .alias('kb');

knowledgeCommand
  .command('init')
  .description('Initialize knowledge base')
  .option('-m, --model <model>', 'Embedding model', 'text-embedding-3-small')
  .option('-d, --dimensions <n>', 'Embedding dimensions', '1536')
  .option('--store <store>', 'Vector store type', 'lancedb')
  .action(executeInit);

knowledgeCommand
  .command('index')
  .description('Index documents into knowledge base')
  .argument('<path>', 'Path to document or directory')
  .option('-r, --recursive', 'Index recursively', true)
  .option('-w, --watch', 'Watch for changes')
  .action(executeIndex);

knowledgeCommand
  .command('query')
  .description('Query knowledge base')
  .argument('<query>', 'Query string')
  .option('-k, --top-k <n>', 'Number of results', '5')
  .option('-t, --threshold <n>', 'Similarity threshold', '0.6')
  .option('--no-rerank', 'Disable reranking')
  .action(executeQuery);

knowledgeCommand
  .command('ask')
  .description('Ask a question using knowledge base')
  .argument('<question>', 'Question to ask')
  .option('-k, --top-k <n>', 'Number of sources', '5')
  .action(executeAsk);

knowledgeCommand
  .command('stats')
  .description('Show knowledge base statistics')
  .action(executeStats);

knowledgeCommand
  .command('clear')
  .description('Clear knowledge base')
  .option('-f, --force', 'Force clear without confirmation')
  .action(executeClear);

export default knowledgeCommand;
