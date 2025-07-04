#!/usr/bin/env ts-node

/**
 * MCP 服务测试脚本
 * 用于验证 TaskFlow AI MCP 服务的功能
 */

import { Logger } from '../src/infra/logger/logger';
import { TaskFlowCore } from '../src/mcp/taskflow-core';

async function testMCPService() {
  const logger = new Logger();
  const core = new TaskFlowCore(logger);

  console.log('🚀 开始测试 TaskFlow AI MCP 服务...\n');

  try {
    // 1. 初始化服务
    console.log('1. 初始化服务...');
    await core.initialize();
    console.log('✅ 服务初始化成功\n');

    // 2. 测试 PRD 解析
    console.log('2. 测试 PRD 解析...');
    const prdContent = `
# 用户登录功能

## 功能描述
实现用户邮箱和密码登录功能，包含以下特性：

### 核心功能
- 用户邮箱验证
- 密码强度检查
- 登录状态管理
- 记住登录状态

### 技术要求
- 使用 JWT 进行身份验证
- 密码加密存储
- 支持多设备登录
- 登录失败限制

## 验收标准
- 用户可以使用邮箱和密码登录
- 登录后跳转到首页
- 支持记住登录状态
- 密码错误3次后锁定账户
    `;

    const prdResult = await core.parsePRD(prdContent, 'markdown', 'zhipu');
    console.log('✅ PRD 解析成功');
    console.log(`   - 项目标题: ${prdResult.title}`);
    console.log(`   - 生成任务数: ${prdResult.tasks.length}`);
    console.log(`   - 使用模型: ${prdResult.metadata.model}\n`);

    // 3. 测试任务创建
    console.log('3. 测试任务创建...');
    const task = await core.createTask({
      title: '实现用户登录API',
      description: '开发用户登录的后端API接口',
      priority: 'high',
      assignee: '张三'
    });
    console.log('✅ 任务创建成功');
    console.log(`   - 任务ID: ${task.id}`);
    console.log(`   - 任务标题: ${task.title}\n`);

    // 4. 测试任务列表查询
    console.log('4. 测试任务列表查询...');
    const tasks = await core.getTasks({
      status: 'pending',
      priority: 'high'
    });
    console.log('✅ 任务查询成功');
    console.log(`   - 查询到任务数: ${tasks.length}\n`);

    // 5. 测试代码分析
    console.log('5. 测试代码分析...');
    const codeToAnalyze = `
function login(email, password) {
  if (!email || !password) {
    return { error: 'Missing credentials' };
  }
  
  // 这里应该有更好的验证逻辑
  if (email === 'admin@example.com' && password === '123456') {
    return { success: true, token: 'fake-jwt-token' };
  }
  
  return { error: 'Invalid credentials' };
}
    `;

    const analysis = await core.analyzeCode(codeToAnalyze, 'javascript', 'quality');
    console.log('✅ 代码分析成功');
    console.log(`   - 质量评分: ${analysis.quality.score}`);
    console.log(`   - 建议数量: ${analysis.suggestions.length}\n`);

    // 6. 测试 AI 查询
    console.log('6. 测试 AI 查询...');
    const aiResponse = await core.queryAI(
      '请解释什么是 JWT 认证，并给出 Node.js 实现示例',
      {
        model: 'deepseek',
        temperature: 0.7
      }
    );
    console.log('✅ AI 查询成功');
    console.log(`   - 响应长度: ${aiResponse.length} 字符\n`);

    console.log('🎉 所有测试通过！TaskFlow AI MCP 服务运行正常。');

  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  testMCPService().catch(error => {
    console.error('测试脚本执行失败:', error);
    process.exit(1);
  });
}

export { testMCPService };
