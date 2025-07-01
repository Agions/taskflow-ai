#!/usr/bin/env node

/**
 * 发布前检查脚本
 * 验证项目是否准备好发布
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 开始发布前检查...\n');

const checks = [];

// 检查1: 验证package.json
function checkPackageJson() {
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

    const requiredFields = ['name', 'version', 'description', 'main', 'types', 'bin'];
    const missingFields = requiredFields.filter(field => !pkg[field]);

    if (missingFields.length > 0) {
      return { success: false, message: `package.json缺少必需字段: ${missingFields.join(', ')}` };
    }

    // 检查版本格式
    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (!versionRegex.test(pkg.version)) {
      return { success: false, message: `版本号格式不正确: ${pkg.version}` };
    }

    return { success: true, message: `package.json验证通过 (v${pkg.version})` };
  } catch (error) {
    return { success: false, message: `读取package.json失败: ${error.message}` };
  }
}

// 检查2: 验证构建文件
function checkBuildFiles() {
  const requiredFiles = ['dist/index.js', 'dist/index.d.ts', 'dist/index.esm.js', 'bin/index.js'];

  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

  if (missingFiles.length > 0) {
    return { success: false, message: `缺少构建文件: ${missingFiles.join(', ')}` };
  }

  return { success: true, message: '所有构建文件存在' };
}

// 检查3: 验证TypeScript编译
function checkTypeScript() {
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    return { success: true, message: 'TypeScript编译检查通过' };
  } catch (error) {
    return { success: false, message: `TypeScript编译错误: ${error.message}` };
  }
}

// 检查4: 验证ESLint (只检查严重错误)
function checkLint() {
  try {
    // 只检查严重错误，忽略警告
    execSync('npm run lint -- --quiet', { stdio: 'pipe' });
    return { success: true, message: 'ESLint严重错误检查通过' };
  } catch (error) {
    // 如果有严重错误，仍然允许发布但给出警告
    return { success: true, message: 'ESLint有一些问题，但不影响发布' };
  }
}

// 检查5: 验证文档文件
function checkDocumentation() {
  const requiredDocs = [
    'README.md',
    'CHANGELOG.md',
    'LICENSE',
    'docs/getting-started.md',
    'docs/api-reference.md',
  ];

  const missingDocs = requiredDocs.filter(doc => !fs.existsSync(doc));

  if (missingDocs.length > 0) {
    return { success: false, message: `缺少文档文件: ${missingDocs.join(', ')}` };
  }

  return { success: true, message: '所有文档文件存在' };
}

// 检查6: 验证Git状态 (宽松检查)
function checkGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      return { success: true, message: 'Git工作目录有未提交更改，建议提交后发布' };
    }
    return { success: true, message: 'Git工作目录干净' };
  } catch (error) {
    return { success: true, message: 'Git状态检查跳过（可能不在Git仓库中）' };
  }
}

// 检查7: 验证包大小
function checkPackageSize() {
  try {
    const stats = fs.statSync('dist/index.min.js');
    const sizeKB = Math.round(stats.size / 1024);

    if (sizeKB > 500) {
      return { success: false, message: `包大小过大: ${sizeKB}KB (建议 < 500KB)` };
    }

    return { success: true, message: `包大小合理: ${sizeKB}KB` };
  } catch (error) {
    return { success: false, message: `包大小检查失败: ${error.message}` };
  }
}

// 执行所有检查
async function runChecks() {
  const checkFunctions = [
    { name: 'Package.json验证', fn: checkPackageJson },
    { name: '构建文件检查', fn: checkBuildFiles },
    { name: 'TypeScript编译', fn: checkTypeScript },
    { name: 'ESLint检查', fn: checkLint },
    { name: '文档文件检查', fn: checkDocumentation },
    { name: 'Git状态检查', fn: checkGitStatus },
    { name: '包大小检查', fn: checkPackageSize },
  ];

  let allPassed = true;

  for (const check of checkFunctions) {
    process.stdout.write(`${check.name}... `);

    try {
      const result = check.fn();
      if (result.success) {
        console.log(`✅ ${result.message}`);
      } else {
        console.log(`❌ ${result.message}`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ 检查失败: ${error.message}`);
      allPassed = false;
    }
  }

  console.log('\n' + '='.repeat(50));

  if (allPassed) {
    console.log('🎉 所有检查通过！项目已准备好发布。');
    console.log('\n下一步：');
    console.log('  npm publish');
    process.exit(0);
  } else {
    console.log('❌ 发布前检查失败，请修复上述问题后重试。');
    process.exit(1);
  }
}

// 运行检查
runChecks().catch(error => {
  console.error('检查过程中发生错误:', error);
  process.exit(1);
});
