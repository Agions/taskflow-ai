import { getLogger } from '../../../utils/logger';
/**
 * Init命令 - 初始化TaskFlow项目
 */

import { Command } from 'commander';
import chalk = require('chalk');
import { runInit } from './runner';
const logger = getLogger('cli/commands/init/index');

export function initCommand(program: Command) {
  program
    .command('init')
    .description('初始化TaskFlow项目')
    .option('-f, --force', '强制覆盖现有配置')
    .option('--skip-ai', '跳过AI模型配置')
    .option('--template <name>', '使用预定义模板')
    .action(async options => {
      try {
        await runInit(options);
      } catch (error) {
        logger.error(chalk.red('初始化失败:'), error);
        process.exit(1);
      }
    });
}

export * from './project';
export * from './ai-models';
export * from './structure';
export * from './output';
export * from './runner';
