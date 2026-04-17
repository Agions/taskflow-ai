/**
 * Crew 多 Agent 协作命令
 * taskflow crew list|run|create|templates
 */

import { Command } from 'commander';
import { executeList } from './list';
import { executeRun } from './run';
import { executeCreate } from './create';
import { executeTemplates } from './templates';

const program = new Command('crew');

program
  .name('crew')
  .description('多 Agent 协作系统 - Workflow-First Agent System')
  .version('2.2.0');

program
  .command('list')
  .description('列出所有可用的 Workflow 模板')
  .option('-v, --verbose', '显示详细信息')
  .action(executeList);

program
  .command('run')
  .description('运行 Workflow')
  .argument('<template>', '模板名称 (prd-to-code|code-review)')
  .option('-i, --input <json>', '初始上下文 (JSON 格式)')
  .option('-p, --prd <file>', 'PRD 文件路径')
  .option('-v, --verbose', '详细输出')
  .action(executeRun);

program
  .command('create')
  .description('从模板创建 Workflow')
  .argument('<name>', 'Workflow 名称')
  .option('-t, --template <template>', '模板名称', 'prd-to-code')
  .option('-o, --output <file>', '输出文件路径')
  .action(executeCreate);

program
  .command('templates')
  .description('显示所有内置模板')
  .action(executeTemplates);

export default program;
export const crewCommand = program;
