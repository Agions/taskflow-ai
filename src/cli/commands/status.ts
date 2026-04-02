import { getLogger } from '../../utils/logger';
/**
 * Status命令 - 查看项目状态
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ConfigManager } from '../../core/config';
import { CLI_SYMBOLS } from '../../constants';
const logger = getLogger('cli/commands/status');

export function statusCommand(program: Command) {
  program
    .command('status')
    .description('查看项目状态和统计信息')
    .option('--json', '以JSON格式输出')
    .option('--detailed', '显示详细信息')
    .action(async options => {
      try {
        await runStatus(options);
      } catch (error) {
        logger.error(chalk.red('获取状态失败:'), error);
        process.exit(1);
      }
    });
}

async function runStatus(options: any) {
  const spinner = ora('正在获取项目状态...').start();

  try {
    const configManager = new ConfigManager();
    const configStats = await configManager.getConfigStats();

    if (!configStats.hasConfig) {
      spinner.fail(chalk.red('未找到配置文件，请先运行 "taskflow init"'));
      return;
    }

    const config = await configManager.loadConfig();
    if (!config) {
      spinner.fail(chalk.red('配置文件加载失败'));
      return;
    }

    spinner.succeed(chalk.green('状态获取完成'));

    if (options.json) {
      console.log(
        JSON.stringify(
          {
            project: {
              name: config.projectName,
              version: config.version,
            },
            aiModels: {
              total: configStats.aiModelsCount,
              enabled: configStats.enabledModelsCount,
            },
            mcp: {
              enabled: configStats.mcpEnabled,
              port: config.mcpSettings.port,
            },
            lastModified: configStats.lastModified,
          },
          null,
          2
        )
      );
      return;
    }

    console.log(chalk.cyan('\n📊 项目状态报告\n'));

    console.log(chalk.white('📁 项目信息:'));
    console.log(chalk.gray('  项目名称: ') + chalk.blue(config.projectName || '未设置'));
    console.log(chalk.gray('  项目版本: ') + chalk.blue(config.version || '未设置'));
    console.log(
      chalk.gray('  最后修改: ') + chalk.white(configStats.lastModified?.toLocaleString() || '未知')
    );

    console.log(chalk.white('\n🤖 AI模型配置:'));
    console.log(chalk.gray('  已配置模型: ') + chalk.yellow(configStats.aiModelsCount));
    console.log(chalk.gray('  启用的模型: ') + chalk.green(configStats.enabledModelsCount));

    if (config.aiModels.length > 0) {
      console.log(chalk.gray('  模型列表:'));
      config.aiModels.forEach((model, index) => {
        const status = model.enabled ? chalk.green('●') : chalk.red('○');
        const priority = chalk.gray(`[优先级: ${model.priority}]`);
        console.log(
          chalk.gray(`    ${index + 1}. `) +
            status +
            ` ${model.provider} (${model.modelName}) ${priority}`
        );
      });
    }

    console.log(chalk.white('\n🔌 MCP服务器:'));
    console.log(
      chalk.gray('  状态: ') + (configStats.mcpEnabled ? chalk.green('启用') : chalk.red('禁用'))
    );
    if (configStats.mcpEnabled) {
      console.log(
        chalk.gray('  地址: ') +
          chalk.blue(`http://${config.mcpSettings.host}:${config.mcpSettings.port}`)
      );
      console.log(chalk.gray('  工具数量: ') + chalk.yellow(config.mcpSettings.tools.length));
      console.log(
        chalk.gray('  安全模式: ') +
          (config.mcpSettings.security.authRequired ? chalk.green('启用') : chalk.yellow('禁用'))
      );
    }

    if (options.detailed) {
      console.log(chalk.white('\n💻 系统信息:'));
      console.log(chalk.gray('  Node.js版本: ') + chalk.white(process.version));
      console.log(chalk.gray('  操作系统: ') + chalk.white(process.platform));
      console.log(chalk.gray('  工作目录: ') + chalk.white(process.cwd()));

      const memUsage = process.memoryUsage();
      console.log(
        chalk.gray('  内存使用: ') + chalk.white(`${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`)
      );
    }

    console.log(chalk.white('\n🏥 健康检查:'));

    const apiKeyValidation = await configManager.validateApiKeys();
    const validKeys = apiKeyValidation.filter(result => result.valid).length;
    const totalKeys = apiKeyValidation.length;

    if (totalKeys > 0) {
      const keyStatus = validKeys === totalKeys ? chalk.green('正常') : chalk.yellow('部分异常');
      console.log(
        chalk.gray('  API密钥: ') + keyStatus + chalk.gray(` (${validKeys}/${totalKeys})`)
      );

      if (validKeys < totalKeys) {
        apiKeyValidation
          .filter(result => !result.valid)
          .forEach(result => {
            console.log(
              chalk.gray(`    ${CLI_SYMBOLS.ERROR} ${result.provider}: `) + chalk.red(result.error)
            );
          });
      }
    } else {
      console.log(chalk.gray('  API密钥: ') + chalk.yellow('未配置'));
    }

    const configPath = configManager.getConfigPath();
    console.log(chalk.gray('  配置文件: ') + chalk.green('正常') + chalk.gray(` (${configPath})`));

    console.log(chalk.cyan('\n💡 建议操作:'));

    if (configStats.aiModelsCount === 0) {
      console.log(chalk.yellow('  • 配置AI模型以启用智能功能'));
    }

    if (!configStats.mcpEnabled) {
      console.log(chalk.yellow('  • 启用MCP服务器以支持编辑器集成'));
    }

    if (validKeys < totalKeys) {
      console.log(chalk.yellow('  • 检查并更新无效的API密钥'));
    }

    console.log(chalk.gray('\n使用 "taskflow --help" 查看所有可用命令'));
  } catch (error) {
    spinner.fail('获取状态失败');
    throw error;
  }
}
