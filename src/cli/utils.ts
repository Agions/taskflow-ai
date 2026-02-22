/**
 * CLI 共享工具
 * 减少命令文件中的重复代码
 */

import chalk from 'chalk';

// 常用颜色输出
export const log = {
  info: (msg: string) => console.log(chalk.cyan(msg)),
  success: (msg: string) => console.log(chalk.green(msg)),
  error: (msg: string) => console.log(chalk.red(msg)),
  warn: (msg: string) => console.log(chalk.yellow(msg)),
  dim: (msg: string) => console.log(chalk.gray(msg)),
};

// 格式化输出
export const format = {
  title: (msg: string) => console.log(chalk.bold.cyan(`\n${msg}\n`)),
  section: (msg: string) => console.log(chalk.bold(`\n📋 ${msg}\n`)),
  item: (label: string, value: string) => console.log(`  ${chalk.cyan(label)}: ${value}`),
  keyValue: (obj: Record<string, string>) => {
    Object.entries(obj).forEach(([k, v]) => log.item(k, v));
  },
};

// 表格输出
export const table = {
  simple: (headers: string[], rows: string[][]) => {
    const colWidths = headers.map((h, i) => 
      Math.max(h.length, ...rows.map(r => (r[i] || '').length))
    );
    
    // 表头
    console.log(headers.map((h, i) => chalk.bold(h.padEnd(colWidths[i]))).join('  '));
    console.log(colWidths.map(w => '-'.repeat(w)).join('  '));
    
    // 行
    rows.forEach(row => {
      console.log(row.map((c, i) => (c || '').padEnd(colWidths[i])).join('  '));
    });
  },
};

// 确认提示
export async function confirm(message: string): Promise<boolean> {
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  
  return new Promise(resolve => {
    rl.question(chalk.yellow(`${message} (y/N): `), answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

// 加载动画
export class Spinner {
  private interval: NodeJS.Timeout | null = null;
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private frame = 0;
  
  start(message: string) {
    process.stdout.write(chalk.cyan(`${message} `));
    this.interval = setInterval(() => {
      process.stdout.write(`\r${chalk.cyan(message + ' ' + this.frames[this.frame++ % this.frames.length])} `);
    }, 80);
  }
  
  stop(success: boolean = true) {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    process.stdout.write(`\r${success ? '✅' : '❌'} \n`);
  }
}

// 导出 chalk 直接使用
export { chalk };
