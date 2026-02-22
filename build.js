#!/usr/bin/env node

/**
 * 构建脚本 - 使用 Vite
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 TaskFlow AI 构建 (Vite)...\n');

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');

try {
  // 使用 Vite 构建
  console.log('📦 构建中...');
  execSync('npx vite build', { cwd: rootDir, stdio: 'inherit' });

  // 创建子目录
  const cliDir = path.join(distDir, 'cli');
  const binDir = path.join(rootDir, 'bin');
  fs.mkdirSync(cliDir, { recursive: true });
  fs.mkdirSync(binDir, { recursive: true });

  const srcFile = path.join(distDir, 'index.js');
  const cliFile = path.join(cliDir, 'index.js');
  const binFile = path.join(binDir, 'index.js');

  // 复制文件
  fs.copyFileSync(srcFile, cliFile);
  fs.copyFileSync(srcFile, binFile);
  fs.chmodSync(binFile, 0o755);

  // 输出大小
  const stats = fs.statSync(srcFile);
  console.log(`\n✅ 构建完成!`);
  console.log(`   输出: ${(stats.size / 1024).toFixed(2)} KB`);

} catch (error) {
  console.error('\n❌ 构建失败:', error.message);
  process.exit(1);
}
