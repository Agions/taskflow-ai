/**
 * 升级命令 - 检查并更新版本
 */

import chalk from 'chalk';
import { execSync } from 'child_process';
import fs from 'fs';

export const upgradeCommand = {
  name: 'upgrade',
  description: '检查并更新 TaskFlow AI',
  options: [
    { flags: '-c, --check', description: '仅检查版本，不更新' },
    { flags: '-f, --force', description: '强制更新' },
  ],
  
  async action(options: { check?: boolean; force?: boolean }) {
    console.log(chalk.cyan.bold('\n⬆️ TaskFlow AI 版本检查\n'));

    // 获取当前版本
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const currentVersion = packageJson.version;
    
    console.log(chalk.gray(`当前版本: ${chalk.yellow(currentVersion)}`));

    // 检查 npm 最新版本
    console.log(chalk.gray('\n检查 npm 最新版本...\n'));
    
    try {
      const latestVersion = execSync('npm view taskflow-ai version', { encoding: 'utf8' }).trim();
      
      if (latestVersion === currentVersion) {
        console.log(chalk.green('✓ 已是最新版本!'));
      } else {
        console.log(chalk.yellow(`最新版本: ${latestVersion}`));
        
        if (!options.check) {
          console.log(chalk.cyan('\n正在更新...\n'));
          
          try {
            execSync('npm install taskflow-ai@latest', { stdio: 'inherit' });
            console.log(chalk.green('\n✓ 更新完成!'));
          } catch (e) {
            console.log(chalk.red('\n✗ 更新失败，请手动运行: npm install taskflow-ai@latest'));
          }
        }
      }
    } catch (e) {
      console.log(chalk.gray('  - 无法检查最新版本 (可能未发布到 npm)'));
    }

    // 检查依赖更新
    console.log(chalk.cyan('\n📦 检查依赖更新...\n'));
    
    try {
      const outdated = execSync('npm outdated --json 2>/dev/null | head -100', { encoding: 'utf8' });
      const deps = JSON.parse(outdated || '{}');
      
      const depNames = Object.keys(deps);
      
      if (depNames.length === 0) {
        console.log(chalk.green('✓ 所有依赖已是最新'));
      } else {
        console.log(chalk.yellow(`发现 ${depNames.length} 个依赖可更新:\n`));
        
        depNames.forEach(name => {
          const dep = deps[name];
          console.log(`  ${chalk.gray(name)}:`);
          console.log(`    ${chalk.red(dep.current)} → ${chalk.green(dep.latest)}`);
        });
        
        if (!options.check) {
          console.log(chalk.cyan('\n运行 npm update 更新依赖'));
        }
      }
    } catch (e) {
      console.log(chalk.gray('  - 无法检查依赖更新'));
    }
  }
};
