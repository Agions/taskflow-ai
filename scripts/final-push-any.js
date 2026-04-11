#!/usr/bin/env node

/**
 * 最后一波 - 处理剩余高价值 : any
 */

const { readFileSync, writeFileSync } = require('fs');

const files = [
  'src/cli/commands/agent/runner.ts',
  'src/cli/commands/visualize/data.ts',
  'src/cli/commands/mcp.ts',
  'src/cli/commands/flow/templates.ts',
  'src/cli/ui/prompts.ts',
  'src/agent/state-machine/index.ts',
  'src/agent/types/history.ts',
  'src/knowledge/storage/search.ts',
  'src/core/workflow/sqlite-storage.ts',
  'src/core/plugin/types.ts',
  'src/mcp/resources/data-providers.ts',
];

let total = 0;

for (const file of files) {
  try {
    let content = readFileSync(file, 'utf-8');
    const before = content;

    // 替换函数返回类型: : any -> : unknown
    content = content.replace(/: any(\})/g, ': unknown$1');
    content = content.replace(/: any[,=]/g, ': unknown, ');
    content = content.replace(/: any\)/g, ': unknown)');

    // 替换变量声明: let x: any = -> let x: unknown =
    content = content.replace(/(let|const|var) (\w+): any\s*=/g, '$1 $2: unknown =');

    // 替换参数: (\w+): any
    content = content.replace(/(\w+):\s*any[,\)]/g, '$1: unknown,');

    if (content !== before) {
      writeFileSync(file, content, 'utf-8');
      const count = (before.match(/: any/g) || []).length;
      console.log(`✅ ${file} (${count})`);
      total += count;
    }
  } catch (err) {
    // ignore
  }
}

console.log(`\n✅ 完成！共替换 ${total} 处`);

try {
  const remaining = require('child_process')
    .execSync("grep -rn ': any' src --include='*.ts' | wc -l", { encoding: 'utf-8' })
    .trim();
  console.log(`   剩余 any 数量: ${remaining}`);
} catch (e) {
  console.log('   无法统计剩余数量');
}
