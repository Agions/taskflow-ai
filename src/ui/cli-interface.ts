/**
 * 改进的CLI用户界面
 * 提供更好的用户体验和交互设计
 */

import chalk from 'chalk';
import ora, { Ora } from 'ora';
import boxen from 'boxen';
// import figlet from 'figlet';
// import gradient from 'gradient-string';
import { performance } from 'perf_hooks';

/**
 * CLI主题配置
 */
export interface CLITheme {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  muted: string;
}

/**
 * 默认主题
 */
export const defaultTheme: CLITheme = {
  primary: '#00D2FF',
  secondary: '#3A7BD5',
  success: '#00C851',
  warning: '#FF8800',
  error: '#FF4444',
  info: '#33B5E5',
  muted: '#757575'
};

/**
 * 进度条配置
 */
export interface ProgressConfig {
  total: number;
  current: number;
  label: string;
  showPercentage: boolean;
  showETA: boolean;
}

/**
 * CLI界面管理器
 */
export class CLIInterface {
  private theme: CLITheme;
  private startTime: number;
  private currentSpinner: Ora | null = null;

  constructor(theme: CLITheme = defaultTheme) {
    this.theme = theme;
    this.startTime = performance.now();
  }

  /**
   * 显示欢迎横幅
   */
  public showWelcomeBanner(): void {
    // 简化版本，不使用figlet和gradient
    const title = `
████████╗ █████╗ ███████╗██╗  ██╗███████╗██╗      ██████╗ ██╗    ██╗     █████╗ ██╗
╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝██╔════╝██║     ██╔═══██╗██║    ██║    ██╔══██╗██║
   ██║   ███████║███████╗█████╔╝ █████╗  ██║     ██║   ██║██║ █╗ ██║    ███████║██║
   ██║   ██╔══██║╚════██║██╔═██╗ ██╔══╝  ██║     ██║   ██║██║███╗██║    ██╔══██║██║
   ██║   ██║  ██║███████║██║  ██╗██║     ███████╗╚██████╔╝╚███╔███╔╝    ██║  ██║██║
   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝     ╚═╝  ╚═╝╚═╝
`;

    console.log(chalk.hex(this.theme.primary)(title));
    console.log(chalk.hex(this.theme.muted)('智能PRD文档解析与任务管理助手\n'));
  }

  /**
   * 显示帮助信息
   */
  public showHelp(): void {
    const helpBox = boxen(
      chalk.hex(this.theme.info)('🚀 快速开始:\n\n') +
      chalk.hex(this.theme.primary)('taskflow init') + 
      chalk.hex(this.theme.muted)('              初始化新项目\n') +
      chalk.hex(this.theme.primary)('taskflow interactive') + 
      chalk.hex(this.theme.muted)('      启动交互式模式\n') +
      chalk.hex(this.theme.primary)('taskflow parse <file>') + 
      chalk.hex(this.theme.muted)('     解析PRD文档\n\n') +
      chalk.hex(this.theme.info)('💡 提示: ') +
      chalk.hex(this.theme.muted)('使用 --help 查看详细命令说明'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: this.theme.primary,
        title: '📖 使用指南',
        titleAlignment: 'center'
      }
    );

    console.log(helpBox);
  }

  /**
   * 显示成功消息
   */
  public showSuccess(message: string, details?: string): void {
    const icon = chalk.hex(this.theme.success)('✅');
    const mainMessage = chalk.hex(this.theme.success).bold(message);
    
    console.log(`${icon} ${mainMessage}`);
    
    if (details) {
      console.log(chalk.hex(this.theme.muted)(`   ${details}`));
    }
  }

  /**
   * 显示错误消息
   */
  public showError(message: string, details?: string): void {
    const icon = chalk.hex(this.theme.error)('❌');
    const mainMessage = chalk.hex(this.theme.error).bold(message);
    
    console.log(`${icon} ${mainMessage}`);
    
    if (details) {
      console.log(chalk.hex(this.theme.muted)(`   ${details}`));
    }
  }

  /**
   * 显示警告消息
   */
  public showWarning(message: string, details?: string): void {
    const icon = chalk.hex(this.theme.warning)('⚠️');
    const mainMessage = chalk.hex(this.theme.warning).bold(message);
    
    console.log(`${icon} ${mainMessage}`);
    
    if (details) {
      console.log(chalk.hex(this.theme.muted)(`   ${details}`));
    }
  }

  /**
   * 显示信息消息
   */
  public showInfo(message: string, details?: string): void {
    const icon = chalk.hex(this.theme.info)('ℹ️');
    const mainMessage = chalk.hex(this.theme.info)(message);
    
    console.log(`${icon} ${mainMessage}`);
    
    if (details) {
      console.log(chalk.hex(this.theme.muted)(`   ${details}`));
    }
  }

  /**
   * 创建加载动画
   */
  public createSpinner(text: string): Ora {
    if (this.currentSpinner) {
      this.currentSpinner.stop();
    }

    this.currentSpinner = ora({
      text: chalk.hex(this.theme.primary)(text),
      spinner: 'dots',
      color: 'cyan'
    });

    return this.currentSpinner;
  }

  /**
   * 显示进度条
   */
  public showProgress(config: ProgressConfig): void {
    const percentage = Math.round((config.current / config.total) * 100);
    const barLength = 30;
    const filledLength = Math.round((barLength * config.current) / config.total);
    
    const filledBar = '█'.repeat(filledLength);
    const emptyBar = '░'.repeat(barLength - filledLength);
    
    const progressBar = chalk.hex(this.theme.primary)(filledBar) + 
                       chalk.hex(this.theme.muted)(emptyBar);
    
    let progressText = `${config.label} [${progressBar}]`;
    
    if (config.showPercentage) {
      progressText += ` ${percentage}%`;
    }
    
    if (config.showETA && config.current > 0) {
      const elapsed = performance.now() - this.startTime;
      const eta = (elapsed / config.current) * (config.total - config.current);
      const etaSeconds = Math.round(eta / 1000);
      progressText += ` ETA: ${etaSeconds}s`;
    }
    
    process.stdout.write(`\r${progressText}`);
    
    if (config.current >= config.total) {
      console.log(); // 换行
    }
  }

  /**
   * 显示表格
   */
  public showTable(headers: string[], rows: string[][]): void {
    const columnWidths = headers.map((header, index) => {
      const maxRowWidth = Math.max(...rows.map(row => (row[index] || '').length));
      return Math.max(header.length, maxRowWidth);
    });

    // 表头
    const headerRow = headers.map((header, index) => 
      chalk.hex(this.theme.primary).bold(header.padEnd(columnWidths[index]))
    ).join(' | ');
    
    console.log(headerRow);
    console.log(chalk.hex(this.theme.muted)('-'.repeat(headerRow.length)));

    // 数据行
    rows.forEach(row => {
      const dataRow = row.map((cell, index) => 
        (cell || '').padEnd(columnWidths[index])
      ).join(' | ');
      console.log(dataRow);
    });
  }

  /**
   * 显示统计信息
   */
  public showStats(stats: Record<string, string | number>): void {
    const statsBox = Object.entries(stats)
      .map(([key, value]) => {
        const label = chalk.hex(this.theme.muted)(key + ':');
        const val = chalk.hex(this.theme.primary).bold(String(value));
        return `${label.padEnd(20)} ${val}`;
      })
      .join('\n');

    const box = boxen(statsBox, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: this.theme.secondary,
      title: '📊 统计信息',
      titleAlignment: 'center'
    });

    console.log(box);
  }

  /**
   * 显示代码块
   */
  public showCodeBlock(code: string, language?: string): void {
    const codeBox = boxen(
      chalk.hex(this.theme.muted)(code),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: this.theme.info,
        title: language ? `📝 ${language.toUpperCase()}` : '📝 代码',
        titleAlignment: 'left'
      }
    );

    console.log(codeBox);
  }

  /**
   * 显示分隔线
   */
  public showSeparator(text?: string): void {
    const width = process.stdout.columns || 80;
    const line = '─'.repeat(width);
    
    if (text) {
      const paddedText = ` ${text} `;
      const leftPadding = Math.floor((width - paddedText.length) / 2);
      const rightPadding = width - leftPadding - paddedText.length;
      
      console.log(
        chalk.hex(this.theme.muted)('─'.repeat(leftPadding)) +
        chalk.hex(this.theme.primary).bold(paddedText) +
        chalk.hex(this.theme.muted)('─'.repeat(rightPadding))
      );
    } else {
      console.log(chalk.hex(this.theme.muted)(line));
    }
  }

  /**
   * 清屏
   */
  public clear(): void {
    console.clear();
  }

  /**
   * 显示执行时间
   */
  public showExecutionTime(): void {
    const elapsed = performance.now() - this.startTime;
    const seconds = (elapsed / 1000).toFixed(2);
    
    this.showInfo(`执行完成`, `耗时: ${seconds}秒`);
  }

  /**
   * 停止当前动画
   */
  public stopSpinner(): void {
    if (this.currentSpinner) {
      this.currentSpinner.stop();
      this.currentSpinner = null;
    }
  }

  /**
   * 显示确认对话框
   */
  public async confirm(message: string): Promise<boolean> {
    const inquirer = await import('inquirer');
    const { confirmed } = await inquirer.default.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: chalk.hex(this.theme.warning)(message),
        default: false
      }
    ]);
    
    return confirmed;
  }

  /**
   * 显示选择列表
   */
  public async select(message: string, choices: string[]): Promise<string> {
    const inquirer = await import('inquirer');
    const { selected } = await inquirer.default.prompt([
      {
        type: 'list',
        name: 'selected',
        message: chalk.hex(this.theme.primary)(message),
        choices: choices.map(choice => ({
          name: choice,
          value: choice
        }))
      }
    ]);
    
    return selected;
  }

  /**
   * 显示输入框
   */
  public async input(message: string, defaultValue?: string): Promise<string> {
    const inquirer = await import('inquirer');
    const { value } = await inquirer.default.prompt([
      {
        type: 'input',
        name: 'value',
        message: chalk.hex(this.theme.primary)(message),
        default: defaultValue
      }
    ]);
    
    return value;
  }

  /**
   * 显示多选框
   */
  public async multiSelect(message: string, choices: string[]): Promise<string[]> {
    const inquirer = await import('inquirer');
    const { selected } = await inquirer.default.prompt([
      {
        type: 'checkbox',
        name: 'selected',
        message: chalk.hex(this.theme.primary)(message),
        choices: choices.map(choice => ({
          name: choice,
          value: choice
        }))
      }
    ]);
    
    return selected;
  }
}

/**
 * 全局CLI界面实例
 */
export const cli = new CLIInterface();
