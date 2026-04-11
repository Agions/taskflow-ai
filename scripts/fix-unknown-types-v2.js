#!/usr/bin/env node
/**
 * 修复 unknown 类型问题 - 第二批
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/agent/state-machine/index.ts',
  'src/agent/state-machine/machine.ts',
  'src/agent/verification/checks.ts',
  'src/cicd/github/api-client.ts',
  'src/cicd/github/validator.ts',
  'src/cli/commands/agent/index.ts',
  'src/cli/commands/agent/runner.ts',
  'src/cli/commands/flow/create.ts',
  'src/cli/commands/mcp.ts',
  'src/cli/commands/model.ts',
  'src/cli/commands/status.ts',
  'src/cli/commands/think.ts',
  'src/cli/commands/visualize/data.ts',
  'src/cli/commands/visualize/index.ts',
  'src/cli/commands/visualize/prompts.ts',
  'src/cli/commands/visualize/report.ts',
  'src/codegen/templates/index.ts',
  'src/core/ai/providers/deepseek.ts',
  'src/core/ai/providers/openai.ts',
  'src/core/ai/router-rules.ts',
  'src/core/ai/router-types.ts',
  'src/core/config/operations.ts',
  'src/core/parser/index.ts',
  'src/core/plugin/manager.ts',
  'src/core/workflow/yaml-parser.ts',
  'src/core/workflow/memory-storage.ts',
  'src/knowledge/retrieval/index.ts',
  'src/knowledge/storage/search.ts',
  'src/mcp/server/executor.ts',
  'src/mcp/server/index.ts',
  'src/mcp/stdio-server.ts',
  'src/mcp/tools/shell.ts',
  'src/utils/error-handler.ts',
  'src/utils/errors.ts',
];

function fixFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`跳过不存在的文件: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;

  // 修复局部变量声明: const xxx: unknown = -> const xxx: any =
  content = content.replace(/const\s+(\w+)\s*:\s*unknown\s*=/g, 'const $1: any =');

  // 修复 let 变量声明
  content = content.replace(/let\s+(\w+)\s*:\s*unknown\s*=/g, 'let $1: any =');

  // 修复函数参数类型: (xxx: unknown) -> (xxx: any)
  content = content.replace(/(\w+)\s*:\s*unknown([,\)])/g, '$1: any$2');

  // 修复 for...of 循环中的 unknown
  content = content.replace(
    /for\s*\(\s*const\s+(\w+)\s+of\s+(\w+)\s*\)/g,
    'for (const $1 of $2 as any[])'
  );

  // 修复 for...of 循环中的 unknown (带类型注解)
  content = content.replace(
    /for\s*\(\s*const\s+(\w+)\s*:\s*unknown\s+of\s+(\w+)\s*\)/g,
    'for (const $1 of $2 as any[])'
  );

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
