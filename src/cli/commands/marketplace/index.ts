/**
 * Marketplace CLI 命令
 * MCP 工具市场管理
 */

import { Command } from 'commander';
import { executeSearch } from './search';
import { executeInstall } from './install';
import { executeUninstall } from './uninstall';
import { executeUpdate } from './update';
import { executeList } from './list';
import { executeInfo } from './info';
import { executeSync } from './sync';

export const marketplaceCommand = new Command('marketplace')
  .description('MCP Tool Marketplace - manage and install tools')
  .alias('mp');

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
  .action(executeSearch);

marketplaceCommand
  .command('install')
  .description('Install a package from the marketplace')
  .argument('<package>', 'Package name')
  .argument('[version]', 'Package version (optional)')
  .option('-g, --global', 'Install globally')
  .option('--no-save', 'Do not save to project dependencies')
  .action(executeInstall);

marketplaceCommand
  .command('uninstall')
  .description('Uninstall a package')
  .argument('<package>', 'Package name')
  .option('-g, --global', 'Uninstall global package')
  .alias('remove')
  .action(executeUninstall);

marketplaceCommand
  .command('update')
  .description('Update installed packages')
  .argument('[package]', 'Package name (optional, updates all if not specified)')
  .option('-g, --global', 'Update global packages')
  .action(executeUpdate);

marketplaceCommand
  .command('list')
  .description('List installed packages')
  .option('-g, --global', 'List global packages')
  .alias('ls')
  .action(executeList);

marketplaceCommand
  .command('info')
  .description('Show package information')
  .argument('<package>', 'Package name')
  .action(executeInfo);

marketplaceCommand
  .command('sync')
  .description('Sync registry cache')
  .argument('[registry]', 'Registry name (default: all)')
  .action(executeSync);

export default marketplaceCommand;
