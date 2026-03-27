/**
 * CI/CD CLI 命令
 * CI/CD 流水线管理
 */

import { Command } from 'commander';
import { executeInit } from './init';
import { executeDeploy } from './deploy';
import { executeTemplate } from './template';
import { executeValidate } from './validate';
import { executeStatus } from './status';
import { executeTrigger } from './trigger';
import { executeReport } from './report';

export const cicdCommand = new Command('cicd')
  .description('CI/CD Pipeline Integration - manage deployment workflows')
  .alias('ci');

cicdCommand
  .command('init')
  .description('Initialize CI/CD configuration')
  .option('-p, --provider <provider>', 'CI provider (github|gitlab|jenkins)', 'github')
  .option('-r, --repo <repo>', 'Repository (owner/repo)')
  .action(executeInit);

cicdCommand
  .command('deploy')
  .description('Deploy CI/CD workflow')
  .option('-c, --config <path>', 'Configuration file path')
  .action(executeDeploy);

cicdCommand
  .command('template')
  .description('List available workflow templates')
  .option('-p, --provider <provider>', 'CI provider', 'github')
  .action(executeTemplate);

cicdCommand
  .command('validate')
  .description('Validate CI/CD configuration')
  .option('-c, --config <path>', 'Configuration file path')
  .action(executeValidate);

cicdCommand
  .command('status')
  .description('Get pipeline status')
  .argument('<run-id>', 'Pipeline run ID')
  .action(executeStatus);

cicdCommand
  .command('trigger')
  .description('Trigger pipeline manually')
  .option('-b, --branch <branch>', 'Branch to trigger', 'main')
  .action(executeTrigger);

cicdCommand
  .command('report')
  .description('Get build report')
  .argument('<run-id>', 'Pipeline run ID')
  .action(executeReport);

export default cicdCommand;
