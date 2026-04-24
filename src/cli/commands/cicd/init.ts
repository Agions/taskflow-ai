/**
 * CI/CD init 命令
 */

import chalk = require('chalk');
import ora = require('ora');
import { GitHubActionsConfig } from '../../../cicd/types';
import { saveConfig, detectRepo } from './engine';

interface InitOptions {
  provider: string;
  repo?: string;
}

/**
 * 执行 init 命令
 */
export async function executeInit(options: InitOptions): Promise<void> {
  const spinner = ora('Initializing CI/CD...').start();

  try {
    const provider = options.provider;

    if (provider !== 'github') {
      spinner.fail(`Provider ${provider} not yet supported. Use github.`);
      return;
    }

    let repo = options.repo;
    if (!repo) {
      repo = detectRepo() ?? undefined;
    }

    if (!repo) {
      spinner.fail('Repository not specified and could not be detected. Use --repo owner/repo');
      return;
    }

    const config: GitHubActionsConfig = {
      provider: 'github',
      name: 'TaskFlow CI',
      workflowFile: 'taskflow.yml',
      triggers: [
        { type: 'push', branches: ['main', 'develop'] },
        { type: 'pr', branches: ['main'] },
      ],
      stages: [
        {
          name: 'validate',
          jobs: [
            {
              name: 'validate-prd',
              steps: [
                { name: 'Checkout', command: 'actions/checkout@v4' },
                { name: 'Setup Node', command: 'actions/setup-node@v4' },
                { name: 'Install TaskFlow', command: 'npm install -g taskflow-ai' },
                { name: 'Validate PRD', command: 'taskflow parse ./**/*.prd.md --validate' },
              ],
            },
          ],
        },
      ],
      environment: { NODE_VERSION: '20' },
      secrets: ['TASKFLOW_API_KEY'],
      notifications: [],
      permissions: {
        contents: 'read',
        issues: 'write',
        pullRequests: 'write',
      },
    };

    await saveConfig(config);

    spinner.succeed(chalk.green('CI/CD configuration initialized'));
    console.log(chalk.blue(`\nConfiguration saved`));
    console.log(chalk.gray(`Provider: ${provider}`));
    console.log(chalk.gray(`Repository: ${repo}`));
    console.log(chalk.yellow('\nNext steps:'));
    console.log('  1. Set GITHUB_TOKEN environment variable');
    console.log('  2. Run "taskflow cicd deploy" to deploy workflow');
  } catch (error) {
    spinner.fail(
      `Initialization failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
