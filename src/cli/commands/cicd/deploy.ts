/**
 * CI/CD deploy 命令
 */

import chalk from 'chalk';
import ora from 'ora';
import { isInitialized, loadConfig, createIntegration, validateToken, detectRepo } from './engine';

interface DeployOptions {
  config?: string;
}

/**
 * 执行 deploy 命令
 */
export async function executeDeploy(options: DeployOptions): Promise<void> {
  const spinner = ora('Deploying CI/CD workflow...').start();

  try {
    if (!(await isInitialized(options.config))) {
      spinner.fail('CI/CD not initialized. Run "taskflow cicd init" first.');
      return;
    }

    const config = await loadConfig(options.config);
    if (!config) {
      spinner.fail('Failed to load configuration');
      return;
    }

    const tokenValidation = validateToken();
    if (!tokenValidation.valid) {
      spinner.fail(tokenValidation.error);
      return;
    }

    const repo = detectRepo();
    if (!repo) {
      spinner.fail('Could not detect GitHub repository');
      return;
    }

    const integration = createIntegration(repo);
    const workflowContent = await integration.generateWorkflow(config);
    await integration.deployWorkflow(config.workflowFile, workflowContent);

    spinner.succeed(chalk.green('CI/CD workflow deployed'));
    console.log(chalk.blue(`\nWorkflow file: .github/workflows/${config.workflowFile}`));
    console.log(chalk.yellow("\nDon't forget to:"));
    console.log('  1. Commit the workflow file');
    console.log('  2. Push to remote');
    console.log('  3. Set required secrets in GitHub repository settings');
  } catch (error) {
    spinner.fail(`Deployment failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
