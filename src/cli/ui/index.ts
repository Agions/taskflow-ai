/**
 * TaskFlow AI - 专业级 CLI UI 组件库
 * 提供精美的终端界面组件
 */

import chalk from 'chalk';
import ora, { Ora } from 'ora';
import boxen from 'boxen';
import figlet from 'figlet';
import gradient from 'gradient-string';

// ==================== 颜色主题 ====================

export const theme = {
  primary: chalk.cyan,
  secondary: chalk.blue,
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
  info: chalk.gray,
  muted: chalk.dim,
  highlight: chalk.bold.white,
  accent: chalk.magenta,
};

// ==================== Logo 展示 ====================

/**
 * 显示 ASCII Logo（带渐变效果）
 */
export async function showLogo(): Promise<void> {
  const logo = figlet.textSync('TaskFlow', {
    font: 'Standard',
    horizontalLayout: 'default',
    verticalLayout: 'default'
  });

  // 使用品牌渐变
  const brandGradient = gradient(['#00D9FF', '#00A8E8', '#0077B6']);

  console.log('\n' + brandGradient.multiline(logo));
  console.log(
    gradient(['#00D9FF', '#00A8E8'])('  AI') +
    theme.muted(' · ') +
    gradient(['#00E676', '#00BFA5'])('智能任务编排') +
    theme.muted(' · ') +
    gradient(['#FFD700', '#FFA500'])('PRD解析') +
    '\n'
  );
}

/**
 * 显示简洁 Logo
 */
export function showSimpleLogo(): void {
  console.log('\n' + boxen(
    theme.primary.bold('⚡ TaskFlow AI') + '\n' +
    theme.muted('智能PRD文档解析与任务管理助手'),
    {
      padding: 1,
      margin: { top: 0, bottom: 1 },
      borderStyle: 'round',
      borderColor: 'cyan',
      dimBorder: false
    }
  ));
}

// ==================== 加载动画 ====================

export class Spinner {
  private spinner: Ora;

  constructor(text: string) {
    this.spinner = ora({
      text: theme.info(text),
      spinner: 'dots',
      color: 'cyan'
    });
  }

  start(): this {
    this.spinner.start();
    return this;
  }

  succeed(text?: string): this {
    this.spinner.succeed(text ? theme.success(text) : undefined);
    return this;
  }

  fail(text?: string): this {
    this.spinner.fail(text ? theme.error(text) : undefined);
    return this;
  }

  warn(text?: string): this {
    this.spinner.warn(text ? theme.warning(text) : undefined);
    return this;
  }

  info(text?: string): this {
    this.spinner.info(text ? theme.info(text) : undefined);
    return this;
  }

  update(text: string): this {
    this.spinner.text = theme.info(text);
    return this;
  }
}

// ==================== 信息框 ====================

/**
 * 成功信息框
 */
export function successBox(title: string, message: string): void {
  console.log(boxen(
    theme.success.bold('✓ ' + title) + '\n\n' + theme.info(message),
    {
      padding: 1,
      margin: { top: 0, bottom: 1 },
      borderStyle: 'round',
      borderColor: 'green',
      title: theme.success(' SUCCESS '),
      titleAlignment: 'left'
    }
  ));
}

/**
 * 错误信息框
 */
export function errorBox(title: string, message: string, details?: string): void {
  let content = theme.error.bold('✗ ' + title) + '\n\n' + theme.info(message);
  if (details) {
    content += '\n\n' + theme.muted(details);
  }

  console.log(boxen(content, {
    padding: 1,
    margin: { top: 0, bottom: 1 },
    borderStyle: 'round',
    borderColor: 'red',
    title: theme.error(' ERROR '),
    titleAlignment: 'left'
  }));
}

/**
 * 警告信息框
 */
export function warningBox(title: string, message: string): void {
  console.log(boxen(
    theme.warning.bold('⚠ ' + title) + '\n\n' + theme.info(message),
    {
      padding: 1,
      margin: { top: 0, bottom: 1 },
      borderStyle: 'round',
      borderColor: 'yellow',
      title: theme.warning(' WARNING '),
      titleAlignment: 'left'
    }
  ));
}

/**
 * 信息提示框
 */
export function infoBox(title: string, message: string): void {
  console.log(boxen(
    theme.secondary.bold('ℹ ' + title) + '\n\n' + theme.info(message),
    {
      padding: 1,
      margin: { top: 0, bottom: 1 },
      borderStyle: 'round',
      borderColor: 'blue',
      title: theme.secondary(' INFO '),
      titleAlignment: 'left'
    }
  ));
}

// ==================== 列表展示 ====================

/**
 * 显示项目列表
 */
export function list(title: string, items: string[]): void {
  console.log('\n' + theme.highlight('◆ ' + title));
  items.forEach((item, index) => {
    const num = theme.muted(`${(index + 1).toString().padStart(2, '0')}.`);
    console.log(`  ${num} ${theme.info(item)}`);
  });
  console.log();
}

/**
 * 显示键值对
 */
export function keyValue(pairs: Record<string, string>): void {
  const maxKeyLength = Math.max(...Object.keys(pairs).map(k => k.length));

  Object.entries(pairs).forEach(([key, value]) => {
    const paddedKey = key.padEnd(maxKeyLength);
    console.log(`  ${theme.muted(paddedKey)}  ${theme.info(value)}`);
  });
}

// ==================== 表格 ====================

export interface TableColumn {
  header: string;
  key: string;
  width?: number;
  align?: 'left' | 'right' | 'center';
}

export interface TableData {
  [key: string]: string | number;
}

/**
 * 简单表格
 */
export function table(columns: TableColumn[], data: TableData[]): void {
  // 计算列宽
  const colWidths = columns.map(col => {
    const headerLen = col.header.length;
    const maxDataLen = Math.max(...data.map(row => String(row[col.key]).length));
    return col.width || Math.max(headerLen, maxDataLen) + 2;
  });

  // 分隔线
  const separator = '┌' + colWidths.map(w => '─'.repeat(w)).join('┬') + '┐';
  const midSeparator = '├' + colWidths.map(w => '─'.repeat(w)).join('┼') + '┤';
  const bottomSeparator = '└' + colWidths.map(w => '─'.repeat(w)).join('┴') + '┘';

  // 表头
  const headerRow = '│' + columns.map((col, i) => {
    const width = colWidths[i];
    return ' ' + theme.highlight(col.header).padEnd(width - 1);
  }).join('│') + '│';

  console.log(theme.muted(separator));
  console.log(headerRow);
  console.log(theme.muted(midSeparator));

  // 数据行
  data.forEach(row => {
    const dataRow = '│' + columns.map((col, i) => {
      const width = colWidths[i];
      const value = String(row[col.key]);
      return ' ' + theme.info(value).padEnd(width - 1);
    }).join('│') + '│';
    console.log(dataRow);
  });

  console.log(theme.muted(bottomSeparator));
}

// ==================== 进度条 ====================

/**
 * 显示进度条
 */
export function progressBar(current: number, total: number, label?: string): string {
  const width = 30;
  const filled = Math.round((current / total) * width);
  const empty = width - filled;

  const bar = theme.success('█'.repeat(filled)) + theme.muted('░'.repeat(empty));
  const percent = Math.round((current / total) * 100);

  let result = `[${bar}] ${theme.highlight(`${percent}%`)}`;
  if (label) {
    result = `${theme.info(label)} ${result}`;
  }

  return result;
}

// ==================== 分隔线 ====================

/**
 * 分隔线
 */
export function divider(char: string = '─', length: number = 60): void {
  console.log(theme.muted(char.repeat(length)));
}

/**
 * 章节标题
 */
export function section(title: string): void {
  console.log('\n' + theme.primary.bold('▸ ' + title));
  divider('─', title.length + 3);
}

// Re-export prompts and dashboard
export * from './prompts';
export * from './dashboard';
export * from './animations';
export * from './autocomplete';
export * from './help';

// ==================== 快捷方法 ====================

// 导入动画和帮助组件
import { animations } from './animations';
import { createHelpDisplay, showQuickHelp, showErrorHelp, showSuccessHelp } from './help';
import { createAutocomplete, createPreview, createHints } from './autocomplete';

export const ui = {
  // 颜色
  ...theme,

  // Logo
  showLogo,
  showSimpleLogo,

  // 加载
  spinner: (text: string) => new Spinner(text),

  // 信息框
  success: successBox,
  error: errorBox,
  warning: warningBox,
  info: infoBox,

  // 列表
  list,
  keyValue,

  // 表格
  table,

  // 进度
  progress: progressBar,

  // 分隔
  divider,
  section,

  // 动画效果
  rainbow: animations.rainbow,
  gradient: animations.gradientText,
  pulse: animations.pulse,
  neon: animations.neon,
  glow: animations.glow,
  wave: animations.wave,
  twinkle: animations.twinkle,
  emoji: animations.statusEmoji,
  emojis: animations.emojis,

  // 帮助
  createHelpDisplay,
  showQuickHelp,
  showErrorHelp,
  showSuccessHelp,

  // 自动补全
  createAutocomplete,
  createPreview,
  createHints,
};

export default ui;
