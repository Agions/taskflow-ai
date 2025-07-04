#!/usr/bin/env ts-node

/**
 * 编辑器集成测试脚本
 * 测试 TaskFlow AI 与四种主流 AI 编辑器的 MCP 集成
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { Logger } from '../src/infra/logger';
import { ConfigManager } from '../src/infra/config/config-manager';
import { EditorType, EDITOR_CONFIG_PATHS } from '../src/types/mcp';

interface TestResult {
  editor: EditorType;
  configExists: boolean;
  configValid: boolean;
  formatCorrect: boolean;
  environmentVarsPresent: boolean;
  errors: string[];
  warnings: string[];
}

class EditorIntegrationTester {
  private logger: Logger;
  private config: ConfigManager;
  private projectRoot: string;

  constructor(projectRoot: string = '.') {
    this.logger = new Logger();
    this.config = new ConfigManager(this.logger);
    this.projectRoot = projectRoot;
  }

  /**
   * 运行所有编辑器的集成测试
   */
  public async runAllTests(): Promise<TestResult[]> {
    const editors: EditorType[] = ['cursor', 'windsurf', 'trae', 'vscode'];
    const results: TestResult[] = [];

    console.log(chalk.blue('🧪 开始测试编辑器 MCP 集成...\n'));

    for (const editor of editors) {
      console.log(chalk.yellow(`📝 测试 ${editor} 编辑器...`));
      const result = await this.testEditor(editor);
      results.push(result);
      this.printTestResult(result);
      console.log();
    }

    return results;
  }

  /**
   * 测试单个编辑器的集成
   */
  private async testEditor(editor: EditorType): Promise<TestResult> {
    const result: TestResult = {
      editor,
      configExists: false,
      configValid: false,
      formatCorrect: false,
      environmentVarsPresent: false,
      errors: [],
      warnings: []
    };

    try {
      // 1. 检查配置文件是否存在
      const configPath = join(this.projectRoot, EDITOR_CONFIG_PATHS[editor]);
      result.configExists = existsSync(configPath);

      if (!result.configExists) {
        result.errors.push(`配置文件不存在: ${configPath}`);
        return result;
      }

      // 2. 读取并验证配置文件
      const configContent = readFileSync(configPath, 'utf-8');
      let configData: any;

      try {
        configData = JSON.parse(configContent);
        result.formatCorrect = true;
      } catch (error) {
        result.errors.push(`配置文件格式错误: ${(error as Error).message}`);
        return result;
      }

      // 3. 验证配置结构
      const structureValid = this.validateConfigStructure(editor, configData);
      if (!structureValid.valid) {
        result.errors.push(...structureValid.errors);
        result.warnings.push(...structureValid.warnings);
      } else {
        result.configValid = true;
      }

      // 4. 检查环境变量
      const envVarsCheck = this.checkEnvironmentVariables(editor, configData);
      result.environmentVarsPresent = envVarsCheck.present;
      if (!envVarsCheck.present) {
        result.warnings.push(...envVarsCheck.missing);
      }

      // 5. 测试 MCP 配置生成
      try {
        const mcpConfig = this.config.generateMCPConfig(editor);
        const validation = this.config.validateMCPConfig(mcpConfig);
        
        if (!validation.valid) {
          result.errors.push(...(validation.errors || []));
        }
        
        if (validation.warnings?.length) {
          result.warnings.push(...validation.warnings);
        }
      } catch (error) {
        result.errors.push(`MCP 配置生成失败: ${(error as Error).message}`);
      }

    } catch (error) {
      result.errors.push(`测试异常: ${(error as Error).message}`);
    }

    return result;
  }

  /**
   * 验证配置文件结构
   */
  private validateConfigStructure(editor: EditorType, config: any): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (editor) {
      case 'cursor':
      case 'windsurf':
        if (!config.mcpServers) {
          errors.push('缺少 mcpServers 配置');
        } else if (!config.mcpServers['taskflow-ai']) {
          errors.push('缺少 taskflow-ai 服务配置');
        } else {
          const serverConfig = config.mcpServers['taskflow-ai'];
          if (!serverConfig.command) {
            errors.push('缺少启动命令');
          }
          if (!Array.isArray(serverConfig.args)) {
            errors.push('启动参数必须是数组');
          }
          if (!serverConfig.env) {
            warnings.push('缺少环境变量配置');
          }
        }
        break;

      case 'trae':
        if (!config.mcp) {
          errors.push('缺少 mcp 配置');
        } else {
          if (!config.mcp.servers?.taskflow) {
            errors.push('缺少 taskflow 服务配置');
          }
          if (!config.mcp.client) {
            warnings.push('缺少客户端配置');
          }
        }
        break;

      case 'vscode':
        if (!config['taskflow.mcp.enabled']) {
          warnings.push('MCP 服务未启用');
        }
        if (!config['taskflow.mcp.server']) {
          errors.push('缺少 MCP 服务器配置');
        }
        if (!config['taskflow.ai.models']) {
          warnings.push('缺少 AI 模型配置');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 检查环境变量配置
   */
  private checkEnvironmentVariables(editor: EditorType, config: any): {
    present: boolean;
    missing: string[];
  } {
    const requiredVars = [
      'DEEPSEEK_API_KEY',
      'ZHIPU_API_KEY',
      'QWEN_API_KEY',
      'BAIDU_API_KEY',
      'MOONSHOT_API_KEY',
      'SPARK_API_KEY'
    ];

    const missing: string[] = [];
    let envConfig: any = {};

    // 根据编辑器类型获取环境变量配置
    switch (editor) {
      case 'cursor':
      case 'windsurf':
        envConfig = config.mcpServers?.['taskflow-ai']?.env || {};
        break;
      case 'trae':
        envConfig = config.mcp?.servers?.taskflow?.environment || {};
        break;
      case 'vscode':
        envConfig = config['taskflow.mcp.server']?.env || {};
        break;
    }

    // 检查必需的环境变量
    for (const varName of requiredVars) {
      if (!envConfig[varName]) {
        missing.push(`缺少环境变量: ${varName}`);
      }
    }

    return {
      present: missing.length === 0,
      missing
    };
  }

  /**
   * 打印测试结果
   */
  private printTestResult(result: TestResult): void {
    const { editor, configExists, configValid, formatCorrect, environmentVarsPresent, errors, warnings } = result;

    // 总体状态
    const overallSuccess = configExists && configValid && formatCorrect && errors.length === 0;
    const statusIcon = overallSuccess ? '✅' : '❌';
    const statusColor = overallSuccess ? chalk.green : chalk.red;

    console.log(statusColor(`${statusIcon} ${editor} 编辑器集成测试`));

    // 详细检查项
    console.log(`  📁 配置文件存在: ${configExists ? '✅' : '❌'}`);
    console.log(`  📋 配置格式正确: ${formatCorrect ? '✅' : '❌'}`);
    console.log(`  🔧 配置结构有效: ${configValid ? '✅' : '❌'}`);
    console.log(`  🔑 环境变量完整: ${environmentVarsPresent ? '✅' : '⚠️'}`);

    // 错误信息
    if (errors.length > 0) {
      console.log(chalk.red('  ❌ 错误:'));
      errors.forEach(error => {
        console.log(chalk.red(`    - ${error}`));
      });
    }

    // 警告信息
    if (warnings.length > 0) {
      console.log(chalk.yellow('  ⚠️ 警告:'));
      warnings.forEach(warning => {
        console.log(chalk.yellow(`    - ${warning}`));
      });
    }
  }

  /**
   * 生成测试报告
   */
  public generateReport(results: TestResult[]): void {
    console.log(chalk.blue('\n📊 编辑器集成测试报告'));
    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

    const totalTests = results.length;
    const passedTests = results.filter(r => 
      r.configExists && r.configValid && r.formatCorrect && r.errors.length === 0
    ).length;
    const failedTests = totalTests - passedTests;

    console.log(chalk.green(`✅ 通过: ${passedTests}/${totalTests}`));
    console.log(chalk.red(`❌ 失败: ${failedTests}/${totalTests}`));

    if (failedTests > 0) {
      console.log(chalk.yellow('\n⚠️ 需要修复的问题:'));
      results.forEach(result => {
        if (result.errors.length > 0) {
          console.log(chalk.red(`  ${result.editor}:`));
          result.errors.forEach(error => {
            console.log(chalk.red(`    - ${error}`));
          });
        }
      });
    }

    console.log(chalk.blue('\n🔧 建议的修复步骤:'));
    console.log(chalk.gray('  1. 运行 taskflow init 重新生成配置文件'));
    console.log(chalk.gray('  2. 检查 .env 文件中的 API 密钥配置'));
    console.log(chalk.gray('  3. 验证配置: taskflow mcp validate'));
    console.log(chalk.gray('  4. 测试配置: taskflow mcp test --all-editors'));
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const tester = new EditorIntegrationTester();
  
  try {
    const results = await tester.runAllTests();
    tester.generateReport(results);

    // 检查是否所有测试都通过
    const allPassed = results.every(r => 
      r.configExists && r.configValid && r.formatCorrect && r.errors.length === 0
    );

    if (allPassed) {
      console.log(chalk.green('\n🎉 所有编辑器集成测试通过！'));
      process.exit(0);
    } else {
      console.log(chalk.red('\n❌ 部分编辑器集成测试失败，请检查上述问题。'));
      process.exit(1);
    }

  } catch (error) {
    console.error(chalk.red('❌ 测试执行失败:'), error);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  main();
}

export { EditorIntegrationTester };
