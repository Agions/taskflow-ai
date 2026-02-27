/**
 * 自动补全和实时预览组件
 */

import readline from 'readline';
import { theme } from './index';

// ==================== 自动补全 ====================

interface AutocompleteOptions {
  suggestions: string[];
  maxSuggestions?: number;
  caseSensitive?: boolean;
  highlightMatch?: boolean;
}

/**
 * 命令自动补全
 */
export class Autocomplete {
  private suggestions: string[];
  private maxSuggestions: number;
  private caseSensitive: boolean;
  private highlightMatch: boolean;
  private currentInput: string = '';
  private filteredSuggestions: string[] = [];
  private selectedIndex: number = -1;

  constructor(options: AutocompleteOptions) {
    this.suggestions = options.suggestions;
    this.maxSuggestions = options.maxSuggestions || 5;
    this.caseSensitive = options.caseSensitive ?? false;
    this.highlightMatch = options.highlightMatch ?? true;
  }

  /**
   * 更新输入并过滤建议
   */
  update(input: string): string[] {
    this.currentInput = input;
    this.selectedIndex = -1;

    if (!input) {
      this.filteredSuggestions = [];
      return [];
    }

    const searchTerm = this.caseSensitive ? input : input.toLowerCase();

    this.filteredSuggestions = this.suggestions
      .filter(s => {
        const compareTerm = this.caseSensitive ? s : s.toLowerCase();
        return compareTerm.includes(searchTerm);
      })
      .slice(0, this.maxSuggestions);

    return this.filteredSuggestions;
  }

  /**
   * 选择下一个建议
   */
  next(): string | null {
    if (this.filteredSuggestions.length === 0) return null;

    this.selectedIndex = (this.selectedIndex + 1) % this.filteredSuggestions.length;
    return this.filteredSuggestions[this.selectedIndex];
  }

  /**
   * 选择上一个建议
   */
  previous(): string | null {
    if (this.filteredSuggestions.length === 0) return null;

    this.selectedIndex = this.selectedIndex <= 0
      ? this.filteredSuggestions.length - 1
      : this.selectedIndex - 1;

    return this.filteredSuggestions[this.selectedIndex];
  }

  /**
   * 获取当前选中的建议
   */
  getSelected(): string | null {
    if (this.selectedIndex < 0) return null;
    return this.filteredSuggestions[this.selectedIndex];
  }

  /**
   * 渲染建议列表
   */
  render(): string {
    if (this.filteredSuggestions.length === 0) return '';

    const lines = this.filteredSuggestions.map((suggestion, index) => {
      const isSelected = index === this.selectedIndex;
      const prefix = isSelected ? theme.primary('▸ ') : '  ';

      let displayText = suggestion;
      if (this.highlightMatch && this.currentInput) {
        displayText = this.highlightMatchText(suggestion, this.currentInput);
      }

      const styledText = isSelected
        ? theme.highlight(displayText)
        : theme.info(displayText);

      return `${prefix}${styledText}`;
    });

    return '\n' + lines.join('\n') + '\n';
  }

  /**
   * 高亮匹配文本
   */
  private highlightMatchText(text: string, match: string): string {
    const regex = new RegExp(`(${this.escapeRegex(match)})`, this.caseSensitive ? 'g' : 'gi');
    return text.replace(regex, theme.accent('$1'));
  }

  /**
   * 转义正则特殊字符
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// ==================== 实时预览 ====================

interface PreviewOptions {
  maxHeight?: number;
  border?: boolean;
  title?: string;
}

/**
 * 实时预览组件
 */
export class LivePreview {
  private content: string = '';
  private options: PreviewOptions;

  constructor(options: PreviewOptions = {}) {
    this.options = {
      maxHeight: options.maxHeight || 10,
      border: options.border ?? true,
      title: options.title,
    };
  }

  /**
   * 更新预览内容
   */
  update(content: string): void {
    this.content = content;
    this.render();
  }

  /**
   * 渲染预览
   */
  render(): void {
    const lines = this.content.split('\n');
    const truncated = lines.slice(0, this.options.maxHeight);

    if (lines.length > this.options.maxHeight!) {
      truncated.push(theme.muted(`... (${lines.length - this.options.maxHeight!} more lines)`));
    }

    let output = truncated.join('\n');

    if (this.options.border) {
      const width = Math.max(...truncated.map(l => l.length), 40);
      const border = '─'.repeat(width);
      const title = this.options.title ? ` ${this.options.title} ` : '';

      output = [
        theme.muted(`┌${border.slice(0, Math.floor((width - title.length) / 2))}${title}${border.slice(0, Math.ceil((width - title.length) / 2))}┐`),
        ...truncated.map(l => theme.muted('│') + ' ' + l.padEnd(width - 1) + theme.muted('│')),
        theme.muted(`└${border}┘`),
      ].join('\n');
    }

    // 清除之前的输出并重新渲染
    process.stdout.write('\x1b[2J\x1b[0f'); // 清屏
    console.log(output);
  }

  /**
   * 清除预览
   */
  clear(): void {
    this.content = '';
    process.stdout.write('\x1b[2J\x1b[0f');
  }
}

// ==================== 智能提示 ====================

interface SmartHint {
  command: string;
  description: string;
  examples?: string[];
}

/**
 * 智能提示系统
 */
export class SmartHints {
  private hints: Map<string, SmartHint> = new Map();

  /**
   * 注册提示
   */
  register(command: string, description: string, examples?: string[]): void {
    this.hints.set(command, { command, description, examples });
  }

  /**
   * 获取提示
   */
  get(command: string): SmartHint | undefined {
    return this.hints.get(command);
  }

  /**
   * 搜索提示
   */
  search(query: string): SmartHint[] {
    const results: SmartHint[] = [];
    const lowerQuery = query.toLowerCase();

    for (const hint of this.hints.values()) {
      if (hint.command.toLowerCase().includes(lowerQuery) ||
          hint.description.toLowerCase().includes(lowerQuery)) {
        results.push(hint);
      }
    }

    return results;
  }

  /**
   * 渲染提示
   */
  renderHint(command: string): string {
    const hint = this.hints.get(command);
    if (!hint) return '';

    const lines = [
      '',
      theme.secondary('💡 提示:'),
      `  ${theme.highlight(hint.command)} - ${theme.info(hint.description)}`,
    ];

    if (hint.examples && hint.examples.length > 0) {
      lines.push(theme.muted('  示例:'));
      hint.examples.forEach(ex => {
        lines.push(`    ${theme.primary('$')} ${ex}`);
      });
    }

    return lines.join('\n');
  }

  /**
   * 渲染所有提示
   */
  renderAll(): string {
    if (this.hints.size === 0) return '';

    const lines = ['', theme.secondary('📚 可用命令:')];

    for (const hint of this.hints.values()) {
      lines.push(`  ${theme.highlight(hint.command.padEnd(20))} ${theme.info(hint.description)}`);
    }

    return lines.join('\n') + '\n';
  }
}

// ==================== 交互式输入 ====================

interface InteractiveInputOptions {
  prompt?: string;
  autocomplete?: Autocomplete;
  preview?: LivePreview;
  hints?: SmartHints;
  onChange?: (input: string) => void;
  onSubmit?: (input: string) => void;
}

/**
 * 交互式输入（带自动补全和预览）
 */
export class InteractiveInput {
  private rl: readline.Interface;
  private options: InteractiveInputOptions;
  private currentInput: string = '';

  constructor(options: InteractiveInputOptions) {
    this.options = options;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: options.prompt || '> ',
    });

    this.setupEventHandlers();
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    // Tab 键自动补全
    this.rl.on('line', (input) => {
      this.currentInput = input;
      if (this.options.onSubmit) {
        this.options.onSubmit(input);
      }
    });

    // 监听输入变化
    process.stdin.on('keypress', (str, key) => {
      if (key.name === 'tab' && this.options.autocomplete) {
        const suggestion = this.options.autocomplete.next();
        if (suggestion) {
          this.rl.write(null, { ctrl: true, name: 'u' }); // 清除当前行
          this.rl.write(suggestion);
        }
      }

      if (this.options.onChange) {
        this.options.onChange(this.currentInput);
      }
    });
  }

  /**
   * 开始输入
   */
  async question(prompt?: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt || this.options.prompt || '> ', (answer) => {
        resolve(answer);
      });
    });
  }

  /**
   * 关闭输入
   */
  close(): void {
    this.rl.close();
  }
}

// ==================== 快捷函数 ====================

/**
 * 创建命令自动补全
 */
export function createAutocomplete(commands: string[], maxSuggestions = 5): Autocomplete {
  return new Autocomplete({
    suggestions: commands,
    maxSuggestions,
    caseSensitive: false,
    highlightMatch: true,
  });
}

/**
 * 创建实时预览
 */
export function createPreview(options?: PreviewOptions): LivePreview {
  return new LivePreview(options);
}

/**
 * 创建智能提示
 */
export function createHints(): SmartHints {
  return new SmartHints();
}

// 导出所有组件
export const autocomplete = {
  Autocomplete,
  LivePreview,
  SmartHints,
  InteractiveInput,
  createAutocomplete,
  createPreview,
  createHints,
};

export default autocomplete;
