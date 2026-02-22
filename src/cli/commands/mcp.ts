/**
 * MCP命令 - Model Context Protocol 服务器管理
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { MCPServer } from '../../mcp/server';
import { ConfigManager } from '../../core/config';

export function mcpCommand(program: Command) {
  const mcpCmd = program.command('mcp').description('MCP服务器管理');

  mcpCmd
    .command('start')
    .description('启动MCP服务器 (stdio模式，用于编辑器集成)')
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
      console.log(chalk.gray('  传输模式: ') + chalk.green('stdio (标准输入输出)'));
      console.log(chalk.gray('  兼容编辑器: ') + chalk.white('Trae, Cursor, Claude Desktop, Windsurf'));
      console.log(chalk.gray('  状态: ') + chalk.yellow('通过 taskflow mcp start 启动'));
    });

  mcpCmd
    .command('config')
    .description('显示MCP配置指南')
    .action(async () => {
      showMCPConfigGuide();
    });
}

async function startMCPServer(_options: any) {
  try {
    // 加载配置
    const configManager = new ConfigManager();
    const config = await configManager.loadConfig();

    if (!config) {
      console.error(chalk.red('未找到配置文件，请先运行 "taskflow init"'));
      process.exit(1);
    }

    // 创建MCP服务器设置
    const mcpSettings = {
      serverName: 'taskflow-ai',
      version: '2.0.0',
    };

    // 创建并启动MCP服务器
    const mcpServer = new MCPServer(mcpSettings, config);
    await mcpServer.start();

    // 服务器会持续运行直到进程结束
    // 不需要额外的进程监听，因为 server.start() 已经处理了
  } catch (error) {
    console.error(chalk.red('启动失败:'), error);
    throw error;
  }
}

function showMCPConfigGuide() {
  console.log(chalk.cyan('\n🔧 MCP 配置指南\n'));

  console.log(chalk.yellow('支持的编辑器:'));
  console.log(chalk.gray('  • Trae'));
  console.log(chalk.gray('  • Cursor'));
  console.log(chalk.gray('  • Claude Desktop'));
  console.log(chalk.gray('  • Windsurf\n'));

  console.log(chalk.yellow('配置方法:\n'));

  console.log(chalk.white('1. Trae 编辑器:'));
  console.log(chalk.gray('   打开设置 → MCP → 添加服务器'));
  console.log(chalk.gray('   或使用配置文件:'));
  console.log(chalk.blue(`   {
     "mcpServers": {
       "taskflow-ai": {
         "command": "npx",
         "args": ["-y", "taskflow-ai@latest", "mcp", "start"],
         "env": {
           "TASKFLOW_API_KEY": "your-api-key"
         }
       }
     }
   }`));

  console.log(chalk.white('\n2. Cursor 编辑器:'));
  console.log(chalk.gray('   打开 Cursor Settings → MCP'));
  console.log(chalk.gray('   点击 "Add New MCP Server"'));
  console.log(chalk.blue(`   Name: taskflow-ai
   Type: command
   Command: npx -y taskflow-ai@latest mcp start`));

  console.log(chalk.white('\n3. Claude Desktop:'));
  console.log(chalk.gray('   编辑配置文件:'));
  console.log(chalk.gray('   macOS: ~/Library/Application Support/Claude/claude_desktop_config.json'));
  console.log(chalk.gray('   Windows: %APPDATA%/Claude/claude_desktop_config.json'));
  console.log(chalk.blue(`   {
     "mcpServers": {
       "taskflow-ai": {
         "command": "npx",
         "args": ["-y", "taskflow-ai@latest", "mcp", "start"]
       }
     }
   }`));

  console.log(chalk.white('\n4. Windsurf:'));
  console.log(chalk.gray('   打开 Settings → Cascade → MCP'));
  console.log(chalk.blue(`   {
     "mcpServers": {
       "taskflow-ai": {
         "command": "npx",
         "args": ["-y", "taskflow-ai@latest", "mcp", "start"]
       }
     }
   }`));

  console.log(chalk.yellow('\n可用工具:'));
  console.log(chalk.gray('  • file_read - 读取文件内容'));
  console.log(chalk.gray('  • file_write - 写入文件内容'));
  console.log(chalk.gray('  • shell_exec - 执行Shell命令'));
  console.log(chalk.gray('  • project_analyze - 分析项目结构'));
  console.log(chalk.gray('  • task_create - 创建新任务\n'));

  console.log(chalk.yellow('本地开发测试:'));
  console.log(chalk.gray('  npm run build'));
  console.log(chalk.gray('  npm run mcp\n'));
}
