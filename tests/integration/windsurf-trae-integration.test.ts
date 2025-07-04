/**
 * Windsurf和Trae编辑器集成测试
 * 测试新增的编辑器支持和MCP服务集成
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import { EditorConfigGenerator } from '../../src/core/templates/editor-config-generator';
import { TaskFlowMCPServer } from '../../src/mcp/server';
import { MultiModelOrchestrator } from '../../src/core/models/multi-model-orchestrator';
import { TaskManager, TaskStatus, TaskPriority } from '../../src/core/tasks/task-manager';
import { ModelType } from '../../src/types/config';

describe('Windsurf和Trae编辑器集成测试', () => {
  let tempDir: string;
  let editorGenerator: EditorConfigGenerator;
  let mcpServer: TaskFlowMCPServer;
  let taskManager: TaskManager;

  beforeEach(async () => {
    // 创建临时测试目录
    tempDir = path.join(__dirname, 'temp', `test-${Date.now()}`);
    await fs.ensureDir(tempDir);
    
    editorGenerator = new EditorConfigGenerator();
    mcpServer = new TaskFlowMCPServer();
    taskManager = new TaskManager(path.join(tempDir, '.taskflow'));
  });

  afterEach(async () => {
    // 清理临时目录
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
    
    // 清理资源
    taskManager.destroy();
  });

  describe('Windsurf编辑器配置生成', () => {
    test('应该生成完整的Windsurf配置文件', async () => {
      const variables = {
        PROJECT_NAME: 'test-windsurf-project',
        PROJECT_TYPE: 'Web Application',
        PROJECT_DESCRIPTION: 'Test project for Windsurf integration',
        DATE: '2024-01-01',
        VERSION: '1.2.0',
        TYPESCRIPT: true,
        JAVASCRIPT: false,
        REACT: true,
        NODE_API: false,
        JEST: true,
        YAML: true,
        BASH: true,
        PORT: 3000,
        PROJECT_SPECIFIC_NOTES: 'This is a test project for Windsurf editor integration.'
      };

      await editorGenerator.generateWindsurfConfig(tempDir, variables);

      // 验证目录结构
      const windsurfDir = path.join(tempDir, '.windsurf');
      expect(await fs.pathExists(windsurfDir)).toBe(true);

      // 验证配置文件
      const settingsFile = path.join(windsurfDir, 'settings.json');
      expect(await fs.pathExists(settingsFile)).toBe(true);
      
      const mcpFile = path.join(windsurfDir, 'mcp.json');
      expect(await fs.pathExists(mcpFile)).toBe(true);
      
      const aiConfigFile = path.join(windsurfDir, 'ai-config.json');
      expect(await fs.pathExists(aiConfigFile)).toBe(true);

      // 验证配置内容
      const settings = await fs.readJson(settingsFile);
      expect(settings.editor.fontSize).toBe(14);
      expect(settings.ai.enabled).toBe(true);
      expect(settings.ai.provider).toBe('taskflow-ai');
      expect(settings.taskflow.integration.enabled).toBe(true);

      // 验证MCP配置
      const mcpConfig = await fs.readJson(mcpFile);
      expect(mcpConfig.mcpServers['taskflow-ai']).toBeDefined();
      expect(mcpConfig.tools).toHaveLength(5);
      expect(mcpConfig.tools.some((tool: any) => tool.name === 'taskflow_multi_model_orchestration')).toBe(true);

      // 验证AI配置
      const aiConfig = await fs.readJson(aiConfigFile);
      expect(aiConfig.providers.taskflow.enabled).toBe(true);
      expect(aiConfig.orchestration.enabled).toBe(true);
      expect(aiConfig.features.smartTaskBreakdown.enabled).toBe(true);
    });
  });

  describe('Trae编辑器配置生成', () => {
    test('应该生成完整的Trae配置文件', async () => {
      const variables = {
        PROJECT_NAME: 'test-trae-project',
        PROJECT_TYPE: 'API Service',
        PROJECT_DESCRIPTION: 'Test project for Trae integration',
        DATE: '2024-01-01',
        VERSION: '1.2.0',
        TYPESCRIPT: true,
        JAVASCRIPT: false,
        REACT: false,
        NODE_API: true,
        JEST: true,
        YAML: true,
        BASH: true,
        PORT: 8080,
        PROJECT_SPECIFIC_NOTES: 'This is a test project for Trae editor integration.'
      };

      await editorGenerator.generateTraeConfig(tempDir, variables);

      // 验证目录结构
      const traeDir = path.join(tempDir, '.trae');
      expect(await fs.pathExists(traeDir)).toBe(true);

      // 验证配置文件
      const configFile = path.join(traeDir, 'config.json');
      expect(await fs.pathExists(configFile)).toBe(true);
      
      const mcpFile = path.join(traeDir, 'mcp.json');
      expect(await fs.pathExists(mcpFile)).toBe(true);
      
      const workflowsFile = path.join(traeDir, 'workflows.json');
      expect(await fs.pathExists(workflowsFile)).toBe(true);

      // 验证配置内容
      const config = await fs.readJson(configFile);
      expect(config.editor.fontSize).toBe(14);
      expect(config.ai.enabled).toBe(true);
      expect(config.ai.provider).toBe('taskflow-ai');
      expect(config.taskflow.integration.enabled).toBe(true);

      // 验证工作流配置
      const workflows = await fs.readJson(workflowsFile);
      expect(workflows.workflows).toHaveLength(3);
      expect(workflows.workflows.some((wf: any) => wf.name === 'Smart Task Decomposition')).toBe(true);
      expect(workflows.workflows.some((wf: any) => wf.name === 'Multi-Model Code Generation')).toBe(true);
    });
  });

  describe('MCP服务功能测试', () => {
    test('应该正确处理任务解析请求', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'taskflow_parse_prd',
          arguments: {
            content: '# 测试PRD\n\n## 功能需求\n1. 用户登录\n2. 数据展示\n3. 报表生成',
            format: 'markdown',
            options: {
              extractSections: true,
              extractFeatures: true,
              prioritize: true
            }
          }
        }
      };

      const response = await mcpServer.handleRequest(request);
      expect(response.content).toHaveLength(1);
      expect(response.content[0].type).toBe('text');
      expect(response.content[0].text).toContain('PRD解析完成');
    });

    test('应该正确处理任务生成请求', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'taskflow_generate_tasks',
          arguments: {
            requirements: ['实现用户认证', '创建数据仪表板', '生成PDF报告'],
            projectType: 'Web Application',
            complexity: 'medium',
            maxDepth: 3,
            useMultiModel: true
          }
        }
      };

      const response = await mcpServer.handleRequest(request);
      expect(response.content).toHaveLength(1);
      expect(response.content[0].text).toContain('任务生成完成');
      expect(response.content[0].text).toContain('3 个任务');
    });

    test('应该正确处理多模型协作请求', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'taskflow_multi_model_orchestration',
          arguments: {
            task: '设计并实现一个用户管理系统',
            taskType: 'code_generation',
            context: {
              projectType: 'Web Application',
              technologies: ['React', 'Node.js', 'MongoDB'],
              constraints: ['高性能', '安全性'],
              priority: 'high'
            },
            options: {
              useMultipleModels: true,
              qualityCheck: true,
              fallbackEnabled: true,
              parallelProcessing: false
            }
          }
        }
      };

      const response = await mcpServer.handleRequest(request);
      expect(response.content).toHaveLength(1);
      expect(response.content[0].text).toContain('多模型协作完成');
      expect(response.content[0].text).toContain('code_generation');
    });

    test('应该正确处理智能任务分解请求', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'taskflow_smart_task_breakdown',
          arguments: {
            complexTask: '开发一个完整的电商平台，包括用户管理、商品管理、订单处理、支付集成和数据分析功能',
            targetGranularity: 'medium',
            estimateEffort: true,
            generateDependencies: true,
            assignRoles: false
          }
        }
      };

      const response = await mcpServer.handleRequest(request);
      expect(response.content).toHaveLength(1);
      expect(response.content[0].text).toContain('智能任务分解完成');
      expect(response.content[0].text).toContain('子任务数量: 5');
      expect(response.content[0].text).toContain('总估计工时');
    });
  });

  describe('多模型协调器测试', () => {
    test('应该正确处理复杂任务分解', async () => {
      const orchestrator = new MultiModelOrchestrator({
        enabled: true,
        primary: ModelType.QWEN,
        fallback: [ModelType.DEEPSEEK, ModelType.ZHIPU],
        loadBalancing: true,
        costOptimization: true
      });

      const complexTask = {
        description: '开发一个AI驱动的项目管理系统',
        type: 'code_generation' as const,
        context: {
          projectType: 'Web Application',
          technologies: ['React', 'TypeScript', 'Node.js', 'AI/ML'],
          constraints: ['高性能', '可扩展性', '安全性'],
          priority: 'high' as const
        },
        options: {
          useMultipleModels: true,
          qualityCheck: true,
          fallbackEnabled: true,
          parallelProcessing: false
        }
      };

      const result = await orchestrator.processComplexTask(complexTask);
      
      expect(result.subtasks).toHaveLength(4); // 需求分析、核心实现、测试、文档
      expect(result.dependencies.length).toBeGreaterThan(0);
      expect(result.estimatedTime).toBeGreaterThan(0);
      expect(result.recommendedModels.length).toBeGreaterThan(0);
      expect(result.executionPlan.length).toBeGreaterThan(0);
      
      // 验证任务分解的逻辑性
      const analysisTask = result.subtasks.find(t => t.type === 'analysis');
      const coreTask = result.subtasks.find(t => t.type === 'implementation');
      expect(analysisTask).toBeDefined();
      expect(coreTask).toBeDefined();
      expect(coreTask?.dependencies).toContain(analysisTask?.id);
    });
  });

  describe('任务管理器测试', () => {
    test('应该正确管理任务状态和进度', async () => {
      // 创建测试任务
      const task1 = taskManager.createTask({
        title: '设计系统架构',
        description: '设计整体系统架构和技术选型',
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        estimatedHours: 8,
        dependencies: [],
        tags: ['architecture', 'design'],
        metadata: { complexity: 'high' }
      });

      const task2 = taskManager.createTask({
        title: '实现核心功能',
        description: '实现系统核心业务逻辑',
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        estimatedHours: 16,
        dependencies: [task1.id],
        tags: ['implementation', 'core'],
        metadata: { complexity: 'high' }
      });

      // 测试任务状态更新
      const updated = taskManager.updateTaskStatus(task1.id, TaskStatus.IN_PROGRESS, {
        progress: 50,
        notes: '架构设计进行中'
      });
      expect(updated).toBe(true);

      const updatedTask = taskManager.getTask(task1.id);
      expect(updatedTask?.status).toBe(TaskStatus.IN_PROGRESS);
      expect(updatedTask?.progress).toBe(50);
      expect(updatedTask?.startedAt).toBeDefined();

      // 测试依赖关系检查
      const deps = taskManager.checkTaskDependencies(task2.id);
      expect(deps.canStart).toBe(false);
      expect(deps.blockedBy).toContain(task1.id);

      // 完成第一个任务
      taskManager.updateTaskStatus(task1.id, TaskStatus.COMPLETED, { progress: 100 });
      
      // 再次检查依赖关系
      const depsAfter = taskManager.checkTaskDependencies(task2.id);
      expect(depsAfter.canStart).toBe(true);
      expect(depsAfter.blockedBy).toHaveLength(0);

      // 测试统计信息
      const stats = taskManager.getTaskStats();
      expect(stats.total).toBe(2);
      expect(stats.completed).toBe(1);
      expect(stats.pending).toBe(1);
      expect(stats.overallProgress).toBeGreaterThan(0);
    });

    test('应该正确获取可执行任务', async () => {
      // 创建任务链
      const task1 = taskManager.createTask({
        title: '任务1',
        description: '第一个任务',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        estimatedHours: 4,
        dependencies: [],
        tags: [],
        metadata: {}
      });

      const task2 = taskManager.createTask({
        title: '任务2',
        description: '依赖任务1',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        estimatedHours: 4,
        dependencies: [task1.id],
        tags: [],
        metadata: {}
      });

      const task3 = taskManager.createTask({
        title: '任务3',
        description: '独立任务',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        estimatedHours: 4,
        dependencies: [],
        tags: [],
        metadata: {}
      });

      // 获取可执行任务
      const readyTasks = taskManager.getReadyTasks();
      expect(readyTasks).toHaveLength(2); // task1 和 task3
      expect(readyTasks.map(t => t.id)).toContain(task1.id);
      expect(readyTasks.map(t => t.id)).toContain(task3.id);
      expect(readyTasks.map(t => t.id)).not.toContain(task2.id);
    });
  });

  describe('编辑器配置集成测试', () => {
    test('应该支持生成所有编辑器配置', async () => {
      const variables = {
        PROJECT_NAME: 'test-all-editors',
        PROJECT_TYPE: 'Full Stack Application',
        PROJECT_DESCRIPTION: 'Test project for all editor integrations',
        DATE: '2024-01-01',
        VERSION: '1.2.0',
        TYPESCRIPT: true,
        JAVASCRIPT: false,
        REACT: true,
        NODE_API: true,
        JEST: true,
        YAML: true,
        BASH: true,
        PORT: 3000,
        PROJECT_SPECIFIC_NOTES: 'This is a comprehensive test project.'
      };

      // 生成所有编辑器配置
      await editorGenerator.generateAllConfigs(tempDir, variables);

      // 验证所有编辑器目录都已创建
      const expectedDirs = ['.windsurf', '.trae', '.cursor', '.vscode'];
      for (const dir of expectedDirs) {
        const dirPath = path.join(tempDir, dir);
        expect(await fs.pathExists(dirPath)).toBe(true);
      }

      // 验证Windsurf和Trae的MCP配置
      const windsurfMcp = path.join(tempDir, '.windsurf', 'mcp.json');
      const traeMcp = path.join(tempDir, '.trae', 'mcp.json');
      
      expect(await fs.pathExists(windsurfMcp)).toBe(true);
      expect(await fs.pathExists(traeMcp)).toBe(true);

      // 验证MCP配置内容一致性
      const windsurfMcpConfig = await fs.readJson(windsurfMcp);
      const traeMcpConfig = await fs.readJson(traeMcp);
      
      expect(windsurfMcpConfig.mcpServers['taskflow-ai']).toEqual(traeMcpConfig.mcpServers['taskflow-ai']);
      expect(windsurfMcpConfig.tools).toEqual(traeMcpConfig.tools);
    });
  });
});
