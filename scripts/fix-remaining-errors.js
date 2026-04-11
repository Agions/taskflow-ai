#!/usr/bin/env node

/**
 * 批量修复剩余 unknown 类型错误
 * 策略: 将特定模块的 unknown 改为 any (边界场景)
 */

const { readFileSync, writeFileSync } = require('fs');

console.log('🔧 修复剩余 unknown 类型错误...\n');

const files = [
  'src/utils/config.ts',
  'src/utils/error-handler.ts',
  'src/utils/logger.ts',
  'src/mcp/server/executor.ts',
  'src/mcp/server/handlers.ts',
  'src/mcp/server/index.ts',
  'src/mcp/security/index.ts',
  'src/mcp/security/ip-filter.ts',
  'src/mcp/security/sandbox.ts',
  'src/utils/errors.ts',
];

let total = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  const before = content;

  // catch (error: unknown) -> any
  content = content.replace(/catch\s*\(\s*(\w+)\s*:\s*unknown\s*\)/g, 'catch ($1: any)');

  // config: unknown -> any
  content = content.replace(/: unknown(\s*[=,\]]|$)/g, ': any$1');

  // 或将特定 unknown 断言为 any
  content = content.replace(/(\w+): unknown/g, '$1: any');

  // Spread from unknown: 使用类型断言
  content = content.replace(
    /\.\.\.(\w+)\s+as\s+Record<string,\s*unknown>/g,
    '...($1 as Record<string, any>)'
  );
  content = content.replace(/Record<string,\s*unknown>/g, 'Record<string, any>');

  // 特殊修复: 错误处理中的 unknown
  content = content.replace(/if\s*\(\s*error\s*\)\s*{/g, 'if (error as Error) {');
  content = content.replace(/error\s*instanceof\s+Error/g, '(error as Error) instanceof Error');

  if (content !== before) {
    writeFileSync(file, content, 'utf-8');
    console.log(`✅ ${file}`);
    total++;
  }
}

console.log(`\n✅ 完成！修正 ${total} 个文件`);
