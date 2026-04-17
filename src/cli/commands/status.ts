import { getLogger } from '../../utils/logger';
/**
 * Status命令 - 查看项目状态
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import { ConfigManager } from '../../core/config';
import { CLI_SYMBOLS } from '../../constants';
const logger = getLogger('cli/commands/status');

export function statusCommand(program: Command) {
  const statusProgram = program.command('status').description('查看项目状态和任务列表');

  // status list - 显示任务列表
  statusProgram
    .command('list')
    .description('显示任务列表')
    .option('--filter <condition>', '过滤条件 (status=xxx|priority=xxx)')
    .option('--sort <field>', '排序字段', 'created_at')
    .option('--format <format>', '输出格式 (table|json)', 'table')
    .option('--limit <number>', '显示数量限制', '50')
    .option('--output <path>', '任务文件目录', 'output')
    .action(async options => {
      try {
        await runStatusList(options);
      } catch (error) {
        logger.error(chalk.red('获取任务列表失败:'), error);
        process.exit(1);
      }
    });

  // status - 显示项目配置状态（原有功能）
  statusProgram
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

interface StatusOptions {
  json?: boolean;
  detailed?: boolean;
}

async function runStatus(options: StatusOptions) {
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

/**
 * 运行 status list 命令 - 显示任务列表
 */
async function runStatusList(options: {
  filter?: string;
  sort?: string;
  format?: string;
  limit?: string;
  output?: string;
}) {
  const spinner = ora('正在加载任务列表...').start();
  const outputDir = path.resolve(options.output || 'output');

  try {
    // 查找 output 目录中的任务文件
    if (!(await fs.pathExists(outputDir))) {
      spinner.fail(chalk.red('未找到任务文件目录，请先运行 "taskflow parse"'));
      return;
    }

    const files = await fs.readdir(outputDir);
    const taskFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('.'));

    if (taskFiles.length === 0) {
      spinner.fail(chalk.red('未找到任务文件，请先运行 "taskflow parse"'));
      return;
    }

    // 读取最新的任务文件
    const latestFile = taskFiles.sort().reverse()[0];
    const taskFilePath = path.join(outputDir, latestFile);
    const taskData = await fs.readJson(taskFilePath);

    spinner.succeed(chalk.green('任务加载成功'));

    const tasks = taskData.tasks || [];
    const document = taskData.document || {};

    // 过滤
    let filteredTasks = [...tasks];
    if (options.filter) {
      const [key, value] = options.filter.split('=');
      if (key && value) {
        filteredTasks = filteredTasks.filter((t: any) => t[key] === value);
      }
    }

    // 排序
    if (options.sort) {
      filteredTasks.sort((a: any, b: any) => {
        if (options.sort === 'priority') {
          const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
          return (
            (priorityOrder[String(b.priority)] || 0) - (priorityOrder[String(a.priority)] || 0)
          );
        }
        return 0;
      });
    }

    // 限制数量
    const limit = parseInt(options.limit || '50');
    filteredTasks = filteredTasks.slice(0, limit);

    // 输出
    if (options.format === 'json') {
      console.log(JSON.stringify(filteredTasks, null, 2));
      return;
    }

    // 表格输出
    console.log(chalk.cyan(`\n📋 任务列表 (${filteredTasks.length}/${tasks.length})\n`));
    console.log(chalk.gray('文档: ') + chalk.white(document.title || '未知'));
    console.log(chalk.gray('文件: ') + chalk.blue(latestFile));
    console.log();

    // 表头
    console.log(
      chalk.white('ID') +
        ' | ' +
        chalk.white('标题').padEnd(30) +
        ' | ' +
        chalk.white('状态').padEnd(12) +
        ' | ' +
        chalk.white('优先级').padEnd(8) +
        ' | ' +
        chalk.white('工时')
    );
    console.log(chalk.gray('-'.repeat(90)));

    // 任务行
    filteredTasks.forEach((task: any) => {
      const statusColors: Record<string, any> = {
        todo: chalk.yellow,
        in_progress: chalk.cyan,
        done: chalk.green,
        blocked: chalk.red,
      };
      const priorityColors: Record<string, any> = {
        high: chalk.red,
        medium: chalk.yellow,
        low: chalk.gray,
      };

      const id = task.id?.substring(0, 8) || 'N/A';
      const title = (task.title || '无标题').substring(0, 28);
      const status = task.status || 'todo';
      const priority = task.priority || 'medium';
      const hours = task.estimatedHours || 0;

      console.log(
        chalk.gray(id) +
          ' | ' +
          chalk.white(title).padEnd(30) +
          ' | ' +
          (statusColors[status] || chalk.white)(status.padEnd(12)) +
          ' | ' +
          (priorityColors[priority] || chalk.white)(priority.padEnd(8)) +
          ' | ' +
          chalk.blue(`${hours}h`)
      );
    });

    console.log(chalk.gray('\n💡 提示:'));
    console.log(chalk.gray('  - 使用 "taskflow status list --filter status=todo" 过滤任务'));
    console.log(chalk.gray('  - 使用 "taskflow status list --format json" JSON格式输出'));
  } catch (error) {
    spinner.fail('加载任务列表失败');
    throw error;
  }
}
