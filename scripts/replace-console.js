#!/usr/bin/env node

/**
 * 批量替换 console 为 logger 的自动化脚本
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, extname, dirname } from 'path';

const ROOT = process.cwd();
const SRC_DIR = join(ROOT, 'src');

// 需要处理的文件扩展名
const ALLOWED_EXT = ['.ts', '.js'];

/**
 * 生成 logger 名称
 */
function getLoggerName(filePath: string): string {
  const relPath = filePath.replace(SRC_DIR + '/', '').replace(/\.ts$/, '');
  return relPath.replace(/\//g, ':');
}

/**
 * 检查文件是否已有 logger 导入
 */
function hasLoggerImport(content: string): boolean {
  return content.includes('getLogger');
}

/**
 * 添加 logger 导入
 */
function addLoggerImport(content: string, filePath: string): string {
  if (hasLoggerImport(content)) {
    return content;
  }

  // 找到最后一个 import 语句
  const importEnd = content.lastIndexOf('} from');
  if (importEnd === -1) {
    // 没有 import 块，在文件顶部添加
    return `import { getLogger } from '../../utils/logger';\n${content}`;
  }

  // 找到下一个换行
  const lineEnd = content.indexOf('\n', importEnd);
  if (lineEnd === -1) {
    return content;
  }

  // 在 import 块后添加
  const insertPos = lineEnd + 1;
  const loggerImport = `import { getLogger } from '../../utils/logger';\n`;
  
  // 检查是否需要调整相对路径
  const depth = (filePath.match(/\//g) || []).length - (SRC_DIR.match(/\//g) || []).length;
  if (depth > 0) {
    const adjustedPath = '../'.repeat(depth) + 'utils/logger';
    return content.replace(
      "import { getLogger } from '../../utils/logger';",
      `import { getLogger } from '${adjustedPath}';`
    );
  }

  return content.slice(0, insertPos) + loggerImport + content.slice(insertPos);
}

/**
 * 替换 console 调用
 */
function replaceConsoleCalls(content: string, loggerName: string): string {
  let result = content;
  
  // 替换 console.log -> logger.info
  result = result.replace(/console\.log\(/g, 'logger.info(');
  
  // 替换 console.warn -> logger.warn
  result = result.replace(/console\.warn\(/g, 'logger.warn(');
  
  // 替换 console.error -> logger.error
  result = result.replace(/console\.error\(/g, 'logger.error(');
  
  // 添加 logger 初始化（在文件顶部附近）
  if (result.includes('logger.') && !result.includes('const logger = ')) {
    // 在第一个 import 之后，第一个代码语句之前插入
    const firstNonImport = result.search(/(const|let|var|function|class)/);
    if (firstNonImport !== -1) {
      const loggerDecl = `const logger = getLogger('${loggerName}');\n`;
      result = result.slice(0, firstNonImport) + loggerDecl + result.slice(firstNonImport);
    }
  }
  
  return result;
}

/**
 * 处理单个文件
 */
function processFile(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8');
    
    // 检查是否有 console 调用
    if (!/console\.(log|warn|error)\(/.test(content)) {
      return false;
    }
    
    const loggerName = getLoggerName(filePath);
    let newContent = addLoggerImport(content, filePath);
    newContent = replaceConsoleCalls(newContent, loggerName);
    
    if (newContent !== content) {
      writeFileSync(filePath, newContent, 'utf-8');
      console.log(`✓ ${filePath.replace(ROOT + '/', '')}`);
      return true;
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error);
  }
  
  return false;
}

/**
 * 递归遍历目录
 */
function walkDir(dir: string): string[] {
  let files: string[] = [];
  
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
console.log('🚀 开始批量替换 console 为 logger...\n');

const files = walkDir(SRC_DIR);
let processed = 0;

for (const file of files) {
  if (processFile(file)) {
    processed++;
  }
}

console.log(`\n✅ 完成！处理了 ${processed} 个文件`);
console.log(`📊 剩余 console 调用: 需要重新统计`);
