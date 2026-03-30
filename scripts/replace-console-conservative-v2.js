#!/usr/bin/env node

/**
 * 安全替换：console.warn/error → logger.warn/error
 * 保留 console.log（用于 CLI 用户交互）
 * 自动添加导入和 logger 声明，保护 shebang 和 import 结构
 */

const { readFileSync, writeFileSync, readdirSync } = require('fs');
const { join, relative, sep } = require('path');

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

function shouldProcess(filePath) {
  if (!filePath.endsWith('.ts')) return false;
  if (filePath.includes('/__tests__/') || filePath.endsWith('.test.ts')) return false;
  if (filePath.endsWith('/utils/logger.ts')) return false; // 排除 logger 自身
  return true; // 处理所有目录（包括 CLI）
}

function getImportPath(filePath) {
  const rel = relative(SRC, filePath);
  const depth = (rel.match(/\//g) || []).length;
  const up = depth > 0 ? '../'.repeat(depth) : '';
  return `${up}utils/logger`;
}

function getLoggerName(filePath) {
  const rel = relative(SRC, filePath).replace(/\.ts$/, '');
  return rel.replace(/\\/g, ':');
}

function processFile(filePath) {
  try {
    let content = readFileSync(filePath, 'utf-8');
    const hasShebang = content.startsWith('#!');
    const shebang = hasShebang ? content.slice(0, content.indexOf('\n') + 1) : '';
    let body = hasShebang ? content.slice(shebang.length) : content;

    const hasImport = /import\s*{\s*getLogger\s*}\s*from\s*['"][^'"]*logger['"]/.test(body);
    const hasLoggerDecl = /const\s+logger\s*=\s*getLogger\s*\(/.test(body);

    // 只替换 warn 和 error
    let replaced = 0;
    body = body.replace(/console\.warn\(/g, 'logger.warn(');
    replaced += (body.match(/logger\.warn\(/g) || []).length;
    body = body.replace(/console\.error\(/g, 'logger.error(');
    replaced += (body.match(/logger\.error\(/g) || []).length;

    if (replaced === 0) return 0;

    // 添加导入
    if (!hasImport) {
      const importStmt = `import { getLogger } from '${getImportPath(filePath)}';\n`;
      body = importStmt + body;
    }

    // 添加 logger 声明
    if (!hasLoggerDecl) {
      const loggerName = getLoggerName(filePath);
      const loggerDecl = `const logger = getLogger('${loggerName}');\n\n`;
      // 插入到 import 块之后或文件顶部
      const importEnd = body.lastIndexOf('} from');
      let insertPos = 0;
      if (importEnd !== -1) {
        const lineEnd = body.indexOf('\n', importEnd);
        if (lineEnd !== -1) insertPos = lineEnd + 1;
      } else {
        // 找到第一个非 import 行
        const lines = body.split('\n');
        let i = 0;
        while (i < lines.length && (lines[i].startsWith('import ') || lines[i].trim() === '' || lines[i].startsWith('//'))) i++;
        insertPos = lines.slice(0, i).join('\n').length + (i > 0 ? 1 : 0);
      }
      body = body.slice(0, insertPos) + loggerDecl + body.slice(insertPos);
    }

    content = shebang + body;
    writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ ${relative(SRC, filePath)} (${replaced})`);
    return replaced;
  } catch (err) {
    console.error(`✗ ${relative(SRC, filePath)}: ${err.message}`);
  }
  return 0;
}

function main() {
  console.log('🔧 保守替换：console.warn/error → logger（保留 console.log）\n');
  let totalFiles = 0;
  let totalReplacements = 0;
  const filesToProcess = [];

  function walk(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules') continue;
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

  console.log(`\n✅ 完成！处理 ${totalFiles} 个文件，替换 ${totalReplacements} 处 console.warn/error。`);
}

main();
