#!/usr/bin/env node

/**
 * TaskFlow AI 代码质量优化助手
 *
 * 该脚本帮助执行代码质量改进:
 * - 批量分析 console 调用
 * - 列出 :any 类型使用
 * - 创建 E2E 测试脚手架
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();

// 颜色 (禁用如果不需要)
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

function log(msg, color = colors.reset) {
  console.log(color + msg + colors.reset);
}

/**
 * 分析代码质量
 */
function analyze() {
  log('\n🔍 代码质量分析报告\n', colors.bright + colors.cyan);

  const srcDir = path.join(ROOT, 'src');
  let tsFiles = 0;
  let consoleLogs = 0;
  let anyTypes = 0;
  const consoleFiles = new Set();
  const anyFiles = new Set();

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (['node_modules', '__tests__', 'ui', 'commands'].includes(entry.name)) continue;
        walk(fullPath);
      } else if (entry.name.endsWith('.ts')) {
        tsFiles++;
        const content = fs.readFileSync(fullPath, 'utf-8');

        // 统计 console
        const consoleMatches = content.match(/console\.(log|warn|error)\(/g);
        if (consoleMatches) {
          consoleLogs += consoleMatches.length;
          consoleFiles.add(fullPath.replace(ROOT + '/', ''));
        }

        // 统计 any
        const anyMatches = content.match(/:\s*any\b/g);
        if (anyMatches) {
          anyTypes += anyMatches.length;
          anyFiles.add(fullPath.replace(ROOT + '/', ''));
        }
      }
    }
  }

  walk(srcDir);

  log(`📊 TypeScript 文件总数: ${tsFiles}`);
  log(`⚠️  使用 console 的文件: ${consoleFiles.size} (共 ${consoleLogs} 处调用)`);
  log(`⚠️  使用 :any 的文件: ${anyFiles.size} (共 ${anyTypes} 处)`);

  if (consoleFiles.size > 0) {
    log('\n📋 console 调用最多的文件 (前 10):', colors.yellow);
    const fileConsoleCounts = [];
    consoleFiles.forEach(file => {
      const content = fs.readFileSync(path.join(ROOT, file), 'utf-8');
      const count = (content.match(/console\.(log|warn|error)\(/g) || []).length;
      fileConsoleCounts.push([file, count]);
    });
    fileConsoleCounts
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([file, count]) => {
        log(`  ${count}  ${file}`, colors.yellow);
      });
  }

  if (anyFiles.size > 0) {
    log('\n📋 :any 使用最多的文件 (前 10):', colors.yellow);
    const fileAnyCounts = [];
    anyFiles.forEach(file => {
      const content = fs.readFileSync(path.join(ROOT, file), 'utf-8');
      const count = (content.match(/:\s*any\b/g) || []).length;
      fileAnyCounts.push([file, count]);
    });
    fileAnyCounts
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([file, count]) => {
        log(`  ${count}  ${file}`, colors.yellow);
      });
  }

  log('\n💡 建议:', colors.green);
  log('  1. 优先处理核心模块 (src/core/, src/mcp/, src/agent/)');
  log('  2. 使用脚本: node scripts/quality-assistant.js replace-logs');
  log('  3. 处理 any 类型时，先分析上下文再替换');
  log('  4. 每次修改后运行: npm run check && npm test\n');
}

/**
 * 列出所有 :any 使用
 */
function listAny() {
  log('\n📋 所有 :any 使用情况\n', colors.bright + colors.cyan);

  const srcDir = path.join(ROOT, 'src');
  const results = [];

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (['node_modules', '__tests__'].includes(entry.name)) continue;
        walk(fullPath);
      } else if (entry.name.endsWith('.ts')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          if (line.match(/:\s*any\b/)) {
            results.push({
              file: fullPath.replace(ROOT + '/', ''),
              line: idx + 1,
              code: line.trim().substring(0, 80),
            });
          }
        });
      }
    }
  }

  walk(srcDir);

  log(`共找到 ${results.length} 处 :any 使用:\n`);

  // 按文件分组
  const byFile = new Map();
  results.forEach(r => {
    const list = byFile.get(r.file) || [];
    list.push(r);
    byFile.set(r.file, list);
  });

  // 输出
  let count = 0;
  for (const [file, items] of byFile.entries()) {
    log(`\n${colors.bright}${file}${colors.reset} (${items.length} 处):`);
    items.forEach(item => {
      log(`  ${colors.yellow}${item.line}${colors.reset}: ${item.code}`, colors.dim);
    });
    count += items.length;
  }

  log(`\n总计: ${count} 处\n`);
}

/**
 * 替换单个文件中的 console
 */
function replaceConsoleInFile(filePath, dryRun = false) {
  const fullPath = path.join(ROOT, filePath);
  if (!fs.existsSync(fullPath)) {
    log(`❌ 文件不存在: ${filePath}`, colors.red);
    return { changed: false, replacements: 0 };
  }

  let content = fs.readFileSync(fullPath, 'utf-8');
  const original = content;
  let replacements = 0;

  // 检查是否已有 logger 导入
  const hasLogger = content.includes('getLogger');

  // 添加导入（如果没有）
  if (!hasLogger) {
    const firstImportEnd = content.indexOf(';', content.indexOf('import'));
    if (firstImportEnd !== -1) {
      // 计算相对路径
      const depth = (filePath.match(/\//g) || []).length - 2; // src/ 之后
      const relPath = '../'.repeat(Math.max(depth, 0)) + 'utils/logger';
      const loggerImport = `import { getLogger } from '${relPath}';\n`;
      content =
        content.slice(0, firstImportEnd + 1) + loggerImport + content.slice(firstImportEnd + 1);
      replacements++;
    }
  }

  // 生成 logger 名称
  const loggerName = filePath
    .replace(/^src\//, '')
    .replace(/\.ts$/, '')
    .replace(/\//g, ':');

  // 添加 logger 初始化
  if (!/const logger = getLogger\(/.test(content) && content.includes('console.')) {
    const firstCode = content.search(
      /(const|let|var|function|class|export\s+(class|function|const|let|var))/
    );
    if (firstCode !== -1) {
      const loggerDecl = `const logger = getLogger('${loggerName}');\n`;
      content = content.slice(0, firstCode) + loggerDecl + content.slice(firstCode);
      replacements++;
    }
  }

  // 替换 console 调用
  if (content.includes('console.log(')) {
    content = content.replace(/console\.log\(/g, 'logger.info(');
    replacements +=
      (content.match(/logger\.info\(/g) || []).length -
      (original.match(/logger\.info\(/g) || []).length;
  }
  if (content.includes('console.warn(')) {
    content = content.replace(/console\.warn\(/g, 'logger.warn(');
    replacements +=
      (content.match(/logger\.warn\(/g) || []).length -
      (original.match(/logger\.warn\(/g) || []).length;
  }
  if (content.includes('console.error(')) {
    content = content.replace(/console\.error\(/g, 'logger.error(');
    replacements +=
      (content.match(/logger\.error\(/g) || []).length -
      (original.match(/logger\.error\(/g) || []).length;
  }

  if (content !== original) {
    if (dryRun) {
      log(`[DRY RUN] ${filePath}: 将替换 ${replacements} 处`, colors.yellow);
    } else {
      fs.writeFileSync(fullPath, content, 'utf-8');
      log(`✅ ${filePath}: 替换了 ${replacements} 处`, colors.green);
    }
    return { changed: true, replacements };
  }

  return { changed: false, replacements: 0 };
}

/**
 * 批量替换 console
 */
function replaceLogs() {
  log('\n🔧 批量替换 console → logger\n', colors.bright + colors.cyan);

  const srcDir = path.join(ROOT, 'src');
  const targetDirs = [
    'core',
    'mcp',
    'agent',
    'knowledge',
    'utils',
    'marketplace',
    'codegen',
    'cicd',
    'types',
    'constants',
  ];

  const excludeDirs = ['__tests__', 'ui', 'commands'];

  const filesToProcess = [];

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (excludeDirs.includes(entry.name) || entry.name === 'node_modules') continue;
        walk(fullPath);
      } else if (entry.name.endsWith('.ts')) {
        const relPath = fullPath.replace(ROOT + '/', '');
        // 检查是否有 console 且不在排除目录
        if (!excludeDirs.some(d => relPath.includes(d))) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          if (/console\.(log|warn|error)\(/.test(content)) {
            filesToProcess.push(relPath);
          }
        }
      }
    }
  }

  // 遍历目标目录
  targetDirs.forEach(dir => {
    const dirPath = path.join(srcDir, dir);
    if (fs.existsSync(dirPath)) {
      walk(dirPath);
    }
  });

  log(`找到 ${filesToProcess.length} 个需要处理的文件\n`);

  if (filesToProcess.length === 0) {
    log('✅ 没有需要处理的文件！', colors.green);
    return;
  }

  // 显示前 10 个
  log('前 10 个文件:');
  filesToProcess.slice(0, 10).forEach(f => log(`  - ${f}`));
  if (filesToProcess.length > 10) {
    log(`  ... 还有 ${filesToProcess.length - 10} 个文件`);
  }

  // 询问
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = new Promise(resolve => {
    rl.question(`\n是否处理这 ${filesToProcess.length} 个文件? (dry-run/yes/no): `, ans => {
      rl.close();
      resolve(ans.trim().toLowerCase());
    });
  }).then(ans => ans);

  if (answer === 'no' || answer === 'n') {
    log('❌ 取消操作', colors.red);
    return;
  }

  const dryRun = answer !== 'yes';

  let totalReplacements = 0;
  let processed = 0;

  for (const file of filesToProcess) {
    const result = replaceConsoleInFile(file, dryRun);
    totalReplacements += result.replacements;
    processed++;

    if (processed % 10 === 0) {
      log(`进度: ${processed}/${filesToProcess.length}...`, colors.cyan);
    }
  }

  log(`\n${dryRun ? '🔍' : '✅'} 完成！`, dryRun ? colors.yellow : colors.green);
  log(`  处理文件: ${processed}`);
  log(`  替换次数: ${totalReplacements}`);

  if (!dryRun) {
    log('\n📋 后续步骤:', colors.cyan);
    log('  1. 运行质量检查: npm run check');
    log('  2. 运行测试: npm test');
    log(
      '  3. 查看剩余 console: grep -rn "console\\.(log|warn|error)\\(" src --include="*.ts" | grep -v "__tests__"'
    );
  }
}

/**
 * 创建 E2E 测试脚手架
 */
function scaffoldE2E() {
  log('\n🏗️  创建 E2E 测试脚手架\n', colors.bright + colors.cyan);

  const testsDir = path.join(ROOT, 'tests', 'e2e');

  if (!fs.existsSync(testsDir)) {
    fs.mkdirSync(testsDir, { recursive: true });
    log(`创建目录: ${testsDir.replace(ROOT + '/', '')}`);
  }

  const files = [
    {
      path: path.join(testsDir, 'scenarios.js'),
      content: `// E2E 测试场景
module.exports = {
  // 场景1: 完整 PRD 解析流程
  prdParsing: {
    name: 'PRD 解析完整流程',
    steps: [
      'taskflow init',
      'taskflow parse sample-prd.md',
      '验证 tasks.json 生成',
      '验证甘特图生成'
    ]
  },
  
  // 场景2: 模型路由
  modelRouting: {
    name: '模型智能路由',
    steps: [
      'taskflow model add deepseek',
      'taskflow model add openai',
      'taskflow model route "测试查询"',
      '验证选择了合适的模型'
    ]
  },
  
  // 场景3: 工作流执行
  workflowExecution: {
    name: '工作流执行',
    steps: [
      'taskflow flow create test-workflow',
      'taskflow flow run test-workflow',
      '验证任务正确执行',
      '验证状态持久化'
    ]
  }
};`,
    },
    {
      path: path.join(testsDir, 'runner.js'),
      content: `const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs-extra');
const scenarios = require('./scenarios');

const execAsync = promisify(exec);

module.exports = {
  async runE2ETest(scenarioName) {
    const scenario = scenarios[scenarioName];
    if (!scenario) {
      throw new Error(\`Scenario not found: \${scenarioName}\`);
    }
    
    console.log(\`🧪 Running: \${scenario.name}\`);
    
    for (const step of scenario.steps) {
      console.log(\`  ⚡ \${step}\`);
      try {
        const { stdout, stderr } = await execAsync(step, { 
          cwd: process.cwd(),
          timeout: 30000 
        });
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
      } catch (error) {
        console.error(\`  ❌ Failed: \${error.message}\`);
        return false;
      }
    }
    
    console.log(\`  ✅ \${scenario.name} passed\`);
    return true;
  },
  
  async runAllTests() {
    const results = await Promise.allSettled(
      Object.keys(scenarios).map(name => this.runE2ETest(name))
    );
    
    const passed = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failed = results.length - passed;
    
    return { passed, failed };
  }
};`,
    },
    {
      path: path.join(testsDir, 'index.js'),
      content: `module.exports = {
  runE2ETest: require('./runner').runE2ETest,
  runAllTests: require('./runner').runAllTests,
  scenarios: require('./scenarios')
};`,
    },
  ];

  for (const file of files) {
    fs.mkdirSync(path.dirname(file.path), { recursive: true });
    fs.writeFileSync(file.path, file.content);
    log(`✅ 创建: ${file.path.replace(ROOT + '/', '')}`);
  }

  log('\n📝 建议添加到 package.json scripts:');
  log('  "test:e2e": "node tests/e2e/index.js"');
  log('\n使用方法:');
  log('  npm run test:e2e                    # 运行所有 E2E 测试');
  log('  npm run test:e2e -- --scenario prdParsing  # 运行单个场景\n');
}

// 主入口
const command = process.argv[2];

switch (command) {
  case 'analyze':
    analyze();
    break;

  case 'list-any':
    listAny();
    break;

  case 'replace-logs':
    replaceLogs();
    break;

  case 'scaffold-e2e':
    scaffoldE2E();
    break;

  default:
    log('\n📦 TaskFlow AI 代码质量优化助手\n', colors.bright + colors.cyan);
    log('用法: node scripts/quality-assistant.js [命令]\n');
    log('命令:');
    log('  analyze      分析代码质量问题');
    log('  list-any     列出所有 :any 使用');
    log('  replace-logs 批量替换 console → logger');
    log('  scaffold-e2e 创建 E2E 测试脚手架');
    log('');
    log('示例:');
    log('  node scripts/quality-assistant.js analyze');
    log('  node scripts/quality-assistant.js replace-logs');
    log('');
}
