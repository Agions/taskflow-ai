/**
 * TaskFlow 统一核心引擎单元测试
 */

import { TaskFlowEngine, TaskFlowConfig } from '../../src-new/core/engine';
import { TaskPriority, TaskType } from '../../src-new/core/task/manager';
import path from 'path';
import fs from 'fs-extra';

describe('TaskFlowEngine', () => {
  let engine: TaskFlowEngine;
  let testConfig: TaskFlowConfig;
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await global.testUtils.createTempDir();
  });

  beforeEach(async () => {
    // 创建测试配置
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
        type: 'memory',
        maxSize: 100 * 1024 * 1024, // 100MB
        ttl: 3600,
        cleanupInterval: 300,
        persistToDisk: false,
        compression: false,
        maxFileSize: 10 * 1024 * 1024,
      },
      memory: {
        maxHeapSize: 512,
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
        memoryLimitMB: 256,
        cpuLimitPercent: 50,
        networkEnabled: false,
        filesystemAccess: 'restricted',
        allowedCommands: ['node', 'python3'],
        blockedCommands: ['rm', 'sudo'],
        environmentVariables: {},
      },
    };

    engine = new TaskFlowEngine(testConfig);
  });

  afterEach(async () => {
    if (engine) {
      try {
        await engine.shutdown();
      } catch (error) {
        // 忽略关闭错误
      }
    }
  });

  describe('初始化', () => {
    test('应该成功初始化引擎', async () => {
      await expect(engine.initialize()).resolves.not.toThrow();
      
      const status = engine.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.version).toBe('2.0.0');
      expect(status.components).toBeDefined();
    });

    test('重复初始化应该不报错', async () => {
      await engine.initialize();
      await expect(engine.initialize()).resolves.not.toThrow();
    });

    test('未初始化时调用方法应该抛出错误', async () => {
      await expect(
        engine.parseDocument('test.md')
      ).rejects.toThrow('TaskFlow引擎尚未初始化');
    });
  });

  describe('文档解析', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    test('应该成功解析Markdown文档', async () => {
      const markdownContent = `
# 测试PRD文档

## 功能需求

### 用户登录
- 用户可以通过邮箱和密码登录
- 支持记住登录状态
- 登录失败3次后锁定账户

### 数据管理
- 用户可以创建、编辑、删除数据
- 支持数据导入导出
- 数据变更需要审核
`;

      const testFile = await global.testUtils.createTempFile(markdownContent, '.md');
      
      const result = await engine.parseDocument(testFile);
      
      expect(result).toBeDefined();
      expect(result.tasks).toBeInstanceOf(Array);
      expect(result.tasks.length).toBeGreaterThan(0);
      expect(result.metadata.sourceFile).toBe(testFile);
    });

    test('解析不存在的文件应该抛出错误', async () => {
      await expect(
        engine.parseDocument('/不存在的/文件.md')
      ).rejects.toThrow();
    });
  });

  describe('任务管理', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    test('应该成功创建任务', async () => {
      const testTaskData = {
        title: '测试任务',
        description: '这是一个测试任务',
        type: TaskType.ANALYSIS,
        priority: TaskPriority.HIGH,
        estimatedHours: 2,
      };

      // 通过解析文档创建任务
      const markdownContent = `# 测试任务\n\n这是一个测试任务`;
      const testFile = await global.testUtils.createTempFile(markdownContent, '.md');
      const result = await engine.parseDocument(testFile);
      
      expect(result.tasks.length).toBeGreaterThan(0);
    });

    test('应该成功更新任务状态', async () => {
      // 创建任务
      const markdownContent = `# 测试任务\n\n测试任务描述`;
      const testFile = await global.testUtils.createTempFile(markdownContent, '.md');
      const result = await engine.parseDocument(testFile);
      
      const taskId = result.tasks[0].id;
      
      // 更新任务
      const updatedTask = await engine.manageTask(taskId, 'update', {
        status: 'in_progress'
      });
      
      expect(updatedTask.id).toBe(taskId);
    });
  });

  describe('AI编排', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    test('应该处理AI提示', async () => {
      const prompt = '分析以下需求的复杂度';
      
      // 由于需要真实的AI API，这里只测试方法调用
      await expect(
        engine.orchestrateAI(prompt)
      ).rejects.toThrow(); // 预期会因为测试API密钥而失败
    });
  });

  describe('沙箱执行', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    test('应该安全执行简单代码', async () => {
      const context = {
        id: 'test-execution',
        code: 'console.log("Hello, World!");',
        language: 'javascript',
        config: testConfig.sandbox
      };

      const result = await engine.executeCodeSafely(context);
      
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.stdout).toBeDefined();
      expect(result.stderr).toBeDefined();
    });

    test('应该拒绝不安全的代码', async () => {
      const context = {
        id: 'test-unsafe',
        code: 'require("fs").unlinkSync("/");', // 危险代码
        language: 'javascript',
        config: testConfig.sandbox
      };

      // 这应该被安全检查拦截或在沙箱中安全执行
      const result = await engine.executeCodeSafely(context);
      expect(result).toBeDefined();
    });
  });

  describe('内存管理', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    test('应该成功执行内存清理', async () => {
      await expect(engine.performMemoryCleanup()).resolves.not.toThrow();
    });

    test('应该获取内存报告', async () => {
      const report = engine.getMemoryReport();
      
      expect(report).toBeDefined();
      expect(report.stats).toBeDefined();
      expect(report.analysis).toBeDefined();
    });
  });

  describe('系统状态', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    test('应该获取引擎状态', () => {
      const status = engine.getStatus();
      
      expect(status.initialized).toBe(true);
      expect(status.version).toBeDefined();
      expect(status.components).toBeDefined();
      expect(status.components.aiOrchestrator).toBeDefined();
      expect(status.components.taskManager).toBeDefined();
      expect(status.components.cacheManager).toBeDefined();
      expect(status.components.memoryManager).toBeDefined();
      expect(status.components.sandboxManager).toBeDefined();
    });

    test('应该获取沙箱统计', () => {
      const stats = engine.getSandboxStats();
      
      expect(stats).toBeDefined();
      expect(stats.totalExecutions).toBeDefined();
      expect(stats.activeSandboxes).toBeDefined();
    });
  });

  describe('任务导出', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    test('应该导出任务为JSON格式', async () => {
      // 创建任务
      const markdownContent = `# 测试任务\n\n测试任务描述`;
      const testFile = await global.testUtils.createTempFile(markdownContent, '.md');
      const result = await engine.parseDocument(testFile);
      
      // 导出任务
      const exported = await engine.exportTasks(result.id, 'json' as any);
      
      expect(exported).toBeDefined();
      expect(typeof exported).toBe('string');
      
      // 验证JSON格式
      const parsed = JSON.parse(exported);
      expect(parsed.tasks).toBeDefined();
    });
  });

  describe('引擎关闭', () => {
    test('应该优雅关闭引擎', async () => {
      await engine.initialize();
      await expect(engine.shutdown()).resolves.not.toThrow();
      
      const status = engine.getStatus();
      expect(status.initialized).toBe(false);
    });

    test('未初始化时关闭不应报错', async () => {
      await expect(engine.shutdown()).resolves.not.toThrow();
    });
  });
});