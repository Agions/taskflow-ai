#!/usr/bin/env node

/**
 * 启动多 Agent 协同开发 (简化版)
 * 并行启动 6 个专用 Agent 来优化 taskflow-ai 项目
 */

const { spawn } = require('child_process');
const { readFileSync, writeFileSync, existsSync } = require('fs');
const { join } = require('path');

const ROOT = process.cwd();

// Agent 定义
const AGENTS = [
  {
    id: 'log-agent',
    name: 'LogAgent',
    description: '统一日志系统，将 console 替换为 Logger',
    taskFile: 'docs/agents/log-agent-tasks.yaml'
  },
  {
    id: 'type-agent',
    name: 'TypeAgent',
    description: '类型安全优化，:any → 具体类型',
    taskFile: 'docs/agents/type-agent-tasks.yaml'
  },
  {
    id: 'refactor-agent',
    name: 'RefactorAgent',
    description: '重构协调，解决冲突，质量检查',
    task: '协调整体重构:\n1. 监控 LogAgent 和 TypeAgent 进度\n2. 解决文件冲突\n3. 运行质量检查\n4. 准备合并'
  },
  {
    id: 'test-agent',
    name: 'TestAgent',
    description: '测试增强，E2E 测试和覆盖率提升',
    task: '完善测试:\n1. 创建 E2E 测试场景 (10+)\n2. 补充集成测试\n3. 覆盖率优化 (86% → 95%)'
  },
  {
    id: 'doc-agent',
    name: 'DocAgent',
    description: '文档完善，API 示例和 CHANGELOG',
    task: 'API 文档:\n1. 检查文档完整性\n2. 生成使用示例\n3. 更新 CHANGELOG'
  },
  {
    id: 'review-agent',
    name: 'ReviewAgent',
    description: '最终审查，质量和安全审计',
    task: '质量检查:\n1. 运行 npm run quality\n2. 安全审计 npm audit\n3. 性能基准测试\n4. 生成报告'
  }
];

async function confirm() {
  // 检查命令行参数
  if (process.argv.includes('--yes') || process.argv.includes('-y')) {
    return true;
  }

  const readline = require('readline');
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question('\n是否确认启动所有 6 个 Agent? (y/N): ', (ans) => {
      rl.close();
      resolve(ans.trim().toLowerCase() === 'y');
    });
  });
}

function startAgent(agent, index) {
  return new Promise((resolve, reject) => {
    console.log(`\n[${index + 1}/6] 🚀 启动 ${agent.name}`);
    console.log(`    ${agent.description}`);

    // 准备任务描述
    let task;
    if (agent.task) {
      task = agent.task;
    } else if (agent.taskFile && existsSync(join(ROOT, agent.taskFile))) {
      task = readFileSync(join(ROOT, agent.taskFile), 'utf-8');
    } else {
      task = `执行 ${agent.name} 的职责: ${agent.description}`;
    }

    // 稍作错开启动时间
    setTimeout(() => {
      const cmd = process.platform === 'win32' ? 'openclaw.cmd' : 'openclaw';
      const child = spawn(cmd, [
        'sessions', 'spawn',
        '--task', task,
        '--mode', 'session',
        '--timeout', '14400',
        '--label', `agent:${agent.id}`,
        '--thinking', 'medium',
        '--model', 'openrouter/auto'
      ], {
        stdio: 'pipe',
        detached: true
      });

      child.unref();

      let output = '';
      child.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        process.stdout.write(`[${agent.id}] ${text}`);
      });

      child.stderr.on('data', (data) => {
        const text = data.toString();
        output += text;
        process.stderr.write(`[${agent.id} ERROR] ${text}`);
      });

      child.on('error', (err) => {
        console.error(`[${agent.id}] ❌ 启动失败: ${err.message}`);
        resolve(null);
      });

      child.on('exit', (code) => {
        if (code === 0) {
          // 尝试从输出提取 sessionId
          const match = output.match(/sessionId\s*[=:]\s*([a-zA-Z0-9_-]+)/i);
          const sessionId = match ? match[1] : null;

          if (sessionId) {
            console.log(`[${agent.id}] ✅ 已启动: sessionId=${sessionId}`);
            resolve({ agentId: agent.id, name: agent.name, sessionId });
          } else {
            console.log(`[${agent.id}] ⚠️ 启动完成，但未获取到 sessionId`);
            resolve({ agentId: agent.id, name: agent.name, sessionId: null });
          }
        } else {
          console.error(`[${agent.id}] ❌ 进程退出: code=${code}`);
          resolve(null);
        }
      });

      // 30秒超时
      setTimeout(() => {
        if (!output.includes('session_created') && !output.includes('sessionId')) {
          console.warn(`[${agent.id}] ⏰ 启动超时，继续执行`);
          resolve({ agentId: agent.id, name: agent.name, sessionId: `timeout-${Date.now()}` });
        }
      }, 30000);
    }, index * 5000); // 每个 Agent 错开 5 秒
  });
}

async function main() {
  console.log('🚀 TaskFlow AI 多 Agent 协同开发启动器\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log('即将启动以下 Agent 团队:');
  console.log('═══════════════════════════════════════════════════════\n');

  AGENTS.forEach((agent, idx) => {
    console.log(`${idx + 1}. ${agent.name}`);
    console.log(`   ${agent.description}`);
    console.log('');
  });

  console.log('═══════════════════════════════════════════════════════');
  console.log('协作策略: 所有 Agent 并行启动 (间隔 5 秒)');
  console.log('预期时长: 4-6 小时');
  console.log('═══════════════════════════════════════════════════════\n');

  const confirmed = await confirm();
  if (!confirmed) {
    console.log('❌ 取消启动');
    process.exit(0);
  }

  console.log('\n📋 开始启动 Agent 团队...\n');

  // 并行启动所有 Agents
  const promises = AGENTS.map((agent, idx) => startAgent(agent, idx));
  const results = await Promise.all(promises);

  const sessions = results.filter(r => r !== null);

  // 保存会话信息
  const sessionInfo = {
    startedAt: new Date().toISOString(),
    totalAgents: sessions.length,
    agents: sessions.map(s => ({
      id: s.agentId,
      name: s.name,
      sessionId: s.sessionId
    })),
    commands: {
      list: 'openclaw sessions list',
      monitor: `openclaw sessions list --activeMinutes 5`,
      send: 'openclaw sessions send <sessionId> "progress?"',
      history: 'openclaw sessions history <sessionId> --limit 50',
      kill: 'openclaw sessions kill <sessionId>'
    }
  };

  writeFileSync(
    join(ROOT, '.agent-sessions.json'),
    JSON.stringify(sessionInfo, null, 2)
  );

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅ 多 Agent 协同开发已启动！');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('📊 Agent 状态:');
  sessions.forEach(s => {
    console.log(`  ${s.name} (${s.sessionId}) - 运行中`);
  });

  console.log('\n📝 常用命令:');
  console.log('  查看所有会话:  openclaw sessions list');
  console.log('  检查进度:      openclaw sessions send <id> "progress?"');
  console.log('  查看输出:      openclaw sessions history <id> --limit 50');
  console.log('  停止 Agent:    openclaw sessions kill <id>');
  console.log('\n📄 会话信息已保存到: .agent-sessions.json\n');
  console.log('💡 提示: Agents 将在后台运行，您可以随时查看进度或停止它们\n');

  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ 启动失败:', err);
  process.exit(1);
});
