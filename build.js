#!/usr/bin/env node

/**
 * 构建脚本 - 支持增量构建
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');

const startTime = Date.now();

// 解析命令行参数
const args = process.argv.slice(2);
const isWatch = args.includes('--watch');
const isClean = args.includes('--clean');
const isIncremental = !isClean && !args.includes('--full');

console.log('🚀 TaskFlow AI 构建...\n');
console.log(`   模式: ${isClean ? '完全清理' : isWatch ? '监听' : '增量'}`);

try {
  // 检查是否需要清理
  if (isClean && fs.existsSync(distDir)) {
    console.log('🧹 清理旧的构建文件...');
    fs.rmSync(distDir, { recursive: true, force: true });
  }

  // 检查增量构建条件
  const needsFullBuild = isClean || !fs.existsSync(distDir);

  if (!needsFullBuild && isIncremental) {
    // 增量构建：只编译修改过的文件
    console.log('⚡ 增量编译...');
    const tscCmd = isWatch
      ? 'npx tsc -p tsconfig.build.json --watch --incremental'
      : 'npx tsc -p tsconfig.build.json --incremental';

    if (isWatch) {
      execSync(tscCmd, { cwd: rootDir, stdio: 'inherit' });
      console.log('👀 监听模式开启，按 Ctrl+C 退出');
    } else {
      execSync(tscCmd, { cwd: rootDir, stdio: 'inherit' });
    }
  } else {
    // 完全构建
    console.log('📦 完全编译...');

    // 清理旧的构建文件
    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true, force: true });
    }

    execSync('npx tsc -p tsconfig.build.json', { cwd: rootDir, stdio: 'inherit' });
  }

  // 创建 bin 目录和入口文件
  const binDir = path.join(rootDir, 'bin');
  fs.mkdirSync(binDir, { recursive: true });

  const cliIndexPath = path.join(distDir, 'cli', 'index.js');
  const binIndexPath = path.join(binDir, 'index.js');
  const distIndexPath = path.join(distDir, 'index.js');

  // 创建主入口文件
  if (fs.existsSync(cliIndexPath)) {
    const binContent = `#!/usr/bin/env node
require('../dist/cli/index.js');
`;
    const distContent = `#!/usr/bin/env node
require('./cli/index.js');
`;
    fs.writeFileSync(distIndexPath, distContent);
    fs.writeFileSync(binIndexPath, binContent);
    fs.chmodSync(binIndexPath, 0o755);
    fs.chmodSync(distIndexPath, 0o755);
  }

  // 计算构建大小
  const getDirectorySize = dirPath => {
    let size = 0;
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const file of files) {
        const filePath = path.join(dirPath, file.name);
        if (file.isDirectory()) {
          size += getDirectorySize(filePath);
        } else {
          size += fs.statSync(filePath).size;
        }
      }
    }
    return size;
  };

  if (!isWatch) {
    const totalSize = getDirectorySize(distDir);
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n✅ 构建完成!`);
    console.log(`   输出目录: dist/`);
    console.log(`   总大小: ${(totalSize / 1024).toFixed(2)} KB`);
    console.log(`   耗时: ${elapsedTime}s`);
  }
} catch (error) {
  console.error('\n❌ 构建失败:', error.message);
  process.exit(1);
}
