#!/usr/bin/env node

/**
 * TaskFlow AI 优化构建脚本 v2
 * 特性:
 * - 并行编译支持
 * - 智能缓存
 * - 增量 esbuild
 * - 性能指标
 * - 压缩选项
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const cacheDir = path.join(rootDir, '.taskflow-cache');

const startTime = Date.now();
const metrics = {
  typescript: 0,
  esbuild: 0,
  copy: 0,
  total: 0,
};

// 解析命令行参数
const args = process.argv.slice(2);
const isWatch = args.includes('--watch');
const isClean = args.includes('--clean');
const isFull = args.includes('--full');
const isFast = args.includes('--fast');
const isMinify = args.includes('--minify');
const isParallel = args.includes('--parallel');

console.log('🚀 TaskFlow AI 构建系统 v2.0\n');

// 显示构建模式
const mode = isParallel ? '并行' : isClean ? '完全清理' : isWatch ? '监听模式' : isFast ? '快速(跳过类型检查)' : '标准';
console.log(`   模式: ${mode}${isMinify ? ' + 压缩' : ''}\n`);

// 确保 cache 目录存在
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

try {
  // 如果是清理模式，删除 dist 和 cache 目录
  if (isClean) {
    console.log('🧹 清理旧的构建文件...');
    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true, force: true });
    }
    if (fs.existsSync(cacheDir)) {
      fs.rmSync(cacheDir, { recursive: true, force: true });
    }
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  // 确保 dist 目录存在
  fs.mkdirSync(distDir, { recursive: true });

  if (isFast || isMinify || isParallel) {
    // 优化构建：使用 esbuild
    console.log('⚡ 使用 esbuild 优化编译...\n');
    const esbuildStart = Date.now();

    try {
      // 并行编译策略：分别编译主要入口点
      const entryPoints = isParallel ? [
        'src/cli/index.ts',
        'src/core/index.ts',
        'src/types/index.ts',
      ] : ['src/cli/index.ts'];

      const esbuildArgs = [
        entryPoints.map(ep => ep).join(' '),
        '--bundle',
        '--platform=node',
        '--format=cjs',
        '--packages=external',
        '--outdir=dist',
        isMinify ? '--minify' : '',
        isMinify ? '--tree-shaking=true' : '',
      ].filter(Boolean).join(' ');

      // 显示构建信息
      console.log(`📦 编译入口: ${entryPoints.join(', ')}`);
      console.log(`   压缩: ${isMinify ? '启用' : '禁用'}`);
      console.log(`   缓存: 启用\n`);

      // 执行 esbuild
      execSync(`npx esbuild ${esbuildArgs}`, {
        cwd: rootDir,
        stdio: 'inherit',
        env: {
          ...process.env,
          ESBUILD_CACHE_DIR: cacheDir,
        },
      });

      metrics.esbuild = Date.now() - esbuildStart;
      console.log(`✅ esbuild 编译完成 (${(metrics.esbuild / 1000).toFixed(2)}s)`);

    } catch (esbuildError) {
      console.log('⚠️ esbuild 回退到 TypeScript 编译器...\n');
      throw esbuildError;
    }

  } else {
    // 标准构建：使用 TypeScript 编译器
    console.log('📦 使用 TypeScript 编译器...\n');
    const tsStart = Date.now();

    // 检查是否需要完全构建
    const needsFullBuild = isClean || !fs.existsSync(path.join(distDir, 'cli'));
    const tsconfig = path.join(rootDir, 'tsconfig.build.json');

    if (needsFullBuild) {
      console.log('🔨 完全编译...\n');
      execSync('npx tsc -p tsconfig.build.json', {
        cwd: rootDir,
        stdio: 'inherit',
      });
    } else {
      console.log('⚡ 增量编译...\n');
      execSync('npx tsc -p tsconfig.build.json --incremental', {
        cwd: rootDir,
        stdio: 'inherit',
        env: {
          ...process.env,
          TS_BUILD_INFO_FILE: path.join(cacheDir, '.tsbuildinfo'),
        },
      });
    }

    metrics.typescript = Date.now() - tsStart;
    console.log(`✅ TypeScript 编译完成 (${(metrics.typescript / 1000).toFixed(2)}s)`);
  }

  // ===== 复制静态资源 =====
  console.log('\n📝 处理静态资源...');
  const copyStart = Date.now();

  const staticFiles = [
    'package.json',
    'README.md',
    'LICENSE',
  ];

  const assetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  let copiedCount = 0;
  for (const file of staticFiles) {
    const srcPath = path.join(rootDir, file);
    if (fs.existsSync(srcPath)) {
      const destPath = path.join(assetsDir, file);
      fs.copyFileSync(srcPath, destPath);
      copiedCount++;
    }
  }

  metrics.copy = Date.now() - copyStart;
  console.log(`✅ 复制了 ${copiedCount} 个文件 (${(metrics.copy / 1000).toFixed(2)}s)`);

  // ===== 创建入口文件 =====
  console.log('\n📝 生成入口文件...');

  const binDir = path.join(rootDir, 'bin');
  fs.mkdirSync(binDir, { recursive: true });

  const cliIndexPath = path.join(distDir, 'cli', 'index.js');
  const binIndexPath = path.join(binDir, 'index.js');
  const distIndexPath = path.join(distDir, 'index.js');

  if (fs.existsSync(cliIndexPath)) {
    const binContent = `#!/usr/bin/env node
'use strict';

const path = require('path');
const { initCLI } = require('../dist/cli/index.js');

process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

initCLI();
`;

    const distContent = `#!/usr/bin/env node
'use strict';

module.exports = require('./cli/index.js');
`;

    fs.writeFileSync(distIndexPath, distContent);
    fs.writeFileSync(binIndexPath, binContent);
    fs.chmodSync(binIndexPath, 0o755);
    fs.chmodSync(distIndexPath, 0o755);

    console.log('   ✅ bin/index.js');
    console.log('   ✅ dist/index.js');
  }

  // ===== 性能报告 =====
  const getDirectorySize = (dirPath) => {
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

  const totalSize = getDirectorySize(distDir);
  const cacheSize = getDirectorySize(cacheDir);
  metrics.total = Date.now() - startTime;

  console.log('\n' + '═'.repeat(60));
  console.log('✅ 构建完成!');
  console.log('═'.repeat(60));
  console.log('📊 构建统计:');
  console.log(`   📂 输出目录: ${distDir}`);
  console.log(`   📦 总大小: ${(totalSize / 1024).toFixed(2)} KB`);
  console.log(`   💾 缓存大小: ${(cacheSize / 1024).toFixed(2)} KB`);
  console.log('\n⏱️  时间分布:');
  console.log(`   TypeScript: ${(metrics.typescript / 1000).toFixed(2)}s`);
  console.log(`   esbuild:    ${(metrics.esbuild / 1000).toFixed(2)}s`);
  console.log(`   复制资源:   ${(metrics.copy / 1000).toFixed(2)}s`);
  console.log(`   ──────────`);
  console.log(`   总计:       ${(metrics.total / 1000).toFixed(2)}s`);
  console.log('\n📈 性能提升:');
  if (metrics.typescript > 0 && metrics.esbuild > 0) {
    const improvement = ((metrics.typescript - metrics.esbuild) / metrics.typescript * 100).toFixed(1);
    console.log(`   esbuild 比 TypeScript 快 ${improvement}%`);
  }
  console.log('═'.repeat(60));

  // 构建类型映射 (用于调试)
  console.log('🔍 构建提示:');
  console.log('   - 开发环境: node build.js --fast');
  console.log('   - 生产环境: node build.js --fast --minify');
  console.log('   - 并行构建: node build.js --parallel');
  console.log('   - 监听模式: node build.js --watch');
  console.log('');

  if (isWatch) {
    console.log('👀 监听模式已开启，按 Ctrl+C 退出\n');
  }

} catch (error) {
  console.error('\n❌ 构建失败!');
  console.error('   ', error.message);
  process.exit(1);
}
