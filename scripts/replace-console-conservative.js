#!/usr/bin/env node

/**
 * 安全地替换 console 为 logger (保守版)
 * - 只替换 console.warn 和 console.error
 * - 保留 console.log（用户交互需要）
 * - 自动添加 logger 导入和初始化
 */

const { readFileSync, writeFileSync, readdirSync } = require('fs');
const { join } = require('path');

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

function shouldProcess(filePath) {
  if (filePath.includes('/__tests__/') || filePath.endsWith('.test.ts')) return false;
  if (filePath.includes('/ui/') || filePath.includes('/commands/')) return false;
  return filePath.endsWith('.ts');
}

function replaceConsole(content, filePath) {
  let count = 0;
  const original = content;
  
  // 只替换 warn 和 error，保留 log（用于用户界面）
  content = content.replace(/console\.warn\((.*?)\)/g, (match, expr) => {
    count++;
    return `logger.warn(${expr})`;
  });
  
  content = content.replace(/console\.error\((.*?)\)/g, (match, expr) => {
    count++;
    return `logger.error(${expr})`;
  });
  
  if (count > 0 && !content.includes("import { getLogger }")) {
    const relativePath = filePath.replace(SRC + '/', '');
    let importPath = '../utils/logger';
    // 根据目录深度调整导入路径
    const depth = (relativePath.match(/\//g) || []).length;
    if (depth > 1) {
      importPath = '../'.repeat(depth) + 'utils/logger';
    }
    content = `import { getLogger } from '${importPath}';\n` + content;
  }
  
  if (count > 0 && !content.includes('const logger = getLogger')) {
    const loggerInit = "\nconst logger = getLogger('module');\n";
    content = content.replace(/\n/, loggerInit);
  }
  
  return { content, count };
}

function processFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const { content: newContent, count } = replaceConsole(content, filePath);
    if (count > 0) {
      writeFileSync(filePath, newContent, 'utf-8');
      console.log(`✅ ${filePath.replace(SRC + '/', '')} (${count})`);
      return count;
    }
  } catch (err) {
    // 静默跳过错误
  }
  return 0;
}

function main() {
  console.log('🔧 安全替换 console.warn/error → logger (保守策略)\n');
  
  let totalFiles = 0;
  let totalReplacements = 0;
  
  function walkDir(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (['ui', 'commands', '__tests__'].includes(entry.name)) continue;
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
