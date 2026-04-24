/**
 * Flow create 命令
 */

import chalk = require('chalk');
import fs = require('fs-extra');
import path = require('path');
import { getTemplate } from './templates';

interface CreateOptions {
  dir: string;
  template: string;
}

/**
 * 执行 create 命令
 */
export async function executeCreate(name: string, options: CreateOptions): Promise<void> {
  const workflowDir = path.resolve(options.dir);

  await fs.ensureDir(workflowDir);

  const template = getTemplate(options.template);
  if (!template) {
    console.log(chalk.red(`未知模板: ${options.template}`));
    return;
  }
  template.name = name;
  template.version = '1.0.0';

  const filePath = path.join(workflowDir, `${name}.json`);
  await fs.writeFile(filePath, JSON.stringify(template, null, 2));

  console.log(chalk.green(`\n✅ 工作流已创建: ${filePath}\n`));
  console.log(chalk.gray('你可以编辑此文件来定制工作流'));
}
