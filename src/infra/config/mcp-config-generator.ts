/**
 * MCP配置生成器
 * 负责为不同编辑器生成标准MCP配置文件
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import {
  EditorType,
  MCPConfig,
  MCPConfigOptions,
  ValidationResult,
  TestResult,
  CursorMCPConfig,
  WindsurfMCPConfig,
  TraeMCPConfig,
  VSCodeMCPConfig,
  // VSCodeExtensionsConfig 未使用，已移除
  MCP_ENVIRONMENT_VARIABLES,
  DEFAULT_MCP_CAPABILITIES,
  EDITOR_CONFIG_PATHS,
  EDITOR_EXTENSIONS_PATHS,
  DEFAULT_VSCODE_EXTENSIONS,
  CURSOR_RULES_CONTENT
} from '../../types/mcp';
import { Logger } from '../logger';

/**
 * MCP配置生成器类
 */
export class MCPConfigGenerator {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * 为指定编辑器生成MCP配置
   * @param editor 编辑器类型
   * @param options 配置选项
   * @returns MCP配置对象
   */
  public generateMCPConfig(editor: EditorType, options: MCPConfigOptions = {}): MCPConfig {
    const baseConfig: MCPConfig = {
      editor,
      serverConfig: {
        command: 'npx',
        args: ['-y', '--package=taskflow-ai', 'taskflow-mcp'],
        timeout: options.timeout || 30000,
        retries: options.retries || 3
      },
      capabilities: DEFAULT_MCP_CAPABILITIES,
      environment: {
        ...MCP_ENVIRONMENT_VARIABLES,
        ...options.customEnvironment
      }
    };

    this.logger.debug(`生成 ${editor} MCP配置`, {
      editor,
      config: JSON.stringify(baseConfig, null, 2)
    });
    return baseConfig;
  }

  /**
   * 验证MCP配置
   * @param config MCP配置对象
   * @returns 验证结果
   */
  public validateMCPConfig(config: MCPConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证编辑器类型
    if (!['windsurf', 'trae', 'cursor', 'vscode'].includes(config.editor)) {
      errors.push(`不支持的编辑器类型: ${config.editor}`);
    }

    // 验证服务器配置
    if (!config.serverConfig.command) {
      errors.push('缺少服务器启动命令');
    }

    if (!Array.isArray(config.serverConfig.args)) {
      errors.push('服务器参数必须是数组');
    }

    // 验证环境变量
    const requiredEnvVars = ['DEEPSEEK_API_KEY', 'ZHIPU_API_KEY', 'QWEN_API_KEY'];
    for (const envVar of requiredEnvVars) {
      if (!config.environment[envVar]) {
        warnings.push(`缺少环境变量: ${envVar}`);
      }
    }

    // 验证能力声明
    if (!config.capabilities.tools && !config.capabilities.resources) {
      warnings.push('建议至少启用tools或resources能力');
    }

    const result: ValidationResult = {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };

    this.logger.debug('MCP配置验证结果', {
      isValid: result.valid,
      errorCount: result.errors?.length || 0,
      warningCount: result.warnings?.length || 0,
      errors: result.errors,
      warnings: result.warnings
    });
    return result;
  }

  /**
   * 导出编辑器特定格式的配置
   * @param config MCP配置对象
   * @returns 编辑器特定格式的配置JSON字符串
   */
  public exportMCPConfig(config: MCPConfig): string {
    let editorConfig: unknown;

    switch (config.editor) {
      case 'cursor':
        editorConfig = this.generateCursorConfig(config);
        break;
      case 'windsurf':
        editorConfig = this.generateWindsurfConfig(config);
        break;
      case 'trae':
        editorConfig = this.generateTraeConfig(config);
        break;
      case 'vscode':
        editorConfig = this.generateVSCodeConfig(config);
        break;
      default:
        throw new Error(`不支持的编辑器类型: ${config.editor}`);
    }

    return JSON.stringify(editorConfig, null, 2);
  }

  /**
   * 生成Cursor配置
   */
  private generateCursorConfig(config: MCPConfig): CursorMCPConfig {
    return {
      mcpServers: {
        'taskflow-ai': {
          command: config.serverConfig.command,
          args: config.serverConfig.args,
          env: config.environment
        }
      }
    };
  }

  /**
   * 生成Windsurf配置
   */
  private generateWindsurfConfig(config: MCPConfig): WindsurfMCPConfig {
    return {
      mcpServers: {
        'taskflow-ai': {
          command: config.serverConfig.command,
          args: config.serverConfig.args,
          env: config.environment,
          capabilities: config.capabilities,
          timeout: config.serverConfig.timeout,
          retries: config.serverConfig.retries
        }
      }
    };
  }

  /**
   * 生成Trae配置
   */
  private generateTraeConfig(config: MCPConfig): TraeMCPConfig {
    return {
      mcp: {
        version: '1.0',
        servers: {
          taskflow: {
            command: config.serverConfig.command,
            args: config.serverConfig.args,
            environment: config.environment,
            capabilities: [
              'code_analysis',
              'task_management',
              'prd_parsing',
              'ai_assistance',
              'refactoring',
              'optimization'
            ],
            healthCheck: {
              enabled: true,
              interval: 30000,
              timeout: 5000
            }
          }
        },
        client: {
          name: 'trae',
          version: '1.0.0',
          features: {
            streaming: true,
            contextWindow: 32000,
            multiModel: true,
            codeCompletion: true,
            semanticSearch: true
          }
        }
      }
    };
  }

  /**
   * 生成VSCode配置
   */
  private generateVSCodeConfig(config: MCPConfig): VSCodeMCPConfig {
    return {
      'taskflow.mcp.enabled': true,
      'taskflow.mcp.server': {
        command: config.serverConfig.command,
        args: config.serverConfig.args,
        env: this.convertToVSCodeEnv(config.environment),
        autoRestart: true,
        healthCheck: true
      },
      'taskflow.ai.models': {
        primary: 'deepseek',
        fallback: ['zhipu', 'qwen', 'baidu'],
        specialized: {
          code: 'deepseek',
          chinese: 'zhipu',
          general: 'qwen',
          creative: 'baidu',
          longText: 'moonshot',
          multimodal: 'spark'
        },
        loadBalancing: {
          enabled: true,
          strategy: 'intelligent',
          weights: {
            deepseek: 0.3,
            zhipu: 0.25,
            qwen: 0.2,
            baidu: 0.15,
            moonshot: 0.05,
            spark: 0.05
          }
        }
      },
      'taskflow.integration': {
        autoParseOnSave: true,
        showTaskProgress: true,
        enableCodeLens: true,
        contextMenuIntegration: true,
        statusBarIntegration: true,
        sidebarPanel: true
      },
      'taskflow.ui': {
        showStatusBar: true,
        enableNotifications: true,
        theme: 'auto',
        compactMode: false
      },
      'files.associations': {
        '*.prd': 'markdown',
        '*.taskflow': 'json',
        '*.mcp': 'json'
      }
    };
  }

  /**
   * 转换环境变量为VSCode格式
   */
  private convertToVSCodeEnv(env: Record<string, string>): Record<string, string> {
    const vscodeEnv: Record<string, string> = {};
    
    Object.entries(env).forEach(([key, value]) => {
      if (value.startsWith('${') && value.endsWith('}')) {
        // 环境变量引用，转换为VSCode格式
        const envVar = value.slice(2, -1);
        if (envVar === 'workspaceFolder') {
          vscodeEnv[key] = '${workspaceFolder}';
        } else {
          vscodeEnv[key] = `\${env:${envVar}}`;
        }
      } else {
        vscodeEnv[key] = value;
      }
    });

    return vscodeEnv;
  }

  /**
   * 写入配置文件到磁盘
   * @param config MCP配置对象
   * @param projectRoot 项目根目录
   */
  public async writeMCPConfigFiles(config: MCPConfig, projectRoot: string = '.'): Promise<void> {
    const configPath = EDITOR_CONFIG_PATHS[config.editor];
    const fullPath = join(projectRoot, configPath);
    
    // 确保目录存在
    const dir = dirname(fullPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // 生成配置内容
    const configContent = this.exportMCPConfig(config);
    
    // 写入配置文件
    writeFileSync(fullPath, configContent, 'utf-8');
    this.logger.info(`MCP配置文件已生成: ${fullPath}`);

    // 为特定编辑器生成额外文件
    await this.generateAdditionalFiles(config, projectRoot);
  }

  /**
   * 生成额外的配置文件
   */
  private async generateAdditionalFiles(config: MCPConfig, projectRoot: string): Promise<void> {
    switch (config.editor) {
      case 'cursor': {
        // 生成.cursor-rules文件
        const cursorRulesPath = join(projectRoot, '.cursor-rules');
        writeFileSync(cursorRulesPath, CURSOR_RULES_CONTENT, 'utf-8');
        this.logger.info(`Cursor规则文件已生成: ${cursorRulesPath}`);
        break;
      }

      case 'vscode': {
        // 生成extensions.json文件
        const extensionsPath = EDITOR_EXTENSIONS_PATHS.vscode;
        if (extensionsPath) {
          const fullExtensionsPath = join(projectRoot, extensionsPath);
          const extensionsContent = JSON.stringify(DEFAULT_VSCODE_EXTENSIONS, null, 2);
          writeFileSync(fullExtensionsPath, extensionsContent, 'utf-8');
          this.logger.info(`VSCode扩展推荐文件已生成: ${fullExtensionsPath}`);
        }
        break;
      }
    }
  }

  /**
   * 测试MCP配置
   * @param config MCP配置对象
   * @returns 测试结果
   */
  public async testMCPConfiguration(config: MCPConfig): Promise<TestResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 验证配置格式
      const validation = this.validateMCPConfig(config);
      if (!validation.valid) {
        errors.push(...(validation.errors || []));
      }
      warnings.push(...(validation.warnings || []));

      // 检查命令可用性
      if (config.serverConfig.command === 'npx') {
        // 这里可以添加实际的npx可用性检查
        // 暂时跳过，因为需要实际执行命令
      }

      // 检查环境变量
      const requiredEnvVars = ['DEEPSEEK_API_KEY', 'ZHIPU_API_KEY'];
      for (const envVar of requiredEnvVars) {
        if (!process.env[envVar] && !config.environment[envVar]) {
          warnings.push(`环境变量 ${envVar} 未设置`);
        }
      }

      const latency = Date.now() - startTime;

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        latency
      };

    } catch (error) {
      errors.push(`测试失败: ${(error as Error).message}`);
      return {
        valid: false,
        errors,
        latency: Date.now() - startTime
      };
    }
  }

  /**
   * 获取MCP服务支持的能力
   * @returns MCP能力对象
   */
  public getMCPCapabilities() {
    return {
      ...DEFAULT_MCP_CAPABILITIES,
      supportedEditors: ['windsurf', 'trae', 'cursor', 'vscode'],
      supportedModels: ['deepseek', 'zhipu', 'qwen', 'baidu', 'moonshot', 'spark'],
      features: {
        prdParsing: true,
        taskManagement: true,
        codeAnalysis: true,
        multiModelOrchestration: true,
        streamingResponse: true,
        configurationGeneration: true
      }
    };
  }
}
