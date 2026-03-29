#!/usr/bin/env node

/**
 * 修复 catch (error: unknown) 中的 error.message 访问
 * 替换为: error instanceof Error ? error.message : String(error)
 */

const { readFileSync, writeFileSync } = require('fs');

const files = [
  'src/mcp/tools/database.ts',
  'src/mcp/tools/git.ts',
  'src/mcp/tools/notification.ts',
  'src/mcp/tools/shell.ts',
  'src/utils/errors.ts',
  'src/core/workflow/sqlite-storage.ts',
  'src/mcp/security/index.ts',
  'src/mcp/security/ip-filter.ts',
  'src/mcp/security/sandbox.ts',
];

let total = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  const before = content;
  
  // 替换 catch (error: unknown) 块中的 error.message
  // 匹配: { success: false, error: error.message }
  // 替换为: { success: false, error: error instanceof Error ? error.message : String(error) }
  content = content.replace(/(\{\s*success:\s*false,\s*error:\s*)error\.message(\s*\})/g, 
    '$1error instanceof Error ? error.message : String(error)$2');
  
  // 替换 throw new Error(`...${error.message}...`)
  content = content.replace(/(throw\s+new\s+Error\(`[^`]*?)\.error\.message([^`]*?`\))/g,
    '$1${error => error instanceof Error ? error.message : String(error)}$2');
  
  // 替换直接使用 error.message 的表达式
  content = content.replace(/(\berror\.message\b)/g, 
    '(error instanceof Error ? error.message : String(error))');
  
  if (content !== before) {
    writeFileSync(file, content, 'utf-8');
    console.log(`✅ ${file}`);
    total++;
  }
}

console.log(`✅ 完成！修正 ${total} 个文件`);
