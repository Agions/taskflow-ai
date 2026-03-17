/**
 * MCP命令 - Model Context Protocol 服务器管理
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { MCPServer } from '../../mcp/server';
import { ConfigManager } from '../../core/config';
import { generateAllConfigs, exportConfig } from '../../mcp/config/generator';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

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
      console.log(
        chalk.gray('  兼容编辑器: ') +
          chalk.white('Trae, Cursor, Claude Desktop, Windsurf, VSCode, Zed')
      );
      console.log(chalk.gray('  状态: ') + chalk.yellow('通过 taskflow mcp start 启动'));
    });

  mcpCmd
    .command('config')
    .description('显示MCP配置指南')
    .action(async () => {
      showMCPConfigGuide();
    });

  // 新增：生成编辑器配置
  mcpCmd
    .command('init')
    .description('初始化MCP配置 (生成编辑器配置文件)')
    .option(
      '-e, --editor <editor>',
      '指定编辑器 (cursor|claude-desktop|vscode|windsurf|trae|zed|all)',
      'all'
    )
    .option('-o, --output <path>', '输出目录', process.cwd())
    .option('-p, --package <name>', '包名', 'taskflow-ai')
    .option('-v, --version <version>', '版本', 'latest')
    .action(async options => {
      try {
        await generateEditorConfig(options);
      } catch (error) {
        console.error(chalk.red('生成配置失败:'), error);
        process.exit(1);
      }
    });

  // 新增：列出可用工具
  mcpCmd
    .command('tools')
    .description('列出所有可用的MCP工具')
    .option('-c, --category <category>', '按分类筛选')
    .action(async options => {
      try {
        await listTools(options);
      } catch (error) {
        console.error(chalk.red('获取工具列表失败:'), error);
        process.exit(1);
      }
    });
}

async function startMCPServer(_options: any) {
  try {
    const configManager = new ConfigManager();
    const config = await configManager.loadConfig();

    if (!config) {
      console.error(chalk.red('未找到配置文件，请先运行 "taskflow init"'));
      process.exit(1);
    }

    const mcpSettings = {
      serverName: 'taskflow-ai',
      version: '2.0.0',
    };

    const mcpServer = new MCPServer(mcpSettings, config);
    await mcpServer.start();
  } catch (error) {
    console.error(chalk.red('启动失败:'), error);
    throw error;
  }
}

async function generateEditorConfig(options: any) {
  const editor = options.editor || 'all';
  const outputDir = options.output || process.cwd();
  const packageName = options.package || 'taskflow-ai';
  const packageVersion = options.version || 'latest';

  console.log(chalk.cyan(`🔧 生成 MCP 配置文件\n`));
  console.log(chalk.gray(`  包名: ${packageName}`));
  console.log(chalk.gray(`  版本: ${packageVersion}`));
  console.log(chalk.gray(`  输出: ${outputDir}\n`));

  const configs =
    editor === 'all'
      ? generateAllConfigs({ packageName, packageVersion })
      : [
          generateAllConfigs({ packageName, packageVersion }).find(
            c => c.name.toLowerCase().replace(/\s+/g, '-') === editor.toLowerCase()
          ),
        ].filter(Boolean);

  if (configs.length === 0) {
    console.log(chalk.red(`未找到编辑器: ${editor}`));
    console.log(chalk.gray('可用编辑器: cursor, claude-desktop, vscode, windsurf, trae, zed, all'));
    return;
  }

  for (const config of configs) {
    if (!config) continue;

    const fileName = getConfigFileName(config.name);
    const filePath = path.join(outputDir, fileName);

    const content = exportConfig(config);

    // 读取现有配置（如果存在）
    let existingConfig: any = {};
    try {
      const existing = await fs.readFile(filePath, 'utf-8');
      existingConfig = JSON.parse(existing);
    } catch {
      // 文件不存在，使用空对象
    }

    // 合并配置
    const mergedConfig = mergeConfig(existingConfig, config.config);

    await fs.writeFile(filePath, JSON.stringify(mergedConfig, null, 2));

    console.log(chalk.green(`✅ ${config.name}: ${filePath}`));
  }

  console.log(chalk.cyan('\n📝 下一步:\n'));
  console.log(chalk.gray('  1. 重启编辑器'));
  console.log(chalk.gray('  2. 或在编辑器设置中重新加载配置\n'));
}

function getConfigFileName(editorName: string): string {
  const map: Record<string, string> = {
    Cursor: 'mcp.cursor.json',
    'Claude Desktop': 'mcp.claude-desktop.json',
    VSCode: 'mcp.vscode.json',
    Windsurf: 'mcp.windsurf.json',
    Trae: 'mcp.trae.json',
    Zed: 'mcp.zed.json',
  };
  return map[editorName] || 'mcp.json';
}

function mergeConfig(existing: any, newConfig: any): any {
  // 深度合并配置
  const result = { ...existing };

  for (const key of Object.keys(newConfig)) {
    if (key === 'mcpServers') {
      result.mcpServers = {
        ...(result.mcpServers || {}),
        ...newConfig.mcpServers,
      };
    } else {
      result[key] = newConfig[key];
    }
  }

  return result;
}

async function listTools(options: any) {
  const { toolRegistry } = await import('../../mcp/tools/registry');

  // 注册所有工具
  toolRegistry.registerBuiltinTools();

  let tools = toolRegistry.getAllTools();

  // 筛选分类
  if (options.category) {
    tools = tools.filter(t => t.category === options.category);
  }

  // 按分类分组
  const byCategory: Record<string, typeof tools> = {};
  for (const tool of tools) {
    const cat = tool.category || 'custom';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(tool);
  }

  console.log(chalk.cyan('\n📦 MCP 工具列表\n'));

  for (const [category, categoryTools] of Object.entries(byCategory)) {
    console.log(chalk.yellow(`\n${category} (${categoryTools.length})`));
    for (const tool of categoryTools) {
      console.log(chalk.gray(`  • ${tool.name}`) + chalk.white(` - ${tool.description}`));
    }
  }

  console.log(chalk.cyan(`\n总计: ${tools.length} 个工具\n`));
}

function showMCPConfigGuide() {
  console.log(chalk.cyan('\n🔧 MCP 配置指南\n'));

  console.log(chalk.yellow('支持的编辑器:'));
  console.log(chalk.gray('  • Trae'));
  console.log(chalk.gray('  • Cursor'));
  console.log(chalk.gray('  • Claude Desktop'));
  console.log(chalk.gray('  • Windsurf'));
  console.log(chalk.gray('  • VSCode'));
  console.log(chalk.gray('  • Zed\n'));

  console.log(chalk.yellow('快速生成配置:\n'));
  console.log(chalk.white('  taskflow mcp init'));
  console.log(chalk.gray('    生成所有编辑器的配置文件\n'));
  console.log(chalk.white('  taskflow mcp init -e cursor'));
  console.log(chalk.gray('    只生成 Cursor 的配置文件\n'));
  console.log(chalk.white('  taskflow mcp init -e all -o ~/.cursor'));
  console.log(chalk.gray('    生成到指定目录\n'));

  console.log(chalk.yellow('查看工具列表:\n'));
  console.log(chalk.white('  taskflow mcp tools'));
  console.log(chalk.gray('    列出所有 MCP 工具\n'));
  console.log(chalk.white('  taskflow mcp tools -c filesystem'));
  console.log(chalk.gray('    只列出 filesystem 分类的工具\n'));

  console.log(chalk.yellow('本地开发测试:'));
  console.log(chalk.gray('  npm run build'));
  console.log(chalk.gray('  npm run mcp:start\n'));
}
