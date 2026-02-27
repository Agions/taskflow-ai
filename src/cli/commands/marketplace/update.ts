/**
 * Marketplace update 命令
 */

import chalk from 'chalk';
import ora from 'ora';
import { RegistryManager } from '../../../marketplace/registry';
import { PackageInstaller } from '../../../marketplace/installer';

interface UpdateOptions {
  global?: boolean;
}

/**
 * 执行 update 命令
 */
export async function executeUpdate(packageName: string | undefined, options: UpdateOptions): Promise<void> {
  const spinner = ora('Checking for updates...').start();

  try {
    const registryManager = new RegistryManager();
    await registryManager.initialize();

    const installer = new PackageInstaller(registryManager);

    if (packageName) {
      spinner.text = `Updating ${packageName}...`;
      const result = await installer.update(packageName, {
        global: options.global
      });

      if (result.success) {
        spinner.succeed(chalk.green(`Updated ${result.package.name} to ${result.package.version}`));
      } else {
        spinner.fail(chalk.red(`Update failed: ${result.error}`));
      }
    } else {
      const installed = await installer.listInstalled({ global: options.global });

      if (installed.length === 0) {
        spinner.stop();
        console.log(chalk.yellow('No packages installed'));
        return;
      }

      spinner.stop();
      console.log(chalk.blue(`\nChecking ${installed.length} packages for updates...\n`));

      for (const pkg of installed) {
        const updateSpinner = ora(`Checking ${pkg.name}...`).start();
        const result = await installer.update(pkg.name, { global: options.global });

        if (result.success) {
          updateSpinner.succeed(chalk.green(`${pkg.name} is up to date`));
        } else if (result.error?.includes('already up to date')) {
          updateSpinner.info(chalk.blue(`${pkg.name} is up to date`));
        } else {
          updateSpinner.fail(chalk.red(`${pkg.name}: ${result.error}`));
        }
      }
    }

  } catch (error) {
    spinner.fail(`Update failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
