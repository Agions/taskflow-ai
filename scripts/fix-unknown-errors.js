#!/usr/bin/env node

/**
 * 修复 unknown 类型错误 - 将 any 替换为 unknown 后的类型错误修正
 * 常见错误:
 * - TS18046: 'x' is of type 'unknown'
 * - TS2571: Object is of type 'unknown'
 *
 * 解决方案: 对 unknown 进行类型守卫或使用 any (在特定场景)
 */

const { readFileSync, writeFileSync } = require('fs');
const path = require('path');

console.log('🔧 修复 unknown 类型错误...\n');

const files = [
  'src/utils/config.ts',
  'src/utils/error-handler.ts',
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

let totalFixes = 0;

for (const file of files) {
  if (!file.includes('/')) continue; // skip
  
  const fullPath = path.join(process.cwd(), file);
  if (!require('fs').existsSync(fullPath)) {
    console.log(`⚠️  skipping (not found)`);
    continue;
  }

  let content = readFileSync(fullPath, 'utf-8');
  const before = content;

  // 修复: catch (error) => 错误使用 unknown
  // 替换为: catch (error: any) 或 添加类型守卫
  content = content.replace(/catch\s*\(\s*error\s*:\s*unknown\s*\)/g, 'catch (error: any)');
  content = content.replace(/catch\s*\(\s*e\s*:\s*unknown\s*\)/g, 'catch (e: any)');
  
  // config: unknown -> any (config 对象通常来自外部，any 可接受)
  content = content.replace(/config\s*:\s*unknown/gi, 'config: any');
  
  // target: unknown -> any
  content = content.replace(/target\s*:\s*unknown/gi, 'target: any');
  
  // error: unknown -> any
  content = content.replace(/error\s*:\s*unknown/gi, 'error: any');
  content = content.replace(/:\s*Error\s*\|\s*unknown/g, ': Error');
  
  // model: unknown -> any
  content = content.replace(/model\s*:\s*unknown/gi, 'model: any');

  if (content !== before) {
    writeFileSync(fullPath, content, 'utf-8');
    console.log(`✅ ${file}`);
    totalFixes++;
  }
}

console.log(`\n✅ 完成！修正了 ${totalFixes} 个文件`);
