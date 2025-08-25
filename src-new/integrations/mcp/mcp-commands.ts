/**
 * TaskFlow AI MCP 服务器管理命令
 * 提供统一的CLI命令来管理MCP服务器和工具
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import Table from 'cli-table3';
import { MCPServerManager } from './server-manager';
import { MCPConfigManager } from './mcp-config-manager';
import { MCPToolRegistry } from './tool-registry';
import { ConfigManager } from '../../infrastructure/config/manager';
import { CacheManager } from '../../infrastructure/storage/cache';

export interface MCPCommandOptions {
  verbose?: boolean;
  config?: string;
  output?: 'json' | 'table' | 'yaml';
  filter?: string;
  force?: boolean;
}

/**
 * MCP服务器管理命令系统
 */
export class MCPCommands {
  private serverManager: MCPServerManager;
  private configManager: MCPConfigManager;
  private toolRegistry: MCPToolRegistry;
  private program: Command;

  constructor() {
    this.program = new Command();
    this.setupCommands();
  }

  /**
   * 初始化命令系统
   */
  async initialize(): Promise<void> {
    try {
      // 初始化管理器
      const baseConfigManager = new ConfigManager({
        models: {},
        storage: { type: 'filesystem' },
        security: {},
        cache: {},
        memory: {},
      });

      const cacheManager = new CacheManager({});
      
      this.configManager = new MCPConfigManager(baseConfigManager);
      this.toolRegistry = new MCPToolRegistry(baseConfigManager, cacheManager);
      this.serverManager = new MCPServerManager(this.configManager, this.toolRegistry);

      await this.configManager.initialize();
      await this.toolRegistry.initialize();
      await this.serverManager.initialize();

      console.log(chalk.green('✅ MCP命令系统初始化完成'));

    } catch (error) {
      console.error(chalk.red('❌ MCP命令系统初始化失败:'), error);
      throw error;
    }
  }

  /**
   * 设置所有命令
   */
  private setupCommands(): void {
    this.program
      .name('taskflow-mcp')
      .description('TaskFlow AI MCP服务器管理工具')
      .version('2.0.0')
      .option('-v, --verbose', '详细输出')
      .option('-c, --config <path>', '配置文件路径')
      .option('-o, --output <format>', '输出格式 (json|table|yaml)', 'table');

    this.setupServerCommands();
    this.setupToolCommands();
    this.setupConfigCommands();
    this.setupMonitoringCommands();
  }

  /**
   * 设置服务器管理命令
   */
  private setupServerCommands(): void {
    const serverCmd = this.program.command('server').description('MCP服务器管理');

    // 列出服务器
    serverCmd
      .command('list')
      .alias('ls')
      .description('列出所有MCP服务器')
      .option('-f, --filter <pattern>', '过滤服务器')
      .action(async (options) => {
        await this.listServers(options);
      });

    // 启动服务器
    serverCmd
      .command('start <serverId>')
      .description('启动MCP服务器')
      .action(async (serverId, options) => {
        await this.startServer(serverId, options);
      });

    // 停止服务器
    serverCmd
      .command('stop <serverId>')
      .description('停止MCP服务器')
      .action(async (serverId, options) => {
        await this.stopServer(serverId, options);
      });

    // 重启服务器
    serverCmd
      .command('restart <serverId>')
      .description('重启MCP服务器')
      .action(async (serverId, options) => {
        await this.restartServer(serverId, options);
      });

    // 查看服务器状态
    serverCmd
      .command('status [serverId]')
      .description('查看服务器状态')
      .action(async (serverId, options) => {
        await this.showServerStatus(serverId, options);
      });

    // 查看服务器日志
    serverCmd
      .command('logs <serverId>')
      .description('查看服务器日志')
      .option('-f, --follow', '跟踪日志')
      .option('-n, --lines <number>', '显示行数', '50')
      .action(async (serverId, options) => {
        await this.showServerLogs(serverId, options);
      });

    // 添加服务器
    serverCmd
      .command('add')
      .description('添加新的MCP服务器')
      .action(async (options) => {
        await this.addServer(options);
      });

    // 删除服务器
    serverCmd
      .command('remove <serverId>')
      .alias('rm')
      .description('删除MCP服务器')
      .option('--force', '强制删除')
      .action(async (serverId, options) => {
        await this.removeServer(serverId, options);
      });
  }

  /**
   * 设置工具管理命令
   */
  private setupToolCommands(): void {
    const toolCmd = this.program.command('tool').description('MCP工具管理');

    // 列出工具
    toolCmd
      .command('list')
      .alias('ls')
      .description('列出所有可用工具')
      .option('-c, --category <category>', '按类别过滤')
      .action(async (options) => {
        await this.listTools(options);
      });

    // 搜索工具
    toolCmd
      .command('search <query>')
      .description('搜索工具')
      .action(async (query, options) => {
        await this.searchTools(query, options);
      });

    // 安装工具
    toolCmd
      .command('install <toolPath>')
      .description('安装MCP工具')
      .action(async (toolPath, options) => {
        await this.installTool(toolPath, options);
      });

    // 卸载工具
    toolCmd
      .command('uninstall <toolId>')
      .description('卸载MCP工具')
      .action(async (toolId, options) => {
        await this.uninstallTool(toolId, options);
      });

    // 启用/禁用工具
    toolCmd
      .command('enable <toolId>')
      .description('启用工具')
      .action(async (toolId, options) => {
        await this.enableTool(toolId, options);
      });

    toolCmd
      .command('disable <toolId>')
      .description('禁用工具')
      .action(async (toolId, options) => {
        await this.disableTool(toolId, options);
      });

    // 工具信息
    toolCmd
      .command('info <toolId>')
      .description('查看工具详细信息')
      .action(async (toolId, options) => {
        await this.showToolInfo(toolId, options);
      });

    // 工具统计
    toolCmd
      .command('stats')
      .description('查看工具使用统计')
      .action(async (options) => {
        await this.showToolStats(options);
      });
  }

  /**
   * 设置配置管理命令
   */
  private setupConfigCommands(): void {
    const configCmd = this.program.command('config').description('配置管理');

    // 显示配置
    configCmd
      .command('show')
      .description('显示当前配置')
      .action(async (options) => {
        await this.showConfig(options);
      });

    // 编辑配置
    configCmd
      .command('edit')
      .description('编辑配置文件')
      .action(async (options) => {
        await this.editConfig(options);
      });

    // 验证配置
    configCmd
      .command('validate')
      .description('验证配置文件')
      .action(async (options) => {
        await this.validateConfig(options);
      });

    // 重置配置
    configCmd
      .command('reset')
      .description('重置配置到默认值')
      .option('--force', '强制重置')
      .action(async (options) => {
        await this.resetConfig(options);
      });

    // 导入/导出配置
    configCmd
      .command('export <file>')
      .description('导出配置到文件')
      .action(async (file, options) => {
        await this.exportConfig(file, options);
      });

    configCmd
      .command('import <file>')
      .description('从文件导入配置')
      .action(async (file, options) => {
        await this.importConfig(file, options);
      });
  }

  /**
   * 设置监控命令
   */
  private setupMonitoringCommands(): void {
    const monitorCmd = this.program.command('monitor').description('监控和诊断');

    // 健康检查
    monitorCmd
      .command('health')
      .description('执行健康检查')
      .action(async (options) => {
        await this.healthCheck(options);
      });

    // 系统状态
    monitorCmd
      .command('status')
      .description('显示系统整体状态')
      .action(async (options) => {
        await this.showSystemStatus(options);
      });

    // 性能指标
    monitorCmd
      .command('metrics')
      .description('显示性能指标')
      .action(async (options) => {
        await this.showMetrics(options);
      });

    // 诊断问题
    monitorCmd
      .command('diagnose')
      .description('诊断系统问题')
      .action(async (options) => {
        await this.diagnoseSystem(options);
      });
  }

  // 命令实现方法

  /**
   * 列出服务器
   */
  private async listServers(options: any): Promise<void> {
    try {
      const servers = this.serverManager.getAllServerStatuses();
      
      if (options.output === 'json') {
        console.log(JSON.stringify(servers, null, 2));
        return;
      }

      const table = new Table({
        head: ['ID', '名称', '状态', '类型', '工具数', '运行时间', '最后检查'],
        colWidths: [20, 25, 12, 10, 8, 15, 20],
      });

      servers.forEach(server => {
        const uptime = server.uptime > 0 ? this.formatDuration(server.uptime) : '-';
        const lastCheck = server.healthCheck.lastCheck.toLocaleString();
        const statusColor = this.getStatusColor(server.status);
        
        table.push([
          server.id,
          server.name,
          statusColor(server.status),
          server.isRemote ? 'Remote' : 'Local',
          server.tools.length.toString(),
          uptime,
          lastCheck,
        ]);
      });

      console.log(table.toString());
      console.log(chalk.gray(`\n总共 ${servers.length} 个服务器`));

    } catch (error) {
      console.error(chalk.red('❌ 列出服务器失败:'), error);
    }
  }

  /**
   * 启动服务器
   */
  private async startServer(serverId: string, options: any): Promise<void> {
    try {
      console.log(chalk.blue(`🚀 正在启动服务器: ${serverId}`));
      
      const config = this.configManager.getServerConfig(serverId);
      if (!config) {
        throw new Error(`服务器配置不存在: ${serverId}`);
      }

      await this.serverManager.startServer(serverId, config);
      console.log(chalk.green(`✅ 服务器 ${serverId} 启动成功`));

    } catch (error) {
      console.error(chalk.red(`❌ 启动服务器 ${serverId} 失败:`), error);
    }
  }

  /**
   * 停止服务器
   */
  private async stopServer(serverId: string, options: any): Promise<void> {
    try {
      console.log(chalk.blue(`🛑 正在停止服务器: ${serverId}`));
      
      await this.serverManager.stopServer(serverId);
      console.log(chalk.green(`✅ 服务器 ${serverId} 已停止`));

    } catch (error) {
      console.error(chalk.red(`❌ 停止服务器 ${serverId} 失败:`), error);
    }
  }

  /**
   * 重启服务器
   */
  private async restartServer(serverId: string, options: any): Promise<void> {
    try {
      console.log(chalk.blue(`🔄 正在重启服务器: ${serverId}`));
      
      await this.serverManager.restartServer(serverId);
      console.log(chalk.green(`✅ 服务器 ${serverId} 重启成功`));

    } catch (error) {
      console.error(chalk.red(`❌ 重启服务器 ${serverId} 失败:`), error);
    }
  }

  /**
   * 显示服务器状态
   */
  private async showServerStatus(serverId?: string, options?: any): Promise<void> {
    try {
      if (serverId) {
        const status = this.serverManager.getServerStatus(serverId);
        if (!status) {
          console.error(chalk.red(`❌ 服务器不存在: ${serverId}`));
          return;
        }

        if (options?.output === 'json') {
          console.log(JSON.stringify(status, null, 2));
          return;
        }

        console.log(chalk.bold(`\n📊 服务器状态: ${serverId}`));
        console.log(`名称: ${status.name}`);
        console.log(`状态: ${this.getStatusColor(status.status)(status.status)}`);
        console.log(`类型: ${status.isRemote ? 'Remote' : 'Local'}`);
        console.log(`运行时间: ${this.formatDuration(status.uptime)}`);
        console.log(`重启次数: ${status.restartCount}`);
        console.log(`工具数量: ${status.tools.length}`);
        console.log(`资源数量: ${status.resources.length}`);
        
        if (status.healthCheck) {
          console.log(`健康状态: ${status.healthCheck.healthy ? '✅ 健康' : '❌ 异常'}`);
          console.log(`响应时间: ${status.healthCheck.responseTime}ms`);
          console.log(`最后检查: ${status.healthCheck.lastCheck.toLocaleString()}`);
        }

        if (status.lastError) {
          console.log(chalk.red(`最后错误: ${status.lastError}`));
        }

      } else {
        await this.listServers(options);
      }

    } catch (error) {
      console.error(chalk.red('❌ 显示服务器状态失败:'), error);
    }
  }

  /**
   * 列出工具
   */
  private async listTools(options: any): Promise<void> {
    try {
      const tools = this.toolRegistry.getAllTools();
      
      if (options.output === 'json') {
        console.log(JSON.stringify(tools, null, 2));
        return;
      }

      const table = new Table({
        head: ['ID', '名称', '类别', '类型', '状态', '版本', '使用次数'],
        colWidths: [25, 30, 15, 12, 12, 10, 10],
      });

      tools.forEach(tool => {
        const statusColor = this.getStatusColor(tool.status);
        
        table.push([
          tool.id,
          tool.name,
          tool.category,
          tool.type,
          statusColor(tool.status),
          tool.version,
          tool.usageCount.toString(),
        ]);
      });

      console.log(table.toString());
      console.log(chalk.gray(`\n总共 ${tools.length} 个工具`));

    } catch (error) {
      console.error(chalk.red('❌ 列出工具失败:'), error);
    }
  }

  /**
   * 显示系统状态
   */
  private async showSystemStatus(options: any): Promise<void> {
    try {
      const serverStats = this.serverManager.getAllServerStatuses();
      const toolStats = this.toolRegistry.getToolStats();
      
      if (options.output === 'json') {
        console.log(JSON.stringify({ servers: serverStats, tools: toolStats }, null, 2));
        return;
      }

      console.log(chalk.bold('\n📊 TaskFlow AI MCP 系统状态\n'));
      
      // 服务器统计
      const runningServers = serverStats.filter(s => s.status === 'running').length;
      const errorServers = serverStats.filter(s => s.status === 'error').length;
      
      console.log(chalk.blue('🖥️  服务器统计:'));
      console.log(`  总数: ${serverStats.length}`);
      console.log(`  运行中: ${chalk.green(runningServers)}`);
      console.log(`  错误: ${errorServers > 0 ? chalk.red(errorServers) : errorServers}`);
      console.log(`  停止: ${serverStats.length - runningServers - errorServers}`);
      
      // 工具统计
      console.log(chalk.blue('\n🔧 工具统计:'));
      console.log(`  总数: ${toolStats.totalTools}`);
      console.log(`  已启用: ${chalk.green(toolStats.enabledTools)}`);
      console.log(`  内置工具: ${toolStats.byType.builtin || 0}`);
      console.log(`  已安装: ${toolStats.byType.installed || 0}`);
      
      // 类别分布
      console.log(chalk.blue('\n📂 工具类别分布:'));
      Object.entries(toolStats.byCategory).forEach(([category, count]) => {
        console.log(`  ${category}: ${count}`);
      });

      // 最常用工具
      if (toolStats.mostUsed.length > 0) {
        console.log(chalk.blue('\n⭐ 最常用工具:'));
        toolStats.mostUsed.forEach((tool, index) => {
          console.log(`  ${index + 1}. ${tool.name} (${tool.count} 次)`);
        });
      }

    } catch (error) {
      console.error(chalk.red('❌ 显示系统状态失败:'), error);
    }
  }

  // 工具方法

  /**
   * 格式化持续时间
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${minutes % 60}m`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }

  /**
   * 获取状态颜色
   */
  private getStatusColor(status: string): (text: string) => string {
    switch (status) {
      case 'running':
      case 'available':
        return chalk.green;
      case 'error':
      case 'failed':
        return chalk.red;
      case 'starting':
      case 'stopping':
        return chalk.yellow;
      case 'disabled':
        return chalk.gray;
      default:
        return chalk.white;
    }
  }

  // 占位符方法（后续实现）
  private async showServerLogs(serverId: string, options: any): Promise<void> {
    console.log(chalk.yellow('⚠️ 日志功能开发中...'));
  }

  private async addServer(options: any): Promise<void> {
    console.log(chalk.yellow('⚠️ 添加服务器功能开发中...'));
  }

  private async removeServer(serverId: string, options: any): Promise<void> {
    console.log(chalk.yellow('⚠️ 删除服务器功能开发中...'));
  }

  private async searchTools(query: string, options: any): Promise<void> {
    try {
      const tools = this.toolRegistry.searchTools(query);
      if (tools.length === 0) {
        console.log(chalk.yellow(`没有找到匹配 "${query}" 的工具`));
        return;
      }

      console.log(chalk.blue(`\n🔍 搜索结果 (${tools.length} 个):\n`));
      await this.listTools({ ...options, tools });

    } catch (error) {
      console.error(chalk.red('❌ 搜索工具失败:'), error);
    }
  }

  private async installTool(toolPath: string, options: any): Promise<void> {
    console.log(chalk.yellow('⚠️ 安装工具功能开发中...'));
  }

  private async uninstallTool(toolId: string, options: any): Promise<void> {
    console.log(chalk.yellow('⚠️ 卸载工具功能开发中...'));
  }

  private async enableTool(toolId: string, options: any): Promise<void> {
    console.log(chalk.yellow('⚠️ 启用工具功能开发中...'));
  }

  private async disableTool(toolId: string, options: any): Promise<void> {
    console.log(chalk.yellow('⚠️ 禁用工具功能开发中...'));
  }

  private async showToolInfo(toolId: string, options: any): Promise<void> {
    console.log(chalk.yellow('⚠️ 工具信息功能开发中...'));
  }

  private async showToolStats(options: any): Promise<void> {
    console.log(chalk.yellow('⚠️ 工具统计功能开发中...'));
  }

  private async showConfig(options: any): Promise<void> {
    console.log(chalk.yellow('⚠️ 显示配置功能开发中...'));
  }

  private async editConfig(options: any): Promise<void> {
    console.log(chalk.yellow('⚠️ 编辑配置功能开发中...'));
  }

  private async validateConfig(options: any): Promise<void> {
    console.log(chalk.yellow('⚠️ 验证配置功能开发中...'));
  }

  private async resetConfig(options: any): Promise<void> {
    console.log(chalk.yellow('⚠️ 重置配置功能开发中...'));
  }

  private async exportConfig(file: string, options: any): Promise<void> {
    console.log(chalk.yellow('⚠️ 导出配置功能开发中...'));
  }

  private async importConfig(file: string, options: any): Promise<void> {
    console.log(chalk.yellow('⚠️ 导入配置功能开发中...'));
  }

  private async healthCheck(options: any): Promise<void> {
    console.log(chalk.yellow('⚠️ 健康检查功能开发中...'));
  }

  private async showMetrics(options: any): Promise<void> {
    console.log(chalk.yellow('⚠️ 性能指标功能开发中...'));
  }

  private async diagnoseSystem(options: any): Promise<void> {
    console.log(chalk.yellow('⚠️ 系统诊断功能开发中...'));
  }

  /**
   * 运行命令程序
   */
  async run(argv?: string[]): Promise<void> {
    try {
      await this.initialize();
      await this.program.parseAsync(argv);
    } catch (error) {
      console.error(chalk.red('❌ 命令执行失败:'), error);
      process.exit(1);
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const mcpCommands = new MCPCommands();
  mcpCommands.run().catch(error => {
    console.error('程序异常退出:', error);
    process.exit(1);
  });
}

export default MCPCommands;