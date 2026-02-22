#!/usr/bin/env node

/**
 * 简化构建脚本 - 使用 esbuild
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 开始构建 TaskFlow AI...');

try {
  // 使用 esbuild 直接打包
  execSync('npx esbuild src/cli/index.ts --bundle --platform=node --outfile=dist/cli/index.js --external:npm --external:node_modules/* --format=cjs', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  // 复制其他必要文件
  const distCli = path.join(__dirname, 'dist', 'cli');
  if (!fs.existsSync(distCli)) {
    fs.mkdirSync(distCli, { recursive: true });
  }

  console.log('✅ 构建完成！');
  
  // 设置CLI入口权限
  const cliPath = path.join(__dirname, 'dist', 'cli', 'index.js');
  if (fs.existsSync(cliPath)) {
    fs.chmodSync(cliPath, 0o755);
    console.log('✅ CLI入口权限设置完成');
  }

} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exit(1);
}
