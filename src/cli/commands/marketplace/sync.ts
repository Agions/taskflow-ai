/**
 * Marketplace sync 命令
 */

import chalk = require('chalk');
import ora = require('ora');
import { RegistryManager } from '../../../marketplace/registry';

/**
 * 执行 sync 命令
 */
export async function executeSync(registryName: string | undefined): Promise<void> {
  const spinner = ora('Syncing registry...').start();

  try {
    const registryManager = new RegistryManager();
    await registryManager.initialize();

    if (registryName) {
      await registryManager.syncRegistry(registryName);
      spinner.succeed(chalk.green(`Synced registry: ${registryName}`));
    } else {
      const registries = registryManager.getRegistries();
      for (const registry of registries) {
        spinner.text = `Syncing ${registry.name}...`;
        await registryManager.syncRegistry(registry.name);
      }
      spinner.succeed(chalk.green(`Synced ${registries.length} registries`));
    }
  } catch (error) {
    spinner.fail(`Sync failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
