#!/usr/bin/env node

/**
 * 批量修复剩余关键文件的 : any
 * 目标: 28 → 15
 */

const { readFileSync, writeFileSync } = require('fs');

const files = [
  'src/cli/commands/mcp.ts',
  'src/cli/commands/flow/templates.ts',
  'src/cli/commands/agent/runner.ts',
  'src/cli/commands/visualize/data.ts',
  'src/core/plugin/types.ts',
  'src/core/workflow/sqlite-storage.ts',
  'src/knowledge/storage/search.ts',
  'src/mcp/resources/data-providers.ts',
  'src/mcp/security/sandbox.ts',
  'src/mcp/server/executor.ts',
  'src/agent/state-machine/index.ts',
  'src/agent/types/history.ts',
];

let total = 0;

for (const file of files) {
  try {
    let content = readFileSync(file, 'utf-8');
    const before = content;

    // 替换返回类型 : any
    content = content.replace(/(\w+\([^)]*\)):\s*any\s*{/g, '$1: unknown {');
    content = content.replace(/Promise<any>/g, 'Promise<unknown>');
    content = content.replace(/: any[,\)]/g, ': unknown,');
    content = content.replace(/: any\[\]/g, ': unknown[]');

    // 替换函数参数: any
    content = content.replace(/(\w+):\s*any([,\)])/g, '$1: unknown$2');

    if (content !== before) {
      writeFileSync(file, content, 'utf-8');
      const count = (before.match(/: any/g) || []).length;
      console.log(`✅ ${file} (${count})`);
      total += count;
    }
  } catch (err) {
    // 忽略不存在的文件
  }
}

console.log(`\n✅ 完成！共替换 ${total} 处 : any → : unknown`);

try {
  const remaining = require('child_process').execSync("grep -rn ': any' src --include='*.ts' | wc -l", { encoding: 'utf-8' }).trim();
  console.log(`   剩余 any 数量: ${remaining}`);
  const percent = Math.round((total / (total + parseInt(remaining))) * 100);
  console.log(`   减少百分比: ~${percent}%`);
} catch (e) {
  console.log('   无法统计剩余数量');
}
