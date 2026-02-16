/**
 * Marketplace CLI 命令
 * MCP 工具市场管理
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { RegistryManager } from '../../marketplace/registry';
import { PackageInstaller } from '../../marketplace/installer';
import { SearchOptions } from '../../marketplace/types';

export const marketplaceCommand = new Command('marketplace')
  .description('MCP Tool Marketplace - manage and install tools')
  .alias('mp');

// 搜索命令
marketplaceCommand
  .command('search')
  .description('Search for packages in the marketplace')
  .argument('[query]', 'Search query')
  .option('-c, --category <category>', 'Filter by category')
  .option('-a, --author <author>', 'Filter by author')
  .option('--verified', 'Show only verified packages')
  .option('--official', 'Show only official packages')
  .option('-s, --sort <sort>', 'Sort by: downloads|rating|updated|name', 'downloads')
  .option('-l, --limit <n>', 'Limit results', '20')
  .action(async (query, options) => {
    const spinner = ora('Searching marketplace...').start();

    try {
      const registryManager = new RegistryManager();
      await registryManager.initialize();

      const searchOptions: SearchOptions = {
        query,
        category: options.category,
        author: options.author,
        verified: options.verified,
        official: options.official,
        sortBy: options.sort,
        limit: parseInt(options.limit)
      };

      const result = await registryManager.search(searchOptions);
      spinner.stop();

      if (result.packages.length === 0) {
        console.log(chalk.yellow('No packages found'));
        return;
      }

      console.log(chalk.blue(`\nFound ${result.total} packages:\n`));

      for (const pkg of result.packages) {
        const official = pkg.metadata.official ? chalk.green(' [official]') : '';
        const verified = pkg.metadata.verified ? chalk.blue(' ✓') : '';

        console.log(`${chalk.bold(pkg.name)}${official}${verified}`);
        console.log(`  ${chalk.gray(pkg.description)}`);
        console.log(`  ${chalk.yellow('v' + pkg.version)} | ${chalk.cyan(pkg.metadata.downloads + ' downloads')} | ${chalk.magenta(pkg.author)}`);
        console.log(`  ${chalk.gray('Categories: ' + pkg.categories.join(', '))}`);
        console.log();
      }

      console.log(chalk.gray(`Showing ${result.packages.length} of ${result.total} results`));

    } catch (error) {
      spinner.fail(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

// 安装命令
marketplaceCommand
  .command('install')
  .description('Install a package from the marketplace')
  .argument('<package>', 'Package name')
  .argument('[version]', 'Package version (optional)')
  .option('-g, --global', 'Install globally')
  .option('--no-save', 'Do not save to project dependencies')
  .action(async (packageName, version, options) => {
    const spinner = ora(`Installing ${packageName}...`).start();

    try {
      const registryManager = new RegistryManager();
      await registryManager.initialize();

      const installer = new PackageInstaller(registryManager);
      const result = await installer.install(packageName, version, {
        global: options.global,
        save: options.save
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
  });

// 卸载命令
marketplaceCommand
  .command('uninstall')
  .description('Uninstall a package')
  .argument('<package>', 'Package name')
  .option('-g, --global', 'Uninstall global package')
  .alias('remove')
  .action(async (packageName, options) => {
    const spinner = ora(`Uninstalling ${packageName}...`).start();

    try {
      const registryManager = new RegistryManager();
      await registryManager.initialize();

      const installer = new PackageInstaller(registryManager);
      const success = await installer.uninstall(packageName, {
        global: options.global
      });

      if (success) {
        spinner.succeed(chalk.green(`Uninstalled ${packageName}`));
      } else {
        spinner.fail(chalk.red(`Failed to uninstall ${packageName}`));
      }

    } catch (error) {
      spinner.fail(`Uninstall failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

// 更新命令
marketplaceCommand
  .command('update')
  .description('Update installed packages')
  .argument('[package]', 'Package name (optional, updates all if not specified)')
  .option('-g, --global', 'Update global packages')
  .action(async (packageName, options) => {
    const spinner = ora('Checking for updates...').start();

    try {
      const registryManager = new RegistryManager();
      await registryManager.initialize();

      const installer = new PackageInstaller(registryManager);

      if (packageName) {
        // 更新单个包
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
        // 更新所有包
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
  });

// 列出命令
marketplaceCommand
  .command('list')
  .description('List installed packages')
  .option('-g, --global', 'List global packages')
  .alias('ls')
  .action(async (options) => {
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
  });

// 信息命令
marketplaceCommand
  .command('info')
  .description('Show package information')
  .argument('<package>', 'Package name')
  .action(async (packageName) => {
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

      // 获取版本历史
      const versions = await registryManager.getPackageVersions(packageName);
      if (versions.length > 0) {
        console.log(chalk.blue('\nVersions:'));
        versions.slice(0, 5).forEach(v => {
          const deprecated = v.deprecated ? chalk.red(' [deprecated]') : '';
          console.log(`  ${chalk.yellow(v.version)}${deprecated} - ${v.publishedAt.toLocaleDateString()}`);
        });
      }

      console.log();

    } catch (error) {
      spinner.fail(`Failed to get info: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

// 同步命令
marketplaceCommand
  .command('sync')
  .description('Sync registry cache')
  .argument('[registry]', 'Registry name (default: all)')
  .action(async (registryName) => {
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
  });

export default marketplaceCommand;
