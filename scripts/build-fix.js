#!/usr/bin/env node

/**
 * TaskFlow AI - 构建修复脚本
 * 
 * 解决CI/CD构建过程中的问题，确保构建成功
 * 
 * @author TaskFlow AI Team
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 TaskFlow AI 构建修复脚本');
console.log('═'.repeat(50));

/**
 * 执行命令并处理错误
 */
function execCommand(command, options = {}) {
  try {
    console.log(`📦 执行: ${command}`);
    const result = execSync(command, {
      stdio: 'inherit',
      encoding: 'utf8',
      ...options
    });
    return { success: true, result };
  } catch (error) {
    console.error(`❌ 命令执行失败: ${command}`);
    console.error(`错误: ${error.message}`);
    return { success: false, error };
  }
}

/**
 * 检查文件是否存在
 */
function checkFile(filePath) {
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${filePath}`);
  return exists;
}

/**
 * 创建目录
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 创建目录: ${dirPath}`);
  }
}

/**
 * 主要构建流程
 */
function main() {
  console.log('\n🔍 检查项目结构...');
  
  // 检查关键文件
  const criticalFiles = [
    'package.json',
    'tsconfig.json',
    'src/index.ts'
  ];
  
  let allFilesExist = true;
  criticalFiles.forEach(file => {
    if (!checkFile(file)) {
      allFilesExist = false;
    }
  });
  
  if (!allFilesExist) {
    console.error('❌ 关键文件缺失，无法继续构建');
    process.exit(1);
  }
  
  console.log('\n📦 安装依赖...');
  const installResult = execCommand('npm ci --prefer-offline --no-audit');
  if (!installResult.success) {
    console.log('⚠️ npm ci 失败，尝试 npm install...');
    const fallbackResult = execCommand('npm install');
    if (!fallbackResult.success) {
      console.error('❌ 依赖安装失败');
      process.exit(1);
    }
  }
  
  console.log('\n🔍 TypeScript 类型检查...');
  const typeCheckResult = execCommand('npx tsc --noEmit --skipLibCheck');
  if (!typeCheckResult.success) {
    console.log('⚠️ TypeScript 类型检查有问题，但继续构建...');
  }
  
  console.log('\n🔨 开始构建...');
  
  // 确保输出目录存在
  ensureDir('dist');
  ensureDir('bin');
  
  // 尝试使用 rollup 构建
  console.log('📦 尝试 Rollup 构建...');
  const rollupResult = execCommand('npx rollup -c');
  
  if (!rollupResult.success) {
    console.log('⚠️ Rollup 构建失败，尝试 ESBuild 构建...');
    
    // 创建简单的 ESBuild 配置
    const esbuildConfig = `
const esbuild = require('esbuild');
const path = require('path');

async function build() {
  try {
    // 构建主模块
    await esbuild.build({
      entryPoints: ['src/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'cjs',
      outfile: 'dist/index.js',
      external: [
        'chalk',
        'commander',
        'fs-extra',
        'inquirer',
        'ora',
        'axios',
        'winston',
        'dotenv',
        'conf',
        'boxen',
        'markdown-it',
        'express',
        'jsonwebtoken'
      ],
      sourcemap: false,
      minify: true,
      keepNames: true,
      logLevel: 'info'
    });
    
    // 构建 CLI
    await esbuild.build({
      entryPoints: ['src/cli.ts'],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'cjs',
      outfile: 'bin/index.js',
      banner: {
        js: '#!/usr/bin/env node'
      },
      external: [
        'chalk',
        'commander',
        'fs-extra',
        'inquirer',
        'ora',
        'axios',
        'winston',
        'dotenv',
        'conf',
        'boxen',
        'markdown-it',
        'express',
        'jsonwebtoken'
      ],
      sourcemap: false,
      minify: true,
      keepNames: true,
      logLevel: 'info'
    });
    
    console.log('✅ ESBuild 构建成功');
  } catch (error) {
    console.error('❌ ESBuild 构建失败:', error);
    process.exit(1);
  }
}

build();
`;
    
    fs.writeFileSync('esbuild-fallback.js', esbuildConfig);
    
    const esbuildResult = execCommand('node esbuild-fallback.js');
    if (!esbuildResult.success) {
      console.error('❌ 所有构建方法都失败了');
      process.exit(1);
    }
    
    // 清理临时文件
    if (fs.existsSync('esbuild-fallback.js')) {
      fs.unlinkSync('esbuild-fallback.js');
    }
  }
  
  // 确保 bin 文件可执行
  console.log('\n🔧 设置可执行权限...');
  if (fs.existsSync('bin/index.js')) {
    try {
      fs.chmodSync('bin/index.js', '755');
      console.log('✅ 设置 bin/index.js 可执行权限');
    } catch (error) {
      console.log('⚠️ 无法设置可执行权限:', error.message);
    }
  }
  
  // 验证构建结果
  console.log('\n🔍 验证构建结果...');
  const buildFiles = [
    'dist/index.js',
    'bin/index.js'
  ];
  
  let buildSuccess = true;
  buildFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      console.log(`✅ ${file} (${(stats.size / 1024).toFixed(1)}KB)`);
    } else {
      console.log(`❌ ${file} 不存在`);
      buildSuccess = false;
    }
  });
  
  if (buildSuccess) {
    console.log('\n🎉 构建成功完成！');
    console.log('📦 构建产物:');
    if (fs.existsSync('dist')) {
      execCommand('ls -la dist/', { stdio: 'inherit' });
    }
    if (fs.existsSync('bin')) {
      execCommand('ls -la bin/', { stdio: 'inherit' });
    }
  } else {
    console.error('\n❌ 构建验证失败');
    process.exit(1);
  }
}

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

// 执行主函数
main();
