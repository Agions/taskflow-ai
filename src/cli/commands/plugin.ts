/**
 * 插件命令
 * taskflow plugin list|load|unload|search
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { pluginManager } from '../../core/plugin';

const program = new Command('plugin');

/**
 * 列出插件
 */
program
  .command('list')
  .description('列出已安装的插件')
  .action(() => {
    const plugins = pluginManager.list();

    if (plugins.length === 0) {
      console.log(chalk.yellow('暂无已安装的插件'));
      return;
    }

    console.log(chalk.bold('\n📦 已安装插件:\n'));

    for (const plugin of plugins) {
      console.log(`  ${chalk.cyan(plugin.name)} v${plugin.version}`);
      console.log(`    ID: ${plugin.id}`);
      console.log(`    描述: ${plugin.description || '-'}`);
      if (plugin.author) {
        console.log(`    作者: ${plugin.author}`);
      }
      console.log();
    }
  });

/**
 * 加载插件
 */
program
  .command('load')
  .description('加载插件')
  .argument('<pluginId>', '插件 ID')
  .action(async (pluginId: string) => {
    console.log(chalk.cyan(`\n加载插件: ${pluginId}\n`));

    const result = await pluginManager.load(pluginId);

    if (result.success) {
      console.log(chalk.green(`✅ 插件加载成功: ${result.plugin?.name}`));
    } else {
      console.log(chalk.red(`❌ 加载失败: ${result.error}`));
    }
  });

/**
 * 卸载插件
 */
program
  .command('unload')
  .description('卸载插件')
  .argument('<pluginId>', '插件 ID')
  .action(async (pluginId: string) => {
    const success = await pluginManager.unload(pluginId);

    if (success) {
      console.log(chalk.green(`✅ 插件已卸载: ${pluginId}`));
    } else {
      console.log(chalk.red(`❌ 卸载失败: 插件不存在`));
    }
  });

/**
 * 初始化插件
 */
program
  .command('init')
  .description('初始化插件系统')
  .action(async () => {
    console.log(chalk.cyan('\n初始化插件系统...\n'));

    await pluginManager.initialize();
    await pluginManager.loadAll();

    console.log(chalk.green(`✅ 插件系统已初始化`));
    console.log(`   已加载 ${pluginManager.count()} 个插件`);
  });

export default program;
export const pluginCommand = program;
