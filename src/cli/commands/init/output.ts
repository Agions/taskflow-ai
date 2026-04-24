/**
 * 初始化输出
 */

import chalk from 'chalk';
import path from 'path';
import { TaskFlowConfig } from '../../../types';
import { CONFIG_DIR } from '../../../constants';

/**
 * 显示下一步操作
 */
export function showNextSteps(config: TaskFlowConfig): void {
  console.log(chalk.cyan('\n🎉 项目初始化完成！\n'));

  console.log(chalk.white('接下来您可以:'));
  console.log(chalk.gray('  1. 编辑示例PRD文档: docs/example-prd.md'));
  console.log(chalk.gray('  2. 解析PRD文档: ') + chalk.blue('taskflow parse docs/example-prd.md'));
  console.log(chalk.gray('  3. 查看项目状态: ') + chalk.blue('taskflow status'));
  console.log(chalk.gray('  4. 生成可视化报告: ') + chalk.blue('taskflow visualize'));

  if (config.aiModels!.length > 0) {
    console.log(chalk.gray('  5. 启动MCP服务器: ') + chalk.blue('taskflow mcp start'));
  }

  console.log(chalk.gray('\n配置文件位置: ') + chalk.blue(path.join(CONFIG_DIR, 'config.json')));
  console.log(chalk.gray('文档目录: ') + chalk.blue('docs/'));
  console.log(chalk.gray('输出目录: ') + chalk.blue('output/'));

  console.log(chalk.yellow('\n💡 提示: 使用 "taskflow --help" 查看所有可用命令'));
}
