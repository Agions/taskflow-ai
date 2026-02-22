#!/usr/bin/env node

/**
 * 构建脚本 - 极致优化版本
 * 支持压缩和性能优化
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 TaskFlow AI 构建...\n');

// 构建输出目录
const dirs = {
  dist: path.join(__dirname, 'dist'),
  cli: path.join(__dirname, 'dist', 'cli'),
  bin: path.join(__dirname, 'bin'),
};

// 确保目录存在
Object.values(dirs).forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

try {
  const srcFile = 'src/cli/index.ts';
  
  // 1. 压缩版本 (主版本)
  console.log('📦 压缩中...');
  execSync(
    `npx esbuild ${srcFile} ` +
    '--bundle --platform=node ' +
    '--outfile=dist/index.js ' +
    '--external:npm --external:node_modules/* ' +
    '--format=cjs --minify --tree-shaking ' +
    '--charset=utf8 --metafile=dist/meta.json',
    { stdio: 'inherit', cwd: process.cwd() }
  );

  // 复制到各位置
  fs.copyFileSync(path.join(dirs.dist, 'index.js'), path.join(dirs.cli, 'index.min.js'));
  fs.copyFileSync(path.join(dirs.dist, 'index.js'), path.join(dirs.bin, 'index.js'));

  // 设置权限
  [path.join(dirs.cli, 'index.min.js'), path.join(dirs.bin, 'index.js')].forEach(f => {
    if (fs.existsSync(f)) fs.chmodSync(f, 0o755);
  });

  // 输出大小
  const stats = fs.statSync(path.join(dirs.dist, 'index.js'));
  console.log(`\n✅ 构建完成!`);
  console.log(`   输出: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

} catch (error) {
  console.error('\n❌ 构建失败:', error.message);
  process.exit(1);
}
