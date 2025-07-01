import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { ConfigManager } from '../infra/config';
import { ModelType } from '../types/config';
import { ModelFactory } from '../core/models/factory';

/**
 * 配置命令
 * @param program Commander实例
 */
export default function configCommand(program: Command): void {
  const config = program
    .command('config')
    .description('管理MCP配置');

  // 设置配置
  config
    .command('set <key> <value>')
    .description('设置配置项的值')
    .option('-g, --global', '设置全局配置')
    .action(async (key, value, options) => {
      try {
        const configManager = new ConfigManager();
        const isProjectLevel = !options.global;
        
        configManager.set(key, value, isProjectLevel);
        console.log(chalk.green(`已${isProjectLevel ? '项目' : '全局'}配置 ${key}=${value}`));
      } catch (error) {
        console.error(chalk.red(`设置配置项失败: ${(error as Error).message}`));
        if (program.opts().debug) {
          console.error(error);
        }
      }
    });

  // 获取配置
  config
    .command('get <key>')
    .description('获取配置项的值')
    .action(async (key) => {
      try {
        const configManager = new ConfigManager();
        const value = configManager.get(key);
        
        if (value === undefined) {
          console.log(chalk.yellow(`配置项 ${key} 未设置`));
        } else {
          console.log(`${key} = ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}`);
        }
      } catch (error) {
        console.error(chalk.red(`获取配置项失败: ${(error as Error).message}`));
        if (program.opts().debug) {
          console.error(error);
        }
      }
    });

  // 列出所有配置
  config
    .command('list')
    .description('列出所有配置')
    .option('-g, --global', '只显示全局配置')
    .option('-p, --project', '只显示项目配置')
    .action(async (options) => {
      try {
        const configManager = new ConfigManager();
        const config = configManager.getConfig();
        
        console.log(chalk.cyan('MCP 配置:'));
        console.log(JSON.stringify(config, null, 2));
        
        console.log(chalk.cyan('\n配置文件路径:'));
        if (!options.project) {
          console.log(chalk.blue(`全局: ${configManager.getConfigPath(false)}`));
        }
        if (!options.global) {
          const projectPath = configManager.getConfigPath(true);
          if (projectPath) {
            console.log(chalk.blue(`项目: ${projectPath}`));
          } else {
            console.log(chalk.yellow('项目配置文件不存在'));
          }
        }
      } catch (error) {
        console.error(chalk.red(`列出配置失败: ${(error as Error).message}`));
        if (program.opts().debug) {
          console.error(error);
        }
      }
    });

  // 初始化模型API密钥
  config
    .command('init-model-api')
    .description('初始化模型API密钥配置')
    .option('-g, --global', '设置全局配置')
    .action(async (options) => {
      try {
        const configManager = new ConfigManager();
        const isProjectLevel = !options.global;
        
        console.log(chalk.cyan(`开始配置${isProjectLevel ? '项目' : '全局'}模型API密钥...`));
        
        // 选择要配置的模型
        const { modelType } = await inquirer.prompt([
          {
            type: 'list',
            name: 'modelType',
            message: '请选择要配置的模型:',
            choices: [
              { name: '百度文心大模型', value: ModelType.BAIDU },
              { name: '讯飞星火大模型', value: ModelType.XUNFEI },
              { name: '智谱AI大模型', value: ModelType.ZHIPU },
            ],
          },
        ]);
        
        if (modelType === ModelType.BAIDU) {
          // 配置百度文心大模型
          const { apiKey, secretKey, modelVersion } = await inquirer.prompt([
            {
              type: 'input',
              name: 'apiKey',
              message: '请输入百度文心API Key:',
              validate: (input) => input.trim() !== '' ? true : 'API Key不能为空',
            },
            {
              type: 'input',
              name: 'secretKey',
              message: '请输入百度文心Secret Key:',
              validate: (input) => input.trim() !== '' ? true : 'Secret Key不能为空',
            },
            {
              type: 'input',
              name: 'modelVersion',
              message: '请输入百度文心模型版本(默认ernie-bot-4):',
              default: 'ernie-bot-4',
            },
          ]);
          
          configManager.set(`models.${ModelType.BAIDU}.apiKey`, apiKey.trim(), isProjectLevel);
          configManager.set(`models.${ModelType.BAIDU}.secretKey`, secretKey.trim(), isProjectLevel);
          configManager.set(`models.${ModelType.BAIDU}.modelVersion`, modelVersion.trim(), isProjectLevel);
          configManager.set('models.default', ModelType.BAIDU, isProjectLevel);
          
          console.log(chalk.green('百度文心大模型配置已保存'));
          
          // 验证API密钥
          console.log(chalk.cyan('正在验证API密钥...'));
          
          try {
            const modelFactory = new ModelFactory(configManager);
            const isValid = await modelFactory.validateModelApiKey(ModelType.BAIDU);
            
            if (isValid) {
              console.log(chalk.green('API密钥验证成功！'));
            } else {
              console.log(chalk.yellow('API密钥验证失败，请检查您的密钥是否正确'));
            }
          } catch (error) {
            console.error(chalk.yellow(`API密钥验证失败: ${(error as Error).message}`));
          }
        } else if (modelType === ModelType.XUNFEI) {
          // TODO: 配置讯飞星火大模型
          console.log(chalk.yellow('讯飞星火大模型配置暂未实现'));
        } else if (modelType === ModelType.ZHIPU) {
          // TODO: 配置智谱AI大模型
          console.log(chalk.yellow('智谱AI大模型配置暂未实现'));
        }
      } catch (error) {
        console.error(chalk.red(`配置模型API密钥失败: ${(error as Error).message}`));
        if (program.opts().debug) {
          console.error(error);
        }
      }
    });

  // 重置配置
  config
    .command('reset')
    .description('重置配置为默认值')
    .option('-g, --global', '重置全局配置')
    .option('-p, --project', '重置项目配置')
    .option('-f, --force', '强制重置，不提示确认')
    .action(async (options) => {
      try {
        // 确认重置
        if (!options.force) {
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `确定要重置${options.global ? '全局' : options.project ? '项目' : '所有'}配置吗?`,
              default: false,
            },
          ]);
          
          if (!confirm) {
            console.log(chalk.yellow('重置操作已取消'));
            return;
          }
        }
        
        const configManager = new ConfigManager();
        
        if (options.global) {
          configManager.reset(false);
          console.log(chalk.green('全局配置已重置为默认值'));
        } else if (options.project) {
          configManager.reset(true);
          console.log(chalk.green('项目配置已重置为默认值'));
        } else {
          configManager.reset(false);
          configManager.reset(true);
          console.log(chalk.green('所有配置已重置为默认值'));
        }
      } catch (error) {
        console.error(chalk.red(`重置配置失败: ${(error as Error).message}`));
        if (program.opts().debug) {
          console.error(error);
        }
      }
    });
} 