/**
 * 初始化运行器
 */

import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { TaskFlowConfig } from '../../../types';
import { CONFIG_DIR, CONFIG_FILE, DEFAULT_CONFIG } from '../../../constants';
import { collectProjectInfo } from './project';
import { configureAIModels } from './ai-models';
import { createProjectStructure, saveConfig, createExampleFiles } from './structure';
import { showNextSteps } from './output';

interface InitOptions {
  force?: boolean;
  skipAi?: boolean;
  template?: string;
}

/**
 * 运行初始化
 */
export async function runInit(options: InitOptions): Promise<void> {
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

    let aiModels: TaskFlowConfig['aiModels'] = [];
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
    await createExampleFiles(config.projectName);

    spinner.succeed(chalk.green('项目初始化完成！'));
    showNextSteps(config);
  } catch (error) {
    spinner.fail('初始化失败');
    throw error;
  }
}
