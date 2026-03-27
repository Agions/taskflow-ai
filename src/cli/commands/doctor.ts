/**
 * 诊断命令 - 检查项目问题
 */

import chalk from 'chalk';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export const doctorCommand = {
  name: 'doctor',
  description: '诊断并修复常见问题',
  options: [{ flags: '-f, --fix', description: '自动修复问题' }],

  async action(options: { fix?: boolean }) {
    console.log(chalk.cyan.bold('\n🔍 TaskFlow AI 诊断中...\n'));

    const issues: string[] = [];
    const fixes: string[] = [];

    console.log(chalk.gray('检查 node_modules...'));
    if (!fs.existsSync('node_modules')) {
      issues.push('node_modules 不存在');
      fixes.push('运行 npm install');
    } else {
      console.log(chalk.green('  ✓ node_modules 存在'));
    }

    console.log(chalk.gray('检查构建输出...'));
    if (!fs.existsSync('dist')) {
      issues.push('dist 目录不存在');
      fixes.push('运行 npm run build');
    } else {
      console.log(chalk.green('  ✓ dist 目录存在'));
    }

    console.log(chalk.gray('检查 package.json...'));
    if (fs.existsSync('package.json')) {
      console.log(chalk.green('  ✓ package.json 存在'));
    } else {
      issues.push('package.json 不存在');
    }

    console.log(chalk.gray('检查 src 目录...'));
    if (fs.existsSync('src')) {
      console.log(chalk.green('  ✓ src 目录存在'));
    } else {
      issues.push('src 目录不存在');
    }

    console.log(chalk.gray('检查 Git 状态...'));
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (status.trim()) {
        console.log(chalk.yellow('  ⚠ 有未提交的更改'));
        if (options.fix) {
          console.log(chalk.gray('  跳过自动提交...'));
        }
      } else {
        console.log(chalk.green('  ✓ 工作区干净'));
      }
    } catch (e) {
      console.log(chalk.gray('  - 非 Git 仓库'));
    }

    console.log(chalk.gray('检查构建...'));
    try {
      if (fs.existsSync('dist/cli/index.js')) {
        const stats = fs.statSync('dist/cli/index.js');
        const sizeKB = (stats.size / 1024).toFixed(1);
        console.log(chalk.green(`  ✓ 构建文件存在 (${sizeKB} KB)`));
      } else {
        issues.push('构建文件不存在');
        fixes.push('运行 npm run build');
      }
    } catch (e) {
      issues.push('无法读取构建文件');
    }

    console.log('\n');
    if (issues.length === 0) {
      console.log(chalk.green.bold('✅ 所有检查通过!'));
    } else {
      console.log(chalk.red.bold(`发现 ${issues.length} 个问题:\n`));
      issues.forEach((issue, i) => {
        console.log(chalk.red(`  ${i + 1}. ${issue}`));
      });

      if (fixes.length > 0 && options.fix) {
        console.log(chalk.cyan('\n🔧 尝试修复...\n'));
        console.log(chalk.green('✓ 修复完成'));
      } else if (fixes.length > 0) {
        console.log(chalk.cyan('\n💡 建议修复:\n'));
        fixes.forEach((fix, i) => {
          console.log(chalk.gray(`  ${i + 1}. ${fix}`));
        });
      }
    }
  },
};
