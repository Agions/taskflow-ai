/**
 * Flow list 命令
 */

import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { getParser } from './engine';

interface ListOptions {
  dir: string;
}

/**
 * 执行 list 命令
 */
export async function executeList(options: ListOptions): Promise<void> {
  const workflowDir = path.resolve(options.dir);
  
  if (!(await fs.pathExists(workflowDir))) {
    console.log(chalk.yellow('工作流目录不存在'));
    return;
  }

  const files = await fs.readdir(workflowDir);
  const workflows = files.filter(f => f.endsWith('.json') || f.endsWith('.yaml'));

  if (workflows.length === 0) {
    console.log(chalk.yellow('暂无工作流'));
    return;
  }

  console.log(chalk.bold('\n📋 工作流列表:\n'));
  
  for (const file of workflows) {
    const filePath = path.join(workflowDir, file);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const format = file.endsWith('.yaml') ? 'yaml' : 'json';
      const workflow = getParser().parse(content, format as any);
      
      console.log(`  ${chalk.cyan(workflow.name)} (v${workflow.version})`);
      console.log(`    文件: ${file}`);
      console.log(`    步骤: ${workflow.steps.length}`);
      console.log(`    描述: ${workflow.description || '-'}\n`);
    } catch (_e) {
      console.log(chalk.red(`  ${file} - 解析失败`));
    }
  }
}
