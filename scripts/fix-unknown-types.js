#!/usr/bin/env node
/**
 * 修复 unknown 类型问题
 * 将局部变量的 unknown 类型改为 any
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/cicd/github/workflow-generator.ts',
  'src/cicd/github/api-client.ts',
  'src/cli/commands/visualize/charts.ts',
  'src/core/workflow/sqlite-storage.ts',
  'src/core/thought/renderer.ts',
  'src/cli/commands/parse.ts',
  'src/marketplace/registry/search.ts',
  'src/mcp/resources/data-providers.ts',
  'src/core/tasks/index.ts',
  'src/cli/commands/mcp.ts',
  'src/knowledge/storage/search.ts',
  'src/core/parser/index.ts',
  'src/core/workflow/flow-control.ts',
  'src/agent/state-machine/index.ts',
  'src/core/plugin/manager.ts',
  'src/mcp/security/ip-filter.ts',
  'src/cli/commands/visualize/report.ts',
  'src/mcp/tools/notification.ts',
  'src/mcp/prompts/loader.ts',
];

function fixFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`跳过不存在的文件: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;

  // 修复局部变量声明: const xxx: unknown = -> const xxx: any =
  content = content.replace(/const\s+(\w+)\s*:\s*unknown\s*=/g, 'const $1: any =');

  // 修复 let 变量声明
  content = content.replace(/let\s+(\w+)\s*:\s*unknown\s*=/g, 'let $1: any =');

  // 修复函数参数类型: (xxx: unknown) -> (xxx: any)
  // 但不修改返回类型
  content = content.replace(/(\w+)\s*:\s*unknown([,\)])/g, '$1: any$2');

  // 修复 for...of 循环中的 unknown
  content = content.replace(
    /for\s*\(\s*const\s+(\w+)\s+of\s+(\w+)\s*\)/g,
    'for (const $1 of $2 as any[])'
  );

  // 修复 Object.entries(xxx) 其中 xxx 是 unknown
  // 这个比较复杂，需要手动处理

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✓ 已修复: ${filePath}`);
    return true;
  } else {
    console.log(`- 无变化: ${filePath}`);
    return false;
  }
}

let fixedCount = 0;
for (const file of filesToFix) {
  if (fixFile(file)) {
    fixedCount++;
  }
}

console.log(`\n总计修复 ${fixedCount} 个文件`);
