/**
 * 统计命令 - 显示项目统计信息
 */

import chalk from 'chalk';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export const statsCommand = {
  name: 'stats',
  description: '显示项目统计信息',
  options: [
    { flags: '-v, --verbose', description: '显示详细信息' },
    { flags: '-j, --json', description: '输出 JSON 格式' },
  ],
  
  async action(options: { verbose?: boolean; json?: boolean }) {
    try {
      const stats = collectStats(options.verbose || false);
      
      if (options.json) {
        console.log(JSON.stringify(stats, null, 2));
      } else {
        printStats(stats);
      }
    } catch (error) {
      console.error(chalk.red('获取统计信息失败:'), error);
    }
  }
};

interface ProjectStats {
  files: {
    total: number;
    code: number;
    comments: number;
    blank: number;
  };
  lines: {
    code: number;
    comments: number;
    blank: number;
  };
  languages: Array<{ name: string; files: number; lines: number }>;
  size: {
    src: string;
    node_modules: string;
    dist: string;
  };
}

function collectStats(verbose: boolean): ProjectStats {
  const stats: ProjectStats = {
    files: { total: 0, code: 0, comments: 0, blank: 0 },
    lines: { code: 0, comments: 0, blank: 0 },
    languages: [],
    size: { src: '', node_modules: '', dist: '' }
  };

  // 统计文件数
  try {
    const srcCount = execSync('find src -type f | wc -l', { encoding: 'utf8' }).trim();
    stats.files.total = parseInt(srcCount) || 0;
    
    const codeCount = execSync('find src -name "*.ts" -o -name "*.tsx" | wc -l', { encoding: 'utf8' }).trim();
    stats.files.code = parseInt(codeCount) || 0;
  } catch (e) {
    // ignore
  }

  // 统计代码行数
  try {
    const lines = execSync('find src -name "*.ts" -o -name "*.tsx" | xargs wc -l 2>/dev/null | tail -1', { encoding: 'utf8' }).trim();
    const match = lines.match(/(\d+)\s+total/);
    if (match) {
      stats.lines.code = parseInt(match[1]) || 0;
    }
  } catch (e) {
    // ignore
  }

  // 统计目录大小
  try {
    const srcSize = execSync('du -sh src 2>/dev/null | cut -f1', { encoding: 'utf8' }).trim();
    stats.size.src = srcSize || '0';
  } catch (e) {
    stats.size.src = '0';
  }

  try {
    const distSize = execSync('du -sh dist 2>/dev/null | cut -f1', { encoding: 'utf8' }).trim();
    stats.size.dist = distSize || '0';
  } catch (e) {
    stats.size.dist = '0';
  }

  return stats;
}

function printStats(stats: ProjectStats) {
  console.log(chalk.cyan.bold('\n📊 项目统计\n'));
  
  console.log(chalk.gray('┌─────────────────────────────────────┐'));
  console.log(chalk.gray('│') + chalk.white(' 文件统计                              ') + chalk.gray('│'));
  console.log(chalk.gray('├─────────────────────────────────────┤'));
  console.log(chalk.gray('│') + `  总文件数: ${chalk.yellow(stats.files.total.toString().padEnd(20))}` + chalk.gray('│'));
  console.log(chalk.gray('│') + `  代码文件: ${chalk.green(stats.files.code.toString().padEnd(20))}` + chalk.gray('│'));
  console.log(chalk.gray('│') + `  代码行数: ${chalk.blue(stats.lines.code.toString().padEnd(20))}` + chalk.gray('│'));
  console.log(chalk.gray('└─────────────────────────────────────┘\n'));

  console.log(chalk.cyan('📁 目录大小:'));
  console.log(`   src: ${chalk.green(stats.size.src)}`);
  console.log(`   dist: ${chalk.yellow(stats.size.dist)}`);
}
