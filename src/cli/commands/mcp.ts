/**
 * MCP命令 - Model Context Protocol 服务器管理 (简化版本)
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { MCPServer } from '../../mcp/server';
import { ConfigManager } from '../../core/config';

export function mcpCommand(program: Command) {
  const mcpCmd = program.command('mcp').description('MCP服务器管理');

  mcpCmd
    .command('start')
    .description('启动MCP服务器')
    .option('-p, --port <port>', '服务器端口', '3000')
    .option('-h, --host <host>', '服务器主机', 'localhost')
    .option('--verbose', '显示详细日志')
    .action(async options => {
      try {
        await startMCPServer(options);
      } catch (error) {
        console.error(chalk.red('启动MCP服务器失败:'), error);
        process.exit(1);
      }
    });

  mcpCmd
    .command('status')
    .description('查看MCP服务器状态')
    .action(async () => {
      console.log(chalk.cyan('📊 MCP服务器状态:'));
      console.log(chalk.gray('  状态: ') + chalk.yellow('功能开发中'));
      console.log(chalk.yellow('💡 完整的MCP功能即将在下个版本中提供'));
    });

  mcpCmd
    .command('config')
    .description('配置MCP服务器')
    .action(async () => {
      console.log(chalk.blue('🔧 MCP配置管理'));
      console.log(chalk.yellow('💡 配置功能开发中，即将在下个版本中提供'));
    });
}

async function startMCPServer(options: any) {
  const spinner = ora('正在启动MCP服务器...').start();

  try {
    // 加载配置
    const configManager = new ConfigManager();
    const config = await configManager.loadConfig();

    if (!config) {
      spinner.fail(chalk.red('未找到配置文件，请先运行 "taskflow init"'));
      return;
    }

    // 创建MCP服务器设置
    const mcpSettings = {
      port: parseInt(options.port) || 3000,
      host: options.host || 'localhost',
      serverName: 'taskflow-ai',
      version: '1.0.0',
    };

    // 创建并启动MCP服务器
    const mcpServer = new MCPServer(mcpSettings, config);
    await mcpServer.start();

    spinner.succeed(chalk.green('MCP服务器启动成功！'));

    // 显示服务器信息
    console.log(chalk.cyan('\n🚀 MCP服务器信息:'));
    console.log(
      chalk.gray('  服务器地址: ') + chalk.blue(`http://${mcpSettings.host}:${mcpSettings.port}`)
    );
    console.log(chalk.gray('  服务器名称: ') + chalk.white(mcpSettings.serverName));
    console.log(chalk.gray('  版本: ') + chalk.white(mcpSettings.version));

    // 显示使用说明
    console.log(chalk.cyan('\n🔌 使用说明:'));
    console.log(
      chalk.gray('  1. 访问健康检查: ') +
        chalk.blue(`http://${mcpSettings.host}:${mcpSettings.port}/health`)
    );
    console.log(
      chalk.gray('  2. 查看服务信息: ') +
        chalk.blue(`http://${mcpSettings.host}:${mcpSettings.port}/info`)
    );
    console.log(chalk.gray('  3. 按 Ctrl+C 停止服务器'));

    // 监听进程退出
    process.on('SIGINT', async () => {
      console.log(chalk.yellow('\n正在关闭MCP服务器...'));
      await mcpServer.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await mcpServer.stop();
      process.exit(0);
    });
  } catch (error) {
    spinner.fail('启动失败');
    throw error;
  }
}
