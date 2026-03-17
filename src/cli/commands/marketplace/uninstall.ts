/**
 * Marketplace uninstall 命令
 */

import chalk from 'chalk';
import ora from 'ora';
import { RegistryManager } from '../../../marketplace/registry';
import { PackageInstaller } from '../../../marketplace/installer';

interface UninstallOptions {
  global?: boolean;
}

/**
 * 执行 uninstall 命令
 */
export async function executeUninstall(
  packageName: string,
  options: UninstallOptions
): Promise<void> {
  const spinner = ora(`Uninstalling ${packageName}...`).start();

  try {
    const registryManager = new RegistryManager();
    await registryManager.initialize();

    const installer = new PackageInstaller(registryManager);
    const success = await installer.uninstall(packageName, {
      global: options.global,
    });

    if (success) {
      spinner.succeed(chalk.green(`Uninstalled ${packageName}`));
    } else {
      spinner.fail(chalk.red(`Failed to uninstall ${packageName}`));
    }
  } catch (error) {
    spinner.fail(`Uninstall failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
