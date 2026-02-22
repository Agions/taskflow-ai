#!/usr/bin/env node

/**
 * TaskFlow AI - 智能PRD文档解析与任务管理助手
 * 支持多模型AI协同、MCP编辑器集成，专为开发团队设计的CLI工具
 */

import { Command } from 'commander';
import chalk from 'chalk';
import boxen from 'boxen';
import packageJson from '../../package.json';

// 导入命令模块
import { initCommand } from './commands/init';
import { parseCommand } from './commands/parse';
import { statusCommand } from './commands/status';
import { visualizeCommand } from './commands/visualize';
import { mcpCommand } from './commands/mcp';
import { configCommand } from './commands/config';
import { modelCommand } from './commands/model';
import { thinkCommand } from './commands/think';
import { flowCommand } from './commands/flow';
import { pluginCommand } from './commands/plugin';
import { templateCommand } from './commands/template';
import { agentCommand } from './commands/agent';
import { statsCommand } from './commands/stats';
import { doctorCommand } from './commands/doctor';
import { upgradeCommand } from './commands/upgrade';

const program = new Command();

// 显示启动Logo
function showLogo() {
  console.log(chalk.cyan.bold('TaskFlow AI'));

  console.log(
    boxen(
      chalk.white.bold('智能PRD文档解析与任务管理助手\n') +
        chalk.gray('支持多模型AI协同、MCP编辑器集成\n') +
        chalk.blue(`版本: ${packageJson.version}`),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
      }
    )
  );
}

// 配置主命令
program
  .name('taskflow')
  .description('TaskFlow AI - 智能PRD文档解析与任务管理助手')
  .version(packageJson.version)
  .option('-v, --verbose', '显示详细输出')
  .option('--debug', '启用调试模式')
  .hook('preAction', thisCommand => {
    if (thisCommand.opts().debug) {
      process.env.DEBUG = 'taskflow:*';
    }
  });

// 注册所有命令
initCommand(program);
parseCommand(program);
statusCommand(program);
visualizeCommand(program);
mcpCommand(program);
configCommand(program);
modelCommand(program);
thinkCommand(program);
flowCommand(program);
pluginCommand(program);
templateCommand(program);
agentCommand(program);
statsCommand(program);
doctorCommand(program);
upgradeCommand(program);

// 添加帮助信息
program.on('--help', () => {
  console.log('\n' + chalk.cyan('示例用法:'));
  console.log('  $ taskflow init');
  console.log('  $ taskflow status');
  console.log('  $ taskflow parse document.md');
  console.log('  $ taskflow mcp start');
  console.log('  $ taskflow model list');
  console.log('  $ taskflow model route "帮我写个函数"');
  console.log('  $ taskflow think "帮我分析这个需求"');
  console.log('  $ taskflow think --visualize');
  console.log('\n' + chalk.cyan('更多信息:'));
  console.log('  文档: https://github.com/Agions/taskflow-ai');
  console.log('  问题反馈: https://github.com/Agions/taskflow-ai/issues');
});

// 处理未知命令
program.on('command:*', operands => {
  console.error(chalk.red(`未知命令: ${operands[0]}`));
  console.log(chalk.yellow('使用 "taskflow --help" 查看可用命令'));
  process.exit(1);
});

// 主执行逻辑
async function main() {
  try {
    // 如果没有参数，显示Logo和帮助
    if (process.argv.length === 2) {
      showLogo();
      program.help();
    } else {
      await program.parseAsync();
    }
  } catch (error) {
    console.error(chalk.red('执行错误:'), error);
    process.exit(1);
  }
}

// 错误处理
process.on('uncaughtException', error => {
  console.error(chalk.red('未捕获的异常:'), error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('未处理的Promise拒绝:'), reason);
  process.exit(1);
});

if (require.main === module) {
  main();
}

export default program;
