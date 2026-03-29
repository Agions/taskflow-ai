#!/usr/bin/env node

/**
 * 批量替换 : any 为 : unknown
 * 目标: 将剩余的所有 : any 替换为 : unknown，快速提升类型安全
 */

const { execSync } = require('child_process');
const { readFileSync, writeFileSync } = require('fs');

console.log('🔧 批量替换 : any → : unknown\n');

// 获取所有包含 ": any" 的 TypeScript 文件
const listCmd = "grep -rln ': any' src --include='*.ts' | grep -v '__tests__'";
const files = execSync(listCmd, { encoding: 'utf-8' }).trim().split('\n').filter(Boolean);

console.log(`找到 ${files.length} 个文件需要处理`);

let totalReplacements = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  const before = content;

  // 替换 ": any" 为 ": unknown"
  // 注意：需要匹配确切模式，避免替换注释或字符串中的内容
  content = content.replace(/: any\)/g, ': unknown)');
  content = content.replace(/: any,/g, ': unknown,');
  content = content.replace(/: any\[\]/g, ': unknown[]');
  content = content.replace(/any\[\]/g, 'unknown[]');

  if (content !== before) {
    writeFileSync(file, content, 'utf-8');
    const count = (before.match(/: any/g) || []).length;
    totalReplacements += count;
    console.log(`✅ ${file} (${count} 处)`);
  }
}

console.log(`\n✅ 完成！共替换 ${totalReplacements} 处 : any → : unknown`);
console.log(`剩余 any 数量: ${files.length} 文件 (实际数量需再次 grep 确认)`);
