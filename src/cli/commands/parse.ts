/**
 * Parse命令 - 解析PRD文档 (简化版本)
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import { PRDParser } from '../../core/parser';
import { TaskGenerator } from '../../core/tasks';
import { ConfigManager } from '../../core/config';

export function parseCommand(program: Command) {
  program
    .command('parse <file>')
    .description('解析PRD文档并生成任务')
    .option('-o, --output <path>', '输出目录', 'output')
    .option('-f, --format <format>', '输出格式 (json|markdown)', 'json')
    .option('--no-tasks', '只解析文档，不生成任务')
    .action(async (file: string, options) => {
      try {
        await runParse(file, options);
      } catch (error) {
        console.error(chalk.red('解析失败:'), error);
        process.exit(1);
      }
    });
}

async function runParse(filePath: string, options: any) {
  const spinner = ora('正在解析PRD文档...').start();

  try {
    // 验证文件存在
    const fullPath = path.resolve(filePath);
    if (!(await fs.pathExists(fullPath))) {
      spinner.fail(chalk.red('文件不存在: ' + filePath));
      return;
    }

    // 加载配置
    const configManager = new ConfigManager();
    const config = await configManager.loadConfig();

    if (!config) {
      spinner.fail(chalk.red('未找到配置文件，请先运行 "taskflow init"'));
      return;
    }

    spinner.text = '正在解析文档内容...';

    // 解析PRD文档
    const parser = new PRDParser(config);
    const prdDocument = await parser.parse(fullPath);

    // 生成任务（如果需要）
    let tasks: any[] = [];
    if (options.tasks !== false) {
      spinner.text = '正在生成任务...';
      const taskGenerator = new TaskGenerator(config);
      tasks = await taskGenerator.generateTasks(prdDocument);
    }

    // 保存结果
    const outputPath = await saveResults(prdDocument, tasks, options);

    spinner.succeed(chalk.green('解析完成！'));

    // 显示结果摘要
    console.log(chalk.cyan('\n📊 解析结果:'));
    console.log(chalk.gray('  文档标题: ') + chalk.white(prdDocument.title));
    console.log(chalk.gray('  章节数量: ') + chalk.white(prdDocument.sections.length));
    console.log(chalk.gray('  生成任务: ') + chalk.white(tasks.length));
    console.log(
      chalk.gray('  预估工时: ') +
        chalk.white(
          tasks.reduce((sum: number, task: any) => sum + task.estimatedHours, 0) + ' 小时'
        )
    );
    console.log(chalk.gray('  输出文件: ') + chalk.blue(outputPath));

    console.log(chalk.yellow('\n💡 提示:'));
    console.log(chalk.gray('  - 使用 "taskflow status" 查看项目状态'));
    console.log(chalk.gray('  - 使用 "taskflow visualize" 生成可视化报告'));
  } catch (error) {
    spinner.fail('解析失败');
    throw error;
  }
}

async function saveResults(document: any, tasks: any[], options: any): Promise<string> {
  const outputDir = path.resolve(options.output);
  await fs.ensureDir(outputDir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseName = path.parse(document.title || 'prd').name;

  const results = {
    document,
    tasks,
    summary: {
      totalTasks: tasks.length,
      totalHours: tasks.reduce((sum: number, task: any) => sum + task.estimatedHours, 0),
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

function generateMarkdownReport(results: any): string {
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
    (task: any, index: number) => `
### ${index + 1}. ${task.title}

- **类型**: ${task.type}
- **优先级**: ${task.priority}
- **复杂度**: ${task.complexity}
- **预估工时**: ${task.estimatedHours} 小时
- **状态**: ${task.status}
- **描述**: ${task.description}

`
  )
  .join('')}

---
*报告由 TaskFlow AI 自动生成*
`;
}
