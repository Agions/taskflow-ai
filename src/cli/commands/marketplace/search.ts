/**
 * Marketplace search 命令
 */

import chalk = require('chalk');
import ora = require('ora');
import { RegistryManager } from '../../../marketplace/registry';
import { SearchOptions } from '../../../marketplace/types';

interface SearchCommandOptions {
  category?: string;
  author?: string;
  verified?: boolean;
  official?: boolean;
  sort: string;
  limit: string;
}

/**
 * 执行 search 命令
 */
export async function executeSearch(query: string, options: SearchCommandOptions): Promise<void> {
  const spinner = ora('Searching marketplace...').start();

  try {
    const registryManager = new RegistryManager();
    await registryManager.initialize();

    const searchOptions: SearchOptions = {
      query,
      category: options.category as import('../../../marketplace/types').ToolCategory | undefined,
      author: options.author,
      verified: options.verified,
      official: options.official,
      sortBy: options.sort as 'downloads' | 'rating' | 'updated' | 'name',
      limit: parseInt(options.limit),
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
      console.log(
        `  ${chalk.yellow('v' + pkg.version)} | ${chalk.cyan(pkg.metadata.downloads + ' downloads')} | ${chalk.magenta(pkg.author)}`
      );
      console.log(`  ${chalk.gray('Categories: ' + pkg.categories.join(', '))}`);
      console.log();
    }

    console.log(chalk.gray(`Showing ${result.packages.length} of ${result.total} results`));
  } catch (error) {
    spinner.fail(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
