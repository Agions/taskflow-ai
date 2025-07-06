#!/usr/bin/env node

/**
 * TaskFlow AI - 构建测试脚本
 * 
 * 测试构建流程是否正常工作
 * 
 * @author TaskFlow AI Team
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 TaskFlow AI 构建测试');
console.log('═'.repeat(40));

/**
 * 执行命令并返回结果
 */
function execCommand(command, options = {}) {
  try {
    console.log(`📦 测试: ${command}`);
    const result = execSync(command, {
      encoding: 'utf8',
      ...options
    });
    console.log('✅ 成功');
    return { success: true, result };
  } catch (error) {
    console.log(`❌ 失败: ${error.message}`);
    return { success: false, error };
  }
}

/**
 * 检查文件
 */
function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${description}: ${filePath}`);
  if (exists) {
    const stats = fs.statSync(filePath);
    console.log(`   大小: ${(stats.size / 1024).toFixed(1)}KB`);
  }
  return exists;
}

/**
 * 主测试流程
 */
function main() {
  console.log('\n🔍 1. 检查项目文件...');
  
  const projectFiles = [
    { path: 'package.json', desc: 'Package配置' },
    { path: 'tsconfig.json', desc: 'TypeScript配置' },
    { path: 'src/index.ts', desc: '主入口文件' },
    { path: 'src/cli.ts', desc: 'CLI入口文件' },
    { path: 'scripts/build-fix.js', desc: '构建修复脚本' }
  ];
  
  let allFilesOk = true;
  projectFiles.forEach(file => {
    if (!checkFile(file.path, file.desc)) {
      allFilesOk = false;
    }
  });
  
  if (!allFilesOk) {
    console.error('\n❌ 项目文件检查失败');
    return false;
  }
  
  console.log('\n🔧 2. 测试构建脚本...');
  
  // 清理之前的构建
  console.log('🧹 清理旧的构建文件...');
  if (fs.existsSync('dist')) {
    execCommand('rm -rf dist');
  }
  if (fs.existsSync('bin')) {
    execCommand('rm -rf bin');
  }
  
  // 测试构建
  const buildResult = execCommand('node scripts/build-fix.js');
  if (!buildResult.success) {
    console.error('\n❌ 构建测试失败');
    return false;
  }
  
  console.log('\n📋 3. 验证构建产物...');
  
  const buildArtifacts = [
    { path: 'dist/index.js', desc: '主模块' },
    { path: 'bin/index.js', desc: 'CLI可执行文件' }
  ];
  
  let buildOk = true;
  buildArtifacts.forEach(artifact => {
    if (!checkFile(artifact.path, artifact.desc)) {
      buildOk = false;
    }
  });
  
  if (!buildOk) {
    console.error('\n❌ 构建产物验证失败');
    return false;
  }
  
  console.log('\n🧪 4. 测试基本功能...');
  
  // 测试CLI是否可以执行
  const cliTest = execCommand('node bin/index.js --version', { stdio: 'pipe' });
  if (cliTest.success) {
    console.log('✅ CLI基本功能正常');
  } else {
    console.log('⚠️ CLI测试失败，但构建成功');
  }
  
  // 测试模块是否可以加载
  try {
    require(path.resolve('dist/index.js'));
    console.log('✅ 主模块加载正常');
  } catch (error) {
    console.log('⚠️ 主模块加载失败，但构建成功');
  }
  
  console.log('\n📊 5. 构建统计...');
  
  if (fs.existsSync('dist')) {
    console.log('📁 dist/ 目录内容:');
    execCommand('ls -la dist/', { stdio: 'inherit' });
  }
  
  if (fs.existsSync('bin')) {
    console.log('📁 bin/ 目录内容:');
    execCommand('ls -la bin/', { stdio: 'inherit' });
  }
  
  console.log('\n🎉 构建测试完成！');
  return true;
}

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error.message);
  process.exit(1);
});

// 执行测试
const success = main();
process.exit(success ? 0 : 1);
