#!/usr/bin/env node

/**
 * 精准替换 console 为 logger - 只处理非UI模块
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';

const ROOT = process.cwd();
const SRC_DIR = join(ROOT, 'src');

// 需要处理的目录（排除 CLI UI 模块）
const INCLUDE_DIRS = [
  'core',
  'mcp',
  'agent',
  'knowledge',
  'utils',
  'marketplace',
  'codegen',
  'cicd',
  'types',
  'constants'
];

// 排除目录
const EXCLUDE_DIRS = [
  '__tests__',
  'node_modules',
  'ui',        // CLI UI 模块保留 console
  'commands'   // CLI 命令模块保留 console（用户交互）
];

/**
 * 检查文件是否应该处理
 */
function shouldProcess(filePath: string): boolean {
  const relPath = filePath.replace(SRC_DIR + '/', '');
  
  // 排除测试文件
  if (relPath.includes('/__tests__/') || relPath.endsWith('.test.ts')) {
    return false;
  }
  
  // 排除 CLI UI 和 commands
  if (relPath.includes('/ui/') || relPath.includes('/commands/')) {
    return false;
  }
  
  return true;
}

/**
 * 处理文件
 */
function processFile(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8');
    
    // 检查是否有 console 调用
    if (!/console\.(log|warn|error)\(/.test(content)) {
      return false;
    }
    
    let newContent = content;
    let changed = false;
    
    // 检查是否已有 logger 导入
    if (!content.includes('getLogger')) {
      // 在第一个 import 后添加
      const firstImportEnd = content.indexOf(';', content.indexOf('import'));
      if (firstImportEnd !== -1) {
        const loggerImport = `import { getLogger } from '../utils/logger';\n`;
        newContent = content.slice(0, firstImportEnd + 1) + loggerImport + content.slice(firstImportEnd + 1);
        changed = true;
      }
    }
    
    // 生成 logger 名称
    const loggerName = filePath
      .replace(SRC_DIR + '/', '')
      .replace(/\.ts$/, '')
      .replace(/\//g, ':');
    
    // 添加 logger 初始化（如果还没有）
    if (!/const logger = getLogger\(/.test(newContent) && newContent.includes('logger.')) {
      const firstCode = newContent.search(/(const|let|var|function|class|export\s+(class|function|const|let|var))/);
      if (firstCode !== -1) {
        const loggerDecl = `const logger = getLogger('${loggerName}');\n`;
        newContent = newContent.slice(0, firstCode) + loggerDecl + newContent.slice(firstCode);
        changed = true;
      }
    }
    
    // 替换 console 调用
    if (newContent.includes('console.log(')) {
      newContent = newContent.replace(/console\.log\(/g, 'logger.info(');
      changed = true;
    }
    if (newContent.includes('console.warn(')) {
      newContent = newContent.replace(/console\.warn\(/g, 'logger.warn(');
      changed = true;
    }
    if (newContent.includes('console.error(')) {
      newContent = newContent.replace(/console\.error\(/g, 'logger.error(');
      changed = true;
    }
    
    if (changed) {
      writeFileSync(filePath, newContent, 'utf-8');
      console.log(`✓ ${relPath}`);
      return true;
    }
  } catch (error) {
    console.error(`✗ ${filePath}:`, error.message);
  }
  
  return false;
}

// 遍历目录
function walk(dir: string): string[] {
  let files: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.includes(entry.name)) {
        continue;
      }
      if (entry.name === 'node_modules') continue;
      files = files.concat(walk(fullPath));
    } else if (extname(entry.name) === '.ts') {
      files.push(fullPath);
    }
  }
  
  return files;
}

// 主程序
console.log('🚀 开始批量替换 console → logger (非UI模块)...\n');

const allFiles = walk(SRC_DIR);
const toProcess = allFiles.filter(shouldProcess);
let processed = 0;

for (const file of toProcess) {
  if (processFile(file)) {
    processed++;
  }
}

console.log(`\n✅ 完成！处理了 ${processed} 个文件`);
console.log(`📊 总共检查了 ${toProcess.length} 个文件`);
