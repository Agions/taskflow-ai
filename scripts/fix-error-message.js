#!/usr/bin/env node

/**
 * 批量修复 catch (error: unknown) 中的 .message 访问
 * 将 error.message 改为 (error instanceof Error ? error.message : String(error))
 */

const { readFileSync, writeFileSync } = require('fs');

const files = [
  'src/mcp/tools/database.ts',
  'src/mcp/tools/git.ts',
  'src/mcp/tools/notification.ts',
  'src/mcp/tools/shell.ts',
  'src/utils/errors.ts',
  'src/core/workflow/sqlite-storage.ts',
];

let total = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  const before = content;

  // 替换 throw new Error(`...${error.message}`) 为安全版本
  content = content.replace(
    /throw\s+new\s+Error\(`([^`]*)\.error\.message([^`]*)`\)/g,
    'throw new Error(`$1${(error) => error instanceof Error ? error.message : String(error)}$2`)'
  );

  // 简单的替换：throw new Error(`msg: ${error.message}`) -> 使用条件
  content = content.replace(
    /throw\s+new\s+Error\(`([^`]*?)${error\.message}([^`]*?)`\)/g,
    'throw new Error(`$1${(error) => error instanceof Error ? error.message : String(error)}$2`)'
  );

  // 更通用的：捕获 return { error: error.message } 模式
  content = content.replace(/(return\s*\{[^}]*error:\s*error\.message)/g, match => {
    return match.replace(
      'error.message',
      '(error instanceof Error ? error.message : String(error))'
    );
  });

  if (content !== before) {
    writeFileSync(file, content, 'utf-8');
    console.log(`✅ ${file}`);
    total++;
  }
}

console.log(`✅ 完成！修正 ${total} 个文件`);
