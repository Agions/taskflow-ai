import { getLogger } from '../../utils/logger';
/**
 * Parse命令 - 解析PRD文档 (简化版本)
 */

import { Command } from 'commander';
import chalk = require('chalk');
import ora = require('ora');
import path = require('path');
import fs = require('fs-extra');
import { PRDParser } from '../../core/parser';
import { ConfigManager } from '../../core/config';
import { PRDDocument } from '../../types';
import { Task } from '../../types';
const logger = getLogger('cli/commands/parse');

/** Parse 命令选项 */
interface ParseCommandOptions {
  output: string;
  format: 'json' | 'markdown';
  tasks?: boolean;
}

/** 解析结果 */
interface ParseResult {
  document: PRDDocument;
  tasks: Task[];
  summary: {
    totalTasks: number;
    totalHours: number;
    generatedAt: string;
  };
}

export function parseCommand(program: Command) {
  program
    .command('parse <file>')
    .description('解析PRD文档并生成任务')
    .option('-o, --output <path>', '输出目录', 'output')
    .option('-f, --format <format>', '输出格式 (json|markdown)', 'json')
    .option('--no-tasks', '只解析文档，不生成任务')
    .action(async (file: string, options: ParseCommandOptions) => {
      try {
        await runParse(file, options);
      } catch (error) {
        logger.error(chalk.red('解析失败:'), error);
        process.exit(1);
      }
    });
}

async function runParse(filePath: string, options: ParseCommandOptions): Promise<void> {
  const spinner = ora('正在解析PRD文档...').start();

  try {
    const fullPath = path.resolve(filePath);
    if (!(await fs.pathExists(fullPath))) {
      spinner.fail(chalk.red('文件不存在: ' + filePath));
      return;
    }

    const configManager = new ConfigManager();
    const config = await configManager.loadConfig();

    if (!config) {
      spinner.fail(chalk.red('未找到配置文件，请先运行 "taskflow init"'));
      return;
    }

    spinner.text = '正在解析文档内容...';

    const parser = new PRDParser(config);
    const prdDocument: PRDDocument = await parser.parse(fullPath);

    let tasks: Task[] = [];
    if (options.tasks !== false) {
      spinner.text = '跳过任务生成（agent 功能已移除）...';
      // Task Generator 已移除，返回空列表
      tasks = [];
    }

    const outputPath = await saveResults(prdDocument, tasks, options);

    spinner.succeed(chalk.green('解析完成！'));

    const totalHours = tasks.reduce((sum: number, task: Task) => sum + (task.estimatedHours ?? 0), 0);

    console.log(chalk.cyan('\n📊 解析结果:'));
    console.log(chalk.gray('  文档标题: ') + chalk.white(prdDocument.title));
    console.log(chalk.gray('  章节数量: ') + chalk.white(prdDocument.sections.length));
    console.log(chalk.gray('  生成任务: ') + chalk.white(tasks.length));
    console.log(chalk.gray('  预估工时: ') + chalk.white(totalHours + ' 小时'));
    console.log(chalk.gray('  输出文件: ') + chalk.blue(outputPath));

    console.log(chalk.yellow('\n💡 提示:'));
    console.log(chalk.gray('  - 使用 "taskflow status" 查看项目状态'));
    console.log(chalk.gray('  - 使用 "taskflow visualize" 生成可视化报告'));
  } catch (error) {
    spinner.fail('解析失败');
    throw error;
  }
}

async function saveResults(
  document: PRDDocument,
  tasks: Task[],
  options: ParseCommandOptions
): Promise<string> {
  const outputDir = path.resolve(options.output);
  await fs.ensureDir(outputDir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseName = path.parse(document.title || 'prd').name;

  const results: ParseResult = {
    document,
    tasks,
    summary: {
      totalTasks: tasks.length,
      totalHours: tasks.reduce((sum: number, task: Task) => sum + (task.estimatedHours ?? 0), 0),
      generatedAt: new Date().toISOString(),
    },
  };

  let outputPath: string;
  let content: string;

  if (options.format === 'markdown') {
    outputPath = path.join(outputDir, `${baseName}-${timestamp}.md`);
    content = generateMarkdownReport(results);
  } else {
    outputPath = path.join(outputDir, `${baseName}-${timestamp}.json`);
    content = JSON.stringify(results, null, 2);
  }

  await fs.writeFile(outputPath, content, 'utf-8');
  return outputPath;
}

function generateMarkdownReport(results: ParseResult): string {
  const { document, tasks, summary } = results;

  return `# PRD解析报告

## 文档信息
- **标题**: ${document.title}
- **版本**: ${document.version}
- **生成时间**: ${new Date(summary.generatedAt).toLocaleString()}

## 项目概览
- **总任务数**: ${summary.totalTasks}
- **预估总工时**: ${summary.totalHours} 小时
- **预估工期**: ${Math.ceil(summary.totalHours / 8)} 天

## 任务列表

${tasks
  .map(
    (task: Task, index: number) => `
### ${index + 1}. ${task.title}

- **类型**: ${task.type}
- **优先级**: ${task.priority}
- **复杂度**: ${task.complexity}
- **预估工时**: ${(task.estimatedHours ?? 0)} 小时
- **状态**: ${task.status}
- **描述**: ${task.description}

`
  )
  .join('')}

---
*报告由 TaskFlow AI 自动生成*
`;
}
