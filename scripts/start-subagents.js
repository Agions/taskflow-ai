#!/usr/bin/env node

/**
 * TaskFlow AI 子代理协同开发启动器
 * 
 * 使用 OpenClaw sub-agent 功能并行处理优化任务
 */

import { sessions_spawn } from 'openclaw';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

/**
 * 子代理任务定义
 */
const SUBAGENT_TASKS = [
  {
    id: 'log-unifier',
    name: '日志统一专家',
    description: '将核心模块的 console 调用替换为 Logger',
    task: `请统一日志系统，完成以下工作：

## 任务清单

1. 处理以下目录中的 console 调用 (转换为 logger.info/warn/error):
   - src/core/
   - src/mcp/
   - src/agent/
   - src/knowledge/
   - src/utils/
   - src/marketplace/ (部分)

2. 排除以下目录 (保留面向用户的 console):
   - src/cli/ui/
   - src/cli/commands/

3. 对每个文件:
   - 添加 import: import { getLogger } from '../../utils/logger';
   - 添加 const logger = getLogger('模块名');
   - 替换 console.log → logger.info
   - 替换 console.warn → logger.warn
   - 替换 console.error → logger.error

4. 确保:
   - 不破坏现有功能
   - 运行测试验证
   - 提交更改

## 预期结果
- 核心模块 console 调用从 569 减少到 ~0
- 保持 CLI 用户体验不变

请开始工作并定期汇报进度。`,
    model: 'openrouter/auto',
    timeout: 7200 // 2 小时
  },
  {
    id: 'type-safety',
    name: '类型安全专家',
    description: '替换 :any 类型为具体类型定义',
    task: `请减少 any 类型使用，提升类型安全性:

## 任务清单

1. 分析以下文件的 :any 使用:
   - src/marketplace/registry/search.ts
   - src/cli/commands/visualize/*.ts
   - src/cli/commands/agent/*.ts
   - src/cicd/*.ts
   - 其他有 :any 的文件

2. 对每个 :any 实例:
   - 分析上下文推断实际类型
   - 定义接口或类型别名
   - 替换为具体类型
   - 运行类型检查确保无错误

3. 重点关注:
   - API 响应类型
   - 配置对象类型
   - 回调函数参数
   - 工具函数参数

## 目标
- :any 使用从 234 减少到 50 以内
- TypeScript 严格模式保持 100% 通过

请开始工作并记录修改的文件。`,
    model: 'openrouter/auto',
    timeout: 7200
  },
  {
    id: 'test-enhancer',
    name: '测试增强专家',
    description: '增加 E2E 测试，提升覆盖率',
    task: `请完善测试覆盖：

## 任务清单

1. 创建 E2E 测试场景:
   - 完整的 PRD 解析流程
   - 多模型路由测试
   - MCP 工具调用
   - Agent 协作流程
   - 错误处理和恢复

2. 补充集成测试:
   - API 端点测试
   - 数据库操作测试
   - 外部服务集成测试

3. 覆盖率优化:
   - 当前: 86%
   - 目标: 95%+
   - 识别未覆盖代码路径
   - 添加针对性测试

4. 测试文件位置:
   - E2E: tests/e2e/
   - 集成: tests/integration/
   - 单元: 已有 tests/unit/ 和 src/**/__tests__/

## 要求
- 使用 Jest + TypeScript
- 模拟外部依赖
- 提供 fixtures 数据
- 运行 npm test 验证

请开始编写测试。`,
    model: 'openrouter/auto',
    timeout: 3600
  },
  {
    id: 'doc-completer',
    name: '文档完善专家',
    description: '补充 API 文档和示例',
    task: `请完善项目文档：

## 任务清单

1. 检查 API 文档完整性:
   - api/config-manager.md
   - api/prd-parser.md
   - api/task-manager.md
   - api/ai-orchestrator.md
   - 其他 API 模块

2. 补充内容:
   - 缺失的函数/类文档
   - 参数说明
   - 返回值类型
   - 使用示例
   - 错误处理

3. 生成示例:
   - 完整的 workflow 示例
   - 高级功能用例
   - 常见问题解决方案

4. 更新文档:
   - CHANGELOG (v2.1.11)
   - README (如有需要)
   - 快速开始指南

请使用 Markdown 格式，保持与现有文档风格一致。`,
    model: 'openrouter/auto',
    timeout: 1800
  },
  {
    id: 'quality-reviewer',
    name: '质量审查专家',
    description: '最终质量检查和审计',
    task: `请进行全面的质量审查：

## 检查清单

1. 代码质量:
   - 运行 npm run quality
   - 检查 ESLint 错误
   - TypeScript 类型检查
   - Prettier 格式化

2. 安全审计:
   - npm audit
   - 检查硬编码密钥
   - 验证输入验证
   - 审查依赖漏洞

3. 性能检查:
   - 构建大小分析
   - 启动时间测量
   - 内存使用评估
   - 查找性能瓶颈

4. 生成质量报告:
   - 发现的问题列表
   - 改进建议
   - 质量评分 (A-F)

请执行所有检查并生成详细报告。`,
    model: 'openrouter/auto',
    timeout: 1800
  }
];

/**
 * 启动子代理
 */
async function startSubAgent(taskDef) {
  console.log(`🤖 启动子代理: ${taskDef.name} (${taskDef.id})`);
  
  try {
    const session = await sessions_spawn({
      runtime: 'subagent',
      mode: 'session',
      thread: false,
      timeoutSeconds: taskDef.timeout,
      task: taskDef.task,
      label: `subagent:${taskDef.id}`,
      model: taskDef.model,
      thinking: 'high', // 需要深度思考
      attachments: [
        {
          name: 'task-definition.json',
          content: JSON.stringify(taskDef, null, 2),
          mimeType: 'application/json'
        }
      ]
    });
    
    console.log(`  ✅ 启动成功 - Session: ${session.sessionId}`);
    return { ...session, taskDef };
  } catch (error) {
    console.error(`  ❌ 启动失败: ${error.message}`);
    return null;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 TaskFlow AI 子代理协同开发启动器\n');
  console.log('配置的代理团队:');
  
  SUBAGENT_TASKS.forEach((task, idx) => {
    console.log(`  ${idx + 1}. ${task.name} - ${task.description}`);
  });
  
  console.log('\n执行策略:');
  console.log('  - 前2个代理并行 (LogAgent + TypeAgent)');
  console.log('  - 后3个代理顺序执行 (依赖前2个完成)');
  console.log(`\n预计总时长: 4-6 小时`);
  console.log('\n' + '='.repeat(60));
  console.log('按 Ctrl+C 取消所有代理\n');
  
  // 等待确认
  /* @ts-ignore */
  if (process.stdin.isTTY) {
    await new Promise(resolve => {
      process.stdout.write('\n确认启动所有子代理? (y/N): ');
      process.stdin.once('data', (data: Buffer) => {
        resolve(data.toString().trim().toLowerCase() === 'y');
      });
    });
  }
  
  console.log('\n📋 开始启动子代理团队...\n');
  
  const sessions = [];
  
  // 阶段1: 启动前2个并行代理
  console.log('阶段1: 启动并行代理 (LogAgent + TypeAgent)');
  const phase1 = SUBAGENT_TASKS.slice(0, 2);
  
  for (const taskDef of phase1) {
    const session = await startSubAgent(taskDef);
    if (session) {
      sessions.push(session);
    }
    // 错开2秒启动
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\n✅ 阶段1完成: ${sessions.length} 个代理运行中`);
  console.log('\n📊 监控命令:');
  console.log('  - 查看所有会话: openclaw sessions list');
  console.log('  - 查看会话细节: openclaw sessions history <sessionId>');
  console.log('  - 发送消息: openclaw sessions send <sessionId> "status"');
  console.log('  - 终止代理: openclaw sessions kill <sessionId>');
  
  // 保存会话信息
  const sessionInfo = {
    startedAt: new Date().toISOString(),
    strategy: 'parallel-first-two-then-sequential',
    agents: sessions.map(s => ({
      id: s.taskDef.id,
      name: s.taskDef.name,
      sessionId: s.sessionId,
      status: 'running'
    })),
    phase2: SUBAGENT_TASKS.slice(2).map(t => ({ id: t.id, name: t.name, status: 'pending' })),
    commands: {
      list: 'openclaw sessions list',
      status: 'openclaw sessions history <sessionId>',
      message: 'openclaw sessions send <sessionId> "progress?"',
      kill: 'openclaw sessions kill <sessionId>'
    }
  };
  
  const fs = await import('fs');
  fs.writeFileSync(
    join(ROOT, '.subagent-sessions.json'),
    JSON.stringify(sessionInfo, null, 2)
  );
  
  console.log('\n📝 会话信息已保存: .subagent-sessions.json');
  console.log('\n⏳ 代理正在工作中，请稍后... (可以使用 openclaw sessions list 查看)');
}

// 执行
main().catch(error => {
  console.error('\n❌ 启动失败:', error);
  process.exit(1);
});
