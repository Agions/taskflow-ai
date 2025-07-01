/**
 * 性能基准测试
 * 测试核心功能的性能表现
 */

import { performance } from 'perf_hooks';
import * as fs from 'fs-extra';
import * as path from 'path';
import { TaskFlowService } from '../../src/core/engine/taskflow-engine';
import { ConfigManager } from '../../src/infra/config';
import { Logger } from '../../src/infra/logger';

describe('Performance Benchmarks', () => {
  let taskFlowService: TaskFlowService;
  let configManager: ConfigManager;
  let logger: Logger;
  let testDataDir: string;

  beforeAll(async () => {
    // 设置测试环境
    testDataDir = path.join(__dirname, '../fixtures/performance');
    await fs.ensureDir(testDataDir);

    // 初始化服务
    configManager = new ConfigManager('test-performance');
    logger = new Logger(configManager);
    taskFlowService = new TaskFlowService(configManager, logger);

    // 创建测试数据
    await createTestData();
  });

  afterAll(async () => {
    // 清理测试数据
    await fs.remove(testDataDir);
  });

  describe('PRD解析性能', () => {
    test('小型PRD文档解析 (<10KB)', async () => {
      const filePath = path.join(testDataDir, 'small-prd.md');
      
      const startTime = performance.now();
      const result = await taskFlowService.parsePRD(filePath);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(result).toBeDefined();
      expect(result.tasks).toBeDefined();
      expect(duration).toBeLessThan(1000); // 应在1秒内完成
      
      console.log(`小型PRD解析耗时: ${duration.toFixed(2)}ms`);
    });

    test('中型PRD文档解析 (10-50KB)', async () => {
      const filePath = path.join(testDataDir, 'medium-prd.md');
      
      const startTime = performance.now();
      const result = await taskFlowService.parsePRD(filePath);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(result).toBeDefined();
      expect(result.tasks).toBeDefined();
      expect(duration).toBeLessThan(3000); // 应在3秒内完成
      
      console.log(`中型PRD解析耗时: ${duration.toFixed(2)}ms`);
    });

    test('大型PRD文档解析 (50-100KB)', async () => {
      const filePath = path.join(testDataDir, 'large-prd.md');
      
      const startTime = performance.now();
      const result = await taskFlowService.parsePRD(filePath);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(result).toBeDefined();
      expect(result.tasks).toBeDefined();
      expect(duration).toBeLessThan(5000); // 应在5秒内完成
      
      console.log(`大型PRD解析耗时: ${duration.toFixed(2)}ms`);
    });
  });

  describe('任务规划性能', () => {
    test('小规模任务规划 (<20个任务)', async () => {
      const filePath = path.join(testDataDir, 'small-prd.md');
      const parsedResult = await taskFlowService.parsePRD(filePath);
      
      const startTime = performance.now();
      const plan = await taskFlowService.generateTaskPlan(parsedResult);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(plan).toBeDefined();
      expect(plan.tasks).toBeDefined();
      expect(duration).toBeLessThan(2000); // 应在2秒内完成
      
      console.log(`小规模任务规划耗时: ${duration.toFixed(2)}ms`);
    });

    test('中规模任务规划 (20-50个任务)', async () => {
      const filePath = path.join(testDataDir, 'medium-prd.md');
      const parsedResult = await taskFlowService.parsePRD(filePath);
      
      const startTime = performance.now();
      const plan = await taskFlowService.generateTaskPlan(parsedResult);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(plan).toBeDefined();
      expect(plan.tasks).toBeDefined();
      expect(duration).toBeLessThan(5000); // 应在5秒内完成
      
      console.log(`中规模任务规划耗时: ${duration.toFixed(2)}ms`);
    });

    test('大规模任务规划 (50-100个任务)', async () => {
      const filePath = path.join(testDataDir, 'large-prd.md');
      const parsedResult = await taskFlowService.parsePRD(filePath);
      
      const startTime = performance.now();
      const plan = await taskFlowService.generateTaskPlan(parsedResult);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(plan).toBeDefined();
      expect(plan.tasks).toBeDefined();
      expect(duration).toBeLessThan(10000); // 应在10秒内完成
      
      console.log(`大规模任务规划耗时: ${duration.toFixed(2)}ms`);
    });
  });

  describe('内存使用测试', () => {
    test('内存使用应保持在合理范围内', async () => {
      const initialMemory = process.memoryUsage();
      
      // 执行多次操作
      for (let i = 0; i < 10; i++) {
        const filePath = path.join(testDataDir, 'medium-prd.md');
        const parsedResult = await taskFlowService.parsePRD(filePath);
        await taskFlowService.generateTaskPlan(parsedResult);
      }
      
      // 强制垃圾回收
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // 内存增长应小于50MB
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      
      console.log(`内存增长: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('并发性能测试', () => {
    test('并发处理多个PRD文档', async () => {
      const files = [
        path.join(testDataDir, 'small-prd.md'),
        path.join(testDataDir, 'medium-prd.md'),
        path.join(testDataDir, 'large-prd.md'),
      ];
      
      const startTime = performance.now();
      
      const promises = files.map(file => taskFlowService.parsePRD(file));
      const results = await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.tasks).toBeDefined();
      });
      
      // 并发处理应比串行处理更快
      expect(duration).toBeLessThan(8000); // 应在8秒内完成
      
      console.log(`并发处理耗时: ${duration.toFixed(2)}ms`);
    });
  });

  // 辅助函数：创建测试数据
  async function createTestData() {
    // 创建小型PRD文档
    const smallPRD = generatePRDContent('小型项目', 5, 15);
    await fs.writeFile(path.join(testDataDir, 'small-prd.md'), smallPRD);

    // 创建中型PRD文档
    const mediumPRD = generatePRDContent('中型项目', 15, 35);
    await fs.writeFile(path.join(testDataDir, 'medium-prd.md'), mediumPRD);

    // 创建大型PRD文档
    const largePRD = generatePRDContent('大型项目', 35, 80);
    await fs.writeFile(path.join(testDataDir, 'large-prd.md'), largePRD);
  }

  function generatePRDContent(projectName: string, minTasks: number, maxTasks: number): string {
    const taskCount = Math.floor(Math.random() * (maxTasks - minTasks + 1)) + minTasks;
    
    let content = `# ${projectName}产品需求文档\n\n`;
    content += `## 项目概述\n\n这是一个${projectName}的详细需求文档。\n\n`;
    content += `## 功能需求\n\n`;
    
    for (let i = 1; i <= taskCount; i++) {
      content += `### 功能${i}\n\n`;
      content += `- 需求描述：实现功能${i}的核心逻辑\n`;
      content += `- 优先级：${['高', '中', '低'][Math.floor(Math.random() * 3)]}\n`;
      content += `- 预估工时：${Math.floor(Math.random() * 8) + 1}小时\n\n`;
    }
    
    content += `## 技术要求\n\n`;
    content += `- 使用TypeScript开发\n`;
    content += `- 遵循SOLID原则\n`;
    content += `- 编写单元测试\n\n`;
    
    return content;
  }
});
