#!/usr/bin/env node

/**
 * 最后一波批量替换 : any → : unknown
 * 目标: 从 56 降至 <50
 */

const { readFileSync, writeFileSync } = require('fs');

const files = [
  'src/cli/commands/agent/mock-ai.ts',
  'src/cli/commands/flow/templates.ts',
  'src/cli/commands/mcp.ts',
  'src/core/plugin/template.ts',
  'src/core/plugin/types.ts',
  'src/mcp/prompts/types.ts',
  'src/mcp/resources/data-providers.ts',
  'src/mcp/security/index.ts',
  'src/mcp/security/ip-filter.ts',
  'src/mcp/security/sandbox.ts',
  'src/mcp/server/executor.ts',
  'src/mcp/server/handlers.ts',
  'src/mcp/server/index.ts',
  'src/knowledge/storage/search.ts',
  'src/knowledge/types.ts',
  'src/agent/types/history.ts',
  'src/agent/types/verification.ts',
  'src/agent/state-machine/index.ts',
  'src/core/workflow/sqlite-storage.ts',
  'src/types/plugin.ts',
  'src/types/sql.js.d.ts',
  'src/types/utils.ts',
  'src/types/visualization.ts',
  'src/utils/logger.ts',
];

let total = 0;

for (const file of files) {
  try {
    let content = readFileSync(file, 'utf-8');
    const before = content;

    // 替换函数签名的 : any
    content = content.replace(/(\w+):\s*any[,\)]/g, '$1: unknown,');
    content = content.replace(/: any[,\)]/g, ': unknown,');

    // 替换数组 : any[]
    content = content.replace(/: any\[\]/g, ': unknown[]');

    // 替换 catch (error: any)
    content = content.replace(/catch\s*\(\s*(\w+):\s*any\s*\)/g, 'catch ($1: unknown)');

    // 替换 options?: any
    content = content.replace(/(\w+)\?\s*:\s*any/g, '$1?: unknown');

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

// 统计剩余
try {
  const remaining = require('child_process').execSync("grep -rn ': any' src --include='*.ts' | wc -l", { encoding: 'utf-8' }).trim();
  console.log(`   剩余 any 数量: ${remaining}`);
} catch (e) {
  console.log('   无法统计剩余数量');
}
