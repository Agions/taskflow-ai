#!/usr/bin/env node

/**
 * TaskFlow AI 构建脚本
 * 提供快速构建和开发命令
 */

const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

// 命令映射
const commands = {
  // 构建命令
  'build': () => runBuild('build'),
  'build:prod': () => runBuild('build'),
  'build:dev': () => runBuild('build:dev'),
  'watch': () => runBuild('watch'),
  
  // 开发命令
  'dev': () => runBuild('watch'),
  'start': () => runStart(),
  'start:dev': () => runStart(true),
  
  // 清理命令
  'clean': () => runClean(),
  'clean:all': () => runCleanAll(),
  
  // 验证命令
  'validate': () => runValidate(),
  'type-check': () => runTypeCheck(),
  'lint': () => runLint(),
  
  // 信息命令
  'info': () => showInfo(),
  'help': () => showHelp(),
};

// 运行构建
async function runBuild(mode) {
  console.log(`🔨 开始 ${mode} 构建...`);
  
  try {
    await runCommand('node', ['esbuild.config.js', mode]);
    console.log(`✅ ${mode} 构建完成`);
  } catch (error) {
    console.error(`❌ ${mode} 构建失败:`, error.message);
    process.exit(1);
  }
}

// 运行应用
async function runStart(dev = false) {
  const mode = dev ? 'development' : 'production';
  console.log(`🚀 启动 TaskFlow AI (${mode} 模式)...`);
  
  try {
    // 检查是否已构建
    if (!await fs.pathExists('dist/engine.js')) {
      console.log('📦 检测到未构建，正在构建...');
      await runBuild(dev ? 'build:dev' : 'build');
    }
    
    // 启动应用
    const env = { ...process.env, NODE_ENV: mode };
    await runCommand('node', ['dist/cli.js'], { env });
    
  } catch (error) {
    console.error('❌ 应用启动失败:', error.message);
    process.exit(1);
  }
}

// 清理输出目录
async function runClean() {
  console.log('🧹 清理构建文件...');
  
  try {
    if (await fs.pathExists('dist')) {
      await fs.remove('dist');
      console.log('✅ dist 目录已清理');
    }
    
    if (await fs.pathExists('build')) {
      await fs.remove('build');
      console.log('✅ build 目录已清理');
    }
    
  } catch (error) {
    console.error('❌ 清理失败:', error.message);
    process.exit(1);
  }
}

// 完全清理
async function runCleanAll() {
  console.log('🧹 执行完全清理...');
  
  try {
    await runClean();
    
    if (await fs.pathExists('node_modules')) {
      await fs.remove('node_modules');
      console.log('✅ node_modules 目录已清理');
    }
    
    // 清理锁文件
    const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
    for (const lockFile of lockFiles) {
      if (await fs.pathExists(lockFile)) {
        await fs.remove(lockFile);
        console.log(`✅ ${lockFile} 已删除`);
      }
    }
    
    console.log('💡 提示: 运行 npm install 重新安装依赖');
    
  } catch (error) {
    console.error('❌ 完全清理失败:', error.message);
    process.exit(1);
  }
}

// 验证项目
async function runValidate() {
  console.log('🔍 验证项目...');
  
  try {
    // 类型检查
    console.log('📝 执行类型检查...');
    await runTypeCheck();
    
    // 语法检查
    console.log('🔍 执行语法检查...');
    await runLint();
    
    // 构建测试
    console.log('🔨 执行构建测试...');
    await runBuild('build:dev');
    
    console.log('✅ 项目验证通过');
    
  } catch (error) {
    console.error('❌ 项目验证失败:', error.message);
    process.exit(1);
  }
}

// TypeScript类型检查
async function runTypeCheck() {
  try {
    await runCommand('npx', ['tsc', '--noEmit']);
    console.log('✅ 类型检查通过');
  } catch (error) {
    console.error('❌ 类型检查失败');
    throw error;
  }
}

// ESLint检查
async function runLint() {
  try {
    if (await fs.pathExists('.eslintrc.js') || await fs.pathExists('.eslintrc.json')) {
      await runCommand('npx', ['eslint', 'src-new/**/*.{ts,tsx}', '--fix']);
      console.log('✅ 代码格式检查通过');
    } else {
      console.log('⚠️  未发现 ESLint 配置，跳过代码检查');
    }
  } catch (error) {
    console.warn('⚠️  代码格式检查发现问题');
    // 不中断流程，只是警告
  }
}

// 显示项目信息
async function showInfo() {
  const packageJson = require('./package.json');
  
  console.log(`
📦 TaskFlow AI 项目信息

名称: ${packageJson.name}
版本: ${packageJson.version}
描述: ${packageJson.description || '无'}
Node版本: ${process.version}
平台: ${process.platform}
架构: ${process.arch}

📁 目录结构:
${await getDirectoryTree()}

🔧 可用命令:
${Object.keys(commands).map(cmd => `  npm run ${cmd}`).join('\n')}
`);
}

// 显示帮助信息
function showHelp() {
  console.log(`
🚀 TaskFlow AI 构建工具

构建命令:
  build        生产环境构建
  build:dev    开发环境构建  
  watch        监听模式构建

开发命令:
  dev          开发模式 (监听 + 热重载)
  start        启动应用 (生产模式)
  start:dev    启动应用 (开发模式)

清理命令:
  clean        清理构建文件
  clean:all    完全清理 (包括 node_modules)

验证命令:
  validate     完整项目验证
  type-check   TypeScript 类型检查
  lint         代码格式检查

信息命令:
  info         显示项目信息
  help         显示此帮助信息

示例:
  npm run build        # 生产构建
  npm run dev          # 开发模式
  npm run start        # 启动应用
  npm run validate     # 验证项目
`);
}

// 获取目录树
async function getDirectoryTree() {
  const tree = [];
  
  if (await fs.pathExists('src-new')) {
    tree.push('src-new/         # 新架构源码');
    
    const subDirs = await fs.readdir('src-new');
    for (const dir of subDirs) {
      const stat = await fs.stat(path.join('src-new', dir));
      if (stat.isDirectory()) {
        tree.push(`  ${dir}/`);
      }
    }
  }
  
  if (await fs.pathExists('dist')) {
    tree.push('dist/           # 构建输出');
  }
  
  return tree.join('\n');
}

// 运行命令
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options,
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`命令退出，代码: ${code}`));
      }
    });
    
    child.on('error', reject);
  });
}

// 主入口
async function main() {
  const command = process.argv[2] || 'help';
  
  if (commands[command]) {
    try {
      await commands[command]();
    } catch (error) {
      console.error('❌ 执行失败:', error.message);
      process.exit(1);
    }
  } else {
    console.error(`❌ 未知命令: ${command}`);
    showHelp();
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  runBuild,
  runStart,
  runClean,
  runValidate,
};