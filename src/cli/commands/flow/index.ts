/**
 * 工作流命令
 * taskflow flow list|run|create|pause|resume
 */

import { Command } from 'commander';
import { executeList } from './list';
import { executeRun } from './run';
import { executeCreate } from './create';
import { executeHistory } from './history';
import { executePause, executeResume } from './control';

const program = new Command('flow');

program
  .command('list')
  .description('列出所有工作流')
  .option('-d, --dir <dir>', '工作流目录', './workflows')
  .action(executeList);

program
  .command('run')
  .description('运行工作流')
  .argument('<name>', '工作流名称')
  .option('-d, --dir <dir>', '工作流目录', './workflows')
  .option('-i, --input <json>', '输入变量 (JSON 格式)')
  .option('-f, --format <format>', '格式 (json|yaml)', 'json')
  .action(executeRun);

program
  .command('create')
  .description('创建新工作流')
  .argument('<name>', '工作流名称')
  .option('-d, --dir <dir>', '工作流目录', './workflows')
  .option('-t, --template <template>', '模板 (basic|prd-to-code|ci-cd)', 'basic')
  .action(executeCreate);

program
  .command('history')
  .description('查看执行历史')
  .option('-w, --workflow <name>', '工作流名称')
  .action(executeHistory);

program
  .command('pause')
  .description('暂停工作流执行')
  .argument('<executionId>', '执行 ID')
  .action(executePause);

program
  .command('resume')
  .description('恢复工作流执行')
  .argument('<executionId>', '执行 ID')
  .action(executeResume);

export default program;
export const flowCommand = program;
