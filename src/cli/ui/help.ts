/**
 * 优化帮助信息展示
 */

import chalk = require('chalk');
import boxen from 'boxen';
import { theme } from './theme';
import { animations } from './animations';

// ==================== 命令定义 ====================

interface CommandDef {
  name: string;
  aliases?: string[];
  description: string;
  usage?: string;
  examples?: string[];
  options?: OptionDef[];
  subcommands?: CommandDef[];
  category?: string;
  emoji?: string;
}

interface OptionDef {
  flags: string;
  description: string;
  defaultValue?: string;
  required?: boolean;
}

// ==================== 帮助展示器 ====================

export class HelpDisplay {
  private commands: Map<string, CommandDef> = new Map();
  private categories: Map<string, CommandDef[]> = new Map();

  /**
   * 注册命令
   */
  register(command: CommandDef): void {
    this.commands.set(command.name, command);

    const category = command.category || 'General';
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }
    this.categories.get(category)!.push(command);

    // 注册别名
    command.aliases?.forEach(alias => {
      this.commands.set(alias, command);
    });
  }

  /**
   * 显示主帮助
   */
  showMainHelp(programName: string, version: string, description: string): void {
    // Logo
    console.log(
      '\n' +
        animations.gradientText(
          `  ╔═══════════════════════════════════════╗
  ║     ⚡ ${programName} v${version} ⚡          ║
  ╚═══════════════════════════════════════╝`,
          'brand'
        )
    );

    // 描述
    console.log('\n' + theme.info(description) + '\n');

    // 使用方式
    console.log(theme.highlight('📖 使用方式:'));
    console.log(
      `  ${theme.primary('$')} ${programName} ${theme.muted('<command>')} ${theme.muted('[options]')}\n`
    );

    // 按分类显示命令
    console.log(theme.highlight('🚀 可用命令:\n'));

    for (const [category, commands] of this.categories) {
      console.log(theme.secondary(`  ${animations.emojis.folder} ${category}:`));

      commands.forEach(cmd => {
        const emoji = cmd.emoji || '▸';
        const name = theme.highlight(cmd.name.padEnd(15));
        const desc = theme.info(cmd.description);
        console.log(`    ${emoji} ${name} ${desc}`);
      });

      console.log();
    }

    // 快速开始
    console.log(theme.highlight('⚡ 快速开始:'));
    console.log(
      `  ${theme.primary('$')} ${programName} init          ${theme.muted('# 初始化项目')}`
    );
    console.log(
      `  ${theme.primary('$')} ${programName} status        ${theme.muted('# 查看状态')}`
    );
    console.log(
      `  ${theme.primary('$')} ${programName} --help        ${theme.muted('# 显示帮助')}\n`
    );

    // 更多信息
    console.log(
      theme.muted('  使用 ') +
        theme.primary(`${programName} <command> --help`) +
        theme.muted(' 查看命令详情\n')
    );
  }

  /**
   * 显示命令帮助
   */
  showCommandHelp(commandName: string): void {
    const cmd = this.commands.get(commandName);
    if (!cmd) {
      console.log(theme.error(`\n❌ 未知命令: ${commandName}\n`));
      return;
    }

    // 命令标题
    const emoji = cmd.emoji || '⚡';
    console.log(
      '\n' +
        boxen(`${emoji} ${theme.highlight(cmd.name)}\n${theme.info(cmd.description)}`, {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'cyan',
          title: theme.primary(' COMMAND '),
          titleAlignment: 'center',
        })
    );

    // 别名
    if (cmd.aliases && cmd.aliases.length > 0) {
      console.log(theme.highlight('📝 别名:'));
      console.log(`  ${cmd.aliases.map(a => theme.info(a)).join(', ')}\n`);
    }

    // 使用方式
    if (cmd.usage) {
      console.log(theme.highlight('📖 使用方式:'));
      console.log(`  ${theme.primary('$')} ${cmd.usage}\n`);
    }

    // 选项
    if (cmd.options && cmd.options.length > 0) {
      console.log(theme.highlight('⚙️  选项:\n'));

      cmd.options.forEach(opt => {
        const flags = theme.highlight(opt.flags.padEnd(20));
        const desc = theme.info(opt.description);
        const required = opt.required ? theme.error(' [必需]') : '';
        const defaultVal = opt.defaultValue ? theme.muted(` (默认: ${opt.defaultValue})`) : '';

        console.log(`  ${flags} ${desc}${required}${defaultVal}`);
      });

      console.log();
    }

    // 子命令
    if (cmd.subcommands && cmd.subcommands.length > 0) {
      console.log(theme.highlight('📂 子命令:\n'));

      cmd.subcommands.forEach(sub => {
        const name = theme.highlight(sub.name.padEnd(15));
        const desc = theme.info(sub.description);
        console.log(`  ${name} ${desc}`);
      });

      console.log();
    }

    // 示例
    if (cmd.examples && cmd.examples.length > 0) {
      console.log(theme.highlight('💡 示例:\n'));

      cmd.examples.forEach((example, index) => {
        console.log(`  ${theme.muted(`${index + 1}.`)} ${theme.primary('$')} ${example}`);
      });

      console.log();
    }
  }

  /**
   * 显示搜索帮助
   */
  showSearchHelp(query: string): void {
    const results: CommandDef[] = [];
    const lowerQuery = query.toLowerCase();

    for (const cmd of this.commands.values()) {
      if (
        cmd.name.toLowerCase().includes(lowerQuery) ||
        cmd.description.toLowerCase().includes(lowerQuery)
      ) {
        results.push(cmd);
      }
    }

    if (results.length === 0) {
      console.log(theme.warning(`\n⚠️  未找到与 "${query}" 相关的命令\n`));
      return;
    }

    console.log(
      `\n${theme.highlight('🔍 搜索结果:')} ${theme.info(`找到 ${results.length} 个命令`)}\n`
    );

    results.forEach(cmd => {
      const emoji = cmd.emoji || '▸';
      const name = theme.highlight(cmd.name);
      const desc = theme.info(cmd.description);
      console.log(`  ${emoji} ${name} - ${desc}`);
    });

    console.log();
  }

  /**
   * 显示全局选项
   */
  showGlobalOptions(): void {
    console.log(theme.highlight('\n🌍 全局选项:\n'));

    const options = [
      { flags: '-v, --version', desc: '显示版本号' },
      { flags: '-h, --help', desc: '显示帮助信息' },
      { flags: '--verbose', desc: '显示详细输出' },
      { flags: '--debug', desc: '启用调试模式' },
      { flags: '--config <path>', desc: '指定配置文件路径' },
      { flags: '--no-color', desc: '禁用彩色输出' },
    ];

    options.forEach(opt => {
      console.log(`  ${theme.highlight(opt.flags.padEnd(20))} ${theme.info(opt.desc)}`);
    });

    console.log();
  }

  /**
   * 显示提示
   */
  showTips(): void {
    const tips = [
      '使用 Tab 键自动补全命令',
      '使用 ↑↓ 键浏览历史命令',
      '使用 --help 查看命令详情',
      '使用 --verbose 查看详细输出',
    ];

    console.log(theme.highlight('\n💡 小贴士:\n'));

    tips.forEach((tip, index) => {
      console.log(`  ${theme.muted(`${index + 1}.`)} ${theme.info(tip)}`);
    });

    console.log();
  }
}

// ==================== 快捷函数 ====================

/**
 * 创建帮助展示器
 */
export function createHelpDisplay(): HelpDisplay {
  return new HelpDisplay();
}

/**
 * 显示简洁帮助
 */
export function showQuickHelp(commands: Array<{ name: string; desc: string }>): void {
  console.log('\n' + theme.highlight('⚡ 快速参考:\n'));

  commands.forEach(cmd => {
    console.log(`  ${theme.highlight(cmd.name.padEnd(15))} ${theme.info(cmd.desc)}`);
  });

  console.log();
}

/**
 * 显示错误帮助
 */
export function showErrorHelp(error: string, suggestion?: string): void {
  console.log(
    boxen(
      `${theme.error('❌ ' + error)}\n\n` +
        (suggestion ? `${theme.info('💡 建议: ' + suggestion)}` : ''),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'red',
        title: theme.error(' ERROR '),
        titleAlignment: 'left',
      }
    )
  );
}

/**
 * 显示成功帮助
 */
export function showSuccessHelp(message: string, nextSteps?: string[]): void {
  const content = [theme.success('✅ ' + message)];

  if (nextSteps && nextSteps.length > 0) {
    content.push('');
    content.push(theme.highlight('下一步:'));
    nextSteps.forEach((step, index) => {
      content.push(`  ${theme.muted(`${index + 1}.`)} ${theme.info(step)}`);
    });
  }

  console.log(
    boxen(content.join('\n'), {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'green',
      title: theme.success(' SUCCESS '),
      titleAlignment: 'left',
    })
  );
}

// 导出所有帮助组件
export const help = {
  HelpDisplay,
  createHelpDisplay,
  showQuickHelp,
  showErrorHelp,
  showSuccessHelp,
};

export default help;
