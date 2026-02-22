#!/usr/bin/env node

/**
 * 构建脚本 - 优化版本
 * 支持压缩和性能优化
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 开始构建 TaskFlow AI...\n');

// 构建输出目录
const distDir = path.join(__dirname, 'dist');
const cliDir = path.join(distDir, 'cli');

// 确保目录存在
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
if (!fs.existsSync(cliDir)) fs.mkdirSync(cliDir, { recursive: true });

try {
  // 1. 压缩版本
  console.log('📦 生成压缩版本...');
  execSync(
    'npx esbuild src/cli/index.ts ' +
    '--bundle ' +
    '--platform=node ' +
    '--outfile=dist/cli/index.min.js ' +
    '--external:npm ' +
    '--external:node_modules/* ' +
    '--format=cjs ' +
    '--minify ' +
    '--tree-shaking=true ' +
    '--charset=utf8',
    { stdio: 'inherit', cwd: process.cwd() }
  );
  
  // 2. 非压缩版本
  console.log('📦 生成开发版本...');
  execSync(
    'npx esbuild src/cli/index.ts ' +
    '--bundle ' +
    '--platform=node ' +
    '--outfile=dist/cli/index.js ' +
    '--external:npm ' +
    '--external:node_modules/* ' +
    '--format=cjs',
    { stdio: 'inherit', cwd: process.cwd() }
  );

  // 3. 复制到 bin 目录
  const binDir = path.join(__dirname, 'bin');
  if (!fs.existsSync(binDir)) fs.mkdirSync(binDir, { recursive: true });
  fs.copyFileSync(path.join(cliDir, 'index.min.js'), path.join(binDir, 'index.js'));
  fs.copyFileSync(path.join(cliDir, 'index.min.js'), path.join(distDir, 'index.js'));

  // 4. 设置权限
  const files = [path.join(cliDir, 'index.min.js'), path.join(cliDir, 'index.js'), path.join(binDir, 'index.js')];
  files.forEach(f => {
    if (fs.existsSync(f)) fs.chmodSync(f, 0o755);
  });

  // 5. 输出大小
  const minSize = fs.statSync(path.join(cliDir, 'index.min.js')).size;
  const normalSize = fs.statSync(path.join(cliDir, 'index.js')).size;
  
  console.log('\n✅ 构建完成！');
  console.log(`   压缩版: ${(minSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   开发版: ${(normalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   压缩率: ${((1 - minSize / normalSize) * 100).toFixed(1)}%`);

} catch (error) {
  console.error('\n❌ 构建失败:', error.message);
  process.exit(1);
}
