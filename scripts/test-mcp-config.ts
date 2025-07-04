#!/usr/bin/env ts-node

/**
 * MCP 配置功能测试脚本
 * 验证 TaskFlow AI 的 MCP 配置生成和验证功能
 */

const { Logger } = require('../src/infra/logger');
const { ConfigManager } = require('../src/infra/config/config-manager');
const { LogLevel } = require('../src/types/config');
const chalk = require('chalk');

async function testMCPConfig(): Promise<void> {
  console.log(chalk.blue('🧪 开始测试 MCP 配置功能...\n'));

  try {
    // 初始化
    const logger = Logger.getInstance({ level: LogLevel.INFO, output: 'console' });
    const config = new ConfigManager(logger);

    const editors = ['cursor', 'windsurf', 'trae', 'vscode'];
    let allTestsPassed = true;

    for (const editor of editors) {
      console.log(chalk.yellow(`📝 测试 ${editor} 编辑器配置...`));

      try {
        // 1. 测试配置生成
        const mcpConfig = config.generateMCPConfig(editor);
        console.log(chalk.green(`  ✅ ${editor} 配置生成成功`));

        // 2. 测试配置验证
        const validation = config.validateMCPConfig(mcpConfig);
        if (validation.valid) {
          console.log(chalk.green(`  ✅ ${editor} 配置验证通过`));
        } else {
          console.log(chalk.red(`  ❌ ${editor} 配置验证失败:`));
          validation.errors?.forEach(error => {
            console.log(chalk.red(`    - ${error}`));
          });
          allTestsPassed = false;
        }

        if (validation.warnings?.length) {
          validation.warnings.forEach(warning => {
            console.log(chalk.yellow(`    ⚠️ ${warning}`));
          });
        }

        // 3. 测试配置导出
        const configJson = config.exportMCPConfig(editor);
        console.log(chalk.green(`  ✅ ${editor} 配置导出成功 (${configJson.length} 字符)`));

        // 4. 验证导出的JSON格式
        try {
          JSON.parse(configJson);
          console.log(chalk.green(`  ✅ ${editor} 导出的JSON格式正确`));
        } catch (error) {
          console.log(chalk.red(`  ❌ ${editor} 导出的JSON格式错误`));
          allTestsPassed = false;
        }

        // 5. 测试能力检查
        const capabilities = config.getMCPCapabilities();
        if (capabilities.supportedEditors.includes(editor)) {
          console.log(chalk.green(`  ✅ ${editor} 在支持的编辑器列表中`));
        } else {
          console.log(chalk.red(`  ❌ ${editor} 不在支持的编辑器列表中`));
          allTestsPassed = false;
        }

        console.log();

      } catch (error) {
        console.log(chalk.red(`  ❌ ${editor} 测试失败: ${(error as Error).message}`));
        allTestsPassed = false;
        console.log();
      }
    }

    // 测试批量配置生成
    console.log(chalk.yellow('📦 测试批量配置生成...'));
    try {
      await config.generateAllMCPConfigs('.', {
        includeAllModels: true,
        enableStreaming: true,
        enableHealthCheck: true
      });
      console.log(chalk.green('  ✅ 批量配置生成成功'));
    } catch (error) {
      console.log(chalk.red(`  ❌ 批量配置生成失败: ${(error as Error).message}`));
      allTestsPassed = false;
    }

    // 测试配置能力
    console.log(chalk.yellow('\n🔧 测试配置能力...'));
    const capabilities = config.getMCPCapabilities();
    
    console.log(chalk.blue('支持的编辑器:'));
    capabilities.supportedEditors.forEach(editor => {
      console.log(chalk.gray(`  - ${editor}`));
    });

    console.log(chalk.blue('支持的模型:'));
    capabilities.supportedModels.forEach(model => {
      console.log(chalk.gray(`  - ${model}`));
    });

    console.log(chalk.blue('支持的功能:'));
    Object.entries(capabilities.features).forEach(([feature, supported]) => {
      const icon = supported ? '✅' : '❌';
      console.log(chalk.gray(`  ${icon} ${feature}`));
    });

    // 总结
    console.log(chalk.blue('\n📊 测试结果总结:'));
    if (allTestsPassed) {
      console.log(chalk.green('🎉 所有 MCP 配置功能测试通过！'));
      console.log(chalk.green('✅ 配置生成功能正常'));
      console.log(chalk.green('✅ 配置验证功能正常'));
      console.log(chalk.green('✅ 配置导出功能正常'));
      console.log(chalk.green('✅ 批量生成功能正常'));
      
      console.log(chalk.blue('\n🔧 下一步建议:'));
      console.log(chalk.gray('  1. 运行 taskflow init 生成实际配置文件'));
      console.log(chalk.gray('  2. 设置环境变量中的 API 密钥'));
      console.log(chalk.gray('  3. 在编辑器中测试 MCP 服务'));
      
      process.exit(0);
    } else {
      console.log(chalk.red('❌ 部分 MCP 配置功能测试失败'));
      console.log(chalk.red('请检查上述错误信息并修复相关问题'));
      process.exit(1);
    }

  } catch (error) {
    console.error(chalk.red('❌ 测试执行失败:'), error);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  testMCPConfig();
}

export { testMCPConfig };
