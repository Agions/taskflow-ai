/**
 * MCP 配置管理命令
 * 提供 MCP (Model Context Protocol) 配置的生成、验证和测试功能
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Logger } from '../../infra/logger';
import { ConfigManager } from '../../infra/config/config-manager';
import { EditorType } from '../../types/mcp';
import { LogLevel } from '../../types/config';

/**
 * 创建 MCP 命令
 */
export function createMCPCommand(): Command {
  const logger = Logger.getInstance({
    level: LogLevel.INFO,
    output: 'console'
  });
  const config = new ConfigManager(logger);

  const mcpCommand = new Command('mcp')
    .description('MCP (Model Context Protocol) 配置管理');

  // mcp validate 命令
  mcpCommand
    .command('validate')
    .description('验证 MCP 配置文件')
    .option('--editor <editor>', '指定编辑器 (windsurf/trae/cursor/vscode)')
    .option('--all', '验证所有编辑器配置')
    .action(async (options) => {
      const spinner = ora('验证 MCP 配置...').start();

      try {
        if (options.all) {
          // 验证所有编辑器配置
          const editors: EditorType[] = ['windsurf', 'trae', 'cursor', 'vscode'];
          let allValid = true;

          for (const editor of editors) {
            const mcpConfig = config.generateMCPConfig(editor);
            const result = config.validateMCPConfig(mcpConfig);

            if (result.valid) {
              console.log(chalk.green(`✅ ${editor} 配置有效`));
            } else {
              console.log(chalk.red(`❌ ${editor} 配置无效:`));
              result.errors?.forEach(error => {
                console.log(chalk.red(`   - ${error}`));
              });
              allValid = false;
            }

            if (result.warnings?.length) {
              result.warnings.forEach(warning => {
                console.log(chalk.yellow(`   ⚠️ ${warning}`));
              });
            }
          }

          spinner.succeed(allValid ? '所有配置验证通过' : '部分配置验证失败');

        } else if (options.editor) {
          // 验证特定编辑器配置
          const editor = options.editor as EditorType;
          const mcpConfig = config.generateMCPConfig(editor);
          const result = config.validateMCPConfig(mcpConfig);

          if (result.valid) {
            spinner.succeed(`${editor} 配置验证通过`);
          } else {
            spinner.fail(`${editor} 配置验证失败`);
            result.errors?.forEach(error => {
              console.log(chalk.red(`❌ ${error}`));
            });
          }

          if (result.warnings?.length) {
            result.warnings.forEach(warning => {
              console.log(chalk.yellow(`⚠️ ${warning}`));
            });
          }

        } else {
          spinner.fail('请指定编辑器或使用 --all 选项');
        }

      } catch (error) {
        spinner.fail(`验证失败: ${(error as Error).message}`);
        process.exit(1);
      }
    });

  // mcp test 命令
  mcpCommand
    .command('test')
    .description('测试 MCP 配置有效性')
    .option('--editor <editor>', '指定编辑器')
    .option('--all-editors', '测试所有编辑器配置')
    .option('--all-models', '测试所有 AI 模型连接')
    .action(async (options) => {
      const spinner = ora('测试 MCP 配置...').start();

      try {
        if (options.allModels) {
          // 测试所有 AI 模型
          const models = ['deepseek', 'zhipu', 'qwen', 'baidu', 'moonshot', 'spark'];
          console.log(chalk.blue('\n🧪 测试 AI 模型连接:'));

          for (const model of models) {
            try {
              const testResult = await config.testMCPConfiguration('cursor', {
                customEnvironment: { PREFERRED_MODEL: model }
              });

              if (testResult.valid) {
                console.log(chalk.green(`✅ ${model} 连接正常 (${testResult.latency}ms)`));
              } else {
                console.log(chalk.red(`❌ ${model} 连接失败`));
                testResult.errors?.forEach(error => {
                  console.log(chalk.red(`   - ${error}`));
                });
              }
            } catch (error) {
              console.log(chalk.red(`❌ ${model} 测试异常: ${(error as Error).message}`));
            }
          }

          spinner.succeed('AI 模型连接测试完成');

        } else if (options.allEditors) {
          // 测试所有编辑器配置
          const editors: EditorType[] = ['windsurf', 'trae', 'cursor', 'vscode'];
          console.log(chalk.blue('\n🧪 测试编辑器配置:'));

          for (const editor of editors) {
            try {
              const testResult = await config.testMCPConfiguration(editor);

              if (testResult.valid) {
                console.log(chalk.green(`✅ ${editor} 配置测试通过 (${testResult.latency}ms)`));
              } else {
                console.log(chalk.red(`❌ ${editor} 配置测试失败`));
                testResult.errors?.forEach(error => {
                  console.log(chalk.red(`   - ${error}`));
                });
              }

              if (testResult.warnings?.length) {
                testResult.warnings.forEach(warning => {
                  console.log(chalk.yellow(`   ⚠️ ${warning}`));
                });
              }
            } catch (error) {
              console.log(chalk.red(`❌ ${editor} 测试异常: ${(error as Error).message}`));
            }
          }

          spinner.succeed('编辑器配置测试完成');

        } else if (options.editor) {
          // 测试特定编辑器
          const editor = options.editor as EditorType;
          const testResult = await config.testMCPConfiguration(editor);

          if (testResult.valid) {
            spinner.succeed(`${editor} 配置测试通过 (${testResult.latency}ms)`);
          } else {
            spinner.fail(`${editor} 配置测试失败`);
            testResult.errors?.forEach(error => {
              console.log(chalk.red(`❌ ${error}`));
            });
          }

          if (testResult.warnings?.length) {
            testResult.warnings.forEach(warning => {
              console.log(chalk.yellow(`⚠️ ${warning}`));
            });
          }

        } else {
          spinner.fail('请指定测试选项');
        }

      } catch (error) {
        spinner.fail(`测试失败: ${(error as Error).message}`);
        process.exit(1);
      }
    });

  // mcp regenerate 命令
  mcpCommand
    .command('regenerate')
    .description('重新生成 MCP 配置文件')
    .option('--editor <editor>', '指定编辑器')
    .option('--force', '覆盖现有配置')
    .action(async (options) => {
      const spinner = ora('重新生成 MCP 配置...').start();

      try {
        if (options.editor) {
          // 重新生成特定编辑器配置
          const editor = options.editor as EditorType;
          await config.writeMCPConfigFiles(editor, '.', {
            includeAllModels: true,
            enableStreaming: true,
            enableHealthCheck: true
          });

          spinner.succeed(`${editor} MCP 配置重新生成完成`);

        } else {
          // 重新生成所有编辑器配置
          await config.generateAllMCPConfigs('.', {
            includeAllModels: true,
            enableStreaming: true,
            enableHealthCheck: true
          });

          spinner.succeed('所有 MCP 配置重新生成完成');
        }

        console.log(chalk.blue('\n📋 生成的配置文件:'));
        console.log(chalk.gray('  .cursor/mcp.json          - Cursor 编辑器配置'));
        console.log(chalk.gray('  .cursor-rules             - Cursor AI 规则'));
        console.log(chalk.gray('  .windsurf/mcp.json        - Windsurf 编辑器配置'));
        console.log(chalk.gray('  .trae/mcp-config.json     - Trae 编辑器配置'));
        console.log(chalk.gray('  .vscode/settings.json     - VSCode 编辑器配置'));
        console.log(chalk.gray('  .vscode/extensions.json   - VSCode 扩展推荐'));

        console.log(chalk.green('\n🎉 MCP 配置生成完成！现在可以在编辑器中使用 TaskFlow AI 了。'));

      } catch (error) {
        spinner.fail(`重新生成失败: ${(error as Error).message}`);
        process.exit(1);
      }
    });

  // mcp info 命令
  mcpCommand
    .command('info')
    .description('显示 MCP 服务信息')
    .action(async () => {
      const capabilities = config.getMCPCapabilities();

      console.log(chalk.blue('\n📊 TaskFlow AI MCP 服务信息:'));
      console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

      console.log(chalk.green('\n🎯 支持的编辑器:'));
      capabilities.supportedEditors.forEach((editor: string) => {
        console.log(chalk.gray(`  ✓ ${editor}`));
      });

      console.log(chalk.green('\n🤖 支持的 AI 模型:'));
      capabilities.supportedModels.forEach((model: string) => {
        console.log(chalk.gray(`  ✓ ${model}`));
      });

      console.log(chalk.green('\n⚡ 支持的功能:'));
      Object.entries(capabilities.features).forEach(([feature, supported]) => {
        const icon = supported ? '✓' : '✗';
        const color = supported ? chalk.gray : chalk.red;
        console.log(color(`  ${icon} ${feature}`));
      });

      console.log(chalk.green('\n🔧 MCP 能力:'));
      Object.entries(capabilities).forEach(([capability, supported]) => {
        if (typeof supported === 'boolean') {
          const icon = supported ? '✓' : '✗';
          const color = supported ? chalk.gray : chalk.red;
          console.log(color(`  ${icon} ${capability}`));
        }
      });

      console.log(chalk.blue('\n📖 使用说明:'));
      console.log(chalk.gray('  1. 运行 taskflow init 生成配置文件'));
      console.log(chalk.gray('  2. 设置环境变量中的 API 密钥'));
      console.log(chalk.gray('  3. 打开编辑器，服务将自动启动'));
      console.log(chalk.gray('  4. 开始使用 AI 驱动的开发功能'));
    });

  return mcpCommand;
}
