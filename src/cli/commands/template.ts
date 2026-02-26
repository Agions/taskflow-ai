/**
 * 模板命令
 * taskflow template list|use|search
 */

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import { templateManager } from '../../core/plugin';

const program = new Command('template');

/**
 * 列出模板
 */
program
  .command('list')
  .description('列出可用模板')
  .option('-c, --category <category>', '分类 (prd|workflow|task)')
  .action((options) => {
    const templates = options.category 
      ? templateManager.list(options.category)
      : templateManager.list();

    if (templates.length === 0) {
      console.log(chalk.yellow('暂无模板'));
      return;
    }

    const byCategory = templateManager.listByCategory();
    const categories = ['prd', 'workflow', 'task'];

    for (const cat of categories) {
      const list = byCategory[cat];
      if (list.length === 0) continue;

      console.log(chalk.bold(`\n📋 ${cat.toUpperCase()} 模板:\n`));
      
      for (const t of list) {
        console.log(`  ${chalk.cyan(t.name)}`);
        console.log(`    ID: ${t.id}`);
        console.log(`    描述: ${t.description || '-'}\n`);
      }
    }
  });

/**
 * 使用模板
 */
program
  .command('use')
  .description('使用模板创建文件')
  .argument('<templateId>', '模板 ID')
  .option('-o, --output <file>', '输出文件')
  .option('-v, --variable <key=value>', '模板变量', (val, memo) => {
    const [key, value] = val.split('=');
    memo[key] = value;
    return memo;
  }, {})
  .action(async (templateId: string, options) => {
    const template = templateManager.get(templateId);
    
    if (!template) {
      console.log(chalk.red(`模板不存在: ${templateId}`));
      return;
    }

    const variables = options.variable || {};
    const content = templateManager.render(templateId, variables);

    if (!content) {
      console.log(chalk.red('模板渲染失败'));
      return;
    }

    if (options.output) {
      await fs.writeFile(options.output, content);
      console.log(chalk.green(`✅ 已保存到: ${options.output}`));
    } else {
      console.log(content);
    }
  });

/**
 * 搜索模板
 */
program
  .command('search')
  .description('搜索模板')
  .argument('<query>', '搜索关键词')
  .action((query: string) => {
    const results = templateManager.search(query);

    if (results.length === 0) {
      console.log(chalk.yellow(`没有找到匹配 "${query}" 的模板`));
      return;
    }

    console.log(chalk.bold(`\n🔍 搜索结果 (${results.length}):\n`));
    
    for (const t of results) {
      console.log(`  ${chalk.cyan(t.name)} [${t.category}]`);
      console.log(`    ${t.description || '-'}\n`);
    }
  });

/**
 * 导出模板
 */
program
  .command('export')
  .description('导出模板到文件')
  .argument('<templateId>', '模板 ID')
  .option('-d, --dir <dir>', '输出目录', './templates')
  .action(async (templateId: string, options) => {
    const success = await templateManager.saveToFile(templateId, options.dir);
    
    if (success) {
      console.log(chalk.green(`✅ 模板已导出`));
    } else {
      console.log(chalk.red('导出失败'));
    }
  });

export default program;
export const templateCommand = program;
