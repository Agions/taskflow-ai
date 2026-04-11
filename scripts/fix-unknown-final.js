#!/usr/bin/env node

/**
 * 最后清理：将特定 unknown 改回 any 以通过编译
 * 场景: catch (error: unknown) -> any
 *      config: unknown -> { [key: string]: any }
 *      解构 spread: Record<string, unknown> -> Record<string, any>
 */

const { readFileSync, writeFileSync } = require('fs');

console.log('🔧 最后类型清理 - unknown → any (边界场景)\n');

const files = [
  'src/utils/logger.ts',
  'src/mcp/server/handlers.ts',
  'src/mcp/server/index.ts',
  'src/mcp/tools/code.ts',
  'src/mcp/tools/database.ts',
  'src/mcp/tools/git.ts',
  'src/mcp/tools/http.ts',
  'src/mcp/tools/notification.ts',
  'src/mcp/tools/shell.ts',
  'src/utils/errors.ts',
];

let fixes = 0;

for (const file of files) {
  const fullPath = file;
  let content = readFileSync(fullPath, 'utf-8');
  const before = content;

  // catch (error: unknown) -> catch (error: any)
  content = content.replace(/catch\s*\(\s*(\w+)\s*:\s*unknown\s*\)/g, 'catch ($1: any)');

  // config: unknown -> config: any
  content = content.replace(/: unknown(,?\s*\/\*)/g, ': any$1');

  // spread from unknown 不允许 -> 用 any 替代
  content = content.replace(
    /\.\.\.(\w+)\s* as\s*Record<string,\s*unknown>/g,
    '...($1 as Record<string, any>)'
  );
  content = content.replace(/Record<string,\s*unknown>/g, 'Record<string, any>');

  if (content !== before) {
    writeFileSync(fullPath, content, 'utf-8');
    console.log(`✅ ${file}`);
    fixes++;
  }
}

console.log(`\n✅ 完成！修正 ${fixes} 个文件`);
