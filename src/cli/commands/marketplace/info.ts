/**
 * Marketplace info 命令
 */

import chalk = require('chalk');
import ora = require('ora');
import { RegistryManager } from '../../../marketplace/registry';

/**
 * 执行 info 命令
 */
export async function executeInfo(packageName: string): Promise<void> {
  const spinner = ora('Fetching package info...').start();

  try {
    const registryManager = new RegistryManager();
    await registryManager.initialize();

    const pkg = await registryManager.getPackage(packageName);

    if (!pkg) {
      spinner.fail(chalk.red(`Package not found: ${packageName}`));
      return;
    }

    spinner.stop();

    console.log(chalk.blue(`\n${pkg.name}\n`));
    console.log(`  ${chalk.gray(pkg.description)}`);
    console.log(`  ${chalk.yellow('Version:')} ${pkg.version}`);
    console.log(`  ${chalk.yellow('Author:')} ${pkg.author}`);
    console.log(`  ${chalk.yellow('License:')} ${pkg.license}`);
    console.log(`  ${chalk.yellow('Downloads:')} ${pkg.metadata.downloads}`);
    console.log(`  ${chalk.yellow('Categories:')} ${pkg.categories.join(', ')}`);
    console.log(`  ${chalk.yellow('Keywords:')} ${pkg.keywords.join(', ')}`);

    if (pkg.tools.length > 0) {
      console.log(chalk.blue('\nTools:'));
      pkg.tools.forEach(tool => {
        console.log(`  • ${chalk.bold(tool.name)} - ${tool.description}`);
      });
    }

    if (pkg.repository) {
      console.log(`\n  ${chalk.gray('Repository:')} ${pkg.repository}`);
    }

    if (pkg.homepage) {
      console.log(`  ${chalk.gray('Homepage:')} ${pkg.homepage}`);
    }

    const versions = await registryManager.getPackageVersions(packageName);
    if (versions.length > 0) {
      console.log(chalk.blue('\nVersions:'));
      versions.slice(0, 5).forEach(v => {
        const deprecated = v.deprecated ? chalk.red(' [deprecated]') : '';
        console.log(
          `  ${chalk.yellow(v.version)}${deprecated} - ${v.publishedAt.toLocaleDateString()}`
        );
      });
    }

    console.log();
  } catch (error) {
    spinner.fail(`Failed to get info: ${error instanceof Error ? error.message : String(error)}`);
  }
}
