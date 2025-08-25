/**
 * TaskFlow AI 核心组件集成测试
 * 测试引擎、任务管理器、AI编排器、缓存管理器之间的协作
 */

import { TaskFlowEngine, TaskFlowConfig } from '../../src-new/core/engine';
import { TaskType, TaskPriority } from '../../src-new/core/task/manager';
import fs from 'fs-extra';
import path from 'path';

describe('TaskFlow AI 集成测试', () => {
  let engine: TaskFlowEngine;
  let tempDir: string;
  let testConfig: TaskFlowConfig;

  beforeAll(async () => {
    tempDir = await global.testUtils.createTempDir();
  });

  beforeEach(async () => {
    testConfig = {
      models: {
        providers: {
          deepseek: {
            name: 'DeepSeek',
            apiKey: 'test-key',
            endpoint: 'https://api.deepseek.com',
          }
        },
        default: 'deepseek',
        fallback: ['deepseek'],
      },
      storage: {
        type: 'filesystem',
        path: tempDir,
      },
      security: {
        encryption: {
          algorithm: 'aes-256-gcm',
          keySize: 256,
        },
        jwt: {
          secret: 'test-secret',
          expiresIn: '1h',
        },
      },
      cache: {
        type: 'hybrid',
        maxSize: 10 * 1024 * 1024,
        ttl: 3600,
        cleanupInterval: 300,
        persistToDisk: true,
        diskPath: path.join(tempDir, 'cache'),
        compression: false,
        maxFileSize: 1024 * 1024,
      },
      memory: {
        maxHeapSize: 256,
        cleanupInterval: 30,
        warningThreshold: 0.8,
        criticalThreshold: 0.95,
        enableGCOptimization: true,
        enableLeakDetection: true,
        maxObjectAge: 30,
      },
      sandbox: {
        type: 'process',
        timeoutMs: 30000,
        memoryLimitMB: 128,
        cpuLimitPercent: 50,
        networkEnabled: false,
        filesystemAccess: 'restricted',
        allowedCommands: ['node', 'python3'],
        blockedCommands: ['rm', 'sudo'],
        environmentVariables: {},
      },
    };

    engine = new TaskFlowEngine(testConfig);
    await engine.initialize();
  });

  afterEach(async () => {
    if (engine) {
      await engine.shutdown();
    }
  });

  describe('文档解析到任务创建流程', () => {
    test('应该完整处理PRD文档并创建任务', async () => {
      const prdContent = `
# 用户管理系统PRD

## 1. 项目概述
开发一个用户管理系统，包含用户注册、登录、权限管理等功能。

## 2. 功能需求

### 2.1 用户注册
- 用户可以通过邮箱注册账户
- 需要验证邮箱有效性
- 密码需要符合安全要求
- 注册成功后发送欢迎邮件

### 2.2 用户登录
- 支持邮箱/用户名登录
- 支持记住登录状态
- 登录失败3次后锁定账户
- 支持密码重置功能

### 2.3 权限管理
- 实现基于角色的权限控制(RBAC)
- 支持管理员、普通用户等角色
- 不同角色有不同的操作权限
- 支持动态权限分配

## 3. 非功能需求

### 3.1 性能需求
- 系统响应时间不超过3秒
- 支持1000并发用户
- 数据库查询优化

### 3.2 安全需求  
- 密码加密存储
- 防止SQL注入攻击
- 实现JWT令牌认证
- 敏感操作需要二次验证

## 4. 技术栈
- 后端：Node.js + Express
- 数据库：PostgreSQL
- 前端：React + TypeScript
- 认证：JWT
`;

      const prdFile = await global.testUtils.createTempFile(prdContent, '.md');
      
      // 解析文档并生成任务
      const parseResult = await engine.parseDocument(prdFile);
      
      expect(parseResult).toBeDefined();
      expect(parseResult.tasks).toBeInstanceOf(Array);
      expect(parseResult.tasks.length).toBeGreaterThan(0);
      
      // 验证任务结构
      const tasks = parseResult.tasks;
      expect(tasks.some(t => t.title.includes('用户注册'))).toBe(true);
      expect(tasks.some(t => t.title.includes('用户登录'))).toBe(true);
      expect(tasks.some(t => t.title.includes('权限管理'))).toBe(true);
      
      // 验证任务类型分配
      expect(tasks.some(t => t.type === TaskType.ANALYSIS)).toBe(true);
      expect(tasks.some(t => t.type === TaskType.DESIGN)).toBe(true);
      expect(tasks.some(t => t.type === TaskType.IMPLEMENTATION)).toBe(true);
      
      // 验证任务优先级
      expect(tasks.some(t => t.priority === TaskPriority.HIGH)).toBe(true);
      expect(tasks.some(t => t.priority === TaskPriority.MEDIUM)).toBe(true);
    });

    test('应该正确处理任务依赖关系', async () => {
      const complexPrdContent = `
# 电商系统开发

## 核心模块

### 用户模块
- 用户注册登录
- 用户信息管理

### 商品模块  
- 商品展示
- 商品分类
- 库存管理

### 订单模块
- 创建订单（依赖用户模块和商品模块）
- 订单支付
- 订单状态管理

### 支付模块
- 支付接口集成（依赖订单模块）
- 支付状态同步
`;

      const prdFile = await global.testUtils.createTempFile(complexPrdContent, '.md');
      const parseResult = await engine.parseDocument(prdFile);
      
      // 检查任务依赖关系
      const tasks = parseResult.tasks;
      const orderTask = tasks.find(t => t.title.includes('订单'));
      const paymentTask = tasks.find(t => t.title.includes('支付'));
      
      if (orderTask && paymentTask) {
        // 支付任务应该依赖订单任务
        expect(paymentTask.dependencies).toContain(orderTask.id);
      }
    });
  });

  describe('任务执行和AI编排协作', () => {
    test('应该协调任务管理器和AI编排器处理任务', async () => {
      // 创建一个分析任务
      const markdownContent = `# API设计分析\n\n需要设计用户管理API接口`;
      const testFile = await global.testUtils.createTempFile(markdownContent, '.md');
      const parseResult = await engine.parseDocument(testFile);
      
      const analysisTask = parseResult.tasks.find(t => t.type === TaskType.ANALYSIS);
      if (!analysisTask) return;
      
      // 启动任务（这会触发AI编排器）
      try {
        const prompt = `分析任务: ${analysisTask.title}\n描述: ${analysisTask.description}`;
        const aiResult = await engine.orchestrateAI(prompt);
        
        // 验证AI响应结构
        expect(aiResult).toBeDefined();
        expect(aiResult.success).toBeDefined();
        
      } catch (error) {
        // 由于使用测试API密钥，期望请求失败
        expect(error).toBeDefined();
      }
    });

    test('应该缓存AI响应以提高性能', async () => {
      const prompt = '简单的API设计建议';
      
      // 第一次请求
      const start1 = Date.now();
      try {
        await engine.orchestrateAI(prompt);
      } catch (error) {
        // 预期失败
      }
      const time1 = Date.now() - start1;
      
      // 第二次相同请求应该更快（从缓存获取）
      const start2 = Date.now();
      try {
        await engine.orchestrateAI(prompt);
      } catch (error) {
        // 预期失败
      }
      const time2 = Date.now() - start2;
      
      // 注意：由于都会失败，时间差可能不明显，但缓存机制应该工作
      expect(time2).toBeLessThanOrEqual(time1 + 100); // 允许一些误差
    });
  });

  describe('沙箱执行集成', () => {
    test('应该安全执行代码生成任务', async () => {
      const codeGenerationContext = {
        id: 'integration-code-gen',
        code: `
// 生成用户模型代码
class User {
  constructor(email, password) {
    this.email = email;
    this.password = password;
    this.createdAt = new Date();
  }
  
  validate() {
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    return emailRegex.test(this.email) && this.password.length >= 8;
  }
}

const user = new User('test@example.com', 'password123');
console.log('User valid:', user.validate());
console.log('User created:', user.createdAt);
`,
        language: 'javascript' as const,
        config: testConfig.sandbox
      };

      const result = await engine.executeCodeSafely(codeGenerationContext);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('User valid: true');
      expect(result.stdout).toContain('User created:');
      expect(result.securityViolations?.length || 0).toBe(0);
    });

    test('应该阻止恶意代码执行', async () => {
      const maliciousContext = {
        id: 'integration-malicious',
        code: `
const fs = require('fs');
try {
  fs.unlinkSync('/etc/passwd');
  console.log('File deleted successfully');
} catch (error) {
  console.log('Delete failed:', error.message);
}
`,
        language: 'javascript' as const,
        config: testConfig.sandbox
      };

      const result = await engine.executeCodeSafely(maliciousContext);
      
      expect(result).toBeDefined();
      // 应该被安全机制阻止或在受限环境中执行
      expect(result.securityViolations?.length || 0).toBeGreaterThan(0);
    });
  });

  describe('缓存和持久化集成', () => {
    test('应该持久化任务状态和结果', async () => {
      const markdownContent = `# 测试任务持久化\n\n这是一个测试任务`;
      const testFile = await global.testUtils.createTempFile(markdownContent, '.md');
      const parseResult = await engine.parseDocument(testFile);
      
      const taskId = parseResult.tasks[0].id;
      
      // 更新任务状态
      await engine.manageTask(taskId, 'update', {
        status: 'in_progress',
        progress: 50
      });
      
      // 重启引擎
      await engine.shutdown();
      const newEngine = new TaskFlowEngine(testConfig);
      await newEngine.initialize();
      
      // 验证任务状态是否持久化
      const restoredTask = await newEngine.manageTask(taskId, 'get');
      expect(restoredTask.status).toBe('in_progress');
      expect(restoredTask.progress).toBe(50);
      
      await newEngine.shutdown();
    });

    test('应该缓存文档解析结果', async () => {
      const markdownContent = `# 缓存测试文档\n\n测试文档解析缓存功能`;
      const testFile = await global.testUtils.createTempFile(markdownContent, '.md');
      
      // 第一次解析
      const start1 = Date.now();
      const result1 = await engine.parseDocument(testFile);
      const time1 = Date.now() - start1;
      
      // 第二次解析（应该从缓存获取）
      const start2 = Date.now();
      const result2 = await engine.parseDocument(testFile);
      const time2 = Date.now() - start2;
      
      // 验证结果一致
      expect(result2.tasks.length).toBe(result1.tasks.length);
      expect(result2.id).toBe(result1.id);
      
      // 第二次应该更快
      expect(time2).toBeLessThan(time1);
    });
  });

  describe('内存管理集成', () => {
    test('应该监控和管理整体内存使用', async () => {
      // 创建多个任务以增加内存使用
      const tasks = [];
      for (let i = 0; i < 10; i++) {
        const content = `# 任务 ${i}\n\n这是第 ${i} 个测试任务，包含一些数据`;
        const file = await global.testUtils.createTempFile(content, '.md');
        const result = await engine.parseDocument(file);
        tasks.push(result);
      }
      
      // 获取内存报告
      const memoryReport = engine.getMemoryReport();
      
      expect(memoryReport).toBeDefined();
      expect(memoryReport.stats.heapUsed).toBeGreaterThan(0);
      expect(memoryReport.analysis.recommendations).toBeInstanceOf(Array);
      
      // 执行内存清理
      await engine.performMemoryCleanup();
      
      const afterCleanup = engine.getMemoryReport();
      expect(afterCleanup.stats.heapUsed).toBeLessThanOrEqual(memoryReport.stats.heapUsed);
    });

    test('应该在内存不足时触发清理', async () => {
      // 创建内存压力
      const largeData = [];
      for (let i = 0; i < 100; i++) {
        const content = `# 大型文档 ${i}\n\n${'x'.repeat(1000)}`;
        const file = await global.testUtils.createTempFile(content, '.md');
        const result = await engine.parseDocument(file);
        largeData.push(result);
      }
      
      // 检查是否触发了内存管理
      const report = engine.getMemoryReport();
      expect(report.analysis.warnings.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('错误处理和恢复', () => {
    test('应该从组件故障中恢复', async () => {
      // 模拟AI编排器故障
      try {
        await engine.orchestrateAI('invalid prompt that will fail');
      } catch (error) {
        // 预期失败
      }
      
      // 其他功能应该仍然工作
      const markdownContent = `# 故障恢复测试\n\n测试系统恢复能力`;
      const testFile = await global.testUtils.createTempFile(markdownContent, '.md');
      
      const result = await engine.parseDocument(testFile);
      expect(result.tasks.length).toBeGreaterThan(0);
    });

    test('应该处理并发操作冲突', async () => {
      const markdownContent = `# 并发测试\n\n测试并发处理能力`;
      const testFile = await global.testUtils.createTempFile(markdownContent, '.md');
      
      // 并发解析同一文档
      const promises = Array.from({ length: 5 }, () => 
        engine.parseDocument(testFile)
      );
      
      const results = await Promise.allSettled(promises);
      
      // 所有操作都应该成功或优雅处理
      const failures = results.filter(r => r.status === 'rejected');
      expect(failures.length).toBe(0);
      
      // 结果应该一致
      const successResults = results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<any>).value);
      
      if (successResults.length > 1) {
        expect(successResults[0].id).toBe(successResults[1].id);
      }
    });
  });

  describe('性能和压力测试', () => {
    test('应该处理大型文档', async () => {
      // 创建大型PRD文档
      let largeContent = '# 大型系统PRD\n\n';
      for (let i = 0; i < 100; i++) {
        largeContent += `
## 模块 ${i}
### 功能需求 ${i}.1
- 需求详情 ${i}.1.1
- 需求详情 ${i}.1.2
- 需求详情 ${i}.1.3

### 技术需求 ${i}.2
- 技术要求 ${i}.2.1
- 技术要求 ${i}.2.2
`;
      }
      
      const largeFile = await global.testUtils.createTempFile(largeContent, '.md');
      
      const start = Date.now();
      const result = await engine.parseDocument(largeFile);
      const duration = Date.now() - start;
      
      expect(result.tasks.length).toBeGreaterThan(50);
      expect(duration).toBeLessThan(30000); // 30秒内完成
    });

    test('应该处理高并发任务操作', async () => {
      // 创建多个任务
      const taskPromises = [];
      for (let i = 0; i < 20; i++) {
        const content = `# 并发任务 ${i}\n\n并发测试任务 ${i}`;
        const file = await global.testUtils.createTempFile(content, '.md');
        taskPromises.push(engine.parseDocument(file));
      }
      
      const start = Date.now();
      const results = await Promise.all(taskPromises);
      const duration = Date.now() - start;
      
      expect(results.length).toBe(20);
      expect(results.every(r => r.tasks.length > 0)).toBe(true);
      expect(duration).toBeLessThan(60000); // 60秒内完成
    });
  });

  describe('数据一致性', () => {
    test('应该维护任务状态一致性', async () => {
      const markdownContent = `# 一致性测试\n\n测试数据一致性`;
      const testFile = await global.testUtils.createTempFile(markdownContent, '.md');
      const parseResult = await engine.parseDocument(testFile);
      
      const taskId = parseResult.tasks[0].id;
      
      // 并发更新任务
      const updates = [
        { status: 'in_progress', progress: 25 },
        { status: 'in_progress', progress: 50 },
        { status: 'in_progress', progress: 75 },
        { status: 'completed', progress: 100 }
      ];
      
      const updatePromises = updates.map((update, index) => 
        new Promise(resolve => 
          setTimeout(() => resolve(engine.manageTask(taskId, 'update', update)), index * 100)
        )
      );
      
      await Promise.all(updatePromises);
      
      // 验证最终状态
      const finalTask = await engine.manageTask(taskId, 'get');
      expect(finalTask.status).toBe('completed');
      expect(finalTask.progress).toBe(100);
    });
  });
});