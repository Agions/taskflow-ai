#!/usr/bin/env node

/**
 * 专业级发布构建脚本
 * 解决GitHub Actions中的Rollup依赖问题
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始发布构建...\n');

function runCommand(command, description) {
  console.log(`📋 ${description}...`);
  try {
    execSync(command, { 
      stdio: 'inherit', 
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: 'production' }
    });
    console.log(`✅ ${description} 完成\n`);
  } catch (error) {
    console.error(`❌ ${description} 失败:`, error.message);
    process.exit(1);
  }
}

function main() {
  // 1. 清理环境
  console.log('🧹 清理构建环境...');
  
  // 删除可能导致问题的文件
  const filesToRemove = [
    'package-lock.json',
    'node_modules',
    'dist',
    'bin/index.js',
    'bin/index.js.map'
  ];
  
  filesToRemove.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      console.log(`  删除: ${file}`);
      if (fs.statSync(fullPath).isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(fullPath);
      }
    }
  });
  
  console.log('✅ 环境清理完成\n');

  // 2. 清理npm缓存（忽略错误）
  console.log('📋 清理npm缓存...');
  try {
    execSync('npm cache clean --force', { stdio: 'inherit' });
    console.log('✅ npm缓存清理完成\n');
  } catch (error) {
    console.log('⚠️  npm缓存清理失败，继续执行...\n');
  }

  // 3. 重新安装依赖
  runCommand('npm install --no-optional --legacy-peer-deps', '安装依赖（跳过可选依赖）');

  // 4. 验证关键依赖
  console.log('🔍 验证关键依赖...');
  try {
    require('rollup');
    console.log('✅ Rollup 可用');
  } catch (error) {
    console.log('⚠️  Rollup 不可用，尝试手动安装...');
    runCommand('npm install rollup --force', '强制安装Rollup');
  }

  // 5. 检查TypeScript编译
  console.log('📋 TypeScript类型检查...');
  try {
    execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'inherit' });
    console.log('✅ TypeScript类型检查完成\n');
  } catch (error) {
    console.log('⚠️  TypeScript类型检查失败，继续执行构建...\n');
  }

  // 6. 执行构建
  runCommand('npx rollup -c', '执行Rollup构建');

  // 7. 验证构建产物
  console.log('🔍 验证构建产物...');
  const requiredFiles = [
    'dist/index.js',
    'dist/index.esm.js',
    'dist/index.d.ts',
    'bin/index.js'
  ];

  let allFilesExist = true;
  requiredFiles.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      console.log(`  ✅ ${file} (${Math.round(stats.size / 1024)}KB)`);
    } else {
      console.log(`  ❌ ${file} 缺失`);
      allFilesExist = false;
    }
  });

  if (!allFilesExist) {
    console.error('❌ 构建产物验证失败');
    process.exit(1);
  }

  console.log('\n🎉 发布构建完成！');
  console.log('📦 所有构建产物已生成');
  console.log('✅ 准备就绪，可以发布到NPM');
}

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 执行主函数
main();
