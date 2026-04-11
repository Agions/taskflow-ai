#!/usr/bin/env node

/**
 * 批量替换 console 为 logger (仅核心模块)
 * 排除: src/cli/ui/, src/cli/commands/
 */

const { readFileSync, writeFileSync, readdirSync } = require('fs');
const { join } = require('path');

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

function shouldProcess(filePath) {
  // 排除测试
  if (filePath.includes('/__tests__/') || filePath.endsWith('.test.ts')) return false;
  // 排除 CLI UI 和 commands
  if (filePath.includes('/ui/') || filePath.includes('/commands/')) return false;
  // 只处理 .ts 文件
  return filePath.endsWith('.ts');
}

function replaceConsole(content) {
  let count = 0;

  // 替换 console.log → logger.info
  content = content.replace(/console\.log\((.*?)\)/g, (match, expr) => {
    count++;
    return `logger.info(${expr})`;
  });

  // 替换 console.warn → logger.warn
  content = content.replace(/console\.warn\((.*?)\)/g, (match, expr) => {
    count++;
    return `logger.warn(${expr})`;
  });

  // 替换 console.error → logger.error
  content = content.replace(/console\.error\((.*?)\)/g, (match, expr) => {
    count++;
    return `logger.error(${expr})`;
  });

  // 添加 logger 导入（如果缺失）
  if (count > 0 && !content.includes('import { getLogger }')) {
    const importStmt = "import { getLogger } from '../utils/logger';\n";
    content = importStmt + content;
  }

  // 在文件开头添加 logger 实例（如果缺失且使用了替换）
  if (count > 0 && !content.includes('const logger = getLogger')) {
    // 在导入后或文件开头添加
    const loggerInit = "\nconst logger = getLogger('module');\n";
    if (content.includes('\n')) {
      content = content.replace(/\n/, loggerInit);
    } else {
      content = loggerInit + content;
    }
  }

  return { content, count };
}

function processFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const { content: newContent, count } = replaceConsole(content);

    if (count > 0) {
      writeFileSync(filePath, newContent, 'utf-8');
      console.log(`✅ ${filePath.replace(SRC + '/', '')} (${count})`);
      return count;
    }
  } catch (err) {
    console.error(`❌ ${filePath}: ${err.message}`);
  }
  return 0;
}

function main() {
  console.log('🔧 批量替换 console → logger (仅核心模块)\n');

  let totalFiles = 0;
  let totalReplacements = 0;

  // 递归遍历 src 目录
  function walkDir(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // 跳过排除目录
        if (EXCLUDE_DIRS.includes(entry.name)) continue;
        walkDir(fullPath);
      } else if (shouldProcess(fullPath)) {
        totalFiles++;
        totalReplacements += processFile(fullPath);
      }
    }
  }

  walkDir(SRC);

  console.log(`\n✅ 完成！`);
  console.log(`   处理文件: ${totalFiles}`);
  console.log(`   替换次数: ${totalReplacements}`);
}

main();
