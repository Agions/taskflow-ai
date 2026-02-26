/**
 * Init命令 - 初始化TaskFlow项目
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import { TaskFlowConfig, AIProvider, AIModelConfig } from '../../types';
import { CONFIG_DIR, CONFIG_FILE, DEFAULT_CONFIG, AI_PROVIDERS } from '../../constants';

export function initCommand(program: Command) {
  program
    .command('init')
    .description('初始化TaskFlow项目')
    .option('-f, --force', '强制覆盖现有配置')
    .option('--skip-ai', '跳过AI模型配置')
    .option('--template <name>', '使用预定义模板')
    .action(async options => {
      try {
        await runInit(options);
      } catch (error) {
        console.error(chalk.red('初始化失败:'), error);
        process.exit(1);
      }
    });
}

async function runInit(options: any) {
  const spinner = ora('正在初始化TaskFlow项目...').start();

  try {
    const configPath = path.join(process.cwd(), CONFIG_DIR, CONFIG_FILE);
    const configExists = await fs.pathExists(configPath);

    if (configExists && !options.force) {
      spinner.stop();
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: '检测到现有配置，是否覆盖？',
          default: false,
        },
      ]);

      if (!overwrite) {
        console.log(chalk.yellow('初始化已取消'));
        return;
      }
      spinner.start('正在重新初始化...');
    }

    spinner.stop();
    const projectInfo = await collectProjectInfo();
    spinner.start('正在配置项目...');

    let aiModels: AIModelConfig[] = [];
    if (!options.skipAi) {
      spinner.stop();
      aiModels = await configureAIModels();
      spinner.start('正在保存配置...');
    }

    const config: TaskFlowConfig = {
      ...DEFAULT_CONFIG,
      projectName: projectInfo.projectName,
      version: projectInfo.version,
      aiModels,
    };

    await createProjectStructure(config);

    await saveConfig(config);

    await createExampleFiles();

    spinner.succeed(chalk.green('项目初始化完成！'));

    showNextSteps(config);
  } catch (error) {
    spinner.fail('初始化失败');
    throw error;
  }
}

async function collectProjectInfo() {
  const currentDir = path.basename(process.cwd());

  return await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: '项目名称:',
      default: currentDir,
      validate: input => {
        if (!input.trim()) {
          return '项目名称不能为空';
        }
        if (!/^[a-zA-Z0-9-_\s]+$/.test(input)) {
          return '项目名称只能包含字母、数字、下划线和连字符';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'version',
      message: '项目版本:',
      default: '1.0.0',
      validate: input => {
        if (!/^\d+\.\d+\.\d+$/.test(input)) {
          return '请输入有效的语义化版本号 (如: 1.0.0)';
        }
        return true;
      },
    },
    {
      type: 'list',
      name: 'methodology',
      message: '开发方法论:',
      choices: [
        { name: '敏捷开发 (Agile)', value: 'agile' },
        { name: '瀑布模型 (Waterfall)', value: 'waterfall' },
        { name: '精益创业 (Lean)', value: 'lean' },
      ],
      default: 'agile',
    },
  ]);
}

async function configureAIModels() {
  console.log(chalk.cyan('\n🤖 配置AI模型'));
  console.log(chalk.gray('选择并配置您要使用的AI模型提供商:\n'));

  const { selectedProviders } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedProviders',
      message: '选择AI模型提供商:',
      choices: [
        { name: '深度求索 (DeepSeek) - 推荐', value: AI_PROVIDERS.DEEPSEEK, checked: true },
        { name: '智谱AI (GLM)', value: AI_PROVIDERS.ZHIPU },
        { name: '通义千问 (Qwen)', value: AI_PROVIDERS.QWEN },
        { name: '文心一言 (ERNIE)', value: AI_PROVIDERS.BAIDU },
        { name: '月之暗面 (Moonshot)', value: AI_PROVIDERS.MOONSHOT },
        { name: '讯飞星火 (Spark)', value: AI_PROVIDERS.SPARK },
        { name: 'OpenAI GPT', value: AI_PROVIDERS.OPENAI },
        { name: 'Claude', value: AI_PROVIDERS.CLAUDE },
      ],
      validate: input => {
        if (input.length === 0) {
          return '请至少选择一个AI模型提供商';
        }
        return true;
      },
    },
  ]);

  const aiModels = [];
  for (const provider of selectedProviders) {
    console.log(chalk.blue(`\n配置 ${getProviderName(provider)}:`));

    const modelConfig: any = await inquirer.prompt([
      {
        type: 'input',
        name: 'apiKey',
        message: 'API密钥:',
        validate: input => {
          if (!input.trim()) {
            return 'API密钥不能为空';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'modelName',
        message: '模型名称:',
        default: getDefaultModelName(provider),
        validate: input => {
          if (!input.trim()) {
            return '模型名称不能为空';
          }
          return true;
        },
      },
      {
        type: 'list',
        name: 'priority',
        message: '优先级:',
        choices: [
          { name: '高优先级', value: 1 },
          { name: '中优先级', value: 2 },
          { name: '低优先级', value: 3 },
        ],
        default: aiModels.length === 0 ? 1 : 2,
      },
    ]);

    aiModels.push({
      provider,
      modelName: modelConfig.modelName,
      apiKey: modelConfig.apiKey,
      priority: modelConfig.priority,
      enabled: true,
      maxTokens: 4000,
      temperature: 0.7,
    });
  }

  return aiModels;
}

async function createProjectStructure(_config: TaskFlowConfig) {
  const baseDir = process.cwd();
  const dirs = [
    CONFIG_DIR,
    path.join(CONFIG_DIR, 'cache'),
    path.join(CONFIG_DIR, 'logs'),
    path.join(CONFIG_DIR, 'templates'),
    path.join(CONFIG_DIR, 'plugins'),
    'docs',
    'output',
    'reports',
  ];

  for (const dir of dirs) {
    await fs.ensureDir(path.join(baseDir, dir));
  }
}

async function saveConfig(config: TaskFlowConfig) {
  const configPath = path.join(process.cwd(), CONFIG_DIR, CONFIG_FILE);
  await fs.writeJson(configPath, config, { spaces: 2 });
}

async function createExampleFiles() {
  const examplePRD = `# 示例PRD文档

## 项目概述
这是一个示例的产品需求文档，用于演示TaskFlow AI的功能。

## 功能需求

### 1. 用户管理
- 用户注册
- 用户登录
- 用户信息管理

### 2. 数据管理
- 数据录入
- 数据查询
- 数据导出

## 验收标准
- [ ] 用户可以成功注册账号
- [ ] 用户可以使用正确的凭据登录
- [ ] 系统可以正确存储和检索用户数据
`;

  const examplePath = path.join(process.cwd(), 'docs', 'example-prd.md');
  await fs.writeFile(examplePath, examplePRD);

  const readme = `# ${DEFAULT_CONFIG.projectName || 'TaskFlow Project'}

这个项目使用 TaskFlow AI 进行管理和开发。

## 快速开始

1. 解析PRD文档:
   \`\`\`bash
   taskflow parse docs/example-prd.md
   \`\`\`

2. 查看项目状态:
   \`\`\`bash
   taskflow status
   \`\`\`

3. 生成可视化报告:
   \`\`\`bash
   taskflow visualize
   \`\`\`

4. 启动MCP服务器:
   \`\`\`bash
   taskflow mcp start
   \`\`\`

## 更多信息

- [TaskFlow AI 文档](https://github.com/Agions/taskflow-ai)
- [配置文件](.taskflow/config.json)
`;

  await fs.writeFile(path.join(process.cwd(), 'README.md'), readme);
}

function showNextSteps(config: TaskFlowConfig) {
  console.log(chalk.cyan('\n🎉 项目初始化完成！\n'));

  console.log(chalk.white('接下来您可以:'));
  console.log(chalk.gray('  1. 编辑示例PRD文档: docs/example-prd.md'));
  console.log(chalk.gray('  2. 解析PRD文档: ') + chalk.blue('taskflow parse docs/example-prd.md'));
  console.log(chalk.gray('  3. 查看项目状态: ') + chalk.blue('taskflow status'));
  console.log(chalk.gray('  4. 生成可视化报告: ') + chalk.blue('taskflow visualize'));

  if (config.aiModels.length > 0) {
    console.log(chalk.gray('  5. 启动MCP服务器: ') + chalk.blue('taskflow mcp start'));
  }

  console.log(chalk.gray('\n配置文件位置: ') + chalk.blue(path.join(CONFIG_DIR, CONFIG_FILE)));
  console.log(chalk.gray('文档目录: ') + chalk.blue('docs/'));
  console.log(chalk.gray('输出目录: ') + chalk.blue('output/'));

  console.log(chalk.yellow('\n💡 提示: 使用 "taskflow --help" 查看所有可用命令'));
}

function getProviderName(provider: AIProvider): string {
  const names = {
    [AI_PROVIDERS.DEEPSEEK]: '深度求索 (DeepSeek)',
    [AI_PROVIDERS.ZHIPU]: '智谱AI (GLM)',
    [AI_PROVIDERS.QWEN]: '通义千问 (Qwen)',
    [AI_PROVIDERS.BAIDU]: '文心一言 (ERNIE)',
    [AI_PROVIDERS.MOONSHOT]: '月之暗面 (Moonshot)',
    [AI_PROVIDERS.SPARK]: '讯飞星火 (Spark)',
    [AI_PROVIDERS.OPENAI]: 'OpenAI GPT',
    [AI_PROVIDERS.CLAUDE]: 'Claude',
  };
  return names[provider] || provider;
}

function getDefaultModelName(provider: AIProvider): string {
  const defaults = {
    [AI_PROVIDERS.DEEPSEEK]: 'deepseek-chat',
    [AI_PROVIDERS.ZHIPU]: 'glm-4',
    [AI_PROVIDERS.QWEN]: 'qwen-turbo',
    [AI_PROVIDERS.BAIDU]: 'ernie-4.0-8k',
    [AI_PROVIDERS.MOONSHOT]: 'moonshot-v1-8k',
    [AI_PROVIDERS.SPARK]: 'generalv3.5',
    [AI_PROVIDERS.OPENAI]: 'gpt-4',
    [AI_PROVIDERS.CLAUDE]: 'claude-3-sonnet-20240229',
  };
  return defaults[provider] || 'default';
}
