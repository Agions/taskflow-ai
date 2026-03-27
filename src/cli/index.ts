#!/usr/bin/env node

/**
 * TaskFlow AI - 智能PRD文档解析与任务管理助手
 * 支持多模型AI协同、MCP编辑器集成，专为开发团队设计的CLI工具
 */

import { Command } from 'commander';
import packageJson from '../../package.json';

import { ui, showLogo, showSimpleLogo } from './ui';
import { initCommand } from './commands/init';
import { parseCommand } from './commands/parse';
import { statusCommand } from './commands/status';
import { visualizeCommand } from './commands/visualize';
import { mcpCommand } from './commands/mcp';
import { configCommand } from './commands/config';
import { agentCommand } from './commands/agent';
import { marketplaceCommand } from './commands/marketplace';
import { knowledgeCommand } from './commands/knowledge';
import { cicdCommand } from './commands/cicd';

const program = new Command();

program
  .name('taskflow')
  .description('TaskFlow AI - 智能PRD文档解析与任务管理助手')
  .version(packageJson.version, '-v, --version', '显示版本号')
  .option('--verbose', '显示详细输出')
  .option('--debug', '启用调试模式')
  .hook('preAction', thisCommand => {
    if (thisCommand.opts().debug) {
      process.env.DEBUG = 'taskflow:*';
    }
  });

// 注册命令
initCommand(program);
parseCommand(program);
statusCommand(program);
visualizeCommand(program);
mcpCommand(program);
configCommand(program);
program.addCommand(agentCommand);
program.addCommand(marketplaceCommand);
program.addCommand(knowledgeCommand);
program.addCommand(cicdCommand);

// 自定义帮助信息
program.on('--help', () => {
  const helpDisplay = ui.createHelpDisplay();

  // 注册所有命令
  helpDisplay.register({
    name: 'init',
    description: '初始化新项目',
    category: '项目',
    emoji: ui.emojis.rocket,
    usage: 'taskflow init [name]',
    examples: ['taskflow init my-project', 'taskflow init --template typescript'],
  });

  helpDisplay.register({
    name: 'status',
    description: '查看项目状态',
    category: '项目',
    emoji: ui.emojis.chart,
    usage: 'taskflow status',
    examples: ['taskflow status', 'taskflow status --watch'],
  });

  helpDisplay.register({
    name: 'parse',
    description: '解析 PRD 文档',
    category: 'AI',
    emoji: ui.emojis.ai,
    usage: 'taskflow parse <file>',
    examples: ['taskflow parse document.md', 'taskflow parse --output json'],
  });

  helpDisplay.register({
    name: 'mcp',
    description: 'MCP 服务器管理',
    category: 'MCP',
    emoji: ui.emojis.gear,
    usage: 'taskflow mcp <command>',
    examples: ['taskflow mcp start', 'taskflow mcp stop'],
  });

  helpDisplay.register({
    name: 'config',
    description: '配置管理',
    category: '配置',
    emoji: ui.emojis.config,
    usage: 'taskflow config <command>',
    examples: ['taskflow config set', 'taskflow config get'],
  });

  helpDisplay.register({
    name: 'agent',
    description: 'Agent 管理',
    category: 'AI',
    emoji: ui.emojis.robot,
    usage: 'taskflow agent <command>',
    examples: ['taskflow agent start', 'taskflow agent status'],
  });

  helpDisplay.register({
    name: 'visualize',
    description: '可视化思维链',
    category: 'AI',
    emoji: ui.emojis.bulb,
    usage: 'taskflow visualize',
    examples: ['taskflow visualize', 'taskflow visualize --format mermaid'],
  });

  helpDisplay.showMainHelp('TaskFlow', packageJson.version, '智能PRD文档解析与任务管理助手');
  helpDisplay.showGlobalOptions();
  helpDisplay.showTips();
});

// 未知命令处理
program.on('command:*', operands => {
  ui.error('未知命令', `命令 "${operands[0]}" 不存在`, '使用 "taskflow --help" 查看可用命令');
  process.exit(1);
});

// 主函数
async function main() {
  try {
    // 无参数时显示 Logo 和帮助
    if (process.argv.length === 2) {
      await showLogo();
      program.help();
    } else {
      await program.parseAsync();
    }
  } catch (error) {
    ui.error('执行错误', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// 错误处理
process.on('uncaughtException', error => {
  ui.error('未捕获的异常', error.message);
  process.exit(1);
});

process.on('unhandledRejection', reason => {
  ui.error('未处理的Promise拒绝', String(reason));
  process.exit(1);
});

// 运行主程序 - 支持直接运行和 require 两种方式
main();

export default program;
