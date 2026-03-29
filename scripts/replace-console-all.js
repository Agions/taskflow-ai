#!/usr/bin/env node

/**
 * 完整替换：处理所有生产代码（包括 CLI），只排除测试和 node_modules
 * 替换 console.log/warn/error → logger
 */

const { readFileSync, writeFileSync, readdirSync } = require('fs');
const { join, extname } = require('path');

const ROOT = process.cwd();
const SRC_DIR = join(ROOT, 'src');

// 需要处理的文件扩展名
const ALLOWED_EXT = ['.ts', '.js'];

function getLoggerName(filePath) {
  const relPath = filePath.replace(SRC_DIR + '/', '').replace(/\.ts$|\.js$/g, '');
  return relPath.replace(/\//g, ':');
}

function hasLoggerImport(content) {
  return content.includes('getLogger');
}

function addLoggerImport(content, filePath) {
  if (hasLoggerImport(content)) return content;

  // 尝试找到合适的插入点（在最后一个 import 之后）
  const importEnd = content.lastIndexOf('} from');
  if (importEnd !== -1) {
    const lineEnd = content.indexOf('\n', importEnd);
    if (lineEnd !== -1) {
      const depth = (filePath.match(/\//g) || []).length - (SRC_DIR.match(/\//g) || []).length;
      let importPath = depth > 0 ? '../'.repeat(depth) + 'utils/logger' : '../utils/logger';
      const importStmt = `import { getLogger } from '${importPath}';\n`;
      return content.slice(0, lineEnd + 1) + importStmt + content.slice(lineEnd + 1);
    }
  }

  // 没有找到 import 块，在文件顶部添加
  const importStmt = "import { getLogger } from '../utils/logger';\n";
  return importStmt + content;
}

function replaceConsoleCalls(content, loggerName) {
  let count = 0;
  let result = content;

  // 替换 console.log → logger.info
  result = result.replace(/console\.log\((.*?)\)/g, (match, expr) => {
    count++;
    return `logger.info(${expr})`;
  });

  // 替换 console.warn → logger.warn
  result = result.replace(/console\.warn\((.*?)\)/g, (match, expr) => {
    count++;
    return `logger.warn(${expr})`;
  });

  // 替换 console.error → logger.error
  result = result.replace(/console\.error\((.*?)\)/g, (match, expr) => {
    count++;
    return `logger.error(${expr})`;
  });

  // 添加 logger 初始化（如果使用了 logger 调用且未初始化）
  if (result.includes('logger.') && !result.includes('const logger = ')) {
    const loggerDecl = `\nconst logger = getLogger('${loggerName}');\n`;
    // 在第一个非 import 语句前插入
    const firstNonImport = result.search(/(const|let|var|function|class)\s/);
    if (firstNonImport !== -1) {
      result = result.slice(0, firstNonImport) + loggerDecl + result.slice(firstNonImport);
    } else {
      result = loggerDecl + result;
    }
  }

  return { result, count };
}

function processFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');

    if (!/console\.(log|warn|error)\(/.test(content)) {
      return 0;
    }

    const loggerName = getLoggerName(filePath);
    let newContent = addLoggerImport(content, filePath);
    const { result, count } = replaceConsoleCalls(newContent, loggerName);

    if (count > 0 && result !== content) {
      writeFileSync(filePath, result, 'utf-8');
      console.log(`✓ ${filePath.replace(SRC_DIR + '/', '')} (${count})`);
      return count;
    }
  } catch (err) {
    // 静默跳过错误
  }
  return 0;
}

function walkDir(dir) {
  let files = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') {
        continue;
      }
      files = files.concat(walkDir(fullPath));
    } else if (ALLOWED_EXT.includes(extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files;
}

// 主程序
console.log('🚀 开始批量替换 all console → logger（包含 CLI）...\n');

const files = walkDir(SRC_DIR);
let processedFiles = 0;
let totalReplacements = 0;

for (const file of files) {
  const count = processFile(file);
  if (count > 0) {
    processedFiles++;
    totalReplacements += count;
  }
}

console.log(`\n✅ 完成！`);
console.log(`   处理文件数: ${processedFiles}`);
console.log(`   替换次数: ${totalReplacements}`);

// 重新统计剩余 console
const remaining = files.reduce((sum, file) => {
  try {
    const content = readFileSync(file, 'utf-8');
    const matches = (content.match(/console\.(log|warn|error)\(/g) || []).length;
    return sum + matches;
  } catch {
    return sum;
  }
}, 0);
console.log(`   剩余 console 调用: ${remaining}`);
