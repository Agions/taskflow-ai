import { getLogger } from '../../../utils/logger';
/**
 * Visualize命令 - 生成项目可视化报告
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { generateCharts } from './charts';
import { generateReport } from './report';
import { findDataFiles, loadProjectData, showVisualizationStats } from './data';
import { getVisualizationOptions } from './prompts';
const logger = getLogger('cli/commands/visualize/index');


export function visualizeCommand(program: Command) {
  program
    .command('visualize')
    .description('生成项目可视化报告和图表')
    .option('-t, --type <type>', '图表类型 (gantt|pie|bar|timeline|kanban)', 'gantt')
    .option('-o, --output <path>', '输出路径', './reports')
    .option('-f, --format <format>', '输出格式 (html|svg|png)', 'html')
    .option('--interactive', '交互式模式')
    .action(async options => {
      try {
        await runVisualize(options);
      } catch (error) {
        logger.error(chalk.red('可视化生成失败:'), error);
        process.exit(1);
      }
    });
}

async function runVisualize(options: unknown) {
  const spinner = ora('正在生成可视化报告...').start();

  try {
    if (options.interactive) {
      spinner.stop();
      options = await getVisualizationOptions(options);
      spinner.start('正在生成可视化报告...');
    }

    const dataFiles = await findDataFiles();
    if (dataFiles.length === 0) {
      spinner.fail(chalk.yellow('未找到项目数据，请先运行 "taskflow parse" 解析PRD文档'));
      return;
    }

    const data = await loadProjectData(dataFiles);
    const charts = generateCharts(data, options);
    const reportPath = await generateReport(charts, options);

    spinner.succeed(chalk.green('可视化报告生成完成！'));

    console.log(chalk.cyan('\n📊 可视化报告:'));
    console.log(chalk.gray('  类型: ') + chalk.white(options.type));
    console.log(chalk.gray('  格式: ') + chalk.white(options.format));
    console.log(chalk.gray('  输出: ') + chalk.blue(reportPath));
    console.log(chalk.gray('  数据源: ') + chalk.white(`${dataFiles.length} 个文件`));

    showVisualizationStats(data);

    if (options.format === 'html') {
      console.log(chalk.yellow('\n💡 提示: 使用浏览器打开 HTML 文件查看交互式图表'));
    }
  } catch (error) {
    spinner.fail('可视化生成失败');
    throw error;
  }
}

export * from './charts';
export * from './report';
export * from './data';
export * from './prompts';
