/**
 * 统一命令处理器
 * 标准化所有CLI命令的执行和响应处理
 */

import { performance } from 'perf_hooks';
import { CommandResponseBuilder, CommandResult } from './unified-response';
import { ErrorHandler, ValidationError } from '../error-handling/typed-errors';
import { PerformanceMonitor } from '../performance/performance-monitor';
import { cli } from '../../ui/cli-interface';

/**
 * 命令选项接口
 */
export interface CommandOptions {
  [key: string]: any;
}

/**
 * 命令上下文接口
 */
export interface CommandContext {
  command: string;
  args: string[];
  options: CommandOptions;
  startTime: number;
  requestId: string;
}

/**
 * 命令处理器接口
 */
export interface CommandHandler<T = any> {
  execute(context: CommandContext): Promise<T>;
  validate?(context: CommandContext): Promise<void>;
  cleanup?(context: CommandContext): Promise<void>;
}

/**
 * 命令执行器
 */
export class CommandExecutor {
  private static performanceMonitor = PerformanceMonitor.getInstance();

  /**
   * 执行命令
   */
  public static async execute<T = any>(
    command: string,
    args: string[],
    options: CommandOptions,
    handler: CommandHandler<T>
  ): Promise<CommandResult<T>> {
    const startTime = performance.now();
    const context: CommandContext = {
      command,
      args,
      options,
      startTime,
      requestId: this.generateRequestId()
    };

    try {
      // 显示开始信息
      cli.showInfo(`执行命令: ${command}`, `参数: ${args.join(' ')}`);

      // 验证阶段
      if (handler.validate) {
        await handler.validate(context);
      }

      // 执行阶段
      const result = await handler.execute(context);
      
      // 计算执行时间
      const executionTime = performance.now() - startTime;
      
      // 记录性能指标
      this.recordPerformanceMetrics(command, executionTime, true);

      // 清理阶段
      if (handler.cleanup) {
        await handler.cleanup(context);
      }

      // 显示成功信息
      cli.showSuccess(`命令执行成功`, `耗时: ${executionTime.toFixed(2)}ms`);

      return CommandResponseBuilder.commandSuccess(
        command,
        args,
        result,
        executionTime
      );

    } catch (error) {
      const executionTime = performance.now() - startTime;
      const taskFlowError = ErrorHandler.handleUnknownError(error, `command:${command}`);
      
      // 记录性能指标
      this.recordPerformanceMetrics(command, executionTime, false);

      // 显示错误信息
      cli.showError(
        `命令执行失败: ${taskFlowError.message}`,
        `错误代码: ${taskFlowError.code}`
      );

      // 清理阶段（即使出错也要执行）
      if (handler.cleanup) {
        try {
          await handler.cleanup(context);
        } catch (cleanupError) {
          console.warn('清理阶段出错:', cleanupError);
        }
      }

      return CommandResponseBuilder.commandError(
        command,
        args,
        taskFlowError,
        1,
        executionTime
      );
    }
  }

  /**
   * 执行带进度显示的命令
   */
  public static async executeWithProgress<T = any>(
    command: string,
    args: string[],
    options: CommandOptions,
    handler: CommandHandler<T>,
    progressMessage = '执行中...'
  ): Promise<CommandResult<T>> {
    const spinner = cli.createSpinner(progressMessage);
    spinner.start();

    try {
      const result = await this.execute(command, args, options, handler);
      
      if (result.success) {
        spinner.succeed('命令执行成功');
      } else {
        spinner.fail('命令执行失败');
      }

      return result;
    } catch (error) {
      spinner.fail('命令执行失败');
      throw error;
    }
  }

  /**
   * 批量执行命令
   */
  public static async executeBatch<T = any>(
    commands: Array<{
      command: string;
      args: string[];
      options: CommandOptions;
      handler: CommandHandler<T>;
    }>
  ): Promise<CommandResult<T>[]> {
    const results: CommandResult<T>[] = [];
    
    cli.showInfo(`开始批量执行 ${commands.length} 个命令`);

    for (let i = 0; i < commands.length; i++) {
      const { command, args, options, handler } = commands[i];
      
      cli.showProgress({
        total: commands.length,
        current: i,
        label: `执行命令 ${i + 1}/${commands.length}`,
        showPercentage: true,
        showETA: true
      });

      const result = await this.execute(command, args, options, handler);
      results.push(result);

      // 如果命令失败且设置了停止标志，则停止执行
      if (!result.success && options.stopOnError) {
        cli.showWarning(`命令 ${command} 执行失败，停止批量执行`);
        break;
      }
    }

    cli.showProgress({
      total: commands.length,
      current: commands.length,
      label: '批量执行完成',
      showPercentage: true,
      showETA: false
    });

    return results;
  }

  /**
   * 记录性能指标
   */
  private static recordPerformanceMetrics(
    command: string,
    executionTime: number,
    success: boolean
  ): void {
    this.performanceMonitor.recordMetrics(`command:${command}`, {
      executionTime,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
      cpuUsage: 0, // 简化实现
      cacheHitRate: 0, // 简化实现
      errorRate: success ? 0 : 100,
      throughput: 1000 / executionTime
    });
  }

  /**
   * 生成请求ID
   */
  private static generateRequestId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 抽象命令处理器基类
 */
export abstract class BaseCommandHandler<T = any> implements CommandHandler<T> {
  /**
   * 执行命令（子类必须实现）
   */
  public abstract execute(context: CommandContext): Promise<T>;

  /**
   * 验证命令参数（可选重写）
   */
  public async validate(context: CommandContext): Promise<void> {
    // 默认验证：检查必需参数
    const requiredArgs = this.getRequiredArgs();
    
    for (const arg of requiredArgs) {
      if (!context.args.includes(arg) && !context.options[arg]) {
        throw new ValidationError(
          `缺少必需参数: ${arg}`,
          arg,
          undefined,
          `command:${context.command}`
        );
      }
    }
  }

  /**
   * 清理资源（可选重写）
   */
  public async cleanup(_context: CommandContext): Promise<void> {
    // 默认清理：无操作
  }

  /**
   * 获取必需参数列表（子类可重写）
   */
  protected getRequiredArgs(): string[] {
    return [];
  }

  /**
   * 获取可选参数列表（子类可重写）
   */
  protected getOptionalArgs(): string[] {
    return [];
  }

  /**
   * 验证参数类型
   */
  protected validateArgType(
    value: any,
    expectedType: 'string' | 'number' | 'boolean',
    argName: string
  ): void {
    const actualType = typeof value;
    
    if (actualType !== expectedType) {
      throw new ValidationError(
        `参数 ${argName} 类型错误: 期望 ${expectedType}, 实际 ${actualType}`,
        argName,
        value
      );
    }
  }

  /**
   * 显示帮助信息
   */
  protected showHelp(command: string): void {
    const requiredArgs = this.getRequiredArgs();
    const optionalArgs = this.getOptionalArgs();

    cli.showInfo(`命令: ${command}`);
    
    if (requiredArgs.length > 0) {
      cli.showInfo('必需参数:', requiredArgs.join(', '));
    }
    
    if (optionalArgs.length > 0) {
      cli.showInfo('可选参数:', optionalArgs.join(', '));
    }
  }
}

/**
 * 命令注册器
 */
export class CommandRegistry {
  private static handlers = new Map<string, CommandHandler>();

  /**
   * 注册命令处理器
   */
  public static register(command: string, handler: CommandHandler): void {
    this.handlers.set(command, handler);
  }

  /**
   * 获取命令处理器
   */
  public static get(command: string): CommandHandler | undefined {
    return this.handlers.get(command);
  }

  /**
   * 获取所有注册的命令
   */
  public static getCommands(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * 检查命令是否已注册
   */
  public static has(command: string): boolean {
    return this.handlers.has(command);
  }

  /**
   * 注销命令处理器
   */
  public static unregister(command: string): boolean {
    return this.handlers.delete(command);
  }

  /**
   * 清空所有注册的命令
   */
  public static clear(): void {
    this.handlers.clear();
  }
}

/**
 * 示例：Init命令处理器
 */
export class InitCommandHandler extends BaseCommandHandler<{
  projectPath: string;
  filesGenerated: string[];
  configCreated: boolean;
}> {
  protected getRequiredArgs(): string[] {
    return ['projectName'];
  }

  protected getOptionalArgs(): string[] {
    return ['language', 'template', 'force'];
  }

  public async validate(context: CommandContext): Promise<void> {
    await super.validate(context);

    const { args, options } = context;
    const projectName = args[0];

    // 验证项目名称
    if (!projectName || projectName.trim().length === 0) {
      throw new ValidationError('项目名称不能为空', 'projectName', projectName);
    }

    // 验证语言参数
    if (options.language) {
      const validLanguages = ['typescript', 'javascript', 'python', 'java', 'go', 'rust'];
      if (!validLanguages.includes(options.language)) {
        throw new ValidationError(
          `不支持的语言: ${options.language}`,
          'language',
          options.language
        );
      }
    }
  }

  public async execute(context: CommandContext): Promise<{
    projectPath: string;
    filesGenerated: string[];
    configCreated: boolean;
  }> {
    const { args } = context;
    const projectName = args[0];
    // 这些变量在实际实现中会被使用
    // const language = options.language || 'typescript';
    // const template = options.template || 'web-app';

    // 模拟项目初始化过程
    const projectPath = `./${projectName}`;
    const filesGenerated = [
      `${projectPath}/package.json`,
      `${projectPath}/README.md`,
      `${projectPath}/.gitignore`,
      `${projectPath}/.cursor-rules`,
      `${projectPath}/.windsurf/ai-config.json`
    ];

    return {
      projectPath,
      filesGenerated,
      configCreated: true
    };
  }

  public async cleanup(_context: CommandContext): Promise<void> {
    // 清理临时文件等
    console.log('清理临时资源...');
  }
}
