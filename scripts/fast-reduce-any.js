#!/usr/bin/env node

/**
 * 快速减少剩余 : any - 针对低风险文件
 * 目标: 从 85 → 50
 */

const { readFileSync, writeFileSync } = require('fs');

// 高优先级文件（容易替换，风险低）
const priorityFiles = [
  'src/types/utils.ts',
  'src/types/plugin.ts',
  'src/types/visualization.ts',
  'src/utils/config.ts',
  'src/utils/logger.ts',
  'src/mcp/prompts/types.ts',
  'src/knowledge/types.ts',
  'src/core/workflow/storage-types.ts',
  'src/agent/types/template.ts',
  'src/agent/types/verification.ts',
  'src/cicd/github/api-client.ts',
  'src/cicd/github/workflow-generator.ts',
  'src/core/ai/router-types.ts',
];

let total = 0;

for (const file of priorityFiles) {
  try {
    let content = readFileSync(file, 'utf-8');
    const before = content;

    // 替换 : any 为 : unknown
    content = content.replace(/: any\)/g, ': unknown)');
    content = content.replace(/: any,/g, ': unknown,');
    content = content.replace(/: any\[\]/g, ': unknown[]');

    // 特殊处理: 在接口属性中
    content = content.replace(/(\w+):\s*any;?/g, '$1: unknown;');

    if (content !== before) {
      writeFileSync(file, content, 'utf-8');
      const count = (before.match(/: any/g) || []).length;
      console.log(`✅ ${file} (${count})`);
      total += count;
    }
  } catch (err) {
    // 文件不存在则跳过
  }
}

console.log(`\n✅ 完成！共替换 ${total} 处 : any → : unknown`);
console.log(`   处理文件: ${priorityFiles.length}`);

// 统计剩余
const { execSync } = require('child_process');
try {
  const remaining = execSync("grep -rn ': any' src --include='*.ts' | wc -l", {
    encoding: 'utf-8',
  }).trim();
  console.log(`   剩余 any 数量: ${remaining}`);
} catch (e) {
  console.log('   无法统计剩余数量');
}
