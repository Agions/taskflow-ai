#!/usr/bin/env node

/**
 * 构建脚本 - 使用 TypeScript Compiler
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 TaskFlow AI 构建...\n');

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');

try {
  // 清理旧的构建文件
  if (fs.existsSync(distDir)) {
    console.log('🧹 清理旧的构建文件...');
    fs.rmSync(distDir, { recursive: true, force: true });
  }

  // 使用 TypeScript 编译
  console.log('📦 编译 TypeScript...');
  execSync('npx tsc', { cwd: rootDir, stdio: 'inherit' });

  // 创建 bin 目录和入口文件
  const binDir = path.join(rootDir, 'bin');
  fs.mkdirSync(binDir, { recursive: true });

  const cliIndexPath = path.join(distDir, 'cli', 'index.js');
  const binIndexPath = path.join(binDir, 'index.js');
  const distIndexPath = path.join(distDir, 'index.js');

  // 创建主入口文件
  if (fs.existsSync(cliIndexPath)) {
    const binContent = `#!/usr/bin/env node
require('./cli/index.js');
`;
    fs.writeFileSync(distIndexPath, binContent);
    fs.writeFileSync(binIndexPath, binContent);
    fs.chmodSync(binIndexPath, 0o755);
    fs.chmodSync(distIndexPath, 0o755);
  }

  // 计算构建大小
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
  console.log(`\n✅ 构建完成!`);
  console.log(`   输出目录: dist/`);
  console.log(`   总大小: ${(totalSize / 1024).toFixed(2)} KB`);

} catch (error) {
  console.error('\n❌ 构建失败:', error.message);
  process.exit(1);
}
