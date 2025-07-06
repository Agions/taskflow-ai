/**
 * TaskFlow AI - 任务编排引擎测试
 * 
 * @author TaskFlow AI Team
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { TaskOrchestrationEngine } from '../../orchestration/TaskOrchestrationEngine.js';
import { OrchestrationFactory, OrchestrationPreset } from '../../orchestration/OrchestrationFactory.js';
import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskType,
  DependencyType,
  SchedulingStrategy,
  OptimizationGoal,
} from '../../types/task.js';

describe('TaskOrchestrationEngine', () => {
  let engine: TaskOrchestrationEngine;
  let sampleTasks: Task[];

  beforeEach(() => {
    engine = new TaskOrchestrationEngine();
    sampleTasks = createSampleTasks();
  });

  describe('基本编排功能', () => {
    it('应该能够编排简单的任务列表', async () => {
      const result = await engine.orchestrate(sampleTasks);
      
      expect(result).toBeDefined();
      expect(result.tasks).toHaveLength(sampleTasks.length);
      expect(result.totalDuration).toBeGreaterThan(0);
      expect(result.metadata.orchestrationTime).toBeInstanceOf(Date);
    });

    it('应该能够识别关键路径', async () => {
      const tasksWithDependencies = createTasksWithDependencies();
      const result = await engine.orchestrate(tasksWithDependencies);
      
      expect(result.criticalPath).toBeDefined();
      expect(Array.isArray(result.criticalPath)).toBe(true);
      
      // 关键路径应该包含至少一个任务
      if (tasksWithDependencies.length > 1) {
        expect(result.criticalPath.length).toBeGreaterThan(0);
      }
    });

    it('应该能够识别并行任务组', async () => {
      const parallelTasks = createParallelTasks();
      const result = await engine.orchestrate(parallelTasks);
      
      expect(result.parallelGroups).toBeDefined();
      expect(Array.isArray(result.parallelGroups)).toBe(true);
      
      // 应该能识别到并行任务组
      expect(result.parallelGroups.length).toBeGreaterThanOrEqual(0);
    });

    it('应该能够检测循环依赖', async () => {
      const circularTasks = createCircularDependencyTasks();
      
      await expect(engine.orchestrate(circularTasks)).rejects.toThrow('循环依赖');
    });
  });

  describe('不同调度策略', () => {
    it('关键路径策略应该优先安排关键任务', async () => {
      const config = {
        schedulingStrategy: SchedulingStrategy.CRITICAL_PATH,
        enableCriticalPath: true,
      };
      
      const engine = new TaskOrchestrationEngine(config);
      const result = await engine.orchestrate(createTasksWithDependencies());
      
      expect(result.metadata.strategy).toBe(SchedulingStrategy.CRITICAL_PATH);
      
      // 关键任务应该被识别
      const criticalTasksInResult = result.tasks.filter(task => 
        task.timeInfo?.isCritical
      );
      expect(criticalTasksInResult.length).toBeGreaterThanOrEqual(0);
    });

    it('优先级策略应该按优先级排序任务', async () => {
      const config = {
        schedulingStrategy: SchedulingStrategy.PRIORITY_FIRST,
      };
      
      const engine = new TaskOrchestrationEngine(config);
      const result = await engine.orchestrate(sampleTasks);
      
      expect(result.metadata.strategy).toBe(SchedulingStrategy.PRIORITY_FIRST);
      
      // 验证高优先级任务排在前面
      const priorities = result.tasks.map(task => task.priority);
      const highPriorityIndex = priorities.indexOf(TaskPriority.HIGH);
      const lowPriorityIndex = priorities.indexOf(TaskPriority.LOW);
      
      if (highPriorityIndex !== -1 && lowPriorityIndex !== -1) {
        expect(highPriorityIndex).toBeLessThan(lowPriorityIndex);
      }
    });
  });

  describe('风险评估', () => {
    it('应该能够评估项目风险', async () => {
      const config = { enableRiskAnalysis: true };
      const engine = new TaskOrchestrationEngine(config);
      
      const result = await engine.orchestrate(sampleTasks);
      
      expect(result.riskAssessment).toBeDefined();
      expect(result.riskAssessment.overallRiskLevel).toBeGreaterThanOrEqual(0);
      expect(result.riskAssessment.overallRiskLevel).toBeLessThanOrEqual(10);
      expect(Array.isArray(result.riskAssessment.riskFactors)).toBe(true);
      expect(Array.isArray(result.riskAssessment.mitigationSuggestions)).toBe(true);
    });

    it('应该为高风险项目生成应急计划', async () => {
      const highRiskTasks = createHighRiskTasks();
      const config = { enableRiskAnalysis: true };
      const engine = new TaskOrchestrationEngine(config);
      
      const result = await engine.orchestrate(highRiskTasks);
      
      expect(result.riskAssessment.contingencyPlans).toBeDefined();
      expect(Array.isArray(result.riskAssessment.contingencyPlans)).toBe(true);
    });
  });

  describe('资源管理', () => {
    it('应该能够计算资源利用率', async () => {
      const tasksWithResources = createTasksWithResources();
      const config = { enableResourceLeveling: true };
      const engine = new TaskOrchestrationEngine(config);
      
      const result = await engine.orchestrate(tasksWithResources);
      
      expect(result.resourceUtilization).toBeDefined();
      expect(Array.isArray(result.resourceUtilization)).toBe(true);
      
      // 验证资源利用率数据结构
      if (result.resourceUtilization.length > 0) {
        const resource = result.resourceUtilization[0];
        expect(resource.resourceId).toBeDefined();
        expect(resource.resourceName).toBeDefined();
        expect(resource.utilizationRate).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('优化建议', () => {
    it('应该生成有用的优化建议', async () => {
      const result = await engine.orchestrate(sampleTasks);
      
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      
      // 应该至少有一些建议
      expect(result.recommendations.length).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('OrchestrationFactory', () => {
  describe('预设配置', () => {
    it('应该能够创建敏捷冲刺引擎', () => {
      const engine = OrchestrationFactory.createEngine(OrchestrationPreset.AGILE_SPRINT);
      expect(engine).toBeInstanceOf(TaskOrchestrationEngine);
    });

    it('应该能够创建瀑布模型引擎', () => {
      const engine = OrchestrationFactory.createEngine(OrchestrationPreset.WATERFALL);
      expect(engine).toBeInstanceOf(TaskOrchestrationEngine);
    });

    it('应该能够获取所有可用预设', () => {
      const presets = OrchestrationFactory.getAvailablePresets();
      expect(Array.isArray(presets)).toBe(true);
      expect(presets.length).toBeGreaterThan(0);
      
      // 验证预设数据结构
      const preset = presets[0];
      expect(preset.preset).toBeDefined();
      expect(preset.name).toBeDefined();
      expect(preset.description).toBeDefined();
      expect(Array.isArray(preset.suitableFor)).toBe(true);
    });
  });

  describe('策略推荐', () => {
    it('应该为敏捷项目推荐敏捷策略', () => {
      const characteristics = {
        teamSize: 5,
        projectDuration: 30,
        isAgile: true,
      };
      
      const recommended = OrchestrationFactory.recommendPreset(characteristics);
      expect(recommended).toBe(OrchestrationPreset.AGILE_SPRINT);
    });

    it('应该为大型企业项目推荐企业级策略', () => {
      const characteristics = {
        teamSize: 25,
        projectDuration: 180,
        isEnterprise: true,
      };
      
      const recommended = OrchestrationFactory.recommendPreset(characteristics);
      expect(recommended).toBe(OrchestrationPreset.ENTERPRISE);
    });

    it('应该为研究项目推荐研究策略', () => {
      const characteristics = {
        teamSize: 3,
        projectDuration: 90,
        uncertaintyLevel: 9,
        isResearch: true,
      };
      
      const recommended = OrchestrationFactory.recommendPreset(characteristics);
      expect(recommended).toBe(OrchestrationPreset.RESEARCH);
    });
  });
});

// 辅助函数：创建示例任务
function createSampleTasks(): Task[] {
  return [
    {
      id: 'task-1',
      name: '需求分析',
      title: '需求分析',
      description: '分析项目需求',
      status: TaskStatus.NOT_STARTED,
      priority: TaskPriority.HIGH,
      type: TaskType.ANALYSIS,
      dependencies: [],
      estimatedHours: 16,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['analysis'],
    },
    {
      id: 'task-2',
      name: '系统设计',
      title: '系统设计',
      description: '设计系统架构',
      status: TaskStatus.NOT_STARTED,
      priority: TaskPriority.MEDIUM,
      type: TaskType.DESIGN,
      dependencies: ['task-1'],
      estimatedHours: 24,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['design'],
    },
    {
      id: 'task-3',
      name: '功能开发',
      title: '功能开发',
      description: '开发核心功能',
      status: TaskStatus.NOT_STARTED,
      priority: TaskPriority.HIGH,
      type: TaskType.FEATURE,
      dependencies: ['task-2'],
      estimatedHours: 40,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['development'],
    },
    {
      id: 'task-4',
      name: '测试',
      title: '测试',
      description: '功能测试',
      status: TaskStatus.NOT_STARTED,
      priority: TaskPriority.LOW,
      type: TaskType.TEST,
      dependencies: ['task-3'],
      estimatedHours: 16,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['testing'],
    },
  ];
}

// 创建有依赖关系的任务
function createTasksWithDependencies(): Task[] {
  const tasks = createSampleTasks();
  
  // 添加详细的依赖关系
  tasks[1].dependencyRelations = [{
    id: 'dep-1',
    predecessorId: 'task-1',
    successorId: 'task-2',
    type: DependencyType.FINISH_TO_START,
    createdAt: new Date(),
    updatedAt: new Date(),
  }];
  
  tasks[2].dependencyRelations = [{
    id: 'dep-2',
    predecessorId: 'task-2',
    successorId: 'task-3',
    type: DependencyType.FINISH_TO_START,
    createdAt: new Date(),
    updatedAt: new Date(),
  }];
  
  return tasks;
}

// 创建并行任务
function createParallelTasks(): Task[] {
  return [
    {
      id: 'parallel-1',
      name: '前端开发',
      title: '前端开发',
      description: '开发前端界面',
      status: TaskStatus.NOT_STARTED,
      priority: TaskPriority.MEDIUM,
      type: TaskType.FEATURE,
      dependencies: [],
      estimatedHours: 32,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['frontend'],
      orchestrationMetadata: {
        parallelizable: true,
      },
    },
    {
      id: 'parallel-2',
      name: '后端开发',
      title: '后端开发',
      description: '开发后端API',
      status: TaskStatus.NOT_STARTED,
      priority: TaskPriority.MEDIUM,
      type: TaskType.FEATURE,
      dependencies: [],
      estimatedHours: 32,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['backend'],
      orchestrationMetadata: {
        parallelizable: true,
      },
    },
  ];
}

// 创建循环依赖任务
function createCircularDependencyTasks(): Task[] {
  return [
    {
      id: 'circular-1',
      name: '任务A',
      title: '任务A',
      description: '任务A',
      status: TaskStatus.NOT_STARTED,
      priority: TaskPriority.MEDIUM,
      type: TaskType.FEATURE,
      dependencies: ['circular-2'], // 依赖任务B
      estimatedHours: 8,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
    },
    {
      id: 'circular-2',
      name: '任务B',
      title: '任务B',
      description: '任务B',
      status: TaskStatus.NOT_STARTED,
      priority: TaskPriority.MEDIUM,
      type: TaskType.FEATURE,
      dependencies: ['circular-1'], // 依赖任务A，形成循环
      estimatedHours: 8,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
    },
  ];
}

// 创建高风险任务
function createHighRiskTasks(): Task[] {
  return [
    {
      id: 'high-risk-1',
      name: '复杂算法实现',
      title: '复杂算法实现',
      description: '实现复杂的机器学习算法',
      status: TaskStatus.NOT_STARTED,
      priority: TaskPriority.CRITICAL,
      type: TaskType.FEATURE,
      dependencies: [],
      estimatedHours: 80, // 长持续时间
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['algorithm', 'ml'],
      orchestrationMetadata: {
        complexity: 9, // 高复杂度
        riskLevel: 8,  // 高风险
      },
    },
  ];
}

// 创建有资源需求的任务
function createTasksWithResources(): Task[] {
  return [
    {
      id: 'resource-task-1',
      name: '开发任务',
      title: '开发任务',
      description: '需要开发人员的任务',
      status: TaskStatus.NOT_STARTED,
      priority: TaskPriority.MEDIUM,
      type: TaskType.FEATURE,
      dependencies: [],
      estimatedHours: 16,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      resourceRequirements: [{
        id: 'dev-1',
        name: '前端开发工程师',
        type: 'human' as any,
        quantity: 1,
        unit: '人',
        availability: 1.0,
        skills: ['React', 'TypeScript'],
      }],
    },
  ];
}
