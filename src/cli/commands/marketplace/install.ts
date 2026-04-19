/**
 * Marketplace install 命令
 */

import chalk from 'chalk';
import ora from 'ora';
import { RegistryManager } from '../../../marketplace/registry';
import { PackageInstaller } from '../../../marketplace/installer';

interface InstallOptions {
  global?: boolean;
  save?: boolean;
}

/**
 * 执行 install 命令
 */
export async function executeInstall(
  packageName: string,
  version: string | undefined,
  options: InstallOptions
): Promise<void> {
  const spinner = ora(`Installing ${packageName}...`).start();

  try {
    const registryManager = new RegistryManager();
    await registryManager.initialize();

    const installer = new PackageInstaller(registryManager);
    const result = await installer.install(packageName, version, {
      global: options.global,
      save: options.save !== false,
    });

    if (result.success) {
      spinner.succeed(chalk.green(`Installed ${result.package.name}@${result.package.version}`));

      if (result.installedTools.length > 0) {
        console.log(chalk.blue('\nInstalled tools:'));
        result.installedTools.forEach(tool => {
          console.log(`  • ${tool}`);
        });
      }

      if (result.warnings) {
        console.log(chalk.yellow('\nWarnings:'));
        result.warnings.forEach(warning => {
          console.log(`  ⚠️  ${warning}`);
        });
      }
    } else {
      spinner.fail(chalk.red(`Installation failed: ${result.error}`));
    }
  } catch (error) {
    spinner.fail(`Installation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
