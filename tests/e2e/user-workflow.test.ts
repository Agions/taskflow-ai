/**
 * TaskFlow AI 端到端测试
 * 模拟完整的用户工作流程
 */

import { TaskFlowEngine, TaskFlowConfig } from '../../src-new/core/engine';
import { spawn, ChildProcess } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

describe('TaskFlow AI E2E 测试', () => {
  let engine: TaskFlowEngine;
  let tempDir: string;
  let testConfig: TaskFlowConfig;

  beforeAll(async () => {
    tempDir = await global.testUtils.createTempDir();
    
    testConfig = {
      models: {
        providers: { deepseek: { name: 'DeepSeek', apiKey: 'test', endpoint: 'https://api.deepseek.com' } },
        default: 'deepseek', fallback: ['deepseek']
      },
      storage: { type: 'filesystem', path: tempDir },
      security: { encryption: { algorithm: 'aes-256-gcm', keySize: 256 }, jwt: { secret: 'test', expiresIn: '1h' } },
      cache: { type: 'hybrid', maxSize: 10485760, ttl: 3600, cleanupInterval: 300, persistToDisk: true, diskPath: path.join(tempDir, 'cache'), compression: false, maxFileSize: 1048576 },
      memory: { maxHeapSize: 256, cleanupInterval: 30, warningThreshold: 0.8, criticalThreshold: 0.95, enableGCOptimization: true, enableLeakDetection: true, maxObjectAge: 30 },
      sandbox: { type: 'process', timeoutMs: 30000, memoryLimitMB: 128, cpuLimitPercent: 50, networkEnabled: false, filesystemAccess: 'restricted', allowedCommands: ['node'], blockedCommands: ['rm'], environmentVariables: {} }
    };
  });

  beforeEach(async () => {
    engine = new TaskFlowEngine(testConfig);
    await engine.initialize();
  });

  afterEach(async () => {
    if (engine) await engine.shutdown();
  });

  describe('完整PRD处理流程', () => {
    test('应该完成从PRD解析到代码生成的完整流程', async () => {
      const prdContent = `
# 用户管理系统

## 功能需求
### 用户注册
- 邮箱注册验证
- 密码安全要求

### 用户登录  
- 登录状态管理
- 失败锁定机制

## 技术实现
- Node.js + Express
- JWT认证
- PostgreSQL数据库
`;

      const prdFile = await global.testUtils.createTempFile(prdContent, '.md');
      
      // 步骤1: 解析PRD文档
      const parseResult = await engine.parseDocument(prdFile);
      expect(parseResult.tasks.length).toBeGreaterThan(0);
      
      // 步骤2: 选择一个实现任务
      const implTask = parseResult.tasks.find(t => t.type === 'implementation');
      if (!implTask) return;
      
      // 步骤3: 生成实现代码
      const codeContext = {
        id: 'e2e-code-gen',
        code: `
// 用户模型实现
class UserModel {
  constructor() {
    this.users = new Map();
  }
  
  register(email, password) {
    if (this.users.has(email)) {
      throw new Error('用户已存在');
    }
    
    if (password.length < 8) {
      throw new Error('密码长度不足');
    }
    
    this.users.set(email, { email, password, createdAt: new Date() });
    return { success: true, message: '注册成功' };
  }
  
  login(email, password) {
    const user = this.users.get(email);
    if (!user || user.password !== password) {
      throw new Error('登录失败');
    }
    
    return { success: true, user: { email: user.email, createdAt: user.createdAt } };
  }
}

// 测试用户模型
const userModel = new UserModel();
console.log('=== 用户注册测试 ===');
try {
  const result = userModel.register('test@example.com', 'password123');
  console.log('注册结果:', result);
} catch (error) {
  console.log('注册错误:', error.message);
}

console.log('=== 用户登录测试 ===');
try {
  const result = userModel.login('test@example.com', 'password123');
  console.log('登录结果:', result);
} catch (error) {
  console.log('登录错误:', error.message);
}
`,
        language: 'javascript' as const,
        config: testConfig.sandbox
      };
      
      // 步骤4: 安全执行生成的代码
      const execResult = await engine.executeCodeSafely(codeContext);
      
      expect(execResult.success).toBe(true);
      expect(execResult.stdout).toContain('注册结果:');
      expect(execResult.stdout).toContain('登录结果:');
      
      // 步骤5: 更新任务状态为完成
      await engine.manageTask(implTask.id, 'update', {
        status: 'completed',
        progress: 100,
        result: {
          success: true,
          output: execResult.stdout,
          artifacts: [],
          metrics: execResult.resourceUsage || {}
        }
      });
      
      const completedTask = await engine.manageTask(implTask.id, 'get');
      expect(completedTask.status).toBe('completed');
      expect(completedTask.progress).toBe(100);
    });
  });

  describe('错误恢复流程', () => {
    test('应该从执行错误中恢复并继续处理', async () => {
      // 创建包含错误代码的任务
      const errorContext = {
        id: 'e2e-error-recovery',
        code: 'console.log("开始执行"); throw new Error("模拟错误"); console.log("不会执行");',
        language: 'javascript' as const,
        config: testConfig.sandbox
      };
      
      const errorResult = await engine.executeCodeSafely(errorContext);
      expect(errorResult.success).toBe(false);
      
      // 修复后重新执行
      const fixedContext = {
        id: 'e2e-error-fixed',
        code: 'console.log("开始执行"); console.log("修复后正常执行"); return "success";',
        language: 'javascript' as const,
        config: testConfig.sandbox
      };
      
      const fixedResult = await engine.executeCodeSafely(fixedContext);
      expect(fixedResult.success).toBe(true);
      expect(fixedResult.stdout).toContain('修复后正常执行');
    });
  });

  describe('性能基准测试', () => {
    test('应该在合理时间内处理中等规模项目', async () => {
      const mediumPrdContent = Array.from({ length: 20 }, (_, i) => `
## 模块 ${i + 1}
### 功能 ${i + 1}.1
- 需求描述
- 实现要点
### 功能 ${i + 1}.2  
- 技术方案
- 性能要求
`).join('\n');
      
      const fullPrd = `# 中等规模系统PRD\n${mediumPrdContent}`;
      const prdFile = await global.testUtils.createTempFile(fullPrd, '.md');
      
      const start = Date.now();
      const result = await engine.parseDocument(prdFile);
      const duration = Date.now() - start;
      
      expect(result.tasks.length).toBeGreaterThan(10);
      expect(duration).toBeLessThan(15000); // 15秒内完成
      
      const memoryReport = engine.getMemoryReport();
      expect(memoryReport.stats.heapUsed).toBeLessThan(100 * 1024 * 1024); // 小于100MB
    });
  });
});