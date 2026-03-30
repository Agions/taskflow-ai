#!/usr/bin/env node

/**
 * 安全替换核心模块的 console → logger
 * 只处理: src/agent/, src/knowledge/, src/codegen/, src/mcp/ (排除 __tests__)
 * 使用简单插入头部的方式，避免破坏 import 结构
 */

const { readFileSync, writeFileSync, readdirSync } = require('fs');
const { join, relative, sep } = require('path');

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

// 目标目录（核心模块）
const TARGET_DIRS = ['agent', 'knowledge', 'codegen', 'mcp'];

function shouldProcess(filePath) {
  if (!filePath.endsWith('.ts')) return false;
  if (filePath.includes('/__tests__/')) return false;
  if (filePath.includes('/node_modules/')) return false;
  // 排除 logger 实现文件（避免自引用）
  if (filePath.endsWith('/utils/logger.ts')) return false;
  // 只处理指定目录
  const rel = relative(SRC, filePath);
  return TARGET_DIRS.some(dir => rel.startsWith(dir + sep));
}

function getLoggerName(filePath) {
  const rel = relative(SRC, filePath).replace(/\.ts$/, '');
  return rel.replace(/\\/g, ':');
}

function getImportPath(filePath) {
  // 计算从文件到 utils/logger 的相对路径
  const rel = relative(SRC, filePath);
  const depth = (rel.match(/\//g) || []).length;
  const up = depth > 0 ? '../'.repeat(depth) : '';
  return `${up}utils/logger`;
}

function processFile(filePath) {
  try {
    let content = readFileSync(filePath, 'utf-8');

    // 检查是否有 shebang
    const shebangMatch = content.match(/^#!.*\n/);
    const hasShebang = !!shebangMatch;
    const shebang = shebangMatch ? shebangMatch[0] : '';

    // 移除 shebang 用于后续处理
    let body = hasShebang ? content.slice(shebang.length) : content;

    // 检查是否已有 logger 导入和声明
    const hasImport = /import\s*{\s*getLogger\s*}\s*from\s*['"][^'"]*logger['"]/.test(body);
    const hasLoggerDecl = /const\s+logger\s*=\s*getLogger\s*\(/.test(body);

    // 替换 console
    body = body.replace(/console\.log\(/g, 'logger.info(');
    body = body.replace(/console\.warn\(/g, 'logger.warn(');
    body = body.replace(/console\.error\(/g, 'logger.error(');

    // 添加导入（如果需要）
    if (!hasImport) {
      const importStmt = `import { getLogger } from '${getImportPath(filePath)}';\n`;
      body = importStmt + body;
    }

    // 添加 logger 声明（如果需要）- 放在 import 之后，第一个空行或代码前
    if (!hasLoggerDecl) {
      const loggerName = getLoggerName(filePath);
      // 在 import 块后插入 logger 声明
      const importEnd = body.lastIndexOf('} from');
      let insertPos = 0;
      if (importEnd !== -1) {
        const lineEnd = body.indexOf('\n', importEnd);
        if (lineEnd !== -1) insertPos = lineEnd + 1;
      } else if (body.startsWith('import ')) {
        // 文件以简单 import 开始，找到最后一个 import 的换行
        const lastImportEnd = body.lastIndexOf(';');
        if (lastImportEnd !== -1) {
          insertPos = body.indexOf('\n', lastImportEnd) + 1;
        } else {
          insertPos = 0;
        }
      } else {
        insertPos = 0;
      }
      const loggerDecl = `const logger = getLogger('${loggerName}');\n\n`;
      body = body.slice(0, insertPos) + loggerDecl + body.slice(insertPos);
    }

    // 重新组合 shebang
    content = shebang + body;

    // 写回文件
    writeFileSync(filePath, content, 'utf-8');
    const replacedCount = (body.match(/logger\.(info|warn|error)\(/g) || []).length;
    console.log(`✓ ${relative(SRC, filePath)} (replaced: ${replacedCount})`);
    return replacedCount;
  } catch (err) {
    console.error(`✗ ${relative(SRC, filePath)}: ${err.message}`);
  }
  return 0;
}

function main() {
  console.log('🔧 安全替换核心模块 console → logger\n');

  let totalFiles = 0;
  let totalReplacements = 0;
  const filesToProcess = [];

  function walk(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
        walk(fullPath);
      } else if (shouldProcess(fullPath)) {
        filesToProcess.push(fullPath);
      }
    }
  }

  walk(SRC);

  for (const file of filesToProcess) {
    totalFiles++;
    totalReplacements += processFile(file);
  }

  console.log(`\n✅ 完成！处理 ${totalFiles} 个文件，替换 ${totalReplacements} 处 console。`);
}

main();
