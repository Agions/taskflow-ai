/**
 * CI/CD CLI 命令
 * CI/CD 流水线管理
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as path from 'path';
import { GitHubActionsIntegration } from '../../cicd/github';
import { GitHubActionsConfig } from '../../cicd/types';

export const cicdCommand = new Command('cicd')
  .description('CI/CD Pipeline Integration - manage deployment workflows')
  .alias('ci');

// 初始化命令
cicdCommand
  .command('init')
  .description('Initialize CI/CD configuration')
  .option('-p, --provider <provider>', 'CI provider (github|gitlab|jenkins)', 'github')
  .option('-r, --repo <repo>', 'Repository (owner/repo)')
  .action(async (options) => {
    const spinner = ora('Initializing CI/CD...').start();

    try {
      const provider = options.provider;

      if (provider !== 'github') {
        spinner.fail(`Provider ${provider} not yet supported. Use github.`);
        return;
      }

      // 检测仓库
      let repo = options.repo;
      if (!repo) {
        // 尝试从 git 配置读取
        const { execSync } = require('child_process');
        try {
          const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
          const match = remoteUrl.match(/github\.com[:/](.+?)\.git?$/);
          if (match) {
            repo = match[1];
          }
        } catch {
          // 忽略错误
        }
      }

      if (!repo) {
        spinner.fail('Repository not specified and could not be detected. Use --repo owner/repo');
        return;
      }

      // 创建配置
      const config: GitHubActionsConfig = {
        provider: 'github',
        name: 'TaskFlow CI',
        workflowFile: 'taskflow.yml',
        triggers: [
          { type: 'push', branches: ['main', 'develop'] },
          { type: 'pr', branches: ['main'] }
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
                  { name: 'Validate PRD', command: 'taskflow parse ./**/*.prd.md --validate' }
                ]
              }
            ]
          }
        ],
        environment: {
          NODE_VERSION: '20'
        },
        secrets: ['TASKFLOW_API_KEY'],
        notifications: [],
        permissions: {
          contents: 'read',
          issues: 'write',
          pullRequests: 'write'
        }
      };

      // 保存配置
      const configPath = path.join(process.cwd(), '.taskflow', 'cicd-config.json');
      await require('fs-extra').writeJson(configPath, config, { spaces: 2 });

      spinner.succeed(chalk.green('CI/CD configuration initialized'));
      console.log(chalk.blue(`\nConfiguration saved to: ${configPath}`));
      console.log(chalk.gray(`Provider: ${provider}`));
      console.log(chalk.gray(`Repository: ${repo}`));
      console.log(chalk.yellow('\nNext steps:'));
      console.log('  1. Set GITHUB_TOKEN environment variable');
      console.log('  2. Run "taskflow cicd deploy" to deploy workflow');

    } catch (error) {
      spinner.fail(`Initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

// 部署命令
cicdCommand
  .command('deploy')
  .description('Deploy CI/CD workflow')
  .option('-c, --config <path>', 'Configuration file path')
  .action(async (options) => {
    const spinner = ora('Deploying CI/CD workflow...').start();

    try {
      // 加载配置
      const configPath = options.config || path.join(process.cwd(), '.taskflow', 'cicd-config.json');
      const fs = require('fs-extra');

      if (!await fs.pathExists(configPath)) {
        spinner.fail('CI/CD not initialized. Run "taskflow cicd init" first.');
        return;
      }

      const config: GitHubActionsConfig = await fs.readJson(configPath);

      // 检查 token
      const token = process.env.GITHUB_TOKEN;
      if (!token) {
        spinner.fail('GITHUB_TOKEN environment variable not set');
        return;
      }

      // 获取仓库
      const { execSync } = require('child_process');
      const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
      const match = remoteUrl.match(/github\.com[:/](.+?)\.git?$/);
      if (!match) {
        spinner.fail('Could not detect GitHub repository');
        return;
      }
      const repo = match[1];

      // 部署
      const integration = new GitHubActionsIntegration(token, repo);
      await integration.deployWorkflow(config);

      spinner.succeed(chalk.green('CI/CD workflow deployed'));
      console.log(chalk.blue(`\nWorkflow file: .github/workflows/${config.workflowFile}`));
      console.log(chalk.yellow('\nDon\'t forget to:'));
      console.log('  1. Commit the workflow file');
      console.log('  2. Push to remote');
      console.log('  3. Set required secrets in GitHub repository settings');

    } catch (error) {
      spinner.fail(`Deployment failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

// 模板命令
cicdCommand
  .command('template')
  .description('List available workflow templates')
  .option('-p, --provider <provider>', 'CI provider', 'github')
  .action(async (options) => {
    console.log(chalk.blue('\nAvailable Workflow Templates\n'));

    if (options.provider === 'github') {
      const integration = new GitHubActionsIntegration('', '');
      const templates = integration.getWorkflowTemplates();

      for (const template of templates) {
        console.log(`${chalk.bold(template.name)} ${chalk.gray(`(${template.id})`)}`);
        console.log(`  ${template.description}`);
        console.log(`  Variables: ${template.variables.map(v => v.name).join(', ')}`);
        console.log();
      }
    } else {
      console.log(chalk.yellow(`Templates for ${options.provider} not yet available`));
    }
  });

// 验证命令
cicdCommand
  .command('validate')
  .description('Validate CI/CD configuration')
  .option('-c, --config <path>', 'Configuration file path')
  .action(async (options) => {
    const spinner = ora('Validating configuration...').start();

    try {
      // 加载配置
      const configPath = options.config || path.join(process.cwd(), '.taskflow', 'cicd-config.json');
      const fs = require('fs-extra');

      if (!await fs.pathExists(configPath)) {
        spinner.fail('CI/CD not initialized. Run "taskflow cicd init" first.');
        return;
      }

      const config: GitHubActionsConfig = await fs.readJson(configPath);

      // 验证
      const token = process.env.GITHUB_TOKEN || 'dummy-token';
      const integration = new GitHubActionsIntegration(token, 'owner/repo');
      const result = await integration.validateConfig(config);

      spinner.stop();

      if (result.valid) {
        console.log(chalk.green('✅ Configuration is valid'));
      } else {
        console.log(chalk.red('❌ Configuration has errors:'));
        for (const error of result.errors) {
          console.log(`  • ${error.field}: ${error.message}`);
        }
      }

      if (result.warnings.length > 0) {
        console.log(chalk.yellow('\n⚠️  Warnings:'));
        for (const warning of result.warnings) {
          console.log(`  • ${warning.field}: ${warning.message}`);
        }
      }

    } catch (error) {
      spinner.fail(`Validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

// 状态命令
cicdCommand
  .command('status')
  .description('Get pipeline status')
  .argument('<run-id>', 'Pipeline run ID')
  .action(async (runId) => {
    const spinner = ora('Fetching pipeline status...').start();

    try {
      const token = process.env.GITHUB_TOKEN;
      if (!token) {
        spinner.fail('GITHUB_TOKEN environment variable not set');
        return;
      }

      // 获取仓库
      const { execSync } = require('child_process');
      const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
      const match = remoteUrl.match(/github\.com[:/](.+?)\.git?$/);
      if (!match) {
        spinner.fail('Could not detect GitHub repository');
        return;
      }
      const repo = match[1];

      // 获取状态
      const integration = new GitHubActionsIntegration(token, repo);
      const status = await integration.getPipelineStatus(runId);

      spinner.stop();

      const statusColor = {
        'pending': chalk.yellow,
        'running': chalk.blue,
        'success': chalk.green,
        'failure': chalk.red,
        'cancelled': chalk.gray,
        'skipped': chalk.gray
      }[status.status] || chalk.white;

      console.log(chalk.blue('\nPipeline Status\n'));
      console.log(`  Status: ${statusColor(status.status.toUpperCase())}`);
      console.log(`  Started: ${status.startedAt.toLocaleString()}`);
      if (status.finishedAt) {
        console.log(`  Finished: ${status.finishedAt.toLocaleString()}`);
      }
      if (status.duration) {
        console.log(`  Duration: ${(status.duration / 1000).toFixed(1)}s`);
      }
      if (status.url) {
        console.log(`  URL: ${chalk.underline(status.url)}`);
      }
      console.log();

    } catch (error) {
      spinner.fail(`Failed to get status: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

// 触发命令
cicdCommand
  .command('trigger')
  .description('Trigger pipeline manually')
  .option('-b, --branch <branch>', 'Branch to trigger', 'main')
  .action(async (options) => {
    const spinner = ora('Triggering pipeline...').start();

    try {
      const token = process.env.GITHUB_TOKEN;
      if (!token) {
        spinner.fail('GITHUB_TOKEN environment variable not set');
        return;
      }

      // 获取仓库
      const { execSync } = require('child_process');
      const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
      const match = remoteUrl.match(/github\.com[:/](.+?)\.git?$/);
      if (!match) {
        spinner.fail('Could not detect GitHub repository');
        return;
      }
      const repo = match[1];

      // 触发
      const integration = new GitHubActionsIntegration(token, repo);
      const runId = await integration.triggerPipeline(options.branch);

      spinner.succeed(chalk.green(`Pipeline triggered: ${runId}`));

    } catch (error) {
      spinner.fail(`Failed to trigger: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

// 报告命令
cicdCommand
  .command('report')
  .description('Get build report')
  .argument('<run-id>', 'Pipeline run ID')
  .action(async (runId) => {
    const spinner = ora('Fetching build report...').start();

    try {
      const token = process.env.GITHUB_TOKEN;
      if (!token) {
        spinner.fail('GITHUB_TOKEN environment variable not set');
        return;
      }

      // 获取仓库
      const { execSync } = require('child_process');
      const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
      const match = remoteUrl.match(/github\.com[:/](.+?)\.git?$/);
      if (!match) {
        spinner.fail('Could not detect GitHub repository');
        return;
      }
      const repo = match[1];

      // 获取报告
      const integration = new GitHubActionsIntegration(token, repo);
      const report = await integration.getBuildReport(runId);

      spinner.stop();

      console.log(chalk.blue('\nBuild Report\n'));
      console.log(`Status: ${report.status.toUpperCase()}`);
      console.log(`Stages: ${report.summary.successfulStages}/${report.summary.totalStages} successful`);
      console.log(`Duration: ${(report.summary.totalDuration / 1000).toFixed(1)}s`);

      if (report.stages.length > 0) {
        console.log(chalk.blue('\nStages:'));
        for (const stage of report.stages) {
          const statusColor = stage.status === 'success' ? chalk.green : chalk.red;
          console.log(`  ${statusColor('●')} ${stage.name} (${(stage.duration / 1000).toFixed(1)}s)`);
        }
      }

      console.log();

    } catch (error) {
      spinner.fail(`Failed to get report: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

export default cicdCommand;
