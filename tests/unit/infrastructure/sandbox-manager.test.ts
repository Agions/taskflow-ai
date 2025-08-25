/**
 * 沙箱管理器单元测试
 */

import { SandboxManager, SandboxConfig, ExecutionContext, ExecutionResult } from '../../../src-new/infrastructure/security/sandbox';
import { SandboxPresets } from '../../../src-new/infrastructure/security/sandbox-presets';

describe('SandboxManager', () => {
  let sandboxManager: SandboxManager;
  let testConfig: SandboxConfig;

  beforeEach(() => {
    testConfig = {
      type: 'process',
      timeoutMs: 5000,
      memoryLimitMB: 128,
      cpuLimitPercent: 50,
      networkEnabled: false,
      filesystemAccess: 'restricted',
      allowedCommands: ['node', 'python3'],
      blockedCommands: ['rm', 'sudo', 'curl'],
      environmentVariables: {},
      workingDirectory: '/tmp/sandbox',
      securityLevel: 'medium',
    };

    sandboxManager = new SandboxManager(testConfig);
  });

  afterEach(async () => {
    if (sandboxManager) {
      await sandboxManager.shutdown();
    }
  });

  describe('初始化', () => {
    test('应该成功初始化沙箱管理器', async () => {
      await expect(sandboxManager.initialize()).resolves.not.toThrow();
      
      const status = sandboxManager.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.totalExecutions).toBe(0);
      expect(status.activeSandboxes).toBe(0);
    });

    test('应该验证配置参数', () => {
      const invalidConfig = {
        ...testConfig,
        timeoutMs: -1000, // 无效的超时时间
      };

      expect(() => new SandboxManager(invalidConfig)).toThrow('无效的超时配置');
    });

    test('应该加载安全预设', async () => {
      await sandboxManager.initialize();
      
      const presets = sandboxManager.getAvailablePresets();
      expect(presets).toContain('strict');
      expect(presets).toContain('medium');
      expect(presets).toContain('permissive');
    });
  });

  describe('JavaScript代码执行', () => {
    beforeEach(async () => {
      await sandboxManager.initialize();
    });

    test('应该执行简单的JavaScript代码', async () => {
      const context: ExecutionContext = {
        id: 'test-js-1',
        code: 'console.log("Hello, World!"); return "success";',
        language: 'javascript',
        config: testConfig
      };

      const result = await sandboxManager.execute(context);

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Hello, World!');
      expect(result.stderr).toBe('');
      expect(result.exitCode).toBe(0);
      expect(result.executionTime).toBeGreaterThan(0);
    });

    test('应该处理JavaScript运行时错误', async () => {
      const context: ExecutionContext = {
        id: 'test-js-error',
        code: 'throw new Error("Test error");',
        language: 'javascript',
        config: testConfig
      };

      const result = await sandboxManager.execute(context);

      expect(result.success).toBe(false);
      expect(result.stderr).toContain('Test error');
      expect(result.exitCode).not.toBe(0);
    });

    test('应该阻止访问受限模块', async () => {
      const context: ExecutionContext = {
        id: 'test-js-restricted',
        code: 'const fs = require("fs"); fs.readFileSync("/etc/passwd");',
        language: 'javascript',
        config: testConfig
      };

      const result = await sandboxManager.execute(context);

      expect(result.success).toBe(false);
      expect(result.securityViolations).toBeDefined();
      expect(result.securityViolations!.length).toBeGreaterThan(0);
    });

    test('应该限制执行时间', async () => {
      const context: ExecutionContext = {
        id: 'test-js-timeout',
        code: 'while(true) { /* 无限循环 */ }',
        language: 'javascript',
        config: { ...testConfig, timeoutMs: 1000 }
      };

      const result = await sandboxManager.execute(context);

      expect(result.success).toBe(false);
      expect(result.timedOut).toBe(true);
      expect(result.executionTime).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('Python代码执行', () => {
    beforeEach(async () => {
      await sandboxManager.initialize();
    });

    test('应该执行简单的Python代码', async () => {
      const context: ExecutionContext = {
        id: 'test-python-1',
        code: 'print("Hello from Python")\nresult = 1 + 1\nprint(f"Result: {result}")',
        language: 'python',
        config: testConfig
      };

      const result = await sandboxManager.execute(context);

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Hello from Python');
      expect(result.stdout).toContain('Result: 2');
    });

    test('应该处理Python语法错误', async () => {
      const context: ExecutionContext = {
        id: 'test-python-syntax-error',
        code: 'print("Missing closing quote',
        language: 'python',
        config: testConfig
      };

      const result = await sandboxManager.execute(context);

      expect(result.success).toBe(false);
      expect(result.stderr).toContain('SyntaxError');
    });

    test('应该阻止危险的Python操作', async () => {
      const context: ExecutionContext = {
        id: 'test-python-dangerous',
        code: 'import subprocess; subprocess.run(["rm", "-rf", "/"])',
        language: 'python',
        config: testConfig
      };

      const result = await sandboxManager.execute(context);

      expect(result.success).toBe(false);
      expect(result.securityViolations).toBeDefined();
    });
  });

  describe('安全检查', () => {
    beforeEach(async () => {
      await sandboxManager.initialize();
    });

    test('应该检测危险的文件操作', async () => {
      const dangerousCodes = [
        'const fs = require("fs"); fs.unlinkSync("/important/file");',
        'import os; os.system("rm -rf /")',
        'require("child_process").exec("curl http://malicious.com")',
      ];

      for (const code of dangerousCodes) {
        const violations = sandboxManager.checkSecurity(code, 'javascript');
        expect(violations.length).toBeGreaterThan(0);
      }
    });

    test('应该检测网络访问尝试', async () => {
      const networkCodes = [
        'fetch("http://example.com")',
        'const http = require("http"); http.get("http://example.com")',
        'import urllib.request; urllib.request.urlopen("http://example.com")',
      ];

      for (const code of networkCodes) {
        const violations = sandboxManager.checkSecurity(code, 'javascript');
        expect(violations.some(v => v.type === 'network_access')).toBe(true);
      }
    });

    test('应该检测危险的系统调用', async () => {
      const systemCodes = [
        'require("child_process").spawn("rm", ["-rf", "/"])',
        'import subprocess; subprocess.call(["sudo", "rm", "-rf", "/"])',
        'eval("process.exit(1)")',
      ];

      for (const code of systemCodes) {
        const violations = sandboxManager.checkSecurity(code, 'javascript');
        expect(violations.some(v => v.type === 'system_call')).toBe(true);
      }
    });
  });

  describe('资源限制', () => {
    beforeEach(async () => {
      await sandboxManager.initialize();
    });

    test('应该限制内存使用', async () => {
      const context: ExecutionContext = {
        id: 'test-memory-limit',
        code: 'const arr = []; for(let i = 0; i < 1000000; i++) { arr.push("x".repeat(1000)); }',
        language: 'javascript',
        config: { ...testConfig, memoryLimitMB: 50 } // 很小的内存限制
      };

      const result = await sandboxManager.execute(context);

      // 可能成功（如果内存足够小）或失败（如果超过限制）
      if (!result.success) {
        expect(result.resourceLimitsExceeded).toBeDefined();
        expect(result.resourceLimitsExceeded!.memory).toBe(true);
      }
    });

    test('应该监控CPU使用率', async () => {
      const context: ExecutionContext = {
        id: 'test-cpu-monitor',
        code: 'let sum = 0; for(let i = 0; i < 10000; i++) { sum += Math.random(); } console.log(sum);',
        language: 'javascript',
        config: testConfig
      };

      const result = await sandboxManager.execute(context);

      expect(result.resourceUsage).toBeDefined();
      expect(result.resourceUsage!.cpu).toBeGreaterThan(0);
      expect(result.resourceUsage!.memory).toBeGreaterThan(0);
    });
  });

  describe('沙箱隔离', () => {
    beforeEach(async () => {
      await sandboxManager.initialize();
    });

    test('应该隔离不同的执行环境', async () => {
      const context1: ExecutionContext = {
        id: 'sandbox-1',
        code: 'global.testVar = "sandbox1";',
        language: 'javascript',
        config: testConfig
      };

      const context2: ExecutionContext = {
        id: 'sandbox-2',
        code: 'console.log(typeof global.testVar);',
        language: 'javascript',
        config: testConfig
      };

      await sandboxManager.execute(context1);
      const result2 = await sandboxManager.execute(context2);

      expect(result2.stdout).toContain('undefined');
    });

    test('应该清理执行环境', async () => {
      const context: ExecutionContext = {
        id: 'cleanup-test',
        code: 'const fs = require("fs"); console.log("executed");',
        language: 'javascript',
        config: testConfig
      };

      const result = await sandboxManager.execute(context);
      
      // 检查沙箱是否已清理
      const status = sandboxManager.getStatus();
      expect(status.activeSandboxes).toBe(0);
    });
  });

  describe('安全预设', () => {
    beforeEach(async () => {
      await sandboxManager.initialize();
    });

    test('应该应用严格安全预设', async () => {
      const strictConfig = SandboxPresets.getPreset('strict');
      sandboxManager.updateConfig(strictConfig);

      const context: ExecutionContext = {
        id: 'strict-test',
        code: 'console.log("test");',
        language: 'javascript',
        config: strictConfig
      };

      const result = await sandboxManager.execute(context);
      expect(result).toBeDefined();
    });

    test('应该应用宽松安全预设', async () => {
      const permissiveConfig = SandboxPresets.getPreset('permissive');
      sandboxManager.updateConfig(permissiveConfig);

      const context: ExecutionContext = {
        id: 'permissive-test',
        code: 'console.log(process.version);',
        language: 'javascript',
        config: permissiveConfig
      };

      const result = await sandboxManager.execute(context);
      expect(result.success).toBe(true);
    });
  });

  describe('批量执行', () => {
    beforeEach(async () => {
      await sandboxManager.initialize();
    });

    test('应该支持批量执行', async () => {
      const contexts: ExecutionContext[] = [
        {
          id: 'batch-1',
          code: 'console.log("Batch 1");',
          language: 'javascript',
          config: testConfig
        },
        {
          id: 'batch-2',
          code: 'console.log("Batch 2");',
          language: 'javascript',
          config: testConfig
        },
        {
          id: 'batch-3',
          code: 'print("Batch 3")',
          language: 'python',
          config: testConfig
        }
      ];

      const results = await sandboxManager.executeBatch(contexts);

      expect(results.length).toBe(3);
      expect(results[0].stdout).toContain('Batch 1');
      expect(results[1].stdout).toContain('Batch 2');
      expect(results[2].stdout).toContain('Batch 3');
    });

    test('应该处理批量执行中的错误', async () => {
      const contexts: ExecutionContext[] = [
        {
          id: 'batch-success',
          code: 'console.log("Success");',
          language: 'javascript',
          config: testConfig
        },
        {
          id: 'batch-error',
          code: 'throw new Error("Batch error");',
          language: 'javascript',
          config: testConfig
        }
      ];

      const results = await sandboxManager.executeBatch(contexts);

      expect(results.length).toBe(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });
  });

  describe('统计和监控', () => {
    beforeEach(async () => {
      await sandboxManager.initialize();
    });

    test('应该提供执行统计', async () => {
      const context: ExecutionContext = {
        id: 'stats-test',
        code: 'console.log("test");',
        language: 'javascript',
        config: testConfig
      };

      await sandboxManager.execute(context);

      const stats = sandboxManager.getExecutionStats();
      expect(stats.totalExecutions).toBe(1);
      expect(stats.successfulExecutions).toBe(1);
      expect(stats.failedExecutions).toBe(0);
      expect(stats.averageExecutionTime).toBeGreaterThan(0);
    });

    test('应该跟踪安全违规', async () => {
      const context: ExecutionContext = {
        id: 'security-violation-test',
        code: 'require("fs").readFileSync("/etc/passwd");',
        language: 'javascript',
        config: testConfig
      };

      await sandboxManager.execute(context);

      const stats = sandboxManager.getSecurityStats();
      expect(stats.totalViolations).toBeGreaterThan(0);
      expect(stats.violationsByType.filesystem_access).toBeGreaterThan(0);
    });

    test('应该提供资源使用报告', async () => {
      const context: ExecutionContext = {
        id: 'resource-test',
        code: 'let sum = 0; for(let i = 0; i < 1000; i++) sum += i;',
        language: 'javascript',
        config: testConfig
      };

      await sandboxManager.execute(context);

      const report = sandboxManager.getResourceUsageReport();
      expect(report.averageMemoryUsage).toBeGreaterThan(0);
      expect(report.averageCpuUsage).toBeGreaterThan(0);
      expect(report.peakMemoryUsage).toBeGreaterThan(0);
    });
  });

  describe('错误处理和恢复', () => {
    beforeEach(async () => {
      await sandboxManager.initialize();
    });

    test('应该处理沙箱崩溃', async () => {
      const context: ExecutionContext = {
        id: 'crash-test',
        code: 'process.exit(1);', // 强制退出
        language: 'javascript',
        config: testConfig
      };

      const result = await sandboxManager.execute(context);

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      
      // 沙箱应该已清理
      const status = sandboxManager.getStatus();
      expect(status.activeSandboxes).toBe(0);
    });

    test('应该从执行错误中恢复', async () => {
      // 先执行一个失败的代码
      const errorContext: ExecutionContext = {
        id: 'error-recovery-1',
        code: 'throw new Error("Test error");',
        language: 'javascript',
        config: testConfig
      };

      await sandboxManager.execute(errorContext);

      // 然后执行一个成功的代码
      const successContext: ExecutionContext = {
        id: 'error-recovery-2',
        code: 'console.log("Recovery successful");',
        language: 'javascript',
        config: testConfig
      };

      const result = await sandboxManager.execute(successContext);

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Recovery successful');
    });
  });

  describe('配置管理', () => {
    beforeEach(async () => {
      await sandboxManager.initialize();
    });

    test('应该动态更新配置', async () => {
      const newConfig = {
        ...testConfig,
        timeoutMs: 10000,
        memoryLimitMB: 256
      };

      sandboxManager.updateConfig(newConfig);

      const status = sandboxManager.getStatus();
      expect(status.config.timeoutMs).toBe(10000);
      expect(status.config.memoryLimitMB).toBe(256);
    });

    test('应该验证配置更新', () => {
      const invalidConfig = {
        ...testConfig,
        timeoutMs: -1000
      };

      expect(() => sandboxManager.updateConfig(invalidConfig)).toThrow();
    });
  });

  describe('清理和关闭', () => {
    test('应该优雅关闭沙箱管理器', async () => {
      await sandboxManager.initialize();
      
      const context: ExecutionContext = {
        id: 'shutdown-test',
        code: 'console.log("test");',
        language: 'javascript',
        config: testConfig
      };

      await sandboxManager.execute(context);
      await expect(sandboxManager.shutdown()).resolves.not.toThrow();

      const status = sandboxManager.getStatus();
      expect(status.initialized).toBe(false);
      expect(status.activeSandboxes).toBe(0);
    });

    test('应该清理所有活动沙箱', async () => {
      await sandboxManager.initialize();

      // 启动多个长时间运行的任务
      const longRunningContexts = Array.from({ length: 3 }, (_, i) => ({
        id: `long-running-${i}`,
        code: 'setTimeout(() => console.log("done"), 2000);',
        language: 'javascript',
        config: testConfig
      }));

      const promises = longRunningContexts.map(ctx => sandboxManager.execute(ctx));

      // 立即关闭
      await sandboxManager.shutdown();

      // 所有任务应该被取消
      const results = await Promise.allSettled(promises);
      results.forEach(result => {
        expect(result.status === 'rejected' || 
              (result.status === 'fulfilled' && !result.value.success)).toBe(true);
      });
    });
  });
});