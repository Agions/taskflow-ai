/**
 * Marketplace list 命令
 */

import chalk from 'chalk';
import ora from 'ora';
import { RegistryManager } from '../../../marketplace/registry';
import { PackageInstaller } from '../../../marketplace/installer';

interface ListOptions {
  global?: boolean;
}

/**
 * 执行 list 命令
 */
export async function executeList(options: ListOptions): Promise<void> {
  const spinner = ora('Loading packages...').start();

  try {
    const registryManager = new RegistryManager();
    await registryManager.initialize();

    const installer = new PackageInstaller(registryManager);
    const packages = await installer.listInstalled({ global: options.global });

    spinner.stop();

    if (packages.length === 0) {
      console.log(chalk.yellow(options.global ? 'No global packages installed' : 'No packages installed'));
      return;
    }

    console.log(chalk.blue(`\n${options.global ? 'Global' : 'Local'} packages (${packages.length}):\n`));

    for (const pkg of packages) {
      const tools = pkg.tools?.map(t => t.name).join(', ') || 'none';
      console.log(`${chalk.bold(pkg.name)} ${chalk.yellow('v' + pkg.version)}`);
      console.log(`  ${chalk.gray(pkg.description)}`);
      console.log(`  Tools: ${chalk.cyan(tools)}`);
      console.log();
    }

  } catch (error) {
    spinner.fail(`Failed to list packages: ${error instanceof Error ? error.message : String(error)}`);
  }
}
