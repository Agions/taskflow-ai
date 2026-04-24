#!/usr/bin/env node

/**
 * TaskFlow AI 构建脚本
 * 支持:
 * - node build.js (标准增量构建)
 * - node build.js --fast (快速构建，跳过类型检查)
 * - node build.js --clean (完全清理重建)
 * - node build.js --watch (监听模式)
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
const isFull = args.includes('--full');
const isFast = args.includes('--fast');

console.log('🚀 TaskFlow AI 构建...\n');

// 显示构建模式
const mode = isClean ? '完全清理' : isWatch ? '监听模式' : isFast ? '快速(跳过类型检查)' : '标准';
console.log(`   模式: ${mode}`);

try {
  // 如果是清理模式，先删除 dist 目录
  if (isClean && fs.existsSync(distDir)) {
    console.log('🧹 清理旧的构建文件...');
    fs.rmSync(distDir, { recursive: true, force: true });
  }

  // 确保 dist 目录存在
  fs.mkdirSync(distDir, { recursive: true });

  if (isFast) {
    // 快速构建：使用 esbuild 跳过类型检查
    console.log('⚡ 使用 esbuild 快速编译...\n');
    
    try {
      // 使用 esbuild 进行快速打包 (跳过类型检查)
      console.log('📦 执行 esbuild 打包...\n');
      
      // esbuild 命令：打包所有源文件为 CommonJS 格式
      execSync(
        'npx esbuild src/cli/index.ts --bundle --platform=node --outfile=dist/cli/index.js --format=cjs --packages=external',
        { cwd: rootDir, stdio: 'inherit' }
      );
      
      console.log('✅ esbuild 编译完成');
      
    } catch (esbuildError) {
      console.log('⚠️ esbuild 编译遇到问题...\n');
      throw esbuildError;
    }
    
  } else {
    // 标准构建：使用 TypeScript 编译器
    console.log('📦 使用 TypeScript 编译器...\n');
    
    // 检查是否需要完全构建
    const needsFullBuild = isClean || !fs.existsSync(path.join(distDir, 'cli'));
    
    if (needsFullBuild) {
      console.log('🔨 完全编译...\n');
      execSync('npx tsc -p tsconfig.build.json', { 
        cwd: rootDir, 
        stdio: 'inherit' 
      });
    } else {
      console.log('⚡ 增量编译...\n');
      execSync('npx tsc -p tsconfig.build.json --incremental', { 
        cwd: rootDir, 
        stdio: 'inherit' 
      });
    }
  }

  // ===== 创建入口文件 =====
  console.log('📝 生成入口文件...');
  
  const binDir = path.join(rootDir, 'bin');
  fs.mkdirSync(binDir, { recursive: true });

  // 入口文件路径
  const cliIndexPath = path.join(distDir, 'cli', 'index.js');
  const binIndexPath = path.join(binDir, 'index.js');
  const distIndexPath = path.join(distDir, 'index.js');

  // 创建主入口文件
  if (fs.existsSync(cliIndexPath)) {
    // bin/index.js - CLI 入口
    const binContent = `#!/usr/bin/env node
'use strict';

const path = require('path');
const { initCLI } = require('../dist/cli/index.js');

// 设置错误处理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

// 启动 CLI
initCLI();
`;
    
    // dist/index.js - 包入口
    const distContent = `#!/usr/bin/env node
'use strict';

const path = require('path');

// 重新导出 CLI 入口
module.exports = require('./cli/index.js');
`;
    
    fs.writeFileSync(distIndexPath, distContent);
    fs.writeFileSync(binIndexPath, binContent);
    fs.chmodSync(binIndexPath, 0o755);
    fs.chmodSync(distIndexPath, 0o755);
    
    console.log('   ✅ bin/index.js');
    console.log('   ✅ dist/index.js');
  }

  // ===== 计算构建大小 =====
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
  const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n' + '═'.repeat(50));
  console.log('✅ 构建完成!');
  console.log('═'.repeat(50));
  console.log(`   📂 输出目录: ${distDir}`);
  console.log(`   📊 总大小: ${(totalSize / 1024).toFixed(2)} KB`);
  console.log(`   ⏱️  耗时: ${elapsedTime}s`);
  console.log('═'.repeat(50));

  if (isWatch) {
    console.log('\n👀 监听模式已开启，按 Ctrl+C 退出');
  }

} catch (error) {
  console.error('\n❌ 构建失败!');
  console.error('   ', error.message);
  process.exit(1);
}
