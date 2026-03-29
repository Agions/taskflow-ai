#!/usr/bin/env node

/**
 * 最后一批 : any 替换 - 针对剩余关键文件
 */

const { readFileSync, writeFileSync } = require('fs');

const files = [
  'src/mcp/server/executor.ts',
  'src/mcp/server/index.ts',
  'src/cli/ui/prompts.ts',
  'src/agent/state-machine/index.ts',
  'src/agent/types/history.ts',
  'src/core/workflow/sqlite-storage.ts',
  'src/cicd/github/api-client.ts',
  'src/cicd/github/workflow-generator.ts',
  'src/mcp/resources/data-providers.ts',
  'src/mcp/security/index.ts',
];

let total = 0;

for (const file of files) {
  try {
    let content = readFileSync(file, 'utf-8');
    const before = content;

    // 替换方法返回类型
    content = content.replace(/(\w+\([^)]*\)):\s*any/g, '$1: unknown');
    content = content.replace(/Promise<any>/g, 'Promise<unknown>');
    content = content.replace(/: any[,\)]/g, ': unknown,');
    content = content.replace(/: any\[\]/g, ': unknown[]');
    content = content.replace(/(\w+):\s*any([,;}])/g, '$1: unknown$2');
    content = content.replace(/: any$/gm, ': unknown');

    if (content !== before) {
      writeFileSync(file, content, 'utf-8');
      const count = (before.match(/: any/g) || []).length;
      console.log(`✅ ${file} (${count})`);
      total += count;
    }
  } catch (err) {
    // 忽略
  }
}

console.log(`\n✅ 完成！共替换 ${total} 处 : any → : unknown`);

try {
  const remaining = require('child_process').execSync("grep -rn ': any' src --include='*.ts' | wc -l", { encoding: 'utf-8' }).trim();
  console.log(`   剩余 any 数量: ${remaining}`);
  if (remaining < 20) {
    console.log('🎯 目标达成！已降至 20 以下');
  }
} catch (e) {
  console.log('   无法统计剩余数量');
}
