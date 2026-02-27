/**
 * Flow run 命令
 */

import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { getEngine, getParser } from './engine';

interface RunOptions {
  dir: string;
  input?: string;
  format: string;
}

/**
 * 执行 run 命令
 */
export async function executeRun(name: string, options: RunOptions): Promise<void> {
  const workflowDir = path.resolve(options.dir);
  const filePath = path.join(workflowDir, `${name}.${options.format}`);

  if (!(await fs.pathExists(filePath))) {
    console.log(chalk.red(`工作流文件不存在: ${filePath}`));
    return;
  }

  console.log(chalk.cyan(`\n🚀 运行工作流: ${name}\n`));

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const workflow = getParser().parse(content, options.format as any);

    let input: Record<string, unknown> = {};
    if (options.input) {
      try {
        input = JSON.parse(options.input);
      } catch (e) {
        console.log(chalk.red('输入 JSON 解析失败'));
        return;
      }
    }

    const result = await getEngine().execute(workflow, input);

    if (result.success) {
      console.log(chalk.green(`\n✅ 工作流执行成功!`));
      console.log(`   耗时: ${result.duration}ms`);
      if (result.output) {
        console.log(`\n📊 输出:`);
        console.log(JSON.stringify(result.output, null, 2));
      }
    } else {
      console.log(chalk.red(`\n❌ 工作流执行失败!`));
      console.log(`   错误: ${result.error}`);
    }
  } catch (error) {
    console.log(chalk.red('执行失败:'), error);
  }
}
